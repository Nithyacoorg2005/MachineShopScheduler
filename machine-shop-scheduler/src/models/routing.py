from dataclasses import dataclass

@dataclass
class RoutingStep:
    op_seq: int
    type: str
    time_per_piece_mins: float