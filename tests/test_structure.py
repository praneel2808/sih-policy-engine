"""
Unit tests for sih-policy-engine basic structure and database initialization.
"""

import os
import sqlite3
import pytest
from src.database import DatabaseManager
from src.classify import DocumentClassifier
from src.language import LanguageDetector


def test_database_initialization(tmp_path):
    db_file = tmp_path / "test_engine.db"
    schema_file = os.path.join(os.path.dirname(__file__), "..", "db", "schema.sql")
    db_mgr = DatabaseManager(db_path=str(db_file), schema_path=schema_file)
    db_mgr.init_db()

    conn = sqlite3.connect(str(db_file))
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()

    expected_tables = ["documents", "document_pages", "source_chunks", "gemini_jobs"]
    for t in expected_tables:
        assert t in tables


def test_document_classification():
    classifier = DocumentClassifier()
    res = classifier.classify_document("011b_Electric Vehicle Policy 2021.pdf")
    assert res["primary_sector"] == "ELECTRIC_VEHICLE"


def test_language_detection_fallback():
    detector = LanguageDetector()
    lang, conf = detector.detect_language("This is a standard English policy paragraph.")
    assert lang == "en"
