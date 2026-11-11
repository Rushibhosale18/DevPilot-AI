"""
DevPilot AI - Analysis Results Model
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON, Enum, Float
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class AnalysisType(str, enum.Enum):
    BUG_DETECTION = "bug_detection"
    SECURITY_AUDIT = "security_audit"
    CODE_REVIEW = "code_review"
    TEST_GENERATION = "test_generation"
    EXPLAIN_CODE = "explain_code"
    FIX_SUGGESTION = "fix_suggestion"
    PR_REVIEW = "pr_review"
    CHAT = "chat"


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    repo_id = Column(Integer, ForeignKey("repositories.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_type = Column(Enum(AnalysisType), nullable=False)
    file_path = Column(String, nullable=True)       # target file (optional)
    input_query = Column(Text, nullable=True)
    result = Column(JSON, nullable=False)           # structured JSON output
    confidence_score = Column(Float, nullable=True)
    tokens_used = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
