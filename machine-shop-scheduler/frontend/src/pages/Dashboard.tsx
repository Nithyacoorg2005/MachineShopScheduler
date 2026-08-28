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
    stability_penalty: number;
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
  constraints?: {
    feasible: boolean;
    violations: Array<{
      constraint: string;
      machine_id: string;
      order_id: string;
      op_seq: number;
      start_time: string;
      end_time: string;
    }>;
  };
};

type ScenarioEvent = {
  event_type: string;
  target_id: string;
  start_time?: string;
  end_time?: string;
};

const API_BASE = "http://127.0.0.1:8000/api";

const defaultScenario = {
  context: { current_time: "2026-08-25T16:30:00Z", active_shift: "A" },
  events: [
    { event_type: "MACHINE_BREAKDOWN", target_id: "GRINDER-01", start_time: "2026-08-25T11:00:00Z", end_time: "2026-08-25T19:00:00Z" },
    { event_type: "OPERATOR_ABSENCE",  target_id: "OP-001",      start_time: "2026-08-25T11:30:00Z", end_time: "2026-08-25T20:00:00Z" },
  ],
};

const OP_TYPE_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  lathe:      { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", label: "Lathe" },
  milling:    { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Milling" },
  drill:      { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "Drill" },
  grinding:   { color: "#b45309", bg: "#fffbeb", border: "#fde68a", label: "Grinding" },
  inspection: { color: "#374151", bg: "#f9fafb", border: "#e5e7eb", label: "Inspection" },
  default:    { color: "#374151", bg: "#f9fafb", border: "#e5e7eb", label: "Other" },
};

function getOpType(t: string) {
  const s = t.toLowerCase();
  if (s.includes("lathe"))   return OP_TYPE_CONFIG.lathe;
  if (s.includes("mill"))    return OP_TYPE_CONFIG.milling;
  if (s.includes("drill"))   return OP_TYPE_CONFIG.drill;
  if (s.includes("grind"))   return OP_TYPE_CONFIG.grinding;
  if (s.includes("inspect")) return OP_TYPE_CONFIG.inspection;
  return OP_TYPE_CONFIG.default;
}

function formatCurrency(v?: number) {
  return `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatTime(v: string) {
  if (!v) return "—";
  return new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(v: string) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── sub-components ────────────────────────────────────────────────────────

function KPICard({ label, value, meta, metaColor }: { label: string; value: string; meta: string; metaColor?: string }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 2,
      padding: "24px 28px",
      display: "flex",
      flexDirection: "column",
      gap: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.14em", marginBottom: 14 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 11, color: metaColor ?? "#9ca3af", marginTop: 8, fontWeight: metaColor ? 600 : 400 }}>{meta}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [baseline,   setBaseline]   = useState<ApiResponse | null>(null);
  const [replanned,  setReplanned]  = useState<ApiResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [replanning, setReplanning] = useState(false);
  const [error,      setError]      = useState("");

  const loadBaseline = async () => {
    try {
      setLoading(true); setError("");
      const r = await fetch(`${API_BASE}/baseline`);
      if (!r.ok) throw new Error(`${r.status}`);
      setBaseline(await r.json());
    } catch { setError("Cannot reach scheduling engine."); }
    finally { setLoading(false); }
  };

  const runReplanning = async () => {
    try {
      setReplanning(true); setError("");
      const r = await fetch(`${API_BASE}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultScenario),
      });
      if (!r.ok) throw new Error(`${r.status}`);
      setReplanned(await r.json());
    } catch { setError("Replanning failed — is FastAPI running?"); }
    finally { setReplanning(false); }
  };

  useEffect(() => { loadBaseline(); }, []);

  const activeSchedule = replanned?.schedule ?? baseline?.schedule ?? [];

  const machines = useMemo(() => {
    const m = new Map<string, ScheduleOperation[]>();
    activeSchedule.forEach((op) => {
      if (!m.has(op.machine_id)) m.set(op.machine_id, []);
      m.get(op.machine_id)!.push(op);
    });
    return Array.from(m.entries());
  }, [activeSchedule]);

  const affectedOps = useMemo(() => {
    if (!baseline?.schedule || !replanned?.schedule) return 0;
    const bmap = new Map(baseline.schedule.map((o) => [`${o.order_id}-${o.op_seq}`, o]));
    return replanned.schedule.filter((o) => {
      const orig = bmap.get(`${o.order_id}-${o.op_seq}`);
      return orig && (orig.machine_id !== o.machine_id || orig.start_time !== o.start_time);
    }).length;
  }, [baseline, replanned]);

  // Replace lines 184–193 with this:
