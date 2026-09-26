"""
tests/test_inspection.py
------------------------
Unit tests for the src.inspection module.

All tests use a temporary in-memory or tmp_path SQLite database.
No test touches the production db/policy_engine.db.
No test calls Gemini.
No test modifies raw PDFs.
"""
from __future__ import annotations

import json
import os
import sqlite3
import tempfile
from pathlib import Path

import pytest

from src.inspection import (
    OverallSummary,
    DocumentRow,
    SamplePage,
    OcrFailureRecord,
    _open_db,
    _table_exists,
    _column_exists,
    _count,
    collect_summary,
    collect_documents,
    collect_samples,
    collect_ocr_failures,
    _generate_warnings,
    build_json,
    build_markdown,
    build_html,
    run_inspection,
    SAMPLE_TARGETS,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "..", "db", "schema.sql")


def _make_test_db(path: str) -> sqlite3.Connection:
    """Create a minimal populated test database."""
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema = f.read()

    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.executescript(schema)

    # Insert two documents
    conn.execute("""
        INSERT INTO documents (document_id, filename, processing_status, page_count, file_size)
        VALUES ('doc_ok', 'test_policy.pdf', 'EXTRACTED', 10, 100000)
    """)
    conn.execute("""
        INSERT INTO documents (document_id, filename, processing_status, page_count, file_size,
                               skip_reason)
        VALUES ('doc_fail', 'failed_policy.pdf', 'FAILED', 5, 50000,
                'Unresolved OCR failure; rerun only with explicit OCR retry.')
    """)
    conn.execute("""
        INSERT INTO documents (document_id, filename, processing_status, page_count, file_size,
                               skip_reason)
        VALUES ('doc_defer', 'large_bylaw.pdf', 'DEFERRED', 3457, 80000000,
                'Page count (3457) exceeds hard deferral limit (1500)')
    """)

    # Pages for the OK document
    for i in range(1, 11):
        lang = "en" if i % 2 == 0 else "mr"
        method = "ocr" if i <= 2 else "pymupdf"
        conn.execute("""
            INSERT INTO document_pages
              (document_id, page_number, text, extraction_method, character_count, language,
               language_confidence, ocr_applied)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, ("doc_ok", i, f"Sample text page {i} " * 20, method, 400, lang, 0.99,
              1 if method == "ocr" else 0))

    # One OCR-failed page for the failed document
    conn.execute("""
        INSERT INTO document_pages
          (document_id, page_number, text, extraction_method, character_count, language,
           language_confidence, ocr_applied)
        VALUES ('doc_fail', 1, '', 'ocr_failed', 0, NULL, NULL, 0)
    """)

    # English section for the OK document
    conn.execute("""
        INSERT INTO english_sections (document_id, start_page, end_page, page_count)
        VALUES ('doc_ok', 2, 10, 9)
    """)

    # Chunks for the OK document
    conn.execute("""
        INSERT INTO source_chunks (chunk_id, document_id, page_start, page_end, language, verbatim_text)
        VALUES ('chunk1', 'doc_ok', 1, 5, 'en', 'This is a test chunk of policy text.')
    """)
    conn.execute("""
        INSERT INTO source_chunks (chunk_id, document_id, page_start, page_end, language, verbatim_text)
        VALUES ('chunk2', 'doc_ok', 6, 10, 'en', 'Second chunk with more policy content.')
    """)

    conn.commit()
    return conn


@pytest.fixture
def tmp_db(tmp_path):
    """Fixture: returns path to a populated temporary database."""
    db_file = str(tmp_path / "test_inspection.db")
    conn = _make_test_db(db_file)
    conn.close()
    return db_file


@pytest.fixture
def tmp_conn(tmp_db):
    """Fixture: open connection to the temp DB."""
    conn = sqlite3.connect(tmp_db)
    conn.row_factory = sqlite3.Row
    yield conn
    conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# Test: DB can be opened
# ─────────────────────────────────────────────────────────────────────────────

def test_open_db_success(tmp_db):
    conn = _open_db(tmp_db)
    assert conn is not None
    conn.close()


def test_open_db_missing_file():
    with pytest.raises(FileNotFoundError):
        _open_db("/no/such/database.db")


# ─────────────────────────────────────────────────────────────────────────────
# Test: helper utilities
# ─────────────────────────────────────────────────────────────────────────────

def test_table_exists(tmp_conn):
    assert _table_exists(tmp_conn, "documents") is True
    assert _table_exists(tmp_conn, "document_pages") is True
    assert _table_exists(tmp_conn, "nonexistent_table") is False


def test_column_exists(tmp_conn):
    assert _column_exists(tmp_conn, "documents", "filename") is True
    assert _column_exists(tmp_conn, "documents", "processing_status") is True
    assert _column_exists(tmp_conn, "documents", "nonexistent_column") is False


def test_count_basic(tmp_conn):
    total = _count(tmp_conn, "documents")
    assert total == 3  # doc_ok, doc_fail, doc_defer


def test_count_with_where(tmp_conn):
    extracted = _count(tmp_conn, "documents", "processing_status='EXTRACTED'")
    assert extracted == 1
    failed = _count(tmp_conn, "documents", "processing_status='FAILED'")
    assert failed == 1


# ─────────────────────────────────────────────────────────────────────────────
# Test: summary counts
# ─────────────────────────────────────────────────────────────────────────────

def test_collect_summary_counts(tmp_conn):
    s = collect_summary(tmp_conn)
    assert s.registered_documents == 3
    assert s.extracted == 1
    assert s.failed == 1
    assert s.deferred == 1
    # 10 pages for doc_ok + 1 for doc_fail
    assert s.total_stored_pages == 11
    # 10 pages have text, 1 has empty OCR failure
    assert s.nonempty_pages == 10
    # 2 OCR-success pages + 0 for others
    assert s.ocr_pages == 2
    # 1 OCR failed page
    assert s.ocr_failed_pages == 1
    # 2 chunks
    assert s.total_source_chunks == 2
    # 0 Gemini jobs — CRITICAL assertion
    assert s.gemini_jobs == 0, "Gemini was never called during local ingestion"


def test_summary_language_counts(tmp_conn):
    s = collect_summary(tmp_conn)
    # doc_ok: pages 1,3,5,7,9 → mr; pages 2,4,6,8,10 → en
    assert s.lang_en == 5
    assert s.lang_mr == 5
    assert s.lang_hi == 0
    # doc_fail page 1: NULL language
    assert s.lang_null == 1


def test_summary_gemini_is_zero(tmp_conn):
    """Critical: local ingestion must never create Gemini jobs."""
    s = collect_summary(tmp_conn)
    assert s.gemini_jobs == 0


# ─────────────────────────────────────────────────────────────────────────────
# Test: document rows
# ─────────────────────────────────────────────────────────────────────────────

def test_collect_documents_returns_all(tmp_conn):
    docs = collect_documents(tmp_conn)
    assert len(docs) == 3


def test_collect_documents_sorted_failed_first(tmp_conn):
    docs = collect_documents(tmp_conn)
    statuses = [d.status for d in docs]
    # FAILED should come before DEFERRED and EXTRACTED
    failed_idx = next(i for i, s in enumerate(statuses) if s == "FAILED")
    extracted_idx = next(i for i, s in enumerate(statuses) if s == "EXTRACTED")
    assert failed_idx < extracted_idx


def test_collect_documents_page_counts(tmp_conn):
    docs = collect_documents(tmp_conn)
    ok_doc = next(d for d in docs if d.filename == "test_policy.pdf")
    assert ok_doc.stored_pages == 10
    assert ok_doc.nonempty_pages == 10
    assert ok_doc.ocr_pages == 2
    assert ok_doc.chunks == 2
    assert ok_doc.english_sections == 1


def test_collect_documents_failed_doc(tmp_conn):
    docs = collect_documents(tmp_conn)
    fail_doc = next(d for d in docs if d.filename == "failed_policy.pdf")
    assert fail_doc.status == "FAILED"
    assert fail_doc.skip_reason is not None
    assert "OCR failure" in fail_doc.skip_reason
    assert fail_doc.ocr_failed_pages == 1


def test_collect_documents_deferred_doc(tmp_conn):
    docs = collect_documents(tmp_conn)
    def_doc = next(d for d in docs if d.filename == "large_bylaw.pdf")
    assert def_doc.status == "DEFERRED"
    assert def_doc.declared_pages == 3457


# ─────────────────────────────────────────────────────────────────────────────
# Test: warnings
# ─────────────────────────────────────────────────────────────────────────────

def test_warnings_for_failed_doc(tmp_conn):
    docs = collect_documents(tmp_conn)
    fail_doc = next(d for d in docs if d.filename == "failed_policy.pdf")
    assert len(fail_doc.warnings) > 0
    assert any("FAILED" in w for w in fail_doc.warnings)


def test_warnings_for_deferred_doc(tmp_conn):
    docs = collect_documents(tmp_conn)
    def_doc = next(d for d in docs if d.filename == "large_bylaw.pdf")
    assert len(def_doc.warnings) > 0
    assert any("DEFERRED" in w for w in def_doc.warnings)


def test_warnings_for_zero_chunks():
    """DocumentRow with 0 chunks on EXTRACTED doc should trigger a warning."""
    dr = DocumentRow(
        filename="test.pdf",
        status="EXTRACTED",
        declared_pages=10,
        stored_pages=10,
        nonempty_pages=10,
        ocr_pages=0,
        ocr_failed_pages=0,
        lang_en=10,
        lang_mr=0,
        lang_hi=0,
        lang_unknown=0,
        lang_null=0,
        english_sections=1,
        chunks=0,
        skip_reason=None,
    )
    warnings = _generate_warnings(dr)
    assert any("0 chunks" in w for w in warnings)


def test_warnings_for_ocr_failure():
    dr = DocumentRow(
        filename="test.pdf",
        status="EXTRACTED",
        declared_pages=5,
        stored_pages=5,
        nonempty_pages=4,
        ocr_pages=3,
        ocr_failed_pages=2,
        lang_en=5,
        lang_mr=0,
        lang_hi=0,
        lang_unknown=0,
        lang_null=0,
        english_sections=1,
        chunks=3,
        skip_reason=None,
    )
    warnings = _generate_warnings(dr)
    assert any("OCR failure" in w for w in warnings)


def test_no_false_warnings_for_clean_doc():
    dr = DocumentRow(
        filename="clean.pdf",
        status="EXTRACTED",
        declared_pages=10,
        stored_pages=10,
        nonempty_pages=10,
        ocr_pages=0,
        ocr_failed_pages=0,
        lang_en=10,
        lang_mr=0,
        lang_hi=0,
        lang_unknown=0,
        lang_null=0,
        english_sections=1,
        chunks=8,
        skip_reason=None,
    )
    warnings = _generate_warnings(dr)
    assert warnings == [], f"Expected no warnings but got: {warnings}"


# ─────────────────────────────────────────────────────────────────────────────
# Test: sample extraction
# ─────────────────────────────────────────────────────────────────────────────

def test_collect_samples_returns_list(tmp_conn):
    samples = collect_samples(tmp_conn)
    # No SAMPLE_TARGETS match our test doc names, so result may be empty
    assert isinstance(samples, list)


def test_collect_ocr_failures(tmp_conn):
    failures = collect_ocr_failures(tmp_conn)
    assert len(failures) == 1
    assert failures[0].filename == "failed_policy.pdf"
    assert failures[0].page_number == 1
    assert failures[0].character_count == 0


def test_collect_ocr_failures_returns_list_when_none(tmp_conn):
    # If we only have extracted docs with no ocr_failed pages, result is empty
    conn = tmp_conn
    # Remove the ocr_failed page temporarily by connecting fresh
    # (we can't modify—but we can test with a clean DB)
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        clean_db_path = tf.name
    clean_conn = sqlite3.connect(clean_db_path)
    clean_conn.row_factory = sqlite3.Row
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        clean_conn.executescript(f.read())
    clean_conn.execute(
        "INSERT INTO documents (document_id, filename, processing_status) VALUES ('d1','x.pdf','EXTRACTED')"
    )
    clean_conn.commit()
    failures = collect_ocr_failures(clean_conn)
    assert failures == []
    clean_conn.close()
    os.unlink(clean_db_path)


# ─────────────────────────────────────────────────────────────────────────────
# Test: report generation
# ─────────────────────────────────────────────────────────────────────────────

def test_build_json(tmp_conn):
    summary = collect_summary(tmp_conn)
    docs = collect_documents(tmp_conn)
    samples = collect_samples(tmp_conn)
    failures = collect_ocr_failures(tmp_conn)
    result = build_json(summary, docs, samples, failures)

    assert "summary" in result
    assert "documents" in result
    assert "warnings" in result
    assert "ocr_failures" in result
    assert "sample_pages" in result
    assert result["summary"]["registered_documents"] == 3
    assert result["summary"]["gemini_jobs"] == 0
    assert len(result["documents"]) == 3
    assert len(result["ocr_failures"]) == 1

    # JSON must be serialisable
    serialised = json.dumps(result, ensure_ascii=False)
    assert len(serialised) > 100


def test_build_markdown(tmp_conn):
    summary = collect_summary(tmp_conn)
    docs = collect_documents(tmp_conn)
    samples = collect_samples(tmp_conn)
    failures = collect_ocr_failures(tmp_conn)
    md = build_markdown(summary, docs, samples, failures)

    assert "SMSWS Knowledge Base Inspection" in md
    assert "Registered documents" in md
    assert "Gemini" in md
    assert "test_policy.pdf" in md
    assert "failed_policy.pdf" in md
    assert "OCR Failure" in md
    # Markdown must be non-trivially long
    assert len(md) > 500


def test_build_html(tmp_conn):
    summary = collect_summary(tmp_conn)
    docs = collect_documents(tmp_conn)
    samples = collect_samples(tmp_conn)
    failures = collect_ocr_failures(tmp_conn)
    html_out = build_html(summary, docs, samples, failures)

    assert "<!DOCTYPE html>" in html_out
    assert "SMSWS Knowledge Base Inspection" in html_out
    assert "test_policy.pdf" in html_out
    assert "failed_policy.pdf" in html_out
    # Must not contain raw unescaped angle brackets from real data inside unsafe positions
    assert "<script" not in html_out.lower()  # no injected scripts
    assert len(html_out) > 1000


def test_html_escaping():
    """HTML special characters in filenames must be escaped."""
    summary = OverallSummary(registered_documents=1, extracted=1)
    dr = DocumentRow(
        filename='malicious<script>alert(1)</script>.pdf',
        status="EXTRACTED",
        declared_pages=1,
        stored_pages=1,
        nonempty_pages=1,
        ocr_pages=0,
        ocr_failed_pages=0,
        lang_en=1,
        lang_mr=0,
        lang_hi=0,
        lang_unknown=0,
        lang_null=0,
        english_sections=1,
        chunks=1,
        skip_reason=None,
    )
    html_out = build_html(summary, [dr], [], [])
    assert "<script>alert(1)</script>" not in html_out


# ─────────────────────────────────────────────────────────────────────────────
# Test: full run_inspection end-to-end (writes files)
# ─────────────────────────────────────────────────────────────────────────────

def test_run_inspection_writes_files(tmp_db, tmp_path):
    out_dir = str(tmp_path / "report_out")
    result = run_inspection(db_path=tmp_db, out_dir=out_dir)

    html_path = os.path.join(out_dir, "inspection_report.html")
    md_path = os.path.join(out_dir, "inspection_report.md")
    json_path = os.path.join(out_dir, "inspection_summary.json")

    assert os.path.isfile(html_path), "HTML report not created"
    assert os.path.isfile(md_path), "Markdown report not created"
    assert os.path.isfile(json_path), "JSON report not created"

    # Read back and verify
    with open(json_path, encoding="utf-8") as f:
        loaded = json.load(f)
    assert loaded["summary"]["registered_documents"] == 3

    with open(html_path, encoding="utf-8") as f:
        html_content = f.read()
    assert "SMSWS" in html_content

    with open(md_path, encoding="utf-8") as f:
        md_content = f.read()
    assert "SMSWS" in md_content


def test_run_inspection_gemini_is_zero(tmp_db, tmp_path):
    """End-to-end: Gemini jobs must be 0 in the output JSON."""
    out_dir = str(tmp_path / "report_gemini_check")
    result = run_inspection(db_path=tmp_db, out_dir=out_dir)
    assert result["summary"]["gemini_jobs"] == 0


# ─────────────────────────────────────────────────────────────────────────────
# Test: pages != chunks distinction
# ─────────────────────────────────────────────────────────────────────────────

def test_pages_not_equal_chunks_in_output(tmp_conn):
    """Verify the report clearly distinguishes pages from chunks."""
    summary = collect_summary(tmp_conn)
    docs = collect_documents(tmp_conn)
    samples = collect_samples(tmp_conn)
    failures = collect_ocr_failures(tmp_conn)

    html_out = build_html(summary, docs, samples, failures)
    md_out = build_markdown(summary, docs, samples, failures)

    # Both reports must contain verbiage distinguishing pages from chunks
    assert "page" in html_out.lower()
    assert "chunk" in html_out.lower()
    assert "page" in md_out.lower()
    assert "chunk" in md_out.lower()

    # The actual counts should differ in the test DB (10 pages, 2 chunks)
    ok_doc = next(d for d in docs if d.filename == "test_policy.pdf")
    assert ok_doc.stored_pages == 10
    assert ok_doc.chunks == 2
    assert ok_doc.stored_pages != ok_doc.chunks
