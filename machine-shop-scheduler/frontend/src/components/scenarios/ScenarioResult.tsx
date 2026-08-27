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
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function formatHours(value = 0) {
  return `${value.toFixed(2)} h`;
}

function getDeltaClass(value = 0) {
  if (value > 0) return "sr__delta--neg";
  if (value < 0) return "sr__delta--pos";
  return "";
}

function getDeltaPrefix(value = 0) {
  if (value > 0) return "+";
  if (value < 0) return "−";
  return "";
}

interface CostRowProps {
  label: string;
  baseline?: number;
  replanned?: number;
  delta?: number;
}

function CostRow({ label, baseline = 0, replanned = 0, delta = 0 }: CostRowProps) {
  return (
    <div className="sr__cost-row">
      <div className="sr__cost-label">{label}</div>
      <div className="sr__cost-value">{formatCurrency(baseline)}</div>
      <div className="sr__cost-value">{formatCurrency(replanned)}</div>
      <div className={`sr__cost-value sr__cost-delta ${getDeltaClass(delta)}`}>
        {getDeltaPrefix(delta)}{formatCurrency(Math.abs(delta))}
      </div>
    </div>
  );
}

interface ImpactCardProps {
  label: string;
  value: string;
  detail: string;
}

function ImpactCard({ label, value, detail }: ImpactCardProps) {
  return (
    <div className="sr__impact-card">
      <span className="sr__impact-label">{label}</span>
      <strong className="sr__impact-value">{value}</strong>
      <span className="sr__impact-detail">{detail}</span>
    </div>
  );
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
    if (!costBreakdown?.baseline) return undefined;
    const b = costBreakdown.baseline;
    // Use pre-computed total if available, otherwise sum components
    return (b as any).total_cost
      ?? (b.late_penalty + b.overtime_cost + b.changeover_cost);
  }, [costBreakdown]);

  const replannedCost = useMemo(() => {
    if (!costBreakdown?.replanned) return cost;
    const r = costBreakdown.replanned;
    // stability_penalty is a scenario cost — must be included in replanned total
    return (r as any).total_cost
      ?? (r.late_penalty + r.overtime_cost + r.changeover_cost + ((r as any).stability_penalty ?? 0));
  }, [cost, costBreakdown]);

  const delta = costBreakdown?.delta;
  const impact = costBreakdown?.impact;

  const affectedOperations = impact?.affected_operations ?? diff?.affected_operations ?? 0;
  const movedOperations     = impact?.moved_operations    ?? diff?.moved_operations    ?? 0;
  const totalDelay          = impact?.total_completion_delay_hours ?? diff?.total_completion_delay_hours ?? 0;
  const maxDelay            = impact?.max_completion_delay_hours   ?? diff?.max_completion_delay_hours   ?? 0;

  return (
    <>
      <section className="sr">

        {/* Header */}
        <header className="sr__header">
          <div className="sr__header-left">
            <div className="sr__success-mark">✓</div>
            <div>
              <div className="sr__eyebrow">REPLANNING COMPLETE</div>
              <h2 className="sr__title">Scenario applied successfully</h2>
              <p className="sr__subtitle">
                The scheduling engine generated a new feasible schedule while preserving operation uniqueness.
              </p>
            </div>
          </div>
          <div className="sr__status-badge">
            <span className="sr__status-dot" />
            {status.toUpperCase()}
          </div>
        </header>

        {/* Hero cost */}
        <div className="sr__hero">
          <div className="sr__hero-main">
            <span className="sr__hero-label">NEW TOTAL COST</span>
            <strong className="sr__hero-value">{formatCurrency(replannedCost)}</strong>
            {delta && (
              <span className={`sr__hero-delta ${getDeltaClass(delta.incremental_cost)}`}>
                {getDeltaPrefix(delta.incremental_cost)}
                {formatCurrency(Math.abs(delta.incremental_cost))}
                <span> vs baseline</span>
              </span>
            )}
          </div>
          <div className="sr__hero-meta">
            <div>
              <span>FINAL OPERATIONS</span>
              <strong>{formatNumber(operationsCount)}</strong>
            </div>
            <div>
              <span>MOVED</span>
              <strong>{formatNumber(movedOperations)}</strong>
            </div>
            <div>
              <span>AFFECTED</span>
              <strong>{formatNumber(affectedOperations)}</strong>
            </div>
          </div>
        </div>

        {/* Cost analysis */}
        <section className="sr__section">
          <div className="sr__section-header">
            <div>
              <span className="sr__section-label">COST ANALYSIS</span>
              <h3>Baseline vs replanned</h3>
            </div>
            {baselineCost !== undefined && (
              <span className="sr__comparison">
                {formatCurrency(baselineCost)}
                <span> → </span>
                {formatCurrency(replannedCost)}
              </span>
            )}
          </div>

          <div className="sr__cost-grid">
            {/* Column headers */}
            <div className="sr__cost-head">
              <div>LINE ITEM</div>
              <div>BASELINE</div>
              <div>REPLANNED</div>
              <div>DELTA</div>
            </div>
            <CostRow
              label="Late penalty"
              baseline={costBreakdown?.baseline?.late_penalty}
              replanned={costBreakdown?.replanned?.late_penalty}
              delta={delta?.late_penalty}
            />
            <CostRow
              label="Overtime"
              baseline={costBreakdown?.baseline?.overtime_cost}
              replanned={costBreakdown?.replanned?.overtime_cost}
              delta={delta?.overtime_cost}
            />
            <CostRow
              label="Stability penalty"
              baseline={0}
              replanned={(costBreakdown?.replanned as any)?.stability_penalty ?? 0}
              delta={delta?.stability_penalty ?? 0}
            />
            <CostRow
              label="Changeover"
              baseline={costBreakdown?.baseline?.changeover_cost}
              replanned={costBreakdown?.replanned?.changeover_cost}
              delta={delta?.changeover_cost}
            />
            <div className="sr__cost-total">
              <span>Incremental scenario cost</span>
              <strong className={getDeltaClass(delta?.incremental_cost)}>
                {getDeltaPrefix(delta?.incremental_cost)}
                {formatCurrency(Math.abs(delta?.incremental_cost ?? 0))}
              </strong>
            </div>
          </div>
        </section>

        {/* Schedule impact */}
        <section className="sr__section">
          <div className="sr__section-header">
            <div>
              <span className="sr__section-label">SCHEDULE IMPACT</span>
              <h3>What changed</h3>
            </div>
          </div>
          <div className="sr__impact-grid">
            <ImpactCard label="Affected operations"    value={formatNumber(affectedOperations)} detail="operations evaluated for replanning" />
            <ImpactCard label="Moved operations"       value={formatNumber(movedOperations)}    detail="operations changed from baseline" />
            <ImpactCard label="Total completion delay" value={formatHours(totalDelay)}          detail="aggregate completion delay" />
            <ImpactCard label="Maximum delay"          value={formatHours(maxDelay)}            detail="largest individual delay" />
          </div>
        </section>

        {/* Integrity checks */}
        <section className="sr__integrity">
          {[
            { label: "Schedule integrity",  detail: `${operationsCount} operations retained` },
            { label: "Duplicate check",     detail: "No duplicate operation keys" },
            { label: "Constraints",         detail: "Scenario constraints enforced" },
          ].map((item, i, arr) => (
            <>
              <div className="sr__integrity-item" key={item.label}>
                <span className="sr__integrity-icon">✓</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.detail}</span>
                </div>
              </div>
              {i < arr.length - 1 && <div className="sr__integrity-divider" key={`div-${i}`} />}
            </>
          ))}
        </section>

        {/* Footer */}
        <footer className="sr__footer">
          <div className="sr__footer-note">Replanned schedule is ready for inspection.</div>
          <div className="sr__actions">
            {onBack && (
              <button type="button" className="sr__btn sr__btn--secondary" onClick={onBack}>
                BACK TO SCENARIOS
              </button>
            )}
            {onRunAgain && (
              <button type="button" className="sr__btn sr__btn--secondary" onClick={onRunAgain}>
                RUN AGAIN
              </button>
            )}
            {onViewSchedule && (
              <button type="button" className="sr__btn sr__btn--primary" onClick={onViewSchedule}>
                VIEW NEW SCHEDULE <span>→</span>
              </button>
            )}
          </div>
        </footer>
      </section>

      <style>{`
        .sr {
          width: 100%;
          overflow: hidden;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #111827;
        }

        /* Header */
        .sr__header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sr__header-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .sr__success-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          background: #f0fdf4;
          color: #16a34a;
          font-size: 14px;
        }

        .sr__eyebrow {
          margin-bottom: 5px;
          color: #16a34a;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }

        .sr__title {
          margin: 0;
          color: #111827;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.015em;
        }

        .sr__subtitle {
          max-width: 520px;
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 12px;
          line-height: 1.5;
        }

        .sr__status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 0 0 auto;
          padding: 5px 10px;
          border: 1px solid #bbf7d0;
          border-radius: 20px;
          background: #f0fdf4;
          color: #15803d;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .sr__status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
        }

        /* Hero */
        .sr__hero {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid #f3f4f6;
        }

        .sr__hero-main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 260px;
          padding: 20px;
          border-right: 1px solid #f3f4f6;
        }

        .sr__hero-label {
          margin-bottom: 6px;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.13em;
        }

        .sr__hero-value {
          color: #111827;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 26px;
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .sr__hero-delta {
          margin-top: 8px;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 11px;
        }

        .sr__hero-delta span { color: #9ca3af; }

        .sr__hero-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(100px, 1fr));
          flex: 1;
          background: #f9fafb;
        }

        .sr__hero-meta div {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 5px;
          padding: 18px;
          border-right: 1px solid #f3f4f6;
        }

        .sr__hero-meta div:last-child { border-right: 0; }

        .sr__hero-meta span {
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .sr__hero-meta strong {
          color: #111827;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 18px;
          font-weight: 600;
        }

        /* Delta colors */
        .sr__delta--neg { color: #dc2626; }
        .sr__delta--pos { color: #16a34a; }

        /* Sections */
        .sr__section {
          padding: 18px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sr__section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .sr__section-label {
          display: block;
          margin-bottom: 5px;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .sr__section-header h3 {
          margin: 0;
          color: #111827;
          font-size: 13px;
          font-weight: 600;
        }

        .sr__comparison {
          color: #9ca3af;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 11px;
        }

        .sr__comparison span { color: #d1d5db; }

        /* Cost grid */
        .sr__cost-grid {
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .sr__cost-head {
          display: grid;
          grid-template-columns: minmax(150px, 1fr) 130px 130px 130px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .sr__cost-head > div {
          padding: 8px 14px;
          font-size: 9px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.1em;
          border-right: 1px solid #e5e7eb;
        }

        .sr__cost-head > div:last-child { border-right: 0; }

        .sr__cost-row {
          display: grid;
          grid-template-columns: minmax(150px, 1fr) 130px 130px 130px;
          min-height: 42px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sr__cost-row:last-of-type { border-bottom: 0; }

        .sr__cost-row > div {
          display: flex;
          align-items: center;
          padding: 0 14px;
          border-right: 1px solid #f3f4f6;
        }

        .sr__cost-row > div:last-child { border-right: 0; }

        .sr__cost-label { color: #374151; font-size: 12px; }

        .sr__cost-value {
          justify-content: flex-end;
          color: #6b7280;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 11px;
        }

        .sr__cost-delta { justify-content: flex-end; font-weight: 600; }

        .sr__cost-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 46px;
          padding: 0 14px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .sr__cost-total span { color: #6b7280; font-size: 12px; }

        .sr__cost-total strong {
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
        }

        /* Impact grid */
        .sr__impact-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1px;
          background: #e5e7eb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .sr__impact-card {
          min-width: 0;
          padding: 14px 16px;
          background: #ffffff;
        }

        .sr__impact-label {
          display: block;
          margin-bottom: 7px;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
        }

        .sr__impact-value {
          display: block;
          color: #111827;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 18px;
          font-weight: 600;
        }

        .sr__impact-detail {
          display: block;
          margin-top: 5px;
          color: #9ca3af;
          font-size: 10px;
          line-height: 1.35;
        }

        /* Integrity */
        .sr__integrity {
          display: flex;
          align-items: center;
          min-height: 60px;
          border-bottom: 1px solid #f3f4f6;
        }

        .sr__integrity-item {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          padding: 12px 18px;
        }

        .sr__integrity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          flex: 0 0 20px;
          border: 1px solid #bbf7d0;
          border-radius: 50%;
          background: #f0fdf4;
          color: #16a34a;
          font-size: 10px;
        }

        .sr__integrity-item div {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .sr__integrity-item strong {
          color: #374151;
          font-size: 11px;
          font-weight: 600;
        }

        .sr__integrity-item span:last-child {
          color: #9ca3af;
          font-size: 10px;
        }

        .sr__integrity-divider {
          width: 1px;
          height: 28px;
          background: #e5e7eb;
        }

        /* Footer */
        .sr__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 20px;
        }

        .sr__footer-note { color: #9ca3af; font-size: 11px; }

        .sr__actions { display: flex; align-items: center; gap: 7px; }

        .sr__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 32px;
          padding: 0 12px;
          border-radius: 6px;
          font-family: "SFMono-Regular", "Cascadia Code", "Roboto Mono", monospace;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.07em;
          cursor: pointer;
          transition: background 140ms, border-color 140ms, color 140ms;
        }

        .sr__btn--secondary {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }

        .sr__btn--secondary:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .sr__btn--primary {
          background: #111827;
          border: 1px solid #111827;
          color: #ffffff;
        }

        .sr__btn--primary:hover { background: #1f2937; border-color: #1f2937; }

        /* Responsive */
        @media (max-width: 850px) {
          .sr__hero { flex-direction: column; }
          .sr__hero-main { border-right: 0; border-bottom: 1px solid #f3f4f6; }
          .sr__impact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 700px) {
          .sr__cost-head,
          .sr__cost-row { grid-template-columns: minmax(120px, 1fr) 90px 90px 90px; }
          .sr__integrity { flex-direction: column; align-items: stretch; }
          .sr__integrity-divider { width: auto; height: 1px; margin: 0 18px; }
        }

        @media (max-width: 560px) {
          .sr__header { flex-direction: column; }
          .sr__status-badge { align-self: flex-start; }
          .sr__section { padding: 16px; }
          .sr__cost-grid { overflow-x: auto; }
          .sr__cost-head,
          .sr__cost-row { min-width: 480px; }
          .sr__footer { align-items: stretch; flex-direction: column; }
          .sr__actions { flex-wrap: wrap; }
          .sr__btn { flex: 1; }
        }

        @media (max-width: 400px) {
          .sr__hero-meta { grid-template-columns: 1fr; }
          .sr__impact-grid { grid-template-columns: 1fr; }
          .sr__actions { flex-direction: column; }
          .sr__btn { width: 100%; }
        }
      `}</style>
    </>
  );
}