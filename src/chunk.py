"""
Document Chunking Module.
Splits extracted document pages into semantic chunks while maintaining source metadata (start_page, end_page).
Prepares text for RAG retrieval and Gemini candidate rule extraction.
"""

import logging
import hashlib
from typing import List, Dict, Any, Optional
from src.database import DatabaseManager

logger = logging.getLogger(__name__)


class DocumentChunker:
    def __init__(self, max_tokens_per_chunk: int = 1000, db_manager: Optional[DatabaseManager] = None):
        self.max_tokens_per_chunk = max_tokens_per_chunk
        self.db_manager = db_manager or DatabaseManager()

    def estimate_tokens(self, text: str) -> int:
        """Rough token count estimation (approx 4 chars per token)."""
        return len(text) // 4

    def chunk_document_english_sections(self, document_id: str) -> int:
        """
        Chunks pages from English sections of a document and saves chunks into DB.
        Returns the total number of chunks created.
        """
        created_chunks = 0
        with self.db_manager.get_connection() as conn:
            # Retrieve contiguous English page ranges
            sections = conn.execute(
                "SELECT start_page, end_page FROM english_sections WHERE document_id = ? ORDER BY start_page ASC",
                (document_id,)
            ).fetchall()

            if not sections:
                # Fallback to all pages if no specific English section recorded
                sections = [{"start_page": 1, "end_page": 9999}]

            # Clear existing chunks for doc_id (resumability)
            conn.execute("DELETE FROM source_chunks WHERE document_id = ?", (document_id,))

            for sec in sections:
                pages = conn.execute(
                    """
                    SELECT page_number, text FROM document_pages
                    WHERE document_id = ? AND page_number BETWEEN ? AND ?
                    ORDER BY page_number ASC
                    """,
                    (document_id, sec["start_page"], sec["end_page"])
                ).fetchall()

                current_text = ""
                chunk_start_page = None
                chunk_end_page = None

                for page in pages:
                    p_num = page["page_number"]
                    p_text = page["text"] or ""

                    if not p_text.strip():
                        continue

                    if chunk_start_page is None:
                        chunk_start_page = p_num

                    potential_text = current_text + f"\n\n--- Page {p_num} ---\n\n" + p_text
                    if self.estimate_tokens(potential_text) > self.max_tokens_per_chunk and current_text:
                        # Save accumulated chunk
                        chunk_id = hashlib.sha256(f"{document_id}:{chunk_start_page}:{chunk_end_page}:{current_text}".encode()).hexdigest()
                        conn.execute("INSERT INTO source_chunks (chunk_id, document_id, page_start, page_end, language, verbatim_text) VALUES (?, ?, ?, ?, 'en', ?)",
                                     (chunk_id, document_id, chunk_start_page, chunk_end_page, current_text.strip()))
                        created_chunks += 1

                        # Reset for next chunk
                        current_text = f"--- Page {p_num} ---\n\n" + p_text
                        chunk_start_page = p_num
                        chunk_end_page = p_num
                    else:
                        current_text = potential_text
                        chunk_end_page = p_num

                # Commit last chunk in section
                if current_text.strip() and chunk_start_page is not None and chunk_end_page is not None:
                    chunk_id = hashlib.sha256(f"{document_id}:{chunk_start_page}:{chunk_end_page}:{current_text}".encode()).hexdigest()
                    conn.execute("INSERT INTO source_chunks (chunk_id, document_id, page_start, page_end, language, verbatim_text) VALUES (?, ?, ?, ?, 'en', ?)",
                                 (chunk_id, document_id, chunk_start_page, chunk_end_page, current_text.strip()))
                    created_chunks += 1

            conn.commit()

        logger.info(f"Created {created_chunks} text chunk(s) for {document_id}")
        return created_chunks


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    chunker = DocumentChunker()
    print("DocumentChunker ready.")
