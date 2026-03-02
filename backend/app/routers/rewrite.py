from fastapi import APIRouter
import os
import json

from app.services.rewrite_engine import rewrite_ambiguous

router = APIRouter()

OUTPUT_FOLDER = "app/storage/output"
PROCESSED_FILE = os.path.join(OUTPUT_FOLDER, "processed_output.json")


@router.post("/rewrite")
def rewrite_api():

    # Check if processed file exists
    if not os.path.exists(PROCESSED_FILE):
        return {"error": "Run /process first before rewriting."}

    # Load processed data
    with open(PROCESSED_FILE, "r", encoding="utf-8") as f:
        processed_data = json.load(f)

    requirements = processed_data.get("requirements", {})
    ambiguity = processed_data.get("ambiguity", {})

    # 🔥 Extract only ambiguous requirements
    ambiguous_items = []

    for req_id, details in ambiguity.items():
        if details.get("ambiguity_score", 0) > 0:
            text = requirements.get(req_id)
            if text:
                ambiguous_items.append({
                    "id": req_id,
                    "text": text
                })

    if not ambiguous_items:
        return {"message": "No ambiguous requirements found."}

    # Rewrite all ambiguous requirements
    rewritten = rewrite_ambiguous(ambiguous_items)

    result = {
        "total_ambiguous": len(ambiguous_items),
        "rewritten": rewritten
    }

    # Save rewritten output
    with open(os.path.join(OUTPUT_FOLDER, "rewritten_ambiguity.json"),
              "w",
              encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    return result