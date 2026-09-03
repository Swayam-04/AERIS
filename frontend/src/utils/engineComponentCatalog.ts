import { FaultType } from '../types/telemetry';

export interface EngineComponentInfo {
  id: string;
  name: string;
  subsystem:
    | 'cylinders'
    | 'valvetrain'
    | 'crankshaft'
    | 'fuel'
    | 'lubrication'
    | 'ignition'
    | 'cooling'
    | 'propulsion'
    | 'sensors'
    | 'electrical';
  subsystemLabel: string;
  category: string;
  physicalLocation: string;
  meshAnchor: string;
  description: string;
  specs: Record<string, string>;
  normalRange: {
    min: number;
    max: number;
    unit: string;
    metricKey: string;
    nominalText: string;
  };
  anchorPos: [number, number, number]; // [x, y, z] in 3D world space
  cameraPos: [number, number, number]; // Ideal camera position for focus
  targetLookAt: [number, number, number]; // Camera target look-at
}

export const ENGINE_COMPONENT_CATALOG: Record<string, EngineComponentInfo> = {
  cylinder_1: {
    id: 'cylinder_1',
    name: 'Cylinder #1',
    subsystem: 'cylinders',
    subsystemLabel: 'Cylinder & Combustion',
    category: 'Power Section',
    physicalLocation: 'Right Bank, Forward Starboard Cylinder',
    meshAnchor: 'cylinder_1',
    description: 'Chro-moly steel cylinder barrel with machined alloy head, individual cooling fin stack, and overhead valve rocker chamber.',
    specs: {
      'Bore Diameter': '130.2 mm (5.125 in)',
      'Stroke': '98.4 mm (3.875 in)',
      'Displacement': '1,310 cc',
      'Compression Ratio': '8.5 : 1',
      'Firing Order': '1 - 3 - 2 - 4'
    },
    normalRange: { min: 140, max: 215, unit: '°C', metricKey: 'cht_c', nominalText: '165°C - 195°C CHT' },
    anchorPos: [0.75, 0.2, 1.35],
    cameraPos: [2.8, 1.8, 3.2],
    targetLookAt: [0.75, 0.2, 1.35]
  },
  cylinder_2: {
    id: 'cylinder_2',
    name: 'Cylinder #2',
    subsystem: 'cylinders',
    subsystemLabel: 'Cylinder & Combustion',
    category: 'Power Section',
    physicalLocation: 'Left Bank, Forward Port Cylinder',
    meshAnchor: 'cylinder_2',
    description: 'Port forward cylinder assembly. Houses combustion chamber #2, upper/lower spark plugs, and intake/exhaust poppet valves.',
    specs: {
      'Bore Diameter': '130.2 mm (5.125 in)',
      'Stroke': '98.4 mm (3.875 in)',
      'Displacement': '1,310 cc',
      'Combustion Type': 'Direct Dual-Ignition',
      'Valve Clearances': '0.015 in cold hydraulic'
    },
    normalRange: { min: 140, max: 215, unit: '°C', metricKey: 'cht_c', nominalText: '165°C - 195°C CHT' },
    anchorPos: [0.75, 0.2, -1.35],
    cameraPos: [2.8, 1.8, -3.2],
    targetLookAt: [0.75, 0.2, -1.35]
  },
  cylinder_3: {
    id: 'cylinder_3',
    name: 'Cylinder #3',
    subsystem: 'cylinders',
    subsystemLabel: 'Cylinder & Combustion',
    category: 'Power Section',
    physicalLocation: 'Right Bank, Aft Starboard Cylinder',
    meshAnchor: 'cylinder_3',
    description: 'Aft starboard cylinder assembly. Receives engine cooling air via inter-cylinder baffle duct. Susceptible to thermal boundary stagnation.',
    specs: {
      'Bore Diameter': '130.2 mm (5.125 in)',
      'Stroke': '98.4 mm (3.875 in)',
      'Displacement': '1,310 cc',
      'Cooling Method': 'Forced Ram-Air Convection',
      'Fin Density': '6.2 fins per inch'
    },
    normalRange: { min: 140, max: 215, unit: '°C', metricKey: 'cht_c', nominalText: '165°C - 200°C CHT' },
    anchorPos: [-0.75, 0.2, 1.35],
    cameraPos: [-2.8, 1.8, 3.2],
    targetLookAt: [-0.75, 0.2, 1.35]
  },
  cylinder_4: {
    id: 'cylinder_4',
    name: 'Cylinder #4',
    subsystem: 'cylinders',
    subsystemLabel: 'Cylinder & Combustion',
    category: 'Power Section',
    physicalLocation: 'Left Bank, Aft Port Cylinder',
    meshAnchor: 'cylinder_4',
    description: 'Aft port cylinder barrel and cylinder head with dual spark plug boss and tuned exhaust flange.',
    specs: {
      'Bore Diameter': '130.2 mm (5.125 in)',
      'Stroke': '98.4 mm (3.875 in)',
      'Displacement': '1,310 cc',
      'Head Material': 'Cast Aluminum-Silicon Alloy',
      'Barrel Material': 'Nitrided Steel'
    },
    normalRange: { min: 140, max: 215, unit: '°C', metricKey: 'cht_c', nominalText: '165°C - 195°C CHT' },
    anchorPos: [-0.75, 0.2, -1.35],
    cameraPos: [-2.8, 1.8, -3.2],
    targetLookAt: [-0.75, 0.2, -1.35]
  },
  cylinder_head_3: {
    id: 'cylinder_head_3',
    name: 'Cylinder Head #3 & Baffle',
    subsystem: 'cooling',
    subsystemLabel: 'Thermal & Cooling',
    category: 'Thermal Section',
    physicalLocation: 'Right Bank, Aft Starboard Head & Baffle Duct',
    meshAnchor: 'cylinder_head_3',
    description: 'Hemispherical combustion roof with integrated intake/exhaust ports and precision air-cooling baffle sheet.',
    specs: {
      'Thermal Limit (Continuous)': '232°C (450°F)',
      'Warning Threshold': '218°C (425°F)',
      'Thermocouple Well': '14mm Spark Plug Gasket',
      'Combustion Geometry': 'Hemispherical Roof'
    },
    normalRange: { min: 130, max: 215, unit: '°C', metricKey: 'cht_c', nominalText: 'Nominal 175°C' },
    anchorPos: [-0.75, 0.55, 1.65],
    cameraPos: [-2.4, 2.0, 3.4],
    targetLookAt: [-0.75, 0.45, 1.65]
  },
  piston_assembly: {
    id: 'piston_assembly',
    name: 'Reciprocating Pistons (1–4)',
    subsystem: 'crankshaft',
    subsystemLabel: 'Reciprocating Dynamics',
    category: 'Internal Reciprocating',
    physicalLocation: 'Internal Cylinder Barrels (1, 2, 3, 4)',
    meshAnchor: 'piston_assembly',
    description: 'Trunk-type forged aluminum pistons with 2 compression rings, 1 oil control ring, and floating steel wrist pin.',
    specs: {
      'Piston Material': 'Forged Al-Cu Alloy (2618-T6)',
      'Wrist Pin': 'Full-floating Case-Hardened Steel',
      'Ring Configuration': '2 Compression + 1 Multi-piece Oil Rail',
      'Clearance': '0.0075 in skirt cold'
    },
    normalRange: { min: 0.2, max: 1.4, unit: 'g RMS', metricKey: 'vibration_g', nominalText: '< 1.2 g vibration' },
    anchorPos: [0.0, 0.15, 0.0],
    cameraPos: [1.8, 1.6, 2.2],
    targetLookAt: [0.0, 0.15, 0.0]
  },
  connecting_rods: {
    id: 'connecting_rods',
    name: 'Forged Connecting Rods',
    subsystem: 'crankshaft',
    subsystemLabel: 'Reciprocating Dynamics',
    category: 'Internal Reciprocating',
    physicalLocation: 'Central Crankcase Rod Journals',
    meshAnchor: 'connecting_rods',
    description: 'H-beam forged alloy steel connecting rods connecting pistons to crankshaft crankpins with split bronze-lead bearings.',
    specs: {
      'Material': 'Forged AISI 4340 Chro-Moly Steel',
      'Big-End Bearing': 'Steel-backed Lead-Indium Babbitt',
      'Center-to-Center Length': '165.1 mm',
      'Journal Diameter': '54.0 mm'
    },
    normalRange: { min: 0.2, max: 1.4, unit: 'g RMS', metricKey: 'vibration_g', nominalText: 'Nominal 0.65 g' },
    anchorPos: [0.0, 0.0, 0.0],
    cameraPos: [1.6, 1.4, 2.0],
    targetLookAt: [0.0, 0.0, 0.0]
  },
  crankshaft: {
    id: 'crankshaft',
    name: 'Crankshaft & Main Bearings',
    subsystem: 'crankshaft',
    subsystemLabel: 'Rotating Assembly',
    category: 'Internal Rotating',
    physicalLocation: 'Crankcase Centerline & Front Propeller Journal',
    meshAnchor: 'crankshaft',
    description: 'One-piece 4-throw 180° balanced forged steel crankshaft with dynamic pendular dampeners and precision main journal journals.',
    specs: {
      'Material': 'AMS 6415 Chrome-Nickel Steel',
      'Throws': '4 Cranks @ 180° opposed balance',
      'Bearings': '4 Steel-backed copper-lead main inserts',
      'Propeller Flange': 'SAE No. 2 Standard 6-Bolt'
    },
    normalRange: { min: 0.2, max: 1.5, unit: 'g RMS', metricKey: 'vibration_g', nominalText: '< 1.5 g nominal vibration' },
    anchorPos: [0.2, 0.0, 0.0],
    cameraPos: [2.6, 1.4, 2.4],
    targetLookAt: [0.2, 0.0, 0.0]
  },
  valves_assembly: {
    id: 'valves_assembly',
    name: 'Valves & Rocker Mechanism',
    subsystem: 'valvetrain',
    subsystemLabel: 'Valvetrain',
    category: 'Internal Valvetrain',
    physicalLocation: 'Cylinder Heads Rocker Chambers',
    meshAnchor: 'valves_assembly',
    description: 'Overhead poppet intake and sodium-cooled exhaust valves actuated by hydraulic lifters, pushrods, and forged rocker arms.',
    specs: {
      'Intake Valve': 'Stellite-faced Stainless Poppet (48mm)',
      'Exhaust Valve': 'Sodium-filled Inconel Stem (40mm)',
      'Valve Springs': 'Inner + Outer Concentric Dual Springs',
      'Lifter Type': 'Hydraulic Zero-Lash Roller'
    },
    normalRange: { min: 650, max: 880, unit: '°C', metricKey: 'egt_c', nominalText: '700°C - 840°C EGT' },
    anchorPos: [0.0, 0.5, 1.4],
    cameraPos: [2.2, 1.8, 2.6],
    targetLookAt: [0.0, 0.4, 1.4]
  },
  fuel_injector_2: {
    id: 'fuel_injector_2',
    name: 'Fuel Injector #2',
    subsystem: 'fuel',
    subsystemLabel: 'Fuel Injection System',
    category: 'Fuel Delivery',
    physicalLocation: 'Left Bank, Cylinder #2 Intake Runner Port',
    meshAnchor: 'fuel_injector_2',
    description: 'Precision continuous-flow atomizing fuel injector nozzle delivering metered fuel directly into the Cylinder #2 intake valve port.',
    specs: {
      'Nozzle Flow Rating': '7.8 GPH @ 12 PSI',
      'Atomization Type': 'Air-bleed atomizing nozzle',
      'Supply Line': 'Stainless steel braided capillary',
      'Filter Screen': '70-micron internal mesh'
    },
    normalRange: { min: 14.0, max: 36.0, unit: 'L/h', metricKey: 'fuel_flow_lph', nominalText: '20 - 30 L/h total fuel flow' },
    anchorPos: [0.65, 0.45, -1.1],
    cameraPos: [2.0, 1.6, -2.4],
    targetLookAt: [0.65, 0.4, -1.1]
  },
  fuel_system: {
    id: 'fuel_system',
    name: 'Fuel Distribution Spider & Lines',
    subsystem: 'fuel',
    subsystemLabel: 'Fuel Injection System',
    category: 'Fuel Delivery',
    physicalLocation: 'Top Crankcase Spine & Fuel Distribution Spider',
    meshAnchor: 'fuel_system',
    description: 'Precision fuel flow divider manifold ("spider") distributing balanced fuel volume to cylinders 1–4 with diaphragm pressure regulation.',
    specs: {
      'Divider Type': 'Spring-loaded diaphragm manifold',
      'Operating Pressure': '10–18 PSI rail pressure',
      'Distribution Lines': '1/8-inch 304 Stainless Steel',
      'Fuel Compatibility': 'AvGas 100LL / Unleaded Mogas 95+'
    },
    normalRange: { min: 15.0, max: 35.0, unit: 'L/h', metricKey: 'fuel_flow_lph', nominalText: 'Nominal 24.5 L/h' },
    anchorPos: [0.0, 0.75, 0.0],
    cameraPos: [0.0, 2.6, 2.2],
    targetLookAt: [0.0, 0.6, 0.0]
  },
  oil_pump: {
    id: 'oil_pump',
    name: 'Oil Pressure Pump & Relief Gallery',
    subsystem: 'lubrication',
    subsystemLabel: 'Lubrication Circuit',
    category: 'Lubrication System',
    physicalLocation: 'Lower Crankcase Accessory Sump & Main Gallery',
    meshAnchor: 'oil_pump',
    description: 'Engine-driven positive-displacement spur gear oil pump with internal pressure relief valve delivering pressurized oil to the engine gallery.',
    specs: {
      'Pump Type': 'Positive-displacement Gear Drive',
      'Relief Setting': '70 PSI nominal spring-loaded ball',
      'Max Delivery Rate': '18.5 L/min @ 2700 RPM',
      'Scavenge Circuit': 'Wet sump gravity scavenge'
    },
    normalRange: { min: 45, max: 80, unit: 'PSI', metricKey: 'oil_pressure_psi', nominalText: '55 - 75 PSI nominal' },
    anchorPos: [-1.2, -0.65, 0.0],
    cameraPos: [-2.8, -0.2, 1.8],
    targetLookAt: [-1.2, -0.5, 0.0]
  },
  oil_sump: {
    id: 'oil_sump',
    name: 'Oil Sump & Filter Canister',
    subsystem: 'lubrication',
    subsystemLabel: 'Lubrication Circuit',
    category: 'Lubrication System',
    physicalLocation: 'Bottom Engine Oil Pan & Accessory Filter Pad',
    meshAnchor: 'oil_sump',
    description: 'Cast aluminum wet oil sump holding 7.5 liters of Aeroshell W15W-50 oil, featuring full-flow spin-on filter canister and oil cooler line return ports.',
    specs: {
      'Sump Capacity': '8.0 US Quarts (7.57 Liters)',
      'Filter Rating': '15-micron pleated micro-glass',
      'Oil Spec': 'MIL-L-22851 Ashless Dispersant',
      'Temp Limit': '118°C (245°F) redline'
    },
    normalRange: { min: 60, max: 105, unit: '°C', metricKey: 'oil_temp_c', nominalText: '75°C - 95°C normal' },
    anchorPos: [-0.2, -0.85, 0.0],
    cameraPos: [0.8, -1.6, 2.5],
    targetLookAt: [-0.2, -0.7, 0.0]
  },
  exhaust_system: {
    id: 'exhaust_system',
    name: 'Tuned Exhaust Headers & Manifold',
    subsystem: 'cooling',
    subsystemLabel: 'Exhaust & Scavenging',
    category: 'Exhaust Section',
    physicalLocation: 'Bottom Port & Starboard Cylinder Exhaust Ports',
    meshAnchor: 'exhaust_system',
    description: 'Equal-length 321 stainless steel tuned exhaust header runners routing hot combustion gases from all 4 cylinders into dual exhaust collector stacks.',
    specs: {
      'Header Tubing': '1.75-inch OD 321 Stainless Steel',
      'Operating EGT Range': '680°C - 830°C',
      'EGT Limit': '890°C (1,634°F)',
      'Manifold Connection': 'Flexible slip-joint ball clamps'
    },
    normalRange: { min: 650, max: 860, unit: '°C', metricKey: 'egt_c', nominalText: '720°C - 810°C EGT' },
    anchorPos: [0.0, -0.55, 0.9],
    cameraPos: [1.8, -1.2, 2.8],
    targetLookAt: [0.0, -0.4, 0.6]
  },
  spark_ignition: {
    id: 'spark_ignition',
    name: 'Dual Magnetos & 8-Plug Ignition',
    subsystem: 'ignition',
    subsystemLabel: 'Ignition System',
    category: 'Ignition Section',
    physicalLocation: 'Rear Accessory Case & Dual Spark Plugs (1–4)',
    meshAnchor: 'spark_ignition',
    description: 'Dual engine-driven Bendix/Slick magnetos providing completely independent electrical spark to two spark plugs per cylinder for redundancy.',
    specs: {
      'Magneto Configuration': 'Dual Impulse-coupled S-1200 Series',
      'Spark Plugs': '8 × Champion Aviation Shielded (18mm)',
      'Timing Advance': '25° BTDC fixed',
      'Harness': 'Braided RFI-shielded high-tension leads'
    },
    normalRange: { min: 2200, max: 2750, unit: 'RPM', metricKey: 'rpm', nominalText: '2400 - 2700 RPM cruise' },
    anchorPos: [-1.35, 0.35, 0.0],
    cameraPos: [-3.2, 1.4, 1.8],
    targetLookAt: [-1.2, 0.3, 0.0]
  },
  propeller_interface: {
    id: 'crankshaft_prop_interface',
    name: 'Propeller Flange & Drive Shaft',
    subsystem: 'propulsion',
    subsystemLabel: 'Propulsion Interface',
    category: 'Propulsion Section',
    physicalLocation: 'Forward Engine Nose & Propeller Drive Hub',
    meshAnchor: 'crankshaft',
    description: 'Precision forged drive hub flange mounted directly to the engine crankshaft with 6 cadmium-plated drive bushings and safety-wired bolts.',
    specs: {
      'Flange Type': 'SAE No. 2 Standard Hub Flange',
      'Drive Ratio': '1:1 Direct-Drive',
      'Mounting Hardware': '6 × 7/16-20 Grade 8 Aircraft Studs',
      'Propeller Class': 'Fixed-Pitch / Constant-Speed 2-Blade'
    },
    normalRange: { min: 0.2, max: 1.2, unit: 'g RMS', metricKey: 'vibration_g', nominalText: '< 1.2 g baseline vibration' },
    anchorPos: [1.4, 0.0, 0.0],
    cameraPos: [3.2, 0.8, 1.6],
    targetLookAt: [1.2, 0.0, 0.0]
  },
  alternator: {
    id: 'alternator',
    name: '28V 70A Alternator & Drive Belt',
    subsystem: 'electrical',
    subsystemLabel: 'Electrical Power',
    category: 'Accessory Drive',
    physicalLocation: 'Rear Accessory Case Drive Pad (Port)',
    meshAnchor: 'alternator',
    description: 'Engine-driven 28V 70A brushless alternator driven via accessory gear train, supplying primary electrical power and bus voltage stabilization.',
    specs: {
      'Rated Output': '28.2 VDC @ 70 A (1,974 W)',
      'Drive Ratio': '1.8 : 1 Engine Crankshaft RPM',
      'Stator Insulation': 'Class H (180°C thermal endurance)',
      'Diode Bridge': '6-diode heavy-duty silicon bridge'
    },
    normalRange: { min: 27.8, max: 28.6, unit: 'V', metricKey: 'battery_volts', nominalText: '28.2 VDC nominal bus' },
    anchorPos: [-1.15, 0.35, -0.85],
    cameraPos: [-2.6, 1.4, -2.4],
    targetLookAt: [-1.1, 0.3, -0.7]
  },
  sensor_cht_3: {
    id: 'sensor_cht_3',
    name: 'CHT Thermocouple Sensor #3',
    subsystem: 'sensors',
    subsystemLabel: 'Telemetry Sensor Suite',
    category: 'Sensor Suite',
    physicalLocation: 'Cylinder #3 Spark Plug Gasket Well',
    meshAnchor: 'sensor_cht_3',
    description: 'Type J (Iron-Constantan) bayonet thermocouple installed into the Cylinder #3 head temperature well providing real-time cylinder thermal telemetry.',
    specs: {
      'Sensor Type': 'J-Type Thermocouple (Ungrounded)',
      'Measurement Range': '0°C - 300°C (±1.5°C accuracy)',
      'Sampling Rate': '50 Hz analog conversion',
      'Lead Wire': 'Glass-braided stainless overbraid'
    },
    normalRange: { min: 140, max: 215, unit: '°C', metricKey: 'cht_c', nominalText: '165°C - 200°C nominal' },
    anchorPos: [-0.65, 0.6, 1.45],
    cameraPos: [-2.2, 1.8, 2.6],
    targetLookAt: [-0.65, 0.5, 1.45]
  },
  sensor_vibration: {
    id: 'sensor_vibration',
    name: 'Crankcase Vibration Accelerometer',
    subsystem: 'sensors',
    subsystemLabel: 'Telemetry Sensor Suite',
    category: 'Sensor Suite',
    physicalLocation: 'Top Crankcase Spine Near Front Bearing',
    meshAnchor: 'sensor_vibration',
    description: 'High-frequency piezoelectric tri-axial accelerometer measuring broadband crankcase vibration and harmonic imbalances.',
    specs: {
      'Sensor Type': 'Piezoelectric Charge Accelerometer',
      'Frequency Response': '2 Hz - 10 kHz (±3 dB)',
      'Dynamic Range': '±50 g peak',
      'Mounting': 'Stud-mounted to structural engine spine'
    },
    normalRange: { min: 0.2, max: 1.5, unit: 'g RMS', metricKey: 'vibration_g', nominalText: '0.4 - 1.2 g RMS nominal' },
    anchorPos: [0.6, 0.6, 0.0],
    cameraPos: [2.2, 1.8, 1.6],
    targetLookAt: [0.6, 0.5, 0.0]
  },
  sensor_oil_press_temp: {
    id: 'sensor_oil_press_temp',
    name: 'Oil Pressure & Temp Transducer',
    subsystem: 'sensors',
    subsystemLabel: 'Telemetry Sensor Suite',
    category: 'Sensor Suite',
    physicalLocation: 'Main Oil Gallery Port (Aft Accessory Pad)',
    meshAnchor: 'sensor_oil_press_temp',
    description: 'Piezoresistive solid-state oil pressure sensor combined with RTD thermistor element tapped into the primary engine oil gallery.',
    specs: {
      'Pressure Range': '0–150 PSI (0.5% FSO accuracy)',
      'Temp Range': '-40°C to +150°C',
      'Output Signal': '0.5V - 4.5V ratiometric',
      'Response Time': '< 15 milliseconds'
    },
    normalRange: { min: 50, max: 80, unit: 'PSI', metricKey: 'oil_pressure_psi', nominalText: '55 - 75 PSI nominal' },
    anchorPos: [-1.2, -0.2, 0.5],
    cameraPos: [-2.6, 0.6, 2.0],
    targetLookAt: [-1.2, -0.1, 0.4]
  }
};

