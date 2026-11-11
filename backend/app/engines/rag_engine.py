"""
DevPilot AI - RAG (Retrieval-Augmented Generation) Engine
Indexes code files into ChromaDB and retrieves relevant context for queries.
"""

import hashlib
import logging
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = 80          # lines per chunk
CHUNK_OVERLAP = 10       # overlapping lines between chunks


class RAGEngine:
    """
    Manages a ChromaDB collection per repository.
    Embeds code chunks and performs semantic search.
    """

    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self.openai = OpenAI(api_key=settings.OPENAI_API_KEY)

    # ─── Collection helpers ────────────────────────────────────────────────

    def _collection_name(self, repo_id: int) -> str:
        return f"repo_{repo_id}"

    def get_or_create_collection(self, repo_id: int):
        return self.client.get_or_create_collection(
            name=self._collection_name(repo_id),
            metadata={"hnsw:space": "cosine"},
        )

    def delete_collection(self, repo_id: int):
        try:
            self.client.delete_collection(self._collection_name(repo_id))
        except Exception:
            pass

    # ─── Chunking ─────────────────────────────────────────────────────────

    def _chunk_file(self, file: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Split a file's content into overlapping line-based chunks."""
        lines = file["content"].splitlines()
        chunks = []

        for i in range(0, len(lines), CHUNK_SIZE - CHUNK_OVERLAP):
            chunk_lines = lines[i : i + CHUNK_SIZE]
            chunk_text = "\n".join(chunk_lines)
            if not chunk_text.strip():
                continue

            chunk_id = hashlib.md5(
                f"{file['path']}:{i}".encode()
            ).hexdigest()

            chunks.append({
                "id": chunk_id,
                "text": chunk_text,
                "metadata": {
                    "path": file["path"],
                    "language": file["language"],
                    "start_line": i + 1,
                    "end_line": min(i + CHUNK_SIZE, len(lines)),
                    "size_bytes": file["size_bytes"],
                },
            })

        return chunks

    # ─── Embedding ────────────────────────────────────────────────────────

    def _embed(self, texts: List[str]) -> List[List[float]]:
        """Call OpenAI embedding API in one batched request."""
        response = self.openai.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]

    # ─── Indexing ─────────────────────────────────────────────────────────

    def index_repository(
        self,
        repo_id: int,
        files: List[Dict[str, Any]],
        progress_callback=None,
    ) -> int:
        """
        Chunk and embed all files, upsert into ChromaDB.
        Returns total chunks indexed.
        """
        collection = self.get_or_create_collection(repo_id)

        all_chunks = []
        for f in files:
            all_chunks.extend(self._chunk_file(f))

        if not all_chunks:
            return 0

        BATCH = 100
        total_indexed = 0

        for start in range(0, len(all_chunks), BATCH):
            batch = all_chunks[start : start + BATCH]
            texts = [c["text"] for c in batch]
            ids = [c["id"] for c in batch]
            metadatas = [c["metadata"] for c in batch]

            embeddings = self._embed(texts)

            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )
            total_indexed += len(batch)

            if progress_callback:
                progress_callback(total_indexed, len(all_chunks))

        logger.info(f"Indexed {total_indexed} chunks for repo {repo_id}")
        return total_indexed

    # ─── Retrieval ────────────────────────────────────────────────────────

    def search(
        self,
        repo_id: int,
        query: str,
        top_k: int = 8,
        file_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Semantic search over indexed code chunks.
        Returns ranked list of {text, path, start_line, end_line, score}.
        """
        collection = self.get_or_create_collection(repo_id)
        query_emb = self._embed([query])[0]

        where = {"path": {"$eq": file_filter}} if file_filter else None

        results = collection.query(
            query_embeddings=[query_emb],
            n_results=min(top_k, collection.count() or 1),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        chunks = []
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            chunks.append({
                "text": doc,
                "path": meta["path"],
                "start_line": meta["start_line"],
                "end_line": meta["end_line"],
                "language": meta["language"],
                "score": round(1 - dist, 4),   # cosine similarity
            })

        return chunks

    def get_collection_stats(self, repo_id: int) -> Dict[str, Any]:
        collection = self.get_or_create_collection(repo_id)
        return {"total_chunks": collection.count()}
