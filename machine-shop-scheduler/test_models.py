import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from src.models.machine import Machine
from src.models.operator import Operator
from src.models.order import Order
from src.models.routing import RoutingStep

def main():
    filepath = "data/generated/baseline.json"
    
    with open(filepath, "r") as f:
        data = json.load(f)

    machines = [Machine(**m) for m in data["machines"]]
    operators = [Operator(**op) for op in data["operators"]]
    
    orders = []
    for o in data["orders"]:
        routing_steps = [RoutingStep(**step) for step in o.pop("routing")]
        orders.append(Order(**o, routing=routing_steps))

    print(f"Successfully loaded {len(machines)} Machines!")
    print(f"Successfully loaded {len(operators)} Operators!")
    print(f"Successfully loaded {len(orders)} Orders!")
    print("-" * 30)
    print("Sample Machine:", machines[0].machine_id, "-", machines[0].type)
    print("Sample Operator:", operators[0].name, "-", operators[0].shift, "Shift")
    print("Sample Order:", orders[0].order_id, "with", len(orders[0].routing), "routing steps")

if __name__ == "__main__":
    main()