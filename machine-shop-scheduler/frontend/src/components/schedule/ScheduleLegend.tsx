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
  {
    label: "Lathe",
    description: "CNC turning operation",
    className: "schedule-legend__dot--lathe",
  },
  {
    label: "Milling",
    description: "Milling operation",
    className: "schedule-legend__dot--milling",
  },
  {
    label: "Drill",
    description: "Drilling operation",
    className: "schedule-legend__dot--drill",
  },
  {
    label: "Grinding",
    description: "Grinding operation",
    className: "schedule-legend__dot--grinding",
  },
  {
    label: "Inspection",
    description: "Quality inspection",
    className: "schedule-legend__dot--inspection",
  },
];

export default function ScheduleLegend({
  showMachines = false,
  showOperators = false,
  showDowntime = true,
  showOvertime = true,
  compact = false,
  items = DEFAULT_ITEMS,
}: ScheduleLegendProps) {
  const visibleItems = [
    ...items,

    ...(showDowntime
      ? [
          {
            label: "Machine downtime",
            description:
              "Blocked machine capacity",
            className:
              "schedule-legend__dot--downtime",
          },
        ]
      : []),

    ...(showOvertime
      ? [
          {
            label: "Overtime",
            description:
              "Operation scheduled outside regular shift",
            className:
              "schedule-legend__dot--overtime",
          },
        ]
      : []),

    ...(showMachines
      ? [
          {
            label: "Machine available",
            description:
              "Machine currently available",
            className:
              "schedule-legend__dot--available",
          },
        ]
      : []),

    ...(showOperators
      ? [
          {
            label: "Operator available",
            description:
              "Operator available for assignment",
            className:
              "schedule-legend__dot--operator",
          },
        ]
      : []),
  ];

  return (
    <div
      className={[
        "schedule-legend",
        compact
          ? "schedule-legend--compact"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="schedule-legend__items">
        {visibleItems.map((item) => (
          <div
            className="schedule-legend__item"
            key={item.label}
            title={item.description}
          >
            <span
              className={[
                "schedule-legend__dot",
                item.className,
              ].join(" ")}
            />

            <span className="schedule-legend__label">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {!compact && (
        <div className="schedule-legend__hint">
          Click an operation to inspect
          machine, operator and timing.
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .schedule-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;

    width: 100%;
    min-height: 38px;

    padding: 7px 21px;

    border-bottom: 1px solid #202326;

    background: #0b0c0d;

    box-sizing: border-box;
  }

  .schedule-legend__items {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
  }

  .schedule-legend__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    color: #62696c;

    font-size: 7px;

    white-space: nowrap;
  }

  .schedule-legend__dot {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;

    border-radius: 2px;

    box-sizing: border-box;
  }

  /* -------------------------
     OPERATION TYPES
     ------------------------- */

  .schedule-legend__dot--lathe {
    background: #7f8c92;
  }

  .schedule-legend__dot--milling {
    background: #879486;
  }

  .schedule-legend__dot--drill {
    background: #8b858f;
  }

  .schedule-legend__dot--grinding {
    background: #9a8e7e;
  }

  .schedule-legend__dot--inspection {
    background: #70797b;
  }

  /* -------------------------
     MACHINE DOWNTIME
     ------------------------- */

  .schedule-legend__dot--downtime {
    width: 7px;
    height: 7px;

    border: 1px solid #625c4f;
    border-radius: 1px;

    background:
      repeating-linear-gradient(
        135deg,
        #766f61 0px,
        #766f61 2px,
        #302f2a 2px,
        #302f2a 4px
      );
  }

  /* -------------------------
     OVERTIME
     ------------------------- */

  .schedule-legend__dot--overtime {
    width: 8px;
    height: 7px;

    border: 1px dashed #737b7c;
    border-radius: 2px;

    background: #303437;
  }

  /* -------------------------
     MACHINE AVAILABLE
     ------------------------- */

  .schedule-legend__dot--available {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background: #7f9183;

    box-shadow:
      0 0 0 2px #162018;
  }

  /* -------------------------
     OPERATOR AVAILABLE
     ------------------------- */

  .schedule-legend__dot--operator {
    width: 7px;
    height: 7px;

    border: 1px solid #596064;
    border-radius: 2px;

    background: #121516;
  }

  .schedule-legend__hint {
    flex: 0 0 auto;

    color: #3f4649;

    font-size: 6px;

    white-space: nowrap;
  }

  /* -------------------------
     COMPACT
     ------------------------- */

  .schedule-legend--compact {
    min-height: 32px;

    padding-top: 5px;
    padding-bottom: 5px;
  }

  .schedule-legend--compact
    .schedule-legend__items {
    gap: 12px;
  }

  /* -------------------------
     RESPONSIVE
     ------------------------- */

  @media (max-width: 800px) {
    .schedule-legend {
      align-items: flex-start;
      flex-direction: column;
      gap: 8px;
    }

    .schedule-legend__hint {
      display: none;
    }
  }

  @media (max-width: 500px) {
    .schedule-legend {
      padding-left: 14px;
      padding-right: 14px;
    }

    .schedule-legend__items {
      gap: 10px;
    }
  }
`;