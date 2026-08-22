from datetime import datetime, timedelta

class Dispatcher:
    def __init__(self, machines, operators, orders, config, start_time="2026-08-24T06:00:00+00:00"):
        self.machines = {m.machine_id: m for m in machines}
        self.operators = operators
        self.orders = orders
        self.config = config
        self.schedule = []
        self.start_time = datetime.fromisoformat(start_time)
        self.machine_available = {m.machine_id: self.start_time for m in machines}

    def get_available_operator(self, machine_id, current_time):
        for op in self.operators:
            if machine_id in op.certified_machines:
                return op.operator_id
        return "OP-UNKNOWN"

    def dispatch(self):
        sorted_orders = sorted(
            self.orders, 
            key=lambda x: (
                datetime.fromisoformat(x.due_date.replace("Z", "+00:00")), 
                x.customer_tier != "Tier-1"
            )
        )

        for order in sorted_orders:
            order_avail_time = self.start_time
            
            for step in order.routing:
                duration_mins = step.time_per_piece_mins * order.quantity
                duration_td = timedelta(minutes=duration_mins)

                capable_machines = [m_id for m_id, m in self.machines.items() if m.type == step.type]
                if not capable_machines:
                    continue

                best_machine = min(
                    capable_machines, 
                    key=lambda m: max(self.machine_available[m], order_avail_time)
                )
                
                start_time = max(self.machine_available[best_machine], order_avail_time)
                end_time = start_time + duration_td

                assigned_op = self.get_available_operator(best_machine, start_time)

                op_record = {
                    "order_id": order.order_id,
                    "op_seq": step.op_seq,
                    "machine_id": best_machine,
                    "operator_id": assigned_op,
                    "start_time": start_time.isoformat().replace("+00:00", "Z"),
                    "end_time": end_time.isoformat().replace("+00:00", "Z"),
                    "is_overtime": False 
                }

                self.schedule.append(op_record)
                self.machine_available[best_machine] = end_time
                order_avail_time = end_time

        return self.schedule