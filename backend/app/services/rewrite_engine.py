import re
import time
from openai import OpenAI


class RewriteEngine:

    def __init__(self,
                 base_url="http://localhost:1234/v1",
                 model="qwen2.5-coder-1.5b-instruct"):

        self.client = OpenAI(base_url=base_url, api_key="lm-studio")
        self.model = model
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

        # Remove starting variations
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

        prompt = f"""
You are a Software Requirements Engineering expert.

Rewrite each requirement so that:
- It is clear
- It is atomic
- It is testable
- It starts EXACTLY with: The system SHALL
- One sentence only
- Keep the same ID format

STRICT OUTPUT FORMAT:
[FR-01] The system SHALL ...

Rewrite:

{text_block}
"""

        for _ in range(2):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=1800,
                    temperature=0.05,
                )

                return response.choices[0].message.content.strip()

            except Exception:
                time.sleep(self.RETRY_DELAY)

        # Simple fallback (no aggressive rewrite)
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

        # fallback if LLM misses something
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

        for i in range(0, total, self.BATCH_SIZE):

            batch = ambiguous_list[i:i + self.BATCH_SIZE]

            raw = self.rewrite_batch(batch)
            parsed = self.parse_output(raw, batch)

            for item in batch:
                output.append({
                    "id": item["id"],
                    "original": item["text"],
                    "rewritten": parsed[item["id"]]
                })

        return output


def rewrite_ambiguous(ambiguous_list):
    engine = RewriteEngine()
    return engine.rewrite_all(ambiguous_list)