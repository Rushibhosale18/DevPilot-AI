"""
DevPilot AI - Repository Model
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class RepoStatus(str, enum.Enum):
    PENDING = "pending"
    CLONING = "cloning"
    INDEXING = "indexing"
    READY = "ready"
    FAILED = "failed"


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    github_url = Column(String, nullable=False)
    full_name = Column(String, nullable=False)         # e.g. "torvalds/linux"
    default_branch = Column(String, default="main")
    description = Column(Text, nullable=True)
    language = Column(String, nullable=True)
    stars = Column(Integer, default=0)
    status = Column(Enum(RepoStatus), default=RepoStatus.PENDING)
    local_path = Column(String, nullable=True)
    total_files = Column(Integer, default=0)
    indexed_files = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
