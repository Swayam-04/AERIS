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
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X
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
  const engineNodeRef = useRef<THREE.Object3D | null>(null);

  // Interaction State
  const [viewMode, setViewMode] = useState<ViewMode>('exterior');
  const [cutawayOpacity, setCutawayOpacity] = useState<number>(0.25);
  const [selectedComponent, setSelectedComponent] = useState<UAVComponentInfo | null>(null);
  const [hoveredNodeName, setHoveredNodeName] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCustomModelLoaded, setIsCustomModelLoaded] = useState(false);

  // Dragging Flag (prevents snapping while user orbits/pans)
  const isUserInteracting = useRef<boolean>(false);

  // Target Camera Interpolation Vectors
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(12, 8, 16));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Raycasting & Material Hover Cache
  const hoveredMaterialCache = useRef<{ mesh: THREE.Mesh; origEmissive: THREE.Color } | null>(null);

  // 1. Map Mesh/Node Name or Object Position to Catalog Component
  const mapMeshToComponent = (object: THREE.Object3D): UAVComponentInfo | null => {
    let curr: THREE.Object3D | null = object;
    
    // Search up parent chain for named node match
    while (curr && curr !== uavRootRef.current) {
      const name = curr.name.toLowerCase();
      if (name.includes('wing') && name.includes('right')) return UAV_COMPONENT_CATALOG.wingRight;
      if (name.includes('wing') && name.includes('left')) return UAV_COMPONENT_CATALOG.wingLeft;
      if (name.includes('wing')) return UAV_COMPONENT_CATALOG.wingRight;
      if (name.includes('propeller') || name.includes('prop') || name.includes('blade')) return UAV_COMPONENT_CATALOG.propeller;
      if (name.includes('engine') || name.includes('nacelle') || name.includes('rotax')) return UAV_COMPONENT_CATALOG.engine;
      if (name.includes('satcom') || name.includes('radome') || name.includes('nose')) return UAV_COMPONENT_CATALOG.noseRadome;
      if (name.includes('vertical_tail') || name.includes('fin')) return UAV_COMPONENT_CATALOG.verticalTail;
      if (name.includes('horizontal_tail') || name.includes('stabilizer')) return UAV_COMPONENT_CATALOG.horizontalTail;
      if (name.includes('tail')) return UAV_COMPONENT_CATALOG.verticalTail;
      if (name.includes('gear') || name.includes('wheel')) return UAV_COMPONENT_CATALOG.landingGear;
      if (name.includes('antenna') || name.includes('sensor')) return UAV_COMPONENT_CATALOG.antennas;
      if (name.includes('fuselage') || name.includes('body')) return UAV_COMPONENT_CATALOG.fuselage;

      // Internal component names
      if (name.includes('comp_engineblock') || name.includes('crankcase')) return UAV_COMPONENT_CATALOG.engineBlock;
      if (name.includes('comp_fuelsystem') || name.includes('injector')) return UAV_COMPONENT_CATALOG.fuelSystem;
      if (name.includes('comp_oilsystem') || name.includes('lubrication')) return UAV_COMPONENT_CATALOG.oilSystem;
      if (name.includes('comp_ecusystem') || name.includes('fadec')) return UAV_COMPONENT_CATALOG.ecuSystem;

      curr = curr.parent;
    }

    // Default fallback mapping based on world position
    const worldPos = new THREE.Vector3();
    object.getWorldPosition(worldPos);

    if (worldPos.x > 3.0) return UAV_COMPONENT_CATALOG.noseRadome;
    if (worldPos.x < -3.5 && worldPos.y > 1.2) return UAV_COMPONENT_CATALOG.horizontalTail;
    if (worldPos.x < -3.5) return UAV_COMPONENT_CATALOG.verticalTail;
    if (Math.abs(worldPos.z) > 2.5) return worldPos.z > 0 ? UAV_COMPONENT_CATALOG.wingRight : UAV_COMPONENT_CATALOG.wingLeft;
    if (Math.abs(worldPos.z) > 1.2 && worldPos.x < 0) return UAV_COMPONENT_CATALOG.engine;

    return UAV_COMPONENT_CATALOG.fuselage;
  };

  // 2. Initialize Three.js Viewport
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

    // Root Group for DRDO RUSTOM-II
    const uavRootGroup = new THREE.Group();
    uavRootGroup.name = "DRDO_RUSTOM_II";
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

    // Load actual Sketchfab DRDO Rustom 2 model asset
    gltfLoader.load(
      '/models/drdo_rustom_2_uav.glb',
      (gltf) => {
        if (gltf && gltf.scene) {
          customModelSceneRef.current = gltf.scene;

          // Traverse GLTF scene to find engine nodes
          gltf.scene.traverse((child) => {
            const nameLower = child.name.toLowerCase();
            if (nameLower.includes('engine') || nameLower.includes('nacelle') || nameLower.includes('rotax')) {
              engineNodeRef.current = child;
            }
          });

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
        if (hoveredMaterialCache.current) {
          if ('emissive' in hoveredMaterialCache.current.mesh.material) {
            (hoveredMaterialCache.current.mesh.material as any).emissive.copy(hoveredMaterialCache.current.origEmissive);
          }
          hoveredMaterialCache.current = null;
        }
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      // Ignore right-click pan or middle click
      if (event.button !== 0) return;

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
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

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
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

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
    targetCamPos.current.set(pos[0] - 3.5, pos[1] + 1.8, pos[2] + 2.5);
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

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${height} rounded-lg overflow-hidden eng-panel border border-[#1a2438] bg-[#060810] select-none`}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 1. TOP VIEW SWITCH BUTTONS ([ EXTERIOR ] [ INTERIOR ]) */}
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
          <span className="text-slate-100 font-bold uppercase">RUSTOM-1 DIGITAL TWIN</span>
          <span className="text-slate-600">|</span>
          <span className="text-[#38bdf8] font-semibold uppercase">{viewMode} MODE</span>
        </div>
      </div>

      {/* Hovered Component Tooltip Overlay */}
      {hoveredNodeName && !selectedComponent && (
        <div className="absolute bottom-16 left-3 z-10 bg-[#0a0f1d] px-3 py-1 rounded border border-[#0284c7] font-mono text-xs text-[#38bdf8] shadow-lg flex items-center gap-1.5">
          <Info size={13} />
          <span>Click to Inspect: <strong>{hoveredNodeName}</strong></span>
        </div>
      )}

      {/* Conceptual Interior View Banner Disclaimer */}
      {viewMode === 'interior' && (
        <div className="absolute top-14 left-3 z-10 bg-[#0a0f1d] border border-amber-500/40 px-3 py-1 rounded font-mono text-[10px] text-amber-300 flex items-center gap-2 max-w-md">
          <Info size={13} className="text-amber-400 shrink-0" />
          <span>CONCEPTUAL INTERIOR VIEW — AERIS Aero-Engine Digital Twin System</span>
        </div>
      )}

      {/* Selected Component Information Overlay Panel */}
      {selectedComponent && (
        <div className="absolute top-14 right-3 z-30 w-80 eng-panel p-4 bg-[#0a0f1d] border border-[#0284c7] text-xs font-mono space-y-3 shadow-2xl animate-fadeIn">
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

          <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{selectedComponent.description}</p>

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

          <div className="p-2 bg-[#060810] rounded border border-[#1a2438] text-[10px] text-slate-400">
            <span className="text-slate-500 font-bold block uppercase mb-0.5">SOURCE:</span>
            <span className={selectedComponent.source.includes('CONCEPTUAL') ? 'text-amber-400 font-semibold' : 'text-slate-300'}>
              {selectedComponent.source}
            </span>
          </div>

          {/* Action Buttons: [ FOCUS ] & Close */}
          <div className="flex items-center gap-2 pt-1 font-sans">
            <button
              onClick={() => handleFocusComponent(selectedComponent)}
              className="flex-1 py-1.5 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition"
            >
              <Focus size={13} />
              <span>[ FOCUS CAMERA ]</span>
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
          title="Fit camera bounds to Rustom-1 aircraft"
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
