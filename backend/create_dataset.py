import json
import csv

with open("app/storage/output/processed_output.json", "r") as f:
    data = json.load(f)

requirements = data.get("requirements", [])

with open("requirements_dataset.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["requirement", "label"])
    for req in requirements:
        text = req.get("text", "").strip()
        is_ambiguous = req.get("is_ambiguous", False)
        label = 1 if is_ambiguous else 0
        if text:
            writer.writerow([text, label])

print("Dataset created successfully")
