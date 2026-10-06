import hashlib
import datetime
import json
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    User, ChatUpload, Message, Task, StudentTaskStatus,
    Announcement, ImportantLink, Notification, Category
)
from app.parser import (
    parse_whatsapp_chat, compute_file_hash, ParsedMessage
)
from app.ai_extractor import (
    extract_information_from_messages, ExtractedItem, normalize_title
)
from app.schemas import StudentTaskResponse, CategoryCreate, CategoryUpdate

def process_chat_upload_pipeline(
    db: Session,
    file_bytes: bytes,
    file_name: str,
    uploader_id: int,
    allow_duplicate_file: bool = True,
    default_status: str = "PENDING_REVIEW"
) -> Tuple[ChatUpload, Dict[str, Any]]:
    """
    Incremental WhatsApp Chat Upload, Deduplication, and Structured AI Pipeline:
    1. Parse WhatsApp messages (handling dates, emojis, multiline, senders).
    2. Incremental deduplication: calculate stable message_hash for each message;
       skip messages that are already in the database.
    3. Process ONLY new messages through AI extraction.
    4. Store new items in PENDING_REVIEW status for Admin Review before publishing.
    5. Deduplicate and merge updates/reminders on existing tasks.
    """
    file_hash = compute_file_hash(file_bytes)

    # Decode file text
    try:
        text_content = file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            text_content = file_bytes.decode('utf-8-sig')
        except UnicodeDecodeError:
            text_content = file_bytes.decode('latin-1')

    # 1. Parse messages
    parsed_msgs: List[ParsedMessage] = parse_whatsapp_chat(text_content)
    total_msg_count = len(parsed_msgs)

    # Check exact duplicate file upload check if allow_duplicate_file is False
    existing_upload = db.query(ChatUpload).filter(
        ChatUpload.file_hash == file_hash,
        ChatUpload.processing_status == "COMPLETED"
    ).first()
    if existing_upload and not allow_duplicate_file:
        raise ValueError("This chat export has already been processed.")

    # Create new upload record in audit history
    upload_record = ChatUpload(
        file_name=file_name,
        uploaded_by=uploader_id,
        file_hash=file_hash,
        message_count=total_msg_count,
        processing_status="PROCESSING",
        processing_started_at=datetime.datetime.utcnow()
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    try:
        # 2. Incremental update: detect existing messages by stable message_hash
        existing_hashes = set(
            h[0] for h in db.query(Message.message_hash).all()
        )

        new_db_messages: List[Message] = []
        skipped_count = 0

        for p in parsed_msgs:
            if p.message_hash in existing_hashes:
                skipped_count += 1
            else:
                msg_obj = Message(
                    upload_id=upload_record.upload_id,
                    timestamp=p.timestamp,
                    timestamp_text=p.timestamp_text,
                    sender=p.sender,
                    text=p.text,
                    message_hash=p.message_hash,
                    is_processed=False
                )
                db.add(msg_obj)
                new_db_messages.append(msg_obj)
                existing_hashes.add(p.message_hash)

        db.commit()
        for m in new_db_messages:
            db.refresh(m)

        upload_record.new_message_count = len(new_db_messages)
        upload_record.skipped_message_count = skipped_count

        stats = {
            "total_messages": total_msg_count,
            "existing_messages": skipped_count,
            "new_messages": len(new_db_messages),
            "tasks_detected": 0,
            "announcements_detected": 0,
            "duplicates_removed": 0,
            "links_found": 0,
            "items_extracted": 0,
            "message": f"Upload processed successfully. {skipped_count} existing messages skipped. {len(new_db_messages)} new messages processed. 0 new relevant items detected."
        }

        # If no new messages, we are done incrementally!
        if not new_db_messages:
            upload_record.processing_status = "COMPLETED"
            upload_record.processing_completed_at = datetime.datetime.utcnow()
            db.commit()
            return upload_record, stats

        # 3. Run Structured AI Extraction ONLY on new messages
        extracted_items: List[ExtractedItem] = extract_information_from_messages(new_db_messages)

        # Existing active tasks for duplicate checking & deadline updates
        existing_tasks = db.query(Task).filter(Task.is_active == True).all()

        tasks_detected = 0
        announcements_detected = 0
        duplicates_removed = 0
        links_found = 0

        for item in extracted_items:
            if item.item_type == "TASK":
                norm_new = normalize_title(item.title)
                matched_task: Optional[Task] = None

                for et in existing_tasks:
                    norm_existing = normalize_title(et.title)
                    if norm_new == norm_existing or (len(norm_new) > 4 and norm_new in norm_existing) or (len(norm_existing) > 4 and norm_existing in norm_new):
                        matched_task = et
                        break

                if matched_task:
                    # Duplicate or deadline update detected
                    duplicates_removed += 1
                    if item.is_deadline_update and item.deadline:
                        old_dl_str = matched_task.deadline_original_text or "previous deadline"
                        matched_task.deadline = item.deadline
                        matched_task.deadline_original_text = item.deadline_original
                        matched_task.deadline_confidence = item.deadline_confidence
                        matched_task.priority = item.priority
                        matched_task.is_active = True  # Extended deadline reactivates item

                        history = json.loads(matched_task.source_history) if matched_task.source_history else []
                        history.append({
                            "type": "DEADLINE_UPDATE",
                            "sender": item.source_sender,
                            "timestamp": item.source_timestamp,
                            "text": item.source_text,
                            "updated_at": datetime.datetime.utcnow().isoformat()
                        })
                        matched_task.source_history = json.dumps(history)

                        # Broadcast notification if task was approved
                        if matched_task.status == "APPROVED":
                            notif = Notification(
                                task_id=matched_task.task_id,
                                title=f"Deadline Changed: {matched_task.title}",
                                message=f"{matched_task.title} deadline changed to {item.deadline_original} (was {old_dl_str}).",
                                type="DEADLINE"
                            )
                            db.add(notif)
                    else:
                        # Merged reminder occurrence
                        matched_task.additional_source_count += 1
                        history = json.loads(matched_task.source_history) if matched_task.source_history else []
                        history.append({
                            "type": "REMINDER",
                            "sender": item.source_sender,
                            "timestamp": item.source_timestamp,
                            "text": item.source_text,
                            "recorded_at": datetime.datetime.utcnow().isoformat()
                        })
                        matched_task.source_history = json.dumps(history)
                else:
                    # New distinct class task -> initially PENDING_REVIEW (Section 5)
                    new_task = Task(
                        title=item.title,
                        description=item.description,
                        category=item.category,
                        priority=item.priority,
                        deadline=item.deadline,
                        deadline_original_text=item.deadline_original,
                        deadline_confidence=item.deadline_confidence,
                        start_date=item.start_date,
                        end_date=item.end_date,
                        time=item.time,
                        location=item.location,
                        registration_link=item.registration_link,
                        submission_instructions=item.submission_instructions,
                        confidence=item.confidence,
                        status=default_status,  # PENDING_REVIEW: Admin must review before students see it!
                        source_message_id=item.source_message_id,
                        source_sender=item.source_sender,
                        source_timestamp=item.source_timestamp,
                        source_text=item.source_text,
                        additional_source_count=0,
                        source_history=json.dumps([{
                            "type": "INITIAL_CREATION",
                            "sender": item.source_sender,
                            "timestamp": item.source_timestamp,
                            "text": item.source_text
                        }]),
                        created_by=uploader_id,
                        is_active=True
                    )
                    db.add(new_task)
                    existing_tasks.append(new_task)
                    tasks_detected += 1

                    # If immediately approved (e.g. testing flag), create notification
                    if default_status == "APPROVED":
                        db.add(Notification(
                            task_id=new_task.task_id,
                            title=f"New Task: {item.title}",
                            message=f"{item.description[:100]} | Due: {item.deadline_original or 'TBD'}",
                            type="TASK"
                        ))

            elif item.item_type == "ANNOUNCEMENT":
                announcement = Announcement(
                    title=item.title,
                    content=item.description,
                    category=item.category,
                    priority=item.priority,
                    status=default_status,
                    confidence=item.confidence,
                    source_message_id=item.source_message_id,
                    source_sender=item.source_sender,
                    source_timestamp=item.source_timestamp,
                    source_text=item.source_text
                )
                db.add(announcement)
                announcements_detected += 1

                if default_status == "APPROVED":
                    db.add(Notification(
                        title=f"Announcement: {item.title}",
                        message=item.description[:120],
                        type="ANNOUNCEMENT"
                    ))

            elif item.item_type == "LINK" and item.url:
                exists = db.query(ImportantLink).filter(ImportantLink.url == item.url).first()
                if not exists:
                    link = ImportantLink(
                        url=item.url,
                        title=item.title,
                        category=item.category,
                        sender=item.source_sender,
                        timestamp=item.source_timestamp,
                        source_message_id=item.source_message_id
                    )
                    db.add(link)
                    links_found += 1

        for m in new_db_messages:
            m.is_processed = True

        total_items_detected = tasks_detected + announcements_detected
        upload_record.items_extracted = total_items_detected
        upload_record.processing_status = "COMPLETED"
        upload_record.processing_completed_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(upload_record)

        stats["tasks_detected"] = tasks_detected
        stats["announcements_detected"] = announcements_detected
        stats["duplicates_removed"] = duplicates_removed
        stats["links_found"] = links_found
        stats["items_extracted"] = total_items_detected
        stats["message"] = (
            f"Upload processed successfully. "
            f"{skipped_count} existing messages skipped. "
            f"{len(new_db_messages)} new messages processed. "
            f"{total_items_detected} new relevant items detected."
        )

        return upload_record, stats

    except Exception as e:
        db.rollback()
        upload_record.processing_status = "FAILED"
        upload_record.error_message = str(e)
        upload_record.processing_completed_at = datetime.datetime.utcnow()
        db.commit()
        raise e


def get_student_personalized_tasks(
    db: Session,
    student_id: int,
    filter_type: Optional[str] = "all",
    category: Optional[str] = None,
    search: Optional[str] = None
) -> List[StudentTaskResponse]:
    """
    CRITICAL ARCHITECTURAL FUNCTION (Section 6 & 7):
    Fetches SHARED tasks while querying strictly the authenticated student's personal status.
    Student A completing or snoozing a task NEVER affects Student B or Student C.
    Only returns official APPROVED tasks to students.
    """
    now = datetime.datetime.utcnow()

    # Query strictly approved and active shared class tasks
    query = db.query(Task).filter(
        Task.is_active == True,
        Task.status == "APPROVED"
    )

    if category and category.lower() != "all":
        query = query.filter(Task.category == category.upper())

    tasks = query.order_by(
        Task.deadline.asc().nullslast(),
        Task.created_at.desc()
    ).all()

    # Query strictly THIS student's personal status records
    statuses = {
        s.task_id: s for s in db.query(StudentTaskStatus).filter(
            StudentTaskStatus.student_id == student_id
        ).all()
    }

    result: List[StudentTaskResponse] = []
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)
    week_end = today_start + datetime.timedelta(days=7)

    for task in tasks:
        user_status_record = statuses.get(task.task_id)
        personal_status = user_status_record.status if user_status_record else "PENDING"
        remind_at = user_status_record.remind_at if user_status_record else None
        completed_at = user_status_record.completed_at if user_status_record else None
        student_note = user_status_record.student_note if user_status_record else None

        # Personal overdue calculation: passed deadline and not completed by this student
        is_overdue = bool(task.deadline and task.deadline < now and personal_status != "COMPLETED")

        # Search filter
        if search:
            q = search.lower()
            match_title = q in task.title.lower()
            match_desc = task.description and q in task.description.lower()
            match_cat = q in task.category.lower()
            match_loc = task.location and q in task.location.lower()
            match_orig = task.deadline_original_text and q in task.deadline_original_text.lower()
            if not (match_title or match_desc or match_cat or match_loc or match_orig):
                continue

        # Tab / view filters
        if filter_type == "pending" and personal_status == "COMPLETED":
            continue
        elif filter_type == "completed" and personal_status != "COMPLETED":
            continue
        elif filter_type == "overdue" and not is_overdue:
            continue
        elif filter_type == "reminders" and personal_status != "REMIND_LATER":
            continue
        elif filter_type == "upcoming":
            if not task.deadline or task.deadline < now or personal_status == "COMPLETED":
                continue
        elif filter_type == "due_today":
            if not task.deadline or not (today_start <= task.deadline <= today_end) or personal_status == "COMPLETED":
                continue
        elif filter_type == "due_this_week":
            if not task.deadline or not (today_start <= task.deadline <= week_end) or personal_status == "COMPLETED":
                continue
        elif filter_type == "important":
            is_imp = task.priority in ["CRITICAL", "HIGH"] or task.is_mandatory_notification
            if not is_imp:
                continue

        resp_item = StudentTaskResponse(
            task_id=task.task_id,
            title=task.title,
            description=task.description,
            category=task.category,
            priority=task.priority,
            deadline=task.deadline,
            deadline_original_text=task.deadline_original_text,
            deadline_confidence=task.deadline_confidence,
            start_date=task.start_date,
            end_date=task.end_date,
            time=task.time,
            location=task.location,
            registration_link=task.registration_link,
            submission_instructions=task.submission_instructions,
            is_mandatory_notification=bool(task.is_mandatory_notification),
            notification_message=task.notification_message,
            confidence=task.confidence,
            status=task.status,
            source_message_id=task.source_message_id,
            source_sender=task.source_sender,
            source_timestamp=task.source_timestamp,
            source_text=task.source_text,
            additional_source_count=task.additional_source_count,
            source_history=task.source_history,
            created_at=task.created_at,
            updated_at=task.updated_at,
            personal_status=personal_status,
            remind_at=remind_at,
            completed_at=completed_at,
            student_note=student_note,
            is_overdue=is_overdue
        )
        result.append(resp_item)

    return result


