from datetime import datetime
import copy

from .optimizer import Optimizer
from .cost_evaluator import CostEvaluator


class Replanner:
    def __init__(
        self,
        baseline_schedule,
        machines,
        operators,
        orders,
        config
    ):
        self.baseline_schedule = baseline_schedule
        self.machines = machines
        self.operators = operators
        self.orders = orders
        self.config = config

    def _parse_time(self, value):
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    def _classify_schedule(self, current_time):
        completed = []
        in_progress = []
        future = []

        for operation in self.baseline_schedule:
            start = self._parse_time(
                operation["start_time"]
            )
            end = self._parse_time(
                operation["end_time"]
            )

            if end <= current_time:
                completed.append(operation)
            elif start <= current_time < end:
                in_progress.append(operation)
            else:
                future.append(operation)

        return completed, in_progress, future

    def _apply_machine_breakdown(
        self,
        machines,
        event
    ):
        target_id = event["target_id"]

        for machine in machines:
            if machine.machine_id == target_id:
                machine.status = "DOWN"

    def _remove_absent_operator(
        self,
        operators,
        event
    ):
        target_id = event["target_id"]

        return [
            operator
            for operator in operators
            if operator.operator_id != target_id
        ]

    def _affected_operations(
        self,
        future_operations,
        scenario
    ):
        affected = set()

        machine_ids = set()
        operator_ids = set()
        delayed_orders = set()
        rework_orders = set()

        for event in scenario.get("events", []):
            event_type = event.get("event_type")
            target_id = event.get("target_id")

            if event_type == "MACHINE_BREAKDOWN":
                machine_ids.add(target_id)

            elif event_type == "OPERATOR_ABSENCE":
                operator_ids.add(target_id)

            elif event_type == "MATERIAL_DELAY":
                delayed_orders.add(target_id)

            elif event_type == "REWORK_GENERATED":
                rework_orders.add(target_id)

        for operation in future_operations:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            if operation.get("machine_id") in machine_ids:
                affected.add(key)
                continue

            if operation.get("operator_id") in operator_ids:
                affected.add(key)
                continue

            if operation.get("order_id") in delayed_orders:
                affected.add(key)
                continue

            if operation.get("order_id") in rework_orders:
                affected.add(key)

        return affected

    def _preserve_unaffected(
        self,
        future_operations,
        affected_keys
    ):
        return [
            operation
            for operation in future_operations
            if (
                operation["order_id"],
                operation["op_seq"]
            ) not in affected_keys
        ]

    def apply_scenario(self, scenario):
        current_time = self._parse_time(
            scenario["context"]["current_time"]
        )

        completed, in_progress, future = (
            self._classify_schedule(
                current_time
            )
        )

        frozen = completed + in_progress

        modified_machines = copy.deepcopy(
            self.machines
        )

        modified_operators = copy.deepcopy(
            self.operators
        )

        for event in scenario.get("events", []):
            event_type = event.get("event_type")

            if event_type == "MACHINE_BREAKDOWN":
                self._apply_machine_breakdown(
                    modified_machines,
                    event
                )

            elif event_type == "OPERATOR_ABSENCE":
                modified_operators = (
                    self._remove_absent_operator(
                        modified_operators,
                        event
                    )
                )

        affected_keys = self._affected_operations(
            future,
            scenario
        )

        preserved = self._preserve_unaffected(
            future,
            affected_keys
        )

        optimizer = Optimizer(
        modified_machines,
        modified_operators,
        self.config
)

        for event in scenario.get("events", []):
          if event.get("event_type") == "MACHINE_BREAKDOWN":
            optimizer.set_downtime(
            event["target_id"],
            event["start_time"],
            event["duration_hours"]
        )

        replanned, _ = optimizer.optimize(
        orders=self.orders,
        baseline_schedule=future,
        locked_operations=frozen,
        affected_operation_keys=affected_keys,
        current_time=current_time
)

        final_by_key = {}

        for operation in self.baseline_schedule:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            final_by_key[key] = operation

        for operation in frozen:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            final_by_key[key] = operation

        for operation in preserved:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            final_by_key[key] = operation

        for operation in replanned:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            final_by_key[key] = operation

        final_schedule = list(
            final_by_key.values()
        )

        final_schedule.sort(
            key=lambda operation: self._parse_time(
                operation["start_time"]
            )
        )

        baseline_keys = {
            (
                operation["order_id"],
                operation["op_seq"]
            )
            for operation in self.baseline_schedule
        }

        final_keys = {
            (
                operation["order_id"],
                operation["op_seq"]
            )
            for operation in final_schedule
        }

        missing = baseline_keys - final_keys

        if missing:
            raise RuntimeError(
                f"Replanning lost baseline operations: "
                f"{sorted(missing)}"
            )

        if len(final_schedule) != len(final_keys):
            raise RuntimeError(
                "Final schedule contains duplicate operation keys"
            )

        evaluator = CostEvaluator(
            self.orders,
            modified_operators,
            self.config
        )

        total_cost = evaluator.evaluate_total_cost(
            final_schedule,
            baseline_schedule=self.baseline_schedule
        )

        return final_schedule, total_cost