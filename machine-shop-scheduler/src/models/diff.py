from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class OperationDiff:
    operation_id: str
    order_id: str
    operation_seq: int
    change_type: str
    old_machine_id: Optional[str] = None
    new_machine_id: Optional[str] = None
    old_operator_id: Optional[str] = None
    new_operator_id: Optional[str] = None
    old_start: Optional[datetime] = None
    new_start: Optional[datetime] = None
    old_end: Optional[datetime] = None
    new_end: Optional[datetime] = None
    reason: Optional[str] = None