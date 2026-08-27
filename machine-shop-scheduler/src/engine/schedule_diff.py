from datetime import datetime


class ScheduleDiff:
    def __init__(self, baseline_schedule, replanned_schedule):
        self.baseline_schedule = baseline_schedule
        self.replanned_schedule = replanned_schedule

        self.baseline = {
            (
                operation["order_id"],
                operation["op_seq"]
            ): operation
            for operation in baseline_schedule
        }

        self.replanned = {
            (
                operation["order_id"],
                operation["op_seq"]
            ): operation
            for operation in replanned_schedule
        }

    def _parse_time(self, value):
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )

    def _time_delta_minutes(self, first, second):
        return (
            self._parse_time(second) -
            self._parse_time(first)
        ).total_seconds() / 60

    def _operation_diff(self, key):
        baseline = self.baseline.get(key)
        replanned = self.replanned.get(key)

        if baseline is None and replanned is None:
            return None

        if baseline is None:
            return {
                "order_id": key[0],
                "op_seq": key[1],
                "change_type": "ADDED",
                "baseline": None,
                "replanned": replanned
            }

        if replanned is None:
            return {
                "order_id": key[0],
                "op_seq": key[1],
                "change_type": "REMOVED",
                "baseline": baseline,
                "replanned": None
            }

        baseline_machine = baseline.get("machine_id")
        replanned_machine = replanned.get("machine_id")
        baseline_operator = baseline.get("operator_id")
        replanned_operator = replanned.get("operator_id")
        baseline_start = baseline.get("start_time")
        replanned_start = replanned.get("start_time")
        baseline_end = baseline.get("end_time")
        replanned_end = replanned.get("end_time")

        changes = []

        if baseline_machine != replanned_machine:
            changes.append("MACHINE_CHANGED")
        if baseline_operator != replanned_operator:
            changes.append("OPERATOR_CHANGED")
        if baseline_start != replanned_start:
            changes.append("START_TIME_CHANGED")
        if baseline_end != replanned_end:
            changes.append("END_TIME_CHANGED")

        baseline_segments = baseline.get("segments")
        replanned_segments = replanned.get("segments")

        if baseline_segments != replanned_segments:
            changes.append("SEGMENTS_CHANGED")

        if not changes:
            return None

        start_delay = 0.0
        completion_delay = 0.0

        if baseline_start and replanned_start:
            start_delay = self._time_delta_minutes(
                baseline_start,
                replanned_start
            )

        if baseline_end and replanned_end:
            completion_delay = self._time_delta_minutes(
                baseline_end,
                replanned_end
            )

        return {
            "order_id": key[0],
            "op_seq": key[1],
            "change_type": "MODIFIED",
            "changes": changes,
            "baseline": {
                "machine_id": baseline_machine,
                "operator_id": baseline_operator,
                "start_time": baseline_start,
                "end_time": baseline_end
            },
            "replanned": {
                "machine_id": replanned_machine,
                "operator_id": replanned_operator,
                "start_time": replanned_start,
                "end_time": replanned_end
            },
            "start_delay_minutes": round(start_delay, 2),
            "completion_delay_minutes": round(completion_delay, 2),
            "baseline_segments": baseline_segments,
            "replanned_segments": replanned_segments
        }

    def generate(self):
        all_keys = (
            set(self.baseline.keys()) |
            set(self.replanned.keys())
        )

        changes = []

        for key in sorted(
            all_keys,
            key=lambda value: (value[0], value[1])
        ):
            diff = self._operation_diff(key)
            if diff is not None:
                changes.append(diff)

        return changes

    def summary(self):
        changes = self.generate()

        machine_changes = 0
        operator_changes = 0
        start_changes = 0
        end_changes = 0
        segment_changes = 0

        total_start_delay = 0.0
        total_completion_delay = 0.0
        max_completion_delay = 0.0

        for change in changes:
            change_types = change.get("changes", [])

            if "MACHINE_CHANGED" in change_types:
                machine_changes += 1
            if "OPERATOR_CHANGED" in change_types:
                operator_changes += 1
            if "START_TIME_CHANGED" in change_types:
                start_changes += 1
            if "END_TIME_CHANGED" in change_types:
                end_changes += 1
            if "SEGMENTS_CHANGED" in change_types:
                segment_changes += 1

            start_delay = change.get("start_delay_minutes", 0)
            completion_delay = change.get("completion_delay_minutes", 0)

            # Delay represents lateness only.
            # Operations finishing earlier than baseline are not delays.
            total_start_delay += max(start_delay, 0)
            total_completion_delay += max(completion_delay, 0)
            max_completion_delay = max(max_completion_delay, max(completion_delay, 0))

        return {
            "baseline_operations": len(self.baseline),
            "replanned_operations": len(self.replanned),
            "changed_operations": len(changes),
            "machine_changes": machine_changes,
            "operator_changes": operator_changes,
            "start_time_changes": start_changes,
            "end_time_changes": end_changes,
            "segment_changes": segment_changes,
            "total_start_delay_minutes": round(total_start_delay, 2),
            "total_completion_delay_minutes": round(total_completion_delay, 2),
            "max_completion_delay_minutes": round(max_completion_delay, 2),
        }

    def get_operation(self, order_id, op_seq):
        key = (order_id, op_seq)
        return self._operation_diff(key)

    def to_report(self):
        return {
            "summary": self.summary(),
            "changes": self.generate()
        }