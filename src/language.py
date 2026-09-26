"""
Page-Level Language Detector Module.
Performs page-level language identification using lightweight local detectors (Lingua / langdetect).
Supports Marathi ('mr'), Hindi ('hi'), and English ('en').
"""

import logging
from typing import Tuple, Optional
from src.database import DatabaseManager

logger = logging.getLogger(__name__)

# Try loading lightweight local language detector
LINGUA_AVAILABLE = False
LANGDETECT_AVAILABLE = False

try:
    from lingua import Language, LanguageDetectorBuilder
    languages = [Language.ENGLISH, Language.MARATHI, Language.HINDI]
    lingua_detector = LanguageDetectorBuilder.from_languages(*languages).build()
    LINGUA_AVAILABLE = True
except ImportError:
    try:
        from langdetect import detect, detect_langs
        LANGDETECT_AVAILABLE = True
    except ImportError:
        logger.warning("Neither lingua nor langdetect available. Language detection will default to fallback.")


class LanguageDetector:
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db_manager = db_manager or DatabaseManager()

    def detect_language(self, text: str) -> Tuple[str, float]:
        """
        Detects primary language of page text.
        Returns tuple of (language_code, confidence).
        Supported language codes: 'en', 'mr', 'hi', 'unknown'.
        """
        if not text or len(text.strip()) < 10:
            return "unknown", 0.0

        if LINGUA_AVAILABLE:
            try:
                confidence_values = lingua_detector.compute_language_confidence_values(text)
                if confidence_values:
                    top_result = confidence_values[0]
                    lang_map = {
                        Language.ENGLISH: "en",
                        Language.MARATHI: "mr",
                        Language.HINDI: "hi"
                    }
                    lang_code = lang_map.get(top_result.language, "unknown")
                    return lang_code, float(top_result.value)
            except Exception as e:
                logger.debug(f"Lingua detection error: {e}")

        if LANGDETECT_AVAILABLE:
            try:
                predictions = detect_langs(text)
                if predictions:
                    top = predictions[0]
                    return top.lang, float(top.prob)
            except Exception as e:
                logger.debug(f"Langdetect error: {e}")

        # Simple heuristic fallback based on Unicode Devanagari range
        devanagari_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
        total_chars = len(text)
        devanagari_ratio = devanagari_chars / total_chars if total_chars > 0 else 0

        if devanagari_ratio > 0.3:
            return "mr", devanagari_ratio
        elif devanagari_ratio < 0.05:
            return "en", 1.0 - devanagari_ratio

        return "unknown", 0.5

    def update_page_languages_for_doc(self, document_id: str, force: bool = False) -> int:
        """Runs language detection for all extracted pages of a document in DB."""
        updated_count = 0
        with self.db_manager.get_connection() as conn:
            query = "SELECT page_id, text FROM document_pages WHERE document_id = ?"
            if not force:
                query += " AND (language IS NULL OR language = '')"
            pages = conn.execute(query, (document_id,)).fetchall()

            for page in pages:
                lang, conf = self.detect_language(page["text"] or "")
                conn.execute(
                    "UPDATE document_pages SET language = ?, language_confidence = ? WHERE page_id = ?",
                    (lang, conf, page["page_id"])
                )
                updated_count += 1
            conn.commit()

        logger.info(f"Updated language detection for {updated_count} pages in {document_id}")
        return updated_count


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    detector = LanguageDetector()
    lang, conf = detector.detect_language("This is a sample government policy document for industrial investment.")
    print(f"Detected: {lang} (confidence: {conf:.2f})")
