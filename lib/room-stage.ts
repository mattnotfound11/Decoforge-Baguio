import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { finishColor, finishTextures, SURFACE_FINISH, TILE_M } from "./material-textures";
import type { Material } from "./materials";
import { windowIn, type Dims, type SurfaceId } from "./room";

/**
 * The room composer's 3D stage: a sectional model of the room, built at true
 * scale in metres and lit physically, so a finish reads the way it will on
 * site.
 *
 * - Image-based lighting from a studio environment, plus a sun through the
 *   window that casts real shadows, a linear cove that grazes the feature
 *   wall (so ribs and grooves show their relief), and a pendant.
 * - Khronos PBR Neutral tone mapping, which keeps a finish's catalog colour
 *   rather than shifting its hue the way filmic curves do.
 * - Walls the camera stands behind are cut away, the way a section drawing
 *   removes what's in front of the cut, so the room is always seen from inside.
 * - Renders only when something changes, and not at all while off screen.
 *
 * Plain three.js with no React: the page imports this module on demand when
 * the composer nears the viewport, so the home page doesn't pay for it up front.
 */

export type Mood = "day" | "evening";
export type View = "eye" | "corner" | "overhead";

export interface StageOptions {
  dims: Dims;
  finishes: Record<SurfaceId, Material | null>;
  mood: Mood;
  view: View;
  /** Fine pointer: drag to look around, click a surface to edit it. */
  interactive: boolean;
  reducedMotion: boolean;
  onPick?: (surface: SurfaceId) => void;
  /** The surface under the pointer (canvas coordinates), or null. */
  onHover?: (surface: SurfaceId | null, x: number, y: number) => void;
  /** Camera heading in radians; 0 faces the feature wall square on. */
  onHeading?: (azimuth: number) => void;
  /** The stage changed view itself, to show a surface the camera couldn't see. */
  onView?: (view: View) => void;
  /** The wheel was used without Ctrl over the room: tell them how to zoom. */
  onZoomHint?: () => void;
  onLost?: () => void;
}

/**
 * The planes a finish is laid on. The walls surface covers three of them:
 * the feature wall, the window wall (`left`) and the side wall (`right`).
 */
type Face = SurfaceId | "left" | "right";
const ALL: Face[] = ["wall", "left", "right", "ceiling", "floor"];
const WALLS = new Set<Face>(["wall", "left", "right"]);
/** The surface a face belongs to, for picking and hover. */
const surfaceOf = (face: Face): SurfaceId => (WALLS.has(face) ? "wall" : (face as SurfaceId));
const facesOf = (surface: SurfaceId): Face[] => (surface === "wall" ? ["wall", "left", "right"] : [surface]);

/** Wall and slab thickness, metres. */
const WALL = 0.14;
const SLAB = 0.18;
/** Gap that keeps a finish clear of the surface it sits on. */
const EPS = 0.003;
/** A longish lens, as in architectural photography, keeps verticals near true. */
const FOV = 30;
/** Zoom, as a fraction of the distance that frames the whole room. */
const ZOOM = { min: 0.3, max: 1.3 };
/**
 * Where the room may reach on screen, in clip space, clear of the overlays.
 * Wider stages keep more room at the bottom for the key plan.
 */
const FRAME = { x: 0.9, top: 0.8, bottom: -0.74, bottomNarrow: -0.84 };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Lighting {
  sun: number;
  sunColor: THREE.Color;
  env: number;
  hemi: number;
  cove: number;
  lamp: number;
  /** Light thrown back up off the floor, tinted by its finish. */
  bounce: number;
  /** Daylight sky's opacity over the dusk sky behind it. */
  sky: number;
  exposure: number;
}

const MOODS: Record<Mood, Lighting> = {
  day: { sun: 3.6, sunColor: new THREE.Color("#fff1dc"), env: 0.75, hemi: 0.9, cove: 0.6, lamp: 0, bounce: 0.5, sky: 1, exposure: 1 },
  evening: { sun: 0.5, sunColor: new THREE.Color("#ff9152"), env: 0.12, hemi: 0.18, cove: 16, lamp: 14, bounce: 0.12, sky: 0, exposure: 1.12 },
};

const lerpLighting = (a: Lighting, b: Lighting, t: number): Lighting => ({
  sun: a.sun + (b.sun - a.sun) * t,
  sunColor: a.sunColor.clone().lerp(b.sunColor, t),
  env: a.env + (b.env - a.env) * t,
  hemi: a.hemi + (b.hemi - a.hemi) * t,
  cove: a.cove + (b.cove - a.cove) * t,
  lamp: a.lamp + (b.lamp - a.lamp) * t,
  bounce: a.bounce + (b.bounce - a.bounce) * t,
  sky: a.sky + (b.sky - a.sky) * t,
  exposure: a.exposure + (b.exposure - a.exposure) * t,
});

interface Pose {
  target: THREE.Vector3;
  theta: number;
  phi: number;
  radius: number;
}

interface Wipe {
  overlay: THREE.Mesh;
  plane: THREE.Plane;
  start: number;
}

export class RoomStage {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  private readonly probe = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  private readonly controls: OrbitControls | null;
  private readonly opts: StageOptions;

  private dims: Dims;
  private picked: Record<Face, Material | null>;
  private view: View;
  private mood: Mood;
  private userMoved = false;
  private visible = true;
  private disposed = false;
  private raf = 0;
  private lastHeading = NaN;
  private frameBottom = FRAME.bottom;
  /** Corner view from the right (1) or the left (-1). */
  private cornerSide = 1;
  private zoom = 1;
  private zoomGoal = 1;
  /** World point a zoom closes in on: under the cursor, or between two fingers. */
  private anchor: THREE.Vector3 | null = null;

  // Lights.
  private readonly sun = new THREE.DirectionalLight();
  private readonly hemi = new THREE.HemisphereLight("#e6edf2", "#c2a78a");
  private readonly cove: THREE.RectAreaLight;
  private readonly bounce: THREE.RectAreaLight;
  private readonly lamp = new THREE.SpotLight("#ffb56e", 0, 0, 1.05, 0.9, 2);
  private lighting: Lighting;
  private moodTween: { from: Lighting; to: Lighting; start: number } | null = null;
  private camTween: { from: Pose; to: Pose; start: number; duration?: number } | null = null;
  private introPlayed = false;

