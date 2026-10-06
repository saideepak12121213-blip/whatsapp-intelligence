import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import engine, Base, get_db, init_and_upgrade_db
from app.auth import seed_demo_users, require_admin
from app.models import User
from app.routers import auth, student, admin
from app.services import process_chat_upload_pipeline

# Create database tables and upgrade schema
init_and_upgrade_db()

app = FastAPI(
    title=settings.APP_NAME,
    description="WhatsApp Intelligence & Student Task Assistant — Hackathon Edition",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: seed demo users
@app.on_event("startup")
def on_startup():
    init_and_upgrade_db()
    db = next(get_db())
    try:
        seed_demo_users(db)
        print("Demo accounts seeded successfully.")
    finally:
        db.close()

# Include Routers
app.include_router(auth.router)
app.include_router(student.router)
app.include_router(admin.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "ai_provider": "gemini" if settings.AI_API_KEY else "heuristic_nlp_engine"
    }

# 1-Click Sample Chat Loader for quick Hackathon Demonstration
@app.post("/api/admin/load-sample-chat/{sample_key}")
def load_sample_chat(
    sample_key: str,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Convenience endpoint for hackathon judges and demos:
    Loads pre-bundled sample chats without needing to manually browse files.
    Keys: 'v1', 'v2', 'noise'
    """
    sample_files = {
        "v1": ("sample_chat_v1.txt", "sample_chats/sample_chat_v1.txt"),
        "v2": ("sample_chat_v2.txt", "sample_chats/sample_chat_v2.txt"),
        "noise": ("sample_chat_noise.txt", "sample_chats/sample_chat_noise.txt"),
    }

    if sample_key not in sample_files:
        raise HTTPException(status_code=400, detail="Invalid sample key. Choose 'v1', 'v2', or 'noise'.")

    file_name, rel_path = sample_files[sample_key]
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_path = os.path.join(base_dir, rel_path)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail=f"Sample chat file not found at {full_path}")

    with open(full_path, "rb") as f:
        file_bytes = f.read()

    try:
        upload_record, stats = process_chat_upload_pipeline(
            db=db,
            file_bytes=file_bytes,
            file_name=file_name,
            uploader_id=current_admin.id,
            allow_duplicate_file=True,
            default_status="PENDING_REVIEW"
        )
        return {
            "success": True,
            "message": stats["message"],
            "upload_id": upload_record.upload_id,
            "file_name": file_name,
            "messages_found": stats["total_messages"],
            "already_processed": stats["existing_messages"],
            "skipped_messages": stats["existing_messages"],
            "new_messages": stats["new_messages"],
            "tasks_detected": stats["tasks_detected"],
            "announcements_detected": stats["announcements_detected"],
            "duplicates_removed": stats["duplicates_removed"],
            "links_found": stats["links_found"],
            "items_extracted": stats["items_extracted"]
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mount built frontend if available
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
