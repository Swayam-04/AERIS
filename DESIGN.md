# Product & UI Design Specification --- SIH 26054

## 1. Design Direction

The product should feel like a professional aerospace engineering and
mission-reliability console: - technical - calm - information-dense but
readable - trustworthy - dark-console compatible - minimal decoration -
strong hierarchy

Do not make it look like a gaming cockpit.

## 2. Main Navigation

-   Overview
-   Live Digital Twin
-   Telemetry
-   Health
-   Faults & Alerts
-   RUL / Degradation
-   Mission Control
-   Mission Replay
-   What-if Lab
-   Reliability Analytics
-   3D UAV View
-   Settings

## 3. Overview Screen

Top: - Engine status - Health score - Mission phase - active alert
count - current RPM

Middle: - live telemetry trends - expected vs observed comparison -
digital-twin state - 3D UAV/engine context

Bottom: - active alerts - mission timeline - reliability summary

## 4. Live Digital Twin

Show a large central 3D generic MALE UAV.

Interaction: - orbit - pan - zoom - reset camera - toggle labels -
highlight engine area - show engine status overlay

Do not add weapon systems, targeting, attack indicators or tactical
controls.

## 5. Telemetry Screen

Provide a configurable grid of parameter cards and charts.

Each signal should show: - current value - unit - trend - status -
timestamp - observed/expected where available

Recommended primary signals: RPM, CHT, EGT, oil pressure, oil
temperature, fuel flow, vibration, injection timing and electrical
health.

## 6. Health Screen

Show: - overall health - subsystem/parameter health - trend -
confidence/quality of data - abnormal signals - recent events

Avoid presenting a single health score without supporting evidence.

## 7. Fault Center

Each alert: - severity - timestamp - mission phase - candidate fault -
probability/confidence if appropriate - contributing signals - residual
plot - recommended investigation/action

Use wording such as: **"Likely injector abnormality --- review
required"** not: **"Injector definitely failed."**

## 8. RUL Screen

Show: - RUL estimate - trend - uncertainty/range where available -
degradation trajectory - assumptions - model version - data quality

Never display a precise RUL as a certified fact.

## 9. Mission Control

Show: - mission name - engine - mission phase - elapsed time -
scenario - telemetry status - health - alerts

Controls: - Start - Pause - Resume - Stop - Inject Fault - Replay

## 10. Mission Replay

Timeline should synchronize: - mission phase - telemetry - health -
residuals - alerts - fault injection - 3D UAV visualization

Allow scrubbing through time.

## 11. What-if Lab

Layout: **Baseline Scenario \| Modified Scenario \| Difference**

Allow controlled changes such as: - mission duration - operating
condition - throttle/load profile - fault type - fault start time -
fault severity

Clearly label scenarios as simulations.

## 12. Reliability Analytics

Show: - mission health trends - fault frequency - time-to-alert -
mission phase distribution - scenario comparison - degradation patterns

## 13. 3D Model UX

Use a generic MALE UAV silhouette with: - fuselage - long wings - tail
assembly - rear/tractor propeller representation as appropriate -
landing gear only if useful - engine highlight - sensor/telemetry
hotspots

Keep geometry lightweight for browser performance.

## 14. Visual System

Use one consistent design language: - restrained neutral surfaces - one
primary accent - semantic warning colors - readable typography -
consistent 8px spacing system - moderate corner radius - subtle
borders - minimal shadows

Do not specify hard-coded colors in component logic; define them in the
design tokens.

## 15. States

Every important component needs: - loading - empty - error -
disconnected - simulated-data - normal - warning - critical

## 16. Responsive Behaviour

Desktop-first for engineering dashboard, but support: - 1440+ - 1280 -
1024 - tablet - mobile inspection view

On small screens, prioritize: Health → Alerts → Current telemetry →
Mission phase.

## 17. Accessibility

-   keyboard navigation
-   readable contrast
-   non-color-only status indicators
-   tooltips for engineering terms
-   accessible charts where practical
