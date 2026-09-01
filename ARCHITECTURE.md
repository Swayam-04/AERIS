# System Architecture --- SIH 26054

## 1. Architecture Objective

Provide a modular architecture in which simulation, telemetry ingestion,
physics modelling, digital-twin state, AI/ML analytics, mission
simulation and visualization can evolve independently.

## 2. High-Level Flow

``` text
Engine Simulator / Compatible Telemetry
                |
                v
        Telemetry Gateway
                |
        +-------+-------+
        |               |
        v               v
   Stream Layer     Time-Series DB
        |
        v
 Physics Model ---> Digital Twin <--- ML Analytics
        |               |               |
        |               |               +--> Anomaly Detection
        |               |               +--> Fault Diagnosis
        |               |               +--> RUL
        |               |
        +---------------+
                |
                v
      Mission Reliability
          & What-if
                |
                v
          API / WebSocket
                |
                v
       React Mission Console
          + 3D MALE UAV
```

## 3. Services

### 3.1 Simulator Service

Generates deterministic engine telemetry and mission profiles.

Responsibilities: - engine state evolution - mission phases - fault
injection - scenario configuration - deterministic seeds

### 3.2 Telemetry Gateway

Responsibilities: - schema validation - unit normalization - timestamp
validation - provenance tagging - buffering - rejection/quarantine of
malformed records

### 3.3 Physics Model Service

Responsibilities: - expected engine state - operating-condition
relationships - expected parameter trajectories - residual generation

The model should be replaceable and versioned.

### 3.4 Digital Twin Service

Maintains: - observed state - expected state - residuals - health
state - fault state - degradation state - mission state

### 3.5 ML Analytics Service

Modules: - anomaly detection - fault classification - degradation
estimation - RUL

Initial implementation should favor interpretable, testable models over
unnecessary deep-learning complexity.

### 3.6 Mission Service

Responsibilities: - mission lifecycle - phase transitions - scenario
management - replay - what-if isolation

### 3.7 Reliability Analytics

Computes: - mission-level health summaries - event timing - fault
frequency - time-to-alert - phase-level reliability indicators

### 3.8 API Service

FastAPI endpoints for: - engines - telemetry - twin state - health -
alerts - missions - replay - what-if - RUL - 3D visualization state

### 3.9 Frontend

React + TypeScript.

Use: - WebSocket for live updates - REST for historical/configuration
operations - chart library for telemetry - Three.js for the generic MALE
UAV model

## 4. Storage

### Time-Series

InfluxDB is suitable for telemetry.

### Relational

PostgreSQL is suitable for: - users - missions - scenarios - alerts -
model metadata - configuration

### Object/Artifact Storage

Use controlled storage for: - model artifacts - exported mission runs -
reports

## 5. Event Model

Suggested events: - `telemetry.received` - `telemetry.invalid` -
`twin.updated` - `anomaly.detected` - `fault.candidate` -
`alert.created` - `mission.started` - `mission.phase_changed` -
`fault.injected` - `mission.completed` - `replay.started` -
`whatif.completed`

## 6. Real-Time Pattern

Simulator → gateway → stream → twin/analytics → WebSocket → dashboard.

The UI should not poll aggressively for live telemetry.

## 7. Model Versioning

Every AI/physics result should be traceable to: - model name - version -
scenario - data source - timestamp

## 8. 3D Visualization Architecture

The 3D UAV is a presentation layer.

It receives state such as:

``` json
{
  "engineHealth": 0.92,
  "engineStatus": "warning",
  "missionPhase": "cruise",
  "activeAlert": "vibration_anomaly"
}
```

The 3D scene changes visualization state only; it does not control the
aircraft.

Use a lightweight `.glb` asset loaded by Three.js.

## 9. Security

-   authenticated frontend
-   role-based access
-   protected API routes
-   secrets outside source
-   TLS in deployment
-   audit logs
-   no aircraft-control endpoints
-   no sensitive telemetry committed to Git

## 10. Deployment

### Development

Docker Compose: - frontend - API - simulator - ML/analytics -
PostgreSQL - InfluxDB

### Scalable target

Kubernetes: - independently scalable services - Kafka or equivalent
stream layer - persistent telemetry storage - monitoring/logging

Do not introduce Kubernetes into the first working prototype unless
required.

## 11. Failure Handling

-   stale telemetry → show disconnected/stale status
-   malformed telemetry → quarantine/reject
-   ML unavailable → continue telemetry/twin display and show analytics
    unavailable
-   database unavailable → surface degraded mode
-   WebSocket disconnected → reconnect with backoff

## 12. Architecture Principles

-   modular
-   explainable
-   reproducible
-   simulation-first
-   secure
-   replaceable data sources
-   replaceable models
-   no direct aircraft control
