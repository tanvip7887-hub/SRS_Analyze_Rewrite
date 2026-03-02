from fastapi import APIRouter
import os
import json

from app.services.duplicates import find_duplicates
from app.services.ambiguity import detect_ambiguity

router = APIRouter()

UPLOAD_FOLDER = "app/storage/uploaded_files"
OUTPUT_FOLDER = "app/storage/output"

JSON_PATH = os.path.join(UPLOAD_FOLDER, "extracted_requirements.json")


@router.post("/process")
def process_srs():

    # Check if extracted file exists
    if not os.path.exists(JSON_PATH):
        return {"error": "No extracted data found. Please upload SRS first."}

    # Load extracted data
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        extracted_data = json.load(f)

    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # 1️⃣ Run duplicate detection (full dataset)
    duplicates = find_duplicates(extracted_data)

    # 2️⃣ Run ambiguity detection (per requirement)
    ambiguity_results = {}

    for req_id, text in extracted_data.items():
        if isinstance(text, str):
            ambiguity_results[req_id] = detect_ambiguity(text)

    result = {
        "requirements": extracted_data,
        "duplicates": duplicates,
        "ambiguity": ambiguity_results
    }

    # Save processed output
    with open(os.path.join(OUTPUT_FOLDER, "processed_output.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    return result