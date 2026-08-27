import type { ReactNode } from "react";

export type ScenarioStatus = "ready" | "active" | "completed" | "failed";

export interface ScenarioEvent {
  event_type: string;
  target_id: string;
  start_time?: string;
  duration_hours?: number;
  impact?: string;
  notes?: string;
}

export interface ScenarioCardProps {
  name: string;
  description?: string;
  scenarioId?: string;
  status?: ScenarioStatus;
  events?: ScenarioEvent[];
  affectedOperations?: number;
  costImpact?: number;
  onRun?: () => void;
  onView?: () => void;
  running?: boolean;
  icon?: ReactNode;
}

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  ready:     { label: "READY",     color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" },
  active:    { label: "ACTIVE",    color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
  completed: { label: "COMPLETED", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", dot: "#22c55e" },
  failed:    { label: "FAILED",    color: "#dc2626", bg: "#fef2f2", border: "#fecaca", dot: "#f87171" },
};

function formatEventType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDuration(hours?: number) {
  if (hours === undefined || hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (Number.isInteger(hours)) return `${hours} hr`;
  return `${hours.toFixed(1)} hr`;
}

function formatCost(value?: number) {
  if (value === undefined || value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}₹${Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function ScenarioCard({
  name,
  description,
  scenarioId,
  status = "ready",
  events = [],
  affectedOperations,
  costImpact,
  onRun,
  onView,
  running = false,
  icon,
}: ScenarioCardProps) {
  const s = STATUS_CONFIG[status];
  const primaryEvent = events[0];
  const isRunnable = status === "ready" && !running;

  return (
    <>
      <article className="sc">
        {/* Header */}
        <header className="sc__header">
          <div className="sc__identity">
            <div className="sc__icon">{icon ?? "SC"}</div>
            <div className="sc__heading">
              <div className="sc__eyebrow">{scenarioId ?? "SCENARIO"}</div>
              <h3 className="sc__title">{name}</h3>
            </div>
          </div>
          <div className="sc__status" style={{ color: s.color, background: s.bg, borderColor: s.border }}>
            <span className="sc__status-dot" style={{ background: s.dot }} />
            {running ? "RUNNING" : s.label}
          </div>
        </header>

        {/* Description */}
        {description && <p className="sc__desc">{description}</p>}

        {/* Primary event */}
        {primaryEvent && (
          <div className="sc__event">
            <div className="sc__event-header">
              <span className="sc__section-label">EVENT</span>
              <span className="sc__event-type">{formatEventType(primaryEvent.event_type)}</span>
            </div>
            <div className="sc__event-grid">
              <div>
                <span className="sc__field-label">TARGET</span>
                <span className="sc__field-value sc__field-value--mono">{primaryEvent.target_id}</span>
              </div>
              <div>
                <span className="sc__field-label">START</span>
                <span className="sc__field-value">{formatDate(primaryEvent.start_time)}</span>
              </div>
              <div>
                <span className="sc__field-label">DURATION</span>
                <span className="sc__field-value">{formatDuration(primaryEvent.duration_hours)}</span>
              </div>
              <div>
                <span className="sc__field-label">IMPACT</span>
                <span className="sc__field-value">{primaryEvent.impact ?? "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional events */}
        {events.length > 1 && (
          <div className="sc__events">
            <span className="sc__section-label">{events.length} EVENTS</span>
            <div className="sc__event-list">
              {events.slice(1).map((ev, i) => (
                <div className="sc__event-row" key={`${ev.event_type}-${ev.target_id}-${i}`}>
                  <span className="sc__event-row-type">{formatEventType(ev.event_type)}</span>
                  <span className="sc__event-row-target">{ev.target_id}</span>
                  <span className="sc__event-row-dur">{formatDuration(ev.duration_hours)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact */}
        {(affectedOperations !== undefined || costImpact !== undefined) && (
          <div className="sc__impact">
            {affectedOperations !== undefined && (
              <div className="sc__impact-item">
                <span className="sc__field-label">AFFECTED</span>
                <span className="sc__impact-value">{affectedOperations}<small> ops</small></span>
              </div>
            )}
            {costImpact !== undefined && (
              <div className="sc__impact-item">
                <span className="sc__field-label">COST IMPACT</span>
                <span className={`sc__impact-value ${costImpact > 0 ? "sc__impact-value--neg" : costImpact < 0 ? "sc__impact-value--pos" : ""}`}>
                  {formatCost(costImpact)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="sc__footer">
          <div className="sc__footer-meta">
            {events.length > 0 ? `${events.length} ${events.length === 1 ? "event" : "events"} configured` : "No events configured"}
          </div>
          <div className="sc__actions">
            {onView && (
              <button type="button" className="sc__btn sc__btn--secondary" onClick={onView}>
                VIEW
              </button>
            )}
            {onRun && (
              <button type="button" className="sc__btn sc__btn--primary" onClick={onRun} disabled={!isRunnable}>
                {running ? (
                  <><span className="sc__spinner" />RUNNING</>
                ) : "RUN SCENARIO"}
              </button>
            )}
          </div>
        </footer>
      </article>

      <style>{`
        .sc {
          width: 100%;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #111827;
          transition: border-color 160ms ease, box-shadow 160ms ease;
        }

        .sc:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        /* Header */
        .sc__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sc__identity {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .sc__icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
          color: #6b7280;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .sc__heading { min-width: 0; }

        .sc__eyebrow {
          margin-bottom: 4px;
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sc__title {
          margin: 0;
          color: #111827;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.01em;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sc__status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          padding: 4px 9px;
          border: 1px solid;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .sc__status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }

        /* Description */
        .sc__desc {
          margin: 0;
          padding: 12px 20px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.55;
          border-bottom: 1px solid #f3f4f6;
        }

        /* Primary event */
        .sc__event {
          margin: 0 20px;
          padding: 12px 0;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
        }

        .sc__event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }

        .sc__section-label {
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .sc__event-type {
          color: #374151;
          font-size: 11px;
          font-weight: 500;
        }

        .sc__event-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .sc__field-label {
          display: block;
          margin-bottom: 4px;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .sc__field-value {
          display: block;
          overflow: hidden;
          color: #374151;
          font-size: 11px;
          line-height: 1.3;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sc__field-value--mono {
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          color: #111827;
        }

        /* Additional events */
        .sc__events { padding: 12px 20px 0; }

        .sc__event-list { margin-top: 8px; }

        .sc__event-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(90px, auto) auto;
          align-items: center;
          gap: 12px;
          min-height: 32px;
          border-top: 1px solid #f3f4f6;
        }

        .sc__event-row-type {
          overflow: hidden;
          color: #374151;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sc__event-row-target {
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 10px;
        }

        .sc__event-row-dur {
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 10px;
          text-align: right;
        }

        /* Impact */
        .sc__impact {
          display: flex;
          gap: 1px;
          margin-top: 12px;
          background: #f3f4f6;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
        }

        .sc__impact-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
          padding: 12px 20px;
          background: #f9fafb;
        }

        .sc__impact-value {
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          font-variant-numeric: tabular-nums;
        }

        .sc__impact-value small { color: #9ca3af; font-size: 10px; font-weight: 400; }
        .sc__impact-value--pos { color: #15803d; }
        .sc__impact-value--neg { color: #dc2626; }

        /* Footer */
        .sc__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 20px;
        }

        .sc__footer-meta {
          min-width: 0;
          color: #9ca3af;
          font-size: 11px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sc__actions { display: flex; align-items: center; gap: 6px; flex: 0 0 auto; }

        .sc__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 32px;
          padding: 0 12px;
          border-radius: 6px;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.07em;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
        }

        .sc__btn:disabled { cursor: default; opacity: 0.45; }

        .sc__btn--secondary {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .sc__btn--secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .sc__btn--primary {
          background: #111827;
          border: 1px solid #111827;
          color: #ffffff;
        }

        .sc__btn--primary:hover:not(:disabled) {
          background: #1f2937;
          border-color: #1f2937;
        }

        .sc__spinner {
          width: 8px;
          height: 8px;
          border: 1px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: sc-spin 650ms linear infinite;
        }

        @keyframes sc-spin { to { transform: rotate(360deg); } }

        @media (max-width: 700px) {
          .sc__event-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 500px) {
          .sc__header { align-items: flex-start; flex-direction: column; }
          .sc__status { align-self: flex-start; }
          .sc__footer { align-items: flex-start; flex-direction: column; }
          .sc__actions { width: 100%; }
          .sc__btn { flex: 1; }
        }
      `}</style>
    </>
  );
}