export interface UAVComponentInfo {
  id: string;
  name: string;
  category: 'Propulsion' | 'Aerodynamic Structure' | 'Flight Control' | 'Avionics & Sensors' | 'Landing System' | 'Thermal & Systems';
  function: string;
  description?: string;
  source: 'Model geometry' | 'CONCEPTUAL DIGITAL-TWIN COMPONENT';
  position: [number, number, number];
  status?: 'NORMAL' | 'DEGRADED' | 'WARNING';
  details?: Record<string, string>;
}

export const UAV_COMPONENT_CATALOG: Record<string, UAVComponentInfo> = {
  nose: {
    id: 'nose',
    name: 'Nose',
    category: 'Avionics & Sensors',
    function: 'Houses satellite data link communications and optical payload sensors.',
    description: 'Forward streamlined radome section.',
    source: 'Model geometry',
    position: [2.5, 0.4, 0],
    status: 'NORMAL'
  },
  fuselage: {
    id: 'fuselage',
    name: 'Fuselage',
    category: 'Aerodynamic Structure',
    function: 'Main structural body housing payload, fuel bladders, and flight avionics.',
    description: 'Carbon-composite semi-monocoque airframe structure.',
    source: 'Model geometry',
    position: [0, 0, 0],
    status: 'NORMAL'
  },
  wingRight: {
    id: 'wingRight',
    name: 'Right Wing',
    category: 'Aerodynamic Structure',
    function: 'Generates aerodynamic lift and contributes to aircraft stability and flight performance.',
    description: 'High aspect-ratio composite wing providing lift.',
    source: 'Model geometry',
    position: [0, 0.1, 3.95],
    status: 'NORMAL'
  },
  wingLeft: {
    id: 'wingLeft',
    name: 'Left Wing',
    category: 'Aerodynamic Structure',
    function: 'Generates aerodynamic lift and contributes to aircraft stability and flight performance.',
    description: 'High aspect-ratio composite wing providing lift.',
    source: 'Model geometry',
    position: [0, 0.1, -3.95],
    status: 'NORMAL'
  },
  wingRoot: {
    id: 'wingRoot',
    name: 'Wing Root',
    category: 'Aerodynamic Structure',
    function: 'Attaches wing assembly to main fuselage and transfers structural load.',
    description: 'Heavy-duty wing spar attachment joint.',
    source: 'Model geometry',
    position: [0, 0.1, 1.2],
    status: 'NORMAL'
  },
  aileronRight: {
    id: 'aileronRight',
    name: 'Right Aileron',
    category: 'Flight Control',
    function: 'Controls aircraft roll and lateral banking movement.',
    description: 'Trailing edge control surface on the right wing.',
    source: 'Model geometry',
    position: [-0.4, 0.1, 3.5],
    status: 'NORMAL'
  },
  aileronLeft: {
    id: 'aileronLeft',
    name: 'Left Aileron',
    category: 'Flight Control',
    function: 'Controls aircraft roll and lateral banking movement.',
    description: 'Trailing edge control surface on the left wing.',
    source: 'Model geometry',
    position: [-0.4, 0.1, -3.5],
    status: 'NORMAL'
  },
  verticalStabilizer: {
    id: 'verticalStabilizer',
    name: 'Vertical Stabilizer',
    category: 'Aerodynamic Structure',
    function: 'Provides directional yaw stability during flight.',
    description: 'Vertical tail fin maintaining directional stability.',
    source: 'Model geometry',
    position: [-2.5, 1.2, 0],
    status: 'NORMAL'
  },
  rudder: {
    id: 'rudder',
    name: 'Rudder',
    category: 'Flight Control',
    function: 'Controls directional/yaw movement.',
    description: 'Hinged control surface attached to vertical stabilizer.',
    source: 'Model geometry',
    position: [-2.8, 1.2, 0],
    status: 'NORMAL'
  },
  horizontalStabilizer: {
    id: 'horizontalStabilizer',
    name: 'Horizontal Stabilizer',
    category: 'Aerodynamic Structure',
    function: 'Provides longitudinal pitch stability and flight trim control.',
    description: 'Horizontal tailplane structure.',
    source: 'Model geometry',
    position: [-2.6, 1.8, 0],
    status: 'NORMAL'
  },
  elevator: {
    id: 'elevator',
    name: 'Elevator',
    category: 'Flight Control',
    function: 'Controls pitch attitude and aircraft climb/descent angle.',
    description: 'Hinged control surface attached to horizontal tailplane.',
    source: 'Model geometry',
    position: [-2.8, 1.8, 0],
    status: 'NORMAL'
  },
  engine: {
    id: 'engine',
    name: 'Engine',
    category: 'Propulsion',
    function: 'Provides mechanical power for aircraft propulsion.',
    description: 'Four-cylinder, air-cooled, horizontally opposed engine.',
    source: 'Model geometry',
    position: [-0.5, -0.2, 0],
    status: 'NORMAL',
    details: {
      'Powerplant': 'Lycoming O-320 Class',
      'Configuration': '4-cylinder, air-cooled, horizontally opposed',
      'Power': '112 kW / 150 hp'
    }
  },
  engineCowling: {
    id: 'engineCowling',
    name: 'Engine Cowling',
    category: 'Propulsion',
    function: 'Protects engine block and directs cooling airflow.',
    description: 'Aerodynamic engine fairing.',
    source: 'Model geometry',
    position: [-0.5, -0.2, 0],
    status: 'NORMAL'
  },
  propeller: {
    id: 'propeller',
    name: 'Propeller',
    category: 'Propulsion',
    function: 'Converts rotational engine power into thrust.',
    description: 'Propeller assembly driven by the engine.',
    source: 'Model geometry',
    position: [-1.0, -0.2, 0],
    status: 'NORMAL'
  },
  propellerHub: {
    id: 'propellerHub',
    name: 'Propeller Hub',
    category: 'Propulsion',
    function: 'Connects propeller blades to engine drive shaft.',
    description: 'Central hub housing pitch mechanism.',
    source: 'Model geometry',
    position: [-1.0, -0.2, 0],
    status: 'NORMAL'
  },
  landingGear: {
    id: 'landingGear',
    name: 'Landing Gear',
    category: 'Landing System',
    function: 'Supports the aircraft during ground operations, taxiing, takeoff, and landing.',
    description: 'Tricycle strut landing gear assembly.',
    source: 'Model geometry',
    position: [0, -0.6, 0],
    status: 'NORMAL'
  },
  wheels: {
    id: 'wheels',
    name: 'Wheels',
    category: 'Landing System',
    function: 'Provides rolling contact and braking during ground operations.',
    description: 'Main wheel tires and brake disc assembly.',
    source: 'Model geometry',
    position: [0, -0.7, 0],
    status: 'NORMAL'
  },
  sensors: {
    id: 'sensors',
    name: 'Sensors',
    category: 'Avionics & Sensors',
    function: 'Collects airspeed, altitude, and environmental telemetry.',
    description: 'Pitot-static tubes and ambient sensors.',
    source: 'Model geometry',
    position: [2.0, -0.4, 0],
    status: 'NORMAL'
  },
  antennas: {
    id: 'antennas',
    name: 'Antennas',
    category: 'Avionics & Sensors',
    function: 'Transmits and receives real-time telemetry and flight commands.',
    description: 'VHF/UHF telemetry antenna array.',
    source: 'Model geometry',
    position: [1.0, 0.8, 0],
    status: 'NORMAL'
  },

  // Interior / Conceptual Digital-Twin Components
  engineBlock: {
    id: 'engineBlock',
    name: 'Engine Block',
    category: 'Thermal & Systems',
    function: 'Houses crankcase, pistons, and combustion chambers.',
    description: 'Four-cylinder horizontally opposed piston cylinder block.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.5, -0.2, 0],
    status: 'NORMAL',
    details: {
      'Configuration': '4-cylinder, air-cooled, horizontally opposed',
      'Power': '112 kW / 150 hp'
    }
  },
  fuelSystem: {
    id: 'fuelSystem',
    name: 'Fuel System',
    category: 'Thermal & Systems',
    function: 'Delivers metered fuel mixture to engine cylinders.',
    description: 'Fuel lines, feed pumps, and mixture metering control.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.4, 0.2, 0],
    status: 'NORMAL'
  },
  oilSystem: {
    id: 'oilSystem',
    name: 'Oil & Lubrication System',
    category: 'Thermal & Systems',
    function: 'Circulates cooling oil to crankcase bearings and cylinders.',
    description: 'Oil pump, sump, filter, and cooling radiator matrix.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.7, -0.3, 0],
    status: 'NORMAL'
  },
  ecuSystem: {
    id: 'ecuSystem',
    name: 'Engine Health Monitoring ECU',
    category: 'Avionics & Sensors',
    function: 'Processes sensor telemetry and monitors engine health vectors.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [0.5, 0.2, 0],
    status: 'NORMAL'
  }
};
