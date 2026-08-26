import { useMemo } from "react";

export interface ScenarioCostBreakdown {
  baseline?: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
  };

  replanned?: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
  };

  delta?: {
    late_penalty: number;
    overtime_cost: number;
    changeover_cost: number;
    stability_penalty: number;
    incremental_cost: number;
  };

  impact?: {
    affected_operations: number;
    moved_operations: number;
    total_completion_delay_hours: number;
    max_completion_delay_hours: number;
  };
}

export interface ScenarioResultProps {
  status?: string;
  operationsCount: number;
  cost: number;

  costBreakdown?: ScenarioCostBreakdown;

  diff?: {
    affected_operations?: number;
    moved_operations?: number;
    total_completion_delay_hours?: number;
    max_completion_delay_hours?: number;
    [key: string]: unknown;
  };

  onBack?: () => void;
  onViewSchedule?: () => void;
  onRunAgain?: () => void;
}

function formatCurrency(value = 0) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value = 0) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatHours(value = 0) {
  return `${value.toFixed(2)} h`;
}

function getDeltaClass(value = 0) {
  if (value > 0) {
    return "scenario-result__delta--negative";
  }

  if (value < 0) {
    return "scenario-result__delta--positive";
  }

  return "";
}

function getDeltaPrefix(value = 0) {
  if (value > 0) return "+";
  if (value < 0) return "−";
  return "";
}

