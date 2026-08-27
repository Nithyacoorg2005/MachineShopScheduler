import React from "react";

export type ScheduleLegendItem = {
  label: string;
  description?: string;
  className: string;
};

interface ScheduleLegendProps {
  showMachines?: boolean;
  showOperators?: boolean;
  showDowntime?: boolean;
  showOvertime?: boolean;
  compact?: boolean;
  items?: ScheduleLegendItem[];
}

const DEFAULT_ITEMS: ScheduleLegendItem[] = [
  { label: "Lathe",      description: "CNC turning",        className: "sl__dot--lathe" },
  { label: "Milling",    description: "Milling operation",  className: "sl__dot--milling" },
  { label: "Drill",      description: "Drilling operation", className: "sl__dot--drill" },
  { label: "Grinding",   description: "Grinding operation", className: "sl__dot--grinding" },
  { label: "Inspection", description: "Quality check",      className: "sl__dot--inspection" },
];

export default function ScheduleLegend({
  showMachines = false,
  showOperators = false,
  showDowntime = true,
  showOvertime = true,
  compact = false,
  items = DEFAULT_ITEMS,
}: ScheduleLegendProps) {
  const visible = [
    ...items,
    ...(showDowntime ? [{ label: "Downtime", description: "Blocked capacity", className: "sl__dot--downtime" }] : []),
    ...(showOvertime ? [{ label: "Overtime", description: "Outside regular shift", className: "sl__dot--overtime" }] : []),
    ...(showMachines  ? [{ label: "Available", description: "Machine available",  className: "sl__dot--available" }] : []),
    ...(showOperators ? [{ label: "Operator",  description: "Operator available", className: "sl__dot--operator" }] : []),
  ];

  return (
    <>
      <div className={["sl", compact ? "sl--compact" : ""].filter(Boolean).join(" ")}>
        <div className="sl__items">
          {visible.map((item) => (
            <div className="sl__item" key={item.label} title={item.description}>
              <span className={["sl__dot", item.className].join(" ")} />
              <span className="sl__label">{item.label}</span>
            </div>
          ))}
        </div>
        {!compact && (
          <div className="sl__hint">Click an operation to inspect details</div>
        )}
      </div>
      <style>{styles}</style>
    </>
  );
}

const styles = `
  .sl {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .sl__items {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .sl__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  .sl__dot {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 3px;
    box-sizing: border-box;
  }

  .sl__label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
  }

  /* Operation types */
  .sl__dot--lathe      { background: #93c5fd; }
  .sl__dot--milling    { background: #86efac; }
  .sl__dot--drill      { background: #c4b5fd; }
  .sl__dot--grinding   { background: #fcd34d; }
  .sl__dot--inspection { background: #d1d5db; }

  /* Downtime */
  .sl__dot--downtime {
    border: 1px dashed #f97316;
    background: repeating-linear-gradient(
      135deg,
      rgba(251,146,60,0.25) 0px,
      rgba(251,146,60,0.25) 2px,
      transparent 2px,
      transparent 4px
    );
  }

  /* Overtime */
  .sl__dot--overtime {
    border: 1px dashed #9ca3af;
    background: #f9fafb;
    border-radius: 3px;
  }

  .sl__dot--available {
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
  }

  .sl__dot--operator {
    border: 1px solid #d1d5db;
    background: #f3f4f6;
  }

  .sl__hint {
    font-size: 10px;
    color: #d1d5db;
    white-space: nowrap;
  }

  .sl--compact .sl__items { gap: 10px; }
  .sl--compact .sl__hint  { display: none; }
`;