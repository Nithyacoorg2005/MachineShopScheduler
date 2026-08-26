import type { ReactNode } from "react";

export type ScenarioStatus =
  | "ready"
  | "active"
  | "completed"
  | "failed";

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

const statusConfig: Record<
  ScenarioStatus,
  {
    label: string;
    className: string;
  }
> = {
  ready: {
    label: "READY",
    className: "scenario-card__status--ready",
  },
  active: {
    label: "ACTIVE",
    className: "scenario-card__status--active",
  },
  completed: {
    label: "COMPLETED",
    className: "scenario-card__status--completed",
  },
  failed: {
    label: "FAILED",
    className: "scenario-card__status--failed",
  },
};

function formatEventType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(hours?: number) {
  if (hours === undefined || hours === null) {
    return "—";
  }

  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }

  if (Number.isInteger(hours)) {
    return `${hours} hr`;
  }

  return `${hours.toFixed(1)} hr`;
}

function formatCost(value?: number) {
  if (value === undefined || value === null) {
    return "—";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}₹${Math.abs(value).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
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
  const statusInfo = statusConfig[status];

  const primaryEvent = events[0];

  const isRunnable =
    status === "ready" && !running;

  return (
    <>
      <article className="scenario-card">
        <header className="scenario-card__header">
          <div className="scenario-card__identity">
            <div className="scenario-card__icon">
              {icon ?? "SC"}
            </div>

            <div className="scenario-card__heading">
              <div className="scenario-card__eyebrow">
                {scenarioId ?? "SCENARIO"}
              </div>

              <h3 className="scenario-card__title">
                {name}
              </h3>
            </div>
          </div>

          <div
            className={`scenario-card__status ${statusInfo.className}`}
          >
            <span className="scenario-card__status-dot" />
            {running ? "RUNNING" : statusInfo.label}
          </div>
        </header>

        {description && (
          <p className="scenario-card__description">
            {description}
          </p>
        )}

        {primaryEvent && (
          <div className="scenario-card__event">
            <div className="scenario-card__event-header">
              <span className="scenario-card__section-label">
                EVENT
              </span>

              <span className="scenario-card__event-type">
                {formatEventType(
                  primaryEvent.event_type
                )}
              </span>
            </div>

            <div className="scenario-card__event-grid">
              <div>
                <span className="scenario-card__field-label">
                  TARGET
                </span>

                <span className="scenario-card__field-value scenario-card__field-value--mono">
                  {primaryEvent.target_id}
                </span>
              </div>

              <div>
                <span className="scenario-card__field-label">
                  START
                </span>

                <span className="scenario-card__field-value">
                  {formatDate(
                    primaryEvent.start_time
                  )}
                </span>
              </div>

              <div>
                <span className="scenario-card__field-label">
                  DURATION
                </span>

                <span className="scenario-card__field-value">
                  {formatDuration(
                    primaryEvent.duration_hours
                  )}
                </span>
              </div>

              <div>
                <span className="scenario-card__field-label">
                  IMPACT
                </span>

                <span className="scenario-card__field-value">
                  {primaryEvent.impact ?? "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {events.length > 1 && (
          <div className="scenario-card__events">
            <span className="scenario-card__section-label">
              {events.length} EVENTS
            </span>

            <div className="scenario-card__event-list">
              {events.slice(1).map((event, index) => (
                <div
                  className="scenario-card__event-row"
                  key={`${event.event_type}-${event.target_id}-${index}`}
                >
                  <span className="scenario-card__event-row-type">
                    {formatEventType(
                      event.event_type
                    )}
                  </span>

                  <span className="scenario-card__event-row-target">
                    {event.target_id}
                  </span>

                  <span className="scenario-card__event-row-duration">
                    {formatDuration(
                      event.duration_hours
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(affectedOperations !== undefined ||
          costImpact !== undefined) && (
          <div className="scenario-card__impact">
            {affectedOperations !== undefined && (
              <div className="scenario-card__impact-item">
                <span className="scenario-card__field-label">
                  AFFECTED
                </span>

                <span className="scenario-card__impact-value">
                  {affectedOperations}
                  <small> ops</small>
                </span>
              </div>
            )}

            {costImpact !== undefined && (
              <div className="scenario-card__impact-item">
                <span className="scenario-card__field-label">
                  COST IMPACT
                </span>

                <span
                  className={`scenario-card__impact-value ${
                    costImpact > 0
                      ? "scenario-card__impact-value--negative"
                      : costImpact < 0
                        ? "scenario-card__impact-value--positive"
                        : ""
                  }`}
                >
                  {formatCost(costImpact)}
                </span>
              </div>
            )}
          </div>
        )}

        <footer className="scenario-card__footer">
          <div className="scenario-card__footer-meta">
            {events.length > 0 ? (
              <span>
                {events.length}{" "}
                {events.length === 1
                  ? "event"
                  : "events"}{" "}
                configured
              </span>
            ) : (
              <span>No events configured</span>
            )}
          </div>

          <div className="scenario-card__actions">
            {onView && (
              <button
                type="button"
                className="scenario-card__button scenario-card__button--secondary"
                onClick={onView}
              >
                VIEW
              </button>
            )}

            {onRun && (
              <button
                type="button"
                className="scenario-card__button scenario-card__button--primary"
                onClick={onRun}
                disabled={!isRunnable}
              >
                {running ? (
                  <>
                    <span className="scenario-card__spinner" />
                    RUNNING
                  </>
                ) : (
                  "RUN SCENARIO"
                )}
              </button>
            )}
          </div>
        </footer>
      </article>

      <style>{`
        .scenario-card {
          width: 100%;
          overflow: hidden;

          background: #0b0c0d;
          border: 1px solid #25282b;
          border-radius: 9px;

          color: #e7e9e8;

          transition:
            border-color 160ms ease,
            background 160ms ease;
        }

        .scenario-card:hover {
          background: #0d0f10;
          border-color: #303437;
        }

        /* -------------------------
           HEADER
           ------------------------- */

        .scenario-card__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;

          padding: 18px 19px 15px;

          border-bottom: 1px solid #202326;
        }

        .scenario-card__identity {
          display: flex;
          align-items: center;
          gap: 11px;

          min-width: 0;
        }

        .scenario-card__icon {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 31px;
          height: 31px;
          flex: 0 0 31px;

          border: 1px solid #34383a;
          border-radius: 5px;

          background: #101213;

          color: #8a9092;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .scenario-card__heading {
          min-width: 0;
        }

        .scenario-card__eyebrow {
          margin-bottom: 5px;

          color: #555c60;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 600;
          letter-spacing: 0.1em;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scenario-card__title {
          margin: 0;

          overflow: hidden;

          color: #e6e8e7;

          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.01em;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* -------------------------
           STATUS
           ------------------------- */

        .scenario-card__status {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          flex: 0 0 auto;

          padding: 5px 8px;

          border: 1px solid;
          border-radius: 4px;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .scenario-card__status-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: currentColor;
        }

        .scenario-card__status--ready {
          color: #8b9192;
          border-color: #303437;
        }

        .scenario-card__status--active {
          color: #c5a568;
          border-color: #423822;
        }

        .scenario-card__status--completed {
          color: #8eaa97;
          border-color: #29372e;
        }

        .scenario-card__status--failed {
          color: #c9827b;
          border-color: #402b29;
        }

        /* -------------------------
           DESCRIPTION
           ------------------------- */

        .scenario-card__description {
          margin: 0;
          padding: 14px 19px;

          color: #656c70;

          font-size: 10px;
          line-height: 1.55;
        }

        /* -------------------------
           EVENT
           ------------------------- */

        .scenario-card__event {
          margin: 0 19px;

          padding: 13px 0;

          border-top: 1px solid #1e2123;
          border-bottom: 1px solid #1e2123;
        }

        .scenario-card__event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;

          margin-bottom: 13px;
        }

        .scenario-card__section-label {
          color: #555c60;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .scenario-card__event-type {
          color: #979d9e;

          font-size: 8px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        .scenario-card__event-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .scenario-card__event-grid > div {
          min-width: 0;
        }

        .scenario-card__field-label {
          display: block;

          margin-bottom: 6px;

          color: #4f565a;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .scenario-card__field-value {
          display: block;

          overflow: hidden;

          color: #afb4b3;

          font-size: 9px;
          line-height: 1.3;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scenario-card__field-value--mono {
          color: #c2c6c5;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;
        }

        /* -------------------------
           MULTIPLE EVENTS
           ------------------------- */

        .scenario-card__events {
          padding: 13px 19px 0;
        }

        .scenario-card__event-list {
          margin-top: 9px;
        }

        .scenario-card__event-row {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(90px, auto)
            auto;
          align-items: center;
          gap: 12px;

          min-height: 31px;

          border-top: 1px solid #1b1e20;
        }

        .scenario-card__event-row-type {
          overflow: hidden;

          color: #8b9192;

          font-size: 8px;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scenario-card__event-row-target {
          color: #676e72;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

        .scenario-card__event-row-duration {
          color: #696f73;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          text-align: right;
        }

        /* -------------------------
           IMPACT
           ------------------------- */

        .scenario-card__impact {
          display: flex;
          gap: 1px;

          margin-top: 14px;

          background: #202326;
          border-top: 1px solid #202326;
          border-bottom: 1px solid #202326;
        }

        .scenario-card__impact-item {
          display: flex;
          flex-direction: column;
          gap: 6px;

          flex: 1;

          padding: 11px 19px;

          background: #0e1011;
        }

        .scenario-card__impact-value {
          color: #d4d7d5;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 13px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        .scenario-card__impact-value small {
          color: #646b6e;
          font-size: 8px;
          font-weight: 400;
        }

        .scenario-card__impact-value--positive {
          color: #8fac99;
        }

        .scenario-card__impact-value--negative {
          color: #c9857e;
        }

        /* -------------------------
           FOOTER
           ------------------------- */

        .scenario-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;

          padding: 13px 19px;
        }

        .scenario-card__footer-meta {
          min-width: 0;

          color: #4f565a;

          font-size: 8px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scenario-card__actions {
          display: flex;
          align-items: center;
          gap: 7px;

          flex: 0 0 auto;
        }

        .scenario-card__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          height: 29px;

          padding: 0 10px;

          border-radius: 4px;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.08em;

          cursor: pointer;

          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease;
        }

        .scenario-card__button:disabled {
          cursor: default;
          opacity: 0.45;
        }

        .scenario-card__button--secondary {
          background: #0e1011;
          border: 1px solid #292d30;
          color: #777e81;
        }

        .scenario-card__button--secondary:hover {
          background: #141618;
          border-color: #383d40;
          color: #b0b5b4;
        }

        .scenario-card__button--primary {
          background: #d5d6d1;
          border: 1px solid #d5d6d1;
          color: #111314;
        }

        .scenario-card__button--primary:hover:not(:disabled) {
          background: #ecece7;
          border-color: #ecece7;
        }

        .scenario-card__spinner {
          width: 8px;
          height: 8px;

          border: 1px solid #555;
          border-top-color: #111;

          border-radius: 50%;

          animation: scenario-card-spin 650ms linear infinite;
        }

        @keyframes scenario-card-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* -------------------------
           RESPONSIVE
           ------------------------- */

        @media (max-width: 700px) {
          .scenario-card__event-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 500px) {
          .scenario-card__header {
            align-items: flex-start;
            flex-direction: column;
          }

          .scenario-card__status {
            align-self: flex-start;
          }

          .scenario-card__event-grid {
            grid-template-columns: 1fr 1fr;
          }

          .scenario-card__footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .scenario-card__actions {
            width: 100%;
          }

          .scenario-card__button {
            flex: 1;
          }
        }

        @media (max-width: 360px) {
          .scenario-card__event-grid {
            grid-template-columns: 1fr;
          }

          .scenario-card__event-row {
            grid-template-columns:
              1fr auto;
          }

          .scenario-card__event-row-duration {
            display: none;
          }
        }
      `}</style>
    </>
  );
}