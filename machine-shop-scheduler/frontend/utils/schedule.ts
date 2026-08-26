// utils/schedule.ts

import type {
  ScheduleOperation,
} from "../types/api";

import type {
  GanttOperation,
  GanttRow,
  ScheduleStats,
} from "../types/schedule";

import {
  getDurationMinutes,
} from "./dates";

/**
 * Get unique machine IDs from a schedule.
 */
export function getMachines(
  schedule: ScheduleOperation[]
): string[] {
  return Array.from(
    new Set(
      schedule
        .map((operation) => operation.machine_id)
        .filter(Boolean)
    )
  ).sort();
}

/**
 * Get unique operator IDs from a schedule.
 */
export function getOperators(
  schedule: ScheduleOperation[]
): string[] {
  return Array.from(
    new Set(
      schedule
        .map((operation) => operation.operator_id)
        .filter(Boolean)
    )
  ).sort();
}

/**
 * Get unique order IDs from a schedule.
 */
export function getOrders(
  schedule: ScheduleOperation[]
): string[] {
  return Array.from(
    new Set(
      schedule
        .map((operation) => operation.order_id)
        .filter(Boolean)
    )
  ).sort();
}

/**
 * Calculate basic schedule statistics.
 */
export function getScheduleStats(
  schedule: ScheduleOperation[]
): ScheduleStats {
  const orders = new Set(
    schedule.map(
      (operation) => operation.order_id
    )
  );

  const plannedMinutes = schedule.reduce(
    (total, operation) =>
      total +
      Number(
        operation.duration_minutes || 0
      ),
    0
  );

  const overtimeOperations =
    schedule.filter(
      (operation) =>
        operation.is_overtime === true
    ).length;

  return {
    operations: schedule.length,
    orders: orders.size,
    plannedHours: plannedMinutes / 60,
    overtimeOperations,
  };
}

/**
 * Sort operations chronologically.
 */
export function sortByStartTime(
  schedule: ScheduleOperation[]
): ScheduleOperation[] {
  return [...schedule].sort(
    (a, b) =>
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime()
  );
}

/**
 * Sort operations by machine and then time.
 */
export function sortByMachine(
  schedule: ScheduleOperation[]
): ScheduleOperation[] {
  return [...schedule].sort((a, b) => {
    const machineCompare =
      a.machine_id.localeCompare(
        b.machine_id
      );

    if (machineCompare !== 0) {
      return machineCompare;
    }

    return (
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime()
    );
  });
}

/**
 * Filter schedule by machine.
 */
export function filterByMachine(
  schedule: ScheduleOperation[],
  machineId: string
): ScheduleOperation[] {
  if (
    !machineId ||
    machineId === "ALL"
  ) {
    return schedule;
  }

  return schedule.filter(
    (operation) =>
      operation.machine_id === machineId
  );
}

/**
 * Filter schedule by operator.
 */
export function filterByOperator(
  schedule: ScheduleOperation[],
  operatorId: string
): ScheduleOperation[] {
  if (
    !operatorId ||
    operatorId === "ALL"
  ) {
    return schedule;
  }

  return schedule.filter(
    (operation) =>
      operation.operator_id === operatorId
  );
}

/**
 * Search schedule records.
 */
export function searchSchedule(
  schedule: ScheduleOperation[],
  query: string
): ScheduleOperation[] {
  const normalizedQuery =
    query.trim().toLowerCase();

  if (!normalizedQuery) {
    return schedule;
  }

  return schedule.filter(
    (operation) =>
      operation.order_id
        .toLowerCase()
        .includes(normalizedQuery) ||
      operation.machine_id
        .toLowerCase()
        .includes(normalizedQuery) ||
      operation.operator_id
        .toLowerCase()
        .includes(normalizedQuery) ||
      operation.operation_type
        .toLowerCase()
        .includes(normalizedQuery)
  );
}

/**
 * Return only overtime operations.
 */
export function filterOvertime(
  schedule: ScheduleOperation[]
): ScheduleOperation[] {
  return schedule.filter(
    (operation) =>
      operation.is_overtime === true
  );
}

/**
 * Convert schedule operations into Gantt rows.
 *
 * Each machine becomes one row.
 */
export function groupByMachine(
  schedule: ScheduleOperation[]
): GanttRow[] {
  const groups = new Map<
    string,
    ScheduleOperation[]
  >();

  for (const operation of schedule) {
    const machineId =
      operation.machine_id;

    if (!groups.has(machineId)) {
      groups.set(machineId, []);
    }

    groups
      .get(machineId)!
      .push(operation);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) =>
      a.localeCompare(b)
    )
    .map(([machineId, operations]) => ({
      id: machineId,
      label: machineId,
      type: "machine",
      operations: sortByStartTime(
        operations
      ) as GanttOperation[],
    }));
}

