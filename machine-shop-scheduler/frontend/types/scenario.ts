// types/scenario.ts

export type ScenarioType =
  | "MACHINE_BREAKDOWN"
  | "OPERATOR_ABSENCE"
  | "MATERIAL_DELAY"
  | "REWORK_GENERATED";

export type ScenarioSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ScenarioEvent = {
  event_type: ScenarioType;
  target_id: string;

  // Used by MACHINE_BREAKDOWN
  start_time?: string;
  duration_hours?: number;

  // Used by MATERIAL_DELAY
  delay_hours?: number;

  // Optional metadata for the UI
  severity?: ScenarioSeverity;
  notes?: string;
};

export type ScenarioContext = {
  current_time: string;
  active_shift?: string;
};

export type Scenario = {
  id?: string;
  name: string;
  description?: string;
  context: ScenarioContext;
  events: ScenarioEvent[];
};

export type ScenarioCardData = {
  id: string;
  title: string;
  description: string;
  type: ScenarioType;
  severity: ScenarioSeverity;
  target_id: string;
};

export type ScenarioResult = {
  status: string;
  operations_count: number;
  cost: number;
  schedule: import("./api").ScheduleOperation[];
  diff: import("./api").ScheduleDiff;
  cost_breakdown: import("./api").CostBreakdown;
};

export const SCENARIO_TYPE_LABELS: Record<
  ScenarioType,
  string
> = {
  MACHINE_BREAKDOWN: "Machine Breakdown",
  OPERATOR_ABSENCE: "Operator Absence",
  MATERIAL_DELAY: "Material Delay",
  REWORK_GENERATED: "Rework Generated",
};

export const SCENARIO_SEVERITY_LABELS: Record<
  ScenarioSeverity,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};