# Demo corpus configuration
# Maps known sector/topic labels to document IDs in the live DB.
# These IDs are SHA-256 hashes of the actual PDF files.
# ALL entries here MUST exist in the database with status=EXTRACTED.
# DO NOT add failed or deferred documents.
#
# Obtain IDs via:
#   SELECT document_id, filename FROM documents WHERE processing_status='EXTRACTED';

import sqlite3
import os


def _load_doc_ids(db_path: str) -> dict:
    """Load document_id -> filename mapping from the live DB at startup."""
    if not os.path.exists(db_path):
        return {}
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT document_id, filename FROM documents WHERE processing_status='EXTRACTED'"
    ).fetchall()
    conn.close()
    return {r["filename"]: r["document_id"] for r in rows}


# Sector keywords for RAG retrieval — used to build FTS/LIKE queries.
SECTOR_KEYWORDS: dict[str, list[str]] = {
    "Textile": [
        "textile", "fabric", "garment", "weaving", "powerloom", "knitting",
        "hosiery", "spinning", "yarn", "apparel",
    ],
    "EV / Automotive": [
        "electric vehicle", "EV", "electric mobility", "battery", "charging",
        "automotive", "two-wheeler", "three-wheeler", "four-wheeler",
    ],
    "Electronics": [
        "electronics", "semiconductor", "ESDM", "electronic manufacturing",
        "PCB", "chip", "hardware",
    ],
    "IT / ITES": [
        "information technology", "IT", "ITES", "software", "data center",
        "BPO", "fintech", "startup",
    ],
    "Chemical": [
        "chemical", "petrochemical", "pharma", "pharmaceutical",
        "API", "bulk drug",
    ],
    "Food Processing": [
        "food processing", "agro", "dairy", "fruit", "vegetable", "cold storage",
        "MOFPI",
    ],
    "Logistics": [
        "logistics", "warehouse", "warehousing", "freight", "transport",
        "supply chain", "cold chain",
    ],
    "Engineering": [
        "engineering", "capital goods", "machine", "metal fabrication",
        "tool", "equipment",
    ],
    "Aerospace": [
        "aerospace", "defence", "defense", "aviation", "MRO",
    ],
    "Startup": [
        "startup", "incubator", "accelerator", "innovation",
    ],
    "Other": [],
}

# Filenames of documents included in the demo corpus, by role.
# These must match filenames in the DB exactly.
DEMO_CORPUS_FILENAMES: dict[str, list[str]] = {
    "industrial_policy": [
        "018b_Maharashtra New Industrial Policy-2019.pdf",
        "053_Package Scheme of Incentives - 2019.pdf",
        "033_Industrial Policy (Industrial-Policy).pdf",
    ],
    "ev_policy": [
        "047_Electric_Vehicle.pdf",
        "011c_EV Policy GR 2021.pdf",
    ],
    "textile_policy": [
        "029_Integrated and Sustainable Textile Policy 2023-28.pdf",
    ],
    "it_policy": [
        "032a_IT Policy 2023.pdf",
        "016_Start-up-Policy-2018.pdf",
    ],
    "electronics_policy": [
        "048_Electronic_Policy_2016.pdf",
    ],
    "single_window": [
        "060_MAITRI Rules-2025.pdf",
        "061_MAITRI Act 2023_English.pdf",
    ],
    "location_midc": [
        "043_Modification_of_Industrial_Location_policy_in_MMR.pdf",
    ],
    "aerospace": [
        "045_Aerospace.pdf",
    ],
    "food": [
        "010b_Implementation of Maharashtra Food Processing Policy 2017.pdf",
    ],
    "msme": [
        "063_Download MSMS Act PDF (MSMED_Act_2006).pdf",
    ],
}

# Sector → corpus categories (which document groups to search)
SECTOR_TO_CORPUS: dict[str, list[str]] = {
    "Textile": ["textile_policy", "industrial_policy", "single_window"],
    "EV / Automotive": ["ev_policy", "industrial_policy", "single_window"],
    "Electronics": ["electronics_policy", "industrial_policy", "single_window"],
    "IT / ITES": ["it_policy", "industrial_policy", "single_window"],
    "Aerospace": ["aerospace", "industrial_policy", "single_window"],
    "Food Processing": ["food", "industrial_policy", "single_window"],
    "Logistics": ["industrial_policy", "single_window"],
    "Chemical": ["industrial_policy", "single_window"],
    "Engineering": ["industrial_policy", "single_window"],
    "Startup": ["it_policy", "industrial_policy", "single_window"],
    "Other": ["industrial_policy", "single_window"],
}
