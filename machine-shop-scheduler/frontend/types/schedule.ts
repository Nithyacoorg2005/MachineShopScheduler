// types/schedule.ts

import type { ScheduleOperation } from "./api";

export type ScheduleViewMode =
  | "timeline"
  | "machine"
  | "operator";

export type ScheduleFilters = {
  machineId: string;
  operatorId: string;
  search: string;
  overtimeOnly: boolean;
};

export type ScheduleStats = {
  operations: number;
  orders: number;
  plannedHours: number;
  overtimeOperations: number;
};

export type ScheduleGroup = {
  id: string;
  label: string;
  operations: ScheduleOperation[];
};

export type ScheduleTimeline = {
  start: string;
  end: string;
  durationHours: number;
};

export type GanttOperation = ScheduleOperation & {
  timelineStart?: number;
  timelineWidth?: number;
};

export type GanttRow = {
  id: string;
  label: string;
  type: "machine" | "operator";
  operations: GanttOperation[];
};

export type ScheduleData = {
  schedule: ScheduleOperation[];
  stats: ScheduleStats;
};

export const EMPTY_SCHEDULE_FILTERS: ScheduleFilters = {
  machineId: "ALL",
  operatorId: "ALL",
  search: "",
  overtimeOnly: false,
};