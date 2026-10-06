import bcrypt
import datetime
import jwt
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import TokenData

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not auth:
        raise credentials_exception
    token = auth.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privilege required"
        )
    return current_user

def seed_demo_users(db: Session):
    """Seed the required demo accounts for testing and evaluation."""
    demo_accounts = [
        {
            "name": "Prof. Alan Vance (Admin)",
            "email": "admin@classflow.demo",
            "password": "admin123",
            "student_id": "FAC-001",
            "role": "ADMIN"
        },
        {
            "name": "Alice Johnson",
            "email": "studentA@classflow.demo",
            "password": "student123",
            "student_id": "STU-2026-A01",
            "role": "STUDENT"
        },
        {
            "name": "Bob Smith",
            "email": "studentB@classflow.demo",
            "password": "student123",
            "student_id": "STU-2026-B02",
            "role": "STUDENT"
        },
        {
            "name": "Charlie Davis",
            "email": "studentC@classflow.demo",
            "password": "student123",
            "student_id": "STU-2026-C03",
            "role": "STUDENT"
        }
    ]

    for acc in demo_accounts:
        existing = db.query(User).filter(User.email == acc["email"]).first()
        if not existing:
            user = User(
                name=acc["name"],
                email=acc["email"],
                password_hash=get_password_hash(acc["password"]),
                student_id=acc["student_id"],
                role=acc["role"]
            )
            db.add(user)
    db.commit()
