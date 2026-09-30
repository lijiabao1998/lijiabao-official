// src/gl/types.ts — GL engine contracts (spec §9.3, frozen).
//
// Everything in the frozen block below is verbatim §9.3. Members marked `F0+` are additive: optional hooks a
// scene MAY implement, or extra fields the engine ALWAYS provides. Code written against the frozen shapes
// compiles unchanged.
//
// Coordinate space for scenes: the engine sets gl.viewport to the anchor's rect, so a scene works in
// ANCHOR-LOCAL CSS px (0..rect.width, 0..rect.height, y down) and maps to clip space with
//   gl_Position = vec4((p / uView * 2. - 1.) * vec2(1, -1), 0, 1)   // uView = f.view
// Pointer, pulse and holes in `Frame` are already anchor-local. `f.t` / `f.dt` are seconds.

/* ------------------------------------------------------------------ frozen (§9.3) */

export type Tier = 'full' | 'lite' | 'static';
export type SceneId = 'field' | 'portrait' | 'grid';

export interface RecordRef {
  index: number;
  lane?: number;
  label: string;
  href?: string;
}

export interface GlimmerEngine {
  readonly tier: Tier;
  /** false → no usable WebGL2 (the runtime then goes static). */
  readonly ready: Promise<boolean>;
  /** Once; survives ClientRouter (the canvas is persisted). Calling again with the same canvas is a no-op. */
  mount(canvas: HTMLCanvasElement): void;
  register(def: SceneDef<any>): void;
  attachAll(root: ParentNode): void;
  detachAll(): void;
  get(id: SceneId): SceneHandle | null;
  /** Viewport CSS px. Adds brightness to records only; no-op under reduced motion. */
  pulse(x: number, y: number, strength?: number): void;
  setTier(t: Tier, src: 'user' | 'auto'): Promise<void>;
  /** Glimmers drawn now (HUD): sum of `count` over visible, created scenes. */
  count(): number;
  on(e: EngineEvent, cb: (d?: unknown) => void): () => void;
  destroy(): void;

  /** F0+ — mark anchor rects dirty (the runtime calls it from Lenis' scroll event). */
  invalidate?(): void;
  /** F0+ — prefers-reduced-motion changed at runtime. */
  setReduced?(reduced: boolean): void;
  /** F0+ — current runtime state (mirrors html[data-gl]; 'off' after destroy). */
  readonly state?: GlState | 'off';
}

export interface SceneHandle {
  /** uScan, uScroll, uAssemble, uProgress… Buffered until the scene exists; marks the scene dirty. */
  set(uniform: string, v: number | number[]): void;
  /** Replace the auto-collected [data-gl-hole] elements for this scene (max 8). */
  holes(els: Element[]): void;
  /** Anchor-local CSS px (DATA scenes). */
  pick?(x: number, y: number): RecordRef | null;
  step?(dir: StepDir): RecordRef | null;
  /** Records per glimmer (always 1 in v1). */
  readonly k: number;
  readonly count: number;
}

export interface SceneDef<D> {
  id: SceneId;
  kind: 'DATA' | 'PORTRAIT';
  /** `src` = the anchor's data-gl-src (the gl-manifest key). Result is cached CPU-side and reused on restore. */
  load(src: string, tier: Tier): Promise<D>;
  create(gl: WebGL2RenderingContext, data: D, tier: Tier): unknown;
  /** Return true while still animating (ignored under reduced motion / frozen: those draw on change only). */
  draw(gl: WebGL2RenderingContext, state: unknown, f: Frame): boolean;
  /** Called when the anchor's size changes (not on scroll). */
  resize(state: unknown, rect: DOMRectReadOnly): void;
  /** Free buffers/VAOs. Do NOT delete programs from core/program.ts: they are cached per context. */
  destroy(gl: WebGL2RenderingContext, state: unknown): void;

  /** F0+ — called for every SceneHandle.set (also replayed once after create). Values are also in f.params. */
  set?(state: unknown, name: string, v: number | number[]): void;
  /** F0+ — backs SceneHandle.pick. */
  pick?(state: unknown, x: number, y: number): RecordRef | null;
  /** F0+ — backs SceneHandle.step. */
  step?(state: unknown, dir: StepDir): RecordRef | null;
  /** F0+ — records drawn by this scene in its current tier (HUD + SceneHandle.count). Fallback: state.count. */
  count?(state: unknown): number;
}

export interface Frame {
  t: number;
  dt: number;
  /** Anchor rect, viewport CSS px. Reused object: never retain it. */
  rect: DOMRectReadOnly;
  /** Device px per CSS px actually used for the backing store (tier/guard capped). */
  dpr: number;
  /** Anchor-local CSS px, smoothed on CPU; z = active 0..1 (0 on coarse pointers / reduced motion). */
  pointer: [number, number, number];
  /** Anchor-local x, y; t0 (same clock as t); strength (0 = none). */
  pulse: [number, number, number, number];
  reduced: boolean;

  /** F0+ — anchor size in CSS px (= rect.width, rect.height): the `uView` uniform. */
  view: [number, number];
  /** F0+ — every value given to SceneHandle.set for this anchor. */
  params: Readonly<Record<string, number | number[]>>;
  /** F0+ — up to 8 vec4 (x, y, w, h) anchor-local CSS px, already padded by 12px: the `uHoles` uniform. */
  holes: Float32Array;
  /** F0+ — the `uHoleCount` uniform. */
  holeCount: number;
  /** F0+ — the engine tier. */
  tier: Tier;
  /** F0+ — 1 in full, 0 in lite or after the guard turned the halo off: the `uHalo` uniform. */
  halo: number;
  /** F0+ — 1, or 0.5 after the guard halved PORTRAIT density (draw a prefix). DATA scenes ignore it. */
  density: number;
  /** F0+ — --fg and --glim as linear 0..1 RGB (read once from CSS): `uFg`, `uGlim`. */
  fg: readonly [number, number, number];
  glim: readonly [number, number, number];
}

/* ------------------------------------------------------------------ F0+ additive types */

export type StepDir = 'prev' | 'next' | 'up' | 'down' | 'home' | 'end';
export type EngineEvent = 'tier' | 'lost' | 'restored' | 'frozen' | 'ready';
/** html[data-gl] values. Absent attribute = engine not running (static tier / no JS). */
export type GlState = 'ok' | 'lost' | 'none' | 'frozen';

/** A frame scheduler. The runtime passes gsap.ticker (one clock, §5.1); tests and the fallback use rAF. */
export interface Clock {
  add(fn: () => void): void;
  remove(fn: () => void): void;
}

export interface EngineOptions {
  tier: Tier;
  reduced: boolean;
  /** Defaults to a private rAF clock. */
  clock?: Clock;
}

/** Shape of src/gl/scenes/<id>.ts: `export default def` (or `export const scene = def`). */
export interface SceneModule {
  default?: SceneDef<any>;
  scene?: SceneDef<any>;
}
