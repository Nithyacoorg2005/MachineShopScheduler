from .cost_evaluator import CostEvaluator


class CostBreakdown:
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

        self.evaluator = CostEvaluator(
            orders,
            operators,
            config,
            machines
        )

    def calculate(
        self,
        baseline_schedule,
        replanned_schedule
    ):
        baseline = self.evaluator.evaluate_components(
            baseline_schedule
        )

        replanned = self.evaluator.evaluate_components(
            replanned_schedule,
            baseline_schedule=baseline_schedule
        )

        late_delta = (
            replanned["late_penalty"]
            - baseline["late_penalty"]
        )

        overtime_delta = (
            replanned["overtime_cost"]
            - baseline["overtime_cost"]
        )

        changeover_delta = (
            replanned["changeover_cost"]
            - baseline["changeover_cost"]
        )

        stability_penalty = (
            replanned["stability_penalty"]
        )

        incremental_cost = round(
            late_delta
            + overtime_delta
            + changeover_delta
            + stability_penalty,
            2
        )

        return {
            "baseline": {
                "late_penalty": round(
                    baseline["late_penalty"],
                    2
                ),
                "overtime_cost": round(
                    baseline["overtime_cost"],
                    2
                ),
                "changeover_cost": round(
                    baseline["changeover_cost"],
                    2
                ),
                "total_cost": round(
                    baseline["total_cost"],
                    2
                )
            },
            "replanned": {
                "late_penalty": round(
                    replanned["late_penalty"],
                    2
                ),
                "overtime_cost": round(
                    replanned["overtime_cost"],
                    2
                ),
                "changeover_cost": round(
                    replanned["changeover_cost"],
                    2
                ),
                "stability_penalty": round(
                    replanned["stability_penalty"],
                    2
                ),
                "total_cost": round(
                    replanned["total_cost"],
                    2
                )
            },
            "delta": {
                "late_penalty": round(
                    late_delta,
                    2
                ),
                "overtime_cost": round(
                    overtime_delta,
                    2
                ),
                "changeover_cost": round(
                    changeover_delta,
                    2
                ),
                "stability_penalty": round(
                    stability_penalty,
                    2
                ),
                "incremental_cost": incremental_cost
            }
        }