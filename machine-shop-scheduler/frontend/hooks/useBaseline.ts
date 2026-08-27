import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface ScheduleOperation {
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

export interface BaselineResponse {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ScheduleOperation[];
}

interface UseBaselineResult {
  data: BaselineResponse | null;
  schedule: ScheduleOperation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBaseline(): UseBaselineResult {
  const [data, setData] = useState<BaselineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBaseline = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/baseline`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Baseline request failed with status ${response.status}`
        );
      }

      const result: BaselineResponse = await response.json();

      if (result.status !== "success") {
        throw new Error("Backend returned an unsuccessful baseline response.");
      }

      setData(result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load baseline schedule.";

      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBaseline();
  }, [fetchBaseline]);

  return {
    data,
    schedule: data?.schedule ?? [],
    loading,
    error,
    refetch: fetchBaseline,
  };
}

export default useBaseline;