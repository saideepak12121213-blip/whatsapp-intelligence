from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
import json
from app.database import get_db
from app.models import (
    User, ChatUpload, Message, Task, StudentTaskStatus,
    Announcement, ImportantLink, Notification, Category
)
from app.schemas import (
    AdminDashboardStats, TaskResponse, TaskReviewAction, UploadResponse,
    CategoryResponse, CategoryCreate, CategoryUpdate, NotificationResponse, NotificationCreate,
    DeadlineUpdatePayload
)
from app.auth import require_admin
from app.services import (
    process_chat_upload_pipeline, get_admin_dashboard_metrics,
    review_task_workflow, get_all_categories, create_category,
    update_category, delete_category
)

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"], dependencies=[Depends(require_admin)])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Returns aggregate stats for the administrator / operator dashboard.
    """
    return get_admin_dashboard_metrics(db)

@router.post("/upload-chat")
async def upload_whatsapp_chat(
    file: UploadFile = File(...),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Uploads a WhatsApp .txt export and executes the incremental ingestion and AI intelligence pipeline.
    """
    if not file.filename.endswith(".txt"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a WhatsApp exported .txt file."
        )

    file_bytes = await file.read()
    if not file_bytes or len(file_bytes.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded chat file is empty."
        )

    try:
        upload_record, stats = process_chat_upload_pipeline(
            db=db,
            file_bytes=file_bytes,
            file_name=file.filename,
            uploader_id=current_admin.id,
            allow_duplicate_file=True,
            default_status="PENDING_REVIEW"
        )

        return {
            "success": True,
            "message": stats["message"],
            "upload_id": upload_record.upload_id,
            "file_name": upload_record.file_name,
            "messages_found": stats["total_messages"],
            "already_processed": stats["existing_messages"],
            "skipped_messages": stats["existing_messages"],
            "new_messages": stats["new_messages"],
            "tasks_detected": stats["tasks_detected"],
            "announcements_detected": stats["announcements_detected"],
            "duplicates_removed": stats["duplicates_removed"],
            "links_found": stats["links_found"],
            "items_extracted": stats["items_extracted"],
            "processing_status": upload_record.processing_status
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process chat: {str(e)}")

@router.get("/tasks")
def get_all_tasks(
    status_filter: Optional[str] = Query(None, description="PENDING_REVIEW, APPROVED, REJECTED, or null for all"),
    category: Optional[str] = Query(None, description="Filter by category"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Fetch all tasks with student completion breakdowns for administrative oversight and review.
    """
    query = db.query(Task)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Task.status == status_filter.upper())
    if category and category.lower() != "all":
        query = query.filter(Task.category == category.upper())

    tasks = query.order_by(Task.created_at.desc()).all()
    total_students = db.query(User).filter(User.role == "STUDENT").count()

    results = []
    for t in tasks:
        completed_count = db.query(StudentTaskStatus).filter(
            StudentTaskStatus.task_id == t.task_id,
            StudentTaskStatus.status == "COMPLETED"
        ).count()

        remind_count = db.query(StudentTaskStatus).filter(
            StudentTaskStatus.task_id == t.task_id,
            StudentTaskStatus.status == "REMIND_LATER"
        ).count()

        completion_pct = round((completed_count / total_students * 100), 1) if total_students > 0 else 0.0

        results.append({
            "task_id": t.task_id,
            "title": t.title,
            "description": t.description,
            "category": t.category,
            "priority": t.priority,
            "deadline": t.deadline,
            "deadline_original_text": t.deadline_original_text,
            "deadline_confidence": t.deadline_confidence,
            "start_date": t.start_date,
            "end_date": t.end_date,
            "time": t.time,
            "location": t.location,
            "registration_link": t.registration_link,
            "submission_instructions": t.submission_instructions,
            "is_mandatory_notification": bool(t.is_mandatory_notification),
            "notification_message": t.notification_message,
            "status": t.status,
            "confidence": t.confidence,
            "source_sender": t.source_sender,
            "source_timestamp": t.source_timestamp,
            "source_text": t.source_text,
            "additional_source_count": t.additional_source_count,
            "source_history": json.loads(t.source_history) if t.source_history else [],
            "completed_by_count": completed_count,
            "remind_by_count": remind_count,
            "total_students": total_students,
            "completion_percentage": completion_pct,
            "created_at": t.created_at,
            "updated_at": t.updated_at
        })

    return results

@router.put("/tasks/{task_id}/review")
def review_task(
    task_id: int,
    action_data: TaskReviewAction,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Review, approve, reject, or edit an extracted task before or after publication.
    """
    try:
        updated_task = review_task_workflow(
            db=db,
            task_id=task_id,
            action=action_data.action,
            data=action_data.dict()
        )
        return {
            "success": True,
            "message": f"Task {action_data.action}d successfully.",
            "task_id": updated_task.task_id,
            "status": updated_task.status
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tasks/{task_id}/deadline")
def update_task_deadline(
    task_id: int,
    payload: DeadlineUpdatePayload,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Section 9: Explicit endpoint to modify/extend timeline.
    Automatically reactivates task and broadcasts deadline notification to students.
    """
    try:
        data = {
            "deadline": payload.deadline,
            "deadline_original_text": payload.deadline_original_text or "Extended timeline",
            "notification_message": payload.notification_message
        }
        updated_task = review_task_workflow(db, task_id, "update", data)
        return {
            "success": True,
            "message": f"Deadline updated to {updated_task.deadline_original_text}",
            "task_id": updated_task.task_id,
            "deadline": updated_task.deadline,
            "deadline_original_text": updated_task.deadline_original_text
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

@router.post("/tasks/{task_id}/mandatory-notify")
def send_mandatory_task_notification(
    task_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Section 11: Marks a post with MANDATORY notification and immediately broadcasts to students.
    """
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.is_mandatory_notification = True
    msg_text = task.notification_message or f"MANDATORY REQUIREMENT: {task.title}. Deadline: {task.deadline_original_text or 'TBD'}."

    notif = Notification(
        task_id=task.task_id,
        title=f"[MANDATORY] {task.title}",
        message=msg_text,
        type="MANDATORY",
        is_mandatory=True
    )
    db.add(notif)
    db.commit()

    return {"success": True, "message": "Mandatory notification broadcast to all students."}

@router.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Permanently remove a task and its associated student statuses.
    """
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"success": True, "message": "Task deleted successfully"}

# --- CATEGORY MANAGEMENT (Section 13) ---
@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return get_all_categories(db)

@router.post("/categories", response_model=CategoryResponse)
def add_category(
    payload: CategoryCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        return create_category(db, payload)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.put("/categories/{category_id}", response_model=CategoryResponse)
def edit_category(
    category_id: int,
    payload: CategoryUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        return update_category(db, category_id, payload)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.delete("/categories/{category_id}")
def remove_category(
    category_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        delete_category(db, category_id)
        return {"success": True, "message": "Category deleted successfully"}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

# --- NOTIFICATIONS MANAGEMENT (Section 10 & 11) ---
@router.get("/notifications", response_model=List[NotificationResponse])
def get_admin_notifications(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()

@router.post("/notifications", response_model=NotificationResponse)
def broadcast_notification(
    payload: NotificationCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    notif = Notification(
        user_id=payload.user_id,
        task_id=payload.task_id,
        title=payload.title,
        message=payload.message,
        type=payload.type,
        is_mandatory=payload.is_mandatory
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.get("/students")
def get_students_overview(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List registered students and their individual completion progress.
    """
    students = db.query(User).filter(User.role == "STUDENT").all()
    total_approved_tasks = db.query(Task).filter(Task.is_active == True, Task.status == "APPROVED").count()

    results = []
    for s in students:
        completed = db.query(StudentTaskStatus).filter(
            StudentTaskStatus.student_id == s.id,
            StudentTaskStatus.status == "COMPLETED"
        ).count()

        reminders = db.query(StudentTaskStatus).filter(
            StudentTaskStatus.student_id == s.id,
            StudentTaskStatus.status == "REMIND_LATER"
        ).count()

        pending = total_approved_tasks - completed
        if pending < 0:
            pending = 0

        rate = round((completed / total_approved_tasks * 100), 1) if total_approved_tasks > 0 else 0.0

        results.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "student_id": s.student_id,
            "completed_tasks": completed,
            "remind_tasks": reminders,
            "pending_tasks": pending,
            "total_tasks": total_approved_tasks,
            "completion_rate": rate,
            "joined_at": s.created_at
        })

    return results

@router.get("/uploads")
def get_upload_history(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Audit log of all uploaded chats (Section 14).
    """
    uploads = db.query(ChatUpload).order_by(ChatUpload.uploaded_at.desc()).all()
    return [
        {
            "upload_id": u.upload_id,
            "file_name": u.file_name,
            "uploaded_at": u.uploaded_at,
            "file_hash": u.file_hash[:12] + "...",
            "message_count": u.message_count,
            "new_message_count": u.new_message_count,
            "skipped_message_count": u.skipped_message_count or (u.message_count - u.new_message_count if u.message_count else 0),
            "items_extracted": u.items_extracted or 0,
            "items_approved": u.items_approved or 0,
            "items_rejected": u.items_rejected or 0,
            "processing_status": u.processing_status,
            "processing_completed_at": u.processing_completed_at,
            "error_message": u.error_message
        }
        for u in uploads
    ]

@router.delete("/uploads/{upload_id}")
def delete_upload_data(
    upload_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Privacy compliance: Purges uploaded raw chat file and all parsed message records.
    """
    upload = db.query(ChatUpload).filter(ChatUpload.upload_id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload record not found")

    db.delete(upload)
    db.commit()
    return {"success": True, "message": f"Upload #{upload_id} and raw messages permanently deleted for privacy."}
