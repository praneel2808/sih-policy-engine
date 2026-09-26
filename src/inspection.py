"""
src/inspection.py
-----------------
Read-only inspection and reporting tool for the SMSWS knowledge base.

Inspects db/policy_engine.db and generates:
  - inspection_report/inspection_report.html
  - inspection_report/inspection_report.md
  - inspection_report/inspection_summary.json

CLI:
  python -m src.inspection [--db <path>] [--out <dir>] [--limit <n>]

SAFETY: This module is strictly read-only. It issues only SELECT statements
and schema inspection queries. No INSERT, UPDATE, DELETE, DROP, or ALTER.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import sqlite3
import sys
import textwrap
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Any, Optional

# ─────────────────────────────────────────────────────────────────────────────
# Default paths
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_DB = "db/policy_engine.db"
DEFAULT_OUT = "inspection_report"

# Representative sample documents: (filename_fragment, description, priority)
SAMPLE_TARGETS = [
    ("039_Land", "English-only regulatory act"),
    ("034_Bio", "OCR-heavy Marathi document"),
    ("043_Modification", "OCR + English – MMR location policy"),
    ("001_Bamboo", "Bilingual OCR-heavy policy"),
    ("053_Package", "Incentive/scheme document (Package Scheme of Incentives)"),
    ("032a_IT", "Large bilingual IT policy"),
    ("068_Shop", "Low chunk count – shop & establishment (1 chunk for 6 pages)"),
    ("057_Maharashtra-Green", "Marathi-only – no English sections extracted"),
]


# ─────────────────────────────────────────────────────────────────────────────
# Data structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class OverallSummary:
    registered_documents: int = 0
    extracted: int = 0
    failed: int = 0
    deferred: int = 0
    other_status: int = 0
    total_stored_pages: int = 0
    nonempty_pages: int = 0
    pymupdf_pages: int = 0
    ocr_pages: int = 0
    ocr_failed_pages: int = 0
    lang_en: int = 0
    lang_mr: int = 0
    lang_hi: int = 0
    lang_unknown: int = 0
    lang_null: int = 0
    total_english_sections: int = 0
    total_source_chunks: int = 0
    nonempty_chunks: int = 0
    candidate_rules: int = 0
    gemini_jobs: int = 0
    generated_at: str = ""


@dataclass
class DocumentRow:
    filename: str
    status: str
    declared_pages: Optional[int]
    stored_pages: int
    nonempty_pages: int
    ocr_pages: int
    ocr_failed_pages: int
    lang_en: int
    lang_mr: int
    lang_hi: int
    lang_unknown: int
    lang_null: int
    english_sections: int
    chunks: int
    skip_reason: Optional[str]
    warnings: list[str] = field(default_factory=list)


@dataclass
class SamplePage:
    filename: str
    description: str
    page_number: int
    extraction_method: str
    ocr_applied: bool
    character_count: int
    language: Optional[str]
    language_confidence: Optional[float]
    text_snippet: str  # first 800 chars of stored text


@dataclass
class OcrFailureRecord:
    filename: str
    page_number: int
    character_count: int
    language: Optional[str]


# ─────────────────────────────────────────────────────────────────────────────
# DB helpers – all read-only
# ─────────────────────────────────────────────────────────────────────────────

def _open_db(db_path: str) -> sqlite3.Connection:
    """Open SQLite in read-only URI mode."""
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database not found: {db_path}")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    # Verify no write operations accidentally slip through
    conn.execute("PRAGMA query_only = ON")
    return conn


def _table_exists(conn: sqlite3.Connection, name: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()
    return row is not None


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(r["name"] == column for r in rows)


def _count(conn: sqlite3.Connection, table: str, where: str = "", params: tuple = ()) -> int:
    sql = f"SELECT COUNT(*) FROM {table}"
    if where:
        sql += f" WHERE {where}"
    return conn.execute(sql, params).fetchone()[0]


# ─────────────────────────────────────────────────────────────────────────────
# Data collection
# ─────────────────────────────────────────────────────────────────────────────

def collect_summary(conn: sqlite3.Connection) -> OverallSummary:
    s = OverallSummary()
    s.generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if not _table_exists(conn, "documents"):
        return s

    s.registered_documents = _count(conn, "documents")
    s.extracted = _count(conn, "documents", "processing_status='EXTRACTED'")
    s.failed = _count(conn, "documents", "processing_status='FAILED'")
    s.deferred = _count(conn, "documents", "processing_status='DEFERRED'")
    s.other_status = s.registered_documents - s.extracted - s.failed - s.deferred

    if _table_exists(conn, "document_pages"):
        s.total_stored_pages = _count(conn, "document_pages")
        s.nonempty_pages = _count(conn, "document_pages", "character_count > 0")
        s.pymupdf_pages = _count(conn, "document_pages", "extraction_method='pymupdf'")
        s.ocr_pages = _count(conn, "document_pages", "ocr_applied=1")
        s.ocr_failed_pages = _count(conn, "document_pages", "extraction_method='ocr_failed'")
        s.lang_en = _count(conn, "document_pages", "language='en'")
        s.lang_mr = _count(conn, "document_pages", "language='mr'")
        s.lang_hi = _count(conn, "document_pages", "language='hi'")
        s.lang_unknown = _count(conn, "document_pages", "language='unknown'")
        s.lang_null = _count(conn, "document_pages", "language IS NULL")

    if _table_exists(conn, "english_sections"):
        s.total_english_sections = _count(conn, "english_sections")

    if _table_exists(conn, "source_chunks"):
        s.total_source_chunks = _count(conn, "source_chunks")
        s.nonempty_chunks = _count(
            conn, "source_chunks",
            "verbatim_text IS NOT NULL AND TRIM(verbatim_text) != ''"
        )

    if _table_exists(conn, "candidate_rules"):
        s.candidate_rules = _count(conn, "candidate_rules")

    if _table_exists(conn, "gemini_jobs"):
        s.gemini_jobs = _count(conn, "gemini_jobs")

    return s


def collect_documents(conn: sqlite3.Connection) -> list[DocumentRow]:
    if not _table_exists(conn, "documents"):
        return []

    rows = conn.execute("""
        SELECT
            d.filename,
            d.processing_status,
            d.page_count AS declared_pages,
            d.skip_reason,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id) AS stored_pages,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.character_count>0) AS nonempty_pages,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.ocr_applied=1) AS ocr_pages,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.extraction_method='ocr_failed') AS ocr_failed_pages,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.language='en') AS lang_en,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.language='mr') AS lang_mr,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.language='hi') AS lang_hi,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.language='unknown') AS lang_unknown,
            (SELECT COUNT(*) FROM document_pages dp WHERE dp.document_id=d.document_id AND dp.language IS NULL) AS lang_null,
            (SELECT COUNT(*) FROM english_sections es WHERE es.document_id=d.document_id) AS english_sections,
            (SELECT COUNT(*) FROM source_chunks sc WHERE sc.document_id=d.document_id) AS chunks
        FROM documents d
        ORDER BY
            CASE d.processing_status WHEN 'FAILED' THEN 0 WHEN 'DEFERRED' THEN 1 ELSE 2 END,
            d.filename
    """).fetchall()

    result: list[DocumentRow] = []
    for r in rows:
        dr = DocumentRow(
            filename=r["filename"],
            status=r["processing_status"],
            declared_pages=r["declared_pages"],
            stored_pages=r["stored_pages"],
            nonempty_pages=r["nonempty_pages"],
            ocr_pages=r["ocr_pages"],
            ocr_failed_pages=r["ocr_failed_pages"],
            lang_en=r["lang_en"],
            lang_mr=r["lang_mr"],
            lang_hi=r["lang_hi"],
            lang_unknown=r["lang_unknown"],
            lang_null=r["lang_null"],
            english_sections=r["english_sections"],
            chunks=r["chunks"],
            skip_reason=r["skip_reason"],
        )
        dr.warnings = _generate_warnings(dr)
        result.append(dr)
    return result


def _generate_warnings(dr: DocumentRow) -> list[str]:
    """Generate human-readable quality warnings for a document row.

    Uses cautious language – these are observations, not verdicts.
    """
    w: list[str] = []
    if dr.status == "FAILED":
        reason = dr.skip_reason or "no reason stored"
        w.append(f"Document is marked FAILED — reason: {reason}")
    if dr.status == "DEFERRED":
        reason = dr.skip_reason or "no reason stored"
        w.append(f"Document is DEFERRED — reason: {reason}")
    if dr.status == "EXTRACTED":
        if dr.chunks == 0:
            w.append("WARNING: 0 chunks produced — inspect extraction quality.")
        elif dr.stored_pages > 0 and dr.chunks < max(1, dr.stored_pages // 10):
            w.append(
                f"WARNING: Unusually low chunk count ({dr.chunks}) relative to stored pages "
                f"({dr.stored_pages}); inspect extraction quality."
            )
        if dr.ocr_failed_pages > 0:
            w.append(
                f"WARNING: {dr.ocr_failed_pages} page(s) with explicit OCR failure recorded."
            )
        if dr.stored_pages > 0 and dr.nonempty_pages == 0:
            w.append("WARNING: All stored pages have 0 characters — possible blank/empty document.")
        if dr.stored_pages > 0 and dr.ocr_pages == dr.stored_pages:
            w.append("WARNING: Every page required OCR — native text may be absent.")
        if dr.declared_pages and dr.stored_pages and dr.stored_pages != dr.declared_pages:
            w.append(
                f"WARNING: Declared page count ({dr.declared_pages}) differs from stored "
                f"page count ({dr.stored_pages}) — possible partial extraction."
            )
        if dr.stored_pages > 0 and dr.lang_en == 0 and dr.english_sections > 0:
            w.append("WARNING: English sections recorded but 0 English pages detected.")
        if dr.stored_pages > 5 and dr.lang_unknown + dr.lang_null > dr.stored_pages // 2:
            w.append(
                f"WARNING: More than half the pages have unknown/null language detection "
                f"({dr.lang_unknown + dr.lang_null} of {dr.stored_pages})."
            )
    return w


def collect_samples(conn: sqlite3.Connection) -> list[SamplePage]:
    """Collect real stored text samples for representative document types."""
    samples: list[SamplePage] = []
    if not _table_exists(conn, "document_pages"):
        return samples

    for frag, desc in SAMPLE_TARGETS:
        doc_row = conn.execute(
            "SELECT document_id, filename, processing_status FROM documents WHERE filename LIKE ?",
            (f"%{frag}%",)
        ).fetchone()
        if not doc_row:
            continue
        did = doc_row["document_id"]
        fn = doc_row["filename"]

        # Pick 2 representative pages: first non-empty page and first OCR page (if exists)
        pages = conn.execute(
            """SELECT page_number, extraction_method, ocr_applied, character_count,
                      language, language_confidence, text
               FROM document_pages
               WHERE document_id=? AND character_count > 0
               ORDER BY page_number
               LIMIT 2""",
            (did,)
        ).fetchall()

        for p in pages:
            raw_text = p["text"] or ""
            snippet = raw_text[:800]
            samples.append(SamplePage(
                filename=fn,
                description=desc,
                page_number=p["page_number"],
                extraction_method=p["extraction_method"] or "",
                ocr_applied=bool(p["ocr_applied"]),
                character_count=p["character_count"] or 0,
                language=p["language"],
                language_confidence=p["language_confidence"],
                text_snippet=snippet,
            ))

    return samples


def collect_ocr_failures(conn: sqlite3.Connection) -> list[OcrFailureRecord]:
    if not _table_exists(conn, "document_pages"):
        return []
    rows = conn.execute("""
        SELECT d.filename, dp.page_number, dp.character_count, dp.language
        FROM document_pages dp
        JOIN documents d ON d.document_id = dp.document_id
        WHERE dp.extraction_method = 'ocr_failed'
        ORDER BY d.filename, dp.page_number
    """).fetchall()
    return [
        OcrFailureRecord(
            filename=r["filename"],
            page_number=r["page_number"],
            character_count=r["character_count"] or 0,
            language=r["language"],
        )
        for r in rows
    ]


# ─────────────────────────────────────────────────────────────────────────────
# JSON report
# ─────────────────────────────────────────────────────────────────────────────

def build_json(
    summary: OverallSummary,
    docs: list[DocumentRow],
    samples: list[SamplePage],
    failures: list[OcrFailureRecord],
) -> dict[str, Any]:
    all_warnings = []
    for d in docs:
        for w in d.warnings:
            all_warnings.append({"filename": d.filename, "warning": w})

    return {
        "generated_at": summary.generated_at,
        "summary": asdict(summary),
        "documents": [
            {
                "filename": d.filename,
                "status": d.status,
                "declared_pages": d.declared_pages,
                "stored_pages": d.stored_pages,
                "nonempty_pages": d.nonempty_pages,
                "ocr_pages": d.ocr_pages,
                "ocr_failed_pages": d.ocr_failed_pages,
                "lang_en": d.lang_en,
                "lang_mr": d.lang_mr,
                "lang_hi": d.lang_hi,
                "lang_unknown": d.lang_unknown,
                "lang_null": d.lang_null,
                "english_sections": d.english_sections,
                "chunks": d.chunks,
                "skip_reason": d.skip_reason,
                "warnings": d.warnings,
            }
            for d in docs
        ],
        "warnings": all_warnings,
        "ocr_failures": [
            {
                "filename": f.filename,
                "page_number": f.page_number,
                "character_count": f.character_count,
                "language": f.language,
            }
            for f in failures
        ],
        "sample_pages": [
            {
                "filename": s.filename,
                "description": s.description,
                "page_number": s.page_number,
                "extraction_method": s.extraction_method,
                "ocr_applied": s.ocr_applied,
                "character_count": s.character_count,
                "language": s.language,
                "language_confidence": s.language_confidence,
                "text_snippet": s.text_snippet,
            }
            for s in samples
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Markdown report
# ─────────────────────────────────────────────────────────────────────────────

def build_markdown(
    summary: OverallSummary,
    docs: list[DocumentRow],
    samples: list[SamplePage],
    failures: list[OcrFailureRecord],
) -> str:
    lines: list[str] = []
    A = lines.append

    A("# SMSWS Knowledge Base Inspection Report")
    A(f"\n_Generated: {summary.generated_at}_")

    A("\n---\n")
    A("## Overall Summary\n")
    A(f"| Metric | Value |")
    A(f"|--------|-------|")
    A(f"| Registered documents | {summary.registered_documents} |")
    A(f"| Successfully extracted (EXTRACTED) | {summary.extracted} |")
    A(f"| Failed (FAILED) | {summary.failed} |")
    A(f"| Deferred (DEFERRED) | {summary.deferred} |")
    A(f"| Total stored pages | {summary.total_stored_pages} |")
    A(f"| Non-empty pages (char_count > 0) | {summary.nonempty_pages} |")
    A(f"| Pages extracted natively (PyMuPDF) | {summary.pymupdf_pages} |")
    A(f"| Pages extracted via OCR (success) | {summary.ocr_pages} |")
    A(f"| Pages with OCR failure | {summary.ocr_failed_pages} |")
    A(f"| Pages detected as English | {summary.lang_en} |")
    A(f"| Pages detected as Marathi | {summary.lang_mr} |")
    A(f"| Pages detected as Hindi | {summary.lang_hi} |")
    A(f"| Pages with unknown language | {summary.lang_unknown} |")
    A(f"| Pages with null language | {summary.lang_null} |")
    A(f"| English sections identified | {summary.total_english_sections} |")
    A(f"| Source chunks indexed | {summary.total_source_chunks} |")
    A(f"| Non-empty chunks | {summary.nonempty_chunks} |")
    A(f"| Candidate rules extracted | {summary.candidate_rules} |")
    A(f"| **Gemini jobs** | **{summary.gemini_jobs}** ← should be 0 for local ingestion |")

    A("\n> **Note:** A PAGE is not a CHUNK. Pages represent individual PDF pages as")
    A("> extracted. Chunks are larger semantic units derived from one or more pages for RAG.")

    # Warnings section
    all_warnings = [(d.filename, w) for d in docs for w in d.warnings]
    A("\n---\n")
    A("## Quality Warnings\n")
    if all_warnings:
        A(f"Found **{len(all_warnings)}** quality observation(s):\n")
        for fn, w in all_warnings:
            A(f"- **`{fn}`**: {w}")
    else:
        A("_No quality warnings detected._")

    # OCR failures
    A("\n---\n")
    A("## OCR Failure Records\n")
    if failures:
        A(f"Found **{len(failures)}** page(s) with explicit OCR failure:\n")
        A("| Filename | Page | Char Count | Language |")
        A("|----------|------|-----------|----------|")
        for f in failures:
            A(f"| `{f.filename}` | {f.page_number} | {f.character_count} | {f.language or '—'} |")
    else:
        A("_No OCR failure records found._")

    # Document table
    A("\n---\n")
    A("## Document-by-Document View\n")
    A("Sorted: FAILED first, then DEFERRED, then EXTRACTED.\n")
    A("| Filename | Status | Declared | Stored | Non-empty | OCR | OCR Fail | EN | MR | HI | Unk | Sections | Chunks | Warnings |")
    A("|----------|--------|----------|--------|-----------|-----|----------|----|----|----|-----|----------|--------|----------|")
    for d in docs:
        warn_flag = f"⚠ {len(d.warnings)}" if d.warnings else "✓"
        A(f"| `{d.filename}` | {d.status} | {d.declared_pages or '—'} | {d.stored_pages} | {d.nonempty_pages} | {d.ocr_pages} | {d.ocr_failed_pages} | {d.lang_en} | {d.lang_mr} | {d.lang_hi} | {d.lang_unknown + d.lang_null} | {d.english_sections} | {d.chunks} | {warn_flag} |")

    # Failed document details
    failed = [d for d in docs if d.status == "FAILED"]
    if failed:
        A("\n---\n")
        A("## Failed Document Details\n")
        for d in failed:
            A(f"### `{d.filename}`\n")
            A(f"- **Status:** {d.status}")
            A(f"- **Reason:** {d.skip_reason or 'not recorded'}")
            A(f"- **Declared pages:** {d.declared_pages or '—'}")
            A(f"- **Stored pages:** {d.stored_pages}")
            A(f"- **OCR pages:** {d.ocr_pages}")
            A(f"- **OCR failed pages:** {d.ocr_failed_pages}")
            A(f"- **Chunks:** {d.chunks}")
            A("")

    # Text samples
    A("\n---\n")
    A("## Extracted Text Samples\n")
    A("_These are the actual stored texts — not summarised by AI._\n")

    seen_files: set[str] = set()
    for s in samples:
        if s.filename not in seen_files:
            seen_files.add(s.filename)
            A(f"\n### `{s.filename}`")
            A(f"_{s.description}_\n")
        ocr_label = "OCR" if s.ocr_applied else "native PyMuPDF"
        conf_val = s.language_confidence if s.language_confidence is not None else 0.0
        A(f"**Page {s.page_number}** | Method: `{s.extraction_method}` ({ocr_label}) | "
          f"Language: `{s.language or 'unknown'}` (conf={conf_val:.3f}) | "
          f"Characters: {s.character_count}\n")
        A("```")
        A(s.text_snippet)
        A("```\n")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# HTML report
# ─────────────────────────────────────────────────────────────────────────────

_CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f6fa; color: #222; }
h1 { background: #1a3a5c; color: #fff; padding: 20px 30px; font-size: 1.6em; }
h2 { margin: 30px 30px 10px; font-size: 1.2em; color: #1a3a5c; border-bottom: 2px solid #1a3a5c; padding-bottom: 6px; }
h3 { margin: 20px 30px 6px; font-size: 1em; color: #333; }
p, ul, ol { margin: 8px 30px; line-height: 1.6; }
.subtitle { color: #cce; font-size: 0.85em; margin: 4px 30px; }
.cards { display: flex; flex-wrap: wrap; gap: 14px; margin: 20px 30px; }
.card { background: #fff; border-radius: 8px; padding: 16px 22px; min-width: 180px; box-shadow: 0 2px 6px rgba(0,0,0,.08); flex: 1; }
.card .val { font-size: 2em; font-weight: bold; color: #1a3a5c; }
.card .lbl { font-size: 0.8em; color: #666; margin-top: 4px; }
.card.warn { border-left: 4px solid #e67e22; }
.card.ok { border-left: 4px solid #27ae60; }
.card.danger { border-left: 4px solid #c0392b; }
.card.info { border-left: 4px solid #2980b9; }
.section { background: #fff; margin: 20px 30px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,.07); padding: 20px 24px; }
table { width: 100%; border-collapse: collapse; font-size: 0.82em; }
thead tr { background: #1a3a5c; color: #fff; }
th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #eee; vertical-align: top; }
tr:hover td { background: #f0f4ff; }
.status-EXTRACTED { color: #27ae60; font-weight: bold; }
.status-FAILED { color: #c0392b; font-weight: bold; }
.status-DEFERRED { color: #e67e22; font-weight: bold; }
.warn-cell { color: #e67e22; }
.ok-cell { color: #27ae60; }
.warn-list { list-style: none; padding: 0; }
.warn-list li { padding: 6px 10px; margin: 4px 0; background: #fff8e1; border-left: 3px solid #e67e22; border-radius: 3px; font-size: 0.85em; }
.danger-list li { background: #fdecea; border-left: 3px solid #c0392b; }
details { margin: 10px 0; }
summary { cursor: pointer; font-weight: bold; color: #1a3a5c; padding: 6px 0; }
summary:hover { color: #e67e22; }
pre { background: #1e1e2e; color: #cdd6f4; padding: 14px 18px; border-radius: 6px; overflow-x: auto; font-size: 0.78em; white-space: pre-wrap; word-break: break-word; margin: 8px 0; max-height: 350px; overflow-y: auto; }
code { background: #eef; padding: 1px 5px; border-radius: 3px; font-size: 0.9em; }
.note { font-style: italic; color: #555; font-size: 0.85em; margin: 8px 0; }
.footer { text-align: center; padding: 30px; color: #999; font-size: 0.8em; margin-top: 20px; }
.lang-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; min-width: 80px; }
.lang-en { background: #2980b9; }
.lang-mr { background: #8e44ad; }
.lang-hi { background: #27ae60; }
.lang-unk { background: #bdc3c7; }
"""


