export interface UAVComponentInfo {
  id: string;
  name: string;
  category: 'Propulsion' | 'Aerodynamics & Structure' | 'Avionics & Sensors' | 'Landing Gear' | 'Thermal & Systems';
  description: string;
  source: 'Model geometry' | 'CONCEPTUAL DIGITAL-TWIN COMPONENT';
  position: [number, number, number];
  status?: 'NORMAL' | 'DEGRADED' | 'WARNING';
  details?: { [key: string]: string };
}

export const UAV_COMPONENT_CATALOG: Record<string, UAVComponentInfo> = {
  fuselage: {
    id: 'fuselage',
    name: 'Fuselage & Main Structure',
    category: 'Aerodynamics & Structure',
    description: 'Main aircraft body housing payload bays, fuel bladders, and avionics racks.',
    source: 'Model geometry',
    position: [0, 0, 0],
    status: 'NORMAL'
  },
  noseRadome: {
    id: 'noseRadome',
    name: 'Nose Radome & Forward Sensors',
    category: 'Avionics & Sensors',
    description: 'Forward nose section housing telemetry data link and electro-optical payload.',
    source: 'Model geometry',
    position: [2.5, 0.5, 0],
    status: 'NORMAL'
  },
  wingRight: {
    id: 'wingRight',
    name: 'Right Reconnaissance Wing',
    category: 'Aerodynamics & Structure',
    description: 'Provides aerodynamic lift and supports aircraft flight.',
    source: 'Model geometry',
    position: [0, 0.1, 4.5],
    status: 'NORMAL'
  },
  wingLeft: {
    id: 'wingLeft',
    name: 'Left Reconnaissance Wing',
    category: 'Aerodynamics & Structure',
    description: 'Provides aerodynamic lift and supports aircraft flight.',
    source: 'Model geometry',
    position: [0, 0.1, -4.5],
    status: 'NORMAL'
  },
  verticalTail: {
    id: 'verticalTail',
    name: 'Tail & Vertical Stabilizer',
    category: 'Aerodynamics & Structure',
    description: 'Provides aerodynamic stability and directional flight control.',
    source: 'Model geometry',
    position: [-4.5, 1.8, 0],
    status: 'NORMAL'
  },
  horizontalTail: {
    id: 'horizontalTail',
    name: 'Horizontal Stabilizer Assembly',
    category: 'Aerodynamics & Structure',
    description: 'Provides pitch stability and elevation flight trim.',
    source: 'Model geometry',
    position: [-4.8, 3.2, 0],
    status: 'NORMAL'
  },
  engine: {
    id: 'engine',
    name: 'Lycoming O-320',
    category: 'Propulsion',
    description: 'Four-cylinder, air-cooled, horizontally opposed engine used for aircraft propulsion.',
    source: 'Model geometry',
    position: [-0.8, -0.2, 1.8],
    status: 'NORMAL',
    details: {
      'Configuration': '4-cylinder, air-cooled, horizontally opposed',
      'Power': '112 kW / 150 hp'
    }
  },
  propeller: {
    id: 'propeller',
    name: 'Propeller Assembly',
    category: 'Propulsion',
    description: 'Transfers engine power into thrust for aircraft propulsion.',
    source: 'Model geometry',
    position: [-1.85, -0.2, 1.8],
    status: 'NORMAL'
  },
  landingGear: {
    id: 'landingGear',
    name: 'Landing Gear & Wheel Assembly',
    category: 'Landing Gear',
    description: 'Supports aircraft during ground operations, taxiing, takeoff, and landing.',
    source: 'Model geometry',
    position: [0, -0.9, 0],
    status: 'NORMAL'
  },
  antennas: {
    id: 'antennas',
    name: 'Tactical Data Link Antennas',
    category: 'Avionics & Sensors',
    description: 'Command telemetry link and real-time downlink antenna array.',
    source: 'Model geometry',
    position: [1.2, 1.1, 0],
    status: 'NORMAL'
  },
  // Interior / Digital Twin Components
  engineBlock: {
    id: 'engineBlock',
    name: 'Lycoming O-320 Cylinder Block',
    category: 'Thermal & Systems',
    description: 'Four-cylinder, air-cooled, horizontally opposed engine crankcase and cylinder assembly.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.8, -0.2, 1.8],
    status: 'NORMAL',
    details: {
      'Configuration': '4-cylinder, air-cooled, horizontally opposed',
      'Power': '112 kW / 150 hp'
    }
  },
  fuelSystem: {
    id: 'fuelSystem',
    name: 'Fuel System & Feed Pump',
    category: 'Thermal & Systems',
    description: 'Fuel delivery lines, feed pumps, and mixture metering assembly.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.6, 0.3, 1.8],
    status: 'NORMAL'
  },
  oilSystem: {
    id: 'oilSystem',
    name: 'Oil & Lubrication System',
    category: 'Thermal & Systems',
    description: 'Engine lubrication oil pump, sump, filter, and cooling radiator loop.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-1.1, -0.4, 1.8],
    status: 'NORMAL'
  },
  ecuSystem: {
    id: 'ecuSystem',
    name: 'Avionics & Engine Control Module',
    category: 'Avionics & Sensors',
    description: 'Digital engine health logger and sensor processing module.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [0.8, 0.2, 0],
    status: 'NORMAL'
  }
};
