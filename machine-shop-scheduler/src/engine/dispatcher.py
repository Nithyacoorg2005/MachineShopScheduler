from datetime import datetime, timedelta


class Dispatcher:
    TYPE_MAP = {
        "CNC_LATHE": "CNC Lathe",
        "MILLING": "Milling",
        "DRILL": "Drill",
        "GRINDING": "Grinding",
        "CNC Lathe": "CNC Lathe",
        "Milling": "Milling",
        "Drill": "Drill",
        "Grinding": "Grinding",
    }

    def __init__(
        self,
        machines,
        operators,
        orders,
        config,
        start_time="2026-08-24T06:00:00+00:00"
    ):
        self.machines = {
            machine.machine_id: machine
            for machine in machines
        }

        self.operators = operators
        self.orders = orders
        self.config = config
        self.schedule = []

        self.start_time = datetime.fromisoformat(start_time)

        self.horizon_end = self.start_time + timedelta(days=14)

        self.machine_available = {
            machine.machine_id: self.start_time
            for machine in machines
        }

    def normalize_type(self, value):
        return self.TYPE_MAP.get(value, value)

    def get_shift_window(self, current_time):
        local_time = current_time.time()

        for shift_name, shift in self.config["shifts"].items():
            start_hour, start_minute = map(
                int,
                shift["start"].split(":")
            )

            end_hour, end_minute = map(
                int,
                shift["end"].split(":")
            )

            start = current_time.replace(
                hour=start_hour,
                minute=start_minute,
                second=0,
                microsecond=0
            )

            end = current_time.replace(
                hour=end_hour,
                minute=end_minute,
                second=0,
                microsecond=0
            )

            if start <= current_time < end:
                return shift_name, start, end

        next_shift = None

        for shift_name, shift in self.config["shifts"].items():
            start_hour, start_minute = map(
                int,
                shift["start"].split(":")
            )

            candidate = current_time.replace(
                hour=start_hour,
                minute=start_minute,
                second=0,
                microsecond=0
            )

            if candidate <= current_time:
                candidate += timedelta(days=1)

            if next_shift is None or candidate < next_shift[1]:
                next_shift = (
                    shift_name,
                    candidate
                )

        return next_shift[0], next_shift[1], next_shift[1] + timedelta(
            hours=8,
            minutes=30
        )

    def get_next_working_time(self, current_time):
        shift_name, shift_start, shift_end = self.get_shift_window(
            current_time
        )

        if shift_start <= current_time < shift_end:
            return current_time

        return shift_start

    def get_available_operator(
        self,
        machine_id,
        current_time
    ):
        shift_name, shift_start, shift_end = self.get_shift_window(
            current_time
        )

        for operator in self.operators:
            if (
                machine_id in operator.certified_machines
                and operator.shift == shift_name
            ):
                return operator.operator_id

        for operator in self.operators:
            if machine_id in operator.certified_machines:
                return operator.operator_id

        return None

    def get_capable_machines(self, operation_type):
        normalized_type = self.normalize_type(operation_type)

        return [
            machine_id
            for machine_id, machine in self.machines.items()
            if self.normalize_type(machine.type) == normalized_type
        ]

    def find_machine(self, operation_type, order_available):
        capable_machines = self.get_capable_machines(
            operation_type
        )

        if not capable_machines:
            return None

        available_candidates = []

        for machine_id in capable_machines:
            available_time = max(
                self.machine_available[machine_id],
                order_available
            )

            available_time = self.get_next_working_time(
                available_time
            )

            available_candidates.append(
                (
                    available_time,
                    machine_id
                )
            )

        available_candidates.sort(
            key=lambda item: item[0]
        )

        return available_candidates[0]

    def dispatch(self):
        sorted_orders = sorted(
            self.orders,
            key=lambda order: (
                datetime.fromisoformat(
                    order.due_date.replace("Z", "+00:00")
                ),
                order.customer_tier != "Tier-1"
            )
        )

        for order in sorted_orders:
            order_available_time = self.start_time

            for step in order.routing:
                operation_type = self.normalize_type(
                    step.type
                )

                if operation_type == "Inspection":
                    order_available_time = self.schedule_inspection(
                        order,
                        step,
                        order_available_time
                    )
                    continue

                machine_result = self.find_machine(
                    operation_type,
                    order_available_time
                )

                if machine_result is None:
                    raise RuntimeError(
                        f"No capable machine found for "
                        f"{operation_type} in order "
                        f"{order.order_id}, operation "
                        f"{step.op_seq}"
                    )

                machine_available_time, machine_id = machine_result

                start_time = max(
                    machine_available_time,
                    order_available_time
                )

                start_time = self.get_next_working_time(
                    start_time
                )

                duration_mins = (
                    step.time_per_piece_mins *
                    order.quantity
                )

                duration = timedelta(
                    minutes=duration_mins
                )

                end_time = start_time + duration

                operator_id = self.get_available_operator(
                    machine_id,
                    start_time
                )

                if operator_id is None:
                    raise RuntimeError(
                        f"No certified operator available for "
                        f"{machine_id} at "
                        f"{start_time.isoformat()} "
                        f"for order {order.order_id}"
                    )

               

                operation_record = {
                    "order_id": order.order_id,
                    "op_seq": step.op_seq,
                    "operation_type": operation_type,
                    "machine_id": machine_id,
                    "operator_id": operator_id,
                    "start_time": start_time.isoformat().replace(
                        "+00:00",
                        "Z"
                    ),
                    "end_time": end_time.isoformat().replace(
                        "+00:00",
                        "Z"
                    ),
                    "duration_minutes": duration_mins,
                    "is_overtime": False
                }

                self.schedule.append(
                    operation_record
                )

                self.machine_available[machine_id] = end_time
                order_available_time = end_time

        return self.schedule

    def schedule_inspection(
        self,
        order,
        step,
        order_available_time
    ):
        start_time = self.get_next_working_time(
            order_available_time
        )

        duration_mins = step.time_per_piece_mins

        end_time = start_time + timedelta(
            minutes=duration_mins
        )

       

        self.schedule.append({
            "order_id": order.order_id,
            "op_seq": step.op_seq,
            "operation_type": "Inspection",
            "machine_id": None,
            "operator_id": None,
            "start_time": start_time.isoformat().replace(
                "+00:00",
                "Z"
            ),
            "end_time": end_time.isoformat().replace(
                "+00:00",
                "Z"
            ),
            "duration_minutes": duration_mins,
            "is_overtime": False
        })

        return end_time