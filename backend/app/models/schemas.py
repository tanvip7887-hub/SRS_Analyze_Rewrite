from pydantic import BaseModel
from typing import List

class RewriteRequest(BaseModel):
    items: List[str]