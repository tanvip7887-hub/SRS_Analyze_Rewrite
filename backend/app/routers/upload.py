from fastapi import APIRouter, UploadFile, File
import os
import shutil

from app.services.extractor import run_extractor  # ✅ FIXED (use correct function)

router = APIRouter()

# Temporary memory storage
extracted_data = {}

UPLOAD_FOLDER = "app/storage/uploaded_files"


@router.post("/upload-srs")
async def upload_srs(file: UploadFile = File(...)):

    global extracted_data

    # Create folder if not exists
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Save uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # JSON output path
    output_json_path = os.path.join(UPLOAD_FOLDER, "extracted_requirements.json")

    # ✅ Run FULL extractor pipeline
    extracted_data = run_extractor(file_path, output_json_path)

    return {
        "requirements": extracted_data
    }