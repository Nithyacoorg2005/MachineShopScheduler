import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import DashboardLayout from "../components/layout/DashboardLayout";

import ConstraintStatus from "../components/dashboard/ConstraintStatus";
import CostSummary from "../components/dashboard/CostSummary";
import KPICard from "../components/dashboard/KPICard";
import ScenarioImpact from "../components/dashboard/ScenarioImpact";

import ScenarioPanel from "../components/scenarios/ScenarioPanel";
import ScenarioResult from "../components/scenarios/ScenarioResult";

import GanttChart from "../components/schedule/GanttChart";
import ScheduleLegend from "../components/schedule/ScheduleLegend";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api";

const DEFAULT_SCENARIO = {
  context: {
    current_time: "2026-08-25T11:00:00Z",
    active_shift: "A",
  },

  events: [
    {
      event_type: "MACHINE_BREAKDOWN",
      target_id: "GRINDER-01",
      start_time: "2026-08-25T11:00:00Z",
      duration_hours: 8,
      impact: "HALT_OPERATIONS",
      notes:
        "Spindle failure. No grinding operations can occur during this window.",
    },
    {
      event_type: "OPERATOR_ABSENCE",
      target_id: "OP-001",
      start_time: "2026-08-25T06:00:00Z",
      duration_hours: 8.5,
      impact: "REMOVE_CAPACITY",
      notes:
        "Certified grinder operator absent for Shift A.",
    },
  ],
};