/**
 * Convert schedule operations into
 * operator-based Gantt rows.
 */
export function groupByOperator(
  schedule: ScheduleOperation[]
): GanttRow[] {
  const groups = new Map<
    string,
    ScheduleOperation[]
  >();

  for (const operation of schedule) {
    const operatorId =
      operation.operator_id;

    if (!groups.has(operatorId)) {
      groups.set(operatorId, []);
    }

    groups
      .get(operatorId)!
      .push(operation);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) =>
      a.localeCompare(b)
    )
    .map(([operatorId, operations]) => ({
      id: operatorId,
      label: operatorId,
      type: "operator",
      operations: sortByStartTime(
        operations
      ) as GanttOperation[],
    }));
}

/**
 * Find the earliest operation start.
 */
export function getScheduleStart(
  schedule: ScheduleOperation[]
): Date | null {
  if (schedule.length === 0) {
    return null;
  }

  return new Date(
    Math.min(
      ...schedule.map((operation) =>
        new Date(
          operation.start_time
        ).getTime()
      )
    )
  );
}

/**
 * Find the latest operation end.
 */
export function getScheduleEnd(
  schedule: ScheduleOperation[]
): Date | null {
  if (schedule.length === 0) {
    return null;
  }

  return new Date(
    Math.max(
      ...schedule.map((operation) =>
        new Date(
          operation.end_time
        ).getTime()
      )
    )
  );
}

/**
 * Total schedule duration in minutes.
 */
export function getScheduleDurationMinutes(
  schedule: ScheduleOperation[]
): number {
  const start =
    getScheduleStart(schedule);

  const end =
    getScheduleEnd(schedule);

  if (!start || !end) {
    return 0;
  }

  return getDurationMinutes(
    start,
    end
  );
}

/**
 * Calculate the horizontal position
 * of an operation in a Gantt timeline.
 *
 * Returns percentage from 0 to 100.
 */
export function getGanttPosition(
  operation: ScheduleOperation,
  scheduleStart: Date,
  scheduleEnd: Date
): {
  left: number;
  width: number;
} {
  const timelineStart =
    scheduleStart.getTime();

  const timelineEnd =
    scheduleEnd.getTime();

  const totalDuration =
    timelineEnd - timelineStart;

  if (totalDuration <= 0) {
    return {
      left: 0,
      width: 0,
    };
  }

  const operationStart =
    new Date(
      operation.start_time
    ).getTime();

  const operationEnd =
    new Date(
      operation.end_time
    ).getTime();

  const left =
    ((operationStart -
      timelineStart) /
      totalDuration) *
    100;

  const width =
    ((operationEnd -
      operationStart) /
      totalDuration) *
    100;

  return {
    left: Math.max(
      0,
      Math.min(100, left)
    ),
    width: Math.max(
      0,
      Math.min(
        100 - Math.max(0, left),
        width
      )
    ),
  };
}

/**
 * Calculate operation duration.
 */
export function getOperationDuration(
  operation: ScheduleOperation
): number {
  return getDurationMinutes(
    operation.start_time,
    operation.end_time
  );
}

/**
 * Check whether two operations overlap.
 */
export function operationsOverlap(
  first: ScheduleOperation,
  second: ScheduleOperation
): boolean {
  const firstStart =
    new Date(
      first.start_time
    ).getTime();

  const firstEnd =
    new Date(
      first.end_time
    ).getTime();

  const secondStart =
    new Date(
      second.start_time
    ).getTime();

  const secondEnd =
    new Date(
      second.end_time
    ).getTime();

  return (
    firstStart < secondEnd &&
    firstEnd > secondStart
  );
}

/**
 * Find machine scheduling conflicts.
 */
export function findMachineConflicts(
  schedule: ScheduleOperation[]
): ScheduleOperation[][] {
  const groups = new Map<
    string,
    ScheduleOperation[]
  >();

  for (const operation of schedule) {
    if (!groups.has(operation.machine_id)) {
      groups.set(
        operation.machine_id,
        []
      );
    }

    groups
      .get(operation.machine_id)!
      .push(operation);
  }

  const conflicts: ScheduleOperation[][] =
    [];

  for (const operations of groups.values()) {
    const sorted =
      sortByStartTime(operations);

    for (
      let i = 0;
      i < sorted.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < sorted.length;
        j++
      ) {
        if (
          operationsOverlap(
            sorted[i],
            sorted[j]
          )
        ) {
          conflicts.push([
            sorted[i],
            sorted[j],
          ]);
        }

        if (
          new Date(
            sorted[j].start_time
          ).getTime() >=
          new Date(
            sorted[i].end_time
          ).getTime()
        ) {
          break;
        }
      }
    }
  }

  return conflicts;
}
