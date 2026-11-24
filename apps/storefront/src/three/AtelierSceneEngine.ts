import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import type { RackPiece } from '../data/studioRack';
import {
  computeExplodedLayerOffset,
  computeRackSlotX,
  getCameraPresetPose,
  type CameraPresetId,
  type LightingMoodId,
} from './atelierMath';
import { createProceduralAtelierTextures } from './proceduralTextures';
import {
  buildBoutiqueRackStage,
  buildTailoredHoodieGroup,
  type HoodieSculptureInstance,
} from './atelierGeometry';

// Module-level pre-allocated scratch helpers (zero per-frame allocations)
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _pointer = new THREE.Vector2();

interface MoteParticle {
  x: number;
  y: number;
  z: number;
  speedY: number;
  phase: number;
  scale: number;
}

export interface AtelierEngineCallbacks {
  onSelectIndex?: (index: number) => void;
  onHoverIndex?: (index: number | null) => void;
}

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param) ?? '');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
}

export class AtelierSceneEngine {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private envRenderTarget: THREE.WebGLRenderTarget;
  private textures: ReturnType<typeof createProceduralAtelierTextures>;
  private stage: ReturnType<typeof buildBoutiqueRackStage>;
  private hoodies: HoodieSculptureInstance[] = [];
  private raycaster = new THREE.Raycaster();
  private hitMeshes: THREE.Object3D[] = [];

  private keyLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private softboxLight: THREE.RectAreaLight | null = null;
  private moteMesh!: THREE.InstancedMesh;
  private motes: MoteParticle[] = [];

  private activeIndex = 0;
  private hoveredIndex: number | null = null;
  private explodedTarget = 0;
  private explodedCurrent = 0;
  private autoRotate = false;

  // Damped camera preset target tracking
  private cameraTransitionActive = false;
  private desiredCamPos = new THREE.Vector3();
  private desiredCamTarget = new THREE.Vector3();

  private startTimeMs = performance.now();
  private lastFrameMs = performance.now();
  private frameId = 0;
  private disposed = false;
  private lastRaycastMs = 0;
  private callbacks: AtelierEngineCallbacks;
  private resizeObserver: ResizeObserver;

  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerClick: (e: MouseEvent) => void;

