# Machine Shop Scheduler

A constraint-based production scheduling and dynamic replanning system for machine-shop operations.

The system generates a baseline production schedule using EDD (Earliest Due Date) dispatching, evaluates disruption scenarios, and automatically replans the schedule when machines break down or operators become unavailable — preserving completed operations, enforcing hard constraints, and minimising incremental cost.

---

## What it does

A machine shop runs orders across multiple machines and operators. When a disruption occurs mid-shift — a machine breakdown, an operator absence, a maintenance window — the current schedule becomes infeasible. This system detects which operations are affected, locks completed work, and generates a revised schedule in real time.

The result is a full cost comparison between the baseline and replanned schedule, with constraint validation proving the new schedule is feasible.

---

## System architecture

```
React Frontend (Vite + TypeScript)
        │
        │  REST API
        ▼
FastAPI Backend
        │
        ▼
Scheduling Engine
  ├── EDD Dispatcher       — generates baseline schedule
  ├── Replanner            — classifies, locks, reruns affected ops
  ├── Optimizer            — reschedules affected operations
  ├── CostEvaluator        — computes late penalty, overtime, changeover, stability
  ├── CostBreakdown        — compares baseline vs replanned
  └── ScheduleDiff         — reports moved / affected operations
        │
        ▼
baseline.json (production data)
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, React Router |
| Backend | Python, FastAPI |
| Scheduling | EDD dispatching, constraint-based replanning |
| Data | JSON (machines, operators, orders, routing) |

---

## Project structure

```
machine-shop-scheduler/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── CostSummary.tsx
│   │   │   │   ├── ConstraintStatus.tsx
│   │   │   │   └── ScenarioImpact.tsx
│   │   │   ├── schedule/
│   │   │   │   ├── GanttRow.tsx
│   │   │   │   ├── GanttChart.tsx
│   │   │   │   ├── Timeline.tsx
│   │   │   │   ├── OperationBlock.tsx
│   │   │   │   └── ScheduleLegend.tsx
│   │   │   └── scenarios/
│   │   │       ├── ScenarioCard.tsx
│   │   │       ├── ScenarioPanel.tsx
│   │   │       └── ScenarioResult.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Schedule.tsx
│   │   │   └── Scenarios.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── src/
│   ├── api/
│   │   └── routes.py
│   ├── engine/
│   │   ├── dispatcher.py
│   │   ├── replanner.py
│   │   ├── optimizer.py
│   │   ├── cost_evaluator.py
│   │   ├── cost_breakdown.py
│   │   └── schedule_diff.py
│   └── models/
│       ├── machine.py
│       ├── operator.py
│       ├── order.py
│       └── routing.py
├── data/
│   └── generated/
│       └── baseline.json
├── main.py
└── README.md
```

---

## Running the project

### 1. Clone

```bash
git clone <repository-url>
cd machine-shop-scheduler
```

### 2. Backend

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
```

