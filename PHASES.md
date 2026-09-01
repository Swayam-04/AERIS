# Development Phases --- AERIS System

## Phase 0 --- Foundation & Domain Contract

**Goal:** Freeze the vocabulary and data contracts before coding
heavily.

Deliver: - repository structure - PRD/SRS/design/architecture -
telemetry schema - units and assumptions - mission-phase definitions -
fault scenario definitions - API contract - simulation configuration
format

Exit condition: The team agrees on exactly what a telemetry record,
engine state, mission and fault scenario mean.

------------------------------------------------------------------------

## Phase 1 --- Engine Simulator

**Goal:** Build a deterministic virtual aero-piston engine.

Deliver: - normal engine operating model - RPM - CHT - EGT - oil
pressure - oil temperature - fuel flow - vibration - injection timing -
battery/alternator health - mission profiles - deterministic replay

Exit condition: A mission can run from takeoff → climb → cruise → loiter
→ return → landing and produce coherent telemetry.

------------------------------------------------------------------------

## Phase 2 --- Telemetry Pipeline

**Goal:** Move telemetry through the real application pipeline.

Deliver: - telemetry gateway - validation - timestamps - provenance -
storage - streaming - WebSocket updates

Exit condition: Simulator data appears in storage and reaches a live
consumer reliably.

------------------------------------------------------------------------

## Phase 3 --- Physics-Informed Engine Model

**Goal:** Establish expected engine behaviour.

Deliver: - expected-state calculations - parameter relationships -
operating-condition handling - residual calculations - model versioning

Exit condition: The system can show: **Observed vs Expected vs
Residual**.

------------------------------------------------------------------------

## Phase 4 --- Digital Twin

**Goal:** Build the continuously updated virtual engine state.

Deliver: - twin state object - synchronization - health state - residual
state - mission state - historical twin snapshots

Exit condition: Changing simulated telemetry changes the twin
predictably and the UI can inspect the difference.

------------------------------------------------------------------------

## Phase 5 --- Health Monitoring

**Goal:** Turn telemetry and residuals into understandable engine
health.

Deliver: - parameter health - overall health - trend analysis -
data-quality indicators - severity logic

Exit condition: Normal operation is visually and numerically
distinguishable from degraded scenarios.

------------------------------------------------------------------------

## Phase 6 --- Fault Injection & Detection

**Goal:** Demonstrate meaningful fault development.

Deliver: - misfire - injector abnormality - lubrication issue -
overheating - abnormal vibration - sensor drift/failure - controlled
injection interface - anomaly detector

Exit condition: At least two fault scenarios reliably produce detectable
deviations and alerts.

------------------------------------------------------------------------

## Phase 7 --- Fault Diagnosis

**Goal:** Move from "something is wrong" to "what may be wrong".

Deliver: - candidate fault classes - evidence ranking -
confidence/probability where valid - explainability - alert timeline

Exit condition: A fault alert includes the supporting signals and does
not overstate certainty.

------------------------------------------------------------------------

## Phase 8 --- Degradation & RUL

**Goal:** Estimate remaining useful life under explicit assumptions.

Deliver: - degradation features - baseline degradation model - RUL
estimator - uncertainty/range - model metadata - assumption display

Exit condition: RUL changes coherently as a controlled degradation
scenario progresses.

Important: Do not claim certified or field-validated RUL accuracy.

------------------------------------------------------------------------

## Phase 9 --- Mission Reliability & What-if

**Goal:** Connect engine health to mission reliability.

Deliver: - mission reliability metrics - mission-phase analytics -
mission comparison - what-if scenarios - scenario difference view

Exit condition: A baseline mission can be compared against a
degraded/faulted scenario.

------------------------------------------------------------------------

## Phase 10 --- 3D MALE UAV Integration

**Goal:** Add a lightweight, interactive 3D mission context.

Deliver: - generic MALE UAV `.glb` - Three.js viewer - camera controls -
engine highlight - health/alert overlays - mission-phase indicator -
telemetry hotspots

Exit condition: The model responds visually to engine/mission state
without becoming a control interface.

------------------------------------------------------------------------

## Phase 11 --- Mission Dashboard

**Goal:** Turn the working backend into a polished demonstration.

Deliver: - overview - live telemetry - digital twin - health - alerts -
RUL - mission control - replay - what-if - reliability analytics - 3D
UAV view

Exit condition: A judge can understand the full solution without
developer intervention.

------------------------------------------------------------------------

## Phase 12 --- Hardening

**Goal:** Make the prototype reliable.

Test: - normal mission - every fault scenario - API failures - stale
telemetry - replay - what-if isolation - model failure - database
failure - WebSocket reconnect - responsive UI

Exit condition: No critical demo-path failures.

------------------------------------------------------------------------

## Phase 13 --- System Demo & Evidence

**Goal:** Build the final story.

Recommended demo: 1. Start healthy mission. 2. Show live telemetry. 3.
Show digital twin expected vs observed. 4. Inject controlled fault. 5.
Show residual growth. 6. Trigger anomaly. 7. Show candidate diagnosis
and evidence. 8. Show health degradation. 9. Show RUL estimate and
assumptions. 10. Replay the event. 11. Run a what-if scenario. 12. Show
reliability comparison. 13. Finish on the 3D UAV + mission dashboard.

## Priority Rule

If time becomes limited, prioritize:

**Simulator → Telemetry → Physics → Digital Twin → Fault Detection →
Dashboard → Replay → RUL → What-if → Advanced 3D**

A polished end-to-end core is better than many incomplete features.
