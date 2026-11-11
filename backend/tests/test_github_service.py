"""
DevPilot AI - GitHub Service unit tests (no real network calls)
"""

import pytest
from unittest.mock import patch, MagicMock

from app.services.github_service import GitHubService, CODE_EXTENSIONS


class TestGitHubServiceURLParsing:
    def setup_method(self):
        self.svc = GitHubService.__new__(GitHubService)

    def test_parse_https_url(self):
        assert self.svc.parse_github_url("https://github.com/owner/repo") == "owner/repo"

    def test_parse_git_url(self):
        assert self.svc.parse_github_url("https://github.com/owner/repo.git") == "owner/repo"

    def test_parse_trailing_slash(self):
        assert self.svc.parse_github_url("https://github.com/owner/repo/") == "owner/repo"

    def test_invalid_url(self):
        with pytest.raises(ValueError):
            self.svc.parse_github_url("not-a-url")


class TestFileExtensionFilter:
    def test_py_included(self):
        assert ".py" in CODE_EXTENSIONS

    def test_js_included(self):
        assert ".js" in CODE_EXTENSIONS

    def test_exe_excluded(self):
        assert ".exe" not in CODE_EXTENSIONS

    def test_png_excluded(self):
        assert ".png" not in CODE_EXTENSIONS
