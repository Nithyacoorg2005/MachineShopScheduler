import json
import os

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from ..models.machine import Machine
from ..models.operator import Operator
from ..models.order import Order
from ..models.routing import RoutingStep
from ..engine import Dispatcher, Replanner, CostEvaluator

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

        order_data = {
            key: value
            for key, value in order_data.items()
            if key != "routing"
        }

        orders.append(
            Order(
                **order_data,
                routing=routing_steps
            )
        )

    return (
        machines,
        operators,
        orders,
        data.get("shop_config", {})
    )


@router.get("/baseline")
def get_baseline_schedule():
    machines, operators, orders, config = (
        load_baseline_data()
    )

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
        config
    )

    cost = evaluator.evaluate_total_cost(
        schedule
    )

    return {
        "status": "success",
        "operations_count": len(schedule),
        "cost": cost,
        "schedule": schedule
    }


@router.post("/replan")
def run_replanner(
    scenario: Dict[str, Any]
):
    machines, operators, orders, config = (
        load_baseline_data()
    )

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

    new_schedule, new_cost = (
        replanner.apply_scenario(
            scenario
        )
    )

    return {
        "status": "success",
        "operations_count": len(new_schedule),
        "cost": new_cost,
        "schedule": new_schedule
    }