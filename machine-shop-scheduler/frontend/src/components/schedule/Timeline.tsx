import React, { useMemo } from "react";

export interface TimelineTick {
  ratio: number;
  time: number;
}

interface TimelineProps {
  startTime: string | number;
  endTime: string | number;

  tickCount?: number;

  /** Width of the left label column. */
  labelWidth?: number;

  /** Used when the timeline is zoomed. */
  zoom?: number;

  /** Optional title shown in the left header. */
  label?: string;

  /** Optional callback when a tick is clicked. */
  onTickClick?: (tick: TimelineTick) => void;

  /**
   * Render the timeline axis without the left
   * label column.
   */
  compact?: boolean;
}

function parseTime(value: string | number) {
  if (typeof value === "number") {
    return value;
  }

  return new Date(value).getTime();
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildTicks(
  start: number,
  end: number,
  count: number
): TimelineTick[] {
  const duration = end - start;

  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return [];
  }

  const safeCount = Math.max(
    2,
    Math.min(24, Math.round(count))
  );

  return Array.from(
    { length: safeCount + 1 },
    (_, index) => {
      const ratio =
        index / safeCount;

      return {
        ratio,
        time:
          start +
          duration * ratio,
      };
    }
  );
}

export default function Timeline({
  startTime,
  endTime,
  tickCount = 8,
  labelWidth = 145,
  zoom = 1,
  label = "TIMELINE",
  onTickClick,
  compact = false,
}: TimelineProps) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const validRange =
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end > start;

  const ticks = useMemo(
    () =>
      validRange
        ? buildTicks(
            start,
            end,
            tickCount
          )
        : [],
    [
      start,
      end,
      tickCount,
      validRange,
    ]
  );

  const durationHours = validRange
    ? (end - start) /
      (1000 * 60 * 60)
    : 0;

  const displayWidth = Math.max(
    100,
    100 * zoom
  );

  if (!validRange) {
    return (
      <>
        <div className="timeline timeline--invalid">
          <span>
            Invalid timeline range
          </span>
        </div>

        <style>{styles}</style>
      </>
    );
  }

  return (
    <>
      <div
        className={[
          "timeline",
          compact
            ? "timeline--compact"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="timeline__inner"
          style={{
            minWidth: `${displayWidth}%`,
          }}
        >
          <div
            className="timeline__axis"
            style={{
              gridTemplateColumns: `${labelWidth}px minmax(600px, 1fr)`,
            }}
          >
            {/* Left label */}
            <div className="timeline__label">
              {label}
            </div>

            {/* Time axis */}
            <div className="timeline__track">
              {ticks.map(
                (tick, index) => {
                  const first =
                    index === 0;

                  const last =
                    index ===
                    ticks.length - 1;

                  return (
                    <button
                      type="button"
                      key={`${tick.time}-${index}`}
                      className={[
                        "timeline__tick",
                        first
                          ? "timeline__tick--first"
                          : "",
                        last
                          ? "timeline__tick--last"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{
                        left: `${
                          tick.ratio * 100
                        }%`,
                      }}
                      onClick={() =>
                        onTickClick?.(
                          tick
                        )
                      }
                      title={new Date(
                        tick.time
                      ).toLocaleString(
                        "en-IN",
                        {
                          dateStyle:
                            "medium",
                          timeStyle:
                            "short",
                        }
                      )}
                    >
                      <span>
                        {formatDate(
                          tick.time
                        )}
                      </span>

                      <small>
                        {formatTime(
                          tick.time
                        )}
                      </small>
                    </button>
                  );
                }
              )}

              {/* Start / end range */}
              <div className="timeline__range">
                <span>
                  {formatDate(start)}
                </span>

                <i />

                <span>
                  {formatDate(end)}
                </span>

                <b>
                  {formatDuration(
                    durationHours
                  )}
                </b>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{styles}</style>
    </>
  );
}

function formatDuration(hours: number) {
  if (hours < 1) {
    return `${Math.round(
      hours * 60
    )}m`;
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  const days = Math.floor(
    hours / 24
  );

  const remainingHours =
    Math.round(hours % 24);

  if (remainingHours === 0) {
    return `${days}d`;
  }

  return `${days}d ${remainingHours}h`;
}

const styles = `
  .timeline {
    width: 100%;

    overflow: hidden;

    background: #0b0c0d;

    border-bottom: 1px solid #292d30;

    color: #737a7d;

    box-sizing: border-box;
  }

  .timeline__inner {
    position: relative;

    width: 100%;
  }

  .timeline__axis {
    display: grid;

    height: 50px;

    width: 100%;
  }

  /* -------------------------
     LABEL
     ------------------------- */

  .timeline__label {
    display: flex;
    align-items: center;

    padding-left: 17px;

    border-right: 1px solid #292d30;

    color: #4f565a;

    font-size: 7px;
    font-weight: 700;

    letter-spacing: 0.12em;

    user-select: none;
  }

  /* -------------------------
     TRACK
     ------------------------- */

  .timeline__track {
    position: relative;

    min-width: 600px;

    overflow: hidden;
  }

  /* -------------------------
     TICKS
     ------------------------- */

  .timeline__tick {
    position: absolute;
    top: 0;
    bottom: 0;

    width: 1px;

    padding: 0;

    border: 0;

    border-left: 1px solid #222628;

    outline: none;

    background: transparent;

    transform: translateX(-50%);

    cursor: pointer;

    text-align: left;

    z-index: 2;
  }

  .timeline__tick:hover {
    border-left-color: #464d50;
  }

  .timeline__tick:focus-visible {
    border-left-color: #8c9394;
  }

  .timeline__tick span {
    display: block;

    margin: 8px 0 0 6px;

    color: #656c6f;

    font-size: 7px;
    font-weight: 600;

    white-space: nowrap;
  }

  .timeline__tick small {
    display: block;

    margin: 3px 0 0 6px;

    color: #444b4e;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 6px;

    white-space: nowrap;
  }

  .timeline__tick--first {
    transform: none;
  }

  .timeline__tick--first span,
  .timeline__tick--first small {
    margin-left: 0;
  }

  .timeline__tick--last {
    transform: translateX(-100%);
  }

  /* -------------------------
     RANGE
     ------------------------- */

  .timeline__range {
    position: absolute;
    right: 8px;
    bottom: 5px;

    display: flex;
    align-items: center;
    gap: 5px;

    color: #3f4649;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 5px;

    pointer-events: none;
  }

  .timeline__range i {
    width: 2px;
    height: 2px;

    border-radius: 50%;

    background: #41484b;
  }

  .timeline__range b {
    margin-left: 4px;

    color: #50575a;

    font-weight: 500;
  }

  /* -------------------------
     COMPACT
     ------------------------- */

  .timeline--compact
    .timeline__axis {
    height: 40px;
  }

  .timeline--compact
    .timeline__tick span {
    margin-top: 6px;
  }

  .timeline--compact
    .timeline__tick small {
    margin-top: 2px;
  }

  .timeline--compact
    .timeline__range {
    display: none;
  }

  /* -------------------------
     INVALID
     ------------------------- */

  .timeline--invalid {
    display: flex;
    align-items: center;

    min-height: 50px;

    padding: 0 16px;

    color: #695e55;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 7px;
  }

  /* -------------------------
     RESPONSIVE
     ------------------------- */

  @media (max-width: 600px) {
    .timeline__label {
      padding-left: 12px;
    }
  }
`;