function normaliseResponse(data) {
  return {
    status: data?.status ?? "success",
    operationsCount:
      data?.operations_count ??
      data?.schedule?.length ??
      0,
    cost: Number(data?.cost ?? 0),
    schedule: Array.isArray(data?.schedule)
      ? data.schedule
      : [],
    diff: data?.diff ?? null,
    costBreakdown:
      data?.cost_breakdown ?? null,
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function calculateScheduleStats(schedule) {
  const machines = new Set();
  const operators = new Set();

  let overtime = 0;

  schedule.forEach((operation) => {
    if (operation.machine_id) {
      machines.add(operation.machine_id);
    }

    if (operation.operator_id) {
      operators.add(operation.operator_id);
    }

    if (operation.is_overtime) {
      overtime += 1;
    }
  });

  return {
    operations: schedule.length,
    machines: machines.size,
    operators: operators.size,
    overtime,
  };
}

export default function Dashboard() {
  const [baseline, setBaseline] = useState(null);
  const [result, setResult] = useState(null);

  const [loadingBaseline, setLoadingBaseline] =
    useState(true);

  const [runningScenario, setRunningScenario] =
    useState(false);

  const [error, setError] = useState("");

  const [scenario, setScenario] =
    useState(DEFAULT_SCENARIO);

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [activeView, setActiveView] =
    useState("schedule");

  const [selectedOperation, setSelectedOperation] =
    useState(null);

  const loadBaseline = useCallback(async () => {
    setLoadingBaseline(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/baseline`
      );

      if (!response.ok) {
        throw new Error(
          `Baseline request failed (${response.status})`
        );
      }

      const data = await response.json();

      setBaseline(normaliseResponse(data));
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load baseline schedule."
      );
    } finally {
      setLoadingBaseline(false);
    }
  }, []);

  useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  const runScenario = useCallback(
    async (scenarioPayload = scenario) => {
      setRunningScenario(true);
      setError("");
      setSelectedOperation(null);

      try {
        const response = await fetch(
          `${API_BASE}/replan`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              scenarioPayload
            ),
          }
        );

        if (!response.ok) {
          let message =
            `Replan request failed (${response.status})`;

          try {
            const body =
              await response.json();

            if (body?.detail) {
              message = body.detail;
            }
          } catch {
            // Keep the HTTP error above.
          }

          throw new Error(message);
        }

        const data = await response.json();

        setResult(normaliseResponse(data));
        setActiveView("result");
      } catch (err) {
        setError(
          err?.message ||
            "Unable to run replanning scenario."
        );
      } finally {
        setRunningScenario(false);
      }
    },
    [scenario]
  );

  const baselineStats = useMemo(
    () =>
      calculateScheduleStats(
        baseline?.schedule ?? []
      ),
    [baseline]
  );

  const resultStats = useMemo(
    () =>
      calculateScheduleStats(
        result?.schedule ?? []
      ),
    [result]
  );

  const displayedSchedule =
    activeView === "result" && result
      ? result.schedule
      : baseline?.schedule ?? [];

  const displayedCost =
    activeView === "result" && result
      ? result.cost
      : baseline?.cost ?? 0;

  const baselineCost =
    baseline?.cost ?? 0;

  const costDelta =
    result?.cost != null
      ? result.cost - baselineCost
      : 0;

  const affectedOperations =
    result?.diff?.impact
      ?.affected_operations ??
    result?.diff?.affected_operations ??
    result?.costBreakdown?.impact
      ?.affected_operations ??
    0;

  const movedOperations =
    result?.diff?.impact
      ?.moved_operations ??
    result?.diff?.moved_operations ??
    result?.costBreakdown?.impact
      ?.moved_operations ??
    0;

  const constraints = useMemo(
    () => ({
      grinder:
        result
          ? !result.schedule.some(
              (operation) =>
                operation.machine_id ===
                  "GRINDER-01" &&
                operation.start_time <
                  "2026-08-25T19:00:00Z" &&
                operation.end_time >
                  "2026-08-25T11:00:00Z"
            )
          : true,

      operationCount:
        displayedSchedule.length === 111,

      duplicates:
        (() => {
          const keys =
            new Set();

          for (const operation of displayedSchedule) {
            const key =
              `${operation.order_id}:${operation.op_seq}`;

            if (keys.has(key)) {
              return false;
            }

            keys.add(key);
          }

          return true;
        })(),

      scheduleLoaded:
        displayedSchedule.length > 0,
    }),
    [displayedSchedule, result]
  );

  const handleScenarioChange =
    useCallback((nextScenario) => {
      setScenario(nextScenario);
    }, []);

  const handleReset = useCallback(() => {
    setScenario(DEFAULT_SCENARIO);
    setResult(null);
    setError("");
    setSelectedOperation(null);
    setActiveView("schedule");
  }, []);

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        <Header
          onMenuClick={() =>
            setSidebarOpen(
              (value) => !value
            )
          }
          scenarioActive={Boolean(result)}
        />

        <div
          className={[
            "dashboard-shell",
            sidebarOpen
              ? "dashboard-shell--sidebar-open"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Sidebar
            open={sidebarOpen}
            activeItem={activeView}
            onItemClick={setActiveView}
          />

          <main className="dashboard-main">
            {/* --------------------------------
                PAGE HEADER
               -------------------------------- */}

            <section className="dashboard-heading">
              <div>
                <div className="dashboard-eyebrow">
                  MACHINE SHOP SCHEDULER
                </div>

                <h1>
                  Production Control
                </h1>

                <p>
                  Baseline schedule,
                  live constraints and
                  scenario re-planning.
                </p>
              </div>

              <div className="dashboard-heading__actions">
                <button
                  type="button"
                  className="dashboard-button dashboard-button--secondary"
                  onClick={loadBaseline}
                  disabled={
                    loadingBaseline ||
                    runningScenario
                  }
                >
                  {loadingBaseline
                    ? "Loading..."
                    : "Refresh baseline"}
                </button>

                <button
                  type="button"
                  className="dashboard-button dashboard-button--primary"
                  onClick={() =>
                    runScenario()
                  }
                  disabled={
                    loadingBaseline ||
                    runningScenario ||
                    !baseline
                  }
                >
                  {runningScenario
                    ? "Re-planning..."
                    : "Run scenario"}
                </button>
              </div>
            </section>

            {/* --------------------------------
                ERROR
               -------------------------------- */}

            {error && (
              <div className="dashboard-error">
                <div>
                  <strong>
                    Request failed
                  </strong>

                  <span>{error}</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* --------------------------------
                KPI STRIP
               -------------------------------- */}

            <section className="dashboard-kpis">
              <KPICard
                label="SCHEDULED OPERATIONS"
                value={
                  displayedSchedule.length
                }
                meta={
                  `${baselineStats.operations} baseline`
                }
              />

              <KPICard
                label="TOTAL COST"
                value={formatCurrency(
                  displayedCost
                )}
                meta={
                  result
                    ? `${costDelta >= 0 ? "+" : ""}${formatCurrency(costDelta)} vs baseline`
                    : "Baseline"
                }
                trend={
                  result
                    ? costDelta > 0
                      ? "negative"
                      : "positive"
                    : undefined
                }
              />

              <KPICard
                label="AFFECTED OPERATIONS"
                value={
                  result
                    ? affectedOperations
                    : "—"
                }
                meta={
                  result
                    ? `${movedOperations} moved`
                    : "No scenario applied"
                }
              />

              <KPICard
                label="OVERTIME"
                value={
                  result
                    ? resultStats.overtime
                    : baselineStats.overtime
                }
                meta="operations"
              />
            </section>

            {/* --------------------------------
                MAIN GRID
               -------------------------------- */}

            <section className="dashboard-grid">
              <div className="dashboard-grid__primary">
                {/* Schedule */}
                <section className="dashboard-card dashboard-card--schedule">
                  <div className="dashboard-card__header">
                    <div>
                      <div className="dashboard-card__eyebrow">
                        {activeView ===
                        "result"
                          ? "REPLANNED SCHEDULE"
                          : "BASELINE SCHEDULE"}
                      </div>

                      <h2>
                        Production timeline
                      </h2>
                    </div>

                    <div className="dashboard-tabs">
                      <button
                        type="button"
                        className={
                          activeView ===
                          "schedule"
                            ? "is-active"
                            : ""
                        }
                        onClick={() =>
                          setActiveView(
                            "schedule"
                          )
                        }
                      >
                        Baseline
                      </button>

                      <button
                        type="button"
                        className={
                          activeView ===
                          "result"
                            ? "is-active"
                            : ""
                        }
                        disabled={!result}
                        onClick={() =>
                          setActiveView(
                            "result"
                          )
                        }
                      >
                        Replanned
                      </button>
                    </div>
                  </div>

                  <div className="dashboard-card__body dashboard-card__body--gantt">
                    {loadingBaseline ? (
                      <div className="dashboard-empty">
                        Loading validated
                        baseline...
                      </div>
                    ) : displayedSchedule.length ===
                      0 ? (
                      <div className="dashboard-empty">
                        No schedule available.
                      </div>
                    ) : (
                      <>
                        <ScheduleLegend
                          showDowntime={
                            Boolean(result)
                          }
                          showOvertime
                        />

                        <GanttChart
                          schedule={
                            displayedSchedule
                          }
                          selectedOperation={
                            selectedOperation
                          }
                          onOperationClick={
                            setSelectedOperation
                          }
                        />
                      </>
                    )}
                  </div>
                </section>

                {/* Scenario result */}
                {result && (
                  <ScenarioResult
                    result={result}
                    baselineCost={
                      baselineCost
                    }
                    onReset={
                      handleReset
                    }
                  />
                )}
              </div>

              {/* --------------------------------
                  RIGHT RAIL
                 -------------------------------- */}

              <aside className="dashboard-grid__rail">
                <ScenarioPanel
                  scenario={scenario}
                  onScenarioChange={
                    handleScenarioChange
                  }
                  onRun={() =>
                    runScenario()
                  }
                  loading={
                    runningScenario
                  }
                />

                <ConstraintStatus
                  constraints={
                    constraints
                  }
                />

                <CostSummary
                  baselineCost={
                    baselineCost
                  }
                  replannedCost={
                    result?.cost
                  }
                  breakdown={
                    result?.costBreakdown
                  }
                />

                {result && (
                  <ScenarioImpact
                    diff={result.diff}
                    costBreakdown={
                      result.costBreakdown
                    }
                  />
                  )}
              </aside>
            </section>

            {/* --------------------------------
                SELECTED OPERATION
               -------------------------------- */}

            {selectedOperation && (
              <section className="dashboard-operation">
                <div>
                  <span className="dashboard-operation__label">
                    SELECTED OPERATION
                  </span>

                  <strong>
                    {
                      selectedOperation.order_id
                    }{" "}
                    · OP{" "}
                    {
                      selectedOperation.op_seq
                    }
                  </strong>
                </div>

                <div className="dashboard-operation__details">
                  <span>
                    {
                      selectedOperation.operation_type
                    }
                  </span>

                  <span>
                    {
                      selectedOperation.machine_id
                    }
                  </span>

                  <span>
                    {
                      selectedOperation.operator_id
                    }
                  </span>

                  <span>
                    {
                      selectedOperation.duration_minutes
                    }
                    m
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOperation(
                      null
                    )
                  }
                >
                  ×
                </button>
              </section>
            )}
          </main>
        </div>

        <style>{styles}</style>
      </div>
    </DashboardLayout>
  );
}

const styles = `
  .dashboard-page {
    min-height: 100vh;

    background: #080909;
    color: #c4c8c6;

    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  .dashboard-shell {
    display: flex;

    min-height: calc(100vh - 56px);
  }

  .dashboard-main {
    min-width: 0;
    flex: 1;

    padding: 28px;

    overflow-x: hidden;
  }

  /* --------------------------------
     HEADER
     -------------------------------- */

  .dashboard-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    gap: 24px;

    margin-bottom: 22px;
  }

  .dashboard-eyebrow {
    margin-bottom: 8px;

    color: #596064;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 7px;
    font-weight: 700;

    letter-spacing: 0.16em;
  }

  .dashboard-heading h1 {
    margin: 0;

    color: #d2d5d3;

    font-size: 22px;
    font-weight: 500;

    letter-spacing: -0.03em;
  }

  .dashboard-heading p {
    margin: 7px 0 0;

    color: #60676a;

    font-size: 10px;
    line-height: 1.5;
  }

  .dashboard-heading__actions {
    display: flex;
    gap: 8px;

    flex: 0 0 auto;
  }

  .dashboard-button {
    height: 34px;

    padding: 0 13px;

    border-radius: 5px;

    font-size: 8px;
    font-weight: 600;

    cursor: pointer;

    transition:
      background 120ms ease,
      border-color 120ms ease,
      opacity 120ms ease;
  }

  .dashboard-button:disabled {
    opacity: 0.45;

    cursor: not-allowed;
  }

  .dashboard-button--secondary {
    border: 1px solid #292d30;

    background: #101213;
    color: #858c8e;
  }

  .dashboard-button--secondary:hover:not(:disabled) {
    border-color: #3b4144;

    background: #141617;
  }

  .dashboard-button--primary {
    border: 1px solid #626a69;

    background: #d0d4d1;
    color: #111313;
  }

  .dashboard-button--primary:hover:not(:disabled) {
    background: #e0e3e1;
  }

  /* --------------------------------
     ERROR
     -------------------------------- */

  .dashboard-error {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 20px;

    margin-bottom: 18px;
    padding: 11px 13px;

    border: 1px solid #453832;
    border-radius: 5px;

    background: #15100e;
  }

  .dashboard-error > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dashboard-error strong {
    color: #aa9589;

    font-size: 8px;
    font-weight: 600;
  }

  .dashboard-error span {
    color: #70625b;

    font-size: 8px;
  }

  .dashboard-error button {
    border: 0;

    background: transparent;
    color: #74675f;

    font-size: 7px;

    cursor: pointer;
  }

  /* --------------------------------
     KPI
     -------------------------------- */

  .dashboard-kpis {
    display: grid;

    grid-template-columns:
      repeat(4, minmax(0, 1fr));

    gap: 9px;

    margin-bottom: 14px;
  }

  /* --------------------------------
     GRID
     -------------------------------- */

  .dashboard-grid {
    display: grid;

    grid-template-columns:
      minmax(0, 1fr)
      300px;

    align-items: start;

    gap: 14px;
  }

  .dashboard-grid__primary {
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .dashboard-grid__rail {
    display: flex;
    flex-direction: column;
    gap: 10px;

    min-width: 0;
  }

  /* --------------------------------
     CARDS
     -------------------------------- */

  .dashboard-card {
    overflow: hidden;

    border: 1px solid #202326;
    border-radius: 6px;

    background: #0c0d0e;
  }

  .dashboard-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 15px;

    min-height: 65px;

    padding: 0 17px;

    border-bottom: 1px solid #202326;
  }

  .dashboard-card__eyebrow {
    margin-bottom: 5px;

    color: #50575a;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 6px;
    font-weight: 700;

    letter-spacing: 0.14em;
  }

  .dashboard-card__header h2 {
    margin: 0;

    color: #aeb3b1;

    font-size: 12px;
    font-weight: 500;
  }

  .dashboard-card__body {
    padding: 14px;
  }

  .dashboard-card__body--gantt {
    padding: 0;
  }

  .dashboard-tabs {
    display: flex;

    border: 1px solid #272b2d;
    border-radius: 4px;

    overflow: hidden;
  }

  .dashboard-tabs button {
    height: 27px;

    padding: 0 9px;

    border: 0;

    border-right: 1px solid #272b2d;

    background: #0d0f10;
    color: #555d60;

    font-size: 7px;

    cursor: pointer;
  }

  .dashboard-tabs button:last-child {
    border-right: 0;
  }

  .dashboard-tabs button:hover:not(:disabled) {
    background: #131516;
    color: #808789;
  }

  .dashboard-tabs button.is-active {
    background: #181a1b;
    color: #b0b5b3;
  }

  .dashboard-tabs button:disabled {
    opacity: 0.35;

    cursor: not-allowed;
  }

  /* --------------------------------
     EMPTY
     -------------------------------- */

  .dashboard-empty {
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 300px;

    color: #4c5356;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 8px;
  }

  /* --------------------------------
     SELECTED OPERATION
     -------------------------------- */

  .dashboard-operation {
    position: fixed;
    right: 24px;
    bottom: 20px;
    left: 24px;

    z-index: 30;

    display: flex;
    align-items: center;
    gap: 22px;

    min-height: 52px;

    padding: 8px 13px;

    border: 1px solid #363b3d;
    border-radius: 6px;

    background: #111314;

    box-shadow:
      0 12px 35px
      rgba(0, 0, 0, 0.45);
  }

  .dashboard-operation > div:first-child {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .dashboard-operation__label {
    color: #4e5659;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 5px;
    font-weight: 700;

    letter-spacing: 0.13em;
  }

  .dashboard-operation strong {
    color: #b8bdba;

    font-size: 8px;
    font-weight: 600;
  }

  .dashboard-operation__details {
    display: flex;
    align-items: center;
    gap: 7px;

    margin-left: auto;
  }

  .dashboard-operation__details span {
    padding: 5px 7px;

    border: 1px solid #292e30;
    border-radius: 3px;

    background: #0b0c0d;

    color: #686f72;

    font-family:
      "SFMono-Regular",
      "Cascadia Code",
      "Roboto Mono",
      monospace;

    font-size: 6px;
  }

  .dashboard-operation > button {
    width: 25px;
    height: 25px;

    border: 1px solid #292e30;
    border-radius: 4px;

    background: #0c0e0f;
    color: #70777a;

    font-size: 14px;

    cursor: pointer;
  }

  .dashboard-operation > button:hover {
    background: #17191a;
    color: #b1b6b4;
  }

  /* --------------------------------
     RESPONSIVE
     -------------------------------- */

  @media (max-width: 1200px) {
    .dashboard-grid {
      grid-template-columns:
        minmax(0, 1fr)
        270px;
    }

    .dashboard-main {
      padding: 22px;
    }
  }

  @media (max-width: 980px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-grid__rail {
      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .dashboard-main {
      padding: 15px;
    }

    .dashboard-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .dashboard-heading__actions {
      width: 100%;
    }

    .dashboard-button {
      flex: 1;
    }

    .dashboard-kpis {
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
    }

    .dashboard-grid__rail {
      grid-template-columns: 1fr;
    }

    .dashboard-operation {
      right: 12px;
      bottom: 12px;
      left: 12px;

      align-items: flex-start;
      flex-direction: column;

      gap: 8px;
    }

    .dashboard-operation__details {
      margin-left: 0;

      flex-wrap: wrap;
    }
  }

  @media (max-width: 480px) {
    .dashboard-kpis {
      grid-template-columns: 1fr;
    }

    .dashboard-card__header {
      align-items: flex-start;
      flex-direction: column;

      padding-top: 13px;
      padding-bottom: 13px;
    }
  }
`;
