# Product Requirements Document --- SIH 26054

## 1. Product

**Working name:** AeroTwin --- AI-Enabled Real-Time Digital Twin for
MALE UAV Aero-Piston Engines

## 2. Product Goal

Build a software platform that maintains a real-time virtual
representation of an aero-piston engine, combines physics-informed
modelling with AI/ML, monitors engine health, detects and diagnoses
developing faults, estimates remaining useful life under documented
assumptions, evaluates mission reliability and presents actionable
information through a professional dashboard.

## 3. Problem

The SIH 26054 challenge calls for a digital-twin approach to health
monitoring, fault prediction and mission reliability enhancement for
aero-piston engines used in MALE UAVs.

## 4. Product Vision

**Telemetry → Physics + ML → Digital Twin → Health → Fault/RUL → Mission
Reliability → Alerts & Recommendations**

The system should make engine behaviour understandable before, during
and after a mission.

## 5. Users

### UAV Operator

Needs immediate engine status, alerts, mission state and understandable
recommendations.

### Maintenance Engineer

Needs trends, fault evidence, residuals, replay and degradation
information.

### Reliability/Analysis Engineer

Needs mission comparison, what-if analysis, scenario replay and
reliability analytics.

### Administrator

Needs controlled access, model/scenario management, auditability and
data provenance.

## 6. Core Value

The product should answer: - Is the engine behaving as expected? - If
not, what is deviating? - What fault could explain the deviation? - How
severe is the issue? - How is the issue evolving? - What is the
estimated remaining useful life under the model assumptions? - What
happened during the mission? - What would happen under a different
scenario?

## 7. Core Features

### F1 --- Telemetry Acquisition

Ingest simulated telemetry initially, with an adapter architecture for
compatible future telemetry sources.

### F2 --- Physics-Informed Engine Model

Estimate expected engine behaviour from operating conditions.

### F3 --- Digital Twin

Synchronize observed telemetry with the expected model and maintain
residuals.

### F4 --- Health Monitoring

Provide parameter trends and an overall health representation.

### F5 --- Anomaly Detection

Detect multivariate behaviour that deviates from normal operation.

### F6 --- Fault Diagnosis

Rank candidate fault classes using telemetry evidence.

### F7 --- RUL Estimation

Estimate remaining useful life using a documented prototype degradation
approach.

### F8 --- Mission Simulation

Simulate mission phases and operating conditions.

### F9 --- Mission Replay

Replay a recorded mission with telemetry, twin state and alerts
synchronized to a timeline.

### F10 --- What-if Analysis

Run isolated scenarios with changed operating conditions or injected
faults.

### F11 --- Reliability Analytics

Aggregate health and fault behaviour across missions and phases.

### F12 --- Alerts & Recommendations

Generate severity-based, explainable alerts.

### F13 --- 3D MALE UAV Visualization

Provide an interactive generic MALE UAV 3D model to communicate mission
context and engine status. The model is for visualization, not physical
control or targeting.

## 8. Core Telemetry

Initial prototype schema should support: - RPM - CHT - EGT - oil
pressure - oil temperature - fuel flow - vibration - injection timing -
battery/alternator health

Units and validated ranges must be defined centrally and treated as
configurable domain assumptions.

## 9. Primary User Journey

1.  Select/create engine.
2.  Select mission profile.
3.  Start simulation.
4.  Observe live telemetry.
5.  View digital-twin expected vs observed state.
6.  Inject or encounter a controlled fault scenario.
7.  Observe residual growth.
8.  Receive anomaly/fault alert.
9.  Inspect evidence.
10. View health/degradation and RUL estimate.
11. Replay mission.
12. Compare what-if scenario.
13. Review reliability analytics.

## 10. MVP

The MVP is: - deterministic engine simulator - telemetry pipeline -
physics-informed expected-state model - digital twin - health index - at
least two fault scenarios - anomaly detection - explainable alert -
mission replay - dashboard - basic generic 3D MALE UAV visualization

## 11. Success Criteria

-   End-to-end telemetry works.
-   Twin updates in near real time for the demo.
-   Normal and fault scenarios are distinguishable.
-   Alerts show evidence.
-   Replay is deterministic.
-   Demo data is clearly labeled.
-   The architecture can replace simulated telemetry with an approved
    compatible source later.
-   No unsafe control functionality is exposed.

## 12. Product Boundaries

Not included in the prototype: - direct engine/UAV control - autonomous
flight - weapons/targeting functions - certification claims -
unvalidated operational RUL claims - fabricated DRDO telemetry

## 13. Demo Story

A normal mission begins with healthy engine behaviour. A controlled
fault is introduced at a known mission time. The physics model begins to
diverge from observed behaviour, the twin residuals grow, the anomaly
detector raises a warning, the diagnosis module provides candidate
causes and evidence, health/degradation changes, RUL is updated under
stated assumptions, and the operator can replay the event and compare an
alternative scenario.
