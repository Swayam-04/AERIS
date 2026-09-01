# AERIS — Aero Engine Reliability & Intelligence System

**AERIS** (Aero Engine Reliability & Intelligence System) is an advanced AI-enabled digital-twin web platform designed for real-time health monitoring, multivariate anomaly detection, explainable fault diagnosis, remaining useful life (RUL) estimation, and mission reliability enhancement of aero-piston engines powering the **DRDO RUSTOM-1** MALE UAV.

---

## 🛩️ DRDO RUSTOM-1 Aircraft Identity & Specifications

- **Aircraft Model:** DRDO RUSTOM-1
- **Type:** MALE UAV
- **Manufacturer:** DRDO ADE (Aeronautical Development Establishment)
- **Powerplant:** 1 × Lycoming O-320 (Four-cylinder, air-cooled, horizontally opposed engine)
- **Engine Power:** 112 kW / 150 hp
- **Capacity:** 95 kg
- **Length:** 5.12 m
- **Wingspan:** 7.9 m
- **Height:** 2.4 m
- **Empty Weight:** 720 kg
- **Maximum Speed:** 150 km/h
- **Endurance:** 12–15 hours
- **Service Ceiling:** 7,900 m

---

## 🌟 Key Features & Architecture

- **Aerospace Digital Twin Layout Navigation Pattern:** Compact STATUS-ONLY top bar + Fixed vertical LEFT sidebar navigation + Expanded center main content area.
- **Physics-Informed Expected-State Baseline Model:** Derives nominal trajectories for 9 telemetry signals (RPM, CHT, EGT, Oil Pressure, Oil Temp, Fuel Flow, Vibration, Injection Timing, Battery Volts) dynamically based on throttle, altitude, ambient temp, and barometric lapse.
- **Real-Time Vector Residuals & Mahalanobis Distance:** Computes residual deltas `Observed - Physics Expected` and multivariate statistical distances ($D_M$).
- **Interactive DRDO RUSTOM-1 3D Digital Twin Viewer:** Built with Three.js — features `[ EXTERIOR ]` and `[ INTERIOR ]` view modes, Raycasting clickable component inspection, and `[ FOCUS CAMERA ]` camera controls.
- **Conceptual Digital-Twin Visualization Disclaimer:** Clearly demarcated for non-classified conceptual internal health monitoring architecture.
- **Explainable Diagnostic Fault Center:** Ranked physical evidence summaries for cylinder misfires, fuel injector abnormalities, oil pressure loss, thermal overheating, and crankcase vibration spikes.
- **RUL & Degradation Model:** Physics-informed wear accumulation model tracking remaining flight hours against 1,200h TBO baseline with confidence bounds.
- **Flight Recorder Replay & What-If Sandbox:** Scrub history logs and compare normal vs fault scenarios side-by-side.

---

## 🚀 Quick Start Instructions

### 1. Launch FastAPI Backend Service
```bash
python run_backend.py
```
*Backend API available at [http://localhost:8000](http://localhost:8000), WebSocket endpoint at `ws://localhost:8000/ws/telemetry`, and Swagger UI at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 2. Launch Interactive Web Console
```bash
cd frontend
npm run dev
```
*Open your browser to [http://localhost:3000](http://localhost:3000) to access AERIS.*

---

## 🧪 Running Unit Tests
```bash
python -m unittest backend.tests.test_engine
```
