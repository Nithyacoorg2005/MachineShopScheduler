from datetime import datetime
import copy
from .optimizer import Optimizer
from .cost_evaluator import CostEvaluator

class Replanner:
    def __init__(self, baseline_schedule, machines, operators, orders, config):
        self.baseline_schedule = baseline_schedule
        self.machines = machines
        self.operators = operators
        self.orders = orders
        self.config = config

    def _freeze_schedule(self, current_time):
        frozen = []
        pending_order_ids = set([o.order_id for o in self.orders])
        
        for op in self.baseline_schedule:
            end_time = datetime.fromisoformat(op["end_time"].replace("Z", "+00:00"))
            if end_time <= current_time:
                frozen.append(op)
                
        active_orders = copy.deepcopy(self.orders)
        return frozen, active_orders

    def apply_scenario(self, scenario):
        current_time_str = scenario["context"]["current_time"].replace("Z", "+00:00")
        current_time = datetime.fromisoformat(current_time_str)
        
        frozen_schedule, active_orders = self._freeze_schedule(current_time)
        
        modified_machines = copy.deepcopy(self.machines)
        modified_operators = copy.deepcopy(self.operators)
        
        for event in scenario.get("events", []):
            if event["event_type"] == "MACHINE_BREAKDOWN":
                pass 
                
            elif event["event_type"] == "OPERATOR_ABSENCE":
                modified_operators = [op for op in modified_operators if op.operator_id != event["target_id"]]
                
            elif event["event_type"] == "MATERIAL_DELAY":
                pass 
                
            elif event["event_type"] == "REWORK_GENERATED":
                pass 

        optimizer = Optimizer(modified_machines, modified_operators, self.config)
        new_schedule, best_cost = optimizer.optimize(active_orders, self.baseline_schedule)
        
        final_schedule = frozen_schedule + new_schedule
        return final_schedule, best_cost