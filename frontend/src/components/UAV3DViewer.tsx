import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { UAV3DState } from '../types/telemetry';
import { UAV_COMPONENT_CATALOG, UAVComponentInfo } from '../utils/uavComponentCatalog';
import {
  Focus,
  Maximize2,
  Minimize2,
  Info,
  Box,
  RotateCcw,
  List,
  X,
  ChevronRight
} from 'lucide-react';

interface UAV3DViewerProps {
  state: UAV3DState | null;
  height?: string;
  showOverlay?: boolean;
}

export type ViewMode = 'exterior' | 'interior' | 'cutaway';

export const UAV3DViewer: React.FC<UAV3DViewerProps> = ({
  state,
  height = 'h-full',
  showOverlay = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Three.js Core References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Mesh & Group References
  const uavRootRef = useRef<THREE.Group | null>(null);
  const exteriorShellRef = useRef<THREE.Group | null>(null);
  const customModelSceneRef = useRef<THREE.Group | null>(null);

  // Interaction State
  const [viewMode, setViewMode] = useState<ViewMode>('exterior');
  const [cutawayOpacity, setCutawayOpacity] = useState<number>(0.25);
  const [selectedComponent, setSelectedComponent] = useState<UAVComponentInfo | null>(null);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [calloutScreenPos, setCalloutScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [showPartsList, setShowPartsList] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCustomModelLoaded, setIsCustomModelLoaded] = useState(false);

  // Dragging Flag (prevents camera snapping while user orbits/pans)
  const isUserInteracting = useRef<boolean>(false);

  // Target Camera Interpolation Vectors
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(12, 8, 16));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Raycasting & Material Hover Cache
  const hoveredMaterialCache = useRef<{ mesh: THREE.Mesh; origEmissive: THREE.Color } | null>(null);
  const selectedMaterialCache = useRef<{ mesh: THREE.Mesh; origEmissive: THREE.Color } | null>(null);

  // Map Mesh/Node Name or Object Position to Catalog Component
  const mapMeshToComponent = (object: THREE.Object3D): UAVComponentInfo | null => {
    let curr: THREE.Object3D | null = object;
    
    // Search up parent chain for named node match
    while (curr && curr !== uavRootRef.current) {
      const name = curr.name.toLowerCase();
      if (name.includes('aileron') && name.includes('right')) return UAV_COMPONENT_CATALOG.aileronRight;
      if (name.includes('aileron') && name.includes('left')) return UAV_COMPONENT_CATALOG.aileronLeft;
      if (name.includes('rudder')) return UAV_COMPONENT_CATALOG.rudder;
      if (name.includes('elevator')) return UAV_COMPONENT_CATALOG.elevator;
      if (name.includes('hub')) return UAV_COMPONENT_CATALOG.propellerHub;
      if (name.includes('cowling') || name.includes('nacelle')) return UAV_COMPONENT_CATALOG.engineCowling;
      if (name.includes('propeller') || name.includes('blade') || name.includes('prop')) return UAV_COMPONENT_CATALOG.propeller;
      if (name.includes('engine') || name.includes('lycoming') || name.includes('rotax')) return UAV_COMPONENT_CATALOG.engine;
      if (name.includes('wing') && name.includes('root')) return UAV_COMPONENT_CATALOG.wingRoot;
      if (name.includes('wing') && name.includes('right')) return UAV_COMPONENT_CATALOG.wingRight;
      if (name.includes('wing') && name.includes('left')) return UAV_COMPONENT_CATALOG.wingLeft;
      if (name.includes('wing')) return UAV_COMPONENT_CATALOG.wingRight;
      if (name.includes('nose') || name.includes('radome') || name.includes('satcom')) return UAV_COMPONENT_CATALOG.nose;
      if (name.includes('vertical_tail') || name.includes('fin')) return UAV_COMPONENT_CATALOG.verticalStabilizer;
      if (name.includes('horizontal_tail') || name.includes('stabilizer')) return UAV_COMPONENT_CATALOG.horizontalStabilizer;
      if (name.includes('tail')) return UAV_COMPONENT_CATALOG.verticalStabilizer;
      if (name.includes('wheel')) return UAV_COMPONENT_CATALOG.wheels;
      if (name.includes('gear')) return UAV_COMPONENT_CATALOG.landingGear;
      if (name.includes('antenna')) return UAV_COMPONENT_CATALOG.antennas;
      if (name.includes('sensor')) return UAV_COMPONENT_CATALOG.sensors;
      if (name.includes('fuselage') || name.includes('body')) return UAV_COMPONENT_CATALOG.fuselage;

      // Internal component names
      if (name.includes('comp_engineblock') || name.includes('crankcase')) return UAV_COMPONENT_CATALOG.engineBlock;
      if (name.includes('comp_fuelsystem') || name.includes('injector')) return UAV_COMPONENT_CATALOG.fuelSystem;
      if (name.includes('comp_oilsystem') || name.includes('lubrication')) return UAV_COMPONENT_CATALOG.oilSystem;
      if (name.includes('comp_ecusystem') || name.includes('fadec')) return UAV_COMPONENT_CATALOG.ecuSystem;

      curr = curr.parent;
    }

    // Position-based fallback mapping
    const worldPos = new THREE.Vector3();
    object.getWorldPosition(worldPos);

    if (worldPos.x > 2.0) return UAV_COMPONENT_CATALOG.nose;
    if (worldPos.x < -2.2 && worldPos.y > 1.4) return UAV_COMPONENT_CATALOG.horizontalStabilizer;
    if (worldPos.x < -2.2 && worldPos.y > 0.8) return UAV_COMPONENT_CATALOG.verticalStabilizer;
    if (Math.abs(worldPos.z) > 2.2) return worldPos.z > 0 ? UAV_COMPONENT_CATALOG.wingRight : UAV_COMPONENT_CATALOG.wingLeft;
    if (worldPos.x < -0.2 && Math.abs(worldPos.z) < 1.0) return UAV_COMPONENT_CATALOG.engine;
    if (worldPos.y < -0.4) return UAV_COMPONENT_CATALOG.landingGear;

    return UAV_COMPONENT_CATALOG.fuselage;
  };

  // Initialize Three.js Viewport
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const heightPx = container.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#060810');
    scene.fog = new THREE.FogExp2('#060810', 0.012);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 1000);
    camera.position.set(12, 8, 16);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Orbit Controls (Unconstrained 360° Rotation + Touch Support)
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

    controls.addEventListener('start', () => {
      isUserInteracting.current = true;
    });

    controls.addEventListener('end', () => {
      isUserInteracting.current = false;
      targetCamPos.current.copy(camera.position);
      targetLookAt.current.copy(controls.target);
    });

    controlsRef.current = controls;

    // Aerospace Lighting Setup
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.95);
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

    // Grid Floor
    const grid = new THREE.GridHelper(60, 40, '#0284c7', '#1a2438');
    grid.position.y = -3.5;
    scene.add(grid);

    // Root Group for DRDO RUSTOM
    const uavRootGroup = new THREE.Group();
    uavRootGroup.name = "DRDO_RUSTOM";
    uavRootRef.current = uavRootGroup;
    scene.add(uavRootGroup);

    // Procedural Fallback Shell Group (Hidden when custom GLTF asset loads)
    const exteriorShellGroup = new THREE.Group();
    exteriorShellGroup.name = "exteriorShell";
    exteriorShellRef.current = exteriorShellGroup;
    uavRootGroup.add(exteriorShellGroup);

    // Setup GLTFLoader + DRACOLoader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    // Load actual Sketchfab Rustom model asset
    gltfLoader.load(
      '/models/drdo_rustom_2_uav.glb',
      (gltf) => {
        if (gltf && gltf.scene) {
          customModelSceneRef.current = gltf.scene;

          // Hide procedural fallback elements and add loaded GLTF asset
          exteriorShellGroup.visible = false;
          uavRootGroup.add(gltf.scene);
          setIsCustomModelLoaded(true);

          // Calculate bounding box and set camera bounds
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const sphere = box.getBoundingSphere(new THREE.Sphere());
          if (controlsRef.current && sphere.radius > 0) {
            controlsRef.current.minDistance = Math.max(0.5, sphere.radius * 0.2);
            controlsRef.current.maxDistance = Math.max(50.0, sphere.radius * 6.0);
          }
        }
      },
      undefined,
      (err) => {
        console.warn('Custom GLTF asset load fallback:', err);
      }
    );

    // Three.js Raycaster for Clickable UAV Components
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(uavRootGroup.children, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        renderer.domElement.style.cursor = 'pointer';

        const matchedComp = mapMeshToComponent(hitMesh);
        if (matchedComp) {
          setHoveredNodeName(matchedComp.name);
          setMouseScreenPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        }

        // Apply subtle hover highlight
        if (hitMesh instanceof THREE.Mesh && hitMesh.material) {
          if (hoveredMaterialCache.current && hoveredMaterialCache.current.mesh !== hitMesh) {
            if ('emissive' in hoveredMaterialCache.current.mesh.material) {
              (hoveredMaterialCache.current.mesh.material as any).emissive.copy(hoveredMaterialCache.current.origEmissive);
            }
          }
          if ('emissive' in hitMesh.material) {
            if (!hoveredMaterialCache.current || hoveredMaterialCache.current.mesh !== hitMesh) {
              hoveredMaterialCache.current = {
                mesh: hitMesh,
                origEmissive: (hitMesh.material as THREE.MeshStandardMaterial).emissive.clone()
              };
            }
            (hitMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
          }
        }
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredNodeName(null);
        setMouseScreenPos(null);
        if (hoveredMaterialCache.current) {
          if ('emissive' in hoveredMaterialCache.current.mesh.material) {
            (hoveredMaterialCache.current.mesh.material as any).emissive.copy(hoveredMaterialCache.current.origEmissive);
          }
          hoveredMaterialCache.current = null;
        }
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      pointerDownPos = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = (event: MouseEvent) => {
      if (event.button !== 0) return;

      // Calculate pixel distance moved during pointer hold
      const dx = event.clientX - pointerDownPos.x;
      const dy = event.clientY - pointerDownPos.y;
      // Ignore if user dragged to rotate/pan (drag threshold > 5px)
      if (Math.hypot(dx, dy) > 5) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(uavRootGroup.children, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const comp = mapMeshToComponent(hitMesh);
        if (comp) {
          setSelectedComponent(comp);

          // Apply selected mesh highlight
          if (hitMesh instanceof THREE.Mesh && hitMesh.material && 'emissive' in hitMesh.material) {
            if (selectedMaterialCache.current && selectedMaterialCache.current.mesh !== hitMesh) {
              if ('emissive' in selectedMaterialCache.current.mesh.material) {
                (selectedMaterialCache.current.mesh.material as any).emissive.copy(selectedMaterialCache.current.origEmissive);
              }
            }
            selectedMaterialCache.current = {
              mesh: hitMesh,
              origEmissive: (hitMesh.material as THREE.MeshStandardMaterial).emissive.clone()
            };
            (hitMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
          }
        }
      } else {
        // Clicked empty space -> deselect current component
        setSelectedComponent(null);
        if (selectedMaterialCache.current) {
          if ('emissive' in selectedMaterialCache.current.mesh.material) {
            (selectedMaterialCache.current.mesh.material as any).emissive.copy(selectedMaterialCache.current.origEmissive);
          }
          selectedMaterialCache.current = null;
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Gentle continuous floating motion
      uavRootGroup.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.1;
      uavRootGroup.rotation.z = Math.sin(clock.getElapsedTime() * 0.3) * 0.01;

      // Camera Position Lerp (disabled while user actively drags mouse)
      if (!isUserInteracting.current && cameraRef.current && controlsRef.current) {
        camera.position.lerp(targetCamPos.current, 0.06);
        controls.target.lerp(targetLookAt.current, 0.06);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Event Handler
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
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D-Anchored Callout Pointer Screen Coordinates
  useEffect(() => {
    if (!selectedComponent || !cameraRef.current || !rendererRef.current) {
      setCalloutScreenPos(null);
      return;
    }

    const updateCalloutPos = () => {
      if (!selectedComponent || !cameraRef.current || !rendererRef.current) return;

      const worldPos = new THREE.Vector3(...selectedComponent.position);
      const tempVector = worldPos.clone().project(cameraRef.current);

      const width = rendererRef.current.domElement.clientWidth;
      const height = rendererRef.current.domElement.clientHeight;

      const x = (tempVector.x * 0.5 + 0.5) * width;
      const y = (-tempVector.y * 0.5 + 0.5) * height;

      setCalloutScreenPos({ x, y });
    };

    const interval = setInterval(updateCalloutPos, 30);
    updateCalloutPos();

    return () => clearInterval(interval);
  }, [selectedComponent]);

  // Auto-Focus Camera & Highlight Component when Fault Scenario is Triggered
  useEffect(() => {
    if (!state || !state.activeFault || state.activeFault === 'none') return;

    let targetComp: UAVComponentInfo | null = null;
    const f = state.activeFault.toLowerCase();

    if (f.includes('misfire') || f.includes('overheating')) {
      targetComp = viewMode === 'interior' ? UAV_COMPONENT_CATALOG.engineBlock : UAV_COMPONENT_CATALOG.engine;
    } else if (f.includes('injector')) {
      targetComp = viewMode === 'interior' ? UAV_COMPONENT_CATALOG.fuelSystem : UAV_COMPONENT_CATALOG.engine;
    } else if (f.includes('oil')) {
      targetComp = viewMode === 'interior' ? UAV_COMPONENT_CATALOG.oilSystem : UAV_COMPONENT_CATALOG.engine;
    } else if (f.includes('vibration')) {
      targetComp = UAV_COMPONENT_CATALOG.propeller;
    } else if (f.includes('sensor')) {
      targetComp = UAV_COMPONENT_CATALOG.sensors;
    }

    if (targetComp) {
      setSelectedComponent(targetComp);
      handleFocusComponent(targetComp);
    }
  }, [state?.activeFault, state?.faultSeverity]);

  // Update Material Opacity based on View Mode (Exterior vs Interior vs Cutaway)
  useEffect(() => {
    const targetGroup = isCustomModelLoaded ? customModelSceneRef.current : exteriorShellRef.current;
    if (!targetGroup) return;

    let targetOpacity = 1.0;
    if (viewMode === 'interior') {
      targetOpacity = 0.22;
    } else if (viewMode === 'cutaway') {
      targetOpacity = cutawayOpacity;
    }

    targetGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.transparent = targetOpacity < 0.99;
            mat.opacity = targetOpacity;
          });
        } else {
          child.material.transparent = targetOpacity < 0.99;
          child.material.opacity = targetOpacity;
        }
      }
    });
  }, [viewMode, cutawayOpacity, isCustomModelLoaded]);

  // Fit Camera to View Bounding Box
  const handleFitToView = () => {
    const target = customModelSceneRef.current || uavRootRef.current;
    if (!target || !cameraRef.current) return;

    const box = new THREE.Box3().setFromObject(target);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const center = sphere.center;

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

  // Focus Camera onto Selected Component
  const handleFocusComponent = (comp: UAVComponentInfo) => {
    const pos = comp.position;
    targetLookAt.current.set(pos[0], pos[1], pos[2]);
    if (controlsRef.current) {
      controlsRef.current.target.set(pos[0], pos[1], pos[2]);
    }
    targetCamPos.current.set(pos[0] - 3.2, pos[1] + 1.6, pos[2] + 2.2);
  };

  // Reset Camera View
  const handleResetView = () => {
    setViewMode('exterior');
    targetCamPos.current.set(12, 8, 16);
    targetLookAt.current.set(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
    setSelectedComponent(null);
  };

  // Fullscreen Toggle
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

  const catalogList = Object.values(UAV_COMPONENT_CATALOG).filter(
    (c) => viewMode === 'interior' || !c.source.includes('CONCEPTUAL')
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${height} rounded-lg overflow-hidden eng-panel border border-[#1a2438] bg-[#060810] select-none`}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP VIEW SWITCH BUTTONS ([ EXTERIOR ] [ INTERIOR ]) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-[#0a0f1d] p-1 rounded border border-[#1a2438] text-xs font-mono shadow-xl">
        <button
          onClick={() => { setViewMode('exterior'); setSelectedComponent(null); }}
          className={`px-3 py-1 rounded font-semibold font-sans uppercase transition ${
            viewMode === 'exterior'
              ? 'bg-[#0284c7] text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#101728]'
          }`}
        >
          [ EXTERIOR ]
        </button>

        <button
          onClick={() => setViewMode('interior')}
          className={`px-3 py-1 rounded font-semibold font-sans uppercase transition ${
            viewMode === 'interior'
              ? 'bg-[#0284c7] text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#101728]'
          }`}
        >
          [ INTERIOR ]
        </button>

        <button
          onClick={() => setViewMode('cutaway')}
          className={`px-3 py-1 rounded font-semibold font-sans uppercase transition ${
            viewMode === 'cutaway'
              ? 'bg-[#0284c7] text-white font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#101728]'
          }`}
        >
          [ CUTAWAY ]
        </button>
      </div>

      {/* Cutaway Opacity Slider */}
      {viewMode === 'cutaway' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#0a0f1d] px-3.5 py-1.5 rounded border border-[#0284c7]/40 text-xs font-mono text-slate-200">
          <span className="text-slate-400 font-sans font-semibold">Outer Shell Opacity:</span>
          <input
            type="range"
            min="0.0"
            max="0.9"
            step="0.05"
            value={1.0 - cutawayOpacity}
            onChange={(e) => setCutawayOpacity(1.0 - parseFloat(e.target.value))}
            className="w-32 h-1.5 bg-[#1a2438] rounded appearance-none cursor-pointer accent-[#38bdf8]"
          />
          <span className="text-[#38bdf8] font-bold">{((1.0 - cutawayOpacity) * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Top Left Aircraft Identity Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2 bg-[#0a0f1d] px-3 py-1 rounded border border-[#1a2438] font-mono text-xs shadow-md">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
          <span className="text-slate-100 font-bold uppercase">RUSTOM DIGITAL TWIN</span>
          <span className="text-slate-600">|</span>
          <span className="text-[#38bdf8] font-semibold uppercase">{viewMode} MODE</span>
        </div>
      </div>

      {/* 3D-Anchored Callout Pointer attached to selected component's 3D coordinates */}
      {selectedComponent && calloutScreenPos && (
        <div
          className="pointer-events-none absolute z-30 transition-none -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: `${calloutScreenPos.x}px`, top: `${calloutScreenPos.y}px` }}
        >
          <div className="bg-[#0a0f1d] border border-[#0284c7] px-3 py-1.5 rounded font-mono text-xs shadow-2xl text-slate-100 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping shrink-0" />
            <span className="uppercase text-[#38bdf8] tracking-wide">{selectedComponent.name}</span>
          </div>
          <div className="w-0.5 h-6 bg-[#0284c7] mx-auto" />
          <div className="w-2 h-2 rounded-full bg-[#38bdf8] border border-white mx-auto -mt-1" />
        </div>
      )}

      {/* Hover Tooltip Near Cursor (No permanent label clutter) */}
      {hoveredNodeName && mouseScreenPos && !selectedComponent && (
        <div
          className="pointer-events-none absolute z-30 bg-[#0a0f1d]/90 backdrop-blur px-2.5 py-1 rounded border border-[#0284c7] font-mono text-[11px] text-[#38bdf8] shadow-lg flex items-center gap-1.5 -translate-x-1/2 -translate-y-full mb-2"
          style={{ left: `${mouseScreenPos.x}px`, top: `${mouseScreenPos.y}px` }}
        >
          <Info size={12} />
          <span>{hoveredNodeName}</span>
        </div>
      )}

      {/* Conceptual Interior View Banner Disclaimer */}
      {viewMode === 'interior' && (
        <div className="absolute top-14 left-3 z-10 bg-[#0a0f1d] border border-amber-500/40 px-3 py-1 rounded font-mono text-[10px] text-amber-300 flex items-center gap-2 max-w-md">
          <Info size={13} className="text-amber-400 shrink-0" />
          <span>CONCEPTUAL DIGITAL-TWIN COMPONENT</span>
        </div>
      )}

      {/* Toggle Parts List Button */}
      <button
        onClick={() => setShowPartsList(!showPartsList)}
        className="absolute top-14 right-3 z-20 bg-[#0a0f1d] hover:bg-[#101728] border border-[#1a2438] text-slate-300 hover:text-slate-100 px-2.5 py-1.5 rounded font-mono text-xs flex items-center gap-1.5 shadow-md"
      >
        <List size={13} className="text-[#38bdf8]" />
        <span>RUSTOM COMPONENTS</span>
      </button>

      {/* RUSTOM COMPONENTS List Drawer */}
      {showPartsList && (
        <div className="absolute top-24 right-3 z-30 w-72 max-h-80 overflow-y-auto eng-panel p-3 bg-[#0a0f1d] border border-[#1a2438] text-xs font-mono space-y-1.5 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#1a2438] pb-1.5 mb-2">
            <span className="font-sans font-bold text-slate-200 text-xs uppercase tracking-wider">
              RUSTOM COMPONENTS
            </span>
            <button
              onClick={() => setShowPartsList(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X size={13} />
            </button>
          </div>

          {catalogList.map((comp) => (
            <button
              key={comp.id}
              onClick={() => {
                setSelectedComponent(comp);
                handleFocusComponent(comp);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition ${
                selectedComponent?.id === comp.id
                  ? 'bg-[#0284c7] text-white font-bold'
                  : 'text-slate-300 hover:bg-[#101728] hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedComponent?.id === comp.id ? 'bg-white' : 'bg-[#38bdf8]'}`} />
                <span>{comp.name}</span>
              </span>
              <ChevronRight size={12} className="opacity-60" />
            </button>
          ))}
        </div>
      )}

      {/* Single Compact Component Details Panel */}
      {selectedComponent && (
        <div className="absolute top-24 right-3 z-30 w-80 eng-panel p-4 bg-[#0a0f1d] border border-[#0284c7] text-xs font-mono space-y-3 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#1a2438] pb-2">
            <div>
              <span className="text-[10px] text-[#38bdf8] font-sans font-bold uppercase block tracking-wider">
                {selectedComponent.category}
              </span>
              <h4 className="font-bold text-slate-100 text-xs font-sans mt-0.5">{selectedComponent.name}</h4>
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-[#060810] p-2 rounded border border-[#1a2438]">
            <span className="text-slate-400 text-[10px]">OPERATIONAL STATUS:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase ${
              selectedComponent.status === 'DEGRADED' ? 'eng-badge-warning' : 'eng-badge-success'
            }`}>
              {selectedComponent.status || 'NORMAL'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-bold block uppercase text-[10px] mb-0.5">FUNCTION:</span>
            <p className="text-slate-200 text-[11px] leading-relaxed font-sans">{selectedComponent.function}</p>
          </div>

          {selectedComponent.description && (
            <div>
              <span className="text-slate-500 font-bold block uppercase text-[10px] mb-0.5">DESCRIPTION:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{selectedComponent.description}</p>
            </div>
          )}

          {selectedComponent.details && (
            <div className="p-2 bg-[#060810] rounded border border-[#1a2438] text-[11px] space-y-1 font-mono">
              {Object.entries(selectedComponent.details).map(([key, val]) => (
                <div key={key} className="flex justify-between border-b border-[#141c2e] pb-1 last:border-b-0">
                  <span className="text-slate-500">{key}:</span>
                  <span className="text-[#38bdf8] font-bold">{val}</span>
                </div>
              ))}
            </div>
          )}

          {state && state.activeFault && state.activeFault !== 'none' && (
            <div className="p-2.5 bg-[#060810] rounded border border-rose-500/40 text-[11px] space-y-1 font-mono">
              <span className="text-rose-400 font-bold uppercase text-[10px] block border-b border-rose-500/20 pb-1">
                ACTIVE FAULT EVIDENCE SUMMARY
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">FAULTS TYPE:</span>
                <span className="text-rose-400 font-bold uppercase">{state.activeFault.replace('_', ' ')}</span>
              </div>
              {state.faultSeverity && (
                <div className="flex justify-between">
                  <span className="text-slate-500">SEVERITY:</span>
                  <span className="text-amber-400 font-bold">{(state.faultSeverity * 100).toFixed(0)}%</span>
                </div>
              )}
              {state.expectedEgt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">OBSERVED EGT:</span>
                  <span className="text-slate-200">{state.egt}°C <span className="text-slate-500">(Exp: {state.expectedEgt}°C)</span></span>
                </div>
              )}
              {state.expectedCht && (
                <div className="flex justify-between">
                  <span className="text-slate-500">OBSERVED CHT:</span>
                  <span className="text-slate-200">{state.cht}°C <span className="text-slate-500">(Exp: {state.expectedCht}°C)</span></span>
                </div>
              )}
              {state.rulHours !== undefined && (
                <div className="flex justify-between pt-1 border-t border-[#162035]">
                  <span className="text-slate-500">RUL ESTIMATE:</span>
                  <span className="text-emerald-400 font-bold">{state.rulHours} Hours</span>
                </div>
              )}
            </div>
          )}

          <div className="p-2 bg-[#060810] rounded border border-[#1a2438] text-[10px] text-slate-400">
            <span className="text-slate-500 font-bold block uppercase mb-0.5">SOURCE:</span>
            <span className={selectedComponent.source.includes('CONCEPTUAL') ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
              {selectedComponent.source}
            </span>
          </div>

          {/* Action Buttons: [ FOCUS COMPONENT ] & Close */}
          <div className="flex items-center gap-2 pt-1 font-sans">
            <button
              onClick={() => handleFocusComponent(selectedComponent)}
              className="flex-1 py-1.5 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition"
            >
              <Focus size={13} />
              <span>[ FOCUS COMPONENT ]</span>
            </button>
            <button
              onClick={() => setSelectedComponent(null)}
              className="px-3 py-1.5 rounded bg-[#101728] border border-[#283754] text-slate-300 text-xs hover:bg-[#141e34]"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Viewer Toolbar */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-[#0a0f1d] p-1 rounded border border-[#1a2438] text-xs font-mono shadow-xl">
        <button
          onClick={handleFitToView}
          className="px-2.5 py-1 rounded hover:bg-[#101728] text-slate-300 hover:text-slate-100 flex items-center gap-1 transition"
          title="Fit camera bounds to Rustom aircraft"
        >
          <Box size={13} className="text-[#38bdf8]" />
          <span>Fit View</span>
        </button>

        <button
          onClick={handleResetView}
          className="px-2.5 py-1 rounded hover:bg-[#101728] text-slate-300 hover:text-slate-100 flex items-center gap-1 transition"
          title="Reset Camera Position"
        >
          <RotateCcw size={13} className="text-slate-400" />
          <span>Reset</span>
        </button>

        <div className="h-4 w-[1px] bg-[#1a2438] mx-0.5" />

        <button
          onClick={toggleFullscreen}
          className="p-1 rounded hover:bg-[#101728] text-slate-300 hover:text-slate-100 transition"
          title="Toggle Canvas Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
};
