import type { ReactNode } from "react";

interface CostBreakdown {
  baseline: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    total_cost: number;
  };
  replanned: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    total_cost: number;
  };
  delta: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    incremental_cost: number;
  };
}

interface CostSummaryProps {
  breakdown: CostBreakdown;
  currency?: string;
}

interface CostRowProps {
  label: string;
  value: number;
  delta?: number;
  showDelta?: boolean;
  icon?: ReactNode;
}

function formatCurrency(
  value: number,
  currency = "₹"
) {
  return `${currency}${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDelta(
  value: number,
  currency = "₹"
) {
  if (value === 0) {
    return "—";
  }

  const sign = value > 0 ? "+" : "−";

  return `${sign}${formatCurrency(
    Math.abs(value),
    currency
  )}`;
}

function CostRow({
  label,
  value,
  delta,
  showDelta = true,
}: CostRowProps) {
  return (
    <div className="cost-summary__row">
      <div className="cost-summary__row-label">
        {label}
      </div>

      <div className="cost-summary__row-value">
        {formatCurrency(value)}

        {showDelta && delta !== undefined && (
          <span
            className={
              `cost-summary__delta ` +
              (delta > 0
                ? "cost-summary__delta--negative"
                : delta < 0
                  ? "cost-summary__delta--positive"
                  : "cost-summary__delta--neutral")
            }
          >
            {formatDelta(delta)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CostSummary({
  breakdown,
  currency = "₹",
}: CostSummaryProps) {
  const baselineTotal =
    breakdown.baseline.total_cost;

  const replannedTotal =
    breakdown.replanned.total_cost;

  const incrementalCost =
    breakdown.delta.incremental_cost;

  const percentageChange =
    baselineTotal === 0
      ? 0
      : (incrementalCost / baselineTotal) * 100;

  const isImprovement =
    incrementalCost < 0;

  const isNeutral =
    incrementalCost === 0;

  const resultClass = isNeutral
    ? "cost-summary__result--neutral"
    : isImprovement
      ? "cost-summary__result--positive"
      : "cost-summary__result--negative";

  return (
    <section
      className="cost-summary"
      aria-label="Schedule cost summary"
    >
      <header className="cost-summary__header">
        <div>
          <div className="cost-summary__eyebrow">
            COST ANALYSIS
          </div>

          <h2 className="cost-summary__title">
            Schedule economics
          </h2>
        </div>

        <div
          className={`cost-summary__result ${resultClass}`}
        >
          <span className="cost-summary__result-label">
            NET IMPACT
          </span>

          <span className="cost-summary__result-value">
            {incrementalCost > 0 ? "+" : ""}
            {formatCurrency(
              incrementalCost,
              currency
            )}
          </span>
        </div>
      </header>

      <div className="cost-summary__totals">
        <div className="cost-summary__total">
          <span className="cost-summary__total-label">
            BASELINE
          </span>

          <span className="cost-summary__total-value">
            {formatCurrency(
              baselineTotal,
              currency
            )}
          </span>
        </div>

        <div className="cost-summary__arrow">
          →
        </div>

        <div className="cost-summary__total">
          <span className="cost-summary__total-label">
            REPLANNED
          </span>

          <span className="cost-summary__total-value cost-summary__total-value--active">
            {formatCurrency(
              replannedTotal,
              currency
            )}
          </span>
        </div>

        <div className="cost-summary__change">
          {incrementalCost > 0 ? "+" : ""}
          {percentageChange.toFixed(2)}%
        </div>
      </div>

      <div className="cost-summary__rule" />

      <div className="cost-summary__section-label">
        COST COMPONENTS
      </div>

      <div className="cost-summary__rows">
        <CostRow
          label="Late penalties"
          value={breakdown.replanned.late_penalty}
          delta={breakdown.delta.late_penalty}
        />

        <CostRow
          label="Overtime"
          value={breakdown.replanned.overtime_cost}
          delta={breakdown.delta.overtime_cost}
        />

        <CostRow
          label="Changeovers"
          value={breakdown.replanned.changeover_cost}
          delta={breakdown.delta.changeover_cost}
        />

        <CostRow
          label="Schedule stability"
          value={breakdown.replanned.stability_penalty}
          delta={breakdown.delta.stability_penalty}
        />
      </div>

      <footer className="cost-summary__footer">
        <div>
          <span className="cost-summary__footer-label">
            INCREMENTAL COST
          </span>

          <span
            className={`cost-summary__footer-value ${resultClass}`}
          >
            {incrementalCost > 0 ? "+" : ""}
            {formatCurrency(
              incrementalCost,
              currency
            )}
          </span>
        </div>

        <div className="cost-summary__footer-note">
          {isNeutral
            ? "No economic change"
            : isImprovement
              ? "Replan reduces total cost"
              : "Replan increases total cost"}
        </div>
      </footer>
    </section>
  );
}