export interface FaultComponentMapping {
  faultType: FaultType;
  componentId: string;
  componentName: string;
  subsystem: string;
  physicalLocation: string;
  meshAnchor: string;
  severityLevel: 'warning' | 'degraded' | 'critical';
  visualEffect: 'misfire_pulse' | 'fuel_restriction' | 'oil_loss' | 'thermal_gradient' | 'vibration_oscillation' | 'sensor_drift_callout' | 'electrical_generator';
  title: string;
  summary: string;
  symptoms: string[];
  expectedVsObservedTemplate: (observedVal: number, expectedVal: number) => { expected: string; observed: string; delta: string };
}

export const FAULT_TO_ENGINE_COMPONENT_MAP: Record<string, FaultComponentMapping> = {
  misfire: {
    faultType: 'misfire' as FaultType,
    componentId: 'cylinder_2',
    componentName: 'Cylinder #2 Combustion Chamber',
    subsystem: 'Cylinder & Combustion',
    physicalLocation: 'Left Bank, Forward Port Cylinder (Cyl #2)',
    meshAnchor: 'cylinder_2',
    severityLevel: 'critical',
    visualEffect: 'misfire_pulse',
    title: 'CYLINDER MISFIRE',
    summary: 'Ignition breakdown / spark plug fouling in Cylinder #2. Incomplete flame propagation results in unburnt fuel cooling the exhaust and generating severe rotational harmonic vibration.',
    symptoms: [
      'RPM drop: -320 RPM below commanded baseline',
      'Vibration surge: +1.85 g RMS harmonic disturbance',
      'EGT drop: -110°C in Cylinder #2 exhaust runner'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: 'Normal combustion (EGT ~750°C, Vib ~0.5g)',
      observed: `Unburnt misfire (Vib ${obs.toFixed(2)}g, RPM loss)`,
      delta: 'Severe torque deficit & harmonic imbalance'
    })
  },
  injector_abnormality: {
    faultType: 'injector_abnormality' as FaultType,
    componentId: 'fuel_injector_2',
    componentName: 'Fuel Injector #2',
    subsystem: 'Fuel Injection System',
    physicalLocation: 'Left Bank, Cylinder #2 Intake Runner Port',
    meshAnchor: 'fuel_injector_2',
    severityLevel: 'degraded',
    visualEffect: 'fuel_restriction',
    title: 'FUEL INJECTOR RESTRICTION',
    summary: 'Partial varnish / particulate blockage in Injector #2 atomizing nozzle. Fuel delivery to Cylinder #2 is restricted, forcing an extreme lean-burn condition.',
    symptoms: [
      'Elevated EGT: +145°C thermal spike in exhaust runner',
      'Total Fuel Flow Reduction: -4.5 L/h fuel deficit',
      'Cylinder Head Thermal Rise: +28°C on Cylinder #2 head'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: 'Stoichiometric fuel flow (24.5 L/h, EGT ~730°C)',
      observed: `Restricted fuel metering (EGT +145°C above expected)`,
      delta: 'Lean burn thermal excursion'
    })
  },
  oil_pressure_loss: {
    faultType: 'oil_pressure_loss' as FaultType,
    componentId: 'oil_pump',
    componentName: 'Oil Pressure Pump & Relief Gallery',
    subsystem: 'Lubrication Circuit',
    physicalLocation: 'Lower Crankcase Accessory Sump & Main Gallery',
    meshAnchor: 'oil_pump',
    severityLevel: 'critical',
    visualEffect: 'oil_loss',
    title: 'OIL PRESSURE LOSS',
    summary: 'Internal pressure relief valve spring relaxation or primary gallery seal leakage. Oil pressure has plummeted below the hydrodynamic lubrication threshold for crankshaft journal bearings.',
    symptoms: [
      'Oil Pressure Collapse: -38 PSI drop below operating baseline',
      'Oil Temperature Rise: +42°C due to increased boundary friction',
      'Risk: Imminent journal bearing seizure within minutes'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: 'Nominal 65 PSI hydrodynamic pressure',
      observed: `${obs.toFixed(1)} PSI (Critical Boundary Deficit)`,
      delta: '-38 PSI severe deficit'
    })
  },
  overheating: {
    faultType: 'overheating' as FaultType,
    componentId: 'cylinder_head_3',
    componentName: 'Cylinder Head #3 & Cooling Fins',
    subsystem: 'Thermal & Cooling',
    physicalLocation: 'Right Bank, Aft Starboard Head & Baffle Duct',
    meshAnchor: 'cylinder_head_3',
    severityLevel: 'critical',
    visualEffect: 'thermal_gradient',
    title: 'THERMAL OVERHEATING',
    summary: 'Cooling duct baffle restriction or inter-cylinder airflow obstruction. Cylinder #3 cooling fins starved of ram-air, driving localized head temperature over the continuous operating limit.',
    symptoms: [
      'CHT Thermal Excursion: +55°C elevation above expected model',
      'Secondary Oil Temp Rise: +35°C thermal carryover',
      'Thermal gradient: Concentrated on Cylinder #3 head & baffle'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: 'Nominal 175°C CHT cooling balance',
      observed: `${obs.toFixed(1)}°C CHT (Exceeding 230°C Limit)`,
      delta: '+55°C localized thermal runaway'
    })
  },
  vibration_spike: {
    faultType: 'vibration_spike' as FaultType,
    componentId: 'crankshaft_prop_interface',
    componentName: 'Crankshaft Front Journal & Propeller Flange',
    subsystem: 'Propulsion Interface',
    physicalLocation: 'Forward Crankcase Nose Section & Propeller Flange',
    meshAnchor: 'crankshaft',
    severityLevel: 'critical',
    visualEffect: 'vibration_oscillation',
    title: 'MECHANICAL VIBRATION SPIKE',
    summary: 'Propeller hub imbalance or front crankshaft nose bearing dynamic misalignment. High-amplitude rotational oscillation threatens airframe mounting structure.',
    symptoms: [
      'Broadband Vibration Surge: +3.2 g RMS severe spike',
      'Rotational instability with harmonic torque ripple',
      'Isolated to forward rotating propulsion interface'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: 'Nominal 0.65 g RMS rotational vibration',
      observed: `${obs.toFixed(3)} g RMS (Critical Mechanical Imbalance)`,
      delta: '+3.2 g violent vibration amplitude'
    })
  },
  sensor_drift: {
    faultType: 'sensor_drift' as FaultType,
    componentId: 'sensor_cht_3',
    componentName: 'CHT Thermocouple Sensor #3',
    subsystem: 'Telemetry Sensor Suite',
    physicalLocation: 'Cylinder #3 Spark Plug Gasket Well',
    meshAnchor: 'sensor_cht_3',
    severityLevel: 'warning',
    visualEffect: 'sensor_drift_callout',
    title: 'SENSOR CALIBRATION DRIFT',
    summary: 'Piezoresistive / thermocouple instrumentation bias on CHT Sensor #3. The physical engine structure and combustion chambers are completely intact; the measurement discrepancy is an instrumentation drift.',
    symptoms: [
      'Instrumentation Bias: +45°C virtual delta on Sensor #3',
      'Physical engine block nominal: Zero oil temp or vibration change',
      'Discrepancy vs physics-expected model'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: 'Nominal ~170°C physics model expected',
      observed: `${obs.toFixed(1)}°C reported by Thermocouple #3`,
      delta: '+45°C uncalibrated bias (Sensor faulty, engine OK)'
    })
  },
  alternator_output_degradation: {
    faultType: 'alternator_output_degradation' as FaultType,
    componentId: 'alternator',
    componentName: '28V Alternator Assembly & Drive Belt',
    subsystem: 'Electrical Power',
    physicalLocation: 'Rear Accessory Case Drive Pad (Port)',
    meshAnchor: 'alternator',
    severityLevel: 'degraded',
    visualEffect: 'electrical_generator',
    title: 'ALTERNATOR OUTPUT CAPACITY DEGRADATION',
    summary: 'Alternator stator winding insulation breakdown or diode bridge thermal degradation derating generation capacity, shifting load to the battery.',
    symptoms: [
      'Output power derated below aircraft total load demand',
      'Battery transition to discharge assist mode',
      'Alternator temperature elevated above 95°C'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: '840 W nominal power generation',
      observed: 'Derated electrical generation',
      delta: 'Power deficit on DC bus'
    })
  },
  alternator_failure: {
    faultType: 'alternator_failure' as FaultType,
    componentId: 'alternator',
    componentName: '28V Alternator Assembly & Drive Belt',
    subsystem: 'Electrical Power',
    physicalLocation: 'Rear Accessory Case Drive Pad (Port)',
    meshAnchor: 'alternator',
    severityLevel: 'critical',
    visualEffect: 'electrical_generator',
    title: 'ALTERNATOR GENERATION COLLAPSE',
    summary: 'Total mechanical or electrical failure of the engine-driven 28V alternator. DC bus is powered entirely by depleting battery reserve.',
    symptoms: [
      'Alternator output collapsed to near 0 W',
      'Aircraft bus operating under severe electrical deficit',
      'Immediate RTB emergency advisory'
    ],
    expectedVsObservedTemplate: (obs, exp) => ({
      expected: '840 W generation (Alternator powering bus)',
      observed: '0 W (Complete generation loss)',
      delta: 'Emergency battery discharge mode'
    })
  }
};
