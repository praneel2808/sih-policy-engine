"""
Contiguous English Section Extractor Module.
Identifies contiguous page ranges written in English based on page-level language detection.
Never assumes the English portion is half the document; dynamically locates contiguous sections.
"""

import logging
from typing import List, Dict, Any, Optional
from src.database import DatabaseManager

logger = logging.getLogger(__name__)


class EnglishSectionFinder:
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db_manager = db_manager or DatabaseManager()

    def find_and_save_english_sections(self, document_id: str) -> List[Dict[str, int]]:
        """
        Locates all contiguous English page sections for a document and records them in the database.
        Returns a list of section dicts: [{'start_page': X, 'end_page': Y, 'page_count': Z}].
        """
        sections: List[Dict[str, int]] = []

        with self.db_manager.get_connection() as conn:
            pages = conn.execute(
                "SELECT page_number, language FROM document_pages WHERE document_id = ? ORDER BY page_number ASC",
                (document_id,)
            ).fetchall()

            if not pages:
                return sections

            current_start: Optional[int] = None
            current_end: Optional[int] = None

            for page in pages:
                page_num = page["page_number"]
                lang = page["language"]

                if lang == "en":
                    if current_start is None:
                        current_start = page_num
                    current_end = page_num
                else:
                    if current_start is not None and current_end is not None:
                        sections.append({
                            "start_page": current_start,
                            "end_page": current_end,
                            "page_count": (current_end - current_start + 1)
                        })
                        current_start = None
                        current_end = None

            # Close final section if document ends on English page
            if current_start is not None and current_end is not None:
                sections.append({
                    "start_page": current_start,
                    "end_page": current_end,
                    "page_count": (current_end - current_start + 1)
                })

            # Clear existing sections for doc_id (resumability)
            conn.execute("DELETE FROM english_sections WHERE document_id = ?", (document_id,))

            # Save new sections
            for sec in sections:
                conn.execute(
                    """
                    INSERT INTO english_sections (document_id, start_page, end_page, page_count, is_contiguous)
                    VALUES (?, ?, ?, ?, 1)
                    """,
                    (document_id, sec["start_page"], sec["end_page"], sec["page_count"])
                )
            conn.commit()

        logger.info(f"Identified {len(sections)} contiguous English section(s) for {document_id}")
        return sections


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    finder = EnglishSectionFinder()
    print("EnglishSectionFinder ready.")
