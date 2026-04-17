import json
from sentence_transformers import util
from app.services.embedding_model import get_embeddings

# ==============================
# SETTINGS
# ==============================
SIMILARITY_THRESHOLD = 0.85  # You can tune this externally


# ==============================
# MAIN SERVICE FUNCTION
# ==============================
def find_duplicates(requirements: dict, threshold: float = SIMILARITY_THRESHOLD):
    """
    Input:
        requirements = {"FR-01": "text...", "FR-02": "text..."}
        threshold = cosine similarity threshold (0–1)

    Output:
        {
            "summary": {...},
            "duplicates": [
                [
                    {"id": "...", "text": "..."},
                    {"id": "...", "text": "..."}
                ],
                ...
            ]
        }
    """

    # -------------------------
    # Convert dict → list
    # -------------------------
    req_list = []
    for req_id, text in requirements.items():
        req_list.append({
            "id": req_id,
            "text": text.strip()
        })

    texts = [req["text"] for req in req_list]

    # -------------------------
    # Generate embeddings
    # -------------------------
    embeddings = get_embeddings(texts)

    # -------------------------
    # Cosine similarity matrix
    # -------------------------
    cosine_scores = util.cos_sim(embeddings, embeddings)

    # -------------------------
    # Detect duplicates
    # -------------------------
    visited = set()
    duplicate_groups = []

    for i in range(len(texts)):
        if i in visited:
            continue

        group = [i]

        for j in range(i + 1, len(texts)):
            if cosine_scores[i][j] >= threshold:
                group.append(j)
                visited.add(j)

        if len(group) > 1:
            duplicate_groups.append(group)

    # -------------------------
    # Format output groups
    # -------------------------
    duplicates_output = []

    for group in duplicate_groups:
        grouped_items = []
        for idx in group:
            grouped_items.append({
                "id": req_list[idx]["id"],
                "text": req_list[idx]["text"]
            })
        duplicates_output.append(grouped_items)

    # -------------------------
    # Final response dict
    # -------------------------
    output = {
        "summary": {
            "total_requirements": len(req_list),
            "duplicate_groups": len(duplicates_output),
            "similarity_threshold": threshold
        },
        "duplicates": duplicates_output
    }

    return output