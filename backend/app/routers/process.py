from fastapi import APIRouter
import os
import json

from app.services.duplicates import find_duplicates
from app.services.ambiguity_ml import detect_ambiguity_ml          # SVM + MiniLM  (Model A)
from app.services.ambiguity_roberta import detect_ambiguity_roberta  # RoBERTa NLI   (Model B — Proposed)

router = APIRouter()

UPLOAD_FOLDER = "app/storage/uploaded_files"
OUTPUT_FOLDER = "app/storage/output"

JSON_PATH = os.path.join(UPLOAD_FOLDER, "extracted_requirements.json")


# ─────────────────────────────────────────────────────────────────────────────
# PRIMARY PIPELINE  —  uses RoBERTa (Proposed Model)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/process")
def process_srs():
    """
    Main SRS analysis pipeline.
    Ambiguity detection is handled by the RoBERTa NLI model (Proposed).
    """
    if not os.path.exists(JSON_PATH):
        return {"error": "No extracted data found. Please upload SRS first."}

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        extracted_data = json.load(f)

    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # 1️⃣  Duplicate detection
    duplicates = find_duplicates(extracted_data)

    # 2️⃣  Ambiguity detection — RoBERTa NLI (Proposed Model)
    ambiguity_results = {}

    for req_id, text in extracted_data.items():
        if isinstance(text, str):
            rb = detect_ambiguity_roberta(req_id, text)
            ambiguity_results[req_id] = {
                "flags":           rb["reasons"],
                "ambiguity_score": rb["roberta_score"],
                "is_ambiguous":    rb["roberta_ambiguous"],
                "model":           rb["model"],
            }

    result = {
        "requirements": extracted_data,
        "duplicates":   duplicates,
        "ambiguity":    ambiguity_results,
    }

    with open(os.path.join(OUTPUT_FOLDER, "processed_output.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)

    return result


# ─────────────────────────────────────────────────────────────────────────────
# COMPARISON ENDPOINT  —  Model A (SVM+MiniLM) vs Model B (RoBERTa)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/process-ml")
def compare_models():
    """
    Research comparison endpoint.
    Runs BOTH models on every requirement and returns side-by-side results.

    Model A: SVM + MiniLM (current baseline)
    Model B: RoBERTa NLI  (proposed model)
    """
    if not os.path.exists(JSON_PATH):
        return {"error": "No extracted data found. Please upload SRS first."}

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        extracted_data = json.load(f)

    comparison = {}

    for req_id, text in extracted_data.items():
        if not isinstance(text, str):
            continue

        # ── Model A: SVM + MiniLM ──────────────────────────────────────────
        svm_result = detect_ambiguity_ml(req_id, text)

        # ── Model B: RoBERTa NLI ───────────────────────────────────────────
        rob_result = detect_ambiguity_roberta(req_id, text)

        # ── Agreement check ────────────────────────────────────────────────
        agree = svm_result["svm_ambiguous"] == rob_result["roberta_ambiguous"]

        comparison[req_id] = {
            "text": text,

            # Model A
            "model_a": {
                "name":       "SVM + MiniLM (Baseline)",
                "score":      svm_result["svm_score"],
                "ambiguous":  svm_result["svm_ambiguous"],
                "reasons":    svm_result["reasons"],
                "note":       svm_result.get("note", ""),
            },

            # Model B
            "model_b": {
                "name":       "RoBERTa NLI (Proposed)",
                "score":      rob_result["roberta_score"],
                "ambiguous":  rob_result["roberta_ambiguous"],
                "reasons":    rob_result["reasons"],
            },

            # Comparison metadata
            "agreement":  agree,
            "conflict":   not agree,
        }

    # Save comparison output
    out_path = os.path.join(OUTPUT_FOLDER, "comparison_output.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(comparison, f, indent=4, ensure_ascii=False)

    # Summary statistics
    total = len(comparison)
    agreed   = sum(1 for v in comparison.values() if v["agreement"])
    svm_pos  = sum(1 for v in comparison.values() if v["model_a"]["ambiguous"])
    rob_pos  = sum(1 for v in comparison.values() if v["model_b"]["ambiguous"])

    return {
        "summary": {
            "total_requirements":   total,
            "agreements":           agreed,
            "disagreements":        total - agreed,
            "agreement_rate":       round(agreed / total * 100, 1) if total else 0,
            "model_a_flagged":      svm_pos,
            "model_b_flagged":      rob_pos,
        },
        "comparison": comparison,
    }