def _h(text: str) -> str:
    """HTML-escape a string."""
    return html.escape(str(text) if text is not None else "")


def _status_cell(status: str) -> str:
    return f'<span class="status-{_h(status)}">{_h(status)}</span>'


def _lang_bar(en: int, mr: int, hi: int, unk: int, total: int) -> str:
    if total == 0:
        return ""
    pct = lambda n: round(n * 100 / total)
    parts = []
    if en:
        parts.append(f'<div class="lang-en" style="width:{pct(en)}%" title="EN {en}"></div>')
    if mr:
        parts.append(f'<div class="lang-mr" style="width:{pct(mr)}%" title="MR {mr}"></div>')
    if hi:
        parts.append(f'<div class="lang-hi" style="width:{pct(hi)}%" title="HI {hi}"></div>')
    if unk:
        parts.append(f'<div class="lang-unk" style="width:{pct(unk)}%" title="Unk {unk}"></div>')
    return f'<div class="lang-bar">{"".join(parts)}</div>'


def build_html(
    summary: OverallSummary,
    docs: list[DocumentRow],
    samples: list[SamplePage],
    failures: list[OcrFailureRecord],
) -> str:
    parts: list[str] = []
    W = parts.append

    W("<!DOCTYPE html>")
    W('<html lang="en"><head><meta charset="UTF-8">')
    W('<meta name="viewport" content="width=device-width,initial-scale=1">')
    W("<title>SMSWS Knowledge Base Inspection</title>")
    W(f"<style>{_CSS}</style>")
    W("</head><body>")
    W("<h1>SMSWS Knowledge Base Inspection</h1>")
    W(f'<p class="subtitle">Smart Maharashtra Single Window System &mdash; '
      f'Generated: {_h(summary.generated_at)} &mdash; Read-only inspection. No data was modified.</p>')

    # ── Summary cards ──────────────────────────────────────────────────────
    W("<h2>Overall Summary</h2>")
    W('<div class="cards">')

    def card(val: Any, lbl: str, cls: str = "info") -> None:
        W(f'<div class="card {cls}"><div class="val">{_h(str(val))}</div>'
          f'<div class="lbl">{_h(lbl)}</div></div>')

    card(summary.registered_documents, "Registered Documents", "info")
    card(summary.extracted, "Extracted (OK)", "ok")
    card(summary.failed, "Failed", "danger" if summary.failed else "ok")
    card(summary.deferred, "Deferred", "warn")
    W("</div>")

    W('<div class="cards">')
    card(summary.total_stored_pages, "Total Stored Pages", "info")
    card(summary.nonempty_pages, "Non-empty Pages", "info")
    card(summary.pymupdf_pages, "PyMuPDF Pages", "info")
    card(summary.ocr_pages, "OCR-Success Pages", "warn")
    card(summary.ocr_failed_pages, "OCR-Failed Pages", "danger" if summary.ocr_failed_pages else "ok")
    W("</div>")

    W('<div class="cards">')
    card(summary.lang_en, "English Pages", "info")
    card(summary.lang_mr, "Marathi Pages", "info")
    card(summary.lang_hi, "Hindi Pages", "info")
    card(summary.lang_unknown + summary.lang_null, "Unknown/Null Language Pages",
         "warn" if (summary.lang_unknown + summary.lang_null) > 100 else "info")
    W("</div>")

    W('<div class="cards">')
    card(summary.total_english_sections, "English Sections", "info")
    card(summary.total_source_chunks, "Source Chunks", "info")
    card(summary.nonempty_chunks, "Non-empty Chunks", "info")
    card(summary.candidate_rules, "Candidate Rules Extracted", "ok")
    W("</div>")

    W('<div class="section">')
    W('<p class="note">&#9432;&nbsp;<strong>Important distinction:</strong> A <em>page</em> '
      'is one extracted PDF page. A <em>chunk</em> is a larger semantic text unit '
      'derived from one or more pages, used for RAG retrieval. '
      'Low chunk counts relative to pages are not automatically errors '
      '— they reflect how the chunker grouped text.</p>')
    W("</div>")

    # ── Quality warnings ───────────────────────────────────────────────────
    all_warnings = [(d.filename, w) for d in docs for w in d.warnings]
    W("<h2>Quality Warnings</h2>")
    W('<div class="section">')
    if all_warnings:
        W(f"<p>Found <strong>{len(all_warnings)}</strong> quality observation(s). "
          "These are observations — not automatic verdicts. Each should be manually reviewed.</p>")
        W('<ul class="warn-list">')
        for fn, w in all_warnings:
            W(f"<li><code>{_h(fn)}</code>: {_h(w)}</li>")
        W("</ul>")
    else:
        W("<p>No quality warnings detected.</p>")
    W("</div>")

    # ── OCR Failures ───────────────────────────────────────────────────────
    W("<h2>OCR Failure Records</h2>")
    W('<div class="section">')
    if failures:
        W(f"<p>Found <strong>{len(failures)}</strong> page(s) with explicit OCR failure. "
          "These pages have <code>extraction_method = 'ocr_failed'</code>. "
          "Rerun with <code>--retry-failed-ocr</code> after fixing the OCR environment.</p>")
        W("<table><thead><tr><th>Filename</th><th>Page</th><th>Char Count</th><th>Language</th></tr></thead><tbody>")
        for f in failures:
            W(f"<tr><td><code>{_h(f.filename)}</code></td><td>{f.page_number}</td>"
              f"<td>{f.character_count}</td><td>{_h(f.language or '—')}</td></tr>")
        W("</tbody></table>")
    else:
        W('<p style="color:#27ae60">&#10003; No OCR failure records found.</p>')
    W("</div>")

    # ── Document table ─────────────────────────────────────────────────────
    W("<h2>Document-by-Document View</h2>")
    W('<div class="section">')
    W('<p class="note">Sorted: FAILED first, DEFERRED next, then EXTRACTED alphabetically. '
      'Language bar: <span style="color:#2980b9">&#9646;</span> EN &nbsp;'
      '<span style="color:#8e44ad">&#9646;</span> MR &nbsp;'
      '<span style="color:#27ae60">&#9646;</span> HI &nbsp;'
      '<span style="color:#bdc3c7">&#9646;</span> Unk</p>')
    W("<table><thead><tr>")
    for hdr in ["Filename", "Status", "Declared", "Stored", "Non-empty",
                "OCR", "OCR Fail", "Languages", "Sections", "Chunks", "Flags"]:
        W(f"<th>{hdr}</th>")
    W("</tr></thead><tbody>")

    for d in docs:
        unk_total = d.lang_unknown + d.lang_null
        lang_display = _lang_bar(d.lang_en, d.lang_mr, d.lang_hi, unk_total,
                                  d.stored_pages or 1)
        lang_title = f"EN={d.lang_en} MR={d.lang_mr} HI={d.lang_hi} Unk={unk_total}"
        warn_html = ""
        if d.warnings:
            w_items = "".join(f"<li>{_h(w)}</li>" for w in d.warnings)
            warn_html = (
                f'<details><summary class="warn-cell">⚠ {len(d.warnings)}</summary>'
                f'<ul class="warn-list danger-list">{w_items}</ul></details>'
            )
        else:
            warn_html = '<span class="ok-cell">✓</span>'

        skip_cell = f'<br><small style="color:#c0392b">{_h(d.skip_reason)}</small>' if d.skip_reason else ""
        W(f"<tr>"
          f"<td><code>{_h(d.filename)}</code>{skip_cell}</td>"
          f"<td>{_status_cell(d.status)}</td>"
          f"<td>{d.declared_pages or '—'}</td>"
          f"<td>{d.stored_pages}</td>"
          f"<td>{d.nonempty_pages}</td>"
          f"<td>{d.ocr_pages}</td>"
          f"<td>{'<span style=color:#c0392b>' + str(d.ocr_failed_pages) + '</span>' if d.ocr_failed_pages else '0'}</td>"
          f'<td title="{_h(lang_title)}">{lang_display}</td>'
          f"<td>{d.english_sections}</td>"
          f"<td>{d.chunks}</td>"
          f"<td>{warn_html}</td>"
          f"</tr>")
    W("</tbody></table>")
    W("</div>")

    # ── Failed document details ────────────────────────────────────────────
    failed = [d for d in docs if d.status == "FAILED"]
    if failed:
        W("<h2>Failed Document Details</h2>")
        W('<div class="section">')
        for d in failed:
            W(f"<h3><code>{_h(d.filename)}</code></h3>")
            W("<table style='width:auto;max-width:700px'>")
            rows = [
                ("Status", d.status),
                ("Reason", d.skip_reason or "not recorded"),
                ("Declared pages", str(d.declared_pages or "—")),
                ("Stored pages", str(d.stored_pages)),
                ("OCR pages", str(d.ocr_pages)),
                ("OCR failed pages", str(d.ocr_failed_pages)),
                ("Chunks", str(d.chunks)),
            ]
            for k, v in rows:
                W(f"<tr><td><strong>{_h(k)}</strong></td><td>{_h(v)}</td></tr>")
            W("</table><br>")
        W("</div>")

    # ── Text samples ───────────────────────────────────────────────────────
    W("<h2>Extracted Text Samples (Actual Stored Text)</h2>")
    W('<div class="section">')
    W('<p class="note">These are the raw stored texts from the database — '
      'not summarised or modified by any AI.</p>')

    seen_files: set[str] = set()
    for s in samples:
        if s.filename not in seen_files:
            seen_files.add(s.filename)
            W(f"<h3><code>{_h(s.filename)}</code> &mdash; <em>{_h(s.description)}</em></h3>")

        ocr_label = "OCR" if s.ocr_applied else "native PyMuPDF"
        conf_str = f"{s.language_confidence:.3f}" if s.language_confidence is not None else "n/a"
        W(f"<details open><summary>Page {s.page_number} &nbsp;|&nbsp; "
          f"Method: <code>{_h(s.extraction_method)}</code> ({_h(ocr_label)}) &nbsp;|&nbsp; "
          f"Language: <code>{_h(s.language or 'unknown')}</code> (conf={conf_str}) &nbsp;|&nbsp; "
          f"{s.character_count:,} characters</summary>")
        W(f"<pre>{_h(s.text_snippet)}</pre></details>")

    W("</div>")

    # ── Language statistics ────────────────────────────────────────────────
    W("<h2>Language Statistics</h2>")
    W('<div class="section">')
    total_pg = summary.total_stored_pages or 1
    def pct(n: int) -> str:
        return f"{n * 100 / total_pg:.1f}%"
    rows_lang = [
        ("English (en)", summary.lang_en, pct(summary.lang_en)),
        ("Marathi (mr)", summary.lang_mr, pct(summary.lang_mr)),
        ("Hindi (hi)", summary.lang_hi, pct(summary.lang_hi)),
        ("Unknown", summary.lang_unknown, pct(summary.lang_unknown)),
        ("Null / not set", summary.lang_null, pct(summary.lang_null)),
    ]
    W("<table style='max-width:400px'>")
    W("<thead><tr><th>Language</th><th>Page Count</th><th>% of Total</th></tr></thead><tbody>")
    for lbl, cnt, p in rows_lang:
        W(f"<tr><td>{_h(lbl)}</td><td>{cnt}</td><td>{_h(p)}</td></tr>")
    W("</tbody></table>")
    W("</div>")

    # ── Extraction method statistics ───────────────────────────────────────
    W("<h2>Extraction Method Statistics</h2>")
    W('<div class="section">')
    W("<table style='max-width:400px'>")
    W("<thead><tr><th>Method</th><th>Page Count</th><th>% of Total</th></tr></thead><tbody>")
    methods = [
        ("pymupdf (native)", summary.pymupdf_pages),
        ("ocr (Tesseract success)", summary.ocr_pages),
        ("ocr_failed (Tesseract failure)", summary.ocr_failed_pages),
    ]
    for mlbl, mcnt in methods:
        W(f"<tr><td>{_h(mlbl)}</td><td>{mcnt}</td><td>{pct(mcnt)}</td></tr>")
    W("</tbody></table>")
    W("</div>")

    # ── Footer ─────────────────────────────────────────────────────────────
    W('<div class="footer">')
    W("SMSWS Knowledge Base Inspection &mdash; Read-only. No AI inference. No data modified. "
      "No Gemini called. Raw PDFs untouched.")
    W("</div>")

    W("</body></html>")
    return "\n".join(parts)


