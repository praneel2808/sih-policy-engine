"""
Document Classification Module.
Categorizes Maharashtra government policy GRs into sectors, policy types, and target beneficiary groups based on header text and title metadata.
"""

import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

SECTOR_PATTERNS = {
    "AGRO_FOOD_PROCESSING": [r"agro", r"food processing", r"grapes", r"krishi"],
    "ELECTRIC_VEHICLE": [r"electric vehicle", r"ev policy", r"oem"],
    "TEXTILE": [r"textile", r"garment"],
    "LOGISTICS": [r"logistics", r"logistic park"],
    "IT_ITES": [r"information technology", r"it policy", r"ites", r"cloud computing", r"fintech"],
    "ELECTRONICS_FAB": [r"electronics", r"micro electronics", r"fab projects"],
    "DEFENCE_AEROSPACE": [r"aerospace", r"defence manufacturing"],
    "GREEN_ENERGY": [r"oxygen", r"green hydrogen", r"lmo units"],
    "STARTUP_INNOVATION": [r"start-up", r"startup", r"cluster"],
    "SPECIAL_CATEGORY": [r"women entrepreneur", r"scheduled castes", r"sc/st", r"ambedkar"],
    "GENERAL_INDUSTRIAL": [r"industrial policy", r"package scheme of incentives", r"psi", r"maitri", r"single window"]
}


class DocumentClassifier:
    def __init__(self):
        pass

    def classify_document(self, filename: str, header_text: str = "") -> Dict[str, Any]:
        """Classifies document by sector and policy type based on filename and header text."""
        combined_content = f"{filename} {header_text}".lower()
        matched_sectors = []

        for sector, patterns in SECTOR_PATTERNS.items():
            for pat in patterns:
                if re.search(pat, combined_content, re.IGNORECASE):
                    matched_sectors.append(sector)
                    break

        primary_sector = matched_sectors[0] if matched_sectors else "GENERAL_INDUSTRIAL"

        return {
            "primary_sector": primary_sector,
            "all_matching_sectors": matched_sectors,
            "filename": filename
        }


if __name__ == "__main__":
    classifier = DocumentClassifier()
    res = classifier.classify_document("011b_Electric Vehicle Policy 2021.pdf")
    print("Classification test:", res)
