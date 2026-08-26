import type { ReactNode } from "react";

type ConstraintState = "clear" | "warning" | "violation";

interface Constraint {
  id: string;
  label: string;
  detail: string;
  state: ConstraintState;
  value?: string;
  icon?: ReactNode;
}

interface ConstraintStatusProps {
  constraints?: Constraint[];
  compact?: boolean;
}

const defaultConstraints: Constraint[] = [
  {
    id: "machine-capacity",
    label: "Machine capacity",
    detail: "All scheduled operations within available capacity",
    state: "clear",
    value: "CLEAR",
  },
  {
    id: "grinder-downtime",
    label: "Grinder downtime",
    detail: "GRINDER-01 unavailable · 11:00–19:00",
    state: "clear",
    value: "CLEAR",
  },
  {
    id: "operator-capacity",
    label: "Operator capacity",
    detail: "Certified operator availability within limits",
    state: "clear",
    value: "CLEAR",
  },
  {
    id: "schedule-integrity",
    label: "Schedule integrity",
    detail: "111 operations · 111 unique assignments",
    state: "clear",
    value: "CLEAR",
  },
];

const stateConfig: Record<
  ConstraintState,
  {
    label: string;
    className: string;
    dotClass: string;
  }
> = {
  clear: {
    label: "CLEAR",
    className: "constraint-status--clear",
    dotClass: "constraint-dot--clear",
  },
  warning: {
    label: "WARNING",
    className: "constraint-status--warning",
    dotClass: "constraint-dot--warning",
  },
  violation: {
    label: "VIOLATION",
    className: "constraint-status--violation",
    dotClass: "constraint-dot--violation",
  },
};

export default function ConstraintStatus({
  constraints = defaultConstraints,
  compact = false,
}: ConstraintStatusProps) {
  const violations = constraints.filter(
    (constraint) => constraint.state === "violation"
  ).length;

  const warnings = constraints.filter(
    (constraint) => constraint.state === "warning"
  ).length;

  const overallState: ConstraintState =
    violations > 0
      ? "violation"
      : warnings > 0
        ? "warning"
        : "clear";

  const overallLabel = stateConfig[overallState].label;

  return (
    <section
      className={`constraint-panel ${
        compact ? "constraint-panel--compact" : ""
      }`}
      aria-label="Constraint status"
    >
      <div className="constraint-panel__header">
        <div>
          <div className="constraint-panel__eyebrow">
            CONSTRAINT MONITOR
          </div>

          <h2 className="constraint-panel__title">
            Schedule integrity
          </h2>
        </div>

        <div
          className={`constraint-overall ${
            stateConfig[overallState].className
          }`}
        >
          <span
            className={`constraint-dot ${
              stateConfig[overallState].dotClass
            }`}
          />

          <span>{overallLabel}</span>
        </div>
      </div>

      <div className="constraint-panel__rule" />

      <div className="constraint-list">
        {constraints.map((constraint, index) => {
          const state = stateConfig[constraint.state];

          return (
            <div
              className="constraint-row"
              key={constraint.id}
            >
              <div className="constraint-row__index">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="constraint-row__indicator">
                <span
                  className={`constraint-dot ${state.dotClass}`}
                />
              </div>

              <div className="constraint-row__content">
                <div className="constraint-row__top">
                  <span className="constraint-row__label">
                    {constraint.label}
                  </span>

                  <span
                    className={`constraint-row__state ${state.className}`}
                  >
                    {constraint.value ?? state.label}
                  </span>
                </div>

                <p className="constraint-row__detail">
                  {constraint.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="constraint-panel__footer">
          <span>
            {violations === 0
              ? "No hard constraint violations detected"
              : `${violations} hard constraint ${
                  violations === 1 ? "violation" : "violations"
                } detected`}
          </span>

          <span className="constraint-panel__timestamp">
            LIVE
          </span>
        </div>
      )}
    </section>
  );
}