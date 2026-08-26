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
  return value
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(hours?: number) {
  if (
    hours === undefined ||
    hours === null
  ) {
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
  const [expandedEvent, setExpandedEvent] =
    useState<number | null>(null);

  const eventCount = events.length;

  const eventSummary = useMemo(() => {
    const machineEvents = events.filter(
      (event) =>
        event.event_type ===
        "MACHINE_BREAKDOWN"
    ).length;

    const operatorEvents = events.filter(
      (event) =>
        event.event_type ===
        "OPERATOR_ABSENCE"
    ).length;

    return {
      machineEvents,
      operatorEvents,
    };
  }, [events]);

  const handleRun = async () => {
    if (
      running ||
      disabled ||
      !onRun
    ) {
      return;
    }

    await onRun();
  };

  return (
    <>
      <div className="scenario-panel">
        <div className="scenario-panel__top">
          <div className="scenario-panel__top-left">
            <div className="scenario-panel__eyebrow">
              SCENARIO CONFIGURATION
            </div>

            <h2 className="scenario-panel__title">
              {name}
            </h2>

            <div className="scenario-panel__id">
              {scenarioId}
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              className="scenario-panel__close"
              onClick={onClose}
              aria-label="Close scenario panel"
            >
              ×
            </button>
          )}
        </div>

        {description && (
          <p className="scenario-panel__description">
            {description}
          </p>
        )}

        <div className="scenario-panel__context">
          <div className="scenario-panel__context-item">
            <span className="scenario-panel__label">
              CURRENT TIME
            </span>

            <span className="scenario-panel__value scenario-panel__value--mono">
              {formatDate(currentTime)}
            </span>
          </div>

          <div className="scenario-panel__context-item">
            <span className="scenario-panel__label">
              ACTIVE SHIFT
            </span>

            <span className="scenario-panel__value">
              {activeShift ?? "—"}
            </span>
          </div>

          <div className="scenario-panel__context-item">
            <span className="scenario-panel__label">
              EVENTS
            </span>

            <span className="scenario-panel__value">
              {eventCount}
            </span>
          </div>
        </div>

        <div className="scenario-panel__summary">
          <div className="scenario-panel__summary-item">
            <span className="scenario-panel__summary-number">
              {eventSummary.machineEvents}
            </span>

            <span className="scenario-panel__summary-label">
              MACHINE EVENTS
            </span>
          </div>

          <div className="scenario-panel__summary-divider" />

          <div className="scenario-panel__summary-item">
            <span className="scenario-panel__summary-number">
              {eventSummary.operatorEvents}
            </span>

            <span className="scenario-panel__summary-label">
              OPERATOR EVENTS
            </span>
          </div>

          <div className="scenario-panel__summary-divider" />

          <div className="scenario-panel__summary-item">
            <span className="scenario-panel__summary-number">
              {eventCount}
            </span>

            <span className="scenario-panel__summary-label">
              TOTAL EVENTS
            </span>
          </div>
        </div>

        <div className="scenario-panel__events-header">
          <div>
            <span className="scenario-panel__section-label">
              EVENT QUEUE
            </span>

            <span className="scenario-panel__event-count">
              {eventCount.toString().padStart(2, "0")}
            </span>
          </div>

          <span className="scenario-panel__constraint">
            HARD CONSTRAINTS
          </span>
        </div>

        <div className="scenario-panel__events">
          {events.length === 0 ? (
            <div className="scenario-panel__empty">
              <span className="scenario-panel__empty-mark">
                —
              </span>

              <span>
                No scenario events configured
              </span>
            </div>
          ) : (
            events.map((event, index) => {
              const expanded =
                expandedEvent === index;

              return (
                <div
                  className={`scenario-panel__event ${
                    expanded
                      ? "scenario-panel__event--expanded"
                      : ""
                  }`}
                  key={`${event.event_type}-${event.target_id}-${index}`}
                >
                  <button
                    type="button"
                    className="scenario-panel__event-main"
                    onClick={() =>
                      setExpandedEvent(
                        expanded
                          ? null
                          : index
                      )
                    }
                  >
                    <div className="scenario-panel__event-number">
                      {(index + 1)
                        .toString()
                        .padStart(2, "0")}
                    </div>

                    <div className="scenario-panel__event-info">
                      <span className="scenario-panel__event-type">
                        {formatEventType(
                          event.event_type
                        )}
                      </span>

                      <span className="scenario-panel__event-target">
                        {event.target_id}
                      </span>
                    </div>

                    <div className="scenario-panel__event-time">
                      <span>
                        {formatDuration(
                          event.duration_hours
                        )}
                      </span>

                      <span>
                        {formatDate(
                          event.start_time
                        )}
                      </span>
                    </div>

                    <span
                      className={`scenario-panel__chevron ${
                        expanded
                          ? "scenario-panel__chevron--open"
                          : ""
                      }`}
                    >
                      ›
                    </span>
                  </button>

                  {expanded && (
                    <div className="scenario-panel__event-details">
                      <div className="scenario-panel__detail">
                        <span className="scenario-panel__label">
                          EVENT TYPE
                        </span>

                        <span className="scenario-panel__detail-value">
                          {formatEventType(
                            event.event_type
                          )}
                        </span>
                      </div>

                      <div className="scenario-panel__detail">
                        <span className="scenario-panel__label">
                          TARGET
                        </span>

                        <span className="scenario-panel__detail-value scenario-panel__detail-value--mono">
                          {event.target_id}
                        </span>
                      </div>

                      <div className="scenario-panel__detail">
                        <span className="scenario-panel__label">
                          START
                        </span>

                        <span className="scenario-panel__detail-value">
                          {formatDate(
                            event.start_time
                          )}
                        </span>
                      </div>

                      <div className="scenario-panel__detail">
                        <span className="scenario-panel__label">
                          DURATION
                        </span>

                        <span className="scenario-panel__detail-value">
                          {formatDuration(
                            event.duration_hours
                          )}
                        </span>
                      </div>

                      <div className="scenario-panel__detail">
                        <span className="scenario-panel__label">
                          IMPACT
                        </span>

                        <span className="scenario-panel__detail-value">
                          {event.impact ??
                            "—"}
                        </span>
                      </div>

                      {event.notes && (
                        <div className="scenario-panel__notes">
                          <span className="scenario-panel__label">
                            NOTES
                          </span>

                          <p>
                            {event.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="scenario-panel__warning">
          <span className="scenario-panel__warning-icon">
            !
          </span>

          <div>
            <strong>
              Replanning will modify the schedule
            </strong>

            <p>
              Completed operations remain locked.
              Unaffected future operations are
              preserved where possible.
            </p>
          </div>
        </div>

        <div className="scenario-panel__footer">
          <div className="scenario-panel__footer-status">
            <span className="scenario-panel__status-dot" />

            <span>
              {running
                ? "OPTIMIZATION RUNNING"
                : "READY TO OPTIMIZE"}
            </span>
          </div>

          <button
            type="button"
            className="scenario-panel__run"
            onClick={handleRun}
            disabled={
              running ||
              disabled ||
              !onRun
            }
          >
            {running ? (
              <>
                <span className="scenario-panel__spinner" />
                OPTIMIZING
              </>
            ) : (
              <>
                RUN REPLANNING
                <span className="scenario-panel__run-arrow">
                  →
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .scenario-panel {
          width: 100%;
          max-width: 760px;

          overflow: hidden;

          background: #0b0c0d;
          border: 1px solid #292d30;
          border-radius: 9px;

          color: #e6e8e7;
          box-shadow:
            0 18px 45px rgba(0, 0, 0, 0.18);
        }

        /* -------------------------
           TOP
           ------------------------- */

        .scenario-panel__top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;

          padding: 21px 21px 16px;

          border-bottom: 1px solid #202326;
        }

        .scenario-panel__top-left {
          min-width: 0;
        }

        .scenario-panel__eyebrow {
          margin-bottom: 8px;

          color: #555c60;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.15em;
        }

        .scenario-panel__title {
          margin: 0;

          color: #e7e9e8;

          font-size: 17px;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .scenario-panel__id {
          margin-top: 6px;

          color: #4f565a;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          letter-spacing: 0.04em;
        }

        .scenario-panel__close {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 27px;
          height: 27px;
          flex: 0 0 27px;

          padding: 0;

          border: 1px solid #292d30;
          border-radius: 5px;

          background: #0e1011;
          color: #686f72;

          font-family: Arial, sans-serif;
          font-size: 17px;
          font-weight: 300;
          line-height: 1;

          cursor: pointer;

          transition:
            color 140ms ease,
            border-color 140ms ease,
            background 140ms ease;
        }

        .scenario-panel__close:hover {
          background: #151718;
          border-color: #3a3e41;
          color: #b5b9b8;
        }

        /* -------------------------
           DESCRIPTION
           ------------------------- */

        .scenario-panel__description {
          margin: 0;
          padding: 15px 21px;

          color: #697073;

          font-size: 10px;
          line-height: 1.55;

          border-bottom: 1px solid #202326;
        }

        /* -------------------------
           CONTEXT
           ------------------------- */

        .scenario-panel__context {
          display: grid;
          grid-template-columns:
            minmax(0, 2fr)
            minmax(100px, 1fr)
            minmax(80px, 0.7fr);

          gap: 1px;

          background: #202326;
          border-bottom: 1px solid #202326;
        }

        .scenario-panel__context-item {
          min-width: 0;
          padding: 12px 17px;

          background: #0e1011;
        }

        .scenario-panel__label {
          display: block;

          margin-bottom: 6px;

          color: #4f565a;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .scenario-panel__value {
          display: block;

          overflow: hidden;

          color: #aeb3b2;

          font-size: 9px;
          font-weight: 500;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scenario-panel__value--mono {
          color: #b9bebd;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;
        }

        /* -------------------------
           SUMMARY
           ------------------------- */

        .scenario-panel__summary {
          display: flex;
          align-items: stretch;

          min-height: 65px;

          border-bottom: 1px solid #202326;
        }

        .scenario-panel__summary-item {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;

          flex: 1;

          padding: 10px 17px;
        }

        .scenario-panel__summary-number {
          color: #d6d9d7;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 15px;
          font-weight: 500;
          line-height: 1;
        }

        .scenario-panel__summary-label {
          color: #4f565a;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .scenario-panel__summary-divider {
          width: 1px;

          margin: 14px 0;

          background: #24282a;
        }

        /* -------------------------
           EVENT HEADER
           ------------------------- */

        .scenario-panel__events-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;

          padding: 15px 21px 10px;
        }

        .scenario-panel__events-header > div {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .scenario-panel__section-label {
          color: #666d70;

          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }

        .scenario-panel__event-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-width: 20px;
          height: 16px;
          padding: 0 5px;

          border: 1px solid #292d30;
          border-radius: 3px;

          color: #747b7d;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
        }

        .scenario-panel__constraint {
          color: #7d8587;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          letter-spacing: 0.08em;
        }

        /* -------------------------
           EVENTS
           ------------------------- */

        .scenario-panel__events {
          padding: 0 21px;
        }

        .scenario-panel__event {
          border-top: 1px solid #1d2022;
        }

        .scenario-panel__event:last-child {
          border-bottom: 1px solid #1d2022;
        }

        .scenario-panel__event-main {
          display: grid;
          grid-template-columns:
            28px
            minmax(0, 1fr)
            minmax(150px, auto)
            16px;

          align-items: center;
          gap: 10px;

          width: 100%;
          min-height: 58px;

          padding: 7px 0;

          border: 0;

          background: transparent;
          color: inherit;

          text-align: left;
          cursor: pointer;
        }

        .scenario-panel__event-main:hover
          .scenario-panel__event-type {
          color: #c0c4c3;
        }

        .scenario-panel__event-number {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 26px;
          height: 26px;

          border: 1px solid #292d30;
          border-radius: 4px;

          color: #52595d;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
        }

        .scenario-panel__event-info {
          display: flex;
          flex-direction: column;
          gap: 5px;

          min-width: 0;
        }

        .scenario-panel__event-type {
          overflow: hidden;

          color: #a8adac;

          font-size: 9px;
          font-weight: 500;

          text-overflow: ellipsis;
          white-space: nowrap;

          transition: color 140ms ease;
        }

        .scenario-panel__event-target {
          color: #5f666a;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

        .scenario-panel__event-time {
          display: flex;
          flex-direction: column;
          gap: 4px;

          text-align: right;
        }

        .scenario-panel__event-time span:first-child {
          color: #9a9f9f;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

        .scenario-panel__event-time span:last-child {
          color: #50575a;

          font-size: 7px;
        }

        .scenario-panel__chevron {
          color: #4c5356;

          font-family: Arial, sans-serif;
          font-size: 17px;
          font-weight: 300;

          transform: rotate(0deg);

          transition:
            transform 140ms ease,
            color 140ms ease;
        }

        .scenario-panel__chevron--open {
          transform: rotate(90deg);
          color: #9ca2a1;
        }

        /* -------------------------
           EVENT DETAILS
           ------------------------- */

        .scenario-panel__event-details {
          display: grid;
          grid-template-columns:
            repeat(5, minmax(0, 1fr));

          gap: 14px;

          padding: 5px 0 15px 38px;
        }

        .scenario-panel__detail {
          min-width: 0;
        }

        .scenario-panel__detail-value {
          display: block;

          color: #969c9d;

          font-size: 8px;
          line-height: 1.35;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scenario-panel__detail-value--mono {
          color: #aeb3b2;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;
        }

        .scenario-panel__notes {
          grid-column: 1 / -1;

          padding-top: 2px;
        }

        .scenario-panel__notes p {
          margin: 0;

          color: #626a6d;

          font-size: 8px;
          line-height: 1.5;
        }

        /* -------------------------
           EMPTY
           ------------------------- */

        .scenario-panel__empty {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          min-height: 80px;

          border-top: 1px solid #1d2022;
          border-bottom: 1px solid #1d2022;

          color: #50575a;

          font-size: 9px;
        }

        .scenario-panel__empty-mark {
          color: #707679;
        }

        /* -------------------------
           WARNING
           ------------------------- */

        .scenario-panel__warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;

          margin: 15px 21px 0;
          padding: 11px 12px;

          background: #111211;
          border: 1px solid #2a2b28;
          border-radius: 5px;
        }

        .scenario-panel__warning-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 17px;
          height: 17px;
          flex: 0 0 17px;

          border: 1px solid #5b5b50;
          border-radius: 50%;

          color: #aaa895;

          font-family:
            Georgia,
            serif;

          font-size: 10px;
        }

        .scenario-panel__warning strong {
          display: block;

          margin-bottom: 4px;

          color: #9b9b8e;

          font-size: 8px;
          font-weight: 600;
        }

        .scenario-panel__warning p {
          margin: 0;

          color: #5f635f;

          font-size: 8px;
          line-height: 1.45;
        }

        /* -------------------------
           FOOTER
           ------------------------- */

        .scenario-panel__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;

          padding: 17px 21px 19px;
        }

        .scenario-panel__footer-status {
          display: flex;
          align-items: center;
          gap: 8px;

          color: #596064;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 600;
          letter-spacing: 0.07em;
        }

        .scenario-panel__status-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;
          background: #87998b;

          box-shadow:
            0 0 0 3px #172019;
        }

        .scenario-panel__run {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;

          min-width: 155px;
          height: 34px;

          padding: 0 14px;

          border: 1px solid #d4d5d0;
          border-radius: 5px;

          background: #d4d5d0;
          color: #111314;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;

          cursor: pointer;

          transition:
            background 140ms ease,
            border-color 140ms ease,
            transform 100ms ease;
        }

        .scenario-panel__run:hover:not(:disabled) {
          background: #e9e9e4;
          border-color: #e9e9e4;
        }

        .scenario-panel__run:active:not(:disabled) {
          transform: translateY(1px);
        }

        .scenario-panel__run:disabled {
          cursor: default;
          opacity: 0.45;
        }

        .scenario-panel__run-arrow {
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 300;
        }

        .scenario-panel__spinner {
          width: 10px;
          height: 10px;

          border: 1px solid #676a68;
          border-top-color: #111314;

          border-radius: 50%;

          animation:
            scenario-panel-spin
            650ms linear infinite;
        }

        @keyframes scenario-panel-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* -------------------------
           RESPONSIVE
           ------------------------- */

        @media (max-width: 700px) {
          .scenario-panel__context {
            grid-template-columns:
              1fr 1fr;
          }

          .scenario-panel__event-main {
            grid-template-columns:
              28px
              minmax(0, 1fr)
              16px;
          }

          .scenario-panel__event-time {
            display: none;
          }

          .scenario-panel__event-details {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            padding-left: 38px;
          }
        }

        @media (max-width: 500px) {
          .scenario-panel__top {
            padding-left: 16px;
            padding-right: 16px;
          }

          .scenario-panel__description {
            padding-left: 16px;
            padding-right: 16px;
          }

          .scenario-panel__context {
            grid-template-columns: 1fr;
          }

          .scenario-panel__summary-item {
            padding-left: 11px;
            padding-right: 11px;
          }

          .scenario-panel__summary-number {
            font-size: 13px;
          }

          .scenario-panel__summary-label {
            font-size: 6px;
          }

          .scenario-panel__events-header {
            padding-left: 16px;
            padding-right: 16px;
          }

          .scenario-panel__events {
            padding-left: 16px;
            padding-right: 16px;
          }

          .scenario-panel__event-details {
            padding-left: 38px;
          }

          .scenario-panel__warning {
            margin-left: 16px;
            margin-right: 16px;
          }

          .scenario-panel__footer {
            align-items: stretch;
            flex-direction: column;
            padding-left: 16px;
            padding-right: 16px;
          }

          .scenario-panel__run {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}