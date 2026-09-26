CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    title TEXT,
    source_url TEXT,
    document_type TEXT,
    document_purpose TEXT,
    classification_confidence REAL,
    department TEXT,
    document_date TEXT,
    effective_date TEXT,
    page_count INTEGER,
    file_size INTEGER,
    language_profile TEXT,
    bilingual_duplicate INTEGER,
    english_page_ranges TEXT,
    selected_processing_pages TEXT,
    extraction_method TEXT,
    processing_status TEXT,
    skip_reason TEXT,
    sha256 TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_pages (
    page_id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    text TEXT,
    extraction_method TEXT,
    character_count INTEGER,
    language TEXT,
    language_confidence REAL,
    ocr_applied INTEGER NOT NULL DEFAULT 0,
    UNIQUE(document_id, page_number),
    FOREIGN KEY(document_id) REFERENCES documents(document_id)
);

CREATE TABLE IF NOT EXISTS english_sections (
    section_id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id TEXT NOT NULL,
    start_page INTEGER NOT NULL,
    end_page INTEGER NOT NULL,
    page_count INTEGER NOT NULL,
    is_contiguous INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(document_id) REFERENCES documents(document_id),
    UNIQUE(document_id, start_page, end_page)
);

CREATE TABLE IF NOT EXISTS source_chunks (
    chunk_id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    page_start INTEGER,
    page_end INTEGER,
    section_reference TEXT,
    clause_reference TEXT,
    language TEXT,
    verbatim_text TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(document_id)
);

CREATE TABLE IF NOT EXISTS gemini_jobs (
    job_id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    status TEXT,
    model TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    input_tokens INTEGER,
    output_tokens INTEGER,
    error TEXT,
    FOREIGN KEY(document_id) REFERENCES documents(document_id)
);
