import React from "react";

export interface OperatorScheduleOperation {
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

interface OperatorBlockProps {
  operatorId: string;
  operatorName?: string;
  shift?: string;
  operations: OperatorScheduleOperation[];

  timelineStart: number;
  timelineDuration: number;

  tickRatios?: number[];

  absent?: boolean;
  absenceStart?: string;
  absenceDurationHours?: number;

  selectedOperation?: OperatorScheduleOperation | null;

  onOperationClick?: (
    operation: OperatorScheduleOperation
  ) => void;
}

const OPERATION_LABELS: Record<string, string> = {
  "CNC Lathe": "LATHE",
  Milling: "MILL",
  Drill: "DRILL",
  Grinding: "GRIND",
  Inspection: "INSPECT",
};

function operationLabel(type: string) {
  return (
    OPERATION_LABELS[type] ??
    type.toUpperCase()
  );
}

function getOperationClass(type: string) {
  switch (type) {
    case "CNC Lathe":
      return "operator-block__bar--lathe";

    case "Milling":
      return "operator-block__bar--milling";

    case "Drill":
      return "operator-block__bar--drill";

    case "Grinding":
      return "operator-block__bar--grinding";

    case "Inspection":
      return "operator-block__bar--inspection";

    default:
      return "operator-block__bar--default";
  }
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = minutes / 60;

  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);

  return remainingHours
    ? `${days}d ${remainingHours}h`
    : `${days}d`;
}

