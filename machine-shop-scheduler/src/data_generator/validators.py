import json
from jsonschema import validate, ValidationError

def validate_dataset_structure(dataset, schema_path="data/generated/schema.json"):
    with open(schema_path, "r") as f:
        schema = json.load(f)
    
    try:
        validate(instance=dataset, schema=schema)
        return True
    except ValidationError as e:
        raise ValueError(f"Structural validation failed: {e.message}")

def validate_dataset_realism(dataset):
    machines = dataset.get("machines", [])
    assert len(machines) == 14, f"Expected 14 machines, got {len(machines)}"
    
    grinders = [m for m in machines if m["type"] == "GRINDING"]
    assert len(grinders) == 1, f"Expected exactly 1 grinding machine, got {len(grinders)}"

    operators = dataset.get("operators", [])
    assert len(operators) == 40, f"Expected 40 operators, got {len(operators)}"
    
    grinder_ops = [op for op in operators if "GRINDER-01" in op.get("certified_machines", [])]
    assert len(grinder_ops) == 3, f"Expected exactly 3 grinder-certified operators, got {len(grinder_ops)}"

    orders = dataset.get("orders", [])
    assert len(orders) > 0, "Order list is empty"

    tier1_revenue = 0
    total_revenue = 0

    for order in orders:
        order_value = order["quantity"] * order["unit_margin"]
        total_revenue += order_value
        if order["customer_tier"] == "Tier-1":
            tier1_revenue += order_value
            
        assert 200 <= order["quantity"] <= 5000, f"Order {order['order_id']} quantity out of bounds"
        assert 3 <= len(order["routing"]) <= 6, f"Order {order['order_id']} routing length out of bounds"

    if total_revenue > 0:
        tier1_ratio = tier1_revenue / total_revenue
        assert 0.45 <= tier1_ratio <= 0.75, f"Tier-1 revenue ratio {tier1_ratio:.2f} is outside realistic bounds (0.45 - 0.75)"

    dataset["_metadata"]["validation_status"] = "PASSED"
    return dataset

def run_all_validations(dataset, schema_path="data/generated/schema.json"):
    validate_dataset_structure(dataset, schema_path)
    dataset = validate_dataset_realism(dataset)
    return dataset