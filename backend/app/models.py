import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ForeignKey,
    UniqueConstraint, Float, Index
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    student_id = Column(String(50), nullable=True, index=True)
    role = Column(String(20), nullable=False, default="STUDENT")  # ADMIN or STUDENT
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    uploads = relationship("ChatUpload", back_populates="uploader")
    task_statuses = relationship("StudentTaskStatus", back_populates="student", cascade="all, delete-orphan")


class Category(Base):
    """
    Centralized academic categories system (Section 13)
    Admin can add, rename, reorder, or remove categories.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0)
    color = Column(String(50), default="#6366f1")
    icon = Column(String(50), default="Tag")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ChatUpload(Base):
    """
    Audit log of all uploaded chats and processing history (Section 14).
    """
    __tablename__ = "chat_uploads"

    upload_id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    file_hash = Column(String(64), index=True, nullable=False)
    message_count = Column(Integer, default=0)
    new_message_count = Column(Integer, default=0)
    skipped_message_count = Column(Integer, default=0)
    items_extracted = Column(Integer, default=0)
    items_approved = Column(Integer, default=0)
    items_rejected = Column(Integer, default=0)
    processing_status = Column(String(30), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    uploader = relationship("User", back_populates="uploads")
    messages = relationship("Message", back_populates="upload", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    message_id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("chat_uploads.upload_id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    timestamp_text = Column(String(50), nullable=False)
    sender = Column(String(100), nullable=False)
    text = Column(Text, nullable=False)
    message_hash = Column(String(64), unique=True, index=True, nullable=False)
    is_processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    upload = relationship("ChatUpload", back_populates="messages")


class Task(Base):
    """
    SHARED CLASS DATA / POSTS
    This task/event/post belongs to the entire CLASS.
    Never mark this globally completed because one student completed it!
    """
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="ASSIGNMENT")  # HACKATHON, WORKSHOP, EVENT, EXAM, ASSIGNMENT, etc.
    priority = Column(String(20), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW

    # Structured timing & location fields (Section 3)
    deadline = Column(DateTime, nullable=True, index=True)
    deadline_original_text = Column(String(100), nullable=True)
    deadline_confidence = Column(String(20), default="HIGH")  # HIGH, MEDIUM, LOW
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    time = Column(String(50), nullable=True)
    location = Column(String(200), nullable=True)
    registration_link = Column(Text, nullable=True)
    submission_instructions = Column(Text, nullable=True)

    confidence = Column(Float, default=1.0)
    status = Column(String(30), default="PENDING_REVIEW")  # PENDING_REVIEW, APPROVED, REJECTED (Section 5)

    # Mandatory notification controls (Section 11)
    is_mandatory_notification = Column(Boolean, default=False)
    notification_message = Column(String(255), nullable=True)

    # Source Traceability (Section 4)
    source_message_id = Column(Integer, ForeignKey("messages.message_id"), nullable=True)
    source_sender = Column(String(100), nullable=True)
    source_timestamp = Column(String(50), nullable=True)
    source_text = Column(Text, nullable=True)
    additional_source_count = Column(Integer, default=0)
    source_history = Column(Text, nullable=True)  # JSON list of merged source occurrences

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationship to individual student statuses (Section 6)
    student_statuses = relationship("StudentTaskStatus", back_populates="task", cascade="all, delete-orphan")


class StudentTaskStatus(Base):
    """
    PERSONAL STUDENT STATE (Section 6 & 8)
    Each student has their own completely independent status record per task.
    Supports: PENDING, COMPLETED, REMIND_LATER
    """
    __tablename__ = "student_task_status"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, COMPLETED, REMIND_LATER
    remind_at = Column(DateTime, nullable=True)  # Personal reminder time (Section 8)
    completed_at = Column(DateTime, nullable=True)
    student_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Unique constraint ensures one status record per student per task
    __table_args__ = (
        UniqueConstraint("student_id", "task_id", name="uq_student_task"),
    )

    student = relationship("User", back_populates="task_statuses")
    task = relationship("Task", back_populates="student_statuses")


class Announcement(Base):
    """
    Shared class announcements
    """
    __tablename__ = "announcements"

    announcement_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="ANNOUNCEMENT")
    priority = Column(String(20), default="MEDIUM")  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(30), default="APPROVED")  # PENDING_REVIEW, APPROVED, REJECTED
    confidence = Column(Float, default=1.0)
    source_message_id = Column(Integer, ForeignKey("messages.message_id"), nullable=True)
    source_sender = Column(String(100), nullable=True)
    source_timestamp = Column(String(50), nullable=True)
    source_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ImportantLink(Base):
    """
    Extracted verified URLs from chat
    """
    __tablename__ = "important_links"

    link_id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(50), default="RESOURCE")
    sender = Column(String(100), nullable=True)
    timestamp = Column(String(50), nullable=True)
    source_message_id = Column(Integer, ForeignKey("messages.message_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    """
    In-app notifications for students and admins (Section 10 & 11)
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # None = Broadcast to all students
    task_id = Column(Integer, ForeignKey("tasks.task_id", ondelete="SET NULL"), nullable=True)  # Direct link to post
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="TASK")  # TASK, DEADLINE, MANDATORY, ANNOUNCEMENT, REMINDER
    is_mandatory = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
