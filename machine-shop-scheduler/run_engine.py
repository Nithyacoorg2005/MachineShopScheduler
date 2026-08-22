import json
import os
import sys

# Add src to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from src.models.machine import Machine
from src.models.operator import Operator
from src.models.order import Order
from src.models.routing import RoutingStep
from src.engine import Dispatcher, Replanner, CostEvaluator

def main():
    # 1. Load Baseline Data
    print(" Loading validated baseline data...")
    with open("data/generated/baseline.json", "r") as f:
        data = json.load(f)

    machines = [Machine(**m) for m in data["machines"]]
    operators = [Operator(**op) for op in data["operators"]]
    
    orders = []
    for o in data["orders"]:
        routing_steps = [RoutingStep(**step) for step in o.pop("routing")]
        orders.append(Order(**o, routing=routing_steps))
        
    config = data.get("shop_config", {})

    # 2. Run Baseline Dispatcher
    print("\n---  Phase 1: Running Baseline Dispatcher (EDD Heuristic) ---")
    dispatcher = Dispatcher(machines, operators, orders, config)
    baseline_schedule = dispatcher.dispatch()
    
    evaluator = CostEvaluator(orders, operators, config)
    baseline_cost = evaluator.evaluate_total_cost(baseline_schedule)
    
    print(f"Baseline Schedule Generated: {len(baseline_schedule)} operations scheduled.")
    print(f" Baseline Total Cost (Late Penalties): ₹{baseline_cost:,.2f}")

    # 3. Load Scenario
    scenario_path = "data/scenarios/grinder_breakdown.json"
    if not os.path.exists(scenario_path):
        print(f"\nScenario file not found at {scenario_path}. Please create it first.")
        sys.exit(1)

    with open(scenario_path, "r") as f:
        scenario = json.load(f)
        
    print(f"\n--Phase 2: Injecting Scenario [{scenario['_metadata']['name']}] ---")
    
    # 4. Run Replanner
    print("Running optimization algorithm... (this may take a few seconds)")
    replanner = Replanner(baseline_schedule, machines, operators, orders, config)
    new_schedule, new_cost = replanner.apply_scenario(scenario)
    
    print(f"Re-planning Complete: {len(new_schedule)} operations in final schedule.")
    print(f"New Total Cost (incl. Replanning Penalty): ₹{new_cost:,.2f}")
    
    # 5. Save the output
    os.makedirs("data/output", exist_ok=True)
    with open("data/output/replanned_schedule.json", "w") as f:
        json.dump(new_schedule, f, indent=2)
    print(" Saved new schedule to data/output/replanned_schedule.json")

if __name__ == "__main__":
    main()