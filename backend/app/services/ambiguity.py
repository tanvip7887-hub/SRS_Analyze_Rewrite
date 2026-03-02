import re
import spacy

# =========================
# CONFIGURATION
# =========================

VAGUE_WORDS = [
    "fast", "quick", "efficient",
    "optimal", "appropriate",
    "robust", "sufficient",
    "adequate", "minimal",
    "etc", "and so on"
]

WEAK_MODALS = ["may", "might", "should"]
TIME_WORDS = ["soon", "later", "immediately", "frequently", "periodically"]
QUANTITY_WORDS = ["several", "some", "many", "few", "most", "enough"]

VAGUE_VERBS = ["handle", "process", "manage"]

PERFORMANCE_PATTERNS = [
    r"response time",
    r"load time",
    r"throughput",
    r"latency"
]

# =========================
# NLP MODEL (Load once)
# =========================
nlp = spacy.load("en_core_web_sm")


# =========================
# HELPER FUNCTIONS
# =========================

def is_missing_measurement(text):
    for pattern in PERFORMANCE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            if not re.search(r"\d+", text):
                return True
    return False


def contains_multiple_shall(text):
    return text.lower().count(" shall ") > 1


# =========================
# MAIN SERVICE FUNCTION
# =========================
def detect_ambiguity(text: str):
    """
    Accepts: requirement text
    Returns: flags + score
    """
    text_lower = text.lower()
    ambiguous_flags = set()
    word_count = len(text.split())

    # Weak modals
    for modal in WEAK_MODALS:
        if re.search(r"\b" + modal + r"\b", text_lower):
            ambiguous_flags.add(f"weak_modal:{modal}")

    # Vague words
    for word in VAGUE_WORDS:
        if word in text_lower:
            ambiguous_flags.add(f"vague_word:{word}")

    # Time expressions
    for word in TIME_WORDS:
        if re.search(r"\b" + word + r"\b", text_lower):
            ambiguous_flags.add(f"time_expression:{word}")

    # Quantity expressions
    for word in QUANTITY_WORDS:
        if re.search(r"\b" + word + r"\b", text_lower):
            ambiguous_flags.add(f"quantity_expression:{word}")

    # Missing measurement
    if is_missing_measurement(text):
        ambiguous_flags.add("missing_measurement")

    # Multiple actions
    if contains_multiple_shall(text):
        ambiguous_flags.add("multiple_actions")

    # Vague verbs (short only)
    for verb in VAGUE_VERBS:
        if re.search(r"\b" + verb + r"\b", text_lower):
            if word_count < 15:
                ambiguous_flags.add(f"vague_verb:{verb}")

    # Too short
    if word_count < 5:
        ambiguous_flags.add("too_short")

    # Score
    score = min(len(ambiguous_flags) / 3, 1.0)

    return {
        "flags": list(ambiguous_flags),
        "ambiguity_score": round(score, 2)
    }