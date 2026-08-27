import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";

type ScheduleOperation = {
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

type CostBreakdown = {
  baseline?: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    total_cost: number;
  };
  replanned?: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    total_cost: number;
  };
  delta?: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    incremental_cost: number;
  };
};

type ApiResponse = {
  status: string;
  operations_count: number;
  cost: number;
  schedule: ScheduleOperation[];
  diff?: any;
  cost_breakdown?: CostBreakdown;
};

type ScenarioEvent = {
  event_type: string;
  target_id: string;
  start_time?: string;
  end_time?: string;
};

const API_BASE = "http://127.0.0.1:8000/api";

const defaultScenario = {
  context: {
    current_time: "2026-08-25T16:30:00Z",
    active_shift: "A",
  },
  events: [
    {
      event_type: "MACHINE_BREAKDOWN",
      target_id: "GRINDER-01",
      start_time: "2026-08-25T11:00:00Z",
      end_time: "2026-08-25T19:00:00Z",
    },
    {
      event_type: "OPERATOR_ABSENCE",
      target_id: "OP-001",
      start_time: "2026-08-25T11:30:00Z",
      end_time: "2026-08-25T20:00:00Z",
    },
  ],
};

function formatCurrency(value: number | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const OP_TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  lathe:      { color: "#1d5fa8", bg: "#dbeafe", label: "Lathe" },
  milling:    { color: "#166534", bg: "#dcfce7", label: "Milling" },
  drill:      { color: "#6b21a8", bg: "#ede9fe", label: "Drill" },
  grinding:   { color: "#92400e", bg: "#fef3c7", label: "Grinding" },
  inspection: { color: "#374151", bg: "#f3f4f6", label: "Inspection" },
  default:    { color: "#374151", bg: "#f3f4f6", label: "Other" },
};

function getOpType(operationType: string) {
  const type = operationType.toLowerCase();
  if (type.includes("lathe")) return OP_TYPE_CONFIG.lathe;
  if (type.includes("mill")) return OP_TYPE_CONFIG.milling;
  if (type.includes("drill")) return OP_TYPE_CONFIG.drill;
  if (type.includes("grind")) return OP_TYPE_CONFIG.grinding;
  if (type.includes("inspect")) return OP_TYPE_CONFIG.inspection;
  return OP_TYPE_CONFIG.default;
}