export default function ScenarioResult({
  status = "success",
  operationsCount,
  cost,
  costBreakdown,
  diff,
  onBack,
  onViewSchedule,
  onRunAgain,
}: ScenarioResultProps) {
  const baselineCost = useMemo(() => {
    if (!costBreakdown?.baseline) {
      return undefined;
    }

    return (
      costBreakdown.baseline.late_penalty +
      costBreakdown.baseline.overtime_cost +
      costBreakdown.baseline.changeover_cost
    );
  }, [costBreakdown]);

  const replannedCost = useMemo(() => {
    if (!costBreakdown?.replanned) {
      return cost;
    }

    return (
      costBreakdown.replanned.late_penalty +
      costBreakdown.replanned.overtime_cost +
      costBreakdown.replanned.changeover_cost
    );
  }, [cost, costBreakdown]);

  const delta = costBreakdown?.delta;

  const impact = costBreakdown?.impact;

  const affectedOperations =
    impact?.affected_operations ??
    diff?.affected_operations ??
    0;

  const movedOperations =
    impact?.moved_operations ??
    diff?.moved_operations ??
    0;

  const totalDelay =
    impact?.total_completion_delay_hours ??
    diff?.total_completion_delay_hours ??
    0;

  const maxDelay =
    impact?.max_completion_delay_hours ??
    diff?.max_completion_delay_hours ??
    0;

  return (
    <>
      <section className="scenario-result">
        {/* Header */}
        <header className="scenario-result__header">
          <div className="scenario-result__header-left">
            <div className="scenario-result__success-mark">
              <span>✓</span>
            </div>

            <div>
              <div className="scenario-result__eyebrow">
                REPLANNING COMPLETE
              </div>

              <h2 className="scenario-result__title">
                Scenario applied successfully
              </h2>

              <p className="scenario-result__subtitle">
                The scheduling engine generated a new
                feasible schedule while preserving
                operation uniqueness.
              </p>
            </div>
          </div>

          <div className="scenario-result__status">
            <span className="scenario-result__status-dot" />
            {status.toUpperCase()}
          </div>
        </header>

        {/* Main cost */}
        <div className="scenario-result__hero">
          <div className="scenario-result__hero-main">
            <span className="scenario-result__hero-label">
              NEW TOTAL COST
            </span>

            <strong className="scenario-result__hero-value">
              {formatCurrency(cost)}
            </strong>

            {delta && (
              <span
                className={`scenario-result__hero-delta ${getDeltaClass(
                  delta.incremental_cost
                )}`}
              >
                {getDeltaPrefix(
                  delta.incremental_cost
                )}
                {formatCurrency(
                  Math.abs(delta.incremental_cost)
                )}
                <span>
                  {" "}
                  vs baseline
                </span>
              </span>
            )}
          </div>

          <div className="scenario-result__hero-meta">
            <div>
              <span>FINAL OPERATIONS</span>
              <strong>
                {formatNumber(operationsCount)}
              </strong>
            </div>

            <div>
              <span>MOVED</span>
              <strong>
                {formatNumber(movedOperations)}
              </strong>
            </div>

            <div>
              <span>AFFECTED</span>
              <strong>
                {formatNumber(
                  affectedOperations
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* Cost comparison */}
        <section className="scenario-result__section">
          <div className="scenario-result__section-header">
            <div>
              <span className="scenario-result__section-label">
                COST ANALYSIS
              </span>

              <h3>Baseline vs replanned</h3>
            </div>

            {baselineCost !== undefined && (
              <span className="scenario-result__comparison">
                {formatCurrency(baselineCost)}
                <span> → </span>
                {formatCurrency(replannedCost)}
              </span>
            )}
          </div>

          <div className="scenario-result__cost-grid">
            <CostRow
              label="Late penalty"
              baseline={
                costBreakdown?.baseline
                  ?.late_penalty
              }
              replanned={
                costBreakdown?.replanned
                  ?.late_penalty
              }
              delta={delta?.late_penalty}
            />

            <CostRow
              label="Overtime"
              baseline={
                costBreakdown?.baseline
                  ?.overtime_cost
              }
              replanned={
                costBreakdown?.replanned
                  ?.overtime_cost
              }
              delta={delta?.overtime_cost}
            />

            <CostRow
              label="Changeover"
              baseline={
                costBreakdown?.baseline
                  ?.changeover_cost
              }
              replanned={
                costBreakdown?.replanned
                  ?.changeover_cost
              }
              delta={delta?.changeover_cost}
            />

            <div className="scenario-result__cost-total">
              <span>Incremental scenario cost</span>

              <strong
                className={getDeltaClass(
                  delta?.incremental_cost
                )}
              >
                {getDeltaPrefix(
                  delta?.incremental_cost
                )}
                {formatCurrency(
                  Math.abs(
                    delta?.incremental_cost ?? 0
                  )
                )}
              </strong>
            </div>
          </div>
        </section>

        {/* Operational impact */}
        <section className="scenario-result__section">
          <div className="scenario-result__section-header">
            <div>
              <span className="scenario-result__section-label">
                SCHEDULE IMPACT
              </span>

              <h3>What changed</h3>
            </div>
          </div>

          <div className="scenario-result__impact-grid">
            <ImpactCard
              label="Affected operations"
              value={formatNumber(
                affectedOperations
              )}
              detail="operations evaluated for replanning"
            />

            <ImpactCard
              label="Moved operations"
              value={formatNumber(
                movedOperations
              )}
              detail="operations changed from baseline"
            />

            <ImpactCard
              label="Total completion delay"
              value={formatHours(totalDelay)}
              detail="aggregate completion delay"
            />

            <ImpactCard
              label="Maximum delay"
              value={formatHours(maxDelay)}
              detail="largest individual delay"
            />
          </div>
        </section>

        {/* Integrity */}
        <section className="scenario-result__integrity">
          <div className="scenario-result__integrity-item">
            <span className="scenario-result__integrity-icon">
              ✓
            </span>

            <div>
              <strong>Schedule integrity</strong>
              <span>
                {operationsCount} operations retained
              </span>
            </div>
          </div>

          <div className="scenario-result__integrity-divider" />

          <div className="scenario-result__integrity-item">
            <span className="scenario-result__integrity-icon">
              ✓
            </span>

            <div>
              <strong>Duplicate check</strong>
              <span>
                No duplicate operation keys
              </span>
            </div>
          </div>

          <div className="scenario-result__integrity-divider" />

          <div className="scenario-result__integrity-item">
            <span className="scenario-result__integrity-icon">
              ✓
            </span>

            <div>
              <strong>Constraints</strong>
              <span>
                Scenario constraints enforced
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <footer className="scenario-result__footer">
          <div className="scenario-result__footer-note">
            Replanned schedule is ready for inspection.
          </div>

          <div className="scenario-result__actions">
            {onBack && (
              <button
                type="button"
                className="scenario-result__button scenario-result__button--secondary"
                onClick={onBack}
              >
                BACK TO SCENARIOS
              </button>
            )}

            {onRunAgain && (
              <button
                type="button"
                className="scenario-result__button scenario-result__button--secondary"
                onClick={onRunAgain}
              >
                RUN AGAIN
              </button>
            )}

            {onViewSchedule && (
              <button
                type="button"
                className="scenario-result__button scenario-result__button--primary"
                onClick={onViewSchedule}
              >
                VIEW NEW SCHEDULE
                <span>→</span>
              </button>
            )}
          </div>
        </footer>
      </section>

      <style>{`
        .scenario-result {
          width: 100%;
          overflow: hidden;

          background: #0b0c0d;
          border: 1px solid #292d30;
          border-radius: 9px;

          color: #e7e9e8;
        }

        /* -------------------------
           HEADER
           ------------------------- */

        .scenario-result__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;

          padding: 21px;

          border-bottom: 1px solid #202326;
        }

        .scenario-result__header-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;

          min-width: 0;
        }

        .scenario-result__success-mark {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 31px;
          height: 31px;
          flex: 0 0 31px;

          border: 1px solid #35463a;
          border-radius: 5px;

          background: #101512;
          color: #8da694;

          font-size: 13px;
        }

        .scenario-result__eyebrow {
          margin-bottom: 6px;

          color: #819789;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }

        .scenario-result__title {
          margin: 0;

          color: #e7e9e8;

          font-size: 16px;
          font-weight: 500;
          letter-spacing: -0.015em;
        }

        .scenario-result__subtitle {
          max-width: 590px;

          margin: 6px 0 0;

          color: #636a6e;

          font-size: 9px;
          line-height: 1.45;
        }

        .scenario-result__status {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          flex: 0 0 auto;

          padding: 6px 8px;

          border: 1px solid #2b3a31;
          border-radius: 4px;

          color: #8ca695;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .scenario-result__status-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;
          background: #8ca695;
        }

        /* -------------------------
           HERO
           ------------------------- */

        .scenario-result__hero {
          display: flex;
          align-items: stretch;

          border-bottom: 1px solid #202326;
        }

        .scenario-result__hero-main {
          display: flex;
          flex-direction: column;
          justify-content: center;

          min-width: 280px;

          padding: 22px 21px;

          border-right: 1px solid #202326;
        }

        .scenario-result__hero-label {
          margin-bottom: 7px;

          color: #555c60;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }

        .scenario-result__hero-value {
          color: #eceeec;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 25px;
          font-weight: 500;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .scenario-result__hero-delta {
          margin-top: 8px;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

        .scenario-result__hero-delta span {
          color: #535a5e;
        }

        .scenario-result__hero-meta {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(100px, 1fr));

          flex: 1;

          background: #0e1011;
        }

        .scenario-result__hero-meta div {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;

          padding: 18px;

          border-right: 1px solid #202326;
        }

        .scenario-result__hero-meta div:last-child {
          border-right: 0;
        }

        .scenario-result__hero-meta span {
          color: #4f565a;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .scenario-result__hero-meta strong {
          color: #c4c8c7;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 16px;
          font-weight: 500;
        }

        /* -------------------------
           SECTIONS
           ------------------------- */

        .scenario-result__section {
          padding: 20px 21px;

          border-bottom: 1px solid #202326;
        }

        .scenario-result__section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 15px;

          margin-bottom: 14px;
        }

        .scenario-result__section-label {
          display: block;

          margin-bottom: 6px;

          color: #555c60;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .scenario-result__section-header h3 {
          margin: 0;

          color: #b8bcbb;

          font-size: 11px;
          font-weight: 500;
        }

        .scenario-result__comparison {
          color: #686f72;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

        /* -------------------------
           COST
           ------------------------- */

        .scenario-result__cost-grid {
          overflow: hidden;

          border: 1px solid #222629;
          border-radius: 5px;
        }

        .scenario-result__cost-row {
          display: grid;
          grid-template-columns:
            minmax(150px, 1fr)
            130px
            130px
            130px;

          min-height: 42px;

          border-bottom: 1px solid #1d2022;
        }

        .scenario-result__cost-row:last-child {
          border-bottom: 0;
        }

        .scenario-result__cost-row > div {
          display: flex;
          align-items: center;

          padding: 0 13px;

          border-right: 1px solid #1d2022;
        }

        .scenario-result__cost-row > div:last-child {
          border-right: 0;
        }

        .scenario-result__cost-label {
          color: #7c8385;

          font-size: 9px;
        }

        .scenario-result__cost-value {
          justify-content: flex-end;

          color: #9da3a2;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 8px;
        }

        .scenario-result__cost-delta {
          justify-content: flex-end;
        }

        .scenario-result__cost-total {
          display: flex;
          align-items: center;
          justify-content: space-between;

          min-height: 46px;

          padding: 0 13px;

          background: #0e1011;
        }

        .scenario-result__cost-total span {
          color: #858b8d;

          font-size: 9px;
        }

        .scenario-result__cost-total strong {
          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 10px;
          font-weight: 600;
        }

        /* -------------------------
           IMPACT
           ------------------------- */

        .scenario-result__impact-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 1px;

          background: #202326;
          border: 1px solid #202326;
          border-radius: 5px;
          overflow: hidden;
        }

        .scenario-result__impact-card {
          min-width: 0;

          padding: 14px;

          background: #0e1011;
        }

        .scenario-result__impact-label {
          display: block;

          margin-bottom: 8px;

          color: #555c60;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .scenario-result__impact-value {
          display: block;

          color: #d0d4d2;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 16px;
          font-weight: 500;
        }

        .scenario-result__impact-detail {
          display: block;

          margin-top: 6px;

          color: #4f565a;

          font-size: 7px;
          line-height: 1.35;
        }

        /* -------------------------
           INTEGRITY
           ------------------------- */

        .scenario-result__integrity {
          display: flex;
          align-items: center;

          min-height: 62px;

          border-bottom: 1px solid #202326;
        }

        .scenario-result__integrity-item {
          display: flex;
          align-items: center;
          gap: 9px;

          flex: 1;

          padding: 13px 18px;
        }

        .scenario-result__integrity-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          width: 18px;
          height: 18px;
          flex: 0 0 18px;

          border: 1px solid #314136;
          border-radius: 50%;

          background: #101512;
          color: #8da694;

          font-size: 9px;
        }

        .scenario-result__integrity-item div {
          display: flex;
          flex-direction: column;
          gap: 3px;

          min-width: 0;
        }

        .scenario-result__integrity-item strong {
          color: #929896;

          font-size: 8px;
          font-weight: 600;
        }

        .scenario-result__integrity-item span:last-child {
          color: #50575a;

          font-size: 7px;
        }

        .scenario-result__integrity-divider {
          width: 1px;
          height: 28px;

          background: #24282a;
        }

        /* -------------------------
           FOOTER
           ------------------------- */

        .scenario-result__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;

          padding: 16px 21px;
        }

        .scenario-result__footer-note {
          color: #4f565a;

          font-size: 8px;
        }

        .scenario-result__actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .scenario-result__button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          height: 31px;

          padding: 0 11px;

          border-radius: 4px;

          font-family:
            "SFMono-Regular",
            "Cascadia Code",
            "Roboto Mono",
            monospace;

          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.07em;

          cursor: pointer;

          transition:
            background 140ms ease,
            border-color 140ms ease,
            color 140ms ease;
        }

        .scenario-result__button--secondary {
          background: #0e1011;
          border: 1px solid #292d30;
          color: #777e81;
        }

        .scenario-result__button--secondary:hover {
          background: #141618;
          border-color: #383d40;
          color: #b3b8b7;
        }

        .scenario-result__button--primary {
          background: #d5d6d1;
          border: 1px solid #d5d6d1;
          color: #111314;
        }

        .scenario-result__button--primary:hover {
          background: #ecece7;
          border-color: #ecece7;
        }

        .scenario-result__delta--negative {
          color: #c9867f;
        }

        .scenario-result__delta--positive {
          color: #8fac99;
        }

        /* -------------------------
           RESPONSIVE
           ------------------------- */

        @media (max-width: 850px) {
          .scenario-result__hero {
            flex-direction: column;
          }

          .scenario-result__hero-main {
            border-right: 0;
            border-bottom: 1px solid #202326;
          }

          .scenario-result__impact-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .scenario-result__cost-row {
            grid-template-columns:
              minmax(120px, 1fr)
              90px
              90px
              90px;
          }

          .scenario-result__integrity {
            flex-direction: column;
            align-items: stretch;
          }

          .scenario-result__integrity-divider {
            width: auto;
            height: 1px;
            margin: 0 18px;
          }
        }

        @media (max-width: 560px) {
          .scenario-result__header {
            flex-direction: column;
          }

          .scenario-result__status {
            align-self: flex-start;
          }

          .scenario-result__hero-meta {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .scenario-result__hero-meta div {
            padding: 13px;
          }

          .scenario-result__section {
            padding: 17px 15px;
          }

          .scenario-result__cost-grid {
            overflow-x: auto;
          }

          .scenario-result__cost-row {
            min-width: 500px;
          }

          .scenario-result__footer {
            align-items: stretch;
            flex-direction: column;
          }

          .scenario-result__actions {
            flex-wrap: wrap;
          }

          .scenario-result__button {
            flex: 1;
          }
        }

        @media (max-width: 400px) {
          .scenario-result__hero-meta {
            grid-template-columns: 1fr;
          }

          .scenario-result__hero-meta div {
            border-right: 0;
            border-bottom: 1px solid #202326;
          }

          .scenario-result__hero-meta div:last-child {
            border-bottom: 0;
          }

          .scenario-result__impact-grid {
            grid-template-columns: 1fr;
          }

          .scenario-result__actions {
            flex-direction: column;
          }

          .scenario-result__button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

interface CostRowProps {
  label: string;
  baseline?: number;
  replanned?: number;
  delta?: number;
}

function CostRow({
  label,
  baseline = 0,
  replanned = 0,
  delta = 0,
}: CostRowProps) {
  return (
    <div className="scenario-result__cost-row">
      <div className="scenario-result__cost-label">
        {label}
      </div>

      <div className="scenario-result__cost-value">
        {formatCurrency(baseline)}
      </div>

      <div className="scenario-result__cost-value">
        {formatCurrency(replanned)}
      </div>

      <div
        className={`scenario-result__cost-value scenario-result__cost-delta ${getDeltaClass(
          delta
        )}`}
      >
        {getDeltaPrefix(delta)}
        {formatCurrency(Math.abs(delta))}
      </div>
    </div>
  );
}

interface ImpactCardProps {
  label: string;
  value: string;
  detail: string;
}

function ImpactCard({
  label,
  value,
  detail,
}: ImpactCardProps) {
  return (
    <div className="scenario-result__impact-card">
      <span className="scenario-result__impact-label">
        {label}
      </span>

      <strong className="scenario-result__impact-value">
        {value}
      </strong>

      <span className="scenario-result__impact-detail">
        {detail}
      </span>
    </div>
  );
}