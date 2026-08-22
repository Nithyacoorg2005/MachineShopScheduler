from dataclasses import dataclass
from typing import List

@dataclass
class Operator:
    operator_id: str
    name: str
    shift: str
    certified_machines: List[str]
    absenteeism_prob: float