import random
import json
from datetime import datetime, timedelta
import config

def generate_machines():
    machines = []
    for m_type, props in config.MACHINE_TYPES.items():
        type_str = "CNC Lathe" if m_type == "CNC_LATHE" else m_type.replace("_", " ").title()
        if type_str == "Grinding":
            prefix = "GRINDER"
        else:
            prefix = type_str.split(" ")[-1].upper()
            
        for i in range(1, props["count"] + 1):
            machines.append({
                "machine_id": f"{prefix}-{i:02d}",
                "type": type_str,
                "hourly_cost": props["hourly_cost"],
                "mtbf_hrs": round(random.uniform(*props["mtbf_hrs_range"]), 1),
                "mttr_hrs": round(random.uniform(*props["mttr_hrs_range"]), 1)
            })
    return machines

def generate_operators(machines):
    operators = []
    machine_ids_no_grinder = [m["machine_id"] for m in machines if m["type"] != "Grinding"]
    grinder_indices = set(random.sample(range(config.TOTAL_OPERATORS), config.GRINDER_CERTIFIED_COUNT))
    
    for i in range(config.TOTAL_OPERATORS):
        shift = "A" if i < (config.TOTAL_OPERATORS // 2) else "B"
        certifications = []
        
        if i in grinder_indices:
            certifications.append("GRINDER-01")
            certifications.append(random.choice(machine_ids_no_grinder))
        else:
            num_certs = random.randint(2, 4)
            certifications = random.sample(machine_ids_no_grinder, num_certs)
            
        operators.append({
            "operator_id": f"OP-{i+1:03d}",
            "name": f"Operator_{i+1:03d}",
            "shift": shift,
            "certified_machines": list(set(certifications)),
            "absenteeism_prob": round(random.uniform(*config.ABSENTEEISM_PROBABILITY_RANGE), 3)
        })
    return operators

def generate_orders():
    orders = []
    base_date = datetime(2026, 8, 24, 6, 0)
    
    for i in range(1, config.TARGET_ORDERS + 1):
        is_tier_1 = random.random() < config.TIER_1_PROBABILITY
        tier = "Tier-1" if is_tier_1 else "Tier-2"
        multipliers = config.TIER_1_MULTIPLIERS if is_tier_1 else config.TIER_2_MULTIPLIERS
        
        base_qty = random.randint(*config.ORDER_QTY_RANGE)
        qty = int(base_qty * multipliers["volume_skew"])
        qty = min(config.ORDER_QTY_RANGE[1], max(config.ORDER_QTY_RANGE[0], qty))
        
        due_date_offset = random.randint(2, 14)
        due_date = base_date + timedelta(days=due_date_offset, hours=random.choice([0, 8.5]))
        
        num_ops = random.randint(*config.ROUTING_OPS_RANGE)
        routing = []
        available_types = ["CNC Lathe", "Milling", "Drill"]
        needs_grinder = random.random() < config.ROUTING_NEEDS_GRINDER_PROB
        
        for step in range(1, num_ops + 1):
            if step == num_ops - 1 and needs_grinder:
                op_type = "Grinding"
                time_per_piece = round(random.uniform(0.5, 2.0), 2)
            elif step == num_ops:
                op_type = "Inspection"
                time_per_piece = round(random.uniform(0.2, 0.8), 2)
            else:
                op_type = random.choice(available_types)
                time_per_piece = round(random.uniform(1.0, 5.0), 2)
                
            routing.append({
                "op_seq": step,
                "type": op_type,
                "time_per_piece_mins": time_per_piece
            })
            
        orders.append({
            "order_id": f"ORD-{100+i}",
            "customer_tier": tier,
            "part_family": random.choice(config.PART_FAMILIES),
            "quantity": qty,
            "due_date": due_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "daily_late_penalty": random.randint(*multipliers["daily_penalty_range"]),
            "unit_margin": random.randint(*multipliers["unit_margin_range"]),
            "routing": routing
        })
    return orders

def generate_baseline_dataset():
    random.seed(config.SEED)
    
    machines = generate_machines()
    operators = generate_operators(machines)
    orders = generate_orders()
    
    return {
        "_metadata": {
            "version": "1.0.0",
            "seed": config.SEED,
            "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "validation_status": "PENDING"
        },
        "shop_config": {
            "shifts": config.SHIFTS,
            "generator_cost_differential": config.DIESEL_GENERATOR_MULTIPLIER,
            "overtime_rate_multiplier": config.OVERTIME_MULTIPLIER
        },
        "machines": machines,
        "changeover_matrix": {
            "SAME_FAMILY_MINS": config.SAME_FAMILY_SETUP_MINS,
            "CROSS_FAMILY_MINS": random.randint(*config.CROSS_FAMILY_SETUP_MINS_RANGE),
            "part_families": config.PART_FAMILIES
        },
        "operators": operators,
        "orders": orders
    }

if __name__ == "__main__":
    dataset = generate_baseline_dataset()
    print(json.dumps(dataset, indent=2))