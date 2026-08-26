import type { ReactNode } from "react";

interface ScenarioImpactData {
  affected_operations: number;
  moved_operations: number;
  total_completion_delay_hours: number;
  max_completion_delay_hours: number;
}

interface ScenarioImpactProps {
  data: ScenarioImpactData;
  scenarioName?: string;
  scenarioDescription?: string;
  status?: "resolved" | "active" | "warning";
  icon?: ReactNode;
}

function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours < 0.1) {
    return `${days}d`;
  }

  return `${days}d ${remainingHours.toFixed(1)}h`;
}

function getStatusLabel(
  status: ScenarioImpactProps["status"]
): string {
  switch (status) {
    case "resolved":
      return "MITIGATED";

    case "active":
      return "ACTIVE";

    case "warning":
      return "ATTENTION";

    default:
      return "MITIGATED";
  }
}

export default function ScenarioImpact({
  data,
  scenarioName = "Scenario impact",
  scenarioDescription,
  status = "resolved",
  icon,
}: ScenarioImpactProps) {
  const {
    affected_operations,
    moved_operations,
    total_completion_delay_hours,
    max_completion_delay_hours,
  } = data;

  const movementRate =
    affected_operations > 0
      ? (moved_operations / affected_operations) * 100
      : 0;

  return (
    <section
      className={`scenario-impact scenario-impact--${status}`}
      aria-label="Scenario impact"
    >
      <header className="scenario-impact__header">
        <div className="scenario-impact__heading">
          <div className="scenario-impact__eyebrow">
            SCENARIO IMPACT
          </div>

          <div className="scenario-impact__title-row">
            {icon && (
              <div className="scenario-impact__icon">
                {icon}
              </div>
            )}

            <h2 className="scenario-impact__title">
              {scenarioName}
            </h2>
          </div>

          {scenarioDescription && (
            <p className="scenario-impact__description">
              {scenarioDescription}
            </p>
          )}
        </div>

        <div
          className={`scenario-impact__status scenario-impact__status--${status}`}
        >
          <span className="scenario-impact__status-dot" />
          {getStatusLabel(status)}
        </div>
      </header>

      <div className="scenario-impact__metrics">
        <Metric
          label="AFFECTED"
          value={affected_operations}
          suffix="ops"
        />

        <Metric
          label="MOVED"
          value={moved_operations}
          suffix="ops"
          detail={`${movementRate.toFixed(0)}% of affected`}
        />

        <Metric
          label="TOTAL DELAY"
          value={formatHours(
            total_completion_delay_hours
          )}
        />

        <Metric
          label="MAX DELAY"
          value={formatHours(
            max_completion_delay_hours
          )}
          emphasis
        />
      </div>

      <div className="scenario-impact__footer">
        <div className="scenario-impact__footer-item">
          <span className="scenario-impact__footer-label">
            SCHEDULE DISRUPTION
          </span>

          <div className="scenario-impact__bar">
            <div
              className="scenario-impact__bar-fill"
              style={{
                width: `${Math.min(
                  movementRate,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="scenario-impact__footer-value">
          {movementRate.toFixed(1)}%
        </div>
      </div>
    </section>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
  suffix?: string;
  detail?: string;
  emphasis?: boolean;
}

function Metric({
  label,
  value,
  suffix,
  detail,
  emphasis = false,
}: MetricProps) {
  return (
    <div
      className={`scenario-impact__metric ${
        emphasis
          ? "scenario-impact__metric--emphasis"
          : ""
      }`}
    >
      <span className="scenario-impact__metric-label">
        {label}
      </span>

      <div className="scenario-impact__metric-value">
        {value}

        {suffix && (
          <span className="scenario-impact__metric-suffix">
            {suffix}
          </span>
        )}
      </div>

      {detail && (
        <span className="scenario-impact__metric-detail">
          {detail}
        </span>
      )}
    </div>
  );
}