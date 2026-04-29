import re
import time
import os
from groq import Groq


class RewriteEngine:

    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model = "llama-3.3-70b-versatile"
        self.BATCH_SIZE = 8
        self.RETRY_DELAY = 2

    # --------------------------------------------------
    # CLEANING UTILITIES
    # --------------------------------------------------

    def normalize_modals(self, text: str) -> str:
        text = re.sub(r"\b(should|may|can|could|might|will)\b",
                      "SHALL", text, flags=re.IGNORECASE)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def enforce_shall(self, text: str) -> str:
        text = text.strip()
        text = re.sub(r"^(the system|system)\s+",
                      "", text, flags=re.IGNORECASE)
        text = self.normalize_modals(text)
        if not text.lower().startswith("shall"):
            text = "SHALL " + text
        text = "The system " + text.lstrip()
        return text

    def clean_sentence(self, text: str) -> str:
        text = text.strip()
        text = text.split("\n")[0]
        text = re.split(r"[!?]", text)[0]
        text = text.rstrip(".") + "."
        return text

    # --------------------------------------------------
    # LLM BATCH REWRITE
    # --------------------------------------------------

    def rewrite_batch(self, batch):

        text_block = "\n\n".join(
            [f"[{item['id']}] {item['text']}" for item in batch]
        )

        prompt = f"""You are a Software Requirements Engineering expert specializing in IEEE 830 SRS standards.

Your task is to rewrite ambiguous software requirements to make them clear, atomic, and testable.

Rules:
- Each rewritten requirement MUST start with exactly: The system SHALL
- Replace all vague terms (fast, efficient, user-friendly, easy, good, quick, simple, etc.) with specific measurable criteria
- Make it atomic — one requirement per item
- Keep it one sentence only
- Preserve the original intent
- Keep the same ID format exactly

STRICT OUTPUT FORMAT (no extra text, no explanations):
[FR-01] The system SHALL ...
[FR-02] The system SHALL ...

Requirements to rewrite:

{text_block}
"""

        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2048,
                    temperature=0.1,
                )
                return response.choices[0].message.content.strip()

            except Exception as e:
                print(f"Groq attempt {attempt + 1} failed: {e}")
                time.sleep(self.RETRY_DELAY)

        # Fallback
        return "\n".join(
            [f"[{item['id']}] {self.enforce_shall(item['text'])}"
             for item in batch]
        )

    # --------------------------------------------------
    # PARSER
    # --------------------------------------------------

    def parse_output(self, raw_output, batch):

        parsed = {}
        batch_ids = [item["id"] for item in batch]

        pattern = r"\[(.*?)\]\s*(.*)"
        matches = re.findall(pattern, raw_output)

        for req_id, sentence in matches:
            req_id = req_id.strip()
            sentence = sentence.strip()
            if req_id in batch_ids:
                sentence = self.enforce_shall(sentence)
                sentence = self.clean_sentence(sentence)
                parsed[req_id] = sentence

        # Fallback for any missed items
        for item in batch:
            if item["id"] not in parsed:
                parsed[item["id"]] = self.enforce_shall(item["text"])

        return parsed

    # --------------------------------------------------
    # MAIN
    # --------------------------------------------------

    def rewrite_all(self, ambiguous_list):

        output = []
        total = len(ambiguous_list)

        print(f"Rewriting {total} ambiguous requirements using Groq (Llama 3.1 70B)...")

        for i in range(0, total, self.BATCH_SIZE):
            batch = ambiguous_list[i:i + self.BATCH_SIZE]
            print(f"  Processing batch {i // self.BATCH_SIZE + 1} ({len(batch)} items)...")

            raw = self.rewrite_batch(batch)
            parsed = self.parse_output(raw, batch)

            for item in batch:
                output.append({
                    "id": item["id"],
                    "original": item["text"],
                    "rewritten": parsed[item["id"]]
                })

        print("Rewrite complete!")
        return output


def rewrite_ambiguous(ambiguous_list):
    engine = RewriteEngine()
    return engine.rewrite_all(ambiguous_list)