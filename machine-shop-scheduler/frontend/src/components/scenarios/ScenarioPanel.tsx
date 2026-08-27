import { useMemo, useState } from "react";

export interface ScenarioPanelEvent {
  event_type: string;
  target_id: string;
  start_time?: string;
  duration_hours?: number;
  impact?: string;
  notes?: string;
}

export interface ScenarioPanelProps {
  scenarioId: string;
  name: string;
  description?: string;
  currentTime?: string;
  activeShift?: string;
  events: ScenarioPanelEvent[];
  onRun?: () => Promise<void> | void;
  onClose?: () => void;
  running?: boolean;
  disabled?: boolean;
}

function formatEventType(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatDuration(hours?: number) {
  if (hours === undefined || hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (Number.isInteger(hours)) return `${hours} hr`;
  return `${hours.toFixed(1)} hr`;
}

export default function ScenarioPanel({
  scenarioId,
  name,
  description,
  currentTime,
  activeShift,
  events,
  onRun,
  onClose,
  running = false,
  disabled = false,
}: ScenarioPanelProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);

  const eventCount = events.length;

  const eventSummary = useMemo(() => ({
    machineEvents:  events.filter((e) => e.event_type === "MACHINE_BREAKDOWN").length,
    operatorEvents: events.filter((e) => e.event_type === "OPERATOR_ABSENCE").length,
  }), [events]);

  const handleRun = async () => {
    if (running || disabled || !onRun) return;
    await onRun();
  };

  return (
    <>
      <div className="sp">
        {/* Top */}
        <div className="sp__top">
          <div className="sp__top-left">
            <div className="sp__eyebrow">SCENARIO CONFIGURATION</div>
            <h2 className="sp__title">{name}</h2>
            <div className="sp__id">{scenarioId}</div>
          </div>
          {onClose && (
            <button type="button" className="sp__close" onClick={onClose} aria-label="Close">×</button>
          )}
        </div>

        {/* Description */}
        {description && <p className="sp__description">{description}</p>}

        {/* Context row */}
        <div className="sp__context">
          <div className="sp__ctx-item">
            <span className="sp__label">CURRENT TIME</span>
            <span className="sp__value sp__value--mono">{formatDate(currentTime)}</span>
          </div>
          <div className="sp__ctx-item">
            <span className="sp__label">ACTIVE SHIFT</span>
            <span className="sp__value">{activeShift ?? "—"}</span>
          </div>
          <div className="sp__ctx-item">
            <span className="sp__label">EVENTS</span>
            <span className="sp__value">{eventCount}</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="sp__summary">
          <div className="sp__summary-item">
            <span className="sp__summary-num">{eventSummary.machineEvents}</span>
            <span className="sp__summary-label">MACHINE EVENTS</span>
          </div>
          <div className="sp__summary-divider" />
          <div className="sp__summary-item">
            <span className="sp__summary-num">{eventSummary.operatorEvents}</span>
            <span className="sp__summary-label">OPERATOR EVENTS</span>
          </div>
          <div className="sp__summary-divider" />
          <div className="sp__summary-item">
            <span className="sp__summary-num">{eventCount}</span>
            <span className="sp__summary-label">TOTAL EVENTS</span>
          </div>
        </div>

        {/* Event queue header */}
        <div className="sp__events-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sp__section-label">EVENT QUEUE</span>
            <span className="sp__event-count">{String(eventCount).padStart(2, "0")}</span>
          </div>
          <span className="sp__constraint">HARD CONSTRAINTS</span>
        </div>

        {/* Events */}
        <div className="sp__events">
          {events.length === 0 ? (
            <div className="sp__empty">
              <span>—</span>
              <span>No scenario events configured</span>
            </div>
          ) : (
            events.map((event, i) => {
              const expanded = expandedEvent === i;
              return (
                <div
                  key={`${event.event_type}-${event.target_id}-${i}`}
                  className={`sp__event ${expanded ? "sp__event--expanded" : ""}`}
                >
                  <button
                    type="button"
                    className="sp__event-main"
                    onClick={() => setExpandedEvent(expanded ? null : i)}
                  >
                    <div className="sp__event-num">{String(i + 1).padStart(2, "0")}</div>
                    <div className="sp__event-info">
                      <span className="sp__event-type">{formatEventType(event.event_type)}</span>
                      <span className="sp__event-target">{event.target_id}</span>
                    </div>
                    <div className="sp__event-time">
                      <span>{formatDuration(event.duration_hours)}</span>
                      <span>{formatDate(event.start_time)}</span>
                    </div>
                    <span className={`sp__chevron ${expanded ? "sp__chevron--open" : ""}`}>›</span>
                  </button>

                  {expanded && (
                    <div className="sp__event-details">
                      <div className="sp__detail">
                        <span className="sp__label">EVENT TYPE</span>
                        <span className="sp__detail-value">{formatEventType(event.event_type)}</span>
                      </div>
                      <div className="sp__detail">
                        <span className="sp__label">TARGET</span>
                        <span className="sp__detail-value sp__detail-value--mono">{event.target_id}</span>
                      </div>
                      <div className="sp__detail">
                        <span className="sp__label">START</span>
                        <span className="sp__detail-value">{formatDate(event.start_time)}</span>
                      </div>
                      <div className="sp__detail">
                        <span className="sp__label">DURATION</span>
                        <span className="sp__detail-value">{formatDuration(event.duration_hours)}</span>
                      </div>
                      <div className="sp__detail">
                        <span className="sp__label">IMPACT</span>
                        <span className="sp__detail-value">{event.impact ?? "—"}</span>
                      </div>
                      {event.notes && (
                        <div className="sp__detail sp__detail--full">
                          <span className="sp__label">NOTES</span>
                          <p className="sp__notes">{event.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Warning */}
        <div className="sp__warning">
          <span className="sp__warning-icon">!</span>
          <div>
            <strong>Replanning will modify the schedule</strong>
            <p>Completed operations remain locked. Unaffected future operations are preserved where possible.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sp__footer">
          <div className="sp__footer-status">
            <span className="sp__status-dot" />
            <span>{running ? "OPTIMIZATION RUNNING" : "READY TO OPTIMIZE"}</span>
          </div>
          <button
            type="button"
            className="sp__run"
            onClick={handleRun}
            disabled={running || disabled || !onRun}
          >
            {running ? (
              <><span className="sp__spinner" />OPTIMIZING</>
            ) : (
              <>RUN REPLANNING <span className="sp__run-arrow">→</span></>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .sp {
          width: 100%;
          max-width: 760px;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #111827;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }

        /* Top */
        .sp__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sp__top-left { min-width: 0; }

        .sp__eyebrow {
          margin-bottom: 6px;
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .sp__title {
          margin: 0;
          color: #111827;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .sp__id {
          margin-top: 5px;
          color: #d1d5db;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.04em;
        }

        .sp__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          padding: 0;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #f9fafb;
          color: #9ca3af;
          font-size: 18px;
          font-weight: 300;
          line-height: 1;
          cursor: pointer;
          transition: background 140ms, color 140ms, border-color 140ms;
        }

        .sp__close:hover { background: #f3f4f6; color: #374151; border-color: #d1d5db; }

        /* Description */
        .sp__description {
          margin: 0;
          padding: 14px 20px;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.55;
          border-bottom: 1px solid #f3f4f6;
        }

        /* Context */
        .sp__context {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(100px, 1fr) minmax(80px, 0.7fr);
          gap: 1px;
          background: #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
        }

        .sp__ctx-item {
          min-width: 0;
          padding: 12px 16px;
          background: #ffffff;
        }

        .sp__label {
          display: block;
          margin-bottom: 5px;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .sp__value {
          display: block;
          overflow: hidden;
          color: #374151;
          font-size: 11px;
          font-weight: 500;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sp__value--mono {
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          color: #111827;
        }

        /* Summary */
        .sp__summary {
          display: flex;
          align-items: stretch;
          min-height: 64px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sp__summary-item {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          flex: 1;
          padding: 10px 16px;
        }

        .sp__summary-num {
          color: #111827;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 18px;
          font-weight: 600;
          line-height: 1;
        }

        .sp__summary-label {
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .sp__summary-divider {
          width: 1px;
          margin: 14px 0;
          background: #e5e7eb;
        }

        /* Event queue header */
        .sp__events-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 20px 10px;
        }

        .sp__section-label {
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }

        .sp__event-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 18px;
          padding: 0 6px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          color: #6b7280;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          background: #f9fafb;
        }

        .sp__constraint {
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
        }

        /* Events list */
        .sp__events { padding: 0 20px; }

        .sp__event { border-top: 1px solid #f3f4f6; }
        .sp__event:last-child { border-bottom: 1px solid #f3f4f6; }

        .sp__event-main {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) minmax(150px, auto) 16px;
          align-items: center;
          gap: 10px;
          width: 100%;
          min-height: 56px;
          padding: 6px 0;
          border: 0;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: background 120ms;
        }

        .sp__event-main:hover { background: #fafafa; }
        .sp__event-main:hover .sp__event-type { color: #111827; }

        .sp__event-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          background: #f9fafb;
        }

        .sp__event-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .sp__event-type {
          overflow: hidden;
          color: #374151;
          font-size: 12px;
          font-weight: 500;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 140ms;
        }

        .sp__event-target {
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 10px;
        }

        .sp__event-time {
          display: flex;
          flex-direction: column;
          gap: 3px;
          text-align: right;
        }

        .sp__event-time span:first-child {
          color: #374151;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 10px;
          font-weight: 500;
        }

        .sp__event-time span:last-child {
          color: #9ca3af;
          font-size: 9px;
        }

        .sp__chevron {
          color: #d1d5db;
          font-size: 18px;
          font-weight: 300;
          transform: rotate(0deg);
          transition: transform 140ms ease, color 140ms;
        }

        .sp__chevron--open { transform: rotate(90deg); color: #6b7280; }

        /* Event details (expanded) */
        .sp__event-details {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          padding: 4px 0 14px 38px;
        }

        .sp__detail { min-width: 0; }

        .sp__detail--full { grid-column: 1 / -1; }

        .sp__detail-value {
          display: block;
          color: #374151;
          font-size: 11px;
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sp__detail-value--mono {
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          color: #111827;
        }

        .sp__notes {
          margin: 4px 0 0;
          color: #6b7280;
          font-size: 11px;
          line-height: 1.5;
        }

        /* Empty */
        .sp__empty {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 72px;
          border-top: 1px solid #f3f4f6;
          border-bottom: 1px solid #f3f4f6;
          color: #9ca3af;
          font-size: 12px;
        }

        /* Warning */
        .sp__warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 14px 20px 0;
          padding: 12px 14px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 8px;
        }

        .sp__warning-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          flex: 0 0 18px;
          border: 1px solid #f59e0b;
          border-radius: 50%;
          color: #d97706;
          font-size: 11px;
          font-weight: 700;
        }

        .sp__warning strong {
          display: block;
          margin-bottom: 3px;
          color: #92400e;
          font-size: 11px;
          font-weight: 600;
        }

        .sp__warning p {
          margin: 0;
          color: #b45309;
          font-size: 11px;
          line-height: 1.45;
        }

        /* Footer */
        .sp__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px 18px;
        }

        .sp__footer-status {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.07em;
        }

        .sp__status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
        }

        .sp__run {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 155px;
          height: 36px;
          padding: 0 16px;
          border: 1px solid #111827;
          border-radius: 8px;
          background: #111827;
          color: #ffffff;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          cursor: pointer;
          transition: background 140ms, border-color 140ms, transform 100ms;
        }

        .sp__run:hover:not(:disabled) { background: #1f2937; border-color: #1f2937; }
        .sp__run:active:not(:disabled) { transform: translateY(1px); }
        .sp__run:disabled { cursor: default; opacity: 0.45; }

        .sp__run-arrow { font-size: 14px; font-weight: 300; }

        .sp__spinner {
          width: 10px;
          height: 10px;
          border: 1.5px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: sp-spin 650ms linear infinite;
        }

        @keyframes sp-spin { to { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 700px) {
          .sp__context { grid-template-columns: 1fr 1fr; }
          .sp__event-main { grid-template-columns: 28px minmax(0, 1fr) 16px; }
          .sp__event-time { display: none; }
          .sp__event-details { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-left: 38px; }
        }

        @media (max-width: 500px) {
          .sp__top { padding: 16px; }
          .sp__description { padding: 12px 16px; }
          .sp__context { grid-template-columns: 1fr; }
          .sp__events-header { padding-left: 16px; padding-right: 16px; }
          .sp__events { padding: 0 16px; }
          .sp__warning { margin-left: 16px; margin-right: 16px; }
          .sp__footer { align-items: stretch; flex-direction: column; padding: 14px 16px 16px; }
          .sp__run { width: 100%; }
        }
      `}</style>
    </>
  );
}