  // Geometry rebuilt whenever the room's size changes.
  private shell = new THREE.Group();
  private leftWall = new THREE.Group();
  private leftStub: THREE.Mesh | null = null;
  private rightWall = new THREE.Group();
  private rightStub: THREE.Mesh | null = null;
  private overhead = new THREE.Group();

  // One plane per surface carries its finish; a second wipes the next one on.
  private readonly layers = Object.fromEntries(ALL.map((s) => [s, new THREE.Group()])) as Record<Face, THREE.Group>;
  private readonly finish: Record<Face, THREE.Mesh>;
  private readonly keepAll = () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e4);
  private wipes: Partial<Record<Face, Wipe>> = {};

  private readonly mats: Mats;
  private readonly owned = new Set<{ dispose(): void }>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly cleanup: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, opts: StageOptions) {
    this.opts = opts;
    this.dims = opts.dims;
    this.picked = Object.fromEntries(ALL.map((s) => [s, null])) as Record<Face, Material | null>;
    this.view = opts.view;
    this.mood = opts.mood;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.interactive ? 2 : 1.5));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    this.renderer = renderer;

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.disposed = true;
      opts.onLost?.();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    this.cleanup.push(() => canvas.removeEventListener("webglcontextlost", onLost));

    // Image-based lighting: a neutral studio, prefiltered for every roughness.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environment = env;
    this.owned.add(env);

    this.mats = createMaterials((t) => this.own(t));

    // Lights.
    RectAreaLightUniformsLib.init();
    this.cove = new THREE.RectAreaLight("#ffc68c", 0, 1, 0.05);
    this.bounce = new THREE.RectAreaLight("#b08060", 0, 1, 1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.setScalar(opts.interactive ? 2048 : 1024);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun, this.sun.target, this.hemi, this.cove, this.bounce);
    this.lighting = MOODS[opts.mood];

    // Finish planes, one per surface, persistent across resizes.
    const plane = (surface: Face): THREE.Mesh => {
      const mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.fallback(surface));
      mesh.receiveShadow = true;
      mesh.userData.surface = surface;
      this.layers[surface].add(mesh);
      this.scene.add(this.layers[surface]);
      return mesh;
    };
    this.finish = Object.fromEntries(ALL.map((s) => [s, plane(s)])) as Record<Face, THREE.Mesh>;

    this.scene.add(this.shell);

    // Look around by dragging. The wheel keeps scrolling the page; zoom is
    // Ctrl + wheel (a trackpad pinch), the buttons, or a pinch on touch.
    if (opts.interactive) {
      const controls = new OrbitControls(this.camera, canvas);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = !opts.reducedMotion;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.55;
      controls.minAzimuthAngle = -1.25;
      controls.maxAzimuthAngle = 1.25;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = 1.62;
      controls.addEventListener("start", () => {
        this.userMoved = true;
        this.camTween = null;
        canvas.style.cursor = "grabbing";
      });
      controls.addEventListener("end", () => (canvas.style.cursor = "grab"));
      controls.addEventListener("change", this.invalidate);
      this.controls = controls;
      this.pointerPicking(canvas);
    } else {
      this.controls = null;
      this.touchGestures(canvas);
    }
    this.wheelZoom(canvas);

    this.build();
    for (const f of ALL) this.setFace(f, opts.finishes[surfaceOf(f)], true);
    this.applyLighting(this.lighting);
    this.place(this.pose(this.view));
  }

  /* --------------------------------------------------------- public -- */

  resize(width: number, height: number) {
    if (this.disposed || width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.frameBottom = width < 560 ? FRAME.bottomNarrow : FRAME.bottom;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.reframe();
    this.invalidate();
  }

  setRoom(dims: Dims) {
    const d = this.dims;
    if (d.width === dims.width && d.depth === dims.depth && d.height === dims.height) return;
    this.dims = dims;
    this.build();
    this.reframe();
    this.invalidate();
  }

  /** Lay a finish on a surface: for the walls, all three at once. */
  setFinish(surface: SurfaceId, material: Material | null) {
    facesOf(surface).forEach((f, i) => this.setFace(f, material, false, i * 140));
  }

  private setFace(surface: Face, material: Material | null, instant = false, delay = 0) {
    if (!instant && this.picked[surface]?.slug === material?.slug) return;
    this.picked[surface] = material;
    this.settleWipe(surface);

    const next = material ? this.finishMaterial(material) : this.fallback(surface);
    if (surface === "floor") this.bounce.color.set(material ? finishColor(material) : "#8b8177");
    const mesh = this.finish[surface];
    this.layoutFinish(surface);

    if (instant || this.opts.reducedMotion) {
      this.swap(mesh, next);
    } else {
      // The new finish is laid over the old and revealed by a moving clipping
      // plane, like a fresh coat rolled on: top to bottom on the wall,
      // back to front across the floor and ceiling.
      const overlay = new THREE.Mesh(mesh.geometry, next);
      overlay.position.copy(mesh.position);
      overlay.rotation.copy(mesh.rotation);
      overlay.position.add(this.inward(surface).multiplyScalar(EPS));
      overlay.receiveShadow = true;
      overlay.userData.surface = surface;
      const plane = new THREE.Plane();
      next.clippingPlanes = [plane];
      this.layers[surface].add(overlay);
      this.wipes[surface] = { overlay, plane, start: performance.now() + delay };
      this.stepWipe(surface, 0);
    }
    this.invalidate();
  }

  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    const to = MOODS[mood];
    if (this.opts.reducedMotion) {
      this.lighting = to;
      this.applyLighting(to);
    } else {
      this.moodTween = { from: this.lighting, to, start: performance.now() };
    }
    this.invalidate();
  }

  /** Move to a preset view. `recentre` returns to it even if it's current, after a drag. */
  setView(view: View, recentre = false) {
    if (view === this.view && !(recentre && (this.userMoved || this.zoom !== 1))) return;
    this.view = view;
    this.userMoved = false;
    // Hand any zoom over to the tween, so it glides back out rather than jumps.
    const from = this.currentPose();
    from.radius *= this.zoom;
    this.zoom = this.zoomGoal = 1;
    this.anchor = null;
    const to = this.pose(view);
    if (this.opts.reducedMotion) this.place(to);
    else this.camTween = { from, to, start: performance.now() };
    this.invalidate();
  }

  /**
   * The first time the room is properly in view, the camera glides in to its
   * preset from a wider, lower angle, the way a walkthrough opens.
   */
  playIntro() {
    if (this.introPlayed || this.opts.reducedMotion || this.userMoved) return;
    this.introPlayed = true;
    const to = this.pose(this.view);
    const from = { ...to, target: to.target.clone(), theta: to.theta - 0.55 * this.cornerSide, phi: Math.min(1.55, to.phi + 0.12), radius: to.radius * 1.4 };
    this.place(from);
    this.camTween = { from, to, start: performance.now(), duration: 2200 };
    this.invalidate();
  }

  /** Zoom in (factor < 1) or out, on the middle of the view. */
  zoomBy(factor: number) {
    this.anchor = null;
    this.zoomTo(this.zoomGoal * factor);
  }

  /**
   * Make sure a surface can be seen: if the camera stands behind it (so it is
   * cut away), swing round to the corner view that faces it.
   */
  reveal(surface: SurfaceId) {
    if (facesOf(surface).some((f) => this.sees(f))) return;
    this.cornerSide = 1;
    this.view = "eye"; // so setView doesn't treat corner as current
    this.setView("corner");
    this.opts.onView?.("corner");
  }

  /** Off screen, the stage keeps its state but draws nothing. */
  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible) this.invalidate();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.cleanup.forEach((fn) => fn());
    this.controls?.dispose();
    for (const s of ALL) this.settleWipe(s);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        this.release(o.material as THREE.Material);
      }
    });
    Object.values(this.mats).forEach((m) => m.dispose());
    this.owned.forEach((o) => o.dispose());
    this.renderer.dispose();
  }

  /* ---------------------------------------------------------- frame -- */

  private invalidate = () => {
    if (!this.raf && this.visible && !this.disposed) this.raf = requestAnimationFrame(this.frame);
  };

  private frame = (now: number) => {
    this.raf = 0;
    let busy = false;

    if (this.camTween) {
      const { from, to, start, duration = 1100 } = this.camTween;
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const k = ease(t);
      this.place({
        target: from.target.clone().lerp(to.target, k),
        theta: from.theta + (to.theta - from.theta) * k,
        phi: from.phi + (to.phi - from.phi) * k,
        radius: from.radius + (to.radius - from.radius) * k,
      });
      if (t < 1) busy = true;
      else this.camTween = null;
    }

    if (this.moodTween) {
      const { from, to, start } = this.moodTween;
      const t = Math.min(1, (now - start) / 900);
      this.lighting = lerpLighting(from, to, ease(t));
      this.applyLighting(this.lighting);
      if (t < 1) busy = true;
      else this.moodTween = null;
    }

    if (Math.abs(this.zoomGoal - this.zoom) > 0.0005) {
      this.stepZoom();
      busy = true;
    }

    for (const s of ALL) {
      const wipe = this.wipes[s];
      if (!wipe) continue;
      const t = Math.max(0, Math.min(1, (now - wipe.start) / 950));
      this.stepWipe(s, ease(t));
      if (t < 1) busy = true;
      else this.settleWipe(s);
    }

    // Damping keeps the camera gliding after a drag; `update` says when it has.
    // While the visitor steers, the distance follows the angle, so the whole
    // room stays in frame from wherever they look.
    if (this.controls?.update()) {
      busy = true;
      if (this.userMoved && !this.camTween) {
        const { target, theta, phi } = this.currentPose();
        this.place({ target, theta, phi, radius: this.fit(theta, phi, target) });
      }
    }

    this.cutaway();
    this.renderer.render(this.scene, this.camera);
    this.reportHeading();
    if (busy) this.invalidate();
  };

  /** Hide whatever the camera stands behind, the way a section removes it. */
  private cutaway() {
    const left = this.sees("left");
    const right = this.sees("right");
    const ceiling = this.sees("ceiling");
    this.leftWall.visible = this.layers.left.visible = left;
    if (this.leftStub) this.leftStub.visible = !left;
    this.rightWall.visible = this.layers.right.visible = right;
    if (this.rightStub) this.rightStub.visible = !right;
    this.overhead.visible = this.layers.ceiling.visible = ceiling;
  }

  /** False when the camera stands behind a surface, so it is cut away. */
  private sees(surface: Face) {
    const p = this.camera.position;
    const { width: W, height: H } = this.dims;
    if (surface === "left") return p.x > -W / 2 - WALL / 2;
    if (surface === "right") return p.x < W / 2 + WALL / 2;
    if (surface === "ceiling") return p.y < H + SLAB / 2;
    return true;
  }

  private reportHeading() {
    if (!this.opts.onHeading || !this.controls) return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const theta = Math.atan2(offset.x, offset.z);
    if (Math.abs(theta - this.lastHeading) < 0.01) return;
    this.lastHeading = theta;
    this.opts.onHeading(theta);
  }

  /* --------------------------------------------------------- camera -- */

  private target(): THREE.Vector3 {
    return this.controls?.target ?? (this.camera.userData.target as THREE.Vector3) ?? new THREE.Vector3();
  }

  /** Put the camera at a pose. `radius` is the framing distance; zoom scales it. */
  private place({ target, theta, phi, radius }: Pose) {
    this.target().copy(target);
    this.camera.position.copy(target).add(new THREE.Vector3().setFromSphericalCoords(radius * this.zoom, phi, theta));
    this.camera.lookAt(target);
    if (!this.controls) {
      this.camera.userData.target = target.clone();
      if (this.opts.onHeading && Math.abs(theta - this.lastHeading) >= 0.01) {
        this.lastHeading = theta;
        this.opts.onHeading(theta);
      }
    }
  }

  private currentPose(): Pose {
    const target = this.target().clone();
    const s = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(target));
    return { target, theta: s.theta, phi: s.phi, radius: s.radius / this.zoom };
  }

  private zoomTo(goal: number) {
    this.zoomGoal = THREE.MathUtils.clamp(goal, ZOOM.min, ZOOM.max);
    this.camTween = null;
    this.invalidate();
  }

  /**
   * One step of zoom. Closing in, the view drifts toward the anchor so the
   * point under the cursor stays put; pulling back, it drifts home, so at
   * full width the room is centred again.
   */
  private stepZoom() {
    const z0 = this.zoom;
    const z1 = this.opts.reducedMotion || Math.abs(this.zoomGoal - z0) < 0.002 ? this.zoomGoal : z0 + (this.zoomGoal - z0) * 0.2;
    const { theta, phi } = this.currentPose();
    const target = this.target().clone();
    if (z1 < z0 && this.anchor) target.lerp(this.anchor, 1 - z1 / z0);
    else if (z1 > z0 && z0 < 1) target.lerp(this.home(), Math.min(1, (z1 - z0) / (1 - z0)));
    this.zoom = z1;
    this.place({ target, theta, phi, radius: this.fit(theta, phi, target) });
  }

  /** The point a view looks at. */
  private home(view = this.view) {
    return view === "overhead" ? new THREE.Vector3(0, 0.2, 0) : new THREE.Vector3(0, this.dims.height * 0.46, 0);
  }

  /** The visible point under a canvas position, for zooming toward it. */
  private pointAt(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    for (const hit of this.raycaster.intersectObjects(this.scene.children, true)) if (isShown(hit.object)) return hit;
    return null;
  }

  /** The preset for a view, framed to fit this room on this screen. */
  private pose(view: View): Pose {
    const { height: H } = this.dims;
    if (view === "overhead") {
      const target = this.home("overhead");
      const theta = 0.42;
      const phi = 0.66;
      return { target, theta, phi, radius: this.fit(theta, phi, target) };
    }
    // Eye level and corner views keep the camera under the ceiling, so it
    // stays in shot: solve for the angle that puts the eye at that height.
    const target = this.home(view);
    const theta = view === "eye" ? 0 : 0.74 * this.cornerSide;
    const eye = view === "eye" ? H * 0.58 : H * 0.88;
    let phi = 1.45;
    let radius = this.fit(theta, phi, target);
    for (let i = 0; i < 4; i++) {
      phi = Math.acos(THREE.MathUtils.clamp((eye - target.y) / radius, -0.3, 0.95));
      radius = this.fit(theta, phi, target);
    }
    return { target, theta, phi, radius };
  }

  /** Keep the room framed after a resize: the preset, or the visitor's own angle. */
  private reframe() {
    this.camTween = null;
    if (!this.userMoved) return this.place(this.pose(this.view));
    const { theta, phi } = this.currentPose();
    const target = this.zoom < 1 ? this.target().clone() : this.home();
    this.place({ target, theta, phi, radius: this.fit(theta, phi, target) });
  }

  /** Smallest distance at which every corner of the room lands inside FRAME. */
  private fit(theta: number, phi: number, target: THREE.Vector3) {
    const { width: W, depth: D, height: H } = this.dims;
    const cam = this.probe;
    cam.aspect = this.camera.aspect;
    cam.updateProjectionMatrix();
    const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
    const corners: THREE.Vector3[] = [];
    for (const x of [-W / 2 - WALL, W / 2 + WALL])
      for (const y of [-0.06, H + SLAB])
        for (const z of [-D / 2 - WALL, D / 2]) corners.push(new THREE.Vector3(x, y, z));

    const v = new THREE.Vector3();
    const fits = () =>
      corners.every((c) => {
        v.copy(c).project(cam);
        return v.z < 1 && Math.abs(v.x) <= FRAME.x && v.y <= FRAME.top && v.y >= this.frameBottom;
      });

    let lo = 0.5;
    let hi = 90;
    for (let i = 0; i < 24; i++) {
      const r = (lo + hi) / 2;
      cam.position.copy(target).addScaledVector(dir, r);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      if (fits()) hi = r;
      else lo = r;
    }
    return hi;
  }

  /* -------------------------------------------------------- picking -- */

  private pointerPicking(canvas: HTMLCanvasElement) {
    let down: { x: number; y: number } | null = null;
    let hover = 0;
    let last: PointerEvent | null = null;

    const surfaceAt = (e: PointerEvent): Face | null =>
      (this.pointAt(canvas, e.clientX, e.clientY)?.object.userData.surface as Face | undefined) ?? null;

    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return void (down = null);
      down = null;
      const s = surfaceAt(e);
      if (s) this.opts.onPick?.(surfaceOf(s));
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (down || hover) return;
      hover = requestAnimationFrame(() => {
        hover = 0;
        if (!last || down) return;
        const s = surfaceAt(last);
        canvas.style.cursor = s ? "pointer" : "grab";
        const r = canvas.getBoundingClientRect();
        this.opts.onHover?.(s && surfaceOf(s), last.clientX - r.left, last.clientY - r.top);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(hover);
      hover = 0;
      this.opts.onHover?.(null, 0, 0);
    };
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    this.cleanup.push(() => {
      cancelAnimationFrame(hover);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    });
  }

  /**
   * Ctrl + wheel zooms toward the cursor; a trackpad pinch arrives as exactly
   * that. A plain wheel is left to scroll the page.
   */
  private wheelZoom(canvas: HTMLCanvasElement) {
    let hinted = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        if (performance.now() - hinted > 2500) {
          hinted = performance.now();
          this.opts.onZoomHint?.();
        }
        return;
      }
      e.preventDefault();
      // Lenis (smooth scroll) skips events marked like this.
      (e as WheelEvent & { lenisStopPropagation?: boolean }).lenisStopPropagation = true;
      const step = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      this.anchor = this.pointAt(canvas, e.clientX, e.clientY)?.point ?? null;
      this.zoomTo(this.zoomGoal * Math.exp(THREE.MathUtils.clamp(step, -60, 60) * 0.006));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    this.cleanup.push(() => canvas.removeEventListener("wheel", onWheel));
  }

  /**
   * On touch screens: a sideways swipe turns the room, a pinch zooms. Vertical
   * swipes stay with the page (touch-action: pan-y), so it still scrolls.
   */
  private touchGestures(canvas: HTMLCanvasElement) {
    canvas.style.touchAction = "pan-y";
    const pts = new Map<number, { x: number; y: number }>();
    let pinch: { d: number; zoom: number } | null = null;
    let tap: { x: number; y: number; t: number } | null = null;

    const spread = () => {
      const [a, b] = [...pts.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      tap = pts.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        this.anchor = this.pointAt(canvas, (a.x + b.x) / 2, (a.y + b.y) / 2)?.point ?? null;
        pinch = { d: spread(), zoom: this.zoomGoal };
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = pts.get(e.pointerId);
      if (!prev) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size === 2) {
        this.zoomTo(pinch.zoom * (pinch.d / Math.max(1, spread())));
      } else if (pts.size === 1) {
        const dx = e.clientX - prev.x;
        if (Math.abs(dx) < 0.5) return;
        const pose = this.currentPose();
        const theta = THREE.MathUtils.clamp(pose.theta - dx * 0.008, -1.25, 1.25);
        this.userMoved = true;
        this.camTween = null;
        this.place({ ...pose, theta, radius: this.fit(theta, pose.phi, pose.target) });
        this.invalidate();
      }
    };
    const onUp = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      // A quick tap that didn't move picks the surface under it.
      if (e.type === "pointerup" && tap && performance.now() - tap.t < 350 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 8) {
        const s = this.pointAt(canvas, e.clientX, e.clientY)?.object.userData.surface as Face | undefined;
        if (s) this.opts.onPick?.(surfaceOf(s));
      }
      tap = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    this.cleanup.push(() => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    });
  }

  /* ------------------------------------------------------- finishes -- */

  private finishMaterial(material: Material) {
    const tex = finishTextures(material, this.renderer.capabilities.getMaxAnisotropy());
    const look = SURFACE_FINISH[material.surface];
    const map = tex.map.clone();
    map.needsUpdate = true;
    const normalMap = tex.normalMap && look.normalScale > 0 ? tex.normalMap.clone() : null;
    if (normalMap) normalMap.needsUpdate = true;
    const params = {
      map,
      normalMap,
      normalScale: new THREE.Vector2(look.normalScale, look.normalScale),
      roughness: look.roughness,
      clippingPlanes: [this.keepAll()],
    };
    const m = look.clearcoat
      ? new THREE.MeshPhysicalMaterial({ ...params, clearcoat: look.clearcoat, clearcoatRoughness: 0.06 })
      : new THREE.MeshStandardMaterial(params);
    m.userData.tile = TILE_M[material.surface];
    return m;
  }

  /** What a surface shows when it is left as it is. */
  private fallback(surface: Face) {
    return surface === "floor" ? this.mats.screed : surface === "ceiling" ? this.mats.ceiling : this.mats.plaster;
  }

  /** Unit vector from a surface into the room. */
  private inward(surface: Face) {
    const v = { wall: [0, 0, 1], left: [1, 0, 0], right: [-1, 0, 0], floor: [0, 1, 0], ceiling: [0, -1, 0] }[surface];
    return new THREE.Vector3(v[0], v[1], v[2]);
  }

  /** Size and place a surface's finish plane, and set its texture to true scale. */
  private layoutFinish(surface: Face) {
    const { width: W, depth: D, height: H } = this.dims;
    const mesh = this.finish[surface];
    const key = `${W}|${D}|${H}`;
    if (mesh.userData.key !== key) {
      mesh.geometry.dispose();
      mesh.geometry = this.finishGeometry(surface);
      mesh.userData.key = key;
    }
    const at = {
      wall: [0, H / 2, -D / 2 + EPS, 0, 0],
      left: [-W / 2 + EPS, 0, 0, 0, Math.PI / 2],
      right: [W / 2 - EPS, H / 2, 0, 0, -Math.PI / 2],
      floor: [0, EPS, 0, -Math.PI / 2, 0],
      ceiling: [0, H - EPS, 0, Math.PI / 2, 0],
    }[surface];
    mesh.position.set(at[0], at[1], at[2]);
    mesh.rotation.set(at[3], at[4], 0);
    this.tileTo(mesh.material as THREE.MeshStandardMaterial);
  }

  /**
   * A surface's finish geometry, with UVs in metres so a texture repeats once
   * per real-world tile. The window wall is drawn from its elevation, with
   * the opening cut out.
   */
  private finishGeometry(surface: Face): THREE.BufferGeometry {
    const { width: W, depth: D, height: H } = this.dims;
    if (surface === "left") {
      // Shape x runs along -z once turned to face into the room.
      const win = windowIn(this.dims);
      const z0 = -D / 2 + win.centre;
      const shape = new THREE.Shape().moveTo(-D / 2, 0).lineTo(D / 2, 0).lineTo(D / 2, H).lineTo(-D / 2, H).closePath();
      shape.holes.push(
        new THREE.Path()
          .moveTo(-z0 - win.width / 2, win.sill)
          .lineTo(-z0 + win.width / 2, win.sill)
          .lineTo(-z0 + win.width / 2, win.head)
          .lineTo(-z0 - win.width / 2, win.head)
          .closePath(),
      );
      return new THREE.ShapeGeometry(shape);
    }
    const [w, h] = surface === "wall" ? [W, H] : surface === "right" ? [D, H] : [W, D];
    const geo = new THREE.PlaneGeometry(w, h);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * h);
    return geo;
  }

  private tileTo(m: THREE.MeshStandardMaterial) {
    const tile = m.userData.tile as [number, number] | undefined;
    if (!tile) return;
    for (const t of [m.map, m.normalMap]) t?.repeat.set(1 / tile[0], 1 / tile[1]);
  }

  private stepWipe(surface: Face, t: number) {
    const wipe = this.wipes[surface];
    if (!wipe) return;
    const { depth: D, height: H } = this.dims;
    if (WALLS.has(surface)) wipe.plane.set(new THREE.Vector3(0, 1, 0), -(H + 0.01) * (1 - t));
    else wipe.plane.set(new THREE.Vector3(0, 0, -1), -D / 2 - 0.01 + t * (D + 0.02));
  }

  /** Finish a wipe now: the new finish takes the plane's place. */
  private settleWipe(surface: Face) {
    const wipe = this.wipes[surface];
    if (!wipe) return;
    delete this.wipes[surface];
    const next = wipe.overlay.material as THREE.MeshStandardMaterial;
    next.clippingPlanes = [this.keepAll()];
    this.layers[surface].remove(wipe.overlay);
    this.swap(this.finish[surface], next);
  }

  private swap(mesh: THREE.Mesh, next: THREE.Material) {
    const prev = mesh.material as THREE.Material;
    mesh.material = next;
    if (prev !== next) this.release(prev);
    this.tileTo(next as THREE.MeshStandardMaterial);
  }

  /** Dispose a finish material and its textures; shared materials stay. */
  private release(m: THREE.Material) {
    if (Object.values(this.mats).includes(m as never)) return;
    const s = m as THREE.MeshStandardMaterial;
    s.map?.dispose();
    s.normalMap?.dispose();
    m.dispose();
  }

  /* -------------------------------------------------------- lighting -- */

  private applyLighting(l: Lighting) {
    this.sun.intensity = l.sun;
    this.sun.color.copy(l.sunColor);
    this.scene.environmentIntensity = l.env;
    this.hemi.intensity = l.hemi;
    this.cove.intensity = l.cove;
    this.lamp.intensity = l.lamp;
    this.bounce.intensity = l.bounce;
    this.mats.bulb.emissiveIntensity = 0.4 + l.lamp * 0.5;
    this.mats.daySky.opacity = l.sky;
    this.renderer.toneMappingExposure = l.exposure;
  }

  /* --------------------------------------------------------- the room -- */

  private own<T extends { dispose(): void }>(thing: T) {
    this.owned.add(thing);
    return thing;
  }

  /** Rebuild the shell, window and furniture for the current dimensions. */
  private build() {
    for (const s of ALL) this.settleWipe(s);
    this.shell.traverse((o) => o instanceof THREE.Mesh && o.geometry.dispose());
    this.shell.clear();
    this.leftWall = new THREE.Group();
    this.rightWall = new THREE.Group();
    this.overhead = new THREE.Group();

    const { width: W, depth: D, height: H } = this.dims;
    const m = this.mats;
    const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.shell) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Floor slab on a dark plinth, like a model on its base. Its top is y = 0.
    box(W + 2 * WALL, SLAB, D + WALL, m.plaster, 0, -SLAB / 2, -WALL / 2).userData.surface = "floor";
    box(W + 2 * WALL + 0.5, 0.06, D + WALL + 0.5, m.base, 0, -SLAB - 0.03, -WALL / 2).castShadow = false;

    // Feature wall body. Its inside face carries the wall finish.
    box(W + 2 * WALL, H, WALL, m.plaster, 0, H / 2, -D / 2 - WALL / 2).userData.surface = "wall";

    // Right wall, and the low stub of it left when it's cut away.
    box(WALL, H, D + WALL, m.plaster, W / 2 + WALL / 2, H / 2, -WALL / 2, this.rightWall).userData.surface = "right";
    this.shell.add(this.rightWall);
    this.rightStub = box(WALL, 0.1, D + WALL, m.plaster, W / 2 + WALL / 2, 0.05, -WALL / 2);

    // Left wall, extruded from its elevation with the window cut through it.
    const win = windowIn(this.dims);
    const z0 = -D / 2 + win.centre;
    const shape = new THREE.Shape()
      .moveTo(-D / 2 - WALL, 0)
      .lineTo(D / 2, 0)
      .lineTo(D / 2, H)
      .lineTo(-D / 2 - WALL, H)
      .closePath();
    shape.holes.push(
      new THREE.Path()
        .moveTo(z0 - win.width / 2, win.sill)
        .lineTo(z0 - win.width / 2, win.head)
        .lineTo(z0 + win.width / 2, win.head)
        .lineTo(z0 + win.width / 2, win.sill)
        .closePath(),
    );
    const leftMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: WALL, bevelEnabled: false }), m.plaster);
    // Extruded along +z, then turned so the shape's x runs along the room's depth.
    leftMesh.rotation.y = -Math.PI / 2;
    leftMesh.position.x = -W / 2;
    leftMesh.castShadow = leftMesh.receiveShadow = true;
    leftMesh.userData.surface = "left";
    this.leftWall.add(leftMesh);
    this.leftStub = box(WALL, 0.1, D + WALL, m.plaster, -W / 2 - WALL / 2, 0.05, -WALL / 2);
    this.windowParts(W, z0, win);
    this.shell.add(this.leftWall);

    // Ceiling slab, the pendant hanging from it, and the cove light: all go
    // when the camera rises above the ceiling to look down into the room.
    box(W + 2 * WALL, SLAB, D + WALL, m.plaster, 0, H + SLAB / 2, -WALL / 2, this.overhead).userData.surface = "ceiling";
    this.shell.add(this.overhead);

    this.occlusion(W, D, H);
    this.furniture(W, D, H);

    // Sun from beyond the window, low enough to throw its shape across the floor.
    // It comes from slightly behind, so none falls in through the open side.
    this.sun.position.set(-W / 2 - 6, H + 3.4, z0 - 1.4);
    this.sun.target.position.set(0, 0, z0 + 0.6);
    const reach = Math.max(W, D) / 2 + H + 1.5;
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -reach;
    sc.right = sc.top = reach;
    sc.near = 0.5;
    sc.far = 30;
    sc.updateProjectionMatrix();

    // Light the floor throws back up, filling the ceiling the way it does in a
    // real room, in the floor's own colour.
    this.bounce.width = W * 0.85;
    this.bounce.height = D * 0.85;
    this.bounce.position.set(0, 0.05, 0);
    this.bounce.lookAt(0, H, 0);

    // A linear LED cove just off the feature wall, washing down it.
    this.cove.width = W * 0.94;
    this.cove.height = 0.05;
    this.cove.position.set(0, H - 0.04, -D / 2 + 0.16);
    this.cove.lookAt(0, 0, -D / 2 + 0.02);

    for (const s of ["wall", "ceiling", "floor"] as const) this.layoutFinish(s);
  }

  private windowParts(W: number, z0: number, win: ReturnType<typeof windowIn>) {
    const m = this.mats;
    const x = -W / 2 - WALL / 2;
    const h = win.head - win.sill;
    const yc = (win.sill + win.head) / 2;
    const bar = (sy: number, sz: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, sy, sz), m.frame);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      this.leftWall.add(mesh);
    };
    const f = 0.05;
    bar(f, win.width, win.head - f / 2, z0);
    bar(f, win.width, win.sill + f / 2, z0);
    bar(h, f, yc, z0 - win.width / 2 + f / 2);
    bar(h, f, yc, z0 + win.width / 2 - f / 2);
    bar(h, f * 0.7, yc, z0); // mullion

    const glass = new THREE.Mesh(new THREE.PlaneGeometry(win.width, h), m.glass);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(x, yc, z0);
    glass.raycast = () => {};
    this.leftWall.add(glass);

    // Inner sill, proud of the wall.
    const sill = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, win.width + 0.12), m.frame);
    sill.position.set(-W / 2 + 0.02, win.sill - 0.015, z0);
    sill.castShadow = sill.receiveShadow = true;
    this.leftWall.add(sill);

    // The view: Benguet pines, a dusk sky under a daylit one that fades out.
    // Set in the outer face of the opening, so the reveal frames it and it
    // can never show past the wall, from any angle.
    const sky = (mat: THREE.Material, inset: number) => {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(win.width, h), mat);
      plane.rotation.y = Math.PI / 2;
      plane.position.set(-W / 2 - WALL + 0.004 + inset, yc, z0);
      plane.raycast = () => {};
      this.leftWall.add(plane);
    };
    sky(m.duskSky, 0);
    sky(m.daySky, 0.002);
  }

  /**
   * Soft darkening where surfaces meet, standing in for the ambient occlusion
   * a path tracer would give: light reaches into a corner less than onto a
   * open face. Each strip fades from dark at the junction to clear.
   */
  private occlusion(W: number, D: number, H: number) {
    const strip = (len: number, mid: THREE.Vector3, inward: THREE.Vector3, normal: THREE.Vector3, parent: THREE.Object3D, width = 0.45) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, width), this.mats.ao);
      const x = inward.clone().cross(normal);
      mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, inward, normal));
      mesh.position.copy(mid).addScaledVector(inward, width / 2).addScaledVector(normal, 0.008);
      mesh.raycast = () => {};
      mesh.renderOrder = 1;
      parent.add(mesh);
    };
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    const up = v(0, 1, 0);
    const down = v(0, -1, 0);
    const fwd = v(0, 0, 1);
    const east = v(1, 0, 0);
    const west = v(-1, 0, 0);

    // Floor along the three walls.
    strip(W, v(0, 0, -D / 2), fwd, up, this.shell);
    strip(D, v(-W / 2, 0, 0), east, up, this.leftWall);
    strip(D, v(W / 2, 0, 0), west, up, this.rightWall);
    // Ceiling along the three walls.
    strip(W, v(0, H, -D / 2), fwd, down, this.overhead);
    strip(D, v(-W / 2, H, 0), east, down, this.overhead);
    strip(D, v(W / 2, H, 0), west, down, this.overhead);
    // Feature wall: both corners, the skirting line and the ceiling line.
    strip(H, v(-W / 2, H / 2, -D / 2), east, fwd, this.shell, 0.35);
    strip(H, v(W / 2, H / 2, -D / 2), west, fwd, this.shell, 0.35);
    strip(W, v(0, 0, -D / 2), up, fwd, this.shell, 0.3);
    strip(W, v(0, H, -D / 2), down, fwd, this.shell, 0.3);
    // Side walls: the corner with the feature wall, floor and ceiling lines.
    strip(H, v(-W / 2, H / 2, -D / 2), fwd, east, this.leftWall, 0.35);
    strip(D, v(-W / 2, 0, 0), up, east, this.leftWall, 0.3);
    strip(D, v(-W / 2, H, 0), down, east, this.leftWall, 0.3);
    strip(H, v(W / 2, H / 2, -D / 2), fwd, west, this.rightWall, 0.35);
    strip(D, v(W / 2, 0, 0), up, west, this.rightWall, 0.3);
    strip(D, v(W / 2, H, 0), down, west, this.rightWall, 0.3);
  }

  private furniture(W: number, D: number, H: number) {
    const m = this.mats;
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) - 0.001);
    const blob = (w: number, d: number, x: number, z: number, y = 0.014) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m.blob);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, z);
      mesh.raycast = () => {}; // clicks fall through to the floor beneath
      this.shell.add(mesh);
    };

    // Sofa, a hand's width off the feature wall, sized to the room.
    const sw = THREE.MathUtils.clamp(W * 0.5, 1.5, 2.4);
    const sd = 0.92;
    const sofaZ = -D / 2 + 0.12 + sd / 2;
    const sofa = new THREE.Group();
    sofa.position.set(0, 0, sofaZ);
    const arm = 0.18;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.018, 0.014, 0.1, 12), m.oak, sx * (sw / 2 - 0.08), 0.05, sz * (sd / 2 - 0.08), sofa);
    add(rbox(sw, 0.3, sd, 0.04), m.fabric, 0, 0.25, 0, sofa);
    const seatW = (sw - 2 * arm) / 2 - 0.01;
    for (const sx of [-1, 1]) add(rbox(seatW, 0.16, sd - 0.26, 0.06), m.fabric, sx * (seatW / 2 + 0.005), 0.48, 0.11, sofa);
    add(rbox(sw - 2 * arm, 0.46, 0.22, 0.08), m.fabric, 0, 0.63, -sd / 2 + 0.13, sofa).rotation.x = -0.12;
    for (const sx of [-1, 1]) add(rbox(arm, 0.52, sd, 0.07), m.fabric, sx * (sw / 2 - arm / 2), 0.36, 0, sofa);
    const pillow = add(rbox(0.42, 0.4, 0.13, 0.06), m.cushion, -sw / 4, 0.7, -sd / 2 + 0.3, sofa);
    pillow.rotation.set(-0.25, 0, 0.12);
    this.shell.add(sofa);
    blob(sw + 0.3, sd + 0.25, 0, sofaZ);

    // Rug, tucked under the sofa's front legs.
    const rw = Math.min(2.6, W - 0.8);
    const rd = THREE.MathUtils.clamp(D - 1.6, 0.8, 1.8);
    const rugZ = sofaZ + sd / 2 - 0.25 + rd / 2;
    const rug = add(rbox(rw, 0.012, rd, 0.005), m.rug, 0, 0.006, rugZ, this.shell);
    rug.castShadow = false;
    rug.userData.surface = "floor";

    // Travertine drum table, centred on the rug.
    const tr = 0.42;
    const tableZ = Math.min(rugZ, D / 2 - tr - 0.25);
    add(new THREE.CylinderGeometry(tr, tr, 0.035, 48), m.stone, 0, 0.4, tableZ, this.shell);
    add(new THREE.CylinderGeometry(tr * 0.45, tr * 0.55, 0.37, 32), m.stone, 0, 0.185, tableZ, this.shell);
    blob(tr * 2.6, tr * 2.6, 0, tableZ, 0.016);

    // A potted plant in the far corner, opposite the window.
    const potX = W / 2 - 0.35;
    const potZ = -D / 2 + 0.35;
    if (W / 2 - sw / 2 > 0.55) {
      add(new THREE.CylinderGeometry(0.17, 0.13, 0.42, 28), m.clay, potX, 0.21, potZ, this.shell);
      const leafGeo = new THREE.SphereGeometry(1, 12, 8);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const tall = 0.5 + (i % 3) * 0.16;
        const leaf = new THREE.Mesh(leafGeo, m.leaf);
        leaf.scale.set(0.07, tall / 2, 0.2);
        leaf.position.set(potX + Math.sin(a) * 0.12, 0.42 + tall / 2, potZ + Math.cos(a) * 0.12);
        leaf.rotation.set(Math.cos(a) * 0.4, a, -Math.sin(a) * 0.4);
        leaf.castShadow = leaf.receiveShadow = true;
        this.shell.add(leaf);
      }
      blob(0.7, 0.7, potX, potZ);
    }

    // Pendant over the table, hung so it clears a standing head.
    const shadeY = Math.max(1.95, H - 0.85);
    const pendant = new THREE.Group();
    pendant.position.set(0, 0, tableZ);
    add(new THREE.CylinderGeometry(0.004, 0.004, H - shadeY, 6), m.metal, 0, (H + shadeY) / 2, 0, pendant).castShadow = false;
    const shade = add(new THREE.CylinderGeometry(0.035, 0.24, 0.2, 40, 1, true), m.metal, 0, shadeY - 0.1, 0, pendant);
    shade.castShadow = false;
    add(new THREE.SphereGeometry(0.055, 20, 12), m.bulb, 0, shadeY - 0.16, 0, pendant).castShadow = false;
    // The shade throws its light down in a soft pool, not up at the ceiling.
    this.lamp.position.set(0, shadeY - 0.12, 0);
    this.lamp.target.position.set(0, 0, 0);
    pendant.add(this.lamp, this.lamp.target);
    this.overhead.add(pendant);
  }
}

