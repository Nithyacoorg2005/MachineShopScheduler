// pages/Schedule.tsx

import React, { useMemo, useState } from "react";
import GanttChart from "../components/schedule/GanttChart";
import ScheduleLegend from "../components/schedule/ScheduleLegend";

type ScheduleOperation = {
  order_id: string;
  op_seq: number;
  operation_type: string;
  machine_id: string;
  operator_id: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_overtime?: boolean;
};

type ScheduleProps = {
  schedule?: ScheduleOperation[];
  loading?: boolean;
};

const Schedule: React.FC<ScheduleProps> = ({
  schedule = [],
  loading = false,
}) => {
  const [machineFilter, setMachineFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showOvertimeOnly, setShowOvertimeOnly] = useState(false);

  const machines = useMemo(
    () =>
      Array.from(
        new Set(
          schedule
            .map((item) => item.machine_id)
            .filter(Boolean)
        )
      ).sort(),
    [schedule]
  );

  const operators = useMemo(
    () =>
      Array.from(
        new Set(
          schedule
            .map((item) => item.operator_id)
            .filter(Boolean)
        )
      ).sort(),
    [schedule]
  );

  const filteredSchedule = useMemo(() => {
    const query = search.trim().toLowerCase();

    return schedule.filter((operation) => {
      const matchesMachine =
        machineFilter === "ALL" ||
        operation.machine_id === machineFilter;

      const matchesOperator =
        operatorFilter === "ALL" ||
        operation.operator_id === operatorFilter;

      const matchesSearch =
        !query ||
        operation.order_id.toLowerCase().includes(query) ||
        operation.operation_type.toLowerCase().includes(query) ||
        operation.machine_id.toLowerCase().includes(query) ||
        operation.operator_id.toLowerCase().includes(query);

      const matchesOvertime =
        !showOvertimeOnly || operation.is_overtime === true;

      return (
        matchesMachine &&
        matchesOperator &&
        matchesSearch &&
        matchesOvertime
      );
    });
  }, [
    schedule,
    machineFilter,
    operatorFilter,
    search,
    showOvertimeOnly,
  ]);

  const stats = useMemo(() => {
    const operations = filteredSchedule.length;

    const totalMinutes = filteredSchedule.reduce(
      (sum, operation) =>
        sum + Number(operation.duration_minutes || 0),
      0
    );

    const overtime = filteredSchedule.filter(
      (operation) => operation.is_overtime
    ).length;

    const uniqueOrders = new Set(
      filteredSchedule.map((operation) => operation.order_id)
    ).size;

    return {
      operations,
      orders: uniqueOrders,
      hours: totalMinutes / 60,
      overtime,
    };
  }, [filteredSchedule]);

  const clearFilters = () => {
    setMachineFilter("ALL");
    setOperatorFilter("ALL");
    setSearch("");
    setShowOvertimeOnly(false);
  };

  const hasFilters =
    machineFilter !== "ALL" ||
    operatorFilter !== "ALL" ||
    search !== "" ||
    showOvertimeOnly;

  return (
    <div className="min-h-full bg-[#f7f8fa] text-[#16181d]">
      {/* Page header */}
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="px-6 py-5 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a9099]">
                Production planning
              </div>

              <h1 className="text-[26px] font-semibold tracking-[-0.025em] text-[#17191d]">
                Schedule
              </h1>

              <p className="mt-1 text-sm text-[#737983]">
                Production schedule across machines, operators and orders.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-[#e3e5e8] bg-[#fafafa] px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#969ba3]">
                  Operations
                </div>
                <div className="mt-0.5 text-sm font-semibold text-[#22252a]">
                  {stats.operations}
                </div>
              </div>

              <div className="rounded-lg border border-[#e3e5e8] bg-[#fafafa] px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#969ba3]">
                  Orders
                </div>
                <div className="mt-0.5 text-sm font-semibold text-[#22252a]">
                  {stats.orders}
                </div>
              </div>

              <div className="rounded-lg border border-[#e3e5e8] bg-[#fafafa] px-3 py-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#969ba3]">
                  Planned hours
                </div>
                <div className="mt-0.5 text-sm font-semibold text-[#22252a]">
                  {stats.hours.toFixed(1)}h
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-5 lg:px-8">
        <div className="rounded-xl border border-[#e3e5e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
            {/* Search */}
            <div className="relative min-w-0 flex-1 xl:max-w-[340px]">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search orders, machines..."
                className="h-10 w-full rounded-lg border border-[#e2e4e8] bg-[#fafafa] pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a1a6ad] focus:border-[#b7bbc1] focus:bg-white"
              />
            </div>

            {/* Machine */}
            <select
              value={machineFilter}
              onChange={(event) =>
                setMachineFilter(event.target.value)
              }
              className="h-10 rounded-lg border border-[#e2e4e8] bg-white px-3 text-sm text-[#41454c] outline-none focus:border-[#b7bbc1]"
            >
              <option value="ALL">All machines</option>
              {machines.map((machine) => (
                <option key={machine} value={machine}>
                  {machine}
                </option>
              ))}
            </select>

            {/* Operator */}
            <select
              value={operatorFilter}
              onChange={(event) =>
                setOperatorFilter(event.target.value)
              }
              className="h-10 rounded-lg border border-[#e2e4e8] bg-white px-3 text-sm text-[#41454c] outline-none focus:border-[#b7bbc1]"
            >
              <option value="ALL">All operators</option>
              {operators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                setShowOvertimeOnly((current) => !current)
              }
              className={`h-10 rounded-lg border px-3 text-sm font-medium transition ${
                showOvertimeOnly
                  ? "border-[#2f3339] bg-[#2f3339] text-white"
                  : "border-[#e2e4e8] bg-white text-[#555a62] hover:bg-[#f7f7f8]"
              }`}
            >
              Overtime only
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 px-2 text-sm font-medium text-[#747981] hover:text-[#22252a]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="border-t border-[#eef0f2] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-[#777d85]">
                Showing{" "}
                <span className="font-semibold text-[#363a40]">
                  {filteredSchedule.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#363a40]">
                  {schedule.length}
                </span>{" "}
                operations
              </div>

              <ScheduleLegend />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="mt-5 overflow-hidden rounded-xl border border-[#e3e5e8] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {loading ? (
            <div className="flex min-h-[460px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#d9dce0] border-t-[#33373d]" />
                <p className="text-sm text-[#777d85]">
                  Loading schedule...
                </p>
              </div>
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="flex min-h-[460px] items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f2f4]">
                  <svg
                    className="h-5 w-5 text-[#858b93]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-4-4" />
                  </svg>
                </div>

                <h3 className="text-sm font-semibold text-[#34373c]">
                  No operations found
                </h3>

                <p className="mt-1 text-xs text-[#858a91]">
                  Try changing the current filters.
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-xs font-semibold text-[#34373c] underline underline-offset-4"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <GanttChart schedule={filteredSchedule} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;