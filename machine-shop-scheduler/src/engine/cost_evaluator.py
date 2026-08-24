from datetime import datetime


class CostEvaluator:
    def __init__(
        self,
        orders,
        operators,
        config,
        machines=None
    ):
        self.orders = orders
        self.operators = operators
        self.config = config
        self.machines = machines or []

        self.order_map = {
            order.order_id: order
            for order in orders
        }

        self.machine_map = {
            machine.machine_id: machine
            for machine in self.machines
        }

    def _parse_time(self, value):
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    def calculate_late_penalty(self, schedule):
        completion_times = {}

        for operation in schedule:
            order_id = operation["order_id"]

            end_time = self._parse_time(
                operation["end_time"]
            )

            current_end = completion_times.get(
                order_id
            )

            if (
                current_end is None
                or end_time > current_end
            ):
                completion_times[order_id] = end_time

        total_penalty = 0.0

        for order in self.orders:
            completion = completion_times.get(
                order.order_id
            )

            if completion is None:
                continue

            due_date = self._parse_time(
                order.due_date
            )

            if completion <= due_date:
                continue

            delay_seconds = (
                completion - due_date
            ).total_seconds()

            late_days = max(
                1.0,
                delay_seconds / 86400.0
            )

            total_penalty += (
                late_days
                * float(order.daily_late_penalty)
            )

        return total_penalty

    def calculate_overtime_cost(self, schedule):
        overtime_multiplier = float(
            self.config.get(
                "overtime_rate_multiplier",
                1.5
            )
        )

        total = 0.0

        for operation in schedule:
            if not operation.get(
                "is_overtime",
                False
            ):
                continue

            machine_id = operation.get(
                "machine_id"
            )

            machine = self.machine_map.get(
                machine_id
            )

            if machine is None:
                continue

            duration_minutes = float(
                operation.get(
                    "duration_minutes",
                    0
                )
            )

            hourly_cost = float(
                machine.hourly_cost
            )

            total += (
                duration_minutes / 60.0
                * hourly_cost
                * overtime_multiplier
            )

        return total

    def _get_changeover_matrix(self):
        matrix_data = self.config.get(
            "changeover_matrix",
            {}
        )

        if "matrix" in matrix_data:
            return matrix_data["matrix"]

        return matrix_data

    def calculate_changeover_cost(self, schedule):
        matrix = self._get_changeover_matrix()

        machine_operations = {}

        for operation in schedule:
            machine_id = operation.get(
                "machine_id"
            )

            if machine_id is None:
                continue

            machine_operations.setdefault(
                machine_id,
                []
            ).append(operation)

        total = 0.0

        for machine_id, operations in (
            machine_operations.items()
        ):
            machine = self.machine_map.get(
                machine_id
            )

            if machine is None:
                continue

            operations.sort(
                key=lambda operation:
                self._parse_time(
                    operation["start_time"]
                )
            )

            previous_family = None

            for operation in operations:
                order = self.order_map.get(
                    operation["order_id"]
                )

                if order is None:
                    continue

                current_family = order.part_family

                if previous_family is not None:
                    setup_minutes = float(
                        matrix.get(
                            previous_family,
                            {}
                        ).get(
                            current_family,
                            0
                        )
                    )

                    total += (
                        setup_minutes / 60.0
                    ) * float(
                        machine.hourly_cost
                    )

                previous_family = current_family

        return total

    def calculate_replanning_penalty(
        self,
        baseline_schedule,
        final_schedule
    ):
        baseline_map = {
            (
                operation["order_id"],
                operation["op_seq"]
            ): operation
            for operation in baseline_schedule
        }

        penalty_lambda = float(
            self.config.get(
                "replan_change_penalty_lambda",
                500
            )
        )

        changes = 0

        for operation in final_schedule:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            baseline = baseline_map.get(
                key
            )

            if baseline is None:
                continue

            changed = (
                baseline.get("machine_id")
                != operation.get("machine_id")
                or
                baseline.get("operator_id")
                != operation.get("operator_id")
                or
                baseline.get("start_time")
                != operation.get("start_time")
            )

            if changed:
                changes += 1

        return changes * penalty_lambda

    def evaluate_components(
        self,
        schedule,
        baseline_schedule=None
    ):
        late_penalty = (
            self.calculate_late_penalty(
                schedule
            )
        )

        overtime_cost = (
            self.calculate_overtime_cost(
                schedule
            )
        )

        changeover_cost = (
            self.calculate_changeover_cost(
                schedule
            )
        )

        stability_penalty = 0.0

        if baseline_schedule is not None:
            stability_penalty = (
                self.calculate_replanning_penalty(
                    baseline_schedule,
                    schedule
                )
            )

        total_cost = (
            late_penalty
            + overtime_cost
            + changeover_cost
            + stability_penalty
        )

        return {
            "late_penalty": round(
                late_penalty,
                2
            ),
            "overtime_cost": round(
                overtime_cost,
                2
            ),
            "changeover_cost": round(
                changeover_cost,
                2
            ),
            "stability_penalty": round(
                stability_penalty,
                2
            ),
            "total_cost": round(
                total_cost,
                2
            )
        }

    def evaluate_total_cost(
        self,
        schedule,
        baseline_schedule=None
    ):
        components = self.evaluate_components(
            schedule,
            baseline_schedule
        )

        return components["total_cost"]