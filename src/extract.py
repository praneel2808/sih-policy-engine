"""
PDF Text Extraction Module.
Uses PyMuPDF (fitz) for direct text extraction and OCR rasterization.
Triggers OCR (pytesseract + pdf2image) ONLY when a page lacks sufficient usable text.
Preserves original PDFs untouched. Supports resumable per-page processing.
"""

import os
import logging
import fitz  # PyMuPDF
from typing import Dict, Any, List, Optional
from src.database import DatabaseManager

logger = logging.getLogger(__name__)

try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logger.warning("pytesseract or Pillow not installed. OCR fallback will be disabled.")


class TextExtractor:
    def __init__(
        self,
        min_usable_chars: int = 50,
        ocr_output_dir: str = "data/ocr",
        tesseract_cmd: Optional[str] = None,
        db_manager: Optional[DatabaseManager] = None
    ):
        self.min_usable_chars = min_usable_chars
        self.ocr_output_dir = ocr_output_dir
        self.db_manager = db_manager or DatabaseManager()
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        os.makedirs(self.ocr_output_dir, exist_ok=True)

    def extract_page_text(self, doc_path: str, page_num: int, fitz_page: fitz.Page) -> Dict[str, Any]:
        """Extracts text from a single PyMuPDF page, applying OCR fallback if character count is low."""
        text = fitz_page.get_text("text").strip()
        char_count = len(text)
        ocr_applied = False
        ocr_attempted = False

        if char_count < self.min_usable_chars:
            ocr_attempted = True
            logger.info(f"Page {page_num} in {os.path.basename(doc_path)} has low text ({char_count} chars). Attempting OCR.")
            ocr_text = self._run_ocr_fallback(fitz_page)
            if ocr_text:
                text = ocr_text
                char_count = len(text)
                ocr_applied = True

        return {
            "page_number": page_num,
            "text_content": text,
            "char_count": char_count,
            "ocr_applied": ocr_applied,
            "ocr_attempted": ocr_attempted,
        }

    def _run_ocr_fallback(self, fitz_page: fitz.Page) -> Optional[str]:
        """Renders one PDF page in-process with PyMuPDF, then applies Tesseract."""
        if not OCR_AVAILABLE:
            logger.warning("OCR requested but OCR dependencies are missing.")
            return None

        try:
            pixmap = fitz_page.get_pixmap(matrix=fitz.Matrix(2, 2), colorspace=fitz.csRGB, alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            ocr_text = pytesseract.image_to_string(image, lang="eng+mar")
            return ocr_text.strip()
        except Exception as e:
            logger.error("OCR rendering or recognition failed: %s", e)
        return None

    def process_document(self, document_id: str, filename: str, file_path: str, retry_failed_ocr: bool = False) -> bool:
        """Processes all pages of a document and saves extracted text to DB."""
        try:
            doc = fitz.open(file_path)
            for page_index in range(len(doc)):
                page_num = page_index + 1

                # Resumable check: skip if page already extracted
                if self.db_manager.page_exists(document_id, page_num):
                    existing = self.db_manager.get_pages(document_id)[page_index]
                    # Retry only a prior low-text native extraction. Successful OCR and
                    # usable PyMuPDF pages remain immutable/resumable.
                    if existing["extraction_method"] == "ocr" or existing["character_count"] >= self.min_usable_chars:
                        continue
                    if existing["extraction_method"] == "ocr_failed" and not retry_failed_ocr:
                        continue

                fitz_page = doc[page_index]
                page_data = self.extract_page_text(file_path, page_num, fitz_page)

                method = "ocr" if page_data["ocr_applied"] else (
                    "ocr_failed" if page_data["ocr_attempted"] else "pymupdf"
                )
                self.db_manager.insert_page(document_id, page_data["page_number"], page_data["text_content"], method,
                                            page_data["char_count"])
            doc.close()
            return True
        except Exception as e:
            logger.error(f"Error processing document {filename}: {e}")
            return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("TextExtractor skeleton ready.")
