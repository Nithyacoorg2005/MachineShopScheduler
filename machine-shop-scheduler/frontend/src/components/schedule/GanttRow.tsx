import React from "react";

export interface GanttRowOperation {
  order_id: string;
  op_seq: number;
  operation_type: string;
  machine_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_overtime?: boolean;
}

export interface GanttBreakdown {
  machine_id: string;
  start_time: string;
  duration_hours: number;
  label?: string;
}

interface GanttRowProps {
  machineId: string;
  operations: GanttRowOperation[];
  timelineStart: number;
  timelineDuration: number;
  tickRatios?: number[];
  breakdowns?: GanttBreakdown[];
  selectedOperation?: GanttRowOperation | null;
  onOperationClick?: (op: GanttRowOperation) => void;
}

const OP_LABELS: Record<string, string> = {
  "CNC Lathe": "LATHE",
  Milling: "MILL",
  Drill: "DRILL",
  Grinding: "GRIND",
  Inspection: "INSP",
};

// Light-theme palette per operation type
const OP_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  "CNC Lathe":  { bg: "#dbeafe", border: "#93c5fd", text: "#1d4ed8", label: "#3b82f6" },
  Milling:      { bg: "#dcfce7", border: "#86efac", text: "#15803d", label: "#22c55e" },
  Drill:        { bg: "#ede9fe", border: "#c4b5fd", text: "#7c3aed", label: "#a78bfa" },
  Grinding:     { bg: "#fef3c7", border: "#fcd34d", text: "#92400e", label: "#f59e0b" },
  Inspection:   { bg: "#f3f4f6", border: "#d1d5db", text: "#374151", label: "#9ca3af" },
  default:      { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1", label: "#38bdf8" },
};

function getOpStyle(type: string) {
  return OP_STYLES[type] ?? OP_STYLES.default;
}

function getOpLabel(type: string) {
  return OP_LABELS[type] ?? type.slice(0, 6).toUpperCase();
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = minutes / 60;
  if (h < 24) return `${h.toFixed(1)}h`;
  const d = Math.floor(h / 24);
  const rem = Math.round(h % 24);
  return rem === 0 ? `${d}d` : `${d}d ${rem}h`;
}

function getOpPosition(op: GanttRowOperation, start: number, duration: number) {
  const s = new Date(op.start_time).getTime();
  const e = new Date(op.end_time).getTime();
  const left = ((s - start) / duration) * 100;
  const width = ((e - s) / duration) * 100;
  return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.3, width)}%` };
}

function getBreakdownPosition(bd: GanttBreakdown, start: number, duration: number) {
  const s = new Date(bd.start_time).getTime();
  const e = s + bd.duration_hours * 3600000;
  const left = ((s - start) / duration) * 100;
  const width = ((e - s) / duration) * 100;
  return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.3, width)}%` };
}

export default function GanttRow({
  machineId,
  operations,
  timelineStart,
  timelineDuration,
  tickRatios = [],
  breakdowns = [],
  selectedOperation,
  onOperationClick,
}: GanttRowProps) {
  const machineBreakdowns = breakdowns.filter((b) => b.machine_id === machineId);
  const sorted = [...operations].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  return (
    <>
      <div className="gr">
        {/* Machine label */}
        <div className="gr__machine">
          <span className="gr__status" />
          <div className="gr__info">
            <strong>{machineId}</strong>
            <span>{sorted.length} {sorted.length === 1 ? "op" : "ops"}</span>
          </div>
        </div>

        {/* Track */}
        <div className="gr__track">
          {tickRatios.map((r, i) => (
            <div className="gr__grid" key={i} style={{ left: `${r * 100}%` }} />
          ))}

          {machineBreakdowns.map((bd, i) => (
            <div
              key={i}
              className="gr__breakdown"
              style={getBreakdownPosition(bd, timelineStart, timelineDuration)}
              title={bd.label ?? "Machine downtime"}
            >
              <span>DOWN</span>
            </div>
          ))}

          {sorted.map((op) => {
            const style = getOpStyle(op.operation_type);
            const selected =
              selectedOperation?.order_id === op.order_id &&
              selectedOperation?.op_seq === op.op_seq;

            return (
              <button
                type="button"
                key={`${op.order_id}-${op.op_seq}`}
                className={["gr__bar", selected ? "gr__bar--selected" : "", op.is_overtime ? "gr__bar--overtime" : ""].filter(Boolean).join(" ")}
                style={{
                  ...getOpPosition(op, timelineStart, timelineDuration),
                  background: style.bg,
                  borderColor: selected ? style.text : style.border,
                  borderStyle: op.is_overtime ? "dashed" : "solid",
                }}
                onClick={() => onOperationClick?.(op)}
                title={[op.order_id, op.operation_type, op.machine_id, op.operator_id, formatDuration(op.duration_minutes)].join(" · ")}
              >
                <span className="gr__bar-content">
                  <strong style={{ color: style.text }}>{op.order_id}</strong>
                  <span style={{ color: style.label }}>{getOpLabel(op.operation_type)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .gr {
    display: grid;
    grid-template-columns: 160px minmax(600px, 1fr);
    min-height: 58px;
    border-bottom: 1px solid #f3f4f6;
  }

  .gr:last-child { border-bottom: 0; }
  .gr:hover { background: #fafafa; }

  /* Machine column */
  .gr__machine {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px 0 20px;
    border-right: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .gr__status {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.12);
  }

  .gr__info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .gr__info strong {
    color: #111827;
    font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
    font-size: 10px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gr__info span {
    color: #9ca3af;
    font-size: 9px;
    white-space: nowrap;
  }

  /* Track */
  .gr__track {
    position: relative;
    min-width: 600px;
    background: #ffffff;
  }

  .gr__grid {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: #f3f4f6;
    pointer-events: none;
  }

  /* Operation bars */
  .gr__bar {
    position: absolute;
    top: 12px;
    height: 34px;
    min-width: 6px;
    padding: 0 8px;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 6px;
    outline: none;
    text-align: left;
    cursor: pointer;
    transition: filter 120ms ease, transform 120ms ease, box-shadow 120ms ease;
    z-index: 3;
  }

  .gr__bar:hover {
    filter: brightness(0.96);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    z-index: 6;
  }

  .gr__bar:focus-visible {
    box-shadow: 0 0 0 2px #6b7280;
    z-index: 7;
  }

  .gr__bar--selected {
    box-shadow: 0 0 0 2px rgba(3,105,161,0.25);
    z-index: 7;
  }

  .gr__bar-content {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
  }

  .gr__bar-content strong {
    font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
    font-size: 9px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gr__bar-content span {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  /* Breakdown overlay */
  .gr__breakdown {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    background: repeating-linear-gradient(
      135deg,
      rgba(251,146,60,0.12) 0px,
      rgba(251,146,60,0.12) 3px,
      rgba(255,255,255,0.1) 3px,
      rgba(255,255,255,0.1) 6px
    );
    border-left: 1px dashed #f97316;
    border-right: 1px dashed #f97316;
    pointer-events: none;
  }

  .gr__breakdown span {
    margin-top: 5px;
    color: #ea580c;
    font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
    font-size: 7px;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
`;