def set_student_task_status(
    db: Session,
    student_id: int,
    task_id: int,
    new_status: str,
    remind_at: Optional[datetime.datetime] = None,
    student_note: Optional[str] = None
) -> StudentTaskStatus:
    """
    CRITICAL PERSONALIZATION RULE (Section 6 & 8):
    Updates strictly student_task_status for (student_id, task_id).
    Supports: PENDING, COMPLETED, REMIND_LATER.
    NEVER updates the global shared task record!
    """
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise ValueError(f"Task with id {task_id} not found.")

    record = db.query(StudentTaskStatus).filter(
        StudentTaskStatus.student_id == student_id,
        StudentTaskStatus.task_id == task_id
    ).first()

    now = datetime.datetime.utcnow()

    # Determine remind_at if REMIND_LATER requested without explicit datetime
    if new_status == "REMIND_LATER" and not remind_at:
        remind_at = now + datetime.timedelta(hours=2)

    if not record:
        record = StudentTaskStatus(
            student_id=student_id,
            task_id=task_id,
            status=new_status,
            remind_at=remind_at if new_status == "REMIND_LATER" else None,
            completed_at=now if new_status == "COMPLETED" else None,
            student_note=student_note
        )
        db.add(record)
    else:
        record.status = new_status
        if new_status == "COMPLETED":
            record.completed_at = now
            record.remind_at = None
        elif new_status == "REMIND_LATER":
            record.remind_at = remind_at
            record.completed_at = None
        else:
            record.completed_at = None
            record.remind_at = None

        if student_note is not None:
            record.student_note = student_note
        record.updated_at = now

    # If student requested REMIND_LATER, create a personal notification
    if new_status == "REMIND_LATER":
        reminder_notif = Notification(
            user_id=student_id,
            task_id=task.task_id,
            title=f"Reminder Set: {task.title}",
            message=f"Reminder set for {task.title} (due {task.deadline_original_text or 'TBD'}).",
            type="REMINDER"
        )
        db.add(reminder_notif)

    db.commit()
    db.refresh(record)
    return record


