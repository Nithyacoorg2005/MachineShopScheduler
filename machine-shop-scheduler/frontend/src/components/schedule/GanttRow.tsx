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

  onOperationClick?: (
    operation: GanttRowOperation
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
      return "gantt-row__bar--lathe";

    case "Milling":
      return "gantt-row__bar--milling";

    case "Drill":
      return "gantt-row__bar--drill";

    case "Grinding":
      return "gantt-row__bar--grinding";

    case "Inspection":
      return "gantt-row__bar--inspection";

    default:
      return "gantt-row__bar--default";
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

  if (remainingHours === 0) {
    return `${days}d`;
  }

  return `${days}d ${remainingHours}h`;
}

function getOperationPosition(
  operation: GanttRowOperation,
  timelineStart: number,
  timelineDuration: number
) {
  const start = new Date(
    operation.start_time
  ).getTime();

  const end = new Date(
    operation.end_time
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
    width: `${Math.max(0.15, width)}%`,
  };
}

function getBreakdownPosition(
  breakdown: GanttBreakdown,
  timelineStart: number,
  timelineDuration: number
) {
  const start = new Date(
    breakdown.start_time
  ).getTime();

  const end =
    start +
    breakdown.duration_hours *
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

function formatMachineId(machineId: string) {
  return machineId;
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
  const machineBreakdowns = breakdowns.filter(
    (breakdown) =>
      breakdown.machine_id === machineId
  );

  const sortedOperations = [
    ...operations,
  ].sort(
    (a, b) =>
      new Date(a.start_time).getTime() -
      new Date(b.start_time).getTime()
  );

  return (
    <div className="gantt-row">
      {/* Machine identity */}
      <div className="gantt-row__machine">
        <span className="gantt-row__status" />

        <div className="gantt-row__machine-info">
          <strong>
            {formatMachineId(machineId)}
          </strong>

          <span>
            {sortedOperations.length}{" "}
            {sortedOperations.length === 1
              ? "operation"
              : "operations"}
          </span>
        </div>
      </div>

      {/* Timeline track */}
      <div className="gantt-row__track">
        {/* Timeline grid */}
        {tickRatios.map(
          (ratio, index) => (
            <div
              className="gantt-row__grid-line"
              key={`grid-${index}`}
              style={{
                left: `${ratio * 100}%`,
              }}
            />
          )
        )}

        {/* Machine downtime */}
        {machineBreakdowns.map(
          (breakdown, index) => (
            <div
              className="gantt-row__breakdown"
              key={`${breakdown.machine_id}-${breakdown.start_time}-${index}`}
              style={getBreakdownPosition(
                breakdown,
                timelineStart,
                timelineDuration
              )}
              title={
                breakdown.label ??
                "Machine downtime"
              }
            >
              <span>DOWN</span>
            </div>
          )
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
                type="button"
                key={`${operation.order_id}-${operation.op_seq}`}
                className={[
                  "gantt-row__bar",
                  getOperationClass(
                    operation.operation_type
                  ),
                  selected
                    ? "gantt-row__bar--selected"
                    : "",
                  operation.is_overtime
                    ? "gantt-row__bar--overtime"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={getOperationPosition(
                  operation,
                  timelineStart,
                  timelineDuration
                )}
                onClick={() =>
                  onOperationClick?.(
                    operation
                  )
                }
                aria-label={`${operation.order_id}, operation ${operation.op_seq}, ${operation.operation_type}`}
                title={[
                  operation.order_id,
                  operation.operation_type,
                  operation.machine_id,
                  operation.operator_id,
                  formatDuration(
                    operation.duration_minutes
                  ),
                ].join(" · ")}
              >
                <span className="gantt-row__bar-content">
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
  .gantt-row {
    display: grid;
    grid-template-columns:
      145px minmax(600px, 1fr);

    min-height: 62px;

    border-bottom: 1px solid #1d2022;
  }

  /* -------------------------
     MACHINE
     ------------------------- */

  .gantt-row__machine {
    display: flex;
    align-items: center;
    gap: 9px;

    min-width: 0;

    padding: 0 12px 0 17px;

    border-right: 1px solid #292d30;

    background: #0c0e0f;
  }

  .gantt-row__status {
    width: 5px;
    height: 5px;
    flex: 0 0 5px;

    border-radius: 50%;

    background: #7f9183;

    box-shadow:
      0 0 0 3px #162018;
  }

  .gantt-row__machine-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    min-width: 0;
  }

  .gantt-row__machine-info strong {
    overflow: hidden;

    color: #a5aaa9;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 8px;
    font-weight: 600;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gantt-row__machine-info span {
    color: #4f5659;

    font-size: 7px;

    white-space: nowrap;
  }

  /* -------------------------
     TRACK
     ------------------------- */

  .gantt-row__track {
    position: relative;

    min-width: 600px;

    background:
      linear-gradient(
        to bottom,
        transparent 0%,
        transparent 49%,
        #111416 50%,
        transparent 51%
      );
  }

  .gantt-row__grid-line {
    position: absolute;
    top: 0;
    bottom: 0;

    width: 1px;

    background: #191c1e;

    pointer-events: none;
  }

  /* -------------------------
     OPERATION BAR
     ------------------------- */

  .gantt-row__bar {
    position: absolute;
    top: 15px;

    display: block;

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

    transition:
      filter 120ms ease,
      border-color 120ms ease,
      transform 120ms ease,
      box-shadow 120ms ease;

    z-index: 3;
  }

  .gantt-row__bar:hover {
    filter: brightness(1.18);

    transform:
      translateY(-1px);

    z-index: 6;
  }

  .gantt-row__bar:focus-visible {
    border-color: #aeb5b2;

    box-shadow:
      0 0 0 2px
      rgba(174, 181, 178, 0.14);

    z-index: 7;
  }

  .gantt-row__bar--selected {
    border-color: #c4c8c5 !important;

    box-shadow:
      0 0 0 2px
      rgba(196, 200, 197, 0.12);

    z-index: 7;
  }

  /* -------------------------
     OPERATION TYPES
     ------------------------- */

  .gantt-row__bar--lathe {
    background: #30383c;
    border-color: #4b565b;
  }

  .gantt-row__bar--milling {
    background: #303a32;
    border-color: #4b594d;
  }

  .gantt-row__bar--drill {
    background: #39333c;
    border-color: #554d59;
  }

  .gantt-row__bar--grinding {
    background: #403a31;
    border-color: #5e5548;
  }

  .gantt-row__bar--inspection {
    background: #2c3335;
    border-color: #465054;
  }

  .gantt-row__bar--default {
    background: #303437;
    border-color: #484c4f;
  }

  .gantt-row__bar--overtime {
    border-style: dashed;
  }

  /* -------------------------
     BAR CONTENT
     ------------------------- */

  .gantt-row__bar-content {
    display: flex;
    align-items: center;
    gap: 7px;

    width: 100%;
    height: 100%;

    overflow: hidden;

    white-space: nowrap;
  }

  .gantt-row__bar-content strong {
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

  .gantt-row__bar-content span {
    color: #8f9798;

    font-size: 6px;
    font-weight: 700;

    letter-spacing: 0.05em;
  }

  /* -------------------------
     DOWNTIME
     ------------------------- */

  .gantt-row__breakdown {
    position: absolute;
    top: 0;
    bottom: 0;

    z-index: 2;

    display: flex;
    align-items: flex-start;
    justify-content: center;

    background:
      repeating-linear-gradient(
        135deg,
        rgba(111, 103, 85, 0.19) 0px,
        rgba(111, 103, 85, 0.19) 3px,
        rgba(34, 33, 29, 0.18) 3px,
        rgba(34, 33, 29, 0.18) 6px
      );

    border-left: 1px dashed #625c4f;
    border-right: 1px dashed #625c4f;

    pointer-events: none;
  }

  .gantt-row__breakdown span {
    margin-top: 4px;

    color: #827b6b;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 5px;
    font-weight: 700;

    letter-spacing: 0.08em;
  }

  /* -------------------------
     RESPONSIVE
     ------------------------- */

  @media (max-width: 500px) {
    .gantt-row {
      grid-template-columns:
        115px minmax(600px, 1fr);
    }

    .gantt-row__machine {
      padding-left: 12px;
    }
  }
`;