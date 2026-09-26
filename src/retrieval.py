"""
src/retrieval.py
----------------
Lexical retrieval layer for the SMSWS MVP.

Searches source_chunks in SQLite using keyword scoring. This layer is
intentionally simple for the MVP — architecture allows later replacement
with BM25 + dense embeddings without frontend changes.

SAFETY: Read-only. No INSERT/UPDATE/DELETE.
"""

from __future__ import annotations

import re
import sqlite3
from typing import Optional

from src.models import ApplicantProfile, SourceEvidence
from src.demo_corpus import SECTOR_KEYWORDS, SECTOR_TO_CORPUS, DEMO_CORPUS_FILENAMES


class LexicalRetriever:
    """
    Keyword-based chunk retrieval over source_chunks.

    Retrieval strategy:
    1. Resolve the sector → relevant corpus document filenames.
    2. Build keyword list from sector + product description.
    3. For each candidate chunk, count keyword hits → relevance score.
    4. Return top-k chunks sorted by score.
    """

    def __init__(self, db_path: str = "db/policy_engine.db", top_k: int = 8):
        self.db_path = db_path
        self.top_k = top_k

    def _get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA query_only = ON")
        return conn

    def _build_keywords(self, profile: ApplicantProfile) -> list[str]:
        """Combine sector keywords with words from the free-text description."""
        sector_label = profile.sector.value
        keywords: list[str] = list(SECTOR_KEYWORDS.get(sector_label, []))

        # Add words from product description
        if profile.product_description:
            desc_words = re.findall(r"[a-zA-Z]{4,}", profile.product_description.lower())
            keywords.extend(desc_words)

        # Add location keywords
        if profile.location_type:
            keywords.append(profile.location_type.value.lower())
        if profile.district:
            keywords.append(profile.district.lower())

        # Add stage keywords
        if profile.stage:
            keywords.append(profile.stage.value.lower())

        # Deduplicate, lowercase
        seen: set[str] = set()
        result: list[str] = []
        for k in keywords:
            kl = k.strip().lower()
            if kl and kl not in seen:
                seen.add(kl)
                result.append(kl)
        return result

    def _resolve_document_ids(self, profile: ApplicantProfile) -> list[str]:
        """Get document_ids from the DB for the sector's corpus categories."""
        sector_label = profile.sector.value
        categories = SECTOR_TO_CORPUS.get(sector_label, ["industrial_policy", "single_window"])

        # Collect filenames for these categories
        filenames: list[str] = []
        for cat in categories:
            filenames.extend(DEMO_CORPUS_FILENAMES.get(cat, []))

        # Always include single_window docs
        for fn in DEMO_CORPUS_FILENAMES.get("single_window", []):
            if fn not in filenames:
                filenames.append(fn)

        if not filenames:
            return []

        conn = self._get_conn()
        placeholders = ",".join("?" * len(filenames))
        rows = conn.execute(
            f"SELECT document_id FROM documents WHERE filename IN ({placeholders}) "
            f"AND processing_status='EXTRACTED'",
            filenames,
        ).fetchall()
        conn.close()
        return [r["document_id"] for r in rows]

    def _score_chunk(self, text: str, keywords: list[str]) -> float:
        """Count keyword occurrences (case-insensitive) in chunk text."""
        if not text:
            return 0.0
        text_lower = text.lower()
        hits = sum(1 for kw in keywords if kw in text_lower)
        # Normalize: score = hits / max(1, len(keywords))
        return round(hits / max(1, len(keywords)), 4)

    def retrieve(
        self,
        profile: ApplicantProfile,
        extra_keywords: Optional[list[str]] = None,
    ) -> list[SourceEvidence]:
        """
        Retrieve top-k relevant chunks for the given applicant profile.

        Returns SourceEvidence list sorted by descending relevance score.
        """
        keywords = self._build_keywords(profile)
        if extra_keywords:
            keywords.extend(extra_keywords)

        doc_ids = self._resolve_document_ids(profile)
        if not doc_ids:
            return []

        conn = self._get_conn()
        placeholders = ",".join("?" * len(doc_ids))
        chunks = conn.execute(
            f"""
            SELECT
                sc.chunk_id, sc.document_id, sc.page_start, sc.page_end,
                sc.section_reference, sc.verbatim_text,
                d.filename, d.source_url,
                (SELECT dp.extraction_method FROM document_pages dp
                 WHERE dp.document_id=sc.document_id AND dp.page_number=sc.page_start
                 LIMIT 1) as extraction_method
            FROM source_chunks sc
            JOIN documents d ON d.document_id = sc.document_id
            WHERE sc.document_id IN ({placeholders})
            AND sc.verbatim_text IS NOT NULL
            AND TRIM(sc.verbatim_text) != ''
            """,
            doc_ids,
        ).fetchall()
        conn.close()

        # Score and filter
        scored: list[tuple[float, dict]] = []
        for c in chunks:
            score = self._score_chunk(c["verbatim_text"], keywords)
            if score > 0:
                scored.append((score, dict(c)))

        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)

        results: list[SourceEvidence] = []
        for score, c in scored[: self.top_k]:
            results.append(
                SourceEvidence(
                    chunk_id=c["chunk_id"],
                    document_id=c["document_id"],
                    filename=c["filename"],
                    source_url=c.get("source_url"),
                    page_start=c["page_start"],
                    page_end=c["page_end"],
                    section_reference=c.get("section_reference"),
                    extraction_method=c.get("extraction_method"),
                    relevance_score=score,
                    text=c["verbatim_text"],
                )
            )
        return results


    def get_chunk_by_id(self, chunk_id: str) -> Optional[SourceEvidence]:
        """Retrieve a single chunk by its chunk_id for the source detail view."""
        conn = self._get_conn()
        row = conn.execute(
            """
            SELECT sc.chunk_id, sc.document_id, sc.page_start, sc.page_end,
                   sc.section_reference, sc.verbatim_text, d.filename, d.source_url,
                   (SELECT dp.extraction_method FROM document_pages dp
                    WHERE dp.document_id=sc.document_id AND dp.page_number=sc.page_start
                    LIMIT 1) as extraction_method
            FROM source_chunks sc
            JOIN documents d ON d.document_id = sc.document_id
            WHERE sc.chunk_id = ?
            """,
            (chunk_id,),
        ).fetchone()
        conn.close()
        if not row:
            return None
        return SourceEvidence(
            chunk_id=row["chunk_id"],
            document_id=row["document_id"],
            filename=row["filename"],
            source_url=row.get("source_url"),
            page_start=row["page_start"],
            page_end=row["page_end"],
            section_reference=row.get("section_reference"),
            extraction_method=row.get("extraction_method"),
            relevance_score=1.0,
            text=row["verbatim_text"],
        )

