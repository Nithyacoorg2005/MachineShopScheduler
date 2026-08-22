from dataclasses import dataclass
from typing import List

@dataclass
class RoutingStep:
    op_seq: int
    type: str
    time_per_piece_mins: float

@dataclass
class Order:
    order_id: str
    customer_tier: str
    part_family: str
    quantity: int
    due_date: str
    daily_late_penalty: float
    unit_margin: float
    routing: List[RoutingStep]