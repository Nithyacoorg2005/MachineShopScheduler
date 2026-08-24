import json
import os

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..models.machine import Machine
from ..models.operator import Operator
from ..models.order import Order
from ..models.routing import RoutingStep
from ..engine import (
    Dispatcher,
    Replanner,
    CostEvaluator,
    ScheduleDiff,
    CostBreakdown,
)

router = APIRouter()


def load_baseline_data():
    base_dir = os.path.dirname(
        os.path.dirname(
            os.path.dirname(__file__)
        )
    )

    filepath = os.path.join(
        base_dir,
        "data",
        "generated",
        "baseline.json"
    )

    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=404,
            detail="Baseline data not found"
        )

    with open(filepath, "r") as f:
        data = json.load(f)

    machines = [
        Machine(**machine)
        for machine in data["machines"]
    ]

    operators = [
        Operator(**operator)
        for operator in data["operators"]
    ]

    orders = []

    for order_data in data["orders"]:
        routing_steps = [
            RoutingStep(**step)
            for step in order_data["routing"]
        ]

        clean_order = {
            key: value
            for key, value in order_data.items()
            if key != "routing"
        }

        orders.append(
            Order(
                **clean_order,
                routing=routing_steps
            )
        )

    config = dict(
        data.get(
            "shop_config",
            {}
        )
    )

    config["changeover_matrix"] = data.get(
        "changeover_matrix",
        {}
    )

    config["replan_change_penalty_lambda"] = (
        config.get(
            "replan_change_penalty_lambda",
            500
        )
    )

    return (
        machines,
        operators,
        orders,
        config
    )


@router.get("/baseline")
def get_baseline_schedule():
    (
        machines,
        operators,
        orders,
        config
    ) = load_baseline_data()

    dispatcher = Dispatcher(
        machines,
        operators,
        orders,
        config
    )

    schedule = dispatcher.dispatch()

    evaluator = CostEvaluator(
        orders,
        operators,
        config,
        machines
    )

    cost_components = evaluator.evaluate_components(
        schedule
    )

    return {
        "status": "success",
        "operations_count": len(schedule),
        "cost": cost_components["total_cost"],
        "cost_breakdown": {
            "late_penalty": cost_components[
                "late_penalty"
            ],
            "overtime_cost": cost_components[
                "overtime_cost"
            ],
            "changeover_cost": cost_components[
                "changeover_cost"
            ],
            "stability_penalty": cost_components[
                "stability_penalty"
            ],
            "total_cost": cost_components[
                "total_cost"
            ]
        },
        "schedule": schedule
    }


@router.post("/replan")
def run_replanner(
    scenario: Dict[str, Any]
):
    (
        machines,
        operators,
        orders,
        config
    ) = load_baseline_data()

    dispatcher = Dispatcher(
        machines,
        operators,
        orders,
        config
    )

    baseline_schedule = dispatcher.dispatch()

    replanner = Replanner(
        baseline_schedule,
        machines,
        operators,
        orders,
        config
    )

    new_schedule, _ = (
        replanner.apply_scenario(
            scenario
        )
    )

    diff_engine = ScheduleDiff(
        baseline_schedule,
        new_schedule
    )

    diff_report = diff_engine.to_report()

    cost_engine = CostBreakdown(
        orders,
        operators,
        config,
        machines
    )

    cost_report = cost_engine.calculate(
        baseline_schedule,
        new_schedule
    )

    authoritative_cost = (
        cost_report[
            "replanned"
        ][
            "total_cost"
        ]
    )

    return {
        "status": "success",
        "operations_count": len(new_schedule),
        "cost": authoritative_cost,
        "cost_breakdown": cost_report,
        "diff": diff_report,
        "schedule": new_schedule
    }