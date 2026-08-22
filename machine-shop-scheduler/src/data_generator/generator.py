import json
import random
from datetime import datetime, timedelta

from . import config


MACHINE_PREFIXES = {
    "CNC_LATHE": "LATHE",
    "MILLING": "MILL",
    "DRILL": "DRILL",
    "GRINDING": "GRINDER",
}

ROUTING_TEMPLATES = [
    ["CNC Lathe", "Milling", "Drill", "Inspection"],
    ["CNC Lathe", "Milling", "Grinding", "Inspection"],
    ["CNC Lathe", "Drill", "Milling", "Inspection"],
    ["CNC Lathe", "Milling", "Drill", "Grinding", "Inspection"],
    ["CNC Lathe", "Drill", "Grinding", "Inspection"],
    ["CNC Lathe", "Milling", "Grinding", "Drill", "Inspection"],
]


def generate_machines(rng):
    machines = []

    for machine_type, props in config.MACHINE_TYPES.items():
        prefix = MACHINE_PREFIXES[machine_type]

        for index in range(1, props["count"] + 1):
            machines.append({
                "machine_id": f"{prefix}-{index:02d}",
                "type": machine_type,
                "hourly_cost": props["hourly_cost"],
                "mtbf_hrs": round(
                    rng.uniform(*props["mtbf_hrs_range"]), 1
                ),
                "mttr_hrs": round(
                    rng.uniform(*props["mttr_hrs_range"]), 1
                ),
                "status": "AVAILABLE"
            })

    return machines


def generate_operators(machines, rng):
    operators = []

    non_grinder_machines = [
        machine["machine_id"]
        for machine in machines
        if machine["type"] != "GRINDING"
    ]

    grinder_machine = next(
        machine["machine_id"]
        for machine in machines
        if machine["type"] == "GRINDING"
    )

    grinder_indices = set(
        rng.sample(
            range(config.TOTAL_OPERATORS),
            config.GRINDER_CERTIFIED_COUNT
        )
    )

    for index in range(config.TOTAL_OPERATORS):
        shift = (
            "A"
            if index < config.TOTAL_OPERATORS // 2
            else "B"
        )

        if index in grinder_indices:
            additional_count = rng.randint(1, 2)
            additional_certifications = rng.sample(
                non_grinder_machines,
                additional_count
            )

            certifications = [
                grinder_machine,
                *additional_certifications
            ]
        else:
            certification_count = min(
                rng.randint(2, 4),
                len(non_grinder_machines)
            )

            certifications = rng.sample(
                non_grinder_machines,
                certification_count
            )

        operators.append({
            "operator_id": f"OP-{index + 1:03d}",
            "name": f"Operator_{index + 1:03d}",
            "shift": shift,
            "certified_machines": sorted(set(certifications)),
            "absenteeism_prob": round(
                rng.uniform(
                    *config.ABSENTEEISM_PROBABILITY_RANGE
                ),
                3
            )
        })

    return operators


def generate_changeover_matrix(rng):
    families = config.PART_FAMILIES
    matrix = {}

    for from_family in families:
        matrix[from_family] = {}

        for to_family in families:
            if from_family == to_family:
                matrix[from_family][to_family] = (
                    config.SAME_FAMILY_SETUP_MINS
                )
            else:
                matrix[from_family][to_family] = rng.randint(
                    *config.CROSS_FAMILY_SETUP_MINS_RANGE
                )

    return matrix


def generate_operation_time(operation_type, rng):
    ranges = {
        "CNC Lathe": (1.0, 5.0),
        "Milling": (1.0, 5.0),
        "Drill": (1.0, 4.0),
        "Grinding": (0.8, 2.5),
        "Inspection": (0.2, 0.8),
    }

    minimum, maximum = ranges[operation_type]

    return round(
        rng.uniform(minimum, maximum),
        2
    )


def generate_routing(rng):
    template = list(rng.choice(ROUTING_TEMPLATES))

    routing = []

    for sequence, operation_type in enumerate(template, start=1):
        routing.append({
            "op_seq": sequence,
            "type": operation_type,
            "time_per_piece_mins": generate_operation_time(
                operation_type,
                rng
            )
        })

    return routing


