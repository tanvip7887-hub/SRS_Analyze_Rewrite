from dotenv import load_dotenv
load_dotenv()
from app.services.rewrite_engine import rewrite_ambiguous

test = [
    {'id': 'FR-01', 'text': 'The system SHALL provide a fast and user-friendly interface.'},
    {'id': 'FR-02', 'text': 'The system SHALL efficiently process user requests.'}
]

result = rewrite_ambiguous(test)
for r in result:
    print(r['id'])
    print(f"  Original : {r['original']}")
    print(f"  Rewritten: {r['rewritten']}")
    print()