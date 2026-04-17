import os, re
import numpy as np
import joblib
from sentence_transformers import SentenceTransformer

_BASE       = os.path.dirname(__file__)
MODEL_PATH  = os.path.join(_BASE, "../models/svm_model.pkl")
SCALER_PATH = os.path.join(_BASE, "../models/scaler.pkl")

AMBIGUITY_THRESHOLD = 0.80

_clf    = joblib.load(MODEL_PATH)
_scaler = joblib.load(SCALER_PATH)
_embed  = SentenceTransformer("all-MiniLM-L6-v2")

VAGUE_WORDS = [
    "fast", "quickly", "slow", "easy", "simple", "efficient", "effective",
    "user-friendly", "intuitive", "robust", "reliable", "flexible", "scalable",
    "adequate", "appropriate", "sufficient", "reasonable", "good", "better",
    "best", "high", "low", "large", "small", "many", "few", "some", "several",
    "often", "usually", "generally", "mostly", "sometimes", "as needed"
]

def _linguistic_features(text: str):
    t      = text.lower()
    words  = t.split()
    total  = max(len(words), 1)
    vague_count    = sum(1 for w in VAGUE_WORDS if w in t)
    vague_ratio    = vague_count / total
    has_passive    = int(bool(re.search(r"\b(be|been|being)\s+\w+ed\b", t)))
    has_no_actor   = int(bool(re.search(r"^(the system|it|data|information)\s+shall", t)))
    has_quantity   = int(bool(re.search(r"\d+\s*(ms|sec|min|hour|day|%|kb|mb|gb|users?|requests?)", t)))
    is_short       = int(total < 6)
    has_comparison = int(bool(re.search(r"\b(faster|slower|better|worse|more|less)\b", t)))
    return [vague_count, vague_ratio, has_passive, has_no_actor, has_quantity, is_short, has_comparison]

VAGUE_ADJECTIVES = [
    "fast", "quick", "slow", "easy", "simple", "user-friendly", "intuitive",
    "robust", "reliable", "flexible", "scalable", "adequate", "appropriate",
    "sufficient", "reasonable", "effective", "efficient", "seamless",
    "comprehensive", "suitable", "proper", "timely", "lightweight",
    "high quality", "best practices", "better", "good", "strong", "rich"
]
VAGUE_QUANTITIES = [
    "many", "few", "some", "several", "various", "multiple",
    "large", "small", "high", "low", "minimal", "enough"
]
VAGUE_CONDITIONS = [
    "as needed", "where applicable", "if necessary", "when required",
    "as required", "if needed", "where necessary", "as appropriate"
]
PASSIVE_PATTERNS = [
    r"shall be \w+ed",
    r"should be \w+ed",
    r"must be \w+ed",
    r"will be \w+ed",
]

def _rule_reasons(req_id: str, text: str):
    t, reasons = text.lower().strip(), []
    found = [w for w in VAGUE_ADJECTIVES if re.search(r"\b" + re.escape(w) + r"\b", t)]
    if found: reasons.append(f"vague words: {', '.join(found)}")
    found = [w for w in VAGUE_QUANTITIES if re.search(r"\b" + re.escape(w) + r"\b", t)]
    if found: reasons.append(f"vague quantity: {', '.join(found)}")
    found = [w for w in VAGUE_CONDITIONS if w in t]
    if found: reasons.append(f"vague condition: {', '.join(found)}")
    if any(re.search(p, t) for p in PASSIVE_PATTERNS):
        reasons.append("passive voice: missing actor")
    is_nfr = req_id.upper().startswith("NFR")
    perf_kw = ["performance", "speed", "response", "availability", "capacity", "time", "load", "memory", "cpu", "storage"]
    has_metric = bool(re.search(r"\d+\s*(ms|milliseconds?|seconds?|minutes?|hours?|days?|%|kb|mb|gb|tb|users?|requests?|concurrent)", t))
    if is_nfr and any(k in t for k in perf_kw) and not has_metric:
        reasons.append("NFR missing measurable value")
    if text.strip().endswith(",") or re.search(r"\(i\.e\.?\s*\w*\s*\)?\s*$", text.strip()):
        reasons.append("incomplete sentence")
    if re.search(r"\band/or\b", t):
        reasons.append("and/or: multiple interpretations")
    return reasons

def detect_ambiguity_ml(req_id: str, text: str) -> dict:
    emb    = _embed.encode([text], normalize_embeddings=True)
    ling   = np.array([_linguistic_features(text)])
    ling_s = _scaler.transform(ling)
    X      = np.hstack([emb, ling_s])
    prob   = float(_clf.predict_proba(X)[0][1])
    reasons = _rule_reasons(req_id, text)
    # BOTH must agree — exactly matching training script logic
    ambiguous = prob >= AMBIGUITY_THRESHOLD and bool(reasons)
    note = ""
    if prob >= AMBIGUITY_THRESHOLD and not reasons:
        note = "SVM flagged but no linguistic signal found"
    return {
        "svm_score":     round(prob, 4),
        "svm_ambiguous": ambiguous,
        "reasons":       reasons,
        "note":          note,
    }