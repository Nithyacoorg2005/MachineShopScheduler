import random
import copy
from datetime import timedelta
from .dispatcher import Dispatcher
from .cost_evaluator import CostEvaluator

class Optimizer:
    def __init__(self, machines, operators, config, max_iterations=50):
        self.machines = machines
        self.operators = operators
        self.config = config
        self.max_iterations = max_iterations

    def _dispatch_sequence(self, sequence):
        dispatcher = Dispatcher(self.machines, self.operators, sequence, self.config)
        for order in sequence:
            order_avail_time = dispatcher.start_time
            for step in order.routing:
                duration_mins = step.time_per_piece_mins * order.quantity
                duration_td = timedelta(minutes=duration_mins)
                
                capable = [m_id for m_id, m in dispatcher.machines.items() if m.type == step.type]
                if not capable:
                    continue
                    
                best_machine = min(capable, key=lambda m: max(dispatcher.machine_available[m], order_avail_time))
                start_time = max(dispatcher.machine_available[best_machine], order_avail_time)
                end_time = start_time + duration_td
                
                assigned_op = dispatcher.get_available_operator(best_machine, start_time)
                
                dispatcher.schedule.append({
                    "order_id": order.order_id,
                    "op_seq": step.op_seq,
                    "machine_id": best_machine,
                    "operator_id": assigned_op,
                    "start_time": start_time.isoformat().replace("+00:00", "Z"),
                    "end_time": end_time.isoformat().replace("+00:00", "Z"),
                    "is_overtime": False
                })
                dispatcher.machine_available[best_machine] = end_time
                order_avail_time = end_time
                
        return dispatcher.schedule

    def optimize(self, orders, baseline_schedule=None):
        current_sequence = copy.deepcopy(orders)
        best_sequence = copy.deepcopy(orders)
        
        evaluator = CostEvaluator(orders, self.operators, self.config)
        
        best_schedule = self._dispatch_sequence(current_sequence)
        best_cost = evaluator.evaluate_total_cost(best_schedule, baseline_schedule)

        for _ in range(self.max_iterations):
            candidate_sequence = copy.deepcopy(best_sequence)
            idx1, idx2 = random.sample(range(len(candidate_sequence)), 2)
            candidate_sequence[idx1], candidate_sequence[idx2] = candidate_sequence[idx2], candidate_sequence[idx1]

            candidate_schedule = self._dispatch_sequence(candidate_sequence)
            candidate_cost = evaluator.evaluate_total_cost(candidate_schedule, baseline_schedule)

            if candidate_cost < best_cost:
                best_cost = candidate_cost
                best_sequence = candidate_sequence
                best_schedule = candidate_schedule

        return best_schedule, best_cost