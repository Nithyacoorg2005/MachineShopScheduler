// types/api.ts

export type ScheduleOperation = {
  order_id: string;
  op_seq: number;
  operation_type: string;
  machine_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_overtime: boolean;
};

export type BaselineResponse = {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ScheduleOperation[];
};

export type ScenarioEventType =
  | "MACHINE_BREAKDOWN"
  | "OPERATOR_ABSENCE"
  | "MATERIAL_DELAY"
  | "REWORK_GENERATED";

export type ScenarioEvent = {
  event_type: ScenarioEventType;
  target_id: string;
  start_time?: string;
  duration_hours?: number;
  impact?: string;
  notes?: string;
};

export type ScenarioContext = {
  current_time: string;
  active_shift?: string;
};

export type ReplanScenario = {
  context: ScenarioContext;
  events: ScenarioEvent[];
};

export type ScheduleDiff = {
  affected_operations: number;
  moved_operations: number;
  total_completion_delay_hours: number;
  max_completion_delay_hours: number;
  [key: string]: unknown;
};

export type CostComponents = {
  late_penalty: number;
  overtime_cost: number;
  changeover_cost: number;
};

export type CostDelta = {
  late_penalty: number;
  overtime_cost: number;
  changeover_cost: number;
  stability_penalty: number;
  incremental_cost: number;
};

export type CostImpact = {
  affected_operations: number;
  moved_operations: number;
  total_completion_delay_hours: number;
  max_completion_delay_hours: number;
};

export type CostBreakdown = {
  baseline: CostComponents;
  replanned: CostComponents;
  delta: CostDelta;
  impact: CostImpact;
};

export type ReplanResponse = {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ScheduleOperation[];
  diff: ScheduleDiff;
  cost_breakdown: CostBreakdown;
};

export type ApiError = {
  detail?: string;
  message?: string;
};