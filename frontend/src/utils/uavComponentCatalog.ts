export interface UAVComponentInfo {
  id: string;
  name: string;
  category: 'Propulsion' | 'Aerodynamics & Structure' | 'Avionics & Sensors' | 'Landing Gear' | 'Thermal & Systems';
  description: string;
  source: 'Model geometry' | 'CONCEPTUAL DIGITAL-TWIN COMPONENT';
  position: [number, number, number];
  status?: 'NORMAL' | 'DEGRADED' | 'WARNING';
}

export const UAV_COMPONENT_CATALOG: Record<string, UAVComponentInfo> = {
  fuselage: {
    id: 'fuselage',
    name: 'Fuselage & Main Composite Structure',
    category: 'Aerodynamics & Structure',
    description: 'Lightweight carbon-composite semi-monocoque main fuselage housing payload bays, fuel bladders, and avionics racks.',
    source: 'Model geometry',
    position: [0, 0, 0],
    status: 'NORMAL'
  },
  noseRadome: {
    id: 'noseRadome',
    name: 'Nose SATCOM Radome & FLIR Sensor Pod',
    category: 'Avionics & Sensors',
    description: 'Bulbous satellite communications radome housing Beyond-Visual-Range (BVR) antenna link and chin-mounted electro-optical/infrared (EO/IR) FLIR payload.',
    source: 'Model geometry',
    position: [2.5, 0.5, 0],
    status: 'NORMAL'
  },
  wingRight: {
    id: 'wingRight',
    name: 'Right Reconnaissance Wing & Winglet',
    category: 'Aerodynamics & Structure',
    description: 'High shoulder-mounted aspect-ratio wing providing aerodynamic lift, integrated fuel tanks, and winglet for vortex drag reduction.',
    source: 'Model geometry',
    position: [0, 0.1, 4.5],
    status: 'NORMAL'
  },
  wingLeft: {
    id: 'wingLeft',
    name: 'Left Reconnaissance Wing & Winglet',
    category: 'Aerodynamics & Structure',
    description: 'High shoulder-mounted aspect-ratio wing providing aerodynamic lift, integrated fuel tanks, and winglet for vortex drag reduction.',
    source: 'Model geometry',
    position: [0, 0.1, -4.5],
    status: 'NORMAL'
  },
  verticalTail: {
    id: 'verticalTail',
    name: 'Vertical Tail Fin & Rudder',
    category: 'Aerodynamics & Structure',
    description: 'Tall composite vertical stabilizer providing directional yaw stability and rudder control surface.',
    source: 'Model geometry',
    position: [-4.5, 1.8, 0],
    status: 'NORMAL'
  },
  horizontalTail: {
    id: 'horizontalTail',
    name: 'High T-Tail Horizontal Stabilizer',
    category: 'Aerodynamics & Structure',
    description: 'Top-mounted T-tail horizontal stabilizer providing pitch trim control outside wing wake disturbance.',
    source: 'Model geometry',
    position: [-4.8, 3.2, 0],
    status: 'NORMAL'
  },
  engine: {
    id: 'engine',
    name: 'Rotax Aero-Piston Engine Nacelle',
    category: 'Propulsion',
    description: 'Turbocharged 4-stroke 4-cylinder aero-piston powerplant producing shaft power for endurance flight.',
    source: 'Model geometry',
    position: [-0.8, -0.2, 1.8],
    status: 'NORMAL'
  },
  propeller: {
    id: 'propeller',
    name: '3-Blade Variable Pitch Propeller Assembly',
    category: 'Propulsion',
    description: 'Composite 3-blade propeller transferring engine shaft power into propulsive thrust.',
    source: 'Model geometry',
    position: [-1.85, -0.2, 1.8],
    status: 'NORMAL'
  },
  landingGear: {
    id: 'landingGear',
    name: 'Tricycle Retractable Landing Gear & Wheels',
    category: 'Landing Gear',
    description: 'Heavy-duty oleo-strut retractable landing gear with dual main wheels and nose wheel for field operations.',
    source: 'Model geometry',
    position: [0, -0.9, 0],
    status: 'NORMAL'
  },
  antennas: {
    id: 'antennas',
    name: 'Tactical Data Link & Telemetry Antennas',
    category: 'Avionics & Sensors',
    description: 'Omnidirectional VHF/UHF command link and C-band real-time telemetry downlink antenna array.',
    source: 'Model geometry',
    position: [1.2, 1.1, 0],
    status: 'NORMAL'
  },
  // Interior / Digital Twin Components
  engineBlock: {
    id: 'engineBlock',
    name: 'Turbocharged Engine Crankcase & Cylinder Block',
    category: 'Thermal & Systems',
    description: 'Crankcase assembly, 4 boxer cylinders, pistons, and turbocharging compressor housing.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.8, -0.2, 1.8],
    status: 'NORMAL'
  },
  fuelSystem: {
    id: 'fuelSystem',
    name: 'Sequential Fuel Injection Rail & Feed Pumps',
    category: 'Thermal & Systems',
    description: 'High-pressure electric fuel pumps, manifold pressure regulators, and electronic fuel injectors.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.6, 0.3, 1.8],
    status: 'NORMAL'
  },
  oilSystem: {
    id: 'oilSystem',
    name: 'Dry-Sump Lubrication & Oil Radiator Loop',
    category: 'Thermal & Systems',
    description: 'Trochoid oil pump, crankcase sump, oil filter, thermostat valve, and cooling matrix.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-1.1, -0.4, 1.8],
    status: 'NORMAL'
  },
  ecuSystem: {
    id: 'ecuSystem',
    name: 'Engine Control Unit (ECU/FADEC) & Health Logger',
    category: 'Avionics & Sensors',
    description: 'Dual channel full-authority digital engine control unit processing sensor telemetry vectors.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [0.8, 0.2, 0],
    status: 'NORMAL'
  }
};
