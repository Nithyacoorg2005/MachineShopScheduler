from dataclasses import dataclass

@dataclass
class Machine:
    machine_id: str
    type: str
    hourly_cost: float
    mtbf_hrs: float
    mttr_hrs: float