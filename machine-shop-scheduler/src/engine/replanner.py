from datetime import datetime, timedelta
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
        self.last_constraint_violations = []

    def _parse_time(self, value):
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    def _format_time(self, value):
        return value.isoformat().replace("+00:00", "Z")

    def _classify_schedule(self, current_time):
        completed = []
        in_progress = []
        future = []

        for operation in self.baseline_schedule:
            start = self._parse_time(operation["start_time"])
            end = self._parse_time(operation["end_time"])

            if end <= current_time:
                completed.append(operation)
            elif start <= current_time < end:
                in_progress.append(operation)
            else:
                future.append(operation)

        return completed, in_progress, future

    def _create_interrupted_operation(self, operation, current_time):
        start = self._parse_time(operation["start_time"])
        end = self._parse_time(operation["end_time"])

        elapsed_minutes = max(
            0,
            (current_time - start).total_seconds() / 60
        )

        original_duration = operation.get(
            "duration_minutes",
            (end - start).total_seconds() / 60
        )

        remaining_minutes = max(0, original_duration - elapsed_minutes)

        interrupted = copy.deepcopy(operation)
        interrupted["start_time"] = self._format_time(start)
        interrupted["end_time"] = self._format_time(current_time)
        interrupted["duration_minutes"] = elapsed_minutes
        interrupted["remaining_duration_minutes"] = remaining_minutes
        interrupted["status"] = "INTERRUPTED"
        interrupted["replanned"] = True

        return interrupted

    def _breakdown_window(self, event):
        """Return a machine breakdown's start and end, when both are known."""
        start_time = event.get("start_time")
        if not start_time:
            return None

        start = self._parse_time(start_time)
        duration_hours = event.get("duration_hours")

        if duration_hours is not None:
            return start, start + timedelta(hours=duration_hours)

        if event.get("end_time"):
            return start, self._parse_time(event["end_time"])

        return None

    def _resumable_in_progress_operations(
        self, in_progress, scenario, current_time
    ):
        """Convert work interrupted by a breakdown into work that must be rescheduled."""
        resumable = []
        frozen = []
        breakdowns = [
            (event["target_id"], self._breakdown_window(event))
            for event in scenario.get("events", [])
            if event.get("event_type") == "MACHINE_BREAKDOWN"
        ]

        for operation in in_progress:
            start = self._parse_time(operation["start_time"])
            end = self._parse_time(operation["end_time"])
            interruption = None

            for machine_id, window in breakdowns:
                if machine_id != operation.get("machine_id") or window is None:
                    continue

                downtime_start, downtime_end = window
                if start < downtime_end and end > downtime_start:
                    interruption = max(start, downtime_start)
                    break

            if interruption is None:
                frozen.append(self._create_interrupted_operation(operation, current_time))
                continue

            original_duration = operation.get(
                "duration_minutes", (end - start).total_seconds() / 60
            )
            completed_minutes = max(
                0, (interruption - start).total_seconds() / 60
            )
            remaining_minutes = max(0, original_duration - completed_minutes)

            if remaining_minutes == 0:
                continue

            remaining = copy.deepcopy(operation)
            remaining["duration_minutes"] = remaining_minutes
            remaining["remaining_duration_minutes"] = remaining_minutes
            remaining["status"] = "RESUME_REQUIRED"
            remaining["replanned"] = True
            resumable.append(remaining)

        return frozen, resumable

    def _validate_downtime_constraints(self, schedule, scenario):
        violations = []

        for event in scenario.get("events", []):
            if event.get("event_type") != "MACHINE_BREAKDOWN":
                continue

            window = self._breakdown_window(event)
            if window is None:
                continue

            downtime_start, downtime_end = window
            for operation in schedule:
                if operation.get("machine_id") != event.get("target_id"):
                    continue

                start = self._parse_time(operation["start_time"])
                end = self._parse_time(operation["end_time"])
                if start < downtime_end and end > downtime_start:
                    violations.append({
                        "constraint": "MACHINE_DOWNTIME",
                        "machine_id": event["target_id"],
                        "order_id": operation["order_id"],
                        "op_seq": operation["op_seq"],
                        "start_time": operation["start_time"],
                        "end_time": operation["end_time"],
                    })

        return violations

    def _apply_machine_breakdown(self, machines, event):
        target_id = event["target_id"]

        for machine in machines:
            if machine.machine_id == target_id:
                if hasattr(machine, "status"):
                    machine.status = "DOWN"

        return machines

    def _apply_operator_absence(self, operators, event):
        target_id = event["target_id"]
        return [
            operator
            for operator in operators
            if operator.operator_id != target_id
        ]

    def _affected_operations(self, future_operations, scenario):
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
            key = (operation["order_id"], operation["op_seq"])

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

    def _preserve_unaffected(self, future_operations, affected_keys):
        return [
            operation
            for operation in future_operations
            if (operation["order_id"], operation["op_seq"]) not in affected_keys
        ]

    def _add_downtime_constraints(self, optimizer, scenario):
        for event in scenario.get("events", []):
            if event.get("event_type") == "MACHINE_BREAKDOWN":
                duration_hours = event.get("duration_hours")

                if duration_hours is None:
                    start_time = event.get("start_time")
                    end_time = event.get("end_time")
                    if start_time and end_time:
                        start = self._parse_time(start_time)
                        end = self._parse_time(end_time)
                        duration_hours = (end - start).total_seconds() / 3600
                    else:
                        duration_hours = 0

                optimizer.set_downtime(
                    event["target_id"],
                    event["start_time"],
                    duration_hours
                )

    def apply_scenario(self, scenario):
        current_time = self._parse_time(
            scenario["context"]["current_time"]
        )

        completed, in_progress, future = self._classify_schedule(current_time)

        interrupted, resumable = self._resumable_in_progress_operations(
            in_progress, scenario, current_time
        )
        frozen = completed + interrupted

        modified_machines = copy.deepcopy(self.machines)
        modified_operators = copy.deepcopy(self.operators)

        affected_keys = self._affected_operations(future, scenario)
        affected_keys.update(
            (operation["order_id"], operation["op_seq"])
            for operation in resumable
        )

        for event in scenario.get("events", []):
            event_type = event.get("event_type")

            if event_type == "MACHINE_BREAKDOWN":
                machine_id = event["target_id"]

                # Parse the downtime window so we only affect ops that
                # overlap it — ops outside the window stay preserved.
                downtime_start = None
                downtime_end = None

                if event.get("start_time"):
                    downtime_start = self._parse_time(event["start_time"])

                    duration_hours = event.get("duration_hours")
                    if duration_hours is not None:
                        downtime_end = downtime_start + timedelta(hours=duration_hours)
                    elif event.get("end_time"):
                        downtime_end = self._parse_time(event["end_time"])

                for operation in future:
                    if operation.get("machine_id") != machine_id:
                        continue

                    # If we have a time window, only mark ops that overlap it
                    if downtime_start and downtime_end:
                        op_start = self._parse_time(operation["start_time"])
                        op_end = self._parse_time(operation["end_time"])

                        if op_start >= downtime_end or op_end <= downtime_start:
                            # Outside the downtime window — leave preserved
                            continue

                    affected_keys.add((
                        operation["order_id"],
                        operation["op_seq"]
                    ))

            elif event_type == "OPERATOR_ABSENCE":
                modified_operators = self._apply_operator_absence(
                    modified_operators, event
                )

        preserved = self._preserve_unaffected(future, affected_keys)

        optimizer = Optimizer(modified_machines, modified_operators, self.config)

        self._add_downtime_constraints(optimizer, scenario)

        replanned, _ = optimizer.optimize(
            orders=self.orders,
            baseline_schedule=future + resumable,
            locked_operations=frozen,
            affected_operation_keys=affected_keys,
            current_time=current_time
        )

        final_by_key = {}

        for operation in self.baseline_schedule:
            key = (operation["order_id"], operation["op_seq"])
            final_by_key[key] = operation

        for operation in frozen:
            key = (operation["order_id"], operation["op_seq"])
            final_by_key[key] = operation

        for operation in preserved:
            key = (operation["order_id"], operation["op_seq"])
            final_by_key[key] = operation

        for operation in replanned:
            key = (operation["order_id"], operation["op_seq"])
            final_by_key[key] = operation

        final_schedule = list(final_by_key.values())

        final_schedule.sort(
            key=lambda operation: self._parse_time(operation["start_time"])
        )

        baseline_keys = {
            (operation["order_id"], operation["op_seq"])
            for operation in self.baseline_schedule
        }

        final_keys = {
            (operation["order_id"], operation["op_seq"])
            for operation in final_schedule
        }

        missing = baseline_keys - final_keys

        if missing:
            raise RuntimeError(
                "Replanning lost baseline operations: "
                f"{sorted(missing)}"
            )

        if len(final_schedule) != len(final_keys):
            raise RuntimeError(
                "Final schedule contains duplicate operation keys"
            )

        self.last_constraint_violations = self._validate_downtime_constraints(
            final_schedule, scenario
        )

        self.config["changeover_matrix"] = self.config.get("changeover_matrix", {})
        self.config["replan_change_penalty_lambda"] = self.config.get(
            "replan_change_penalty_lambda", 500
        )

        evaluator = CostEvaluator(
            self.orders,
            modified_operators,
            self.config,
            self.machines
        )

        cost_components = evaluator.evaluate_components(
            final_schedule,
            baseline_schedule=self.baseline_schedule
        )

        total_cost = cost_components["total_cost"]

        return final_schedule, total_cost
