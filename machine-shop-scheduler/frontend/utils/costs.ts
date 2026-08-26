// utils/costs.ts

import type {
  CostBreakdown,
  CostComponents,
  CostDelta,
} from "../types/api";

export function formatCurrency(
  value: number | null | undefined
): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(
  value: number | null | undefined
): string {
  const amount = Number(value ?? 0);

  if (Math.abs(amount) >= 1_000_000) {
    return `₹${(amount / 1_000_000).toFixed(1)}M`;
  }

  if (Math.abs(amount) >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`;
  }

  return formatCurrency(amount);
}

export function calculateTotalCost(
  components: CostComponents
): number {
  return (
    Number(components.late_penalty || 0) +
    Number(components.overtime_cost || 0) +
    Number(components.changeover_cost || 0)
  );
}

export function calculateCostDelta(
  baseline: CostComponents,
  replanned: CostComponents
): CostDelta {
  const latePenalty =
    Number(replanned.late_penalty || 0) -
    Number(baseline.late_penalty || 0);

  const overtimeCost =
    Number(replanned.overtime_cost || 0) -
    Number(baseline.overtime_cost || 0);

  const changeoverCost =
    Number(replanned.changeover_cost || 0) -
    Number(baseline.changeover_cost || 0);

  const incrementalCost =
    latePenalty +
    overtimeCost +
    changeoverCost;

  return {
    late_penalty: latePenalty,
    overtime_cost: overtimeCost,
    changeover_cost: changeoverCost,
    stability_penalty: 0,
    incremental_cost: incrementalCost,
  };
}

export function getCostStatus(
  value: number
): "positive" | "negative" | "neutral" {
  if (value > 0) {
    return "negative";
  }

  if (value < 0) {
    return "positive";
  }

  return "neutral";
}

export function getCostStatusLabel(
  value: number
): string {
  if (value > 0) {
    return "Increase";
  }

  if (value < 0) {
    return "Savings";
  }

  return "No change";
}

export function getTotalCost(
  breakdown: CostBreakdown,
  type: "baseline" | "replanned"
): number {
  return calculateTotalCost(
    breakdown[type]
  );
}

export function getIncrementalCost(
  breakdown: CostBreakdown
): number {
  return (
    Number(
      breakdown.delta.incremental_cost || 0
    )
  );
}

export function getCostPercentageChange(
  baseline: number,
  replanned: number
): number {
  if (baseline === 0) {
    return replanned === 0 ? 0 : 100;
  }

  return (
    ((replanned - baseline) /
      Math.abs(baseline)) *
    100
  );
}

export function formatPercentage(
  value: number | null | undefined
): string {
  return `${Number(value ?? 0).toFixed(1)}%`;
}