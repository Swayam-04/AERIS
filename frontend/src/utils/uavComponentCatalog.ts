export interface UAVComponentInfo {
  id: string;
  name: string;
  category: 'Propulsion' | 'Aerodynamic Structure' | 'Flight Control' | 'Avionics & Sensors' | 'Landing Gear' | 'Thermal & Systems';
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
    name: 'Nose Radome & Forward Payload',
    category: 'Avionics & Sensors',
    function: 'Houses data link communications and forward optical sensors.',
    description: 'Streamlined nose section containing tactical telemetry antennas and payload electronics.',
    source: 'Model geometry',
    position: [2.5, 0.4, 0],
    status: 'NORMAL'
  },
  fuselage: {
    id: 'fuselage',
    name: 'Fuselage Main Body',
    category: 'Aerodynamic Structure',
    function: 'Houses payload, fuel bladders, and structural airframe.',
    description: 'Lightweight composite semi-monocoque fuselage structure.',
    source: 'Model geometry',
    position: [0, 0, 0],
    status: 'NORMAL'
  },
  wingRight: {
    id: 'wingRight',
    name: 'Right Wing',
    category: 'Aerodynamic Structure',
    function: 'Generates aerodynamic lift and supports aircraft flight.',
    description: 'High aspect-ratio composite wing providing lift and structural rigidity.',
    source: 'Model geometry',
    position: [0, 0.1, 3.95],
    status: 'NORMAL'
  },
  wingLeft: {
    id: 'wingLeft',
    name: 'Left Wing',
    category: 'Aerodynamic Structure',
    function: 'Generates aerodynamic lift and supports aircraft flight.',
    description: 'High aspect-ratio composite wing providing lift and structural rigidity.',
    source: 'Model geometry',
    position: [0, 0.1, -3.95],
    status: 'NORMAL'
  },
  aileronRight: {
    id: 'aileronRight',
    name: 'Right Aileron',
    category: 'Flight Control',
    function: 'Controls roll angle and banking lateral movement.',
    description: 'Trailing edge control surface attached to the right wing.',
    source: 'Model geometry',
    position: [-0.4, 0.1, 3.5],
    status: 'NORMAL'
  },
  aileronLeft: {
    id: 'aileronLeft',
    name: 'Left Aileron',
    category: 'Flight Control',
    function: 'Controls roll angle and banking lateral movement.',
    description: 'Trailing edge control surface attached to the left wing.',
    source: 'Model geometry',
    position: [-0.4, 0.1, -3.5],
    status: 'NORMAL'
  },
  verticalStabilizer: {
    id: 'verticalStabilizer',
    name: 'Vertical Stabilizer & Tail Fin',
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
    function: 'Controls yaw and directional heading movement.',
    description: 'Hinged control surface on the vertical stabilizer for directional yaw control.',
    source: 'Model geometry',
    position: [-2.8, 1.2, 0],
    status: 'NORMAL'
  },
  horizontalStabilizer: {
    id: 'horizontalStabilizer',
    name: 'Horizontal Stabilizer',
    category: 'Aerodynamic Structure',
    function: 'Provides longitudinal pitch stability and trim control.',
    description: 'Tailplane structure maintaining pitch equilibrium.',
    source: 'Model geometry',
    position: [-2.6, 1.8, 0],
    status: 'NORMAL'
  },
  elevator: {
    id: 'elevator',
    name: 'Elevator',
    category: 'Flight Control',
    function: 'Controls pitch attitude and aircraft climb/descent angle.',
    description: 'Hinged control surface on the horizontal tailplane.',
    source: 'Model geometry',
    position: [-2.8, 1.8, 0],
    status: 'NORMAL'
  },
  engine: {
    id: 'engine',
    name: 'Lycoming O-320',
    category: 'Propulsion',
    function: 'Provides propulsion power to the aircraft.',
    description: 'Four-cylinder, air-cooled, horizontally opposed engine producing 112 kW / 150 hp.',
    source: 'Model geometry',
    position: [-0.5, -0.2, 0],
    status: 'NORMAL',
    details: {
      'Configuration': '4-cylinder, air-cooled, horizontally opposed',
      'Power': '112 kW / 150 hp',
      'Powerplant': '1 × Lycoming O-320'
    }
  },
  engineCowling: {
    id: 'engineCowling',
    name: 'Engine Cowling & Nacelle',
    category: 'Propulsion',
    function: 'Protects engine block and directs cooling air.',
    description: 'Aerodynamic fairing housing the Lycoming O-320 powerplant.',
    source: 'Model geometry',
    position: [-0.5, -0.2, 0],
    status: 'NORMAL'
  },
  propeller: {
    id: 'propeller',
    name: 'Propeller Assembly',
    category: 'Propulsion',
    function: 'Converts rotational engine power into aircraft thrust.',
    description: 'Pusher propeller assembly driven by the Lycoming O-320 engine.',
    source: 'Model geometry',
    position: [-1.0, -0.2, 0],
    status: 'NORMAL'
  },
  landingGear: {
    id: 'landingGear',
    name: 'Landing Gear & Wheels',
    category: 'Landing Gear',
    function: 'Supports aircraft during ground operations, taxiing, takeoff, and landing.',
    description: 'Main wheel struts and nose gear assembly.',
    source: 'Model geometry',
    position: [0, -0.6, 0],
    status: 'NORMAL'
  },
  antennas: {
    id: 'antennas',
    name: 'Tactical Sensors & Antennas',
    category: 'Avionics & Sensors',
    function: 'Handles command data link, telemetry, and payload communication.',
    description: 'Antenna array and environmental sensor probes.',
    source: 'Model geometry',
    position: [1.0, 0.8, 0],
    status: 'NORMAL'
  },

  // Interior / Conceptual Digital-Twin Components
  engineBlock: {
    id: 'engineBlock',
    name: 'Lycoming O-320 Engine Block',
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
    name: 'Fuel Delivery & Injection Lines',
    category: 'Thermal & Systems',
    function: 'Delivers metered fuel mixture to engine cylinders.',
    description: 'Fuel lines, feed pumps, and mixture metering control.',
    source: 'CONCEPTUAL DIGITAL-TWIN COMPONENT',
    position: [-0.4, 0.2, 0],
    status: 'NORMAL'
  },
  oilSystem: {
    id: 'oilSystem',
    name: 'Engine Lubrication Loop',
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
