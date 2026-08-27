import React, { useMemo } from "react";

export interface TimelineTick {
  ratio: number;
  time: number;
}

interface TimelineProps {
  startTime: string | number;
  endTime: string | number;
  tickCount?: number;
  labelWidth?: number;
  zoom?: number;
  label?: string;
  onTickClick?: (tick: TimelineTick) => void;
  compact?: boolean;
}

function parseTime(value: string | number) {
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(hours: number) {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours % 24);
  return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
}

function buildTicks(start: number, end: number, count: number): TimelineTick[] {
  const duration = end - start;
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const safeCount = Math.max(2, Math.min(24, Math.round(count)));
  return Array.from({ length: safeCount + 1 }, (_, i) => {
    const ratio = i / safeCount;
    return { ratio, time: start + duration * ratio };
  });
}

export default function Timeline({
  startTime,
  endTime,
  tickCount = 8,
  labelWidth = 160,
  zoom = 1,
  label = "MACHINE",
  onTickClick,
  compact = false,
}: TimelineProps) {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const validRange = Number.isFinite(start) && Number.isFinite(end) && end > start;

  const ticks = useMemo(
    () => (validRange ? buildTicks(start, end, tickCount) : []),
    [start, end, tickCount, validRange]
  );

  const durationHours = validRange ? (end - start) / (1000 * 60 * 60) : 0;
  const displayWidth = Math.max(100, 100 * zoom);

  if (!validRange) {
    return (
      <>
        <div className="tl tl--invalid"><span>Invalid timeline range</span></div>
        <style>{styles}</style>
      </>
    );
  }

  return (
    <>
      <div className={["tl", compact ? "tl--compact" : ""].filter(Boolean).join(" ")}>
        <div className="tl__inner" style={{ minWidth: `${displayWidth}%` }}>
          <div
            className="tl__axis"
            style={{ gridTemplateColumns: `${labelWidth}px minmax(600px, 1fr)` }}
          >
            <div className="tl__label">{label}</div>

            <div className="tl__track">
              {ticks.map((tick, i) => {
                const first = i === 0;
                const last = i === ticks.length - 1;
                return (
                  <button
                    type="button"
                    key={`${tick.time}-${i}`}
                    className={[
                      "tl__tick",
                      first ? "tl__tick--first" : "",
                      last ? "tl__tick--last" : "",
                    ].filter(Boolean).join(" ")}
                    style={{ left: `${tick.ratio * 100}%` }}
                    onClick={() => onTickClick?.(tick)}
                    title={new Date(tick.time).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  >
                    <span>{formatDate(tick.time)}</span>
                    <small>{formatTime(tick.time)}</small>
                  </button>
                );
              })}

              <div className="tl__range">
                <span>{formatDate(start)}</span>
                <i />
                <span>{formatDate(end)}</span>
                <b>{formatDuration(durationHours)}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .tl {
    width: 100%;
    overflow: hidden;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    color: #6b7280;
    box-sizing: border-box;
  }

  .tl__inner {
    position: relative;
    width: 100%;
  }

  .tl__axis {
    display: grid;
    height: 52px;
    width: 100%;
  }

  .tl__label {
    display: flex;
    align-items: center;
    padding-left: 20px;
    border-right: 1px solid #e5e7eb;
    color: #9ca3af;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    user-select: none;
    background: #f9fafb;
  }

  .tl__track {
    position: relative;
    min-width: 600px;
    overflow: hidden;
    background: #f9fafb;
  }

  .tl__tick {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    padding: 0;
    border: 0;
    border-left: 1px solid #e5e7eb;
    outline: none;
    background: transparent;
    transform: translateX(-50%);
    cursor: pointer;
    text-align: left;
    z-index: 2;
  }

  .tl__tick:hover { border-left-color: #d1d5db; }
  .tl__tick:focus-visible { border-left-color: #6b7280; }

  .tl__tick span {
    display: block;
    margin: 9px 0 0 7px;
    color: #6b7280;
    font-size: 9px;
    font-weight: 600;
    white-space: nowrap;
  }

  .tl__tick small {
    display: block;
    margin: 3px 0 0 7px;
    color: #9ca3af;
    font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
    font-size: 8px;
    white-space: nowrap;
  }

  .tl__tick--first { transform: none; }
  .tl__tick--first span,
  .tl__tick--first small { margin-left: 0; }
  .tl__tick--last { transform: translateX(-100%); }

  .tl__range {
    position: absolute;
    right: 10px;
    bottom: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
    color: #d1d5db;
    font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
    font-size: 8px;
    pointer-events: none;
  }

  .tl__range i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #d1d5db;
  }

  .tl__range b {
    margin-left: 4px;
    color: #9ca3af;
    font-weight: 500;
  }

  .tl--compact .tl__axis { height: 42px; }
  .tl--compact .tl__tick span { margin-top: 7px; }
  .tl--compact .tl__tick small { margin-top: 2px; }
  .tl--compact .tl__range { display: none; }

  .tl--invalid {
    display: flex;
    align-items: center;
    min-height: 52px;
    padding: 0 20px;
    color: #9ca3af;
    font-size: 11px;
    background: #f9fafb;
  }
`;