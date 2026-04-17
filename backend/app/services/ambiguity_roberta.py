"""
ambiguity_roberta.py
─────────────────────────────────────────────────────────────────────────────
RoBERTa-based Ambiguity Detector using Zero-Shot NLI (cross-encoder approach).

Model: cross-encoder/nli-roberta-base
Approach: Natural Language Inference — feeds requirement + hypothesis
          "This software requirement is ambiguous and vague" and returns
          the entailment (ambiguous) probability as the score.

This is the "Proposed Model" in the research paper comparison.
─────────────────────────────────────────────────────────────────────────────
"""
import re
from transformers import pipeline

# ── Load NLI model once at module level (fast reuse) ──────────────────────
print("Loading RoBERTa NLI model for ambiguity detection...")
_nli = pipeline(
    "zero-shot-classification",
    model="cross-encoder/nli-deberta-v3-small",  # best quality/speed tradeoff
    device=-1,  # CPU; change to 0 for GPU
)
print("RoBERTa NLI model loaded successfully!")

AMBIGUITY_THRESHOLD = 0.55  # tune based on validation

# ── Hypothesis labels ──────────────────────────────────────────────────────
HYPOTHESIS_AMBIGUOUS  = "This software requirement is ambiguous, vague, or unclear."
HYPOTHESIS_CLEAR      = "This software requirement is clear, specific, and testable."

# ── Same rule-based reason extractor (for explainability only, NOT for decision) ──
VAGUE_ADJECTIVES = [
    "fast", "quick", "slow", "easy", "simple", "user-friendly", "intuitive",
    "robust", "reliable", "flexible", "scalable", "adequate", "appropriate",
    "sufficient", "reasonable", "effective", "efficient", "seamless",
    "comprehensive", "suitable", "proper", "timely", "lightweight",
    "high quality", "best practices", "better", "good", "strong", "rich",
]
VAGUE_QUANTITIES = [
    "many", "few", "some", "several", "various", "multiple",
    "large", "small", "high", "low", "minimal", "enough",
]
VAGUE_CONDITIONS = [
    "as needed", "where applicable", "if necessary", "when required",
    "as required", "if needed", "where necessary", "as appropriate",
]
PASSIVE_PATTERNS = [
    r"shall be \w+ed",
    r"should be \w+ed",
    r"must be \w+ed",
    r"will be \w+ed",
]


def _explain_reasons(req_id: str, text: str) -> list:
    """
    Pure linguistic reason extractor — used ONLY for human-readable explanation.
    Does NOT influence the RoBERTa ambiguity decision.
    """
    t, reasons = text.lower().strip(), []

    found = [w for w in VAGUE_ADJECTIVES if re.search(r"\b" + re.escape(w) + r"\b", t)]
    if found:
        reasons.append(f"vague words: {', '.join(found)}")

    found = [w for w in VAGUE_QUANTITIES if re.search(r"\b" + re.escape(w) + r"\b", t)]
    if found:
        reasons.append(f"vague quantity: {', '.join(found)}")

    found = [w for w in VAGUE_CONDITIONS if w in t]
    if found:
        reasons.append(f"vague condition: {', '.join(found)}")

    if any(re.search(p, t) for p in PASSIVE_PATTERNS):
        reasons.append("passive voice: missing actor")

    is_nfr = req_id.upper().startswith("NFR")
    perf_kw = ["performance", "speed", "response", "availability", "capacity",
               "time", "load", "memory", "cpu", "storage"]
    has_metric = bool(re.search(
        r"\d+\s*(ms|milliseconds?|seconds?|minutes?|hours?|days?|%|kb|mb|gb|tb|users?|requests?|concurrent)", t
    ))
    if is_nfr and any(k in t for k in perf_kw) and not has_metric:
        reasons.append("NFR missing measurable value")

    if text.strip().endswith(",") or re.search(r"\(i\.e\.?\s*\w*\s*\)?\s*$", text.strip()):
        reasons.append("incomplete sentence")

    if re.search(r"\band/or\b", t):
        reasons.append("and/or: multiple interpretations")

    return reasons


def detect_ambiguity_roberta(req_id: str, text: str) -> dict:
    """
    RoBERTa NLI-based ambiguity detector.

    Returns:
        {
            "roberta_score":     float  — probability requirement is ambiguous (0-1)
            "roberta_ambiguous": bool   — True if score >= AMBIGUITY_THRESHOLD
            "reasons":           list   — human-readable linguistic explanations
            "model":             str    — model name for reference
        }
    """
    result = _nli(
        text,
        candidate_labels=["ambiguous", "clear"],
        hypothesis_template="This software requirement is {}.",
    )

    # Extract probability for "ambiguous" label
    label_scores = dict(zip(result["labels"], result["scores"]))
    prob = float(label_scores.get("ambiguous", 0.0))

    reasons = _explain_reasons(req_id, text)
    ambiguous = prob >= AMBIGUITY_THRESHOLD

    return {
        "roberta_score":     round(prob, 4),
        "roberta_ambiguous": ambiguous,
        "reasons":           reasons,
        "model":             "cross-encoder/nli-deberta-v3-small",
    }
