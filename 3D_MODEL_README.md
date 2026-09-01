# Generic MALE UAV 3D Model

`generic_male_uav.glb` is a lightweight, generic MALE-UAV visualization asset created for SIH 26054.

## Intended use
- Three.js / React dashboard visualization
- Mission context
- Engine-health highlighting
- Mission-phase state
- Telemetry/alert overlays

## Safety/design boundary
This is a generic visualization model. It is not a replica of a specific military aircraft and does not contain weapons, targeting, navigation or aircraft-control functionality.

## Suggested dashboard mapping
- Normal engine state: neutral/healthy visual treatment
- Warning: highlight the engine area
- Critical: highlight engine area and show alert panel
- Mission phase: show in a small HUD/label
- Telemetry: display through UI cards/charts rather than attaching excessive labels to the 3D mesh