  constructor(
    container: HTMLElement,
    pieces: RackPiece[],
    initialIndex: number,
    callbacks: AtelierEngineCallbacks = {}
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.activeIndex = Math.max(0, Math.min(pieces.length - 1, initialIndex));
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    // 1. Renderer setup with ACES Filmic Tone Mapping & Software WebGL guard
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      preserveDrawingBuffer: this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    // 2. Scene, Horizon-Matched Exponential Fog & Procedural RoomEnvironment IBL
    this.scene = new THREE.Scene();
    const bgColor = new THREE.Color('#0B0B0C');
    this.scene.background = bgColor;
    this.scene.fog = new THREE.FogExp2(0x0b0b0c, 0.068);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // 3. Camera & Damped OrbitControls
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 45);
    const startPose = getCameraPresetPose('fit');
    this.camera.position.set(...startPose.position);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...startPose.target);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 1.35;
    this.controls.maxDistance = 8.5;
    this.controls.minPolarAngle = Math.PI * 0.16;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.enablePan = false;
    this.controls.addEventListener('start', () => {
      // Cancel scripted transition immediately so user orbit never fights
      this.cameraTransitionActive = false;
    });
    this.controls.update();

    // 4. Warm/Cool 3-Point Atelier Lighting Rig + Optional Studio Softbox
    this.setupLighting();

    // 5. Procedural Textures, Stage & Composite 11-Part Hoodie Sculptures
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralAtelierTextures(maxAniso);
    this.stage = buildBoutiqueRackStage(this.textures);
    this.scene.add(this.stage.group);

    this.hoodies = pieces.map((piece, idx) => {
      const restX = computeRackSlotX(idx, pieces.length, 0.68);
      const sculpture = buildTailoredHoodieGroup(
        piece,
        idx,
        restX,
        this.stage.railY,
        this.textures,
        maxAniso
      );

      // Initialize active piece forward at center podium, others sideways folded along rack
      const isSelected = idx === this.activeIndex;
      sculpture.root.position.set(isSelected ? 0 : restX, this.stage.railY, isSelected ? 1.05 : 0);
      sculpture.hangerAssembly.rotation.y = isSelected ? 0 : -1.14;
      this.scene.add(sculpture.root);
      this.hitMeshes.push(sculpture.hitMesh);
      return sculpture;
    });

    // 6. Floating Atelier Cotton-Fiber Motes (InstancedMesh > 20 repeated elements)
    this.setupFiberMotes();

    // 7. Raycasting setup (dedicated layer 1 proxy hit boxes)
    this.raycaster.layers.set(1);
    this.boundPointerMove = (e) => this.handlePointerMove(e);
    this.boundPointerClick = (e) => this.handleClick(e);
    this.renderer.domElement.addEventListener('pointermove', this.boundPointerMove);
    this.renderer.domElement.addEventListener('click', this.boundPointerClick);

    // 8. Responsive container ResizeObserver
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    // Pre-warm GPU shader programs on hardware GPUs
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.startTimeMs = performance.now();
    this.lastFrameMs = this.startTimeMs;
    this.startLoop();
  }

  private setupLighting(): void {
    // Cool sky / dark warm studio ground bounce
    this.hemiLight = new THREE.HemisphereLight(0xbcccf0, 0x161214, 0.45);
    this.scene.add(this.hemiLight);

    // Warm key directional light with tight frustum shadow bounds
    this.keyLight = new THREE.DirectionalLight(0xfff0dc, 1.72);
    this.keyLight.position.set(3.4, 5.2, 4.2);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 16;
    const d = 4.6;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0004;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    // Back-left blush rim edge light
    this.rimLight = new THREE.DirectionalLight(0xe8d5ce, 0.95);
    this.rimLight.position.set(-3.2, 3.6, -2.8);
    this.scene.add(this.rimLight);

    // Top studio softbox area highlight (skipped only on software WebGL)
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      this.softboxLight = new THREE.RectAreaLight(0xfff5ec, 2.6, 3.4, 1.2);
      this.softboxLight.position.set(0, 3.7, 1.5);
      this.softboxLight.lookAt(0, 1.55, 1.0);
      this.scene.add(this.softboxLight);
    }
  }

  private setupFiberMotes(): void {
    const count = 34;
    const moteGeom = new THREE.IcosahedronGeometry(0.0055, 0);
    const moteMat = new THREE.MeshStandardMaterial({
      color: 0xe8d5ce,
      emissive: 0x3b231e,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.45,
      roughness: 0.5,
      metalness: 0.05,
    });
    this.moteMesh = new THREE.InstancedMesh(moteGeom, moteMat, count);
    this.moteMesh.frustumCulled = false;

    for (let i = 0; i < count; i++) {
      const rx = ((Math.sin(i * 19.3) + 1) * 0.5 - 0.5) * 4.4;
      const ry = 0.4 + ((Math.cos(i * 7.1) + 1) * 0.5) * 2.4;
      const rz = -0.6 + ((Math.sin(i * 11.7) + 1) * 0.5) * 2.6;
      const sc = 0.55 + ((Math.cos(i * 3.7) + 1) * 0.5) * 0.9;
      this.motes.push({
        x: rx,
        y: ry,
        z: rz,
        speedY: 0.045 + (i % 5) * 0.012,
        phase: i * 0.62,
        scale: sc,
      });

      _vec3A.set(rx, ry, rz);
      _scale.setScalar(sc);
      _mat4.compose(_vec3A, _quat, _scale);
      this.moteMesh.setMatrixAt(i, _mat4);
    }
    this.moteMesh.instanceMatrix.needsUpdate = true;
    this.moteMesh.computeBoundingSphere();
    this.scene.add(this.moteMesh);
  }

  private handleResize(): void {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 320);
    const h = Math.max(this.container.clientHeight, 320);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.render(this.scene, this.camera);
  }

  private updateRayFromEvent(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handlePointerMove(event: PointerEvent): void {
    const now = performance.now();
    if (now - this.lastRaycastMs < 48) return;
    this.lastRaycastMs = now;

    this.updateRayFromEvent(event);
    this.raycaster.setFromCamera(_pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);

    const nextHover =
      hits.length > 0 && typeof hits[0].object.userData.slotIndex === 'number'
        ? (hits[0].object.userData.slotIndex as number)
        : null;

    if (nextHover !== this.hoveredIndex) {
      this.hoveredIndex = nextHover;
      this.renderer.domElement.style.cursor = nextHover !== null ? 'pointer' : 'grab';
      this.callbacks.onHoverIndex?.(nextHover);
    }
  }

  private handleClick(event: MouseEvent): void {
    this.updateRayFromEvent(event);
    this.raycaster.setFromCamera(_pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);
    if (hits.length > 0 && typeof hits[0].object.userData.slotIndex === 'number') {
      const idx = hits[0].object.userData.slotIndex as number;
      this.setActiveIndex(idx);
      this.callbacks.onSelectIndex?.(idx);
    }
  }

  public setActiveIndex(index: number): void {
    if (index < 0 || index >= this.hoodies.length) return;
    this.activeIndex = index;
  }

  public setExplodedAmount(amount: number): void {
    this.explodedTarget = Math.max(0, Math.min(1, amount));
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
    this.controls.autoRotate = !this.isSoftwareGl && enabled;
    this.controls.autoRotateSpeed = 1.5;
  }

  public setCameraPreset(preset: CameraPresetId): void {
    const pose = getCameraPresetPose(preset, 1.05);
    this.desiredCamPos.set(...pose.position);
    this.desiredCamTarget.set(...pose.target);
    this.cameraTransitionActive = true;
  }

  public setLightingMood(mood: LightingMoodId): void {
    if (mood === 'crimson') {
      this.keyLight.color.setHex(0xffdfd8);
      this.keyLight.intensity = 1.9;
      this.rimLight.color.setHex(0xc81422);
      this.rimLight.intensity = 1.95;
      this.hemiLight.color.setHex(0x8ba2dc);
      this.hemiLight.groundColor.setHex(0x280d12);
    } else if (mood === 'loom') {
      this.keyLight.color.setHex(0xf9fbff);
      this.keyLight.intensity = 2.25;
      this.rimLight.color.setHex(0xd4e2ff);
      this.rimLight.intensity = 1.0;
      this.hemiLight.color.setHex(0xdbe8ff);
      this.hemiLight.groundColor.setHex(0x1f2228);
    } else {
      this.keyLight.color.setHex(0xfff0dc);
      this.keyLight.intensity = 2.15;
      this.rimLight.color.setHex(0xe8d5ce);
      this.rimLight.intensity = 1.15;
      this.hemiLight.color.setHex(0xc8d8ff);
      this.hemiLight.groundColor.setHex(0x1e1618);
    }
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(() => this.tick(), 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private startLoop(): void {
    this.tick();
  }

  private tick(): void {
    if (this.disposed) return;
    const nowMs = performance.now();
    const rawDelta = (nowMs - this.lastFrameMs) / 1000;
    this.lastFrameMs = nowMs;
    const dt = Math.min(Math.max(rawDelta, 0.001), 0.08);
    const elapsed = (nowMs - this.startTimeMs) / 1000;

    // Smooth camera preset damping
    if (this.cameraTransitionActive) {
      const camAlpha = 1 - Math.exp(-6.2 * dt);
      this.camera.position.lerp(this.desiredCamPos, camAlpha);
      this.controls.target.lerp(this.desiredCamTarget, camAlpha);
      if (
        this.camera.position.distanceToSquared(this.desiredCamPos) < 0.0005 &&
        this.controls.target.distanceToSquared(this.desiredCamTarget) < 0.0005
      ) {
        this.camera.position.copy(this.desiredCamPos);
        this.controls.target.copy(this.desiredCamTarget);
        this.cameraTransitionActive = false;
      }
    }

    // Damped exploded construction slider
    this.explodedCurrent = THREE.MathUtils.damp(this.explodedCurrent, this.explodedTarget, 8.5, dt);

    // Animate each hanging sculpture: 3D sideways flip, center stage pull-forward & explosion
    for (let i = 0; i < this.hoodies.length; i++) {
      const h = this.hoodies[i];
      const isSelected = i === this.activeIndex;
      const isHovered = i === this.hoveredIndex;

      const targetX = isSelected ? 0 : h.restX;
      const targetZ = isSelected ? 1.05 : isHovered ? 0.16 : 0;
      const targetY = this.stage.railY - (isSelected ? 0.14 : 0);

      // Selected turns 0deg front-facing (plus slow turntable when Spin is toggled),
      // hovered unfolds partially to -18deg, resting hangs sideways at -66deg (-1.15 rad)
      const targetRotY = isSelected
        ? this.autoRotate
          ? Math.sin(elapsed * 0.55) * 0.42
          : 0
        : isHovered
          ? -0.32
          : -1.15;

      const posAlpha = 1 - Math.exp(-7.5 * dt);
      h.root.position.x = THREE.MathUtils.lerp(h.root.position.x, targetX, posAlpha);
      h.root.position.z = THREE.MathUtils.lerp(h.root.position.z, targetZ, posAlpha);
      h.root.position.y = THREE.MathUtils.lerp(h.root.position.y, targetY, posAlpha);

      h.hangerAssembly.rotation.y = THREE.MathUtils.damp(
        h.hangerAssembly.rotation.y,
        targetRotY,
        8.2,
        dt
      );
      // Gentle studio air sway
      h.hangerAssembly.rotation.z = Math.sin(elapsed * 1.15 + i * 0.9) * 0.012;

      // Explode layers only on the active stage piece
      const activeExplode = isSelected ? this.explodedCurrent : 0;
      for (let j = 0; j < h.layers.length; j++) {
        const layer = h.layers[j];
        const [ox, oy, oz] = computeExplodedLayerOffset(layer.role, activeExplode);
        _vec3B.set(layer.basePos.x + ox, layer.basePos.y + oy, layer.basePos.z + oz);
        layer.object.position.lerp(_vec3B, posAlpha);
      }
    }

    // Drift subtle cotton-fiber studio motes (zero GC allocations)
    for (let i = 0; i < this.motes.length; i++) {
      const m = this.motes[i];
      m.y += m.speedY * dt;
      if (m.y > 2.95) m.y = 0.25;
      _vec3A.set(
        m.x + Math.sin(elapsed * 0.7 + m.phase) * 0.08,
        m.y,
        m.z + Math.cos(elapsed * 0.55 + m.phase) * 0.08
      );
      _scale.setScalar(m.scale);
      _mat4.compose(_vec3A, _quat, _scale);
      this.moteMesh.setMatrixAt(i, _mat4);
    }
    this.moteMesh.instanceMatrix.needsUpdate = true;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointermove', this.boundPointerMove);
    this.renderer.domElement.removeEventListener('click', this.boundPointerClick);
    this.controls.dispose();
    this.stage.dispose();
    this.hoodies.forEach((h) => h.dispose());
    this.textures.dispose();
    this.moteMesh.geometry.dispose();
    (this.moteMesh.material as THREE.Material).dispose();
    this.envRenderTarget.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