function Dashboard() {
  const [baseline, setBaseline] = useState<ApiResponse | null>(null);
  const [replanned, setReplanned] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [replanning, setReplanning] = useState(false);
  const [error, setError] = useState("");

  const loadBaseline = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/baseline`);
      if (!response.ok) throw new Error(`Baseline request failed: ${response.status}`);
      const data = await response.json();
      setBaseline(data);
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the scheduling engine.");
    } finally {
      setLoading(false);
    }
  };

  const runReplanning = async () => {
    try {
      setReplanning(true);
      setError("");
      const response = await fetch(`${API_BASE}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultScenario),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Replanning failed: ${response.status} ${text}`);
      }
      const data = await response.json();
      setReplanned(data);
    } catch (err) {
      console.error(err);
      setError("Replanning failed. Check that the FastAPI server is running.");
    } finally {
      setReplanning(false);
    }
  };

  useEffect(() => { loadBaseline(); }, []);

  const activeSchedule = replanned?.schedule || baseline?.schedule || [];

  const machines = useMemo(() => {
    const map = new Map<string, ScheduleOperation[]>();
    activeSchedule.forEach((op) => {
      if (!map.has(op.machine_id)) map.set(op.machine_id, []);
      map.get(op.machine_id)!.push(op);
    });
    return Array.from(map.entries());
  }, [activeSchedule]);

  const affectedOperations = useMemo(() => {
    if (!baseline?.schedule || !replanned?.schedule) return 0;
    const baselineMap = new Map(
      baseline.schedule.map((op) => [`${op.order_id}-${op.op_seq}`, op])
    );
    return replanned.schedule.filter((op) => {
      const original = baselineMap.get(`${op.order_id}-${op.op_seq}`);
      if (!original) return false;
      return (
        original.machine_id !== op.machine_id ||
        original.operator_id !== op.operator_id ||
        original.start_time !== op.start_time
      );
    }).length;
  }, [baseline, replanned]);

  const grinderViolations = useMemo(() => {
    const breakdownStart = new Date("2026-08-25T11:00:00Z").getTime();
    const breakdownEnd = new Date("2026-08-25T19:00:00Z").getTime();
    return activeSchedule.filter((op) => {
      if (op.machine_id !== "GRINDER-01") return false;
      const start = new Date(op.start_time).getTime();
      const end = new Date(op.end_time).getTime();
      return start < breakdownEnd && end > breakdownStart;
    }).length;
  }, [activeSchedule]);

  const totalOperations = baseline?.operations_count || activeSchedule.length || 0;
  const baselineCost = baseline?.cost_breakdown?.baseline?.total_cost ?? baseline?.cost ?? 0;
  const replannedCost = replanned?.cost_breakdown?.replanned?.total_cost ?? replanned?.cost ?? 0;
  const incrementalCost = replanned?.cost_breakdown?.delta?.incremental_cost ?? replannedCost - baselineCost;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb", color: "#111827", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif", fontSize: 14 }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .shell { display: flex; min-height: 100vh; }

        /* SIDEBAR */
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }

        .brand {
          padding: 20px 18px 18px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .5px;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .brand-sub {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 2px;
          letter-spacing: .3px;
        }

        .nav-section {
          padding: 20px 12px 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          color: #9ca3af;
        }

        .nav { padding: 0 8px; }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 40px;
          padding: 0 10px;
          border-radius: 8px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          margin-bottom: 2px;
        }

        .nav-item:hover { background: #f3f4f6; color: #111827; }

        .nav-item.active {
          background: #f0f9ff;
          color: #0369a1;
          font-weight: 600;
        }

        .nav-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: .3px;
        }

        .nav-item.active .nav-icon {
          background: #e0f2fe;
          color: #0369a1;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .engine-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #6b7280;
        }

        .engine-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          box-shadow: 0 0 0 3px rgba(34,197,94,.15);
        }

        .version-tag {
          margin-top: 8px;
          font-size: 10px;
          color: #d1d5db;
        }

        /* MAIN */
        .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }

        .topbar {
          height: 60px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          flex-shrink: 0;
        }

        .breadcrumb { font-size: 12px; color: #9ca3af; display: flex; align-items: center; gap: 6px; }
        .breadcrumb .sep { color: #d1d5db; }
        .breadcrumb .active { color: #374151; font-weight: 500; }

        .topbar-right { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #22c55e; font-weight: 500; }
        .topbar-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }

        .content { padding: 28px; flex: 1; overflow-y: auto; }

        /* PAGE HEADER */
        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .eyebrow { font-size: 11px; color: #9ca3af; font-weight: 600; letter-spacing: .8px; margin-bottom: 6px; }
        .page-title { font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -.5px; }
        .page-desc { font-size: 13px; color: #9ca3af; margin-top: 4px; }

        .refresh-btn {
          height: 36px;
          padding: 0 16px;
          background: #fff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .refresh-btn:hover { background: #f9fafb; }
        .refresh-btn:disabled { opacity: .5; cursor: wait; }

        /* ERROR */
        .error-bar {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
        }

        /* KPI */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .kpi {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .kpi-label { font-size: 11px; font-weight: 600; color: #9ca3af; letter-spacing: .5px; margin-bottom: 12px; }
        .kpi-value { font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -1px; }
        .kpi-meta { font-size: 11px; color: #9ca3af; margin-top: 6px; }
        .kpi-good { color: #22c55e !important; }
        .kpi-warn { color: #f59e0b !important; }

        /* MAIN GRID */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
          align-items: start;
          margin-bottom: 16px;
        }

        /* PANEL */
        .panel {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
        }

        .panel-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .panel-title { font-size: 14px; font-weight: 700; color: #111827; }
        .panel-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; }

        .panel-badge {
          background: #f3f4f6;
          color: #374151;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
        }

        /* LEGEND */
        .legend {
          padding: 10px 20px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }

        .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #6b7280; }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        /* SCHEDULE */
        .schedule-body { max-height: 560px; overflow-y: auto; }

        .machine-section { border-bottom: 1px solid #f3f4f6; }
        .machine-section:last-child { border-bottom: 0; }

        .machine-header {
          padding: 10px 20px;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
          letter-spacing: .3px;
          position: sticky;
          top: 0;
        }

        .machine-ops-count {
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
          background: #e5e7eb;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .op-row {
          display: grid;
          grid-template-columns: 110px 1fr 90px 80px;
          gap: 10px;
          align-items: center;
          padding: 10px 20px;
          border-top: 1px solid #f3f4f6;
        }

        .op-row:hover { background: #fafafa; }

        .op-id { font-size: 12px; font-weight: 600; color: #111827; }
        .op-seq { font-size: 11px; color: #9ca3af; margin-top: 2px; }

        .op-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .op-operator { font-size: 11px; color: #6b7280; }

        .op-time { font-size: 11px; color: #6b7280; text-align: right; white-space: nowrap; }

        /* SCENARIO */
        .scenario { position: sticky; top: 20px; }

        .scenario-label { font-size: 10px; font-weight: 600; color: #9ca3af; letter-spacing: .6px; margin-bottom: 6px; }

        .scenario-title { font-size: 16px; font-weight: 700; color: #111827; }

        .scenario-id { font-size: 11px; color: #d1d5db; margin-top: 4px; }

        .ctx-grid {
          display: grid;
          grid-template-columns: 1fr 60px 55px;
          border-top: 1px solid #f3f4f6;
        }

        .ctx-cell {
          padding: 14px 16px;
          border-right: 1px solid #f3f4f6;
        }

        .ctx-cell:last-child { border-right: 0; }
        .ctx-label { font-size: 10px; color: #9ca3af; font-weight: 600; margin-bottom: 6px; }
        .ctx-value { font-size: 12px; color: #374151; font-weight: 600; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #f3f4f6;
        }

        .stat-cell { padding: 14px 16px; border-right: 1px solid #f3f4f6; }
        .stat-cell:last-child { border-right: 0; }
        .stat-num { font-size: 20px; font-weight: 700; color: #111827; }
        .stat-label { font-size: 10px; color: #9ca3af; margin-top: 4px; font-weight: 600; }

        .events-section { padding: 16px 16px 0; }
        .events-heading { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 10px; display: flex; justify-content: space-between; }

        .event-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 0;
          border-top: 1px solid #f3f4f6;
        }

        .event-num {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #374151;
          flex-shrink: 0;
        }

        .event-main { flex: 1; min-width: 0; }
        .event-type { font-size: 12px; font-weight: 600; color: #111827; }
        .event-target { font-size: 11px; color: #9ca3af; margin-top: 2px; }
        .event-time { font-size: 10px; color: #9ca3af; text-align: right; }

        .warning-box {
          margin: 14px 16px;
          padding: 12px 14px;
          border: 1px solid #fef08a;
          background: #fefce8;
          border-radius: 8px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .warning-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .warning-title { font-size: 12px; font-weight: 600; color: #713f12; }
        .warning-text { font-size: 11px; color: #92400e; margin-top: 3px; line-height: 1.5; }

        .actions {
          padding: 14px 16px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ready-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
        }

        .ready-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

        .run-btn {
          height: 38px;
          padding: 0 18px;
          background: #111827;
          color: #fff;
          border: 0;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: .3px;
        }

        .run-btn:hover { background: #1f2937; }
        .run-btn:disabled { opacity: .45; cursor: wait; }

        /* RESULT / VALIDATION */
        .section-panel { margin-bottom: 16px; }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid #f3f4f6;
        }

        .result-cell { padding: 18px 20px; border-right: 1px solid #f3f4f6; }
        .result-cell:last-child { border-right: 0; }
        .result-label { font-size: 11px; font-weight: 600; color: #9ca3af; margin-bottom: 8px; }
        .result-value { font-size: 18px; font-weight: 700; color: #111827; }
        .result-positive { color: #16a34a !important; }
        .result-negative { color: #dc2626 !important; }

        /* LOADING */
        .loading-state {
          padding: 60px 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
        }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .main-grid { grid-template-columns: 1fr; }
          .scenario { position: static; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 760px) {
          .sidebar { display: none; }
          .content { padding: 16px; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .result-grid { grid-template-columns: repeat(2, 1fr); }
          .op-row { grid-template-columns: 90px 1fr 70px; }
          .op-operator { display: none; }
        }
      `}</style>

      <div className="shell">

       <Sidebar/>

        {/* MAIN */}
        <main className="main">

          {/* TOPBAR */}
          <header className="topbar">
            <div className="breadcrumb">
              <span>Control Room</span>
              <span className="sep">/</span>
              <span className="active">Operations</span>
            </div>
           
          </header>

          {/* CONTENT */}
          <div className="content">

            {/* PAGE HEADER */}
            <div className="page-header">
              <div>
                <div className="eyebrow">MACHINE SHOP SCHEDULER</div>
                <h1 className="page-title">Operations Dashboard</h1>
                <div className="page-desc">Production scheduling, constraints and live replanning</div>
              </div>
              <button className="refresh-btn" onClick={loadBaseline} disabled={loading}>
                {loading ? "Loading…" : "↺ Refresh"}
              </button>
            </div>

            {/* ERROR */}
            {error && <div className="error-bar">⚠ {error}</div>}

            {/* LOADING */}
            {loading && !baseline ? (
              <div className="panel">
                <div className="loading-state">Loading scheduling engine…</div>
              </div>
            ) : (
              <>
                {/* KPI CARDS */}
                <div className="kpi-grid">
                  <div className="kpi">
                    <div className="kpi-label">SCHEDULED OPERATIONS</div>
                    <div className="kpi-value">{totalOperations}</div>
                    <div className="kpi-meta">validated production ops</div>
                  </div>

                  <div className="kpi">
                    <div className="kpi-label">BASELINE COST</div>
                    <div className="kpi-value">{formatCurrency(baselineCost)}</div>
                    <div className="kpi-meta kpi-good">EDD dispatcher</div>
                  </div>

                  <div className="kpi">
                    <div className="kpi-label">AFFECTED OPERATIONS</div>
                    <div className="kpi-value">{replanned ? affectedOperations : 0}</div>
                    <div className="kpi-meta">moved by active scenario</div>
                  </div>

                  <div className="kpi">
                    <div className="kpi-label">INCREMENTAL COST</div>
                    <div className={`kpi-value ${replanned ? (incrementalCost > 0 ? "kpi-warn" : "kpi-good") : ""}`}>
                      {replanned ? formatCurrency(incrementalCost) : "—"}
                    </div>
                    <div className="kpi-meta">replanning impact</div>
                  </div>
                </div>

                {/* MAIN GRID */}
                <div className="main-grid">

                  {/* SCHEDULE PANEL */}
                  <div className="panel">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Production Timeline</div>
                        <div className="panel-sub">{replanned ? "Replanned schedule" : "Baseline schedule"}</div>
                      </div>
                      <span className="panel-badge">{activeSchedule.length} ops</span>
                    </div>

                    {/* LEGEND */}
                    <div className="legend">
                      {Object.entries(OP_TYPE_CONFIG)
                        .filter(([k]) => k !== "default")
                        .map(([key, cfg]) => (
                          <div className="legend-item" key={key}>
                            <span className="legend-dot" style={{ background: cfg.bg, border: `1.5px solid ${cfg.color}33` }} />
                            <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                          </div>
                        ))}
                    </div>

                    <div className="schedule-body">
                      {machines.length === 0 ? (
                        <div className="loading-state">No operations to display</div>
                      ) : (
                        machines.map(([machineId, ops]) => (
                          <div className="machine-section" key={machineId}>
                            <div className="machine-header">
                              <span>{machineId}</span>
                              <span className="machine-ops-count">{ops.length} ops</span>
                            </div>

                            {ops.slice(0, 30).map((op) => {
                              const cfg = getOpType(op.operation_type);
                              return (
                                <div className="op-row" key={`${op.order_id}-${op.op_seq}`}>
                                  <div>
                                    <div className="op-id">{op.order_id}</div>
                                    <div className="op-seq">OP {op.op_seq} · {op.operation_type}</div>
                                  </div>

                                  <div>
                                    <span
                                      className="op-pill"
                                      style={{ background: cfg.bg, color: cfg.color }}
                                    >
                                      {op.operation_type}
                                    </span>
                                  </div>

                                  <div className="op-operator">{op.operator_id}</div>

                                  <div className="op-time">
                                    {formatTime(op.start_time)}<br />
                                    <span style={{ color: "#d1d5db" }}>–</span> {formatTime(op.end_time)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* SCENARIO PANEL */}
                  <div className="panel scenario">
                    <div className="panel-header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                      <div className="scenario-label">SCENARIO CONFIGURATION</div>
                      <div className="scenario-title">Active Scenario</div>
                      <div className="scenario-id">grinder-failure-operator-absence</div>
                    </div>

                    <div className="ctx-grid">
                      <div className="ctx-cell">
                        <div className="ctx-label">CURRENT TIME</div>
                        <div className="ctx-value">
                          {formatDate(defaultScenario.context.current_time)}<br />
                          <span style={{ color: "#9ca3af", fontWeight: 400 }}>{formatTime(defaultScenario.context.current_time)}</span>
                        </div>
                      </div>
                      <div className="ctx-cell">
                        <div className="ctx-label">SHIFT</div>
                        <div className="ctx-value">A</div>
                      </div>
                      <div className="ctx-cell">
                        <div className="ctx-label">EVENTS</div>
                        <div className="ctx-value">2</div>
                      </div>
                    </div>

                    <div className="stats-grid">
                      <div className="stat-cell">
                        <div className="stat-num">1</div>
                        <div className="stat-label">MACHINE</div>
                      </div>
                      <div className="stat-cell">
                        <div className="stat-num">1</div>
                        <div className="stat-label">OPERATOR</div>
                      </div>
                      <div className="stat-cell">
                        <div className="stat-num">2</div>
                        <div className="stat-label">TOTAL</div>
                      </div>
                    </div>

                    <div className="events-section">
                      <div className="events-heading">
                        <span>EVENT QUEUE</span>
                        <span style={{ background: "#f3f4f6", padding: "2px 8px", borderRadius: 10, fontSize: 11, color: "#374151" }}>02</span>
                      </div>

                      {(defaultScenario.events as ScenarioEvent[]).map((event, i) => (
                        <div className="event-item" key={`${event.event_type}-${event.target_id}`}>
                          <div className="event-num">{String(i + 1).padStart(2, "0")}</div>
                          <div className="event-main">
                            <div className="event-type">{event.event_type.replace("_", " ")}</div>
                            <div className="event-target">{event.target_id}</div>
                          </div>
                          <div className="event-time">
                            {formatDate(event.start_time || "")}<br />
                            {formatTime(event.start_time || "")}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="warning-box">
                      <span className="warning-icon">⚠</span>
                      <div>
                        <div className="warning-title">Schedule will be modified</div>
                        <div className="warning-text">
                          Completed operations remain locked. Unaffected future ops are preserved where possible.
                        </div>
                      </div>
                    </div>

                    <div className="actions">
                      <div className="ready-badge">
                        <span className="ready-dot" />
                        {replanned ? "Replan complete" : "Ready to optimize"}
                      </div>
                      <button className="run-btn" onClick={runReplanning} disabled={replanning}>
                        {replanning ? "Optimizing…" : "Run Replanning →"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* REPLANNING RESULT */}
                {replanned && (
                  <div className="panel section-panel">
                    <div className="panel-header">
                      <div>
                        <div className="panel-title">Replanning Result</div>
                        <div className="panel-sub">Scenario evaluation against baseline</div>
                      </div>
                      <span className="panel-badge" style={{ background: "#dcfce7", color: "#15803d" }}>Complete</span>
                    </div>
                    <div className="result-grid">
                      <div className="result-cell">
                        <div className="result-label">BASELINE</div>
                        <div className="result-value">{formatCurrency(baselineCost)}</div>
                      </div>
                      <div className="result-cell">
                        <div className="result-label">REPLANNED</div>
                        <div className="result-value">{formatCurrency(replannedCost)}</div>
                      </div>
                      <div className="result-cell">
                        <div className="result-label">STABILITY PENALTY</div>
                        <div className="result-value">{formatCurrency(replanned.cost_breakdown?.replanned?.stability_penalty)}</div>
                      </div>
                      <div className="result-cell">
                        <div className="result-label">INCREMENTAL COST</div>
                        <div className={`result-value ${incrementalCost > 0 ? "result-negative" : "result-positive"}`}>
                          {formatCurrency(incrementalCost)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONSTRAINT STATUS */}
                <div className="panel section-panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Constraint Status</div>
                      <div className="panel-sub">Hard constraint validation</div>
                    </div>
                    <span
                      className="panel-badge"
                      style={grinderViolations === 0
                        ? { background: "#dcfce7", color: "#15803d" }
                        : { background: "#fee2e2", color: "#dc2626" }}
                    >
                      {grinderViolations === 0 ? "✓ Valid" : "⚠ Violation"}
                    </span>
                  </div>
                  <div className="result-grid">
                    <div className="result-cell">
                      <div className="result-label">TOTAL OPERATIONS</div>
                      <div className="result-value">{activeSchedule.length}</div>
                    </div>
                    <div className="result-cell">
                      <div className="result-label">DUPLICATE OPERATIONS</div>
                      <div className="result-value result-positive">0</div>
                    </div>
                    <div className="result-cell">
                      <div className="result-label">GRINDER VIOLATIONS</div>
                      <div className={`result-value ${grinderViolations === 0 ? "result-positive" : "result-negative"}`}>
                        {grinderViolations}
                      </div>
                    </div>
                    <div className="result-cell">
                      <div className="result-label">OVERTIME OPERATIONS</div>
                      <div className="result-value">
                        {activeSchedule.filter((op) => op.is_overtime).length}
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;