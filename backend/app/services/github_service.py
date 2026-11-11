"""
DevPilot AI - GitHub Repository Service
Clones repos, extracts files, fetches PR diffs via PyGithub.
"""

import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional, Dict, Any

from github import Github, GithubException
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# File extensions we care about for code analysis
CODE_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".h",
    ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".scala",
    ".sh", ".bash", ".zsh", ".yaml", ".yml", ".json", ".toml", ".md",
    ".html", ".css", ".scss", ".sql", ".r", ".m", ".vue", ".svelte",
}

SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
    "dist", "build", ".next", ".nuxt", "coverage", ".pytest_cache",
    ".mypy_cache", "vendor", "target", "out",
}


class GitHubService:
    def __init__(self, token: Optional[str] = None):
        self.token = token or settings.GITHUB_TOKEN
        self.gh = Github(self.token) if self.token else Github()

    # ─── Repository metadata ───────────────────────────────────────────────

    def get_repo_metadata(self, full_name: str) -> Dict[str, Any]:
        """Return basic metadata for a GitHub repo (owner/repo format)."""
        try:
            repo = self.gh.get_repo(full_name)
            return {
                "full_name": repo.full_name,
                "description": repo.description,
                "language": repo.language,
                "stars": repo.stargazers_count,
                "default_branch": repo.default_branch,
                "topics": repo.get_topics(),
                "size_kb": repo.size,
                "open_issues": repo.open_issues_count,
                "license": repo.license.name if repo.license else None,
                "created_at": repo.created_at.isoformat(),
                "updated_at": repo.updated_at.isoformat(),
            }
        except GithubException as e:
            raise ValueError(f"GitHub API error: {e.data.get('message', str(e))}")

    # ─── Clone & file extraction ───────────────────────────────────────────

    def clone_repository(self, github_url: str, target_dir: str) -> str:
        """
        Shallow-clone a repository to target_dir.
        Returns the path to the cloned directory.
        """
        if os.path.exists(target_dir):
            shutil.rmtree(target_dir)

        cmd = ["git", "clone", "--depth", "1", "--single-branch"]
        if self.token:
            # Inject token for private repos
            url_with_token = github_url.replace(
                "https://", f"https://{self.token}@"
            )
            cmd.append(url_with_token)
        else:
            cmd.append(github_url)
        cmd.append(target_dir)

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=120
            )
            if result.returncode != 0:
                raise RuntimeError(f"Git clone failed: {result.stderr}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Repository clone timed out (>120 s). Try a smaller repo.")

        return target_dir

    def extract_files(self, repo_dir: str) -> List[Dict[str, Any]]:
        """
        Walk the cloned repo and extract code files as text.
        Returns a list of {path, content, language, size_bytes}.
        """
        files = []
        repo_path = Path(repo_dir)

        for file_path in repo_path.rglob("*"):
            # Skip hidden dirs and noise dirs
            parts = set(file_path.parts)
            if parts & SKIP_DIRS:
                continue
            if not file_path.is_file():
                continue
            if file_path.suffix.lower() not in CODE_EXTENSIONS:
                continue

            size_bytes = file_path.stat().st_size
            if size_bytes > settings.MAX_FILE_SIZE_KB * 1024:
                logger.debug(f"Skipping large file: {file_path}")
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="replace")
                relative = str(file_path.relative_to(repo_path))
                files.append({
                    "path": relative,
                    "content": content,
                    "language": file_path.suffix.lstrip("."),
                    "size_bytes": size_bytes,
                    "lines": content.count("\n") + 1,
                })
            except Exception as e:
                logger.warning(f"Could not read {file_path}: {e}")

            if len(files) >= settings.MAX_FILES_PER_REPO:
                logger.info("Reached MAX_FILES_PER_REPO limit.")
                break

        return files

    # ─── Pull Request handling ─────────────────────────────────────────────

    def get_pr_diff(self, full_name: str, pr_number: int) -> Dict[str, Any]:
        """Return PR metadata + per-file diffs."""
        try:
            repo = self.gh.get_repo(full_name)
            pr = repo.get_pull(pr_number)
            files = pr.get_files()

            changed_files = []
            for f in files:
                changed_files.append({
                    "filename": f.filename,
                    "status": f.status,           # added / removed / modified
                    "additions": f.additions,
                    "deletions": f.deletions,
                    "patch": f.patch or "",        # unified diff
                })

            return {
                "pr_number": pr.number,
                "title": pr.title,
                "body": pr.body or "",
                "author": pr.user.login,
                "base_branch": pr.base.ref,
                "head_branch": pr.head.ref,
                "state": pr.state,
                "created_at": pr.created_at.isoformat(),
                "changed_files": changed_files,
                "total_additions": pr.additions,
                "total_deletions": pr.deletions,
            }
        except GithubException as e:
            raise ValueError(f"GitHub API error: {e.data.get('message', str(e))}")

    def post_pr_comment(self, full_name: str, pr_number: int, body: str) -> str:
        """Post a review comment on a PR. Returns comment URL."""
        repo = self.gh.get_repo(full_name)
        pr = repo.get_pull(pr_number)
        comment = pr.create_issue_comment(body)
        return comment.html_url

    # ─── Utility ───────────────────────────────────────────────────────────

    def parse_github_url(self, url: str) -> str:
        """Extract 'owner/repo' from a GitHub URL."""
        url = url.rstrip("/")
        if url.endswith(".git"):
            url = url[:-4]
        parts = url.split("/")
        if len(parts) >= 2:
            return f"{parts[-2]}/{parts[-1]}"
        raise ValueError(f"Cannot parse GitHub URL: {url}")
