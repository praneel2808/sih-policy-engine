"""
Inventory Module.
Scans raw PDFs, checks file size and page counts, flags very large PDFs for automated deferral,
selects the 20 pilot documents, and registers document status into SQLite.
"""

import os
import json
import logging
import hashlib
import csv
import fitz  # PyMuPDF
from typing import List, Dict, Any
from src.database import DatabaseManager
from src.classify import DocumentClassifier

logger = logging.getLogger(__name__)


# List of 20 strategically selected pilot documents representing key policy sectors
PILOT_DOCUMENT_FILENAMES = [
    "001_BambooPolicy2025.pdf",
    "002_MaharashtraIndustriesInvestmentandServicesPolicy2025-GR-31122025.pdf",
    "003_MATRIX-GR-dated-27112025.pdf",
    "004_Maharashtra-Gems-and-Jewellery-Policy-2025-GR-dated-12122025.pdf",
    "005_GCC Policy GR 03112025.pdf",
    "006a_AVGCXR Policy GR 03112025.pdf",
    "007_Maharashtra State Export Promotion Policy - 2023.pdf",
    "011b_Electric Vehicle Policy 2021.pdf",
    "013_GR 01.12.2016 Procurement Policy In English.pdf",
    "016_Start-up-Policy-2018.pdf",
    "018b_Maharashtra New Industrial Policy-2019.pdf",
    "023b_Fintech.pdf",
    "025b_Maharashtra Logistics Policy 2024- English.pdf",
    "028_Telecom_English.pdf",
    "029_Integrated and Sustainable Textile Policy 2023-28.pdf",
    "030_Special_Policy_for_Women_Entrepreneur_14.12.2017.pdf",
    "032a_IT Policy 2023.pdf",
    "036_Single_Window_Policy_2016.pdf",
    "057_Maharashtra-Green-Hydrogen-Policy.pdf",
    "061_MAITRI Act 2023_English.pdf"
]


class InventoryScanner:
    def __init__(
        self,
        raw_pdf_dir: str = "../sih_documents",
        db_manager: DatabaseManager = None,
        max_size_mb: float = 50.0,
        normal_max_pages: int = 150,
        max_pages: int = 500,
        hard_defer_after_pages: int = 1500,
    ):
        self.raw_pdf_dir = raw_pdf_dir
        self.db_manager = db_manager or DatabaseManager()
        self.max_size_mb = max_size_mb
        self.normal_max_pages = normal_max_pages
        self.max_pages = max_pages
        self.hard_defer_after_pages = hard_defer_after_pages

    def scan_inventory(self, filenames: List[str] = None) -> List[Dict[str, Any]]:
        """Read PDF metadata without modifying source files and register it idempotently."""
        if not os.path.exists(self.raw_pdf_dir):
            logger.error(f"Directory {self.raw_pdf_dir} does not exist.")
            return []
        pdf_files = sorted(f for f in os.listdir(self.raw_pdf_dir) if f.lower().endswith(".pdf"))
        if filenames is not None:
            wanted = set(filenames)
            missing = wanted.difference(pdf_files)
            if missing:
                raise FileNotFoundError(f"Requested PDFs not found: {sorted(missing)}")
            pdf_files = [f for f in pdf_files if f in wanted]
        classifier = DocumentClassifier()
        records = []

        for filename in pdf_files:
            file_path = os.path.join(self.raw_pdf_dir, filename)
            file_size_bytes = os.path.getsize(file_path)
            file_size_mb = file_size_bytes / (1024 * 1024)

            with open(file_path, "rb") as source:
                sha256 = hashlib.file_digest(source, "sha256").hexdigest()
            page_count = None
            defer_reason = None
            status = "PENDING"

            # Page count is inventory metadata, including for deferred documents.
            try:
                doc = fitz.open(file_path)
                page_count = len(doc)
                doc.close()
            except Exception as e:
                logger.warning(f"Could not read page count for {filename}: {e}")

            # Automatic deferral checks use the configured policy without reading page content.
            if page_count is not None and page_count > self.hard_defer_after_pages:
                status = "DEFERRED"
                defer_reason = f"Page count ({page_count}) exceeds hard deferral limit ({self.hard_defer_after_pages})"
            elif page_count is not None and page_count > self.max_pages:
                status = "DEFERRED"
                defer_reason = f"Page count ({page_count}) is in the default-defer range ({self.max_pages + 1}-{self.hard_defer_after_pages})"
            elif file_size_mb > self.max_size_mb:
                status = "DEFERRED"
                defer_reason = f"File size ({file_size_mb:.2f} MB) exceeds maximum threshold ({self.max_size_mb} MB)"
            elif page_count is not None and page_count > self.normal_max_pages:
                logger.info("%s is in the 151-500 page extended-processing tier.", filename)
            classification = classifier.classify_document(filename)
            existing = self.db_manager.get_document(sha256)
            # A repeat inventory refreshes metadata but never downgrades completed work.
            if existing and status == "PENDING":
                # if self.db_manager.has_failed_ocr_pages(sha256):
                #     status = "FAILED"
                #     defer_reason = "Unresolved OCR failure; rerun only with explicit OCR retry."
                #     self.db_manager.clear_derived_data(sha256)
                if existing["processing_status"] in {"EXTRACTED", "FAILED"}:
                    status = existing["processing_status"]
            record = {
                "document_id": sha256, "filename": filename, "title": os.path.splitext(filename)[0],
                "document_type": classification["primary_sector"], "document_purpose": "policy_or_regulatory",
                "classification_confidence": 1.0 if classification["all_matching_sectors"] else 0.0,
                "page_count": page_count, "file_size": file_size_bytes, "processing_status": status,
                "skip_reason": defer_reason, "sha256": sha256,
            }
            self.db_manager.upsert_document(record)
            records.append(record)
        return records

    def register_documents(self, filenames: List[str] = None) -> Dict[str, int]:
        records = self.scan_inventory(filenames)
        summary = {"total": len(records), "registered": len(records),
                   "deferred": sum(r["processing_status"] == "DEFERRED" for r in records),
                   "pilot": sum(r["filename"] in PILOT_DOCUMENT_FILENAMES for r in records)}
        logger.info("Inventory scan complete: %s", summary)
        return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scanner = InventoryScanner()
    scanner.register_documents()
