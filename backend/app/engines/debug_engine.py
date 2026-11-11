"""
DevPilot AI - AI Debugging Engine
The core intelligence: bug detection, security audit, code review,
test generation, fix suggestions, and PR review — all powered by LLMs + RAG.
"""

import time
import logging
from typing import Dict, Any, List, Optional

from openai import OpenAI
from app.core.config import settings
from app.engines.rag_engine import RAGEngine

logger = logging.getLogger(__name__)


SYSTEM_PROMPTS = {
    "bug_detection": """You are DevPilot AI — an expert software debugger.
Analyze the provided code and identify ALL bugs:
- Logic errors, off-by-one, null/None dereferences
- Race conditions, deadlocks, resource leaks
- Exception handling gaps
- Performance anti-patterns

For EACH bug output:
{
  "severity": "critical|high|medium|low",
  "type": "LogicError|NullPointer|ResourceLeak|...",
  "file": "path/to/file.py",
  "line_range": "10-15",
  "description": "...",
  "root_cause": "...",
  "fix": "exact corrected code snippet"
}

Return a JSON array of bug objects. Be precise and thorough.""",

    "security_audit": """You are DevPilot AI — a security expert (OWASP Top 10 specialist).
Analyze the code for vulnerabilities:
- SQL Injection, XSS, CSRF
- Hardcoded secrets/credentials
- Insecure deserialization, path traversal
- Broken authentication, IDOR
- Outdated dependencies (mention if detectable)

For EACH issue output:
{
  "severity": "critical|high|medium|low|info",
  "cve_type": "OWASP category or CWE",
  "file": "path/to/file",
  "line_range": "10-15",
  "description": "...",
  "attack_scenario": "how an attacker could exploit this",
  "remediation": "exact fix or code change"
}

Return a JSON array.""",

    "code_review": """You are DevPilot AI — a senior software engineer doing a thorough code review.
Evaluate the code for:
- Code quality and readability
- Design patterns and architecture
- DRY, SOLID, KISS principles
- Naming conventions and documentation
- Test coverage hints
- Performance considerations

Return a structured JSON:
{
  "overall_score": 1-10,
  "summary": "...",
  "strengths": ["..."],
  "issues": [{"severity": "...", "category": "...", "file": "...", "line_range": "...", "description": "...", "suggestion": "..."}],
  "refactoring_suggestions": ["..."]
}""",

    "test_generation": """You are DevPilot AI — a test engineering expert.
Generate comprehensive unit tests for the provided code using the appropriate testing framework.
- Cover happy paths, edge cases, and error cases
- Use mocking where appropriate
- Add docstrings explaining what each test verifies

Return JSON:
{
  "framework": "pytest|jest|junit|...",
  "test_file_path": "tests/test_xxx.py",
  "test_code": "...complete test file...",
  "coverage_areas": ["..."],
  "total_tests": N
}""",

    "explain_code": """You are DevPilot AI — a patient senior developer explaining code to a junior.
Provide a detailed explanation of the code:
- Overall purpose and design
- Key algorithms and data structures used
- Flow of execution
- Non-obvious patterns or tricks
- Potential improvements

Return JSON:
{
  "summary": "...",
  "purpose": "...",
  "key_concepts": ["..."],
  "execution_flow": ["step1", "step2", "..."],
  "complexity": {"time": "O(...)", "space": "O(...)"},
  "improvement_ideas": ["..."]
}""",

    "fix_suggestion": """You are DevPilot AI — an expert debugger fixing a reported bug.
Given the bug description and relevant code, provide:
- Root cause analysis
- Multiple fix options (ranked by quality)
- The recommended fix as a complete, corrected code block
- Tests to verify the fix

Return JSON:
{
  "root_cause": "...",
  "explanation": "...",
  "fixes": [
    {"option": 1, "description": "...", "code": "...", "tradeoffs": "..."},
    {"option": 2, ...}
  ],
  "recommended_fix": "...",
  "verification_steps": ["..."]
}""",

    "pr_review": """You are DevPilot AI — performing an automated pull request review.
Analyze the PR diff provided:
- Correctness and logic of changes
- Security implications
- Performance impact
- Test coverage of changes
- Code style consistency
- Potential merge conflicts or breakage

Return JSON:
{
  "verdict": "approve|request_changes|comment",
  "summary": "...",
  "score": 1-10,
  "issues": [{"severity": "...", "file": "...", "line": "...", "comment": "..."}],
  "positive_feedback": ["..."],
  "suggested_tests": ["..."],
  "pr_comment_markdown": "...formatted markdown for GitHub comment..."
}""",

    "chat": """You are DevPilot AI — an intelligent code assistant.
Answer the user's question about the codebase concisely and accurately.
Reference specific files and line numbers when relevant.
If you are unsure, say so rather than guessing.
Return plain markdown text (not JSON).""",
}


