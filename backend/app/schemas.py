from pydantic import BaseModel, Field
from typing import Optional, List, Any
import datetime

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    student_id: Optional[str] = None
    role: Optional[str] = "STUDENT"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    student_id: Optional[str] = None
    role: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
    email: Optional[str] = None


# --- CATEGORY SCHEMAS ---
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    display_order: int = 0
    color: str = "#6366f1"
    icon: str = "Tag"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: int
    is_system: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True


# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "ASSIGNMENT"
    priority: Optional[str] = "HIGH"
    deadline: Optional[datetime.datetime] = None
    deadline_original_text: Optional[str] = None
    deadline_confidence: Optional[str] = "HIGH"
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    time: Optional[str] = None
    location: Optional[str] = None
    registration_link: Optional[str] = None
    submission_instructions: Optional[str] = None
    is_mandatory_notification: bool = False
    notification_message: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime.datetime] = None
    deadline_original_text: Optional[str] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    time: Optional[str] = None
    location: Optional[str] = None
    registration_link: Optional[str] = None
    submission_instructions: Optional[str] = None
    is_mandatory_notification: Optional[bool] = None
    notification_message: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

class TaskResponse(TaskBase):
    task_id: int
    confidence: float
    status: str
    source_message_id: Optional[int] = None
    source_sender: Optional[str] = None
    source_timestamp: Optional[str] = None
    source_text: Optional[str] = None
    additional_source_count: int = 0
    source_history: Optional[str] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class StudentTaskResponse(TaskResponse):
    """
    Task representation personalized for the currently logged-in student.
    Contains shared task information PLUS personal student status.
    """
    personal_status: str = "PENDING"  # PENDING, COMPLETED, REMIND_LATER
    remind_at: Optional[datetime.datetime] = None
    completed_at: Optional[datetime.datetime] = None
    student_note: Optional[str] = None
    is_overdue: bool = False

class StudentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(PENDING|IN_PROGRESS|COMPLETED|REMIND_LATER)$")
    remind_at: Optional[datetime.datetime] = None
    student_note: Optional[str] = None

class TaskReviewAction(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|update)$")
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime.datetime] = None
    deadline_original_text: Optional[str] = None
    start_date: Optional[datetime.datetime] = None
    end_date: Optional[datetime.datetime] = None
    time: Optional[str] = None
    location: Optional[str] = None
    registration_link: Optional[str] = None
    submission_instructions: Optional[str] = None
    is_mandatory_notification: Optional[bool] = None
    notification_message: Optional[str] = None

class DeadlineUpdatePayload(BaseModel):
    deadline: Optional[datetime.datetime] = None
    deadline_original_text: Optional[str] = None
    notification_message: Optional[str] = None


# --- ANNOUNCEMENTS & LINKS SCHEMAS ---
class AnnouncementResponse(BaseModel):
    announcement_id: int
    title: str
    content: str
    category: str
    priority: str
    status: str
    confidence: float
    source_message_id: Optional[int] = None
    source_sender: Optional[str] = None
    source_timestamp: Optional[str] = None
    source_text: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ImportantLinkResponse(BaseModel):
    link_id: int
    url: str
    title: str
    category: str
    sender: Optional[str] = None
    timestamp: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    task_id: Optional[int] = None
    title: str
    message: str
    type: str
    is_mandatory: bool = False
    is_read: bool = False
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    title: str
    message: str
    task_id: Optional[int] = None
    type: str = "MANDATORY"
    is_mandatory: bool = True
    user_id: Optional[int] = None  # None = Broadcast


# --- CHAT UPLOAD & PROGRESS SCHEMAS ---
class UploadResponse(BaseModel):
    upload_id: int
    file_name: str
    uploaded_at: datetime.datetime
    file_hash: str
    message_count: int
    new_message_count: int
    skipped_message_count: int = 0
    items_extracted: int = 0
    items_approved: int = 0
    items_rejected: int = 0
    processing_status: str
    error_message: Optional[str] = None
    tasks_detected: int = 0
    announcements_detected: int = 0
    duplicates_removed: int = 0
    links_found: int = 0

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    message_id: int
    timestamp_text: str
    sender: str
    text: str
    is_processed: bool

    class Config:
        from_attributes = True


# --- DASHBOARD & STATS SCHEMAS ---
class StudentDashboardStats(BaseModel):
    pending_count: int
    completed_count: int
    reminders_count: int = 0
    due_today_count: int
    due_this_week_count: int
    overdue_count: int
    total_class_tasks: int
    urgent_announcements_count: int

class AdminDashboardStats(BaseModel):
    total_uploads: int
    total_messages: int
    total_class_tasks: int
    pending_review_tasks: int
    approved_tasks: int = 0
    rejected_tasks: int = 0
    total_announcements: int
    total_students: int
    overall_completion_rate: float
    last_upload_time: Optional[datetime.datetime] = None
