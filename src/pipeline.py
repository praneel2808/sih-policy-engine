"""
Main Pipeline Orchestrator for Smart Maharashtra Single Window Policy Engine.
Connects inventory -> page text extraction -> language detection -> contiguous English sections -> classification -> chunking.
Fully modular and resumable.
"""

import os
import json
import logging
import argparse
from typing import Dict, Any

from src.database import DatabaseManager
from src.inventory import InventoryScanner
from src.extract import TextExtractor
from src.language import LanguageDetector
from src.english_sections import EnglishSectionFinder
from src.classify import DocumentClassifier
from src.chunk import DocumentChunker
from src.gemini_extract import GeminiRuleExtractor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("Pipeline")


class PolicyEnginePipeline:
    def __init__(self, config_path: str = "config/config.json"):
        self.config_path = config_path
        self.config = self._load_config()

        paths = self.config.get("paths", {})
        self.db_manager = DatabaseManager(
            db_path=paths.get("database_path", "db/policy_engine.db")
        )
        limits = self.config.get("limits", {})
        self.scanner = InventoryScanner(
            raw_pdf_dir=paths.get("raw_pdfs_dir", "data/raw_pdfs"),
            db_manager=self.db_manager,
            max_size_mb=limits.get("max_pdf_size_mb", 50.0),
            normal_max_pages=limits.get("normal_max_pages", 150),
            max_pages=limits.get("process_max_pages", 500),
            hard_defer_after_pages=limits.get("hard_defer_after_pages", 1500),
        )
        self.extractor = TextExtractor(
            min_usable_chars=self.config.get("extraction", {}).get("min_meaningful_characters", 100),
            tesseract_cmd=self.config.get("extraction", {}).get("tesseract_cmd"),
            db_manager=self.db_manager
        )
        self.lang_detector = LanguageDetector(db_manager=self.db_manager)
        self.section_finder = EnglishSectionFinder(db_manager=self.db_manager)
        self.classifier = DocumentClassifier()
        self.chunker = DocumentChunker(db_manager=self.db_manager)
        self.gemini_extractor = GeminiRuleExtractor(db_manager=self.db_manager)

    def _load_config(self) -> Dict[str, Any]:
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}

    def run_inventory_setup(self, filenames=None) -> Dict[str, int]:
        """Step 1: Initialize database and register document inventory."""
        logger.info("Initializing database and scanning PDF inventory...")
        self.db_manager.init_db()
        summary = self.scanner.register_documents(filenames)
        logger.info(f"Inventory setup complete: {summary}")
        return summary

    def process_documents(self, filenames, retry_failed_ocr: bool = False) -> list:
        """
        Step 2: Processes pending documents through extraction, language detection, section identification, and chunking.
        Resumable per document and per page.
        """
        selected = [d for d in self.db_manager.get_all_documents() if d["filename"] in set(filenames)]
        pending_docs = []
        for doc in selected:
            has_retryable_ocr = any(
                page["extraction_method"] == "pymupdf" and page["character_count"] < self.extractor.min_usable_chars
                for page in self.db_manager.get_pages(doc["document_id"])
            )
            has_explicit_ocr_retry = retry_failed_ocr and self.db_manager.has_failed_ocr_pages(doc["document_id"])
            if doc["processing_status"] == "PENDING" or has_retryable_ocr or has_explicit_ocr_retry:
                pending_docs.append(doc)
        logger.info("Found %d selected document(s) requiring work.", len(pending_docs))
        results = []

        for doc in pending_docs:
            document_id = doc["document_id"]
            filename = doc["filename"]
            file_path = os.path.join(self.scanner.raw_pdf_dir, filename)

            logger.info("Processing %s", filename)
            self.db_manager.update_document_status(document_id, "PROCESSING")

            # 1. Page text extraction & OCR fallback
            success = self.extractor.process_document(document_id, filename, file_path, retry_failed_ocr=retry_failed_ocr)
            if not success:
                self.db_manager.update_document_status(document_id, "FAILED", "Text extraction failed")
                results.append({"filename": filename, "status": "FAILED"})
                continue

            if self.db_manager.has_failed_ocr_pages(document_id):
                logger.warning(f"Document {filename} has some failed OCR pages, but continuing extraction anyway.")
                # self.db_manager.clear_derived_data(document_id)
                # self.db_manager.update_document_status(document_id, "FAILED", "OCR failed on one or more pages")
                # results.append({"filename": filename, "status": "FAILED"})
                # continue

            # 2. Page-level language detection
            self.lang_detector.update_page_languages_for_doc(document_id, force=True)

            # 3. Contiguous English section identification
            self.section_finder.find_and_save_english_sections(document_id)

            # 4. Semantic chunking
            self.chunker.chunk_document_english_sections(document_id)

            # Mark complete
            self.db_manager.update_document_status(document_id, "EXTRACTED")
            results.append({"filename": filename, "status": "EXTRACTED"})
            logger.info(f"Successfully processed {filename}")
        return results

    def canonical_pdf_filenames(self) -> list[str]:
        """Read the supplied corpus manifest; its literal filenames.txt entry is not a PDF."""
        manifest = os.path.join("references", "filenames.txt")
        with open(manifest, "r", encoding="utf-8") as source:
            return [line.strip() for line in source if line.strip().lower().endswith(".pdf")]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Smart Maharashtra Policy Engine Pipeline")
    parser.add_argument("--inventory-only", action="store_true", help="Only run inventory registration and exit")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Run only the fixed eight-document validation set")
    mode.add_argument("--full-local", action="store_true", help="Explicitly process the canonical local PDF manifest; never invokes Gemini")
    parser.add_argument("--retry-failed-ocr", action="store_true", help="Explicitly retry terminal OCR failures after an OCR-environment repair")
    args = parser.parse_args()

    dry_run_files = [
        "062_Comprehensive Uniform Building Bye Law.pdf",
        "013_GR 01.12.2016 Procurement Policy In English.pdf",
        "011b_Electric Vehicle Policy 2021.pdf",
        "025a_Maharashtra Logistics Policy 2024 - GR.pdf",
        "025c_Logistic Park Policy2018 PARIPATRAK MODALITIES GUIDE 1.pdf",
        "060_MAITRI Rules-2025.pdf",
        "042_Package Scheme of Incentives - 2019a.pdf",
        "032a_IT Policy 2023.pdf",
    ]
    pipeline = PolicyEnginePipeline()
    if args.dry_run:
        selected = dry_run_files
    elif args.full_local:
        selected = pipeline.canonical_pdf_filenames()
    else:
        selected = None
    pipeline.run_inventory_setup(selected)
    if not args.inventory_only:
        if args.dry_run or args.full_local:
            results = pipeline.process_documents(selected, retry_failed_ocr=args.retry_failed_ocr)
            if any(result["status"] == "FAILED" for result in results):
                raise SystemExit("One or more documents failed; inspect the logged document-level errors.")
        else:
            parser.error("Choose --dry-run or --full-local; processing is never implicit.")