# ─────────────────────────────────────────────────────────────────────────────
# Orchestration
# ─────────────────────────────────────────────────────────────────────────────

def run_inspection(db_path: str, out_dir: str) -> dict[str, Any]:
    """Main entry point: collect data, write all three reports, return JSON data."""
    print(f"[inspection] Opening database: {db_path}")
    conn = _open_db(db_path)

    print("[inspection] Collecting summary …")
    summary = collect_summary(conn)

    print("[inspection] Collecting per-document statistics …")
    docs = collect_documents(conn)

    print("[inspection] Collecting text samples …")
    samples = collect_samples(conn)

    print("[inspection] Collecting OCR failure records …")
    failures = collect_ocr_failures(conn)

    conn.close()

    # Build reports
    json_data = build_json(summary, docs, samples, failures)
    md_text = build_markdown(summary, docs, samples, failures)
    html_text = build_html(summary, docs, samples, failures)

    # Write outputs
    os.makedirs(out_dir, exist_ok=True)

    json_path = os.path.join(out_dir, "inspection_summary.json")
    md_path = os.path.join(out_dir, "inspection_report.md")
    html_path = os.path.join(out_dir, "inspection_report.html")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    print(f"[inspection] Wrote {json_path}")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_text)
    print(f"[inspection] Wrote {md_path}")

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_text)
    print(f"[inspection] Wrote {html_path}")

    # Print human-readable console summary
    _print_console_summary(summary, docs, failures)

    return json_data


