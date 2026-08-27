import { useCallback, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface ScenarioEvent {
  event_type: string;
  target_id: string;
  start_time?: string;
  duration_hours?: number;
  [key: string]: unknown;
}

export interface ScenarioContext {
  current_time: string;
  [key: string]: unknown;
}

export interface ReplanScenario {
  context: ScenarioContext;
  events: ScenarioEvent[];
  [key: string]: unknown;
}

export interface ReplannedOperation {
  order_id: string;
  op_seq: number;
  operation_type: string;
  machine_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_overtime: boolean;
}

export interface CostComponents {
  late_penalty: number;
  overtime_cost: number;
  changeover_cost: number;
  stability_penalty: number;
  total_cost: number;
}

export interface CostBreakdown {
  baseline: CostComponents;
  replanned: CostComponents;
  delta: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    incremental_cost: number;
  };
  impact?: {
    affected_operations: number;
    moved_operations: number;
    total_completion_delay_hours: number;
    max_completion_delay_hours: number;
  };
}

export interface ScheduleDiff {
  [key: string]: unknown;
}

export interface ReplanResponse {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ReplannedOperation[];
  diff: ScheduleDiff;
  cost_breakdown: CostBreakdown;
}

interface UseReplanResult {
  data: ReplanResponse | null;
  schedule: ReplannedOperation[];
  loading: boolean;
  error: string | null;
  replan: (scenario: ReplanScenario) => Promise<ReplanResponse | null>;
  reset: () => void;
}

export function useReplan(): UseReplanResult {
  const [data, setData] = useState<ReplanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const replan = useCallback(
    async (
      scenario: ReplanScenario
    ): Promise<ReplanResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/replan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(scenario),
        });

        if (!response.ok) {
          let message = `Replan request failed with status ${response.status}`;

          try {
            const errorBody = await response.json();

            if (errorBody?.detail) {
              message = errorBody.detail;
            }
          } catch {
            // Keep the HTTP status message.
          }

          throw new Error(message);
        }

        const result: ReplanResponse = await response.json();

        if (result.status !== "success") {
          throw new Error(
            "Backend returned an unsuccessful replanning response."
          );
        }

        setData(result);

        return result;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to replan the schedule.";

        setError(message);
        setData(null);

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    schedule: data?.schedule ?? [],
    loading,
    error,
    replan,
    reset,
  };
}

export default useReplan;