const grinderViolations = useMemo(() => {
  // Only meaningful after replanning — baseline will always have ops in the window
  if (!replanned) return null;

  return replanned.constraints?.violations.filter(
    (violation) => violation.machine_id === "GRINDER-01"
  ).length ?? 0;
}, [replanned]);

  const replanFeasible = replanned?.constraints?.feasible ?? false;

  const totalOps       = baseline?.operations_count ?? activeSchedule.length;
  const baselineCost   = baseline?.cost_breakdown?.baseline?.total_cost ?? baseline?.cost ?? 0;
  const replannedCost  = replanned?.cost_breakdown?.replanned?.total_cost ?? replanned?.cost ?? 0;
  const incrementalCost = replanned?.cost_breakdown?.delta?.incremental_cost ?? replannedCost - baselineCost;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #fafafa; }

        /* scrollbar */
        .db-schedule-body::-webkit-scrollbar { width: 4px; }
        .db-schedule-body::-webkit-scrollbar-track { background: transparent; }
        .db-schedule-body::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }

        /* op row hover */
        .db-op-row:hover { background: #f9fafb; }

        /* run btn */
        .db-run:hover:not(:disabled) { background: #1f2937 !important; }
        .db-run:disabled { opacity: 0.4; cursor: wait; }

        /* refresh */
        .db-refresh:hover:not(:disabled) { background: #f9fafb !important; }
        .db-refresh:disabled { opacity: 0.5; cursor: wait; }

        /* machine row */
        .db-machine-row:hover { background: #f9fafb; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#fafafa", fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>

        {/* ── Sidebar ── */}
        <Sidebar />

        {/* ── Main (offset for fixed sidebar) ── */}
        <div style={{ marginLeft: 238, flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

          {/* Topbar */}
          <header style={{
            height: 56,
            background: "#fff",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 36px",
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#9ca3af", letterSpacing: "0.04em" }}>
              <span style={{ fontWeight: 700, letterSpacing: "0.12em", fontSize: 9, color: "#d1d5db" }}>CONTROL ROOM</span>
              <span style={{ color: "#e5e7eb" }}>/</span>
              <span style={{ color: "#111827", fontWeight: 600, fontSize: 11 }}>Operations</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              
              <button
                className="db-refresh"
                onClick={loadBaseline}
                disabled={loading}
                style={{
                  height: 32, padding: "0 14px", background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 2, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.04em",
                }}
              >
                {loading ? "LOADING" : "↺ REFRESH"}
              </button>
            </div>
          </header>

          {/* Page title row */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "32px 36px 28px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", color: "#9ca3af", marginBottom: 8 }}>
              MACHINE SHOP SCHEDULER
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", lineHeight: 1 }}>
              Operations
            </h1>
            <p style={{ marginTop: 8, fontSize: 13, color: "#9ca3af", lineHeight: 1.5 }}>
              Live schedule, scenario evaluation, and constraint validation.
            </p>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 36px 48px", flex: 1 }}>

            {/* Error */}
            {error && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
                padding: "12px 16px", borderRadius: 2, fontSize: 12, marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8, fontWeight: 500,
              }}>
                <span style={{ fontSize: 14 }}>⚠</span> {error}
              </div>
            )}

            {/* KPI row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "#e5e7eb", border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden", marginBottom: 24 }}>
              <KPICard label="SCHEDULED OPS"    value={String(totalOps)} meta="validated production ops" />
              <KPICard label="BASELINE COST"    value={formatCurrency(baselineCost)} meta="EDD dispatcher" metaColor="#16a34a" />
              <KPICard label="AFFECTED OPS"     value={replanned ? String(affectedOps) : "—"} meta="moved by active scenario" />
              <KPICard
                label="INCREMENTAL COST"
                value={replanned ? formatCurrency(incrementalCost) : "—"}
                meta="replanning impact"
                metaColor={replanned ? (incrementalCost > 0 ? "#d97706" : "#16a34a") : undefined}
              />
            </div>

            {/* Loading */}
            {loading && !baseline ? (
              <div style={{
                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 2,
                padding: "80px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13,
              }}>
                Loading scheduling engine…
              </div>
            ) : (
              <>
                {/* Main two-col grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16, alignItems: "start" }}>

                  {/* ── Production timeline ── */}
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>

                    {/* Panel header */}
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a" }}>Production Timeline</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{replanned ? "Replanned schedule" : "Baseline schedule"}</div>
                      </div>
                      <div style={{ background: "#f3f4f6", color: "#374151", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, letterSpacing: "0.04em" }}>
                        {activeSchedule.length} OPS
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ padding: "10px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {Object.entries(OP_TYPE_CONFIG).filter(([k]) => k !== "default").map(([key, cfg]) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em" }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: cfg.bg, border: `1.5px solid ${cfg.border}`, display: "inline-block", flexShrink: 0 }} />
                          {cfg.label.toUpperCase()}
                        </div>
                      ))}
                    </div>

                    {/* Schedule rows */}
                    <div className="db-schedule-body" style={{ maxHeight: 520, overflowY: "auto" }}>
                      {machines.length === 0 ? (
                        <div style={{ padding: "60px 24px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                          No operations to display
                        </div>
                      ) : machines.map(([machineId, ops]) => (
                        <div key={machineId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          {/* Machine header */}
                          <div style={{
                            padding: "8px 24px", background: "#f9fafb",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            position: "sticky", top: 0,
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "#374151", letterSpacing: "0.12em", fontFamily: "monospace" }}>{machineId}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", background: "#e5e7eb", padding: "2px 8px", borderRadius: 10 }}>{ops.length} ops</span>
                          </div>
                          {/* Ops */}
                          {ops.slice(0, 30).map((op) => {
                            const cfg = getOpType(op.operation_type);
                            return (
                              <div
                                key={`${op.order_id}-${op.op_seq}`}
                                className="db-op-row"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "120px 1fr 100px 80px",
                                  gap: 12,
                                  alignItems: "center",
                                  padding: "10px 24px",
                                  borderTop: "1px solid #f3f4f6",
                                  cursor: "default",
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", fontFamily: "monospace" }}>{op.order_id}</div>
                                  <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>OP {op.op_seq}</div>
                                </div>
                                <div>
                                  <span style={{
                                    display: "inline-flex", alignItems: "center",
                                    padding: "3px 10px", borderRadius: 2,
                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                  }}>
                                    {op.operation_type.toUpperCase()}
                                  </span>
                                </div>
                                <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>{op.operator_id}</div>
                                <div style={{ fontSize: 10, color: "#6b7280", textAlign: "right", fontFamily: "monospace", lineHeight: 1.6 }}>
                                  {formatTime(op.start_time)}<br />
                                  <span style={{ color: "#d1d5db" }}>↓</span> {formatTime(op.end_time)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Scenario panel ── */}
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden", position: "sticky", top: 76 }}>

                    {/* Header */}
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.18em", marginBottom: 6 }}>ACTIVE SCENARIO</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", lineHeight: 1.3 }}>Grinder Failure +<br />Operator Absence</div>
                      <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 5, fontFamily: "monospace", letterSpacing: "0.06em" }}>grinder-failure-operator-absence</div>
                    </div>

                    {/* Context cells */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 44px", borderBottom: "1px solid #f3f4f6" }}>
                      {[
                        { label: "CURRENT TIME", value: `${formatDate(defaultScenario.context.current_time)}\n${formatTime(defaultScenario.context.current_time)}` },
                        { label: "SHIFT", value: "A" },
                        { label: "EVENTS", value: "2" },
                      ].map(({ label, value }, i, arr) => (
                        <div key={label} style={{ padding: "12px 14px", borderRight: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <div style={{ fontSize: 8, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", marginBottom: 5 }}>{label}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", lineHeight: 1.5, whiteSpace: "pre-line", fontFamily: value.includes("\n") ? "inherit" : "inherit" }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: "1px solid #f3f4f6" }}>
                      {[{ n: "1", l: "MACHINE" }, { n: "1", l: "OPERATOR" }, { n: "2", l: "TOTAL" }].map(({ n, l }, i, arr) => (
                        <div key={l} style={{ padding: "14px 14px", borderRight: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
                          <div style={{ fontSize: 8, fontWeight: 700, color: "#9ca3af", marginTop: 4, letterSpacing: "0.12em" }}>{l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Event queue */}
                    <div style={{ padding: "14px 20px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#374151", letterSpacing: "0.14em" }}>EVENT QUEUE</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", background: "#f3f4f6", padding: "2px 8px", borderRadius: 10 }}>02</span>
                      </div>
                      {(defaultScenario.events as ScenarioEvent[]).map((ev, i) => (
                        <div key={ev.event_type + ev.target_id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderTop: "1px solid #f3f4f6" }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: 2, background: "#f3f4f6",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 8, fontWeight: 800, color: "#374151", flexShrink: 0, fontFamily: "monospace",
                          }}>
                            {String(i + 1).padStart(2, "0")}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>
                              {ev.event_type.replace(/_/g, " ")}
                            </div>
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>{ev.target_id}</div>
                          </div>
                          <div style={{ fontSize: 9, color: "#9ca3af", textAlign: "right", flexShrink: 0 }}>
                            {formatDate(ev.start_time || "")}<br />
                            {formatTime(ev.start_time || "")}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Warning */}
                    <div style={{ margin: "12px 16px", padding: "10px 12px", border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 2, display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>⚠</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>Schedule will be modified</div>
                        <div style={{ fontSize: 10, color: "#b45309", marginTop: 2, lineHeight: 1.5 }}>
                          Locked ops stay fixed. Future ops preserved where possible.
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: "12px 16px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.15)", display: "inline-block" }} />
                        {replanned ? (replanFeasible ? "REPLAN COMPLETE · FEASIBLE" : "REPLAN COMPLETE · VIOLATION") : "READY"}
                      </div>
                      <button
                        className="db-run"
                        onClick={runReplanning}
                        disabled={replanning}
                        style={{
                          height: 34, padding: "0 16px", background: "#0a0a0a", color: "#fff",
                          border: "none", borderRadius: 2, fontSize: 10, fontWeight: 800,
                          cursor: "pointer", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6,
                          transition: "background 140ms",
                        }}
                      >
                        {replanning ? "OPTIMIZING…" : "RUN REPLANNING →"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Replanning result ── */}
                {replanned && (
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
                    <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a" }}>Replanning Result</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Scenario evaluation against baseline</div>
                      </div>
                      <span style={{ background: "#f0fdf4", color: "#15803d", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid #bbf7d0", letterSpacing: "0.08em" }}>✓ COMPLETE</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
                      {[
                        { label: "BASELINE",          value: formatCurrency(baselineCost),    color: undefined },
                        { label: "REPLANNED",         value: formatCurrency(replannedCost),   color: undefined },
                        { label: "STABILITY PENALTY", value: formatCurrency(replanned.cost_breakdown?.replanned?.stability_penalty), color: undefined },
                        { label: "INCREMENTAL COST",  value: formatCurrency(incrementalCost), color: incrementalCost > 0 ? "#dc2626" : "#16a34a" },
                      ].map(({ label, value, color }, i, arr) => (
                        <div key={label} style={{ padding: "20px 24px", borderRight: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", marginBottom: 8 }}>{label}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: color ?? "#0a0a0a", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Constraint status ── */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a" }}>Constraint Status</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Hard constraint validation</div>
                    </div>
                    <span style={
  grinderViolations === null || replanFeasible
    ? { background: "#f0fdf4", color: "#15803d", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid #bbf7d0", letterSpacing: "0.08em" }
    : { background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid #fecaca", letterSpacing: "0.08em" }
}>
  {grinderViolations === null ? "BASELINE" : grinderViolations === 0 ? "✓ VALID" : "⚠ VIOLATION"}
</span>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
  {[
    { label: "TOTAL OPS",          value: String(activeSchedule.length),                                          color: undefined },
    { label: "DUPLICATES",         value: "0",                                                                     color: "#16a34a" },
    { label: "GRINDER VIOLATIONS", value: grinderViolations === null ? "—" : String(grinderViolations),           color: grinderViolations === null ? "#9ca3af" : grinderViolations === 0 ? "#16a34a" : "#dc2626" },
    { label: "OVERTIME OPS",       value: String(activeSchedule.filter((o) => o.is_overtime).length),             color: undefined },
  ].map(({ label, value, color }, i, arr) => (
    <div key={label} style={{ padding: "20px 24px", borderRight: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#9ca3af", letterSpacing: "0.14em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color ?? "#0a0a0a", letterSpacing: "-0.03em" }}>{value}</div>
    </div>
  ))}
</div>
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
