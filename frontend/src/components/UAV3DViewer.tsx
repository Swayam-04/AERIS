import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { UAV3DState } from '../types/telemetry';
import {
  Eye,
  Flame,
  ShieldAlert,
  Cpu,
  Focus,
  Maximize2,
  Minimize2,
  Activity,
  Layers,
  Radio,
  Gauge,
  Thermometer,
  Zap,
  Info,
  Sliders,
  Box,
  Crosshair,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize,
  ExternalLink
} from 'lucide-react';

interface UAV3DViewerProps {
  state: UAV3DState | null;
  height?: string;
  showOverlay?: boolean;
}

export type ViewMode = 'exterior' | 'internal' | 'cutaway' | 'exploded';

export interface InternalComponent {
  id: string;
  name: string;
  subsystem: string;
  position: [number, number, number];
  healthPct: number;
  status: 'healthy' | 'warning' | 'critical';
  modelStatus: 'expected' | 'deviating';
  description: string;
  telemetry: { [key: string]: string };
}

export const UAV3DViewer: React.FC<UAV3DViewerProps> = ({
  state,
  height = 'h-full',
  showOverlay = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Node & Mesh References
  const uavRootRef = useRef<THREE.Group | null>(null);
  const exteriorShellRef = useRef<THREE.Group | null>(null);
  const internalSystemsRef = useRef<THREE.Group | null>(null);
  const rightPropRef = useRef<THREE.Group | null>(null);
  const leftPropRef = useRef<THREE.Group | null>(null);
  const engineNodeRef = useRef<THREE.Object3D | null>(null);

  // Individual Internal Sub-assembly References
  const engineBlockMeshRef = useRef<THREE.Group | null>(null);
  const drivetrainMeshRef = useRef<THREE.Group | null>(null);
  const fuelSystemMeshRef = useRef<THREE.Group | null>(null);
  const oilSystemMeshRef = useRef<THREE.Group | null>(null);
  const electricalMeshRef = useRef<THREE.Group | null>(null);
  const ecuMeshRef = useRef<THREE.Group | null>(null);

  // UI Control State
  const [viewMode, setViewMode] = useState<ViewMode>('exterior');
  const [cutawayOpacity, setCutawayOpacity] = useState<number>(0.25);
  const [wireframe, setWireframe] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<InternalComponent | null>(null);
  const [highlightedParameter, setHighlightedParameter] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCustomModelLoaded, setIsCustomModelLoaded] = useState(false);

  // User Interactive Drag State
  const isUserInteracting = useRef<boolean>(false);

  // Target Camera Interpolation Vectors
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(12, 8, 16));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Exploded View Progress (0.0 to 1.0)
  const explodedProgress = useRef<number>(0.0);

  // Define Internal Components List
  const getInternalComponents = (): InternalComponent[] => {
    if (!state) return [];
    return [
      {
        id: 'engineBlock',
        name: 'Aero-Piston Engine Block (Rotax 914/915 iS)',
        subsystem: 'Thermal & Combustion',
        position: [-0.8, -0.2, 1.8],
        healthPct: Math.round(state.engineHealth),
        status: state.engineStatus === 'critical' ? 'critical' : state.engineStatus === 'warning' ? 'warning' : 'healthy',
        modelStatus: state.cht > 210 || state.egt > 880 ? 'deviating' : 'expected',
        description: '4-stroke 4-cylinder turbocharged aero-piston engine block powering DRDO RUSTOM-II MALE UAV.',
        telemetry: {
          'RPM': `${state.rpm} RPM`,
          'CHT': `${state.cht} °C`,
          'EGT': `${state.egt} °C`,
          'Vibration': `${state.vibration} g`
        }
      },
      {
        id: 'drivetrain',
        name: 'Propeller Drivetrain & Pitch Governor',
        subsystem: 'Mechanical Propulsion',
        position: [-1.6, 0, 1.8],
        healthPct: state.vibration > 2.2 ? 55 : 98,
        status: state.vibration > 2.2 ? 'critical' : state.vibration > 1.2 ? 'warning' : 'healthy',
        modelStatus: state.vibration > 1.2 ? 'deviating' : 'expected',
        description: 'Propeller speed reduction gearbox (PRSU) with hydraulic constant-speed propeller pitch governor hub.',
        telemetry: {
          'Propeller RPM': `${state.rpm} RPM`,
          'Vibration': `${state.vibration} g RMS`,
          'Gear Ratio': '1:2.43'
        }
      },
      {
        id: 'fuelSystem',
        name: 'Electronic Fuel Injection (EFI) Rail',
        subsystem: 'Fuel & Air Mixture',
        position: [-0.6, 0.3, 1.8],
        healthPct: state.activeFault?.includes('injector') ? 42 : 96,
        status: state.activeFault?.includes('injector') ? 'critical' : 'healthy',
        modelStatus: state.activeFault?.includes('injector') ? 'deviating' : 'expected',
        description: 'Dual redundant electronic fuel injectors, high-pressure electric fuel pump, and intake plenum.',
        telemetry: {
          'Fuel Flow': '18.4 L/h',
          'Rail Pressure': '4.2 bar',
          'Injection Timing': '18° BTDC'
        }
      },
      {
        id: 'oilSystem',
        name: 'Crankcase Lubrication & Oil Cooler Matrix',
        subsystem: 'Lubrication',
        position: [-1.1, -0.4, 1.8],
        healthPct: state.oilPressure < 28 ? 48 : 95,
        status: state.oilPressure < 28 ? 'critical' : state.oilPressure < 35 ? 'warning' : 'healthy',
        modelStatus: state.oilPressure < 35 ? 'deviating' : 'expected',
        description: 'Dry sump oil lubrication system, positive displacement trochoid pump, thermostat, and radiator matrix.',
        telemetry: {
          'Oil Pressure': `${state.oilPressure} PSI`,
          'Oil Temperature': '88.5 °C',
          'Sump Capacity': '3.8 L'
        }
      },
      {
        id: 'electricalSystem',
        name: 'Alternator & Dual Ignition Power Bus',
        subsystem: 'Electrical & Ignition',
        position: [-0.3, -0.1, 1.8],
        healthPct: 99,
        status: 'healthy',
        modelStatus: 'expected',
        description: '28V DC 1.2kW heavy-duty alternator, dual capacitor discharge ignition (CDI) coils, and main power bus.',
        telemetry: {
          'Bus Voltage': '28.2 V',
          'Current Load': '34.5 A',
          'CDI Primary': 'Nominal'
        }
      },
      {
        id: 'ecuSystem',
        name: 'Engine Control Unit (ECU) & Sensor Module',
        subsystem: 'Avionics & Control',
        position: [0.8, 0.2, 0],
        healthPct: 97,
        status: 'healthy',
        modelStatus: 'expected',
        description: 'Dual channel full-authority digital engine control unit (FADEC/ECU) with telemetry interface.',
        telemetry: {
          'ECU Channel A': 'Active (Master)',
          'ECU Channel B': 'Standby (Synced)',
          'Sensor Bus': '100% Valid'
        }
      }
    ];
  };

  const internalComponents = getInternalComponents();

  // Auto-Focus Camera & Highlight Component when AI Fault is Detected
  useEffect(() => {
    if (!state) return;

    if (state.engineStatus === 'critical' || state.engineStatus === 'warning') {
      if (viewMode === 'exterior') {
        setViewMode('cutaway');
      }

      let targetId = 'engineBlock';
      if (state.activeAlert?.toLowerCase().includes('injector') || state.activeFault?.includes('injector')) {
        targetId = 'fuelSystem';
        setHighlightedParameter('Fuel Flow');
      } else if (state.activeAlert?.toLowerCase().includes('lubrication') || state.activeAlert?.toLowerCase().includes('oil')) {
        targetId = 'oilSystem';
        setHighlightedParameter('Oil pressure');
      } else if (state.activeAlert?.toLowerCase().includes('misfire') || state.activeAlert?.toLowerCase().includes('vibration')) {
        targetId = 'drivetrain';
        setHighlightedParameter('Vibration');
      } else if (state.activeAlert?.toLowerCase().includes('overheating') || state.activeAlert?.toLowerCase().includes('cht')) {
        targetId = 'engineBlock';
        setHighlightedParameter('CHT');
      }

      const comp = internalComponents.find((c) => c.id === targetId);
      if (comp) {
        setSelectedComponent(comp);
      }
    }
  }, [state?.activeAlert, state?.engineStatus]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const heightPx = container.clientHeight || 500;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#070b14');
    scene.fog = new THREE.FogExp2('#070b14', 0.012);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 1000);
    camera.position.set(12, 8, 16);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (Unconstrained 360° Spherical Rotation + Touch Support)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.enableZoom = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 60.0;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.screenSpacePanning = true;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // User drag event handlers
    controls.addEventListener('start', () => {
      isUserInteracting.current = true;
    });

    controls.addEventListener('end', () => {
      isUserInteracting.current = false;
      targetCamPos.current.copy(camera.position);
      targetLookAt.current.copy(controls.target);
    });

    controlsRef.current = controls;

    // 5. Realistic Aerospace Lighting Setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#e2e8f0', 1.8);
    sunLight.position.set(15, 25, 18);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.8);
    rimLight.position.set(-15, 12, -15);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight('#94a3b8', 0.5);
    fillLight.position.set(0, -10, 0);
    scene.add(fillLight);

    const interiorLight = new THREE.PointLight('#ffffff', 2.0, 15);
    interiorLight.position.set(0, 0.5, 0);
    scene.add(interiorLight);

    // Grid Floor
    const grid = new THREE.GridHelper(60, 40, '#0284c7', '#1e293b');
    grid.position.y = -3.5;
    scene.add(grid);

    // 6. Root Group for DRDO RUSTOM-II
    const uavRootGroup = new THREE.Group();
    uavRootGroup.name = "DRDO_RUSTOM_II";
    uavRootRef.current = uavRootGroup;
    scene.add(uavRootGroup);

    // Setup GLTFLoader + DRACOLoader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Model candidate files to load (tries downloaded Sketchfab asset first)
    const modelCandidates = [
      '/models/drdo_rustom_2_uav.glb',
      '/models/drdo_rustom_2_uav.gltf',
      '/models/tapas_bh201_rustom2.gltf'
    ];

    const tryLoadNextModel = (index: number) => {
      if (index >= modelCandidates.length) return;
      gltfLoader.load(
        modelCandidates[index],
        (gltf) => {
          if (gltf && gltf.scene) {
            let meshCount = 0;
            gltf.scene.traverse((child) => {
              if (child instanceof THREE.Mesh) meshCount++;
              const nameLower = child.name.toLowerCase();
              if (nameLower.includes('engine') || nameLower.includes('rotax') || nameLower.includes('nacelle')) {
                engineNodeRef.current = child;
              }
            });

            if (meshCount > 0) {
              if (exteriorShellRef.current) {
                exteriorShellRef.current.visible = false;
              }
              uavRootGroup.add(gltf.scene);
              setIsCustomModelLoaded(true);

              // Calculate bounding box and update OrbitControls bounds dynamically
              const box = new THREE.Box3().setFromObject(gltf.scene);
              const sphere = box.getBoundingSphere(new THREE.Sphere());
              if (controlsRef.current && sphere.radius > 0) {
                controlsRef.current.minDistance = Math.max(0.5, sphere.radius * 0.2);
                controlsRef.current.maxDistance = Math.max(50.0, sphere.radius * 6.0);
              }
            } else {
              tryLoadNextModel(index + 1);
            }
          }
        },
        undefined,
        () => {
          tryLoadNextModel(index + 1);
        }
      );
    };

    tryLoadNextModel(0);

    // Baseline DRDO Rustom-II Materials
    const drdoLightGreyMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.35,
      roughness: 0.38,
      transparent: true,
      opacity: 1.0,
    });

    const drdoDarkGreyMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.5,
      roughness: 0.3,
      transparent: true,
      opacity: 1.0,
    });

    const satcomRadomeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.15,
      roughness: 0.15,
      transparent: true,
      opacity: 1.0,
    });

    const nacelleMaterial = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.2,
      transparent: true,
      opacity: 1.0,
    });

    const metallicChromeMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const rubberMaterial = new THREE.MeshStandardMaterial({ color: 0x090d16, metalness: 0.1, roughness: 0.8 });

    // --- EXTERIOR SHELL MESHES ---
    const exteriorShellGroup = new THREE.Group();
    exteriorShellGroup.name = "exteriorShell";
    exteriorShellRef.current = exteriorShellGroup;
    uavRootGroup.add(exteriorShellGroup);

    // Fuselage
    const fuselageGeo = new THREE.CylinderGeometry(0.72, 0.42, 9.4, 24);
    const mainBody = new THREE.Mesh(fuselageGeo, drdoLightGreyMaterial);
    mainBody.rotation.z = Math.PI / 2;
    mainBody.castShadow = true;
    mainBody.name = "Fuselage";
    exteriorShellGroup.add(mainBody);

    // Nose SATCOM Radome Bulge
    const satcomGeo = new THREE.SphereGeometry(0.72, 20, 20);
    satcomGeo.scale(2.3, 0.48, 0.78);
    const satcomMesh = new THREE.Mesh(satcomGeo, drdoLightGreyMaterial);
    satcomMesh.position.set(1.4, 0.65, 0);
    satcomMesh.name = "Nose_SATCOM";
    exteriorShellGroup.add(satcomMesh);

    // Front Nose Radome Cap
    const noseGeo = new THREE.SphereGeometry(0.72, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, satcomRadomeMaterial);
    noseMesh.rotation.z = -Math.PI / 2;
    noseMesh.position.set(4.7, 0, 0);
    noseMesh.name = "Nose_Cap";
    exteriorShellGroup.add(noseMesh);

    // Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-1.0, 0);
    wingShape.lineTo(1.0, 0);
    wingShape.lineTo(0.5, 11.8);
    wingShape.lineTo(-0.5, 11.8);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.14, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);

    const rightWingMesh = new THREE.Mesh(wingGeo, drdoLightGreyMaterial);
    rightWingMesh.rotation.x = Math.PI / 2;
    rightWingMesh.position.set(0.1, 0.1, 0);
    rightWingMesh.name = "Right_Wing";
    exteriorShellGroup.add(rightWingMesh);

    const leftWingMesh = new THREE.Mesh(wingGeo, drdoLightGreyMaterial);
    leftWingMesh.rotation.x = -Math.PI / 2;
    leftWingMesh.position.set(0.1, 0.1, 0);
    leftWingMesh.name = "Left_Wing";
    exteriorShellGroup.add(leftWingMesh);

    // Nacelles
    const nacelleGeo = new THREE.CylinderGeometry(0.56, 0.56, 2.1, 20);
    
    const rightEngineNacelle = new THREE.Mesh(nacelleGeo, nacelleMaterial);
    rightEngineNacelle.rotation.z = Math.PI / 2;
    rightEngineNacelle.position.set(-0.8, -0.2, 1.8);
    rightEngineNacelle.name = "Engine_RightNacelle";
    exteriorShellGroup.add(rightEngineNacelle);

    const leftEngineNacelle = new THREE.Mesh(nacelleGeo, nacelleMaterial);
    leftEngineNacelle.rotation.z = Math.PI / 2;
    leftEngineNacelle.position.set(-0.8, -0.2, -1.8);
    leftEngineNacelle.name = "Engine_LeftNacelle";
    exteriorShellGroup.add(leftEngineNacelle);

    // High T-Tail Assembly
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.2, 0.12), drdoLightGreyMaterial);
    tailFin.position.set(-4.5, 1.9, 0);
    tailFin.name = "Vertical_Tail";
    exteriorShellGroup.add(tailFin);

    const horizStab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 4.2), drdoDarkGreyMaterial);
    horizStab.position.set(-4.75, 3.4, 0);
    horizStab.name = "Horizontal_Tail";
    exteriorShellGroup.add(horizStab);

    // Dual Propellers
    const propHubGeo = new THREE.ConeGeometry(0.3, 0.5, 16);
    const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const tipMaterial = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 });

    const rightPropGroup = new THREE.Group();
    rightPropGroup.position.set(-1.85, -0.2, 1.8);
    rightPropRef.current = rightPropGroup;
    exteriorShellGroup.add(rightPropGroup);

    const rightHub = new THREE.Mesh(propHubGeo, metallicChromeMaterial);
    rightHub.rotation.z = -Math.PI / 2;
    rightPropGroup.add(rightHub);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bGroup = new THREE.Group();
      bGroup.rotation.x = angle;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.9, 0.18), bladeMaterial);
      blade.position.y = 0.95;
      bGroup.add(blade);

      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.22, 0.182), tipMaterial);
      tip.position.y = 1.9;
      bGroup.add(tip);

      rightPropGroup.add(bGroup);
    }

    const leftPropGroup = new THREE.Group();
    leftPropGroup.position.set(-1.85, -0.2, -1.8);
    leftPropRef.current = leftPropGroup;
    exteriorShellGroup.add(leftPropGroup);

    const leftHub = new THREE.Mesh(propHubGeo, metallicChromeMaterial);
    leftHub.rotation.z = -Math.PI / 2;
    leftPropGroup.add(leftHub);

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const bGroup = new THREE.Group();
      bGroup.rotation.x = angle;

      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.9, 0.18), bladeMaterial);
      blade.position.y = 0.95;
      bGroup.add(blade);

      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.22, 0.182), tipMaterial);
      tip.position.y = 1.9;
      bGroup.add(tip);

      leftPropGroup.add(bGroup);
    }

    // --- DETAILED INTERNAL ENGINEERING SUB-ASSEMBLIES ---
    const internalSystemsGroup = new THREE.Group();
    internalSystemsGroup.name = "internalSystems";
    internalSystemsRef.current = internalSystemsGroup;
    exteriorShellGroup.add(internalSystemsGroup);

    const metalEngineMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.15 });
    const cylinderHeadMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2, emissive: 0x06b6d4, emissiveIntensity: 0.2 });
    const fuelRailMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 });
    const oilSumpMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.6, roughness: 0.4 });
    const electricalMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, metalness: 0.5, roughness: 0.5 });
    const ecuBoxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.2 });

    // Engine Block
    const engineBlockGroup = new THREE.Group();
    engineBlockGroup.name = "comp_engineBlock";
    engineBlockMeshRef.current = engineBlockGroup;
    engineBlockGroup.position.set(-0.8, -0.2, 1.8);
    internalSystemsGroup.add(engineBlockGroup);

    const crankcaseGeo = new THREE.BoxGeometry(1.6, 0.7, 0.7);
    const crankcase = new THREE.Mesh(crankcaseGeo, metalEngineMat);
    engineBlockGroup.add(crankcase);

    for (let i = 0; i < 4; i++) {
      const cylGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.4, 16);
      const cyl = new THREE.Mesh(cylGeo, cylinderHeadMat);
      cyl.position.set(-0.5 + i * 0.32, 0.4, 0);
      engineBlockGroup.add(cyl);
    }

    // Drivetrain
    const drivetrainGroup = new THREE.Group();
    drivetrainGroup.name = "comp_drivetrain";
    drivetrainMeshRef.current = drivetrainGroup;
    drivetrainGroup.position.set(-1.6, 0, 1.8);
    internalSystemsGroup.add(drivetrainGroup);

    const gearbox = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.5, 16), metalEngineMat);
    gearbox.rotation.z = Math.PI / 2;
    drivetrainGroup.add(gearbox);

    // Fuel System
    const fuelGroup = new THREE.Group();
    fuelGroup.name = "comp_fuelSystem";
    fuelSystemMeshRef.current = fuelGroup;
    fuelGroup.position.set(-0.6, 0.3, 1.8);
    internalSystemsGroup.add(fuelGroup);

    const fuelRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 12), fuelRailMat);
    fuelRail.rotation.z = Math.PI / 2;
    fuelGroup.add(fuelRail);

    // Oil System
    const oilGroup = new THREE.Group();
    oilGroup.name = "comp_oilSystem";
    oilSystemMeshRef.current = oilGroup;
    oilGroup.position.set(-1.1, -0.4, 1.8);
    internalSystemsGroup.add(oilGroup);

    const oilSump = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.5), oilSumpMat);
    oilGroup.add(oilSump);

    // Electrical & ECU
    const elecGroup = new THREE.Group();
    elecGroup.name = "comp_electricalSystem";
    electricalMeshRef.current = elecGroup;
    elecGroup.position.set(-0.3, -0.1, 1.8);
    internalSystemsGroup.add(elecGroup);

    const ecuGroup = new THREE.Group();
    ecuGroup.name = "comp_ecuSystem";
    ecuMeshRef.current = ecuGroup;
    ecuGroup.position.set(0.8, 0.2, 0);
    internalSystemsGroup.add(ecuGroup);

    const ecuBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), ecuBoxMat);
    ecuGroup.add(ecuBox);

    // Raycaster Component Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (internalSystemsRef.current) {
        const intersects = raycaster.intersectObjects(internalSystemsRef.current.children, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          while (hitObj && !hitObj.name.startsWith('comp_') && hitObj.parent) {
            hitObj = hitObj.parent;
          }
          if (hitObj && hitObj.name.startsWith('comp_')) {
            const compId = hitObj.name.replace('comp_', '');
            const foundComp = internalComponents.find((c) => c.id === compId);
            if (foundComp) {
              setSelectedComponent(foundComp);
              targetCamPos.current.set(foundComp.position[0] - 2.5, foundComp.position[1] + 1.2, foundComp.position[2] + 2.0);
              targetLookAt.current.set(...foundComp.position);
              if (controlsRef.current) {
                controlsRef.current.target.set(...foundComp.position);
              }
              return;
            }
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Render & Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Spin Propellers dynamically based on real-time RPM telemetry
      const rpmSpeed = state?.rpm ? (state.rpm / 450.0) : 12.0;
      if (rightPropRef.current) rightPropRef.current.rotation.x += delta * rpmSpeed;
      if (leftPropRef.current) leftPropRef.current.rotation.x += delta * rpmSpeed;

      // Smooth Pitch & Floating
      uavRootGroup.position.y = Math.sin(clock.getElapsedTime() * 0.7) * 0.12;
      uavRootGroup.rotation.z = Math.sin(clock.getElapsedTime() * 0.4) * 0.015;

      // Smooth Exploded View Offsets Transition
      const targetExploded = viewMode === 'exploded' ? 1.0 : 0.0;
      explodedProgress.current = THREE.MathUtils.lerp(explodedProgress.current, targetExploded, 0.08);

      if (exteriorShellRef.current) {
        const exp = explodedProgress.current;
        exteriorShellRef.current.children.forEach((child) => {
          if (child.name === 'Nose_SATCOM' || child.name === 'Fuselage') {
            child.position.y = (child.name === 'Nose_SATCOM' ? 0.65 : 0) + exp * 1.8;
          } else if (child.name === 'Nose_Cap') {
            child.position.x = 4.7 + exp * 1.6;
          } else if (child.name === 'Engine_RightNacelle' || child.name === 'Engine_LeftNacelle') {
            child.position.y = -0.2 + exp * 1.2;
          }
        });
      }

      // Smooth Camera Animation (Only lerp when user is NOT actively dragging mouse/touch)
      if (isUserInteracting.current && cameraRef.current && controlsRef.current) {
        targetCamPos.current.copy(cameraRef.current.position);
        targetLookAt.current.copy(controlsRef.current.target);
      } else {
        camera.position.lerp(targetCamPos.current, 0.08);
        controls.target.lerp(targetLookAt.current, 0.08);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Shell Opacity based on View Mode
  useEffect(() => {
    if (!exteriorShellRef.current) return;

    let targetOpacity = 1.0;
    if (viewMode === 'internal') {
      targetOpacity = 0.22;
    } else if (viewMode === 'cutaway') {
      targetOpacity = cutawayOpacity;
    } else if (viewMode === 'exploded') {
      targetOpacity = 0.65;
    }

    exteriorShellRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.transparent = targetOpacity < 0.99;
        mat.opacity = targetOpacity;
        mat.depthWrite = targetOpacity > 0.6;
        mat.needsUpdate = true;
      }
    });
  }, [viewMode, cutawayOpacity]);

  // Wireframe toggle
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.wireframe = wireframe;
      }
    });
  }, [wireframe]);

  // --- CAMERA & VIEW CONTROL HANDLERS ---
  const handleZoomIn = () => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    targetCamPos.current.addScaledVector(dir, 2.5);
  };

  const handleZoomOut = () => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    targetCamPos.current.addScaledVector(dir, -2.5);
  };

  const handleFitToView = () => {
    if (!uavRootRef.current || !cameraRef.current) return;
    const root = uavRootRef.current;
    const box = new THREE.Box3().setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    const sphere = box.getBoundingSphere(new THREE.Sphere());

    targetLookAt.current.copy(center);
    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
    }
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const radius = sphere.radius > 0 ? sphere.radius : 12.0;
    const dist = Math.abs(radius / Math.sin(fov / 2)) * 1.25;
    targetCamPos.current.set(center.x + dist * 0.7, center.y + dist * 0.4, center.z + dist * 0.7);
    setSelectedComponent(null);
  };

  const handleEngineFocus = () => {
    setViewMode('cutaway');
    let engineWorldPos = new THREE.Vector3(-0.8, -0.2, 1.8);
    if (engineNodeRef.current) {
      engineNodeRef.current.getWorldPosition(engineWorldPos);
    }
    targetLookAt.current.copy(engineWorldPos);
    if (controlsRef.current) {
      controlsRef.current.target.copy(engineWorldPos);
    }
    targetCamPos.current.set(engineWorldPos.x - 1.2, engineWorldPos.y + 1.0, engineWorldPos.z + 2.2);
  };

  const handleResetView = () => {
    setViewMode('exterior');
    targetCamPos.current.set(12, 8, 16);
    targetLookAt.current.set(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
    setSelectedComponent(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${height} rounded-xl overflow-hidden glass-panel border border-slate-800 bg-[#070b14]`}
    >
      {/* Three.js WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 1. TOP CONTROL ROW (View Mode Controls ONLY) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-xl text-xs shadow-2xl">
        <button
          onClick={() => { setViewMode('exterior'); setSelectedComponent(null); }}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            viewMode === 'exterior'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Exterior
        </button>

        <button
          onClick={() => setViewMode('internal')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            viewMode === 'internal'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Internal View
        </button>

        <button
          onClick={() => setViewMode('cutaway')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            viewMode === 'cutaway'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Cutaway
        </button>

        <button
          onClick={() => setViewMode('exploded')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition ${
            viewMode === 'exploded'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Exploded
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          onClick={handleEngineFocus}
          className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-semibold flex items-center gap-1.5 transition"
          title="Focus camera directly onto Rotax aero-piston engine nacelle"
        >
          <Focus size={14} />
          <span>Engine Focus</span>
        </button>
      </div>

      {/* Cutaway Opacity Progress Slider */}
      {viewMode === 'cutaway' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-950/90 px-4 py-2 rounded-xl border border-cyan-500/40 backdrop-blur-xl text-xs font-mono text-slate-200">
          <span className="text-slate-400 font-sans font-semibold">Shell Cutaway Depth:</span>
          <input
            type="range"
            min="0.0"
            max="0.9"
            step="0.05"
            value={1.0 - cutawayOpacity}
            onChange={(e) => setCutawayOpacity(1.0 - parseFloat(e.target.value))}
            className="w-36 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-cyan-400 font-bold">{((1.0 - cutawayOpacity) * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Top Left Aircraft Identity & Attribution Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-slate-800 backdrop-blur-md font-mono text-xs shadow-xl">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-100 font-bold uppercase">DRDO RUSTOM-II</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 text-[10px]">3D Digital Twin</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-400 font-semibold uppercase">{viewMode} MODE</span>
        </div>
        <div className="bg-slate-950/85 px-2.5 py-1 rounded-lg border border-slate-800/80 backdrop-blur-md font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
          <Info size={12} className="text-cyan-400 shrink-0" />
          <span>Model: DRDO Rustom 2 UAV by Priyajit Bera (Sketchfab CC BY)</span>
        </div>
      </div>

      {/* Conceptual Digital-Twin Visualization Banner */}
      {viewMode !== 'exterior' && (
        <div className="absolute top-20 left-4 z-10 bg-slate-950/90 border border-amber-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md font-mono text-[10px] text-amber-300 flex items-center gap-2 max-w-sm">
          <Info size={14} className="text-amber-400 shrink-0" />
          <span>CONCEPTUAL DIGITAL-TWIN INTERNAL VIEW — Aero Engine Health Monitoring</span>
        </div>
      )}

      {/* Selected Internal Component Inspection Panel */}
      {selectedComponent && (
        <div className="absolute top-16 right-4 z-30 max-w-sm w-80 glass-panel p-4 rounded-xl border border-cyan-500/60 bg-slate-950/95 backdrop-blur-xl text-xs space-y-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider block">
                {selectedComponent.subsystem}
              </span>
              <h4 className="font-bold text-slate-100 text-xs">{selectedComponent.name}</h4>
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="text-slate-400 hover:text-slate-200 font-bold px-1"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">HEALTH STATUS:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase ${
              selectedComponent.status === 'critical' ? 'bg-rose-500 text-slate-950' :
              selectedComponent.status === 'warning' ? 'bg-amber-500 text-slate-950' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {selectedComponent.healthPct}% — {selectedComponent.status}
            </span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">{selectedComponent.description}</p>

          <div className="space-y-1.5 pt-1 border-t border-slate-800 font-mono text-[11px]">
            <span className="text-slate-500 block text-[10px] font-sans font-semibold">COMPONENT TELEMETRY</span>
            {Object.entries(selectedComponent.telemetry).map(([k, v]) => (
              <div key={k} className="flex justify-between py-0.5 border-b border-slate-900">
                <span className="text-slate-400">{k}:</span>
                <span className="text-cyan-400 font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. BOTTOM LEFT: RUSTOM DIGITAL TWIN OVERLAY HUD CARD */}
      {showOverlay && state && (
        <div className="absolute bottom-4 left-4 z-10 max-w-xs glass-panel p-3.5 rounded-xl border border-slate-700/70 bg-slate-950/90 backdrop-blur-xl text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="text-cyan-400" size={16} />
              <span className="font-semibold text-slate-200 uppercase tracking-wider">RUSTOM Digital Twin</span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
              state.engineStatus === 'critical' ? 'bg-rose-500 text-slate-950' :
              state.engineStatus === 'warning' ? 'bg-amber-500 text-slate-950' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
            }`}>
              {state.engineStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">RPM SPEED</span>
              <span className="text-cyan-400 font-bold">{state.rpm} RPM</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CHT TEMP</span>
              <span className="text-slate-200">{state.cht} °C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">EGT TEMP</span>
              <span className="text-slate-200">{state.egt} °C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">OIL PRESS</span>
              <span className="text-slate-200">{state.oilPressure} PSI</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">VIBRATION</span>
              <span className="text-slate-200">{state.vibration} g</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">HEALTH</span>
              <span className="text-emerald-400 font-bold">{state.engineHealth}%</span>
            </div>
          </div>

          {state.activeAlert && state.activeAlert !== 'None' && (
            <div className="pt-1.5 border-t border-slate-800 text-rose-400 font-medium flex items-center gap-1.5">
              <ShieldAlert size={14} className="shrink-0 animate-pulse" />
              <span className="truncate">{state.activeAlert}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. BOTTOM RIGHT FLOATING CONTROL BAR */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md text-xs shadow-2xl select-none">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition font-bold"
          title="Zoom In (+)"
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition font-bold"
          title="Zoom Out (−)"
        >
          <ZoomOut size={16} />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition font-bold"
          title="Fullscreen Viewport (⛶)"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        <button
          onClick={handleResetView}
          className="p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition font-bold"
          title="Reset View (↻)"
        >
          <RotateCcw size={15} />
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          className={`p-2 rounded-lg transition font-bold ${
            wireframe ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
          }`}
          title="Toggle Mesh View (◉)"
        >
          <Eye size={16} />
        </button>

        <button
          onClick={handleFitToView}
          className="p-2 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition font-bold"
          title="Expand / Fit Model to View (↗)"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
};
