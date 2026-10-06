import os
import sys
import pytest
import datetime
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base
from app.models import User, Task, StudentTaskStatus, ChatUpload, Message, Notification, Category
from app.auth import get_password_hash, verify_password, create_access_token
from app.parser import parse_whatsapp_chat, compute_file_hash, compute_message_hash, ParsedMessage
from app.ai_extractor import parse_relative_deadline, heuristic_extract_items
from app.services import (
    process_chat_upload_pipeline, get_student_personalized_tasks,
    set_student_task_status, get_student_dashboard_metrics,
    review_task_workflow, get_all_categories, create_category,
    update_category, delete_category
)
from app.schemas import CategoryCreate, CategoryUpdate

# Test in-memory database fixture
@pytest.fixture
def db_session():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Seed users helper
@pytest.fixture
def test_users(db_session):
    admin = User(name="Prof. Alan Vance", email="admin@classflow.demo", password_hash=get_password_hash("admin123"), role="ADMIN")
    student_a = User(name="Alice Johnson", email="studentA@classflow.demo", password_hash=get_password_hash("student123"), role="STUDENT", student_id="STU-A01")
    student_b = User(name="Bob Smith", email="studentB@classflow.demo", password_hash=get_password_hash("student123"), role="STUDENT", student_id="STU-B02")
    student_c = User(name="Charlie Davis", email="studentC@classflow.demo", password_hash=get_password_hash("student123"), role="STUDENT", student_id="STU-C03")
    db_session.add_all([admin, student_a, student_b, student_c])
    db_session.commit()
    for u in [admin, student_a, student_b, student_c]:
        db_session.refresh(u)
    return {"admin": admin, "student_a": student_a, "student_b": student_b, "student_c": student_c}