function getPosition(
  startTime: string,
  endTime: string,
  timelineStart: number,
  timelineDuration: number
) {
  const start = new Date(
    startTime
  ).getTime();

  const end = new Date(
    endTime
  ).getTime();

  const left =
    ((start - timelineStart) /
      timelineDuration) *
    100;

  const width =
    ((end - start) /
      timelineDuration) *
    100;

  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(0.2, width)}%`,
  };
}

function getAbsencePosition(
  startTime: string,
  durationHours: number,
  timelineStart: number,
  timelineDuration: number
) {
  const start = new Date(
    startTime
  ).getTime();

  const end =
    start +
    durationHours *
      60 *
      60 *
      1000;

  const left =
    ((start - timelineStart) /
      timelineDuration) *
    100;

  const width =
    ((end - start) /
      timelineDuration) *
    100;

  return {
    left: `${Math.max(0, left)}%`,
    width: `${Math.max(0.2, width)}%`,
  };
}

export default function OperatorBlock({
  operatorId,
  operatorName,
  shift,
  operations,
  timelineStart,
  timelineDuration,
  tickRatios = [],
  absent = false,
  absenceStart,
  absenceDurationHours = 0,
  selectedOperation,
  onOperationClick,
}: OperatorBlockProps) {
  const sortedOperations = [
    ...operations,
  ].sort(
    (a, b) =>
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime()
  );

  const absenceStyle =
    absent &&
    absenceStart &&
    absenceDurationHours > 0
      ? getAbsencePosition(
          absenceStart,
          absenceDurationHours,
          timelineStart,
          timelineDuration
        )
      : undefined;

  return (
    <div
      className={[
        "operator-block",
        absent
          ? "operator-block--absent"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Operator identity */}
      <div className="operator-block__identity">
        <div className="operator-block__avatar">
          {operatorId
            .replace("OP-", "")
            .slice(-2)}
        </div>

        <div className="operator-block__info">
          <div className="operator-block__name">
            <strong>
              {operatorName ??
                operatorId}
            </strong>

            {absent && (
              <span className="operator-block__absence-badge">
                ABSENT
              </span>
            )}
          </div>

          <div className="operator-block__meta">
            <span>{operatorId}</span>

            {shift && (
              <>
                <i />
                <span>
                  SHIFT {shift}
                </span>
              </>
            )}

            <i />

            <span>
              {sortedOperations.length}{" "}
              {sortedOperations.length === 1
                ? "operation"
                : "operations"}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="operator-block__track">
        {/* Grid */}
        {tickRatios.map(
          (ratio, index) => (
            <div
              className="operator-block__grid-line"
              key={`operator-grid-${index}`}
              style={{
                left: `${ratio * 100}%`,
              }}
            />
          )
        )}

        {/* Absence window */}
        {absenceStyle && (
          <div
            className="operator-block__absence"
            style={absenceStyle}
          >
            <div className="operator-block__absence-content">
              <span>OPERATOR ABSENCE</span>
            </div>
          </div>
        )}

        {/* Operations */}
        {sortedOperations.map(
          (operation) => {
            const selected =
              selectedOperation?.order_id ===
                operation.order_id &&
              selectedOperation?.op_seq ===
                operation.op_seq;

            return (
              <button
                key={`${operation.order_id}-${operation.op_seq}`}
                type="button"
                className={[
                  "operator-block__bar",
                  getOperationClass(
                    operation.operation_type
                  ),
                  selected
                    ? "operator-block__bar--selected"
                    : "",
                  operation.is_overtime
                    ? "operator-block__bar--overtime"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={getPosition(
                  operation.start_time,
                  operation.end_time,
                  timelineStart,
                  timelineDuration
                )}
                onClick={() =>
                  onOperationClick?.(
                    operation
                  )
                }
                title={[
                  operation.order_id,
                  operation.operation_type,
                  operation.machine_id,
                  formatDuration(
                    operation.duration_minutes
                  ),
                ].join(" · ")}
              >
                <span className="operator-block__bar-content">
                  <strong>
                    {operation.order_id}
                  </strong>

                  <span>
                    {operationLabel(
                      operation.operation_type
                    )}
                  </span>
                </span>
              </button>
            );
          }
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .operator-block {
    display: grid;
    grid-template-columns:
      220px minmax(600px, 1fr);

    min-height: 72px;

    border-bottom: 1px solid #1d2022;

    background: #0b0c0d;
  }

  /* -------------------------
     IDENTITY
     ------------------------- */

  .operator-block__identity {
    display: flex;
    align-items: center;
    gap: 10px;

    min-width: 0;

    padding: 0 15px;

    background: #0d0f10;

    border-right: 1px solid #292d30;
  }

  .operator-block__avatar {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 29px;
    height: 29px;
    flex: 0 0 29px;

    border: 1px solid #303538;
    border-radius: 5px;

    background: #121516;
    color: #737a7d;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 7px;
    font-weight: 600;
  }

  .operator-block__info {
    min-width: 0;
  }

  .operator-block__name {
    display: flex;
    align-items: center;
    gap: 7px;

    min-width: 0;
  }

  .operator-block__name strong {
    overflow: hidden;

    color: #aeb3b2;

    font-size: 9px;
    font-weight: 500;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .operator-block__absence-badge {
    flex: 0 0 auto;

    padding: 3px 5px;

    border: 1px solid #4a4137;
    border-radius: 3px;

    background: #171411;
    color: #9a8977;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 5px;
    font-weight: 700;

    letter-spacing: 0.08em;
  }

  .operator-block__meta {
    display: flex;
    align-items: center;
    gap: 6px;

    margin-top: 5px;

    color: #50575a;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 6px;
  }

  .operator-block__meta i {
    width: 2px;
    height: 2px;

    border-radius: 50%;

    background: #454b4e;
  }

  /* -------------------------
     TRACK
     ------------------------- */

  .operator-block__track {
    position: relative;

    min-width: 600px;

    overflow: hidden;

    background:
      linear-gradient(
        to bottom,
        transparent 0%,
        transparent 49%,
        #111416 50%,
        transparent 51%
      );
  }

  .operator-block__grid-line {
    position: absolute;
    top: 0;
    bottom: 0;

    width: 1px;

    background: #191c1e;

    pointer-events: none;
  }

  /* -------------------------
     ABSENCE
     ------------------------- */

  .operator-block__absence {
    position: absolute;
    top: 0;
    bottom: 0;

    z-index: 2;

    display: flex;
    justify-content: center;

    background:
      repeating-linear-gradient(
        135deg,
        rgba(105, 92, 76, 0.16) 0px,
        rgba(105, 92, 76, 0.16) 3px,
        rgba(35, 31, 27, 0.16) 3px,
        rgba(35, 31, 27, 0.16) 6px
      );

    border-left: 1px dashed #5d554a;
    border-right: 1px dashed #5d554a;

    pointer-events: none;
  }

  .operator-block__absence-content {
    padding-top: 7px;

    color: #756b5e;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 5px;
    font-weight: 700;

    letter-spacing: 0.08em;

    white-space: nowrap;
  }

  /* -------------------------
     OPERATION BAR
     ------------------------- */

  .operator-block__bar {
    position: absolute;
    top: 19px;

    height: 31px;
    min-width: 4px;

    padding: 0 7px;

    overflow: hidden;

    border: 1px solid transparent;
    border-radius: 4px;

    outline: none;

    color: #d1d4d2;

    text-align: left;

    cursor: pointer;

    z-index: 3;

    transition:
      filter 120ms ease,
      transform 120ms ease,
      border-color 120ms ease,
      box-shadow 120ms ease;
  }

  .operator-block__bar:hover {
    filter: brightness(1.18);

    transform:
      translateY(-1px);

    z-index: 6;
  }

  .operator-block__bar:focus-visible {
    border-color: #aeb5b2;

    box-shadow:
      0 0 0 2px
      rgba(174, 181, 178, 0.14);

    z-index: 7;
  }

  .operator-block__bar--selected {
    border-color: #c4c8c5 !important;

    box-shadow:
      0 0 0 2px
      rgba(196, 200, 197, 0.12);

    z-index: 7;
  }

  /* -------------------------
     TYPES
     ------------------------- */

  .operator-block__bar--lathe {
    background: #30383c;
    border-color: #4b565b;
  }

  .operator-block__bar--milling {
    background: #303a32;
    border-color: #4b594d;
  }

  .operator-block__bar--drill {
    background: #39333c;
    border-color: #554d59;
  }

  .operator-block__bar--grinding {
    background: #403a31;
    border-color: #5e5548;
  }

  .operator-block__bar--inspection {
    background: #2c3335;
    border-color: #465054;
  }

  .operator-block__bar--default {
    background: #303437;
    border-color: #484c4f;
  }

  .operator-block__bar--overtime {
    border-style: dashed;
  }

  /* -------------------------
     BAR CONTENT
     ------------------------- */

  .operator-block__bar-content {
    display: flex;
    align-items: center;
    gap: 7px;

    width: 100%;
    height: 100%;

    overflow: hidden;

    white-space: nowrap;
  }

  .operator-block__bar-content strong {
    overflow: hidden;

    color: #d2d5d3;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 7px;
    font-weight: 600;

    text-overflow: ellipsis;
  }

  .operator-block__bar-content span {
    color: #8f9798;

    font-size: 6px;
    font-weight: 700;

    letter-spacing: 0.05em;
  }

  /* -------------------------
     ABSENT ROW
     ------------------------- */

  .operator-block--absent
    .operator-block__status {
    background: #897968;

    box-shadow:
      0 0 0 3px #211b16;
  }

  .operator-block--absent
    .operator-block__avatar {
    border-color: #403a34;
    color: #8a7c6d;
  }

  /* -------------------------
     RESPONSIVE
     ------------------------- */

  @media (max-width: 650px) {
    .operator-block {
      grid-template-columns:
        165px minmax(600px, 1fr);
    }

    .operator-block__identity {
      padding-left: 11px;
      padding-right: 11px;
    }

    .operator-block__avatar {
      width: 25px;
      height: 25px;
      flex-basis: 25px;
    }
  }
`;