def review_task_workflow(
    db: Session,
    task_id: int,
    action: str,
    data: Optional[Dict[str, Any]] = None
) -> Task:
    """
    ADMIN REVIEW WORKFLOW (Section 5, 9, 11):
    Admin approves, rejects, or edits extracted items.
    Only APPROVED tasks become visible to students.
    """
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise ValueError("Task not found.")

    now = datetime.datetime.utcnow()
    data = data or {}

    if action == "approve":
        task.status = "APPROVED"
        task.is_active = True
        task.updated_at = now

        # Update upload audit counts
        if task.source_message_id:
            msg = db.query(Message).filter(Message.message_id == task.source_message_id).first()
            if msg and msg.upload_id:
                upload = db.query(ChatUpload).filter(ChatUpload.upload_id == msg.upload_id).first()
                if upload:
                    upload.items_approved = (upload.items_approved or 0) + 1

        # Broadcast notification to students
        notif = Notification(
            task_id=task.task_id,
            title=f"New {task.category.capitalize()}: {task.title}",
            message=f"{task.title} | {task.description[:100] if task.description else ''} | Due: {task.deadline_original_text or 'TBD'}",
            type="TASK",
            is_mandatory=bool(task.is_mandatory_notification)
        )
        db.add(notif)

    elif action == "reject":
        task.status = "REJECTED"
        task.is_active = False
        task.updated_at = now

        if task.source_message_id:
            msg = db.query(Message).filter(Message.message_id == task.source_message_id).first()
            if msg and msg.upload_id:
                upload = db.query(ChatUpload).filter(ChatUpload.upload_id == msg.upload_id).first()
                if upload:
                    upload.items_rejected = (upload.items_rejected or 0) + 1

    elif action == "update":
        # Check deadline extension
        old_deadline = task.deadline
        old_dl_text = task.deadline_original_text

        for field in [
            "title", "description", "category", "priority", "deadline",
            "deadline_original_text", "start_date", "end_date", "time",
            "location", "registration_link", "submission_instructions"
        ]:
            if field in data and data[field] is not None:
                setattr(task, field, data[field])

        # If mandatory notification was toggled
        if "is_mandatory_notification" in data and data["is_mandatory_notification"] is not None:
            task.is_mandatory_notification = data["is_mandatory_notification"]
        if "notification_message" in data and data["notification_message"] is not None:
            task.notification_message = data["notification_message"]

        # If deadline extended or modified (Section 9)
        new_dl = task.deadline
        new_dl_text = task.deadline_original_text
        if (new_dl != old_deadline or new_dl_text != old_dl_text) and task.status == "APPROVED":
            task.is_active = True  # Automatically becomes active again!

            history = json.loads(task.source_history) if task.source_history else []
            history.append({
                "type": "ADMIN_DEADLINE_EXTENSION",
                "deadline": str(new_dl),
                "deadline_text": new_dl_text,
                "updated_at": now.isoformat()
            })
            task.source_history = json.dumps(history)

            db.add(Notification(
                task_id=task.task_id,
                title=f"Deadline Updated: {task.title}",
                message=f"{task.title} deadline changed to {new_dl_text or 'updated timeline'}.",
                type="DEADLINE"
            ))

        # If mandatory notification enabled (Section 11)
        if task.is_mandatory_notification and task.status == "APPROVED":
            msg_text = task.notification_message or f"Important notice regarding {task.title}. Due: {task.deadline_original_text or 'TBD'}."
            # Check duplicate notification in past 10 minutes
            existing_notif = db.query(Notification).filter(
                Notification.task_id == task.task_id,
                Notification.is_mandatory == True,
                Notification.message == msg_text
            ).first()
            if not existing_notif:
                db.add(Notification(
                    task_id=task.task_id,
                    title=f"[MANDATORY] {task.title}",
                    message=msg_text,
                    type="MANDATORY",
                    is_mandatory=True
                ))

        task.updated_at = now

    db.commit()
    db.refresh(task)
    return task


