import React, { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import ScenarioCard from "../components/scenarios/ScenarioCard";
import ScenarioPanel from "../components/scenarios/ScenarioPanel";
import ScenarioResult from "../components/scenarios/ScenarioResult";
import type { ScenarioResultProps } from "../components/scenarios/ScenarioResult";

const API_BASE = "http://127.0.0.1:8000/api";

const SCENARIOS = [
  {
    id: "grinder-failure-operator-absence",
    name: "Grinder Failure + Operator Absence",
    description:
      "Simulates a concurrent GRINDER-01 breakdown and OP-001 absence during shift A. Tests the scheduler's ability to reroute grinding ops and reassign operators under dual constraint pressure.",
    currentTime: "2026-08-25T16:30:00Z",
    activeShift: "A",
    events: [
      {
        event_type: "MACHINE_BREAKDOWN",
        target_id: "GRINDER-01",
        start_time: "2026-08-25T11:00:00Z",
        duration_hours: 8,
        impact: "High — blocks all grinding ops",
        notes: "Bearing failure reported at shift start.",
      },
      {
        event_type: "OPERATOR_ABSENCE",
        target_id: "OP-001",
        start_time: "2026-08-25T11:30:00Z",
        duration_hours: 8.5,
        impact: "Medium — reduces lathe capacity",
      },
    ],
  },
  {
    id: "peak-demand-surge",
    name: "Peak Demand Surge",
    description:
      "Stress-tests the schedule under a high-priority order injection during an already loaded shift. Validates EDD dispatcher behaviour at capacity limits.",
    currentTime: "2026-08-26T08:00:00Z",
    activeShift: "B",
    events: [
      {
        event_type: "PRIORITY_ORDER",
        target_id: "ORD-999",
        start_time: "2026-08-26T08:00:00Z",
        duration_hours: 12,
        impact: "High — displaces lower-priority ops",
      },
    ],
  },
  {
    id: "multi-machine-maintenance",
    name: "Multi-Machine Maintenance Window",
    description:
      "Scheduled preventive maintenance across MILL-01 and DRILL-02 simultaneously. Evaluates schedule feasibility with two machines offline for an extended window.",
    currentTime: "2026-08-27T06:00:00Z",
    activeShift: "A",
    events: [
      {
        event_type: "MACHINE_BREAKDOWN",
        target_id: "MILL-01",
        start_time: "2026-08-27T06:00:00Z",
        duration_hours: 6,
        impact: "Medium — milling queue delayed",
      },
      {
        event_type: "MACHINE_BREAKDOWN",
        target_id: "DRILL-02",
        start_time: "2026-08-27T06:00:00Z",
        duration_hours: 6,
        impact: "Medium — drill ops rerouted",
      },
    ],
  },
];

type RunResult = Omit<ScenarioResultProps, "onBack" | "onViewSchedule" | "onRunAgain">;

export default function Scenarios() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(SCENARIOS[0].id);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) ?? SCENARIOS[0];

  const handleRun = async () => {
    try {
      setRunning(true);
      setError("");
      setResult(null);

      const payload = {
        context: {
          current_time: activeScenario.currentTime,
          active_shift: activeScenario.activeShift,
        },
        events: activeScenario.events.map((e) => ({
          event_type: e.event_type,
          target_id: e.target_id,
          start_time: e.start_time,
          end_time: e.start_time && e.duration_hours
            ? new Date(
                new Date(e.start_time).getTime() + e.duration_hours * 3600000
              ).toISOString()
            : undefined,
        })),
      };

      const res = await fetch(`${API_BASE}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Replanning failed: ${res.status} ${text}`);
      }

      const data = await res.json();

      setResult({
        status: data.status ?? "success",
        operationsCount: data.operations_count ?? 0,
        cost: data.cost ?? 0,
        costBreakdown: data.cost_breakdown,
        diff: data.diff,
      });
    } catch (err) {
      console.error(err);
      setError("Replanning failed. Check that the FastAPI server is running.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
    }}>
      <Sidebar />

      <div style={{
        marginLeft: 238,
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        background: "#f8f9fb",
      }}>
        {/* Topbar */}
        <header style={{
          height: 60,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af" }}>
            <span>Control Room</span>
            <span style={{ color: "#e5e7eb" }}>/</span>
            <span style={{ color: "#374151", fontWeight: 500 }}>Scenarios</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            Engine connected
          </div>
        </header>

        {/* Page header */}
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "24px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" }}>
                Scenario Planning
              </div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em" }}>
                Scenarios
              </h1>
              <p style={{ margin: "5px 0 0", fontSize: 13, color: "#9ca3af" }}>
                Configure and run disruption scenarios against the live schedule.
              </p>
            </div>
            <div style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              fontSize: 11,
              color: "#6b7280",
              fontWeight: 500,
            }}>
              {SCENARIOS.length} scenarios
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px", flex: 1 }}>

          {/* Error */}
          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 20,
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

            {/* Left — scenario cards + result */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Scenario cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SCENARIOS.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => { setActiveScenarioId(scenario.id); setResult(null); setError(""); }}
                    style={{ cursor: "pointer" }}
                  >
                    <ScenarioCard
                      name={scenario.name}
                      description={scenario.description}
                      scenarioId={scenario.id}
                      status={
                        result && activeScenarioId === scenario.id
                          ? "completed"
                          : activeScenarioId === scenario.id
                          ? running ? "active" : "ready"
                          : "ready"
                      }
                      events={scenario.events}
                      onRun={activeScenarioId === scenario.id ? handleRun : () => setActiveScenarioId(scenario.id)}
                      running={running && activeScenarioId === scenario.id}
                    />
                  </div>
                ))}
              </div>

              {/* Result panel */}
              {result && (
                <ScenarioResult
                  {...result}
                  onBack={() => setResult(null)}
                  onRunAgain={() => { setResult(null); handleRun(); }}
                />
              )}
            </div>

            {/* Right — active scenario panel */}
            <div style={{ position: "sticky", top: 24 }}>
              <ScenarioPanel
                scenarioId={activeScenario.id}
                name={activeScenario.name}
                description={activeScenario.description}
                currentTime={activeScenario.currentTime}
                activeShift={activeScenario.activeShift}
                events={activeScenario.events}
                onRun={handleRun}
                running={running}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}