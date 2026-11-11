"""
DevPilot AI - Authentication API
Email/password registration + login + GitHub OAuth.
"""

from datetime import timedelta
from typing import Optional
import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ─── Schemas ──────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    github_username: Optional[str]
    avatar_url: Optional[str]


# ─── Dependency ───────────────────────────────────────────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


# ─── Routes ───────────────────────────────────────────────────────────────────
@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(400, "Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=hash_password(body.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "username": user.username},
    )


@router.post("/login", response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password or ""):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "username": user.username,
              "github_username": user.github_username, "avatar_url": user.avatar_url},
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        github_username=current_user.github_username,
        avatar_url=current_user.avatar_url,
    )


@router.get("/github/callback")
async def github_oauth_callback(code: str, db: Session = Depends(get_db)):
    """Exchange GitHub OAuth code for access token, upsert user."""
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        resp = await client.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
        token_data = resp.json()
        gh_token = token_data.get("access_token")
        if not gh_token:
            raise HTTPException(400, "GitHub OAuth failed")

        # Fetch GitHub user profile
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {gh_token}", "Accept": "application/json"},
        )
        gh_user = user_resp.json()

    github_id = str(gh_user["id"])
    github_username = gh_user["login"]
    avatar_url = gh_user.get("avatar_url")
    email = gh_user.get("email") or f"{github_username}@github.com"

    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        user.github_id = github_id
        user.github_username = github_username
        user.avatar_url = avatar_url
    else:
        user = User(
            email=email,
            username=github_username,
            github_id=github_id,
            github_username=github_username,
            avatar_url=avatar_url,
            is_active=True,
            is_verified=True,
        )
        db.add(user)

    db.commit()
    db.refresh(user)

    app_token = create_access_token({"sub": str(user.id)})
    return {"access_token": app_token, "token_type": "bearer"}
