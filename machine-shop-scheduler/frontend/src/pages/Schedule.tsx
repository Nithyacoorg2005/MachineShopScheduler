import React, { useMemo, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import GanttRow from "../components/schedule/GanttRow";
import ScheduleLegend from "../components/schedule/ScheduleLegend";
import Timeline from "../components/schedule/Timeline";

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

type ScheduleProps = {
  schedule?: ScheduleOperation[];
  loading?: boolean;
};

function ScheduleGantt({ schedule }: { schedule: ScheduleOperation[] }) {
  const { timelineStart, timelineEnd, rows } = useMemo(() => {
    const starts = schedule.map((o) => new Date(o.start_time).getTime()).filter(Number.isFinite);
    const ends   = schedule.map((o) => new Date(o.end_time).getTime()).filter(Number.isFinite);
    const start  = Math.min(...starts);
    const end    = Math.max(...ends);
    const grouped = new Map<string, ScheduleOperation[]>();
    for (const op of schedule) {
      const arr = grouped.get(op.machine_id) ?? [];
      arr.push(op);
      grouped.set(op.machine_id, arr);
    }
    return {
      timelineStart: start,
      timelineEnd:   end > start ? end : start + 3600000,
      rows: [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [schedule]);

  const duration = timelineEnd - timelineStart;

  return (
    <div style={{ minWidth: 760 }}>
      <Timeline startTime={timelineStart} endTime={timelineEnd} label="MACHINE" />
      {rows.map(([machineId, ops]) => (
        <GanttRow
          key={machineId}
          machineId={machineId}
          operations={ops}
          timelineStart={timelineStart}
          timelineDuration={duration}
        />
      ))}
    </div>
  );
}

const Schedule: React.FC<ScheduleProps> = ({ schedule = [], loading = false }) => {
  const [machineFilter,   setMachineFilter]   = useState("ALL");
  const [operatorFilter,  setOperatorFilter]  = useState("ALL");
  const [search,          setSearch]          = useState("");
  const [showOvertimeOnly, setShowOvertimeOnly] = useState(false);

  const machines = useMemo(
    () => Array.from(new Set(schedule.map((o) => o.machine_id).filter(Boolean))).sort(),
    [schedule]
  );

  const operators = useMemo(
    () => Array.from(new Set(schedule.map((o) => o.operator_id).filter(Boolean))).sort(),
    [schedule]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schedule.filter((op) => {
      const machine   = machineFilter  === "ALL" || op.machine_id  === machineFilter;
      const operator  = operatorFilter === "ALL" || op.operator_id === operatorFilter;
      const text      = !q || [op.order_id, op.operation_type, op.machine_id, op.operator_id].some((v) => v.toLowerCase().includes(q));
      const overtime  = !showOvertimeOnly || op.is_overtime === true;
      return machine && operator && text && overtime;
    });
  }, [schedule, machineFilter, operatorFilter, search, showOvertimeOnly]);

  const stats = useMemo(() => ({
    operations: filtered.length,
    orders:     new Set(filtered.map((o) => o.order_id)).size,
    hours:      filtered.reduce((s, o) => s + Number(o.duration_minutes || 0), 0) / 60,
    overtime:   filtered.filter((o) => o.is_overtime).length,
  }), [filtered]);

  const hasFilters = machineFilter !== "ALL" || operatorFilter !== "ALL" || search !== "" || showOvertimeOnly;

  const clearFilters = () => {
    setMachineFilter("ALL");
    setOperatorFilter("ALL");
    setSearch("");
    setShowOvertimeOnly(false);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#ffffff", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
      <Sidebar />

      {/* Main area — offset for fixed sidebar */}
      <div style={{ marginLeft: 238, flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#f8f9fb" }}>

        {/* Topbar */}
        <header style={{
          height: 60,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af" }}>
            <span>Control Room</span>
            <span style={{ color: "#e5e7eb" }}>/</span>
            <span style={{ color: "#374151", fontWeight: 500 }}>Schedule</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Engine connected
          </div>
        </header>

        {/* Page header */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "24px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" }}>
                Production Planning
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em" }}>
                Schedule
              </h1>
              <p style={{ margin: "5px 0 0", fontSize: 13, color: "#9ca3af" }}>
                Production schedule across machines, operators and orders.
              </p>
            </div>

            {/* Stat pills */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "OPERATIONS",   value: stats.operations },
                { label: "ORDERS",       value: stats.orders },
                { label: "PLANNED HRS",  value: `${stats.hours.toFixed(1)}h` },
                ...(stats.overtime > 0 ? [{ label: "OVERTIME", value: stats.overtime }] : []),
              ].map(({ label, value }) => (
                <div key={label} style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  textAlign: "center",
                  minWidth: 72,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px", flex: 1 }}>

          {/* Filters */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap" }}>

              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 340 }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search orders, machines…"
                  style={{
                    width: "100%", height: 38, paddingLeft: 32, paddingRight: 10, borderRadius: 8,
                    border: "1px solid #e5e7eb", background: "#f9fafb", fontSize: 13, color: "#111827",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Machine select */}
              <select value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}
                style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#ffffff", fontSize: 13, color: "#374151", outline: "none" }}>
                <option value="ALL">All machines</option>
                {machines.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Operator select */}
              <select value={operatorFilter} onChange={(e) => setOperatorFilter(e.target.value)}
                style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#ffffff", fontSize: 13, color: "#374151", outline: "none" }}>
                <option value="ALL">All operators</option>
                {operators.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>

              {/* Overtime toggle */}
              <button type="button" onClick={() => setShowOvertimeOnly((v) => !v)}
                style={{
                  height: 38, padding: "0 14px", borderRadius: 8, border: "1px solid",
                  borderColor: showOvertimeOnly ? "#111827" : "#e5e7eb",
                  background: showOvertimeOnly ? "#111827" : "#ffffff",
                  color: showOvertimeOnly ? "#ffffff" : "#6b7280",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}>
                Overtime only
              </button>

              {hasFilters && (
                <button type="button" onClick={clearFilters}
                  style={{ height: 38, padding: "0 10px", background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer" }}>
                  Clear
                </button>
              )}
            </div>

            {/* Filter summary + legend */}
            <div style={{ borderTop: "1px solid #f3f4f6", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                Showing{" "}
                <span style={{ fontWeight: 600, color: "#374151" }}>{filtered.length}</span>
                {" "}of{" "}
                <span style={{ fontWeight: 600, color: "#374151" }}>{schedule.length}</span>
                {" "}operations
              </div>
              <ScheduleLegend compact />
            </div>
          </div>

          {/* Gantt panel */}
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420, flexDirection: "column", gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  border: "2px solid #e5e7eb", borderTopColor: "#374151",
                  animation: "spin 0.7s linear infinite",
                }} />
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Loading schedule…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420, flexDirection: "column", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
                  </svg>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>No operations found</div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Try adjusting the filters.</div>
                {hasFilters && (
                  <button type="button" onClick={clearFilters}
                    style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#374151", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <ScheduleGantt schedule={filtered} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;