# --- CATEGORY SERVICES (Section 13) ---
def get_all_categories(db: Session) -> List[Category]:
    return db.query(Category).order_by(Category.display_order.asc(), Category.name.asc()).all()

def create_category(db: Session, payload: CategoryCreate) -> Category:
    existing = db.query(Category).filter(
        (Category.slug == payload.slug) | (Category.name == payload.name)
    ).first()
    if existing:
        raise ValueError(f"Category with name '{payload.name}' or slug '{payload.slug}' already exists.")

    cat = Category(
        name=payload.name,
        slug=payload.slug.upper(),
        description=payload.description,
        display_order=payload.display_order,
        color=payload.color,
        icon=payload.icon,
        is_system=False
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

def update_category(db: Session, cat_id: int, payload: CategoryUpdate) -> Category:
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise ValueError("Category not found.")

    old_slug = cat.slug

    if payload.name:
        cat.name = payload.name
    if payload.slug:
        cat.slug = payload.slug.upper()
    if payload.description is not None:
        cat.description = payload.description
    if payload.display_order is not None:
        cat.display_order = payload.display_order
    if payload.color:
        cat.color = payload.color
    if payload.icon:
        cat.icon = payload.icon

    # If slug changed, update associated tasks
    if payload.slug and payload.slug.upper() != old_slug:
        db.query(Task).filter(Task.category == old_slug).update({"category": payload.slug.upper()})

    db.commit()
    db.refresh(cat)
    return cat

def delete_category(db: Session, cat_id: int) -> bool:
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise ValueError("Category not found.")
    if cat.is_system:
        raise ValueError("System default categories cannot be deleted.")

    # Reassign existing tasks to ASSIGNMENT before deleting
    db.query(Task).filter(Task.category == cat.slug).update({"category": "ASSIGNMENT"})
    db.delete(cat)
    db.commit()
    return True


# --- METRICS & DASHBOARD STATS ---
def get_student_dashboard_metrics(db: Session, student_id: int) -> Dict[str, int]:
    """
    Computes real-time personal metrics for student dashboard.
    """
    tasks = get_student_personalized_tasks(db, student_id, filter_type=None)

    pending_count = sum(1 for t in tasks if t.personal_status == "PENDING")
    completed_count = sum(1 for t in tasks if t.personal_status == "COMPLETED")
    reminders_count = sum(1 for t in tasks if t.personal_status == "REMIND_LATER")
    overdue_count = sum(1 for t in tasks if t.is_overdue)

    now = datetime.datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)
    week_end = today_start + datetime.timedelta(days=7)

    due_today = sum(1 for t in tasks if t.deadline and today_start <= t.deadline <= today_end and t.personal_status != "COMPLETED")
    due_week = sum(1 for t in tasks if t.deadline and today_start <= t.deadline <= week_end and t.personal_status != "COMPLETED")

    urgent_announcements = db.query(Announcement).filter(
        Announcement.priority.in_(["CRITICAL", "HIGH"]),
        Announcement.status == "APPROVED"
    ).count()

    return {
        "pending_count": pending_count,
        "completed_count": completed_count,
        "reminders_count": reminders_count,
        "due_today_count": due_today,
        "due_this_week_count": due_week,
        "overdue_count": overdue_count,
        "total_class_tasks": len(tasks),
        "urgent_announcements_count": urgent_announcements
    }

