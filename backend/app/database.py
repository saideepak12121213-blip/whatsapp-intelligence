from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Database engine configuration with production connection pooling
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

engine_kwargs = {
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Ensure resilient driver selection if using PostgreSQL
if not is_sqlite:
    try:
        import psycopg  # noqa: F401
    except ImportError:
        try:
            import psycopg2  # noqa: F401
            if "postgresql+psycopg://" in db_url:
                db_url = db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
            elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
                db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        except ImportError:
            pass

engine = create_engine(
    db_url,
    **engine_kwargs
)

# Enable foreign keys for SQLite if using SQLite
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_and_upgrade_db():
    """
    Ensures all tables and missing columns exist without wiping historical data.
    Supports Supabase PostgreSQL and SQLite.
    Also seeds default categories if empty.
    """
    from app.models import Category
    from sqlalchemy import text

    # 1. Create all model tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # 2. SQLite specific lightweight column migration
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            # Check tasks table
            res = conn.execute(text("PRAGMA table_info(tasks)"))
            task_cols = [row[1] for row in res.fetchall()]
            alterations = [
                ("start_date", "DATETIME"),
                ("end_date", "DATETIME"),
                ("time", "VARCHAR(50)"),
                ("location", "VARCHAR(200)"),
                ("registration_link", "TEXT"),
                ("submission_instructions", "TEXT"),
                ("is_mandatory_notification", "BOOLEAN DEFAULT 0"),
                ("notification_message", "VARCHAR(255)"),
            ]
            for col_name, col_type in alterations:
                if col_name not in task_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE tasks ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        pass

            # Check student_task_status table
            res = conn.execute(text("PRAGMA table_info(student_task_status)"))
            sts_cols = [row[1] for row in res.fetchall()]
            if "remind_at" not in sts_cols:
                try:
                    conn.execute(text("ALTER TABLE student_task_status ADD COLUMN remind_at DATETIME"))
                except Exception as e:
                    pass

            # Check chat_uploads table
            res = conn.execute(text("PRAGMA table_info(chat_uploads)"))
            upload_cols = [row[1] for row in res.fetchall()]
            upload_alterations = [
                ("skipped_message_count", "INTEGER DEFAULT 0"),
                ("items_extracted", "INTEGER DEFAULT 0"),
                ("items_approved", "INTEGER DEFAULT 0"),
                ("items_rejected", "INTEGER DEFAULT 0"),
            ]
            for col_name, col_type in upload_alterations:
                if col_name not in upload_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE chat_uploads ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        pass

            # Check notifications table
            res = conn.execute(text("PRAGMA table_info(notifications)"))
            notif_cols = [row[1] for row in res.fetchall()]
            notif_alterations = [
                ("task_id", "INTEGER"),
                ("is_mandatory", "BOOLEAN DEFAULT 0"),
            ]
            for col_name, col_type in notif_alterations:
                if col_name not in notif_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_type}"))
                    except Exception as e:
                        pass
            conn.commit()

    # 3. Universal ORM-based Category Seeding (PostgreSQL & SQLite compatible)
    db = SessionLocal()
    try:
        cat_count = db.query(Category).count()
        if cat_count == 0:
            default_cats = [
                Category(name="Hackathons", slug="HACKATHON", description="Hackathons and coding competitions", display_order=1, color="#ec4899", icon="Code", is_system=True),
                Category(name="Workshops", slug="WORKSHOP", description="Technical workshops, bootcamps and hands-on sessions", display_order=2, color="#8b5cf6", icon="Cpu", is_system=True),
                Category(name="Events", slug="EVENT", description="Seminars, conferences, webinars and college events", display_order=3, color="#3b82f6", icon="Calendar", is_system=True),
                Category(name="Exams", slug="EXAM", description="Examinations, quizzes, midterms and vivas", display_order=4, color="#ef4444", icon="FileText", is_system=True),
                Category(name="Exam Fees", slug="EXAM_FEE", description="Semester examination and revaluation fee deadlines", display_order=5, color="#f59e0b", icon="CreditCard", is_system=True),
                Category(name="Semester Fees", slug="SEMESTER_FEE", description="Tuition, hostel and college term fees", display_order=6, color="#eab308", icon="DollarSign", is_system=True),
                Category(name="Registrations", slug="REGISTRATION", description="Course, club and portal registration deadlines", display_order=7, color="#06b6d4", icon="UserCheck", is_system=True),
                Category(name="Assignments", slug="ASSIGNMENT", description="Academic assignments, project submissions and reports", display_order=8, color="#10b981", icon="CheckSquare", is_system=True),
                Category(name="Announcements", slug="ANNOUNCEMENT", description="Important class notices, timetable and room updates", display_order=9, color="#6366f1", icon="Bell", is_system=True),
                Category(name="Resources", slug="RESOURCE", description="Important study resources, portals and reference links", display_order=10, color="#14b8a6", icon="Link", is_system=True),
            ]
            db.add_all(default_cats)
            db.commit()
    except Exception as e:
        print(f"Category seeding note: {e}")
        db.rollback()
    finally:
        db.close()