def test_auth_and_passwords():
    raw = "securepassword123"
    hashed = get_password_hash(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_parser_various_formats():
    chat_sample = """06/10/2026, 09:00 - Messages and calls are end-to-end encrypted.
06/10/2026, 09:15 - Prof. Alan: Python assignment due Friday 5 PM.
Line 2 of multiline message.
[06/10/2026, 10:00:00] Alice: Understood!
12/10/26, 2:30 pm - Bob: Great 👍"""

    parsed = parse_whatsapp_chat(chat_sample)
    assert len(parsed) >= 3
    # Check multiline
    assert "Line 2 of multiline message." in parsed[1].text
    # Check emoji
    assert "👍" in parsed[3].text


def test_relative_deadline_parsing():
    ref_dt = datetime.datetime(2026, 10, 6, 9, 0, 0) # Tuesday
    # Test "tomorrow"
    dl_tomorrow, text_tom, _ = parse_relative_deadline("Submit tomorrow at 5 PM", ref_dt)
    assert dl_tomorrow is not None
    assert dl_tomorrow.day == 7
    assert dl_tomorrow.hour == 17

    # Test "by Friday"
    dl_fri, text_fri, _ = parse_relative_deadline("Assignment due Friday 5 PM", ref_dt)
    assert dl_fri is not None
    assert dl_fri.day == 9
    assert dl_fri.hour == 17


def test_critical_test_student_isolation(db_session, test_users):
    """
    STUDENT ISOLATION TEST:
    Create Task X.
    Student A marks Task X completed.
    Student A must see COMPLETED.
    Student B must see PENDING.
    Student C must see PENDING.
    Task itself must NOT be globally completed.
    """
    admin = test_users["admin"]
    student_a = test_users["student_a"]
    student_b = test_users["student_b"]
    student_c = test_users["student_c"]

    # Create shared Task X
    task_x = Task(
        title="Python Assignment",
        description="Submit Python assignment by Friday",
        category="ASSIGNMENT",
        priority="HIGH",
        status="APPROVED",
        is_active=True,
        created_by=admin.id
    )
    db_session.add(task_x)
    db_session.commit()
    db_session.refresh(task_x)

    # Student A marks Task X completed
    set_student_task_status(db_session, student_a.id, task_x.task_id, "COMPLETED")

    # Verify Student A view
    tasks_a = get_student_personalized_tasks(db_session, student_a.id)
    assert len(tasks_a) == 1
    assert tasks_a[0].personal_status == "COMPLETED"

    # Verify Student B view (CRITICAL!)
    tasks_b = get_student_personalized_tasks(db_session, student_b.id)
    assert len(tasks_b) == 1
    assert tasks_b[0].personal_status == "PENDING", "FAIL: Student B status must be PENDING!"

    # Verify Student C view (CRITICAL!)
    tasks_c = get_student_personalized_tasks(db_session, student_c.id)
    assert len(tasks_c) == 1
    assert tasks_c[0].personal_status == "PENDING", "FAIL: Student C status must be PENDING!"

    # Verify Task global state is NOT completed
    task_in_db = db_session.query(Task).filter(Task.task_id == task_x.task_id).first()
    assert task_in_db.status == "APPROVED"


def test_complete_hackathon_workflow_tests_1_to_15(db_session, test_users):
    """
    COMPLETE 15-STEP VALIDATION FLOW:
    TEST 1: Admin uploads WhatsApp export.
    TEST 2: System extracts messages.
    TEST 3: AI identifies tasks/events/deadlines in PENDING_REVIEW.
    TEST 4: Admin reviews extracted items.
    TEST 5: Admin approves an item.
    TEST 6: Student A sees the item.
    TEST 7: Student B sees the same item.
    TEST 8: Student A clicks DONE.
    TEST 9: Student B must still see PENDING.
    TEST 10: Student C chooses REMIND ME LATER.
    TEST 11: Student A's completion must not affect B or C.
    TEST 12: Upload the same WhatsApp export again -> No duplicate messages/posts/tasks.
    TEST 13: Upload a newer export containing additional messages -> Only new messages processed.
    TEST 14: Admin changes the deadline -> Students see updated deadline and receive notification.
    TEST 15: Admin marks a post as mandatory notification -> Students receive mandatory notification.
    """
    admin = test_users["admin"]
    student_a = test_users["student_a"]
    student_b = test_users["student_b"]
    student_c = test_users["student_c"]

    # --- TEST 1 & 2 & 3: Admin uploads WhatsApp export, messages extracted, AI categorizes into PENDING_REVIEW ---
    chat_v1_text = """06/10/2026, 09:00 - Messages and calls are end-to-end encrypted.
06/10/2026, 09:15 - Prof. Alan Vance: Everyone needs to submit the Python assignment by Friday 5 PM.
06/10/2026, 09:30 - Dr. Sarah Jenkins: Tomorrow's class is moved to 2 PM in Room 402."""
    chat_v1_bytes = chat_v1_text.encode("utf-8")

    upload_1, stats_1 = process_chat_upload_pipeline(
        db=db_session,
        file_bytes=chat_v1_bytes,
        file_name="chat_export_v1.txt",
        uploader_id=admin.id,
        allow_duplicate_file=True,
        default_status="PENDING_REVIEW"
    )

    # TEST 1 & 2 verified:
    assert stats_1["total_messages"] == 3
    assert stats_1["new_messages"] == 3
    # TEST 3 verified:
    assert stats_1["tasks_detected"] >= 1

    extracted_tasks = db_session.query(Task).all()
    assert len(extracted_tasks) >= 1
    python_task = next(t for t in extracted_tasks if "Python" in t.title)
    # Status MUST initially be PENDING_REVIEW!
    assert python_task.status == "PENDING_REVIEW"

    # Students should NOT see pending review items yet (Section 5)
    student_tasks_before_approval = get_student_personalized_tasks(db_session, student_a.id)
    assert len(student_tasks_before_approval) == 0

    # --- TEST 4 & 5: Admin reviews extracted items and approves the Python assignment ---
    review_task_workflow(db_session, python_task.task_id, "approve")
    assert python_task.status == "APPROVED"

    # --- TEST 6 & 7: Student A and Student B both see the approved item ---
    tasks_a = get_student_personalized_tasks(db_session, student_a.id)
    tasks_b = get_student_personalized_tasks(db_session, student_b.id)
    assert len(tasks_a) == 1
    assert len(tasks_b) == 1
    assert tasks_a[0].title == python_task.title
    assert tasks_b[0].title == python_task.title

    # --- TEST 8 & 9: Student A clicks DONE; Student B must still see PENDING ---
    set_student_task_status(db_session, student_a.id, python_task.task_id, "COMPLETED")
    tasks_a_updated = get_student_personalized_tasks(db_session, student_a.id)
    tasks_b_updated = get_student_personalized_tasks(db_session, student_b.id)

    assert tasks_a_updated[0].personal_status == "COMPLETED"
    assert tasks_b_updated[0].personal_status == "PENDING"

    # --- TEST 10: Student C chooses REMIND ME LATER ---
    set_student_task_status(db_session, student_c.id, python_task.task_id, "REMIND_LATER")
    tasks_c_updated = get_student_personalized_tasks(db_session, student_c.id)
    assert tasks_c_updated[0].personal_status == "REMIND_LATER"

    # --- TEST 11: Student A's completion does not affect B or C ---
    assert tasks_b_updated[0].personal_status == "PENDING"
    assert tasks_c_updated[0].personal_status == "REMIND_LATER"

    # --- TEST 12: Upload the same WhatsApp export again -> No duplicate messages/posts/tasks ---
    upload_repeat, stats_repeat = process_chat_upload_pipeline(
        db=db_session,
        file_bytes=chat_v1_bytes,
        file_name="chat_export_v1.txt",
        uploader_id=admin.id,
        allow_duplicate_file=True
    )
    assert stats_repeat["new_messages"] == 0
    assert stats_repeat["existing_messages"] == 3
    # Total Python tasks in DB must still be exactly 1!
    python_tasks_total = db_session.query(Task).filter(Task.title.like("%Python%")).all()
    assert len(python_tasks_total) == 1

    # --- TEST 13: Upload newer export containing additional messages -> Only new messages processed ---
    chat_v2_text = chat_v1_text + "\n06/10/2026, 14:00 - Prof. Alan Vance: Python assignment deadline changed to Saturday 6 PM."
    chat_v2_bytes = chat_v2_text.encode("utf-8")

    upload_v2, stats_v2 = process_chat_upload_pipeline(
        db=db_session,
        file_bytes=chat_v2_bytes,
        file_name="chat_export_v2.txt",
        uploader_id=admin.id,
        allow_duplicate_file=True
    )
    assert stats_v2["total_messages"] == 4
    assert stats_v2["existing_messages"] == 3
    assert stats_v2["new_messages"] == 1
    assert stats_v2["duplicates_removed"] >= 1
    # Check deadline was updated on existing task
    db_session.refresh(python_task)
    assert "Saturday" in (python_task.deadline_original_text or "")

    # --- TEST 14: Admin changes/extends the deadline -> Students see updated deadline and receive notification ---
    review_task_workflow(
        db_session,
        python_task.task_id,
        "update",
        {"deadline_original_text": "Extended to Sunday 11:59 PM"}
    )
    db_session.refresh(python_task)
    assert python_task.deadline_original_text == "Extended to Sunday 11:59 PM"

    tasks_a_dl = get_student_personalized_tasks(db_session, student_a.id)
    assert "Sunday" in tasks_a_dl[0].deadline_original_text
    # Verify deadline change notification exists
    deadline_notifs = db_session.query(Notification).filter(Notification.type == "DEADLINE").all()
    assert len(deadline_notifs) >= 1

    # --- TEST 15: Admin marks post as mandatory notification -> Students receive mandatory notification ---
    review_task_workflow(
        db_session,
        python_task.task_id,
        "update",
        {"is_mandatory_notification": True, "notification_message": "Mandatory: Must submit code repository URL"}
    )
    mandatory_notifs = db_session.query(Notification).filter(Notification.is_mandatory == True).all()
    assert len(mandatory_notifs) >= 1
    assert "Mandatory" in mandatory_notifs[0].message


def test_category_management(db_session):
    """
    Test Section 13: Centralized category system.
    """
    # Create category
    cat = create_category(db_session, CategoryCreate(
        name="Hackathons",
        slug="HACKATHON",
        description="Coding hackathons",
        display_order=1,
        color="#ec4899",
        icon="Code"
    ))
    assert cat.id is not None
    assert cat.slug == "HACKATHON"

    # Rename / update
    updated_cat = update_category(db_session, cat.id, CategoryUpdate(name="Global Hackathons"))
    assert updated_cat.name == "Global Hackathons"

    # Query all
    cats = get_all_categories(db_session)
    assert len(cats) >= 1

    # Delete safe
    deleted = delete_category(db_session, cat.id)
    assert deleted is True


def test_duplicate_file_rejection_when_disallowed(db_session, test_users):
    """
    When allow_duplicate_file=False is explicitly specified, raise ValueError.
    """
    admin = test_users["admin"]
    content = "06/10/2026, 09:00 - Admin: Sample message.".encode("utf-8")

    process_chat_upload_pipeline(db_session, content, "sample.txt", admin.id, allow_duplicate_file=False)

    with pytest.raises(ValueError) as excinfo:
        process_chat_upload_pipeline(db_session, content, "sample.txt", admin.id, allow_duplicate_file=False)
    assert "already been processed" in str(excinfo.value)
