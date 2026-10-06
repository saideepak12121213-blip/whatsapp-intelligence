from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Announcement, ImportantLink, Notification, Category
from app.schemas import (
    StudentTaskResponse, StudentStatusUpdate, AnnouncementResponse,
    ImportantLinkResponse, NotificationResponse, StudentDashboardStats,
    CategoryResponse
)
from app.auth import get_current_user
from app.services import (
    get_student_personalized_tasks, set_student_task_status,
    get_student_dashboard_metrics, get_all_categories
)

router = APIRouter(prefix="/api/student", tags=["Student Portal"])

@router.get("/dashboard", response_model=StudentDashboardStats)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns personal dashboard counters for the authenticated student.
    """
    metrics = get_student_dashboard_metrics(db, current_user.id)
    return StudentDashboardStats(**metrics)

@router.get("/tasks", response_model=List[StudentTaskResponse])
def get_tasks(
    filter_type: Optional[str] = Query("all", description="all, pending, completed, upcoming, overdue, important, reminders, due_today, due_this_week"),
    category: Optional[str] = Query(None, description="Category filter e.g. HACKATHON, WORKSHOP, EXAM, ASSIGNMENT"),
    search: Optional[str] = Query(None, description="Search term for title or description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns shared class tasks merged with THIS student's personal completion status.
    Protected by server-side student authorization.
    """
    return get_student_personalized_tasks(
        db=db,
        student_id=current_user.id,
        filter_type=filter_type,
        category=category,
        search=search
    )

@router.put("/tasks/{task_id}/status")
def update_task_status(
    task_id: int,
    payload: StudentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    CRITICAL PERSONALIZATION RULE (Section 6 & 8):
    Updates strictly the status of this task for the CURRENT student.
    Does NOT affect other students or the shared task record.
    Supports: PENDING, COMPLETED, REMIND_LATER
    """
    try:
        updated_record = set_student_task_status(
            db=db,
            student_id=current_user.id,
            task_id=task_id,
            new_status=payload.status,
            remind_at=payload.remind_at,
            student_note=payload.student_note
        )
        return {
            "success": True,
            "message": f"Task marked as {payload.status}",
            "task_id": task_id,
            "student_id": current_user.id,
            "personal_status": updated_record.status,
            "remind_at": updated_record.remind_at,
            "completed_at": updated_record.completed_at
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/categories", response_model=List[CategoryResponse])
def get_student_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all active academic categories for filter dropdowns.
    """
    return get_all_categories(db)

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all approved class announcements.
    """
    return db.query(Announcement).filter(
        Announcement.status == "APPROVED"
    ).order_by(Announcement.created_at.desc()).all()

@router.get("/links", response_model=List[ImportantLinkResponse])
def get_important_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all important class URLs extracted from the chat.
    """
    return db.query(ImportantLink).order_by(ImportantLink.created_at.desc()).all()

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch notifications broadcast to the class or specific to the student.
    """
    return db.query(Notification).filter(
        (Notification.user_id == None) | (Notification.user_id == current_user.id)
    ).order_by(Notification.created_at.desc()).limit(30).all()

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        (Notification.user_id == None) | (Notification.user_id == current_user.id)
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}
