from datetime import datetime, timedelta


class CostEvaluator:
    def __init__(self, orders, operators, config):
        self.orders = orders
        self.operators = operators
        self.config = config

        self.order_map = {
            order.order_id: order
            for order in orders
        }

    def _parse_time(self, value):
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    def calculate_late_penalty(self, schedule):
        completion_times = {}

        for operation in schedule:
            order_id = operation["order_id"]
            end_time = self._parse_time(operation["end_time"])

            if (
                order_id not in completion_times
                or end_time > completion_times[order_id]
            ):
                completion_times[order_id] = end_time

        total_penalty = 0.0

        for order in self.orders:
            completion = completion_times.get(order.order_id)

            if completion is None:
                continue

            due_date = self._parse_time(order.due_date)

            if completion > due_date:
                delay = completion - due_date
                late_days = max(
                    1,
                    (delay.total_seconds() / 86400)
                )

                total_penalty += (
                    late_days *
                    order.daily_late_penalty
                )

        return total_penalty

    def calculate_overtime_cost(self, schedule):
        overtime_multiplier = self.config.get(
            "overtime_rate_multiplier",
            1.5
        )

        total = 0.0

        machine_costs = {}

        for operation in schedule:
            if not operation.get("is_overtime", False):
                continue

            machine_id = operation.get("machine_id")

            if machine_id is None:
                continue

            duration_minutes = operation.get(
                "duration_minutes",
                0
            )

            machine_cost = machine_costs.get(
                machine_id,
                0
            )

            total += (
                duration_minutes / 60
            ) * machine_cost * overtime_multiplier

        return total

    def calculate_changeover_cost(self, schedule):
        matrix_data = self.config.get(
            "changeover_matrix",
            {}
        )

        matrix = matrix_data.get(
            "matrix",
            {}
        )

        machine_operations = {}

        for operation in schedule:
            machine_id = operation.get("machine_id")

            if machine_id is None:
                continue

            machine_operations.setdefault(
                machine_id,
                []
            ).append(operation)

        total = 0.0

        for machine_id, operations in machine_operations.items():
            operations.sort(
                key=lambda x: self._parse_time(
                    x["start_time"]
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
                    setup_minutes = matrix.get(
                        previous_family,
                        {}
                    ).get(
                        current_family,
                        0
                    )

                    total += (
                        setup_minutes / 60
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
                op["order_id"],
                op["op_seq"]
            ): op
            for op in baseline_schedule
        }

        penalty_lambda = self.config.get(
            "replan_change_penalty_lambda",
            500
        )

        changes = 0

        for operation in final_schedule:
            key = (
                operation["order_id"],
                operation["op_seq"]
            )

            baseline = baseline_map.get(key)

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

    def evaluate_total_cost(
        self,
        schedule,
        baseline_schedule=None
    ):
        late_penalty = self.calculate_late_penalty(
            schedule
        )

        overtime_cost = self.calculate_overtime_cost(
            schedule
        )

        changeover_cost = self.calculate_changeover_cost(
            schedule
        )

        replan_penalty = 0.0

        if baseline_schedule is not None:
            replan_penalty = self.calculate_replanning_penalty(
                baseline_schedule,
                schedule
            )

        return (
            late_penalty
            + overtime_cost
            + changeover_cost
            + replan_penalty
        )