Backend runs at `http://127.0.0.1:8000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## API

### `GET /api/baseline`

Runs the EDD dispatcher against production data and returns the baseline schedule with cost breakdown.

```json
{
  "status": "success",
  "operations_count": 111,
  "cost": 112314.17,
  "cost_breakdown": {
    "late_penalty": 0,
    "overtime_cost": 0,
    "changeover_cost": 112314.17,
    "stability_penalty": 0,
    "total_cost": 112314.17
  },
  "schedule": [ ... ]
}
```

### `POST /api/replan`

Applies a disruption scenario and returns the replanned schedule with a full cost and diff report.

**Request body:**

```json
{
  "context": {
    "current_time": "2026-08-25T16:30:00Z",
    "active_shift": "A"
  },
  "events": [
    {
      "event_type": "MACHINE_BREAKDOWN",
      "target_id": "GRINDER-01",
      "start_time": "2026-08-25T11:00:00Z",
      "duration_hours": 8
    },
    {
      "event_type": "OPERATOR_ABSENCE",
      "target_id": "OP-001",
      "start_time": "2026-08-25T11:30:00Z",
      "duration_hours": 8.5
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "operations_count": 111,
  "cost": 113260.83,
  "cost_breakdown": {
    "baseline": { "total_cost": 112314.17, ... },
    "replanned": { "total_cost": 113260.83, "stability_penalty": 500, ... },
    "delta": { "incremental_cost": 1446.66, "stability_penalty": 500, ... }
  },
  "diff": {
    "affected_operations": 12,
    "moved_operations": 7,
    "total_completion_delay_hours": 2.5,
    "max_completion_delay_hours": 1.0
  },
  "schedule": [ ... ]
}
```

---

## Supported event types

| Event type | Target | Effect |
|---|---|---|
| `MACHINE_BREAKDOWN` | Machine ID | Marks machine as DOWN, blocks its time window, reruns affected ops |
| `OPERATOR_ABSENCE` | Operator ID | Removes operator from available pool |
| `MATERIAL_DELAY` | Order ID | Flags order ops as affected |
| `REWORK_GENERATED` | Order ID | Flags order ops as affected |

---

## Scheduling workflow

```
baseline.json
      │
      ▼
EDD Dispatcher
  → assigns ops to machines by earliest due date
  → respects machine capacity and operator availability
      │
      ▼
Baseline Schedule
      │
      ▼
Disruption Scenario (user-selected)
      │
      ▼
Replanner
  → classifies ops: completed / in-progress / future
  → locks completed and interrupted ops
  → identifies affected ops (machine, operator, order)
  → preserves unaffected future ops
  → applies downtime constraints to optimizer
      │
      ▼
Optimizer
  → reschedules affected ops around constraints
      │
      ▼
CostBreakdown
  → late penalty, overtime, changeover, stability penalty
  → baseline vs replanned comparison
  → incremental cost = replanned_total − baseline_total
      │
      ▼
ScheduleDiff
  → counts moved and affected ops
  → calculates completion delay
      │
      ▼
Constraint Validation
  → operation count preserved
  → no duplicate operation keys
  → no machine constraint violations
```

---

## Cost model

| Component | Description |
|---|---|
| Late penalty | Cost per hour an order completes past its due date |
| Overtime cost | Cost of operations scheduled outside regular shift hours |
| Changeover cost | Cost of switching between operation types on a machine |
| Stability penalty | Penalty for deviating from the baseline schedule (replanning only) |
| **Incremental cost** | `replanned_total − baseline_total` — the net cost of the disruption |

The stability penalty is intentional: it discourages unnecessary movement of operations when replanning. An operation that does not need to move should stay put.

---

## Pages

### `/dashboard` — Operations Dashboard

- KPI cards: scheduled ops, baseline cost, affected ops, incremental cost
- Production timeline grouped by machine with operation type colour coding
- Active scenario panel with event queue
- Replanning result and constraint validation

### `/schedule` — Schedule View

- Gantt chart of the full production schedule
- Filter by machine, operator, search by order ID
- Overtime-only filter
- Timeline with tick marks

### `/scenarios` — Scenario Planning

- Scenario cards for each disruption type
- Scenario configuration panel with expandable event details
- Run replanning and view full cost breakdown and schedule impact

---

## Scenarios

### Grinder Failure + Operator Absence

Concurrent `GRINDER-01` breakdown and `OP-001` absence during shift A. Tests the scheduler's ability to reroute grinding operations and reassign available operators under dual constraint pressure.

### Peak Demand Surge

High-priority order injection during a loaded shift B. Tests EDD dispatcher behaviour at capacity limits.

### Multi-Machine Maintenance Window

Simultaneous `MILL-01` and `DRILL-02` maintenance. Tests schedule feasibility with two machines offline concurrently.

---

## Constraint guarantees

The replanner enforces the following hard constraints on every replan:

1. Completed operations are never moved
2. The total operation count matches the baseline — no operations are lost
3. No duplicate operation keys in the final schedule
4. Machine downtime windows are respected
5. Operator availability is enforced
6. Operation precedence within an order is maintained

If any of these are violated, the replanner raises a `RuntimeError` and the API returns a 500.

---

## Honest scope

This is a constraint-based scheduling system, not an AI or ML system. The dispatcher uses EDD (Earliest Due Date) — a classical operations research heuristic. The replanner uses rule-based classification and a deterministic optimizer.

It does not use machine learning, neural networks, or reinforcement learning.

---

## Status

| Component | Status |
|---|---|
| EDD Dispatcher | ✓ Complete |
| Replanner | ✓ Complete |
| Cost Model | ✓ Complete |
| Constraint Validation | ✓ Complete |
| Operations Dashboard | ✓ Complete |
| Schedule Gantt View | ✓ Complete |
| Scenario Planning | ✓ Complete |
| Machines Page | Planned |
| Real-time updates (WebSocket) | Future |
| Persistent storage | Future |
| Predictive failure detection | Future |

