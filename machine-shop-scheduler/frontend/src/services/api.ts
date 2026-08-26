// services/api.ts

export type ScheduleOperation = {
  order_id: string;
  op_seq: number;
  operation_type: string;
  machine_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_overtime?: boolean;
};

export type BaselineResponse = {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ScheduleOperation[];
};

export type ScenarioEvent = {
  event_type:
    | "MACHINE_BREAKDOWN"
    | "OPERATOR_ABSENCE"
    | "MATERIAL_DELAY"
    | "REWORK_GENERATED";
  target_id: string;
  start_time?: string;
  duration_hours?: number;
};

export type ReplanScenario = {
  context: {
    current_time: string;
  };
  events: ScenarioEvent[];
};

export type ScheduleDiff = {
  affected_operations: number;
  moved_operations: number;
  total_completion_delay_hours: number;
  max_completion_delay_hours: number;
  [key: string]: unknown;
};

export type CostBreakdown = {
  baseline: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
  };
  replanned: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
  };
  delta: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    incremental_cost: number;
  };
  impact: {
    affected_operations: number;
    moved_operations: number;
    total_completion_delay_hours: number;
    max_completion_delay_hours: number;
  };
};

export type ReplanResponse = {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ScheduleOperation[];
  diff: ScheduleDiff;
  cost_breakdown: CostBreakdown;
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;

    try {
      const error = await response.json();

      if (typeof error?.detail === "string") {
        message = error.detail;
      }
    } catch {
      // Keep the default HTTP error message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function getBaseline(): Promise<BaselineResponse> {
  return request<BaselineResponse>("/baseline");
}

export async function replan(
  scenario: ReplanScenario
): Promise<ReplanResponse> {
  return request<ReplanResponse>("/replan", {
    method: "POST",
    body: JSON.stringify(scenario),
  });
}

export default {
  getBaseline,
  replan,
};