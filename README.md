# AERIS — Aero Engine Reliability & Intelligence System

**AERIS** (Aero Engine Reliability & Intelligence System) is an advanced AI-enabled digital-twin web platform designed for real-time health monitoring, multivariate anomaly detection, explainable fault diagnosis, remaining useful life (RUL) estimation, and mission reliability enhancement of aero-piston engines powering the **DRDO TAPAS-BH-201 (RUSTOM-II)** MALE UAV.

---

## 🛩️ DRDO TAPAS-BH-201 / RUSTOM-II Aircraft Identity

- **Aircraft Model:** TAPAS-BH-201 (Former Designation: RUSTOM-II)
- **Full Name:** Tactical Airborne Platform for Aerial Surveillance-Beyond Horizon-201
- **Developer / Organization:** DRDO / Aeronautical Development Establishment (ADE)
- **Engine Powerplant:** Dual Wing-Mounted Aero-Piston Engines (Rotax 914 / 915 iS class)
- **Scale Constraints:** Length: 9.5 m | Wingspan: 20.6 m
- **Visual Features:**
  - Bulbous SATCOM satellite communications nose radome.
  - High shoulder-mounted straight reconnaissance wings with vertical winglets.
  - Dual wing-mounted aero-piston engine nacelles with cooling louvers.
  - High T-Tail assembly (tall vertical tail fin with top horizontal stabilizer).
  - Chin-mounted electro-optical (EO/IR) FLIR sensor pod.
  - Tactical light grey DRDO composite finish (`#cbd5e1`).

---

## 🌟 Key Features & Architecture

- **CropIntel AI Layout Navigation Pattern:** Compact STATUS-ONLY top bar + Fixed vertical LEFT sidebar navigation + Expanded center main content area.
- **Physics-Informed Expected-State Baseline Model:** Derives nominal trajectories for 9 telemetry signals (RPM, CHT, EGT, Oil Pressure, Oil Temp, Fuel Flow, Vibration, Injection Timing, Battery Volts) dynamically based on throttle, altitude, ambient temp, and barometric lapse.
- **Real-Time Vector Residuals & Mahalanobis Distance:** Computes residual deltas `Observed - Physics Expected` and multivariate statistical distances ($D_M$).
- **Interactive TAPAS-BH-201 3D Digital Twin Viewer:** Built with Three.js — features `Exterior`, `Internal View`, `Cutaway Depth Slider` (0%-90%), `Exploded View`, `Engine Focus` camera animation, and 3D raycasting sensor inspection.
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