function createMaterials(own: <T extends { dispose(): void }>(thing: T) => T) {
  const std = (color: string, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  return {
    plaster: std("#ddd3c5", 0.92),
    ceiling: std("#ece6dc", 0.9),
    screed: std("#8b8177", 0.82),
    base: std("#211a16", 0.75),
    fabric: new THREE.MeshPhysicalMaterial({ color: "#5a6350", roughness: 0.95, sheen: 1, sheenColor: new THREE.Color("#cdd5bd"), sheenRoughness: 0.55 }),
    cushion: new THREE.MeshPhysicalMaterial({ color: "#c47a4b", roughness: 0.92, sheen: 0.8, sheenColor: new THREE.Color("#f0c39e"), sheenRoughness: 0.5 }),
    oak: std("#8a5d3b", 0.55),
    stone: std("#d9ccb6", 0.48),
    rug: std("#d6c8b2", 1),
    metal: std("#1d1916", 0.38, { metalness: 0.7, side: THREE.DoubleSide }),
    bulb: std("#fff3dd", 0.3, { emissive: new THREE.Color("#ffcf8f"), emissiveIntensity: 0.4 }),
    frame: std("#efe9df", 0.5),
    glass: new THREE.MeshPhysicalMaterial({ color: "#d9ebef", roughness: 0.04, transparent: true, opacity: 0.12, depthWrite: false }),
    clay: std("#b56a4a", 0.85),
    leaf: std("#46603d", 0.62, { side: THREE.DoubleSide }),
    blob: new THREE.MeshBasicMaterial({ map: own(blobTexture()), transparent: true, depthWrite: false, toneMapped: false }),
    ao: new THREE.MeshBasicMaterial({ map: own(aoTexture()), transparent: true, depthWrite: false, toneMapped: false }),
    duskSky: new THREE.MeshBasicMaterial({ map: own(skyTexture("evening")), toneMapped: false }),
    daySky: new THREE.MeshBasicMaterial({ map: own(skyTexture("day")), transparent: true, toneMapped: false }),
  };
}

type Mats = ReturnType<typeof createMaterials>;

/** True when an object and every parent above it are visible. */
function isShown(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/** A soft contact shadow, for where furniture meets the floor. */
function blobTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A fade from shadow to clear, for the corner strips: dark along its bottom edge. */
function aoTexture() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 64, 0, 0);
  g.addColorStop(0, "rgba(0,0,0,0.34)");
  g.addColorStop(0.35, "rgba(0,0,0,0.12)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The view from the window: a ridge of Benguet pines under a day or dusk sky. */
function skyTexture(mood: Mood) {
  const w = 768;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const day = mood === "day";
  const g = ctx.createLinearGradient(0, 0, 0, h);
  if (day) {
    g.addColorStop(0, "#a9c8dc");
    g.addColorStop(0.55, "#dfe9ea");
    g.addColorStop(1, "#f2ede3");
  } else {
    g.addColorStop(0, "#5d4a63");
    g.addColorStop(0.45, "#e69a63");
    g.addColorStop(1, "#f6c98e");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const ridge = (base: number, amp: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, base + Math.sin(x / 90 + base) * amp + Math.sin(x / 31) * amp * 0.3);
    ctx.lineTo(w, h);
    ctx.fill();
  };
  const pines = (count: number, base: number, size: number, color: string) => {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const x = rand() * w;
      const tall = size * (0.7 + rand() * 0.6);
      const y = base + rand() * 30;
      ctx.fillRect(x - 1.5, y - tall * 0.2, 3, tall * 0.25);
      // Benguet pines are slender, with irregular tiers of foliage.
      for (let t = 0; t < 5; t++) {
        const ty = y - tall * 0.15 - t * tall * 0.17;
        const half = tall * (0.2 - t * 0.032) * (0.8 + rand() * 0.4);
        ctx.beginPath();
        ctx.moveTo(x - half, ty);
        ctx.lineTo(x + half, ty);
        ctx.lineTo(x, ty - tall * 0.26);
        ctx.fill();
      }
    }
  };

  ridge(h * 0.5, 22, day ? "#a9b6b0" : "#b9765a");
  pines(26, h * 0.56, 90, day ? "#7d8f86" : "#8a4f3d");
  ridge(h * 0.68, 18, day ? "#5f7366" : "#5a3428");
  pines(16, h * 0.78, 230, day ? "#2f3f35" : "#2a1b16");
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