def generate_order_quantity(tier, rng):
    minimum, maximum = config.ORDER_QTY_RANGE

    base_quantity = rng.randint(
        minimum,
        maximum
    )

    multipliers = (
        config.TIER_1_MULTIPLIERS
        if tier == "Tier-1"
        else config.TIER_2_MULTIPLIERS
    )

    quantity = int(
        base_quantity *
        multipliers["volume_skew"]
    )

    return max(
        minimum,
        min(maximum, quantity)
    )


def generate_orders(rng):
    orders = []

    base_date = datetime(
        2026,
        8,
        24,
        6,
        0
    )

    for index in range(1, config.TARGET_ORDERS + 1):
        is_tier_1 = (
            rng.random() <
            config.TIER_1_PROBABILITY
        )

        tier = (
            "Tier-1"
            if is_tier_1
            else "Tier-2"
        )

        multipliers = (
            config.TIER_1_MULTIPLIERS
            if is_tier_1
            else config.TIER_2_MULTIPLIERS
        )

        quantity = generate_order_quantity(
            tier,
            rng
        )

        due_offset_days = rng.randint(2, 14)
        due_hour = rng.choice([0, 8, 16])

        due_date = (
            base_date +
            timedelta(
                days=due_offset_days,
                hours=due_hour
            )
        )

        routing = generate_routing(rng)

        orders.append({
            "order_id": f"ORD-{100 + index}",
            "customer_tier": tier,
            "part_family": rng.choice(
                config.PART_FAMILIES
            ),
            "quantity": quantity,
            "due_date": due_date.strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            ),
            "daily_late_penalty": rng.randint(
                *multipliers["daily_penalty_range"]
            ),
            "unit_margin": rng.randint(
                *multipliers["unit_margin_range"]
            ),
            "routing": routing
        })

    return orders


def generate_breakdown_history(machines, rng):
    breakdowns = []

    for machine in machines:
        machine_type = machine["type"]

        if machine_type == "GRINDING":
            event_count = rng.randint(3, 6)
        elif machine_type == "CNC_LATHE":
            event_count = rng.randint(1, 3)
        else:
            event_count = rng.randint(0, 2)

        for event_index in range(event_count):
            breakdowns.append({
                "breakdown_id": (
                    f"BD-{len(breakdowns) + 1:04d}"
                ),
                "machine_id": machine["machine_id"],
                "machine_type": machine_type,
                "duration_hours": round(
                    rng.uniform(
                        machine["mttr_hrs"] * 0.7,
                        machine["mttr_hrs"] * 1.3
                    ),
                    1
                ),
                "cause": rng.choice([
                    "Mechanical failure",
                    "Tool failure",
                    "Electrical fault",
                    "Hydraulic issue",
                    "Bearing failure",
                    "Preventive maintenance"
                ])
            })

    return breakdowns


def generate_baseline_dataset():
    rng = random.Random(config.SEED)

    machines = generate_machines(rng)

    operators = generate_operators(
        machines,
        rng
    )

    changeover_matrix = generate_changeover_matrix(
        rng
    )

    orders = generate_orders(rng)

    breakdown_history = generate_breakdown_history(
        machines,
        rng
    )

    return {
        "_metadata": {
            "version": "1.0.0",
            "seed": config.SEED,
            "validation_status": "PENDING"
        },
        "shop_config": {
            "shifts": config.SHIFTS,
            "generator_cost_differential": (
                config.DIESEL_GENERATOR_MULTIPLIER
            ),
            "overtime_rate_multiplier": (
                config.OVERTIME_MULTIPLIER
            )
        },
        "machines": machines,
        "changeover_matrix": {
            "matrix": changeover_matrix,
            "part_families": config.PART_FAMILIES
        },
        "operators": operators,
        "orders": orders,
        "breakdown_history": breakdown_history
    }


if __name__ == "__main__":
    dataset = generate_baseline_dataset()

    print(
        json.dumps(
            dataset,
            indent=2
        )
    )