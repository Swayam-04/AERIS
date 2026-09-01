# Cursor / AI Coding Rules --- SIH 26054

## Project Identity

This repository implements SIH 26054: an AI-enabled real-time digital
twin system for health monitoring, fault prediction and mission
reliability enhancement of aero-piston engines used in MALE UAVs.

## Non-Negotiable Engineering Principles

1.  Build the engine simulation and telemetry foundation before
    polishing advanced AI.
2.  Treat the solution as **Physics + ML + Digital Twin**, not as an AI
    dashboard.
3.  Keep the simulator, physics model, ML models, digital-twin service,
    APIs and UI modular.
4.  Never claim simulated data is real DRDO/field telemetry.
5.  Never invent engine specifications, validated failure thresholds,
    RUL accuracy or operational performance.
6.  The prototype must never send control commands to a real engine/UAV.
7.  Prefer explainable residuals and evidence alongside ML scores.
8.  Preserve reproducibility: seed simulations, version scenarios and
    record model versions.
9.  Keep domain assumptions explicit in code and documentation.
10. Do not overbuild infrastructure before the end-to-end prototype
    works.

## Repository Boundaries

Recommended structure: - `frontend/` --- React/TypeScript dashboard
only. - `backend/` --- FastAPI/API orchestration. - `simulator/` ---
deterministic engine and mission simulation. - `physics/` ---
physics-informed expected-state models. - `ml/` --- anomaly, diagnosis
and RUL models. - `digital_twin/` --- twin state and residual
calculations. - `analytics/` --- mission reliability and derived
metrics. - `data/` --- schemas and local demo data only; never commit
sensitive telemetry. - `docs/` --- PRD, SRS, design, architecture and
phase plans. - `models/` --- versioned model metadata/artifacts; do not
commit secrets. - `tests/` --- unit, integration and scenario tests.

## Data Rules

Every telemetry record should have: - timestamp - engine_id -
mission_id - mission_phase - parameter values - source type
(`simulated`, `imported`, `real_validated`) - schema/model version

Centralize parameter names, units and valid ranges.

Handle missing, delayed, malformed and out-of-range values explicitly.

## AI/ML Rules

Use a layered approach: 1. physics/range checks 2. observed-vs-expected
residuals 3. multivariate anomaly detection 4. fault diagnosis 5.
degradation/RUL estimation

Do not use an LLM as the primary engine-health detector.

Every prediction shown in the UI should expose: - prediction -
confidence/score where meaningful - supporting signals - assumptions -
model version - data provenance

## Digital Twin Rules

The twin must maintain: - observed state - expected state - residual
state - health state - fault state - degradation state - mission state

The UI should visualize the relationship between observed and expected
behaviour.

## Simulation Rules

The simulator must support: - normal operation - takeoff - climb -
cruise - loiter - return - landing - controlled fault injection -
deterministic replay - what-if scenarios

Initial fault scenarios may include misfire, injector abnormality,
lubrication/oil-pressure issues, overheating, abnormal vibration, sensor
drift/failure and combustion instability.

## Frontend Rules

-   Do not place business logic or ML logic inside React components.
-   Use API/service layers.
-   Use a consistent design system.
-   Prioritize engine health, digital-twin state, alerts, mission state
    and trends.
-   Avoid decorative 3D effects that do not communicate engineering
    information.
-   The 3D MALE UAV should be a visualization/mission context, not a
    weapon or targeting interface.
-   All live-looking demo data must be visibly identified as simulated
    when applicable.

## Security Rules

-   No secrets in source code.
-   Use environment variables/secrets management.
-   Authenticate and authorize administrative/model-management actions.
-   Log important actions and model versions.
-   No real aircraft control endpoints.
-   Treat uploaded telemetry as potentially sensitive.

## Testing Rules

Before declaring a feature complete: - unit test core calculations -
test telemetry validation - test simulator determinism - test fault
injection - test API contracts - test twin synchronization - test alert
generation - test replay - test UI loading/error/empty states - test
mobile responsiveness

## Change Management

Before major refactors: 1. inspect dependencies 2. preserve working
interfaces where possible 3. update relevant documentation 4. run tests
5. report what changed and why

When adding a dependency, justify it in the architecture notes.

## Definition of Done

A feature is not done if it only looks correct.

It must: - work end-to-end - have clear data provenance - have
meaningful error handling - be testable - be documented - avoid
unsupported claims
