from datetime import datetime
import math

class CostEvaluator:
    def __init__(self, orders, operators, config):
        self.orders = {o.order_id: o for o in orders}
        self.operators = {op.operator_id: op for op in operators}
        self.config = config

    def evaluate_tardiness(self, schedule):
        penalty = 0.0
        completion_times = {}

        for op in schedule:
            end_time = datetime.fromisoformat(op["end_time"].replace("Z", "+00:00"))
            order_id = op["order_id"]
            if order_id not in completion_times or end_time > completion_times[order_id]:
                completion_times[order_id] = end_time

        for order_id, comp_time in completion_times.items():
            order = self.orders.get(order_id)
            if order:
                due = datetime.fromisoformat(order.due_date.replace("Z", "+00:00"))
                if comp_time > due:
                    days_late = math.ceil((comp_time - due).total_seconds() / 86400)
                    penalty += days_late * order.daily_late_penalty
        return penalty

    def evaluate_overtime(self, schedule, base_hourly_rate=500):
        cost = 0.0
        multiplier = self.config.get("overtime_rate_multiplier", 1.5)
        for op in schedule:
            if op.get("is_overtime"):
                start = datetime.fromisoformat(op["start_time"].replace("Z", "+00:00"))
                end = datetime.fromisoformat(op["end_time"].replace("Z", "+00:00"))
                hrs = (end - start).total_seconds() / 3600
                cost += hrs * base_hourly_rate * multiplier
        return cost

    def evaluate_replan_penalty(self, baseline, new_schedule, lambda_penalty):
        shifts = 0
        base_dict = {f"{op['order_id']}_{op['op_seq']}": op for op in baseline}
        
        for new_op in new_schedule:
            key = f"{new_op['order_id']}_{new_op['op_seq']}"
            if key in base_dict:
                if new_op["start_time"] != base_dict[key]["start_time"] or new_op["machine_id"] != base_dict[key]["machine_id"]:
                    shifts += 1
            else:
                shifts += 1
                
        return shifts * lambda_penalty

    def evaluate_total_cost(self, schedule, baseline=None, lambda_penalty=500):
        total = self.evaluate_tardiness(schedule) + self.evaluate_overtime(schedule)
        if baseline:
            total += self.evaluate_replan_penalty(baseline, schedule, lambda_penalty)
        return total