def _print_console_summary(
    summary: OverallSummary,
    docs: list[DocumentRow],
    failures: list[OcrFailureRecord],
) -> None:
    sep = "=" * 70
    print(f"\n{sep}")
    print("  SMSWS KNOWLEDGE BASE -- INSPECTION SUMMARY")
    print(sep)
    print(f"  Registered documents : {summary.registered_documents}")
    print(f"  Extracted (OK)       : {summary.extracted}")
    print(f"  Failed               : {summary.failed}")
    print(f"  Deferred             : {summary.deferred}")
    print(sep)
    print(f"  Total stored pages   : {summary.total_stored_pages}")
    print(f"  Non-empty pages      : {summary.nonempty_pages}")
    print(f"  PyMuPDF pages        : {summary.pymupdf_pages}")
    print(f"  OCR success pages    : {summary.ocr_pages}")
    print(f"  OCR failed pages     : {summary.ocr_failed_pages}")
    print(sep)
    print(f"  English pages        : {summary.lang_en}")
    print(f"  Marathi pages        : {summary.lang_mr}")
    print(f"  Hindi pages          : {summary.lang_hi}")
    print(f"  Unknown/null pages   : {summary.lang_unknown + summary.lang_null}")
    print(sep)
    print(f"  English sections     : {summary.total_english_sections}")
    print(f"  Source chunks        : {summary.total_source_chunks}")
    print(f"  Non-empty chunks     : {summary.nonempty_chunks}")
    print(f"  Candidate rules      : {summary.candidate_rules}")
    print(f"  Gemini jobs          : {summary.gemini_jobs}  <- expected 0 for local ingestion")
    print(sep)

    all_warnings = [(d.filename, w) for d in docs for w in d.warnings]
    if all_warnings:
        print(f"\n  QUALITY WARNINGS ({len(all_warnings)} total):")
        for fn, w in all_warnings:
            print(f"  [!] {fn}")
            print(f"     {w}")

    failed_docs = [d for d in docs if d.status == "FAILED"]
    if failed_docs:
        print(f"\n  FAILED DOCUMENTS ({len(failed_docs)}):")
        for d in failed_docs:
            print(f"  ✗ {d.filename}")
            print(f"    Status  : {d.status}")
            print(f"    Reason  : {d.skip_reason or 'not recorded'}")
            print(f"    Pages   : {d.stored_pages}")
            print(f"    OCR     : {d.ocr_pages}")
            print(f"    Chunks  : {d.chunks}")

    deferred_docs = [d for d in docs if d.status == "DEFERRED"]
    if deferred_docs:
        print(f"\n  DEFERRED DOCUMENTS ({len(deferred_docs)}):")
        for d in deferred_docs:
            print(f"  ⏸ {d.filename}")
            print(f"    Reason: {d.skip_reason or 'not recorded'}")

    if failures:
        print(f"\n  OCR FAILURE PAGES ({len(failures)}):")
        for f in failures[:20]:
            print(f"  ✗ {f.filename}  page={f.page_number}")
        if len(failures) > 20:
            print(f"  … and {len(failures) - 20} more (see HTML report)")

    print(f"\n{sep}\n")


# ─────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="SMSWS Knowledge Base Inspection Tool (read-only)"
    )
    parser.add_argument(
        "--db", default=DEFAULT_DB,
        help=f"Path to the SQLite database (default: {DEFAULT_DB})"
    )
    parser.add_argument(
        "--out", default=DEFAULT_OUT,
        help=f"Output directory for reports (default: {DEFAULT_OUT})"
    )
    args = parser.parse_args()

    run_inspection(db_path=args.db, out_dir=args.out)
    print(f"[inspection] Reports written to: {args.out}/")
    print(f"[inspection] Open {args.out}/inspection_report.html in a browser to view the full report.")


if __name__ == "__main__":
    main()