def get_admin_dashboard_metrics(db: Session) -> Dict[str, Any]:
    """
    Aggregate statistics for the Admin / Operator dashboard.
    """
    total_uploads = db.query(ChatUpload).count()
    total_messages = db.query(Message).count()
    total_tasks = db.query(Task).filter(Task.is_active == True).count()
    pending_review = db.query(Task).filter(Task.status == "PENDING_REVIEW").count()
    approved_tasks = db.query(Task).filter(Task.status == "APPROVED").count()
    rejected_tasks = db.query(Task).filter(Task.status == "REJECTED").count()
    total_announcements = db.query(Announcement).count()
    total_students = db.query(User).filter(User.role == "STUDENT").count()

    total_possible_statuses = total_students * approved_tasks
    if total_possible_statuses > 0:
        completed_records = db.query(StudentTaskStatus).filter(StudentTaskStatus.status == "COMPLETED").count()
        overall_completion_rate = round((completed_records / total_possible_statuses) * 100.0, 1)
    else:
        overall_completion_rate = 0.0

    last_upload = db.query(ChatUpload).order_by(ChatUpload.uploaded_at.desc()).first()

    return {
        "total_uploads": total_uploads,
        "total_messages": total_messages,
        "total_class_tasks": total_tasks,
        "pending_review_tasks": pending_review,
        "approved_tasks": approved_tasks,
        "rejected_tasks": rejected_tasks,
        "total_announcements": total_announcements,
        "total_students": total_students,
        "overall_completion_rate": overall_completion_rate,
        "last_upload_time": last_upload.uploaded_at if last_upload else None
    }
