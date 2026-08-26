import type { ReactNode } from "react";

export type KPITrend = "positive" | "negative" | "neutral";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
  trend?: KPITrend;
  trendValue?: string;
  icon?: ReactNode;
  accent?: boolean;
  loading?: boolean;
}

export default function KPICard({
  label,
  value,
  unit,
  detail,
  trend = "neutral",
  trendValue,
  icon,
  accent = false,
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <article className="kpi-card kpi-card--loading">
        <div className="kpi-card__header">
          <span className="kpi-card__skeleton kpi-card__skeleton--label" />
        </div>

        <span className="kpi-card__skeleton kpi-card__skeleton--value" />

        <span className="kpi-card__skeleton kpi-card__skeleton--detail" />
      </article>
    );
  }

  return (
    <article
      className={`kpi-card ${
        accent ? "kpi-card--accent" : ""
      }`}
    >
      <div className="kpi-card__header">
        <div className="kpi-card__label">
          {label}
        </div>

        {icon && (
          <div className="kpi-card__icon">
            {icon}
          </div>
        )}
      </div>

      <div className="kpi-card__main">
        <span className="kpi-card__value">
          {value}
        </span>

        {unit && (
          <span className="kpi-card__unit">
            {unit}
          </span>
        )}
      </div>

      {(detail || trendValue) && (
        <div className="kpi-card__footer">
          {detail && (
            <span className="kpi-card__detail">
              {detail}
            </span>
          )}

          {trendValue && (
            <span
              className={`kpi-card__trend kpi-card__trend--${trend}`}
            >
              {trend === "positive" && "↓ "}
              {trend === "negative" && "↑ "}
              {trendValue}
            </span>
          )}
        </div>
      )}
    </article>
  );
}