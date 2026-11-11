"""
DevPilot AI - Repositories API
Add a GitHub repo, trigger indexing, list/delete repos.
"""

import os
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.repository import Repository, RepoStatus
from app.services.github_service import GitHubService
from app.engines.rag_engine import RAGEngine

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────
class AddRepoRequest(BaseModel):
    github_url: str


class RepoResponse(BaseModel):
    id: int
    full_name: str
    github_url: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    status: str
    total_files: int
    indexed_files: int
    error_message: Optional[str]


# ─── Background task: clone + index ───────────────────────────────────────────
def _clone_and_index(repo_id: int, github_url: str, full_name: str, db: Session):
    """Run in background: clone repo → extract files → embed into ChromaDB."""
    gh_svc = GitHubService()
    rag = RAGEngine()

    repo = db.query(Repository).filter(Repository.id == repo_id).first()
    if not repo:
        return

    try:
        # 1. Clone
        repo.status = RepoStatus.CLONING
        db.commit()

        local_path = os.path.join(settings.REPO_CLONE_DIR, str(repo_id))
        gh_svc.clone_repository(github_url, local_path)
        repo.local_path = local_path

        # 2. Extract files
        repo.status = RepoStatus.INDEXING
        db.commit()

        files = gh_svc.extract_files(local_path)
        repo.total_files = len(files)
        db.commit()

        # 3. Index into ChromaDB
        def progress(done, total):
            repo.indexed_files = done
            db.commit()

        rag.index_repository(repo_id, files, progress_callback=progress)

        repo.status = RepoStatus.READY
        repo.indexed_files = len(files)

    except Exception as e:
        repo.status = RepoStatus.FAILED
        repo.error_message = str(e)

    finally:
        db.commit()


# ─── Routes ───────────────────────────────────────────────────────────────────
@router.post("", response_model=RepoResponse)
async def add_repository(
    body: AddRepoRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a GitHub repo for analysis. Cloning and indexing run in background."""
    count = db.query(Repository).filter(Repository.owner_id == current_user.id).count()
    if count >= settings.MAX_REPOS_PER_USER:
        raise HTTPException(400, f"Max {settings.MAX_REPOS_PER_USER} repos per user")

    gh_svc = GitHubService()
    full_name = gh_svc.parse_github_url(body.github_url)

    # Check already added
    existing = (
        db.query(Repository)
        .filter(Repository.owner_id == current_user.id, Repository.full_name == full_name)
        .first()
    )
    if existing:
        raise HTTPException(400, "Repository already added")

    # Fetch metadata
    try:
        meta = gh_svc.get_repo_metadata(full_name)
    except ValueError as e:
        raise HTTPException(400, str(e))

    repo = Repository(
        owner_id=current_user.id,
        github_url=body.github_url,
        full_name=full_name,
        description=meta.get("description"),
        language=meta.get("language"),
        stars=meta.get("stars", 0),
        default_branch=meta.get("default_branch", "main"),
        status=RepoStatus.PENDING,
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    # Kick off background job
    background_tasks.add_task(_clone_and_index, repo.id, body.github_url, full_name, db)

    return RepoResponse(
        id=repo.id,
        full_name=repo.full_name,
        github_url=repo.github_url,
        description=repo.description,
        language=repo.language,
        stars=repo.stars,
        status=repo.status.value,
        total_files=repo.total_files,
        indexed_files=repo.indexed_files,
        error_message=repo.error_message,
    )


@router.get("", response_model=List[RepoResponse])
async def list_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repos = db.query(Repository).filter(Repository.owner_id == current_user.id).all()
    return [
        RepoResponse(
            id=r.id, full_name=r.full_name, github_url=r.github_url,
            description=r.description, language=r.language, stars=r.stars,
            status=r.status.value, total_files=r.total_files,
            indexed_files=r.indexed_files, error_message=r.error_message,
        )
        for r in repos
    ]


@router.get("/{repo_id}", response_model=RepoResponse)
async def get_repository(
    repo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = db.query(Repository).filter(
        Repository.id == repo_id, Repository.owner_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(404, "Repository not found")
    return RepoResponse(
        id=repo.id, full_name=repo.full_name, github_url=repo.github_url,
        description=repo.description, language=repo.language, stars=repo.stars,
        status=repo.status.value, total_files=repo.total_files,
        indexed_files=repo.indexed_files, error_message=repo.error_message,
    )


@router.delete("/{repo_id}")
async def delete_repository(
    repo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = db.query(Repository).filter(
        Repository.id == repo_id, Repository.owner_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(404, "Repository not found")

    # Clean up ChromaDB collection and cloned files
    RAGEngine().delete_collection(repo_id)
    if repo.local_path and os.path.exists(repo.local_path):
        import shutil
        shutil.rmtree(repo.local_path, ignore_errors=True)

    db.delete(repo)
    db.commit()
    return {"message": "Repository deleted"}


@router.get("/{repo_id}/files")
async def list_repo_files(
    repo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the list of indexed files in a repo."""
    repo = db.query(Repository).filter(
        Repository.id == repo_id, Repository.owner_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(404, "Repository not found")
    if not repo.local_path or not os.path.exists(repo.local_path):
        raise HTTPException(400, "Repository files not available yet")

    gh_svc = GitHubService()
    files = gh_svc.extract_files(repo.local_path)
    return [{"path": f["path"], "language": f["language"], "lines": f["lines"]} for f in files]


@router.get("/{repo_id}/file")
async def get_file_content(
    repo_id: int,
    path: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return raw content of a specific file."""
    repo = db.query(Repository).filter(
        Repository.id == repo_id, Repository.owner_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(404, "Repository not found")

    file_path = Path(repo.local_path) / path
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(404, "File not found")

    # Security: ensure path doesn't escape repo dir
    try:
        file_path.resolve().relative_to(Path(repo.local_path).resolve())
    except ValueError:
        raise HTTPException(400, "Invalid file path")

    content = file_path.read_text(encoding="utf-8", errors="replace")
    return {"path": path, "content": content, "lines": content.count("\n") + 1}
