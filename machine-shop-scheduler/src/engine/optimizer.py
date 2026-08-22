from datetime import datetime, timedelta


class Optimizer:
    def __init__(self, machines, operators, config):
        self.machines = machines
        self.operators = operators
        self.config = config
        self.machine_map = {
            machine.machine_id: machine
            for machine in machines
        }
        self.machine_downtime = {}

    def _normalize_type(self, value):
        mapping = {
            "CNC_LATHE": "CNC Lathe",
            "MILLING": "Milling",
            "DRILL": "Drill",
            "GRINDING": "Grinding",
            "CNC Lathe": "CNC Lathe",
            "Milling": "Milling",
            "Drill": "Drill",
            "Grinding": "Grinding",
            "Inspection": "Inspection"
        }
        return mapping.get(value, value)

    def _parse_time(self, value):
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    def set_downtime(self, machine_id, start_time, duration_hours):
        start = self._parse_time(start_time)

        end = start + timedelta(
            hours=duration_hours
        )

        self.machine_downtime.setdefault(
            machine_id,
            []
        ).append(
            (start, end)
        )

    def _machine_available_after_downtime(
        self,
        machine_id,
        start_time,
        duration
    ):
        candidate = start_time

        while True:
            end_time = (
                candidate +
                timedelta(minutes=duration)
            )

            moved = False

            for downtime_start, downtime_end in (
                self.machine_downtime.get(
                    machine_id,
                    []
                )
            ):
                overlaps = (
                    candidate < downtime_end
                    and end_time > downtime_start
                )

                if not overlaps:
                    continue

                candidate = downtime_end
                moved = True
                break

            if not moved:
                return candidate

    def _capable_machines(self, operation_type):
        normalized = self._normalize_type(
            operation_type
        )

        return [
            machine
            for machine in self.machines
            if self._normalize_type(
                machine.type
            ) == normalized
            and getattr(
                machine,
                "status",
                "AVAILABLE"
            ) != "DOWN"
        ]

    def _operator_available(
        self,
        machine_id,
        timestamp
    ):
        for operator in self.operators:
            if machine_id not in operator.certified_machines:
                continue

            return operator.operator_id

        return None

    def _find_machine(
        self,
        operation,
        machine_available,
        earliest
    ):
        operation_type = self._normalize_type(
            operation["operation_type"]
        )

        machines = self._capable_machines(
            operation_type
        )

        if not machines:
            return None

        duration = operation.get(
            "duration_minutes",
            0
        )

        candidates = []

        for machine in machines:
            available = max(
                machine_available.get(
                    machine.machine_id,
                    earliest
                ),
                earliest
            )

            available = (
                self._machine_available_after_downtime(
                    machine.machine_id,
                    available,
                    duration
                )
            )

            candidates.append(
                (
                    available,
                    machine.machine_id
                )
            )

        candidates.sort(
            key=lambda x: x[0]
        )

        return candidates[0]

    def optimize(
        self,
        orders,
        baseline_schedule,
        locked_operations=None,
        affected_operation_keys=None,
        current_time=None
    ):
        locked_operations = locked_operations or []

        affected_operation_keys = (
            affected_operation_keys or set()
        )

        result = []

        machine_available = {}

        for operation in locked_operations:
            machine_id = operation.get(
                "machine_id"
            )

            if machine_id is None:
                continue

            end_time = self._parse_time(
                operation["end_time"]
            )

            current = machine_available.get(
                machine_id
            )

            if (
                current is None
                or end_time > current
            ):
                machine_available[
                    machine_id
                ] = end_time

        operations_by_order = {}

        for operation in baseline_schedule:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            if key not in affected_operation_keys:
                continue

            operations_by_order.setdefault(
                operation["order_id"],
                []
            ).append(operation)

        for order in orders:
            baseline_operations = (
                operations_by_order.get(
                    order.order_id,
                    []
                )
            )

            if not baseline_operations:
                continue

            baseline_operations.sort(
                key=lambda x: x["op_seq"]
            )

            previous_end = current_time

            if previous_end is None:
                previous_end = min(
                    self._parse_time(
                        op["start_time"]
                    )
                    for op in baseline_operations
                )

            for baseline_operation in baseline_operations:
                key = (
                    baseline_operation["order_id"],
                    baseline_operation["op_seq"]
                )

                if key not in affected_operation_keys:
                    continue

                operation_type = (
                    baseline_operation.get(
                        "operation_type"
                    )
                )

                duration = baseline_operation.get(
                    "remaining_duration_minutes",
                    baseline_operation.get(
                    "duration_minutes",
                    0
                    )
                )

                if operation_type == "Inspection":
                    start_time = previous_end

                    end_time = (
                        start_time +
                        timedelta(
                            minutes=duration
                        )
                    )

                    new_operation = dict(
                        baseline_operation
                    )

                    new_operation[
                        "start_time"
                    ] = start_time.isoformat().replace(
                        "+00:00",
                        "Z"
                    )

                    new_operation[
                        "end_time"
                    ] = end_time.isoformat().replace(
                        "+00:00",
                        "Z"
                    )

                    new_operation[
                        "replanned"
                    ] = True

                    result.append(
                        new_operation
                    )

                    previous_end = end_time
                    continue

                machine_result = self._find_machine(
                    baseline_operation,
                    machine_available,
                    previous_end
                )

                if machine_result is None:
                    continue

                start_time, machine_id = (
                    machine_result
                )

                end_time = (
                    start_time +
                    timedelta(
                        minutes=duration
                    )
                )

                operator_id = (
                    self._operator_available(
                        machine_id,
                        start_time
                    )
                )

                if operator_id is None:
                    continue

                new_operation = dict(
                    baseline_operation
                )

                new_operation[
                    "machine_id"
                ] = machine_id

                new_operation[
                    "operator_id"
                ] = operator_id

                new_operation[
                    "start_time"
                ] = start_time.isoformat().replace(
                    "+00:00",
                    "Z"
                )

                new_operation[
                    "end_time"
                ] = end_time.isoformat().replace(
                    "+00:00",
                    "Z"
                )

                new_operation[
                    "is_overtime"
                ] = False

                new_operation[
                    "replanned"
                ] = True

                result.append(
                    new_operation
                )

                machine_available[
                    machine_id
                ] = end_time

                previous_end = end_time

        result.sort(
            key=lambda operation: self._parse_time(
                operation["start_time"]
            )
        )

        return result, 0.0