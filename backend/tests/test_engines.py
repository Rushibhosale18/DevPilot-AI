"""
Unit tests for core engines (RAG, Debug) — mocked, no real API calls.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.engines.rag_engine import RAGEngine, CHUNK_SIZE
from app.engines.debug_engine import DebugEngine


class TestRAGEngineChunking:
    def test_chunk_small_file(self):
        rag = RAGEngine.__new__(RAGEngine)
        file = {
            "path": "main.py",
            "content": "\n".join([f"line {i}" for i in range(10)]),
            "language": "py",
            "size_bytes": 100,
        }
        chunks = rag._chunk_file(file)
        assert len(chunks) >= 1
        assert chunks[0]["metadata"]["path"] == "main.py"
        assert chunks[0]["metadata"]["start_line"] == 1

    def test_chunk_large_file(self):
        rag = RAGEngine.__new__(RAGEngine)
        file = {
            "path": "big.py",
            "content": "\n".join([f"line {i}" for i in range(300)]),
            "language": "py",
            "size_bytes": 10000,
        }
        chunks = rag._chunk_file(file)
        # Should have multiple chunks
        assert len(chunks) > 1

    def test_empty_file_no_chunks(self):
        rag = RAGEngine.__new__(RAGEngine)
        file = {"path": "empty.py", "content": "   \n  ", "language": "py", "size_bytes": 5}
        chunks = rag._chunk_file(file)
        assert chunks == []


class TestDebugEngineConfidence:
    def setup_method(self):
        self.eng = DebugEngine.__new__(DebugEngine)

    def test_confidence_empty_result(self):
        assert self.eng._estimate_confidence({}) == pytest.approx(0.3, abs=0.1)

    def test_confidence_parse_error(self):
        assert self.eng._estimate_confidence({"parse_error": True}) <= 0.5

    def test_confidence_rich_dict(self):
        result = {"bugs": [1, 2], "summary": "ok", "score": 8, "issues": [], "strengths": []}
        score = self.eng._estimate_confidence(result)
        assert score > 0.5

    def test_confidence_list_result(self):
        result = [{"bug": "a"}, {"bug": "b"}, {"bug": "c"}]
        score = self.eng._estimate_confidence(result)
        assert 0.5 <= score <= 1.0