class DebugEngine:
    """
    Orchestrates LLM calls with RAG context for all analysis types.
    """

    def __init__(self):
        self.openai = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.rag = RAGEngine()

    # ─── Core LLM call ────────────────────────────────────────────────────

    def _call_llm(
        self,
        system_prompt: str,
        user_message: str,
        json_mode: bool = True,
    ) -> Dict[str, Any]:
        """Call OpenAI chat completion, optionally in JSON mode."""
        kwargs = {
            "model": settings.LLM_MODEL,
            "temperature": settings.LLM_TEMPERATURE,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = self.openai.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        tokens = response.usage.total_tokens

        if json_mode:
            import json
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = {"raw": content, "parse_error": True}
        else:
            parsed = {"markdown": content}

        return {"result": parsed, "tokens_used": tokens}

    # ─── Context builder ──────────────────────────────────────────────────

    def _build_context(
        self,
        repo_id: int,
        query: str,
        file_content: Optional[str] = None,
        file_path: Optional[str] = None,
        top_k: int = 6,
    ) -> str:
        """Build the user message combining RAG chunks + direct file content."""
        parts = []

        # If a specific file is provided, use it directly
        if file_content:
            parts.append(f"### File: {file_path or 'provided'}\n```\n{file_content[:8000]}\n```")

        # Always augment with semantically relevant chunks from the repo
        try:
            chunks = self.rag.search(repo_id, query, top_k=top_k)
            if chunks and not file_content:
                parts.append("### Relevant code chunks from the repository:")
                for c in chunks:
                    parts.append(
                        f"#### {c['path']} (lines {c['start_line']}–{c['end_line']}, score={c['score']})\n"
                        f"```{c['language']}\n{c['text']}\n```"
                    )
        except Exception as e:
            logger.warning(f"RAG search failed: {e}")

        parts.append(f"\n### User Query / Task\n{query}")
        return "\n\n".join(parts)

    # ─── Analysis methods ─────────────────────────────────────────────────

    def analyze(
        self,
        analysis_type: str,
        repo_id: int,
        query: str,
        file_content: Optional[str] = None,
        file_path: Optional[str] = None,
        extra_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Run a named analysis type against a repo.
        Returns {result, tokens_used, duration_ms, confidence_score}.
        """
        start_ms = time.time() * 1000

        system_prompt = SYSTEM_PROMPTS.get(analysis_type, SYSTEM_PROMPTS["chat"])
        is_json = analysis_type != "chat"

        context = self._build_context(
            repo_id=repo_id,
            query=query,
            file_content=file_content,
            file_path=file_path,
        )
        if extra_context:
            context += f"\n\n### Additional Context\n{extra_context}"

        llm_out = self._call_llm(system_prompt, context, json_mode=is_json)

        duration_ms = int(time.time() * 1000 - start_ms)

        return {
            "result": llm_out["result"],
            "tokens_used": llm_out["tokens_used"],
            "duration_ms": duration_ms,
            "confidence_score": self._estimate_confidence(llm_out["result"]),
        }

    def _estimate_confidence(self, result: Any) -> float:
        """Heuristic confidence score based on result richness."""
        if not result or (isinstance(result, dict) and result.get("parse_error")):
            return 0.3
        if isinstance(result, list):
            return min(0.95, 0.6 + len(result) * 0.05)
        if isinstance(result, dict):
            keys = len([v for v in result.values() if v])
            return min(0.95, 0.5 + keys * 0.05)
        return 0.7

    # ─── Convenience wrappers ─────────────────────────────────────────────

    def detect_bugs(self, repo_id: int, file_content: str, file_path: str) -> Dict:
        return self.analyze("bug_detection", repo_id, f"Detect all bugs in {file_path}", file_content, file_path)

    def security_audit(self, repo_id: int, file_content: str, file_path: str) -> Dict:
        return self.analyze("security_audit", repo_id, f"Security audit of {file_path}", file_content, file_path)

    def code_review(self, repo_id: int, file_content: str, file_path: str) -> Dict:
        return self.analyze("code_review", repo_id, f"Full code review of {file_path}", file_content, file_path)

    def generate_tests(self, repo_id: int, file_content: str, file_path: str) -> Dict:
        return self.analyze("test_generation", repo_id, f"Generate unit tests for {file_path}", file_content, file_path)

    def explain_code(self, repo_id: int, file_content: str, file_path: str) -> Dict:
        return self.analyze("explain_code", repo_id, f"Explain the code in {file_path}", file_content, file_path)

    def suggest_fix(self, repo_id: int, bug_description: str, file_content: str, file_path: str) -> Dict:
        return self.analyze("fix_suggestion", repo_id, bug_description, file_content, file_path)

    def review_pr(self, repo_id: int, pr_data: Dict) -> Dict:
        pr_text = f"PR #{pr_data['pr_number']}: {pr_data['title']}\n\n"
        for f in pr_data.get("changed_files", [])[:20]:
            pr_text += f"\n--- {f['filename']} ({f['status']}) ---\n{f['patch'][:3000]}\n"
        return self.analyze("pr_review", repo_id, pr_text)

    def chat(self, repo_id: int, message: str) -> Dict:
        return self.analyze("chat", repo_id, message)
