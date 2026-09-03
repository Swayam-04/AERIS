import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DigitalTwinState, FaultType } from '../types/telemetry';
import {
  ENGINE_COMPONENT_CATALOG,
  EngineComponentInfo,
  FAULT_TO_ENGINE_COMPONENT_MAP,
  FaultComponentMapping
} from '../utils/engineComponentCatalog';
import {
  RotateCcw,
  Eye,
  Layers,
  Crosshair,
  Compass,
  AlertTriangle,
  Flame,
  Activity,
  Zap,
  Droplets,
  Radio,
  Sliders,
  CheckCircle2,
  Info
} from 'lucide-react';

interface Engine3DViewerProps {
  state: DigitalTwinState | null;
  selectedComponentId: string | null;
  onSelectComponent: (comp: EngineComponentInfo) => void;
  height?: string;
}

export type EngineViewMode = 'exterior' | 'cutaway';

export const Engine3DViewer: React.FC<Engine3DViewerProps> = ({
  state,
  selectedComponentId,
  onSelectComponent,
  height = 'h-[520px]'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const engineRootRef = useRef<THREE.Group | null>(null);

  // View mode: Exterior vs Cutaway
  const [viewMode, setViewMode] = useState<EngineViewMode>('cutaway');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [hoveredComp, setHoveredComp] = useState<EngineComponentInfo | null>(null);

  // 2D Callout screen projection coordinates
  const [calloutScreenPos, setCalloutScreenPos] = useState<{ x: number; y: number; visible: boolean } | null>(null);

  // Materials & Mesh references cache
  const meshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
  const exteriorMaterialsRef = useRef<THREE.Material[]>([]);
  const internalMeshesRef = useRef<THREE.Object3D[]>([]);

  // Camera Animation Interpolation
  const isAnimatingCam = useRef<boolean>(false);
  const camStartPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const camEndPos = useRef<THREE.Vector3>(new THREE.Vector3());
  const camStartTarget = useRef<THREE.Vector3>(new THREE.Vector3());
  const camEndTarget = useRef<THREE.Vector3>(new THREE.Vector3());
  const camAnimProgress = useRef<number>(1.0);

  // Active fault mapping lookup
  const activeFaultMapping: FaultComponentMapping | null = useMemo(() => {
    if (!state || state.active_fault === 'none') return null;
    return FAULT_TO_ENGINE_COMPONENT_MAP[state.active_fault] || null;
  }, [state?.active_fault]);

  const activeFaultComponent: EngineComponentInfo | null = useMemo(() => {
    if (!activeFaultMapping) return null;
    return ENGINE_COMPONENT_CATALOG[activeFaultMapping.componentId] || null;
  }, [activeFaultMapping]);

  // Selected Component info
  const selectedCompInfo = useMemo(() => {
    if (!selectedComponentId) return null;
    return ENGINE_COMPONENT_CATALOG[selectedComponentId] || null;
  }, [selectedComponentId]);

  // Smooth camera animation helper
  const animateCameraTo = useCallback((targetPos: [number, number, number], lookAtPos: [number, number, number]) => {
    if (!cameraRef.current || !controlsRef.current) return;
    camStartPos.current.copy(cameraRef.current.position);
    camEndPos.current.set(...targetPos);
    camStartTarget.current.copy(controlsRef.current.target);
    camEndTarget.current.set(...lookAtPos);
    camAnimProgress.current = 0.0;
    isAnimatingCam.current = true;
  }, []);

  // Focus on active fault component
  const handleFocusActiveFault = useCallback(() => {
    if (activeFaultComponent) {
      animateCameraTo(activeFaultComponent.cameraPos, activeFaultComponent.targetLookAt);
      onSelectComponent(activeFaultComponent);
    } else {
      // Default view
      animateCameraTo([3.4, 2.2, 3.4], [0, 0, 0]);
    }
  }, [activeFaultComponent, animateCameraTo, onSelectComponent]);

  // Reset camera view
  const handleResetCamera = useCallback(() => {
    animateCameraTo([3.8, 2.5, 3.8], [0, 0, 0]);
  }, [animateCameraTo]);

  // Focus predefined angles
  const handleSetCameraAngle = useCallback((angle: 'front' | 'top' | 'right' | 'left' | 'iso') => {
    switch (angle) {
      case 'front':
        animateCameraTo([4.8, 0.4, 0.0], [0.5, 0.0, 0.0]); // Looking at propeller drive
        break;
      case 'top':
        animateCameraTo([0.0, 5.2, 0.0], [0.0, 0.0, 0.0]); // Top view looking at fuel distribution
        break;
      case 'right':
        animateCameraTo([0.0, 1.2, 4.5], [0.0, 0.0, 0.8]); // Cylinders 1 & 3
        break;
      case 'left':
        animateCameraTo([0.0, 1.2, -4.5], [0.0, 0.0, -0.8]); // Cylinders 2 & 4
        break;
      case 'iso':
        animateCameraTo([3.6, 2.2, 3.6], [0, 0, 0]);
        break;
    }
  }, [animateCameraTo]);

  // Build Procedural Lycoming O-320 3D Model
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const heightPx = container.clientHeight || 520;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#060913');

    // Subtle atmospheric fog for engineering depth
    scene.fog = new THREE.FogExp2('#060913', 0.045);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
    camera.position.set(3.8, 2.5, 3.8);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 14;
    controls.minDistance = 1.2;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting: Crisp aerospace studio lighting
    const ambientLight = new THREE.AmbientLight('#26324d', 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 3.0);
    keyLight.position.set(6, 9, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#38bdf8', 1.4);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#93c5fd', 1.6);
    rimLight.position.set(0, -6, 4);
    scene.add(rimLight);

    // Subtle blue bottom floor glow
    const bottomLight = new THREE.PointLight('#0284c7', 1.2, 10);
    bottomLight.position.set(0, -2, 0);
    scene.add(bottomLight);

    // Engineering Calibration Grid & Ground Plane
    const gridHelper = new THREE.GridHelper(10, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    // Assembly Root
    const engineRoot = new THREE.Group();
    engineRootRef.current = engineRoot;
    scene.add(engineRoot);

    meshMapRef.current.clear();
    exteriorMaterialsRef.current = [];
    internalMeshesRef.current = [];

    // Helper to register meshes for raycasting & component lookups
    const registerMesh = (mesh: THREE.Mesh, compId: string, isExteriorCasing = false) => {
      mesh.userData = { componentId: compId };
      const list = meshMapRef.current.get(compId) || [];
      list.push(mesh);
      meshMapRef.current.set(compId, list);

      if (isExteriorCasing) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => exteriorMaterialsRef.current.push(m));
        } else {
          exteriorMaterialsRef.current.push(mesh.material);
        }
      }
    };

    // Shared Materials
    const metalAlloyMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.85,
      roughness: 0.28,
      name: 'metalAlloy'
    });

    const polishedSteelMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.95,
      roughness: 0.15,
      name: 'polishedSteel'
    });

    const bronzeAlloyMat = new THREE.MeshStandardMaterial({
      color: '#d97706',
      metalness: 0.75,
      roughness: 0.35,
      name: 'bronzeAlloy'
    });

    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.9,
      roughness: 0.3,
      name: 'darkTitanium'
    });

    const finPlateMat = new THREE.MeshStandardMaterial({
      color: '#283548',
      metalness: 0.75,
      roughness: 0.4,
      name: 'finPlate'
    });

    // =========================================================================
    // A. CENTRAL CRANKCASE (Split Horizontally, Cast Aluminum Alloy)
    // =========================================================================
    const crankcaseGroup = new THREE.Group();
    crankcaseGroup.name = 'crankcase_assembly';

    // Main central barrel
    const crankcaseGeo = new THREE.BoxGeometry(2.4, 1.1, 1.4);
    const crankcaseCasingMat = new THREE.MeshPhysicalMaterial({
      color: '#2c394d',
      metalness: 0.65,
      roughness: 0.35,
      clearcoat: 0.3,
      transparent: true,
      opacity: 0.95
    });
    const crankcaseMesh = new THREE.Mesh(crankcaseGeo, crankcaseCasingMat);
    crankcaseMesh.castShadow = true;
    crankcaseMesh.receiveShadow = true;
    crankcaseGroup.add(crankcaseMesh);
    registerMesh(crankcaseMesh, 'crankcase', true);

    // Stiffener ribs on crankcase
    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const ribGeo = new THREE.BoxGeometry(0.08, 1.18, 1.48);
      const ribMesh = new THREE.Mesh(ribGeo, metalAlloyMat);
      ribMesh.position.x = i;
      crankcaseGroup.add(ribMesh);
      registerMesh(ribMesh, 'crankcase', true);
    }
    engineRoot.add(crankcaseGroup);

    // =========================================================================
    // B. CRANKSHAFT & CONNECTING RODS & PISTONS (Internal Reciprocating Engine)
    // =========================================================================
    const internalGroup = new THREE.Group();
    internalGroup.name = 'internal_reciprocating_assembly';

    // Longitudinal Crankshaft main shaft
    const shaftGeo = new THREE.CylinderGeometry(0.14, 0.14, 2.7, 24);
    shaftGeo.rotateZ(Math.PI / 2);
    const shaftMesh = new THREE.Mesh(shaftGeo, polishedSteelMat);
    shaftMesh.castShadow = true;
    internalGroup.add(shaftMesh);
    registerMesh(shaftMesh, 'crankshaft');

    // 4 Crankshaft Throws and Counterweights (180° opposed)
    const throwOffsets = [
      { x: 0.75, angle: 0 },
      { x: 0.75, angle: Math.PI },
      { x: -0.75, angle: 0 },
      { x: -0.75, angle: Math.PI }
    ];

    throwOffsets.forEach((t) => {
      const counterweightGeo = new THREE.BoxGeometry(0.12, 0.48, 0.35);
      const counterweightMesh = new THREE.Mesh(counterweightGeo, polishedSteelMat);
      counterweightMesh.position.set(t.x, Math.sin(t.angle) * 0.18, Math.cos(t.angle) * 0.18);
      internalGroup.add(counterweightMesh);
      registerMesh(counterweightMesh, 'crankshaft');
    });

    // Connecting Rods & Pistons for Cylinders 1, 2, 3, 4
    const cylPositions = [
      { id: 'cylinder_1', x: 0.75, z: 1.35, dir: 1 },   // Starboard Fwd
      { id: 'cylinder_2', x: 0.75, z: -1.35, dir: -1 }, // Port Fwd
      { id: 'cylinder_3', x: -0.75, z: 1.35, dir: 1 },  // Starboard Aft
      { id: 'cylinder_4', x: -0.75, z: -1.35, dir: -1 }  // Port Aft
    ];

    cylPositions.forEach((cyl) => {
      // 1. Forged Connecting Rod
      const rodLength = 0.85;
      const rodGeo = new THREE.BoxGeometry(0.1, 0.08, rodLength);
      const rodMesh = new THREE.Mesh(rodGeo, bronzeAlloyMat);
      rodMesh.position.set(cyl.x, 0.15, (cyl.z * 0.45));
      internalGroup.add(rodMesh);
      registerMesh(rodMesh, 'connecting_rods');

      // 2. Piston Body
      const pistonGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.48, 24);
      pistonGeo.rotateX(Math.PI / 2);
      const pistonMesh = new THREE.Mesh(pistonGeo, polishedSteelMat);
      pistonMesh.position.set(cyl.x, 0.15, (cyl.z * 0.8));
      internalGroup.add(pistonMesh);
      registerMesh(pistonMesh, cyl.id);
      registerMesh(pistonMesh, 'piston_assembly');

      // Compression rings grooves
      const ringGeo = new THREE.TorusGeometry(0.43, 0.015, 8, 24);
      ringGeo.rotateY(Math.PI / 2);
      const ringMesh1 = new THREE.Mesh(ringGeo, darkTitaniumMat);
      ringMesh1.position.set(cyl.x, 0.15, (cyl.z * 0.8) + (cyl.dir * 0.1));
      internalGroup.add(ringMesh1);

      // 3. Poppet Valves (Intake & Exhaust)
      for (let v = -0.15; v <= 0.15; v += 0.3) {
        const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12);
        stemGeo.rotateX(Math.PI / 2);
        const valveStem = new THREE.Mesh(stemGeo, polishedSteelMat);
        valveStem.position.set(cyl.x + v, 0.35, cyl.z);
        internalGroup.add(valveStem);
        registerMesh(valveStem, 'valves_assembly');

        // Valve spring
        const springGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.28, 12, 1, true);
        springGeo.rotateX(Math.PI / 2);
        const springMesh = new THREE.Mesh(springGeo, darkTitaniumMat);
        springMesh.position.set(cyl.x + v, 0.35, cyl.z - (cyl.dir * 0.15));
        internalGroup.add(springMesh);
        registerMesh(springMesh, 'valves_assembly');
      }
    });

    internalMeshesRef.current.push(internalGroup);
    engineRoot.add(internalGroup);

    // =========================================================================
    // C. 4 HORIZONTALLY OPPOSED CYLINDER BARRELS & COOLING FIN STACKS
    // =========================================================================
    const cylindersGroup = new THREE.Group();
    cylindersGroup.name = 'cylinders_group';

    cylPositions.forEach((cyl) => {
      const cylSubGroup = new THREE.Group();
      cylSubGroup.position.set(cyl.x, 0.2, 0);

      // Outer Cylinder Barrel
      const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.1, 24);
      barrelGeo.rotateX(Math.PI / 2);

      const barrelMat = new THREE.MeshPhysicalMaterial({
        color: '#283548',
        metalness: 0.8,
        roughness: 0.3,
        transparent: true,
        opacity: 0.95
      });

      const barrelMesh = new THREE.Mesh(barrelGeo, barrelMat);
      barrelMesh.position.z = cyl.z * 0.65;
      barrelMesh.castShadow = true;
      barrelMesh.receiveShadow = true;
      cylSubGroup.add(barrelMesh);
      registerMesh(barrelMesh, cyl.id, true);

      // Cooling Fins (Series of concentric discs along cylinder barrel)
      for (let finZ = 0.3; finZ <= 1.0; finZ += 0.09) {
        const finGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.02, 24);
        finGeo.rotateX(Math.PI / 2);
        const finMesh = new THREE.Mesh(finGeo, finPlateMat);
        finMesh.position.z = cyl.dir * finZ;
        cylSubGroup.add(finMesh);
        registerMesh(finMesh, cyl.id, true);
      }

      // Cylinder Head with Rocker Box Cover
      const headGeo = new THREE.BoxGeometry(0.85, 0.72, 0.45);
      const headMat = new THREE.MeshStandardMaterial({
        color: '#384860',
        metalness: 0.85,
        roughness: 0.25
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 0.05, cyl.z * 1.15);
      headMesh.castShadow = true;
      cylSubGroup.add(headMesh);
      registerMesh(headMesh, cyl.id, true);

      if (cyl.id === 'cylinder_3') {
        registerMesh(headMesh, 'cylinder_head_3', true);
      }

      // Spark Plugs (Top & Bottom on each cylinder head)
      [0.28, -0.28].forEach((plugY, pIdx) => {
        const plugHexGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 6);
        const plugMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.9, roughness: 0.1 });
        const plugMesh = new THREE.Mesh(plugHexGeo, plugMat);
        plugMesh.position.set(0, plugY, cyl.z * 1.15);
        plugMesh.rotation.z = pIdx === 0 ? 0.3 : -0.3;
        cylSubGroup.add(plugMesh);
        registerMesh(plugMesh, 'spark_ignition');
        registerMesh(plugMesh, cyl.id);
      });

      // Thermocouple CHT probe on Cylinder #3
      if (cyl.id === 'cylinder_3') {
        const chtProbeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12);
        const chtMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9, roughness: 0.2 });
        const chtProbe = new THREE.Mesh(chtProbeGeo, chtMat);
        chtProbe.position.set(0.12, 0.35, cyl.z * 1.1);
        chtProbe.rotation.z = 0.4;
        cylSubGroup.add(chtProbe);
        registerMesh(chtProbe, 'sensor_cht_3');
      }

      cylindersGroup.add(cylSubGroup);
    });
    engineRoot.add(cylindersGroup);

    // =========================================================================
    // D. FUEL INJECTION SPIDER & INDIVIDUAL INJECTORS
    // =========================================================================
    const fuelGroup = new THREE.Group();
    fuelGroup.name = 'fuel_system_group';

    // Central fuel distributor spider on top of crankcase
    const spiderGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.2, 16);
    const spiderMesh = new THREE.Mesh(spiderGeo, bronzeAlloyMat);
    spiderMesh.position.set(0.0, 0.72, 0.0);
    fuelGroup.add(spiderMesh);
    registerMesh(spiderMesh, 'fuel_system');

    // Fuel Lines & Injectors feeding cylinders 1, 2, 3, 4
    cylPositions.forEach((cyl) => {
      // Injector body at intake port
      const injectorGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.28, 12);
      injectorGeo.rotateX(Math.PI / 4);
      const injMat = new THREE.MeshStandardMaterial({
        color: cyl.id === 'cylinder_2' ? '#f59e0b' : '#94a3b8',
        metalness: 0.9,
        roughness: 0.2
      });
      const injectorMesh = new THREE.Mesh(injectorGeo, injMat);
      injectorMesh.position.set(cyl.x, 0.42, cyl.z * 0.78);
      fuelGroup.add(injectorMesh);

      if (cyl.id === 'cylinder_2') {
        registerMesh(injectorMesh, 'fuel_injector_2');
      }
      registerMesh(injectorMesh, 'fuel_system');

      // Stainless steel fuel line from spider to injector
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0.0, 0.75, 0.0),
        new THREE.Vector3(cyl.x * 0.5, 0.85, cyl.z * 0.4),
        new THREE.Vector3(cyl.x, 0.45, cyl.z * 0.78)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.015, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, polishedSteelMat);
      fuelGroup.add(tubeMesh);
      registerMesh(tubeMesh, 'fuel_system');
    });
    engineRoot.add(fuelGroup);

    // =========================================================================
    // E. EXHAUST SYSTEM (Tuned Equal-Length Runners & Collector)
    // =========================================================================
    const exhaustGroup = new THREE.Group();
    exhaustGroup.name = 'exhaust_group';

    const exhaustMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      metalness: 0.9,
      roughness: 0.45
    });

    cylPositions.forEach((cyl) => {
      const exCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(cyl.x, -0.15, cyl.z * 0.95),
        new THREE.Vector3(cyl.x * 0.8, -0.65, cyl.z * 0.6),
        new THREE.Vector3(cyl.x * 0.5, -0.85, cyl.dir * 0.45)
      );
      const exTubeGeo = new THREE.TubeGeometry(exCurve, 16, 0.08, 12, false);
      const exTubeMesh = new THREE.Mesh(exTubeGeo, exhaustMat);
      exhaustGroup.add(exTubeMesh);
      registerMesh(exTubeMesh, 'exhaust_system');
    });

    // Dual collector manifolds along bottom
    [-0.45, 0.45].forEach((zPos) => {
      const collectorGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 16);
      collectorGeo.rotateZ(Math.PI / 2);
      const collectorMesh = new THREE.Mesh(collectorGeo, exhaustMat);
      collectorMesh.position.set(-0.2, -0.92, zPos);
      exhaustGroup.add(collectorMesh);
      registerMesh(collectorMesh, 'exhaust_system');
    });
    engineRoot.add(exhaustGroup);

    // =========================================================================
    // F. OIL SUMP, OIL PUMP & LUBRICATION CIRCUIT
    // =========================================================================
    const lubeGroup = new THREE.Group();
    lubeGroup.name = 'lubrication_group';

    // Bottom wet sump oil pan
    const sumpGeo = new THREE.BoxGeometry(2.1, 0.45, 1.1);
    const sumpMesh = new THREE.Mesh(sumpGeo, metalAlloyMat);
    sumpMesh.position.set(-0.1, -0.75, 0.0);
    lubeGroup.add(sumpMesh);
    registerMesh(sumpMesh, 'oil_sump');

    // Oil pump housing on rear lower accessory case
    const pumpGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.4, 16);
    pumpGeo.rotateZ(Math.PI / 2);
    const pumpMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.85, roughness: 0.3 });
    const pumpMesh = new THREE.Mesh(pumpGeo, pumpMat);
    pumpMesh.position.set(-1.3, -0.6, 0.0);
    lubeGroup.add(pumpMesh);
    registerMesh(pumpMesh, 'oil_pump');

    // Spin-on oil filter canister
    const filterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.52, 20);
    filterGeo.rotateX(Math.PI / 4);
    const filterMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.6, roughness: 0.2 });
    const filterMesh = new THREE.Mesh(filterGeo, filterMat);
    filterMesh.position.set(-1.35, -0.3, 0.45);
    lubeGroup.add(filterMesh);
    registerMesh(filterMesh, 'oil_sump');
    registerMesh(filterMesh, 'oil_pump');

    // Oil pressure transducer
    const pressTransGeo = new THREE.BoxGeometry(0.1, 0.1, 0.22);
    const pressTransMat = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.8, roughness: 0.2 });
    const pressTransMesh = new THREE.Mesh(pressTransGeo, pressTransMat);
    pressTransMesh.position.set(-1.25, -0.2, 0.48);
    lubeGroup.add(pressTransMesh);
    registerMesh(pressTransMesh, 'sensor_oil_press_temp');
    engineRoot.add(lubeGroup);

    // =========================================================================
    // G. REAR ACCESSORY CASE: DUAL MAGNETOS & 28V ALTERNATOR
    // =========================================================================
    const accessoryGroup = new THREE.Group();
    accessoryGroup.name = 'accessory_group';

    // Dual Magnetos (Bendix/Slick)
    [-0.32, 0.32].forEach((zOff) => {
      const magGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.45, 16);
      magGeo.rotateZ(Math.PI / 2);
      const magMesh = new THREE.Mesh(magGeo, darkTitaniumMat);
      magMesh.position.set(-1.45, 0.35, zOff);
      accessoryGroup.add(magMesh);
      registerMesh(magMesh, 'spark_ignition');
    });

    // 28V 70A Alternator
    const altGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.55, 24);
    altGeo.rotateZ(Math.PI / 2);
    const altMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.9, roughness: 0.25 });
    const altMesh = new THREE.Mesh(altGeo, altMat);
    altMesh.position.set(-1.15, 0.35, -0.85);
    accessoryGroup.add(altMesh);
    registerMesh(altMesh, 'alternator');

    // Alternator pulley and drive belt
    const pulleyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 20);
    pulleyGeo.rotateZ(Math.PI / 2);
    const pulleyMesh = new THREE.Mesh(pulleyGeo, bronzeAlloyMat);
    pulleyMesh.position.set(-0.85, 0.35, -0.85);
    accessoryGroup.add(pulleyMesh);
    registerMesh(pulleyMesh, 'alternator');
    engineRoot.add(accessoryGroup);

    // =========================================================================
    // H. PROPELLER DRIVE SHAFT & FLANGE (Front Propulsion Interface)
    // =========================================================================
    const propGroup = new THREE.Group();
    propGroup.name = 'propeller_interface_group';

    // Drive nose cone housing
    const noseGeo = new THREE.ConeGeometry(0.38, 0.6, 24);
    noseGeo.rotateZ(-Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, metalAlloyMat);
    noseMesh.position.set(1.4, 0.0, 0.0);
    propGroup.add(noseMesh);
    registerMesh(noseMesh, 'crankshaft');
    registerMesh(noseMesh, 'crankshaft_prop_interface');

    // Propeller Flange Disc (SAE No. 2 Standard 6-bolt)
    const flangeGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.09, 32);
    flangeGeo.rotateZ(Math.PI / 2);
    const flangeMesh = new THREE.Mesh(flangeGeo, polishedSteelMat);
    flangeMesh.position.set(1.7, 0.0, 0.0);
    propGroup.add(flangeMesh);
    registerMesh(flangeMesh, 'crankshaft');
    registerMesh(flangeMesh, 'crankshaft_prop_interface');

    // 6 Drive Studs around flange perimeter
    for (let b = 0; b < 6; b++) {
      const bAngle = (b * Math.PI) / 3;
      const boltGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 10);
      boltGeo.rotateZ(Math.PI / 2);
      const boltMesh = new THREE.Mesh(boltGeo, bronzeAlloyMat);
      boltMesh.position.set(1.76, Math.sin(bAngle) * 0.34, Math.cos(bAngle) * 0.34);
      propGroup.add(boltMesh);
      registerMesh(boltMesh, 'crankshaft_prop_interface');
    }

    // Vibration Sensor on top crankcase nose spine
    const vibSensorGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const vibSensorMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.9, roughness: 0.2 });
    const vibSensorMesh = new THREE.Mesh(vibSensorGeo, vibSensorMat);
    vibSensorMesh.position.set(0.65, 0.62, 0.0);
    propGroup.add(vibSensorMesh);
    registerMesh(vibSensorMesh, 'sensor_vibration');
    engineRoot.add(propGroup);

    // =========================================================================
    // I. Raycasting Event Handlers
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(engineRoot.children, true);

      if (intersects.length > 0) {
        let foundId: string | null = null;
        for (const hit of intersects) {
          if (hit.object.userData?.componentId) {
            foundId = hit.object.userData.componentId;
            break;
          }
        }
        if (foundId && ENGINE_COMPONENT_CATALOG[foundId]) {
          setHoveredComp(ENGINE_COMPONENT_CATALOG[foundId]);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredComp(null);
      renderer.domElement.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(engineRoot.children, true);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          const compId = hit.object.userData?.componentId;
          if (compId && ENGINE_COMPONENT_CATALOG[compId]) {
            onSelectComponent(ENGINE_COMPONENT_CATALOG[compId]);
            break;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 6. Animation Loop
    let animId = 0;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Camera Animation tweening
      if (isAnimatingCam.current && cameraRef.current && controlsRef.current) {
        camAnimProgress.current += delta * 2.2; // 0.45s smooth transition
        const t = Math.min(1.0, camAnimProgress.current);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

        cameraRef.current.position.lerpVectors(camStartPos.current, camEndPos.current, ease);
        controlsRef.current.target.lerpVectors(camStartTarget.current, camEndTarget.current, ease);
        controlsRef.current.update();

        if (t >= 1.0) {
          isAnimatingCam.current = false;
        }
      } else {
        controls.update();
      }

      // Subtle pulse on active fault component
      if (activeFaultComponent && meshMapRef.current) {
        const meshes = meshMapRef.current.get(activeFaultComponent.meshAnchor) || [];
        const pulse = Math.sin(elapsed * 4.5) * 0.35 + 0.65; // gentle 0.3 - 1.0 pulse

        meshes.forEach((mesh) => {
          if (mesh.material && 'emissive' in mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissive.set(
              activeFaultMapping?.severityLevel === 'critical' ? '#dc2626' : '#d97706'
            );
            mat.emissiveIntensity = pulse * 0.8;
          }
        });
      }

      // Project 3D callout anchor to 2D screen coordinates
      if (activeFaultComponent && cameraRef.current && mountRef.current) {
        const anchorVec = new THREE.Vector3(...activeFaultComponent.anchorPos);
        anchorVec.project(cameraRef.current);

        const rect = mountRef.current.getBoundingClientRect();
        const screenX = ((anchorVec.x + 1) / 2) * rect.width;
        const screenY = ((-anchorVec.y + 1) / 2) * rect.height;

        // In front of camera check
        const isBehind = anchorVec.z > 1.0;
        setCalloutScreenPos({
          x: Math.round(screenX),
          y: Math.round(screenY),
          visible: !isBehind
        });
      } else {
        setCalloutScreenPos(null);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []); // Mount once

  // Update Cutaway Mode & Opacity
  useEffect(() => {
    exteriorMaterialsRef.current.forEach((mat) => {
      if ('opacity' in mat && 'transparent' in mat) {
        const pMat = mat as THREE.MeshPhysicalMaterial;
        if (viewMode === 'cutaway') {
          pMat.transparent = true;
          pMat.opacity = 0.22;
          pMat.roughness = 0.15;
          if ('transmission' in pMat) pMat.transmission = 0.8;
          pMat.wireframe = wireframeMode;
        } else {
          pMat.transparent = false;
          pMat.opacity = 1.0;
          pMat.roughness = 0.35;
          if ('transmission' in pMat) pMat.transmission = 0.0;
          pMat.wireframe = wireframeMode;
        }
        pMat.needsUpdate = true;
      }
    });

    // Toggle visibility of internal components if in exterior mode
    internalMeshesRef.current.forEach((group) => {
      group.visible = true; // Kept visible so through transparent casing they are seen
    });
  }, [viewMode, wireframeMode]);

  // Update Selected Component Visual Highlight
  useEffect(() => {
    if (!meshMapRef.current) return;

    meshMapRef.current.forEach((meshes, compId) => {
      const isSelected = compId === selectedComponentId;
      const isHovered = compId === hoveredComp?.id;
      const isFault = compId === activeFaultComponent?.meshAnchor;

      meshes.forEach((mesh) => {
        if (mesh.material && 'emissive' in mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isSelected) {
            mat.emissive.set('#0284c7');
            mat.emissiveIntensity = 0.6;
          } else if (isHovered && !isFault) {
            mat.emissive.set('#38bdf8');
            mat.emissiveIntensity = 0.35;
          } else if (!isFault) {
            mat.emissive.set('#000000');
            mat.emissiveIntensity = 0.0;
          }
        }
      });
    });
  }, [selectedComponentId, hoveredComp, activeFaultComponent]);

  return (
    <div className={`relative w-full ${height} rounded-xl border border-[#162035] bg-[#060913] overflow-hidden select-none`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Left View Controls (Exterior / Cutaway / Wireframe) */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-[#0b1222]/90 border border-[#1e293b] p-0.5 backdrop-blur-md">
          <button
            onClick={() => setViewMode('exterior')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition ${
              viewMode === 'exterior'
                ? 'bg-[#0284c7] text-white shadow-lg shadow-sky-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Show solid outer engine casing and fin barrels"
          >
            <Eye size={13} />
            <span>EXTERIOR</span>
          </button>
          <button
            onClick={() => setViewMode('cutaway')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition ${
              viewMode === 'cutaway'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Expose internal reciprocating pistons, rods, crankshaft, valves & spark plugs"
          >
            <Layers size={13} />
            <span>CUTAWAY / INTERNAL</span>
          </button>
        </div>

        {/* Wireframe toggle */}
        <button
          onClick={() => setWireframeMode(!wireframeMode)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium backdrop-blur-md transition ${
            wireframeMode
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-[#0b1222]/80 border-[#1e293b] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle wireframe topology view"
        >
          WIREFRAME
        </button>

        {/* Focus Active Fault Button */}
        {activeFaultComponent && (
          <button
            onClick={handleFocusActiveFault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-lg shadow-rose-950 animate-pulse transition"
            title="Center and zoom camera onto the active fault component"
          >
            <Crosshair size={14} />
            <span>FOCUS ACTIVE FAULT</span>
          </button>
        )}
      </div>

      {/* Top Right Quick Camera Angles */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#0b1222]/90 border border-[#1e293b] p-1 rounded-lg backdrop-blur-md text-[11px] font-mono">
        <button
          onClick={() => handleSetCameraAngle('front')}
          className="px-2 py-1 text-slate-400 hover:text-sky-300 hover:bg-[#162035] rounded"
          title="Propeller Front View"
        >
          FRONT
        </button>
        <button
          onClick={() => handleSetCameraAngle('top')}
          className="px-2 py-1 text-slate-400 hover:text-sky-300 hover:bg-[#162035] rounded"
          title="Top Fuel Injection View"
        >
          TOP
        </button>
        <button
          onClick={() => handleSetCameraAngle('right')}
          className="px-2 py-1 text-slate-400 hover:text-sky-300 hover:bg-[#162035] rounded"
          title="Starboard Bank (Cyl 1 & 3)"
        >
          RIGHT (1&3)
        </button>
        <button
          onClick={() => handleSetCameraAngle('left')}
          className="px-2 py-1 text-slate-400 hover:text-sky-300 hover:bg-[#162035] rounded"
          title="Port Bank (Cyl 2 & 4)"
        >
          LEFT (2&4)
        </button>
        <button
          onClick={() => handleSetCameraAngle('iso')}
          className="px-2 py-1 text-slate-400 hover:text-sky-300 hover:bg-[#162035] rounded"
          title="Isometric View"
        >
          ISO
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          onClick={handleResetCamera}
          className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#162035] rounded"
          title="Reset Camera View"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Floating 3D-to-2D Projected Fault Callout HUD */}
      {calloutScreenPos && calloutScreenPos.visible && activeFaultComponent && activeFaultMapping && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${calloutScreenPos.x}px`,
            top: `${Math.max(80, calloutScreenPos.y - 20)}px`
          }}
        >
          {/* Callout Card */}
          <div className="w-72 p-3 rounded-lg bg-[#070b16]/95 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/70 text-slate-200 font-sans backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-rose-900/60 pb-1.5">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[11px] font-bold tracking-wider uppercase">
                <AlertTriangle size={14} className="text-rose-500 animate-pulse" />
                <span>{activeFaultMapping.title}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800">
                {activeFaultMapping.severityLevel}
              </span>
            </div>

            {/* Component & Location */}
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Component:</span>
                <span className="font-semibold text-slate-100">{activeFaultComponent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Location:</span>
                <span className="text-sky-300 font-mono text-[10px] truncate max-w-[150px]">{activeFaultComponent.physicalLocation}</span>
              </div>
              {state?.fault_severity && (
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono text-[11px]">Severity:</span>
                  <span className="font-mono font-bold text-rose-400">{Math.round(state.fault_severity * 100)}%</span>
                </div>
              )}
            </div>

            {/* Correlated Diagnostic Deltas */}
            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-0.5">
              {state?.active_fault === 'misfire' && (
                <>
                  <div className="text-amber-400">Vibration: +1.85 g RMS harmonic</div>
                  <div className="text-sky-400">RPM Delta: -320 RPM torque loss</div>
                </>
              )}
              {state?.active_fault === 'injector_abnormality' && (
                <>
                  <div className="text-rose-400">EGT Runner #2: +145°C lean-burn</div>
                  <div className="text-amber-400">Fuel Flow: -4.5 L/h restriction</div>
                </>
              )}
              {state?.active_fault === 'oil_pressure_loss' && (
                <>
                  <div className="text-rose-400">Oil Gallery: {state.observed.oil_pressure_psi.toFixed(1)} PSI (-38 PSI)</div>
                  <div className="text-amber-400">Oil Temp: +42°C friction heat</div>
                </>
              )}
              {state?.active_fault === 'overheating' && (
                <>
                  <div className="text-rose-400">Cylinder #3 Head: {state.observed.cht_c.toFixed(1)}°C (&gt;230°C)</div>
                  <div className="text-amber-400">Baffle airflow starved</div>
                </>
              )}
              {state?.active_fault === 'vibration_spike' && (
                <>
                  <div className="text-rose-400">Vibration: {state.observed.vibration_g.toFixed(2)} g RMS</div>
                  <div className="text-amber-400">Imbalance at prop flange</div>
                </>
              )}
              {state?.active_fault === 'sensor_drift' && (
                <>
                  <div className="text-amber-400">Thermocouple #3: +45°C drift</div>
                  <div className="text-emerald-400">Physical engine: nominal</div>
                </>
              )}
            </div>
          </div>

          {/* Pointer Leader Stem */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gradient-to-b from-rose-500 to-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/30 animate-ping" />
          </div>
        </div>
      )}

      {/* Bottom Bar: Engine Architecture & Interactive Hint */}
      <div className="absolute bottom-2 left-3 right-3 z-20 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#080d1a]/85 border border-[#1a2438] px-3 py-1.5 rounded-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold">LYCOMING O-320 AERO-PISTON TWIN</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">4-Cyl Horizontally Opposed | Direct Dual-Drive</span>
        </div>

        <div className="flex items-center gap-3">
          {hoveredComp ? (
            <span className="text-sky-300 font-semibold flex items-center gap-1">
              <Crosshair size={12} /> {hoveredComp.name} ({hoveredComp.physicalLocation})
            </span>
          ) : (
            <span className="text-slate-500 italic hidden md:inline">
              Click any component to inspect physical telemetry | Drag to orbit
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
