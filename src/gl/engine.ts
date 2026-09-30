// src/gl/engine.ts — the hand-rolled WebGL2 engine (§6.0). One fixed canvas#gl (persisted across ClientRouter),
// scenes registered by id and drawn only inside their [data-gl-scene] anchor rects (viewport + scissor).
//
// Frame policy: the loop runs only while something needs it (a visible scene animates, a scroll/resize just
// happened, the pointer eases, a pulse rings, programs compile, the probe samples). Lite idles at 30 fps once
// settled; reduced motion / frozen draw on change only. No allocation per frame on our side; the only layout
// reads are rects.ts' batch (visible anchors + their holes) on frames where layout may have moved.
//
// Scene defs resolve from engine.register(def) or lazily from src/gl/scenes/<id>.ts (default export).
// Data is loaded when the anchor is ≤ 1 viewport away and kept CPU-side (reused on tier switch, revisit, restore).
//
// DOM written: html[data-gl] = ok | lost | none | frozen (removed on destroy unless none/lost);
// anchor[data-gl-live] once its first frame is drawn; anchor[data-gl-failed] (+ its figure's .poster shown)
// when its scene cannot load. Events: 'lj:gl' {state, count}; 'lj:tier' count-only updates for the HUD.

import { emit } from '../lib/events';
import { afterLoadIdle, listen, MQ, mq, type Cleanup } from '../lib/dom';
import { getTier, lockStatic, markProbe, setTier as setPrefTier } from '../lib/prefs';
import { clearAll, createContext, initState, readPalette } from './core/context';
import { Guard, type GuardStep } from './core/guard';
import { collectHoles, MAX_HOLES } from './core/holes';
import { createLoop, rafClock } from './core/loop';
import { recordLoss, watchLoss } from './core/loss';
import { Probe, probeEligible, type Verdict } from './core/probe';
import { clearPrograms, enableParallel, onProgramError, pollPrograms } from './core/program';
import { Pulse } from './core/pulse';
import { newBox, newRect, readHoles, readRect, sizeCanvas, watchLayout } from './core/rects';
import type {
  EngineEvent,
  EngineOptions,
  Frame,
  GlimmerEngine,
  GlState,
  RecordRef,
  SceneDef,
  SceneHandle,
  SceneId,
  SceneModule,
  StepDir,
  Tier,
} from './types';

type Def = SceneDef<unknown>;
type Value = number | number[];

/** Lazy scene modules. Missing files are fine (the anchor keeps its poster). */
const SCENE_FILES = import.meta.glob<SceneModule>(['./scenes/field.ts', './scenes/portrait.ts', './scenes/grid.ts']);
const IDS: readonly string[] = ['field', 'portrait', 'grid'];
/** Pointer reach around an anchor (§5.4: within 120px). */
const REACH = 120;
/** Inconclusive upgrade-probe attempts allowed per page before it gives up for that page. */
const PROBE_TRIES = 3;

/** DPR caps (§6.0): full 1.75 desktop / 1.5 mobile; lite 1. */
function capFor(t: Tier): number {
  return t === 'full' ? (mq(MQ.mobile).matches ? 1.5 : 1.75) : 1;
}

interface Att {
  id: SceneId;
  el: HTMLElement;
  src: string;
  def: Def | null;
  data: unknown;
  state: unknown;
  /** tier the current state was created for */
  stateTier: Tier | null;
  ready: boolean;
  loading: boolean;
  failed: boolean;
  near: boolean;
  vis: boolean;
  live: boolean;
  dirty: boolean;
  anim: boolean;
  /** bumped on detach / tier switch / loss: stale async loads are dropped */
  gen: number;
  rect: DOMRect;
  w: number;
  h: number;
  holeEls: Element[];
  holes: Float32Array;
  holeCount: number;
  params: Record<string, Value>;
  /** smoothed pointer, anchor-local: x, y, active */
  ptr: Float32Array;
  count: number;
  handle: SceneHandle;
}

export function createEngine(opts: EngineOptions): GlimmerEngine {
  let tier: Tier = opts.tier === 'static' ? 'lite' : opts.tier;
  let reduced = opts.reduced;
  let state: GlState | 'off' = 'off';
  let cv: HTMLCanvasElement | null = null;
  let gl: WebGL2RenderingContext | null = null;
  let destroyed = false;
  let lost = false;
  let frozen = false;
  /** a program failed to link: this device gets no GL (the runtime goes static) */
  let broken = false;

  const defs = new Map<SceneId, Def>();
  const data = new Map<string, Promise<unknown>>();
  const atts: Att[] = [];
  const subs = new Map<EngineEvent, Set<(d?: unknown) => void>>();
  const box = newBox();
  const pulse = new Pulse();

  let t0 = performance.now();
  let lastNow = 0;
  let lastDraw = 0;
  let lastChange = 0;
  let layoutDirty = 2;
  let canvasDirty = true;
  let needClear = false;
  let programsPending = false;
  /** idle ticks left to calibrate the guard's refresh interval (run at mount, before anything draws) */
  let calib = 0;
  let dprCap = capFor(tier);
  let halo = tier === 'full' ? 1 : 0;
  let density = 1;
  let ptrX = -1e5;
  let ptrY = -1e5;
  let ptrIn = false;
  let ptrOn = false;
  let ptrMoving = false;
  let lastCount = -1;
  let lastState = '';
  let offs: Cleanup[] = [];
  let probeOff: Cleanup | null = null;
  /** inconclusive probe attempts on this page (a noisy main thread): at most PROBE_TRIES */
  let probeTries = 0;
  let visIO: IntersectionObserver | null = null;
  let nearIO: IntersectionObserver | null = null;
  let ro: ResizeObserver | null = null;

  const frame: Frame = {
    t: 0,
    dt: 0,
    rect: newRect(),
    dpr: 1,
    pointer: [0, 0, 0],
    pulse: [0, 0, -1e9, 0],
    reduced,
    view: [0, 0],
    params: {},
    holes: new Float32Array(MAX_HOLES * 4),
    holeCount: 0,
    tier,
    halo,
    density,
    fg: [1, 1, 1],
    glim: [1, 1, 1],
  };

  let resolveReady: (ok: boolean) => void = () => {};
  const ready = new Promise<boolean>((r) => (resolveReady = r));
  const loop = createLoop(opts.clock ?? rafClock(), tick);
  const guard = new Guard(applyStep);
  const probe = new Probe(onProbe);

  /* ------------------------------------------------------------------ helpers */

  function fire(e: EngineEvent, d?: unknown): void {
    const set = subs.get(e);
    if (set) for (const cb of set) cb(d);
  }

  function now(): number {
    return (performance.now() - t0) / 1000;
  }

  function anyVisible(): boolean {
    for (let i = 0; i < atts.length; i++) if ((atts[i] as Att).vis) return true;
    return false;
  }

  function wake(): void {
    if (gl && !destroyed && !lost && !broken && !document.hidden) loop.wake();
  }

  function count(): number {
    let n = 0;
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      if (a.vis && a.ready) n += a.count;
    }
    return n;
  }

  /** 'lj:gl' on state/count change, plus a count-only 'lj:tier' (no reason) the HUD reads. */
  function publish(): void {
    const n = count();
    if (n === lastCount && state === lastState) return;
    lastCount = n;
    lastState = state;
    emit('lj:gl', { state, count: n });
    const cur = getTier();
    if (cur !== 'static') emit('lj:tier', { tier: cur, src: 'auto', count: n });
  }

  function setState(s: GlState | 'off'): void {
    state = s;
    const h = document.documentElement;
    if (s !== 'off') h.dataset.gl = s;
    else if (h.dataset.gl === 'ok' || h.dataset.gl === 'frozen') delete h.dataset.gl;
    publish();
  }

  function countOf(a: Att): number {
    const def = a.def;
    if (!def || !a.ready) return 0;
    let c = 0;
    try {
      c = def.count ? def.count(a.state) : Number((a.state as { count?: unknown } | null)?.count) || 0;
    } catch {
      c = 0;
    }
    return def.kind === 'PORTRAIT' ? Math.floor(c * density) : c;
  }

  function markAll(): void {
    for (let i = 0; i < atts.length; i++) (atts[i] as Att).dirty = true;
  }

  /* ------------------------------------------------------------------ scenes */

  async function resolveDef(id: SceneId): Promise<Def | null> {
    const known = defs.get(id);
    if (known) return known;
    const load = SCENE_FILES[`./scenes/${id}.ts`];
    if (!load) return null;
    const m = await load();
    const def = (m.default ?? m.scene ?? null) as Def | null;
    if (def && !defs.has(id)) defs.set(id, def);
    return defs.get(id) ?? def;
  }

  function showPoster(a: Att): void {
    a.el.setAttribute('data-gl-failed', '');
    const fig = a.el.closest('figure') ?? a.el.parentElement;
    fig?.querySelectorAll<HTMLElement>('.poster').forEach((p) => (p.style.display = 'block'));
  }

  function fail(a: Att, err: unknown): void {
    a.failed = true;
    if (import.meta.env.DEV) console.error(`[gl] scene "${a.id}" failed`, err);
    showPoster(a);
  }

  function destroyState(a: Att): void {
    if (a.ready && gl && !lost && a.def) {
      try {
        a.def.destroy(gl, a.state);
      } catch {
        /* ignore */
      }
    }
    a.ready = false;
    a.state = null;
    a.stateTier = null;
    a.count = 0;
    if (a.live) {
      a.live = false;
      a.el.removeAttribute('data-gl-live');
    }
  }

  /** Load (cached) + create. Keeps drawing the previous state until the new one exists (tier switch). */
  async function ensure(a: Att): Promise<void> {
    if (a.loading || a.failed || !gl || lost || destroyed) return;
    if (a.ready && a.stateTier === tier) return;
    const gen = a.gen;
    const t = tier;
    a.loading = true;
    try {
      const def = a.def ?? (a.def = await resolveDef(a.id));
      if (!def) throw new Error('no scene module');
      const key = `${a.id}\u0000${a.src}\u0000${t}`;
      let p = data.get(key);
      if (!p) {
        p = def.load(a.src, t);
        data.set(key, p);
        p.catch(() => data.delete(key));
      }
      const d = await p;
      if (gen !== a.gen || t !== tier || !gl || lost || destroyed || !atts.includes(a)) return;
      create(a, d);
    } catch (err) {
      if (gen === a.gen) fail(a, err);
    } finally {
      a.loading = false;
      // the tier/gen moved on while loading: try again for the current one
      if (gen !== a.gen || t !== tier) if (a.near && atts.includes(a)) void ensure(a);
    }
  }

  function create(a: Att, d: unknown): void {
    const g = gl as WebGL2RenderingContext;
    const def = a.def as Def;
    let s: unknown;
    try {
      s = def.create(g, d, tier);
    } catch (err) {
      fail(a, err);
      return;
    }
    if (a.ready) {
      try {
        def.destroy(g, a.state);
      } catch {
        /* ignore */
      }
    }
    a.data = d;
    a.state = s;
    a.stateTier = tier;
    a.ready = true;
    a.dirty = true;
    a.w = a.h = -1;
    if (def.set) for (const k in a.params) def.set(s, k, a.params[k] as Value);
    a.count = countOf(a);
    layoutDirty = 2;
    programsPending = true;
    publish();
    wake();
  }

  function makeAtt(el: HTMLElement, id: SceneId): Att {
    const a = {
      id,
      el,
      src: el.dataset.glSrc ?? '',
      def: defs.get(id) ?? null,
      data: null,
      state: null,
      stateTier: null,
      ready: false,
      loading: false,
      failed: false,
      near: false,
      vis: false,
      live: false,
      dirty: true,
      anim: false,
      gen: 0,
      rect: newRect(),
      w: -1,
      h: -1,
      holeEls: collectHoles(el),
      holes: new Float32Array(MAX_HOLES * 4),
      holeCount: 0,
      params: {},
      ptr: new Float32Array(3),
      count: 0,
    } as Omit<Att, 'handle'> as Att;
    a.handle = {
      set(name: string, v: Value): void {
        a.params[name] = v;
        if (a.ready && a.def?.set) a.def.set(a.state, name, v);
        a.dirty = true;
        if (a.vis) wake();
      },
      holes(els: Element[]): void {
        a.holeEls = els.slice(0, 64);
        layoutDirty = 2;
        if (a.vis) wake();
      },
      pick(x: number, y: number): RecordRef | null {
        return a.ready && a.def?.pick ? a.def.pick(a.state, x, y) : null;
      },
      step(dir: StepDir): RecordRef | null {
        return a.ready && a.def?.step ? a.def.step(a.state, dir) : null;
      },
      k: 1,
      get count(): number {
        return a.count;
      },
    };
    return a;
  }

  function find(el: Element): Att | undefined {
    for (let i = 0; i < atts.length; i++) if ((atts[i] as Att).el === el) return atts[i];
    return undefined;
  }

  /* ------------------------------------------------------------------ frame */

  function smoothPointer(a: Att, dtMs: number): boolean {
    const r = a.rect;
    const p = a.ptr;
    const lx = ptrX - r.x;
    const ly = ptrY - r.y;
    const tz =
      ptrOn && ptrIn && lx > -REACH && ly > -REACH && lx < r.width + REACH && ly < r.height + REACH ? 1 : 0;
    if (tz === 0 && (p[2] as number) < 0.002) {
      // inactive: follow silently so a re-entry never glides in from a stale spot
      p[0] = lx;
      p[1] = ly;
      p[2] = 0;
      return false;
    }
    const dx = lx - (p[0] as number);
    const dy = ly - (p[1] as number);
    const dz = tz - (p[2] as number);
    if (dx * dx + dy * dy < 0.01 && dz * dz < 1e-6) return false;
    const k = 1 - Math.exp(-dtMs * 0.012);
    p[0] = (p[0] as number) + dx * k;
    p[1] = (p[1] as number) + dy * k;
    p[2] = (p[2] as number) + dz * k;
    return true;
  }

  function render(t: number, dt: number): void {
    const g = gl as WebGL2RenderingContext;
    clearAll(g);
    frame.t = t;
    frame.dt = dt;
    frame.reduced = reduced || frozen;
    frame.tier = tier;
    frame.halo = halo;
    frame.density = density;
    frame.dpr = box.sx;
    const still = reduced || frozen;
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      if (!a.vis || !a.ready || !a.def) continue;
      const r = a.rect;
      const vx = Math.round(r.x * box.sx);
      const vw = Math.round(r.width * box.sx);
      const vh = Math.round(r.height * box.sy);
      const vy = Math.round(box.pxH - (r.y + r.height) * box.sy);
      const x0 = vx > 0 ? vx : 0;
      const y0 = vy > 0 ? vy : 0;
      const x1 = vx + vw < box.pxW ? vx + vw : box.pxW;
      const y1 = vy + vh < box.pxH ? vy + vh : box.pxH;
      a.dirty = false;
      if (vw <= 0 || vh <= 0 || x1 <= x0 || y1 <= y0) continue;
      g.viewport(vx, vy, vw, vh);
      g.scissor(x0, y0, x1 - x0, y1 - y0);
      frame.rect = r;
      frame.view[0] = r.width;
      frame.view[1] = r.height;
      frame.params = a.params;
      frame.holes = a.holes;
      frame.holeCount = a.holeCount;
      frame.pointer[0] = a.ptr[0] as number;
      frame.pointer[1] = a.ptr[1] as number;
      frame.pointer[2] = ptrOn ? (a.ptr[2] as number) : 0;
      pulse.write(frame.pulse, r, t);
      let more = false;
      try {
        more = a.def.draw(g, a.state, frame);
      } catch (err) {
        destroyState(a);
        fail(a, err);
        continue;
      }
      a.anim = more && !still;
      if (!a.live) {
        a.live = true;
        a.el.setAttribute('data-gl-live', '');
      }
    }
    lastDraw = performance.now();
  }

  function tick(): boolean {
    if (!gl || lost || destroyed || broken || document.hidden || !cv) {
      lastNow = 0;
      return false;
    }
    const start = performance.now();
    const dtMs = lastNow ? start - lastNow : 16.7;
    const continuous = lastNow !== 0 && dtMs < 100;
    lastNow = start;
    const t = (start - t0) / 1000;
    let change = false;

    if (canvasDirty) {
      canvasDirty = false;
      if (sizeCanvas(cv, Math.min(window.devicePixelRatio || 1, dprCap), box)) change = true;
      layoutDirty = layoutDirty > 1 ? layoutDirty : 1;
    }
    if (programsPending) {
      const p = pollPrograms(gl);
      programsPending = (p & 2) !== 0;
      if (p & 1) change = true;
    }

    const readLayout = layoutDirty > 0;
    if (layoutDirty > 0) layoutDirty--;
    let vis = false;
    let anim = false;
    ptrMoving = false;
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      if (!a.vis || !a.ready || !a.def) continue;
      vis = true;
      if (readLayout) {
        readRect(a.el, a.rect);
        if (a.rect.width !== a.w || a.rect.height !== a.h) {
          a.w = a.rect.width;
          a.h = a.rect.height;
          try {
            a.def.resize(a.state, a.rect);
          } catch {
            /* ignore */
          }
        }
        a.holeCount = readHoles(a.holeEls, a.rect, a.holes);
        change = true;
      }
      if (a.dirty) change = true;
      if (a.anim) anim = true;
      if (ptrOn || (a.ptr[2] as number) > 0) {
        if (smoothPointer(a, dtMs)) {
          ptrMoving = true;
          change = true;
        }
      }
    }
    const ringing = vis && pulse.active(t);
    if (ringing) change = true;

    let draw = false;
    if (vis && box.cssW > 0) {
      if (change || probe.active) {
        draw = true;
        if (change) lastChange = start;
      } else if (anim && !reduced && !frozen) {
        // lite idles at 30 fps once settled (§6.0)
        draw = !(tier === 'lite' && start - lastChange > 500 && start - lastDraw < 30);
      }
    }
    if (calib > 0) {
      calib--;
      if (continuous && !draw) guard.calibrate(dtMs);
    }
    if (draw) {
      const r0 = performance.now();
      render(t, Math.min(dtMs, 100) / 1000);
      needClear = false;
      const busy = performance.now() - r0;
      if (continuous) guard.sample(dtMs, tier);
      if (probe.active) probe.sample(dtMs, busy, continuous);
    } else if (needClear) {
      clearAll(gl);
      needClear = false;
    }

    return (
      (vis && ((anim && !reduced && !frozen) || ringing || ptrMoving || probe.active)) ||
      layoutDirty > 0 ||
      programsPending ||
      calib > 0
    );
  }

  /* ------------------------------------------------------------------ guard, probe */

  function applyStep(s: GuardStep): boolean {
    switch (s) {
      case 'dpr':
        if (dprCap <= 1) return false;
        dprCap = 1;
        canvasDirty = true;
        break;
      case 'halo':
        if (!halo) return false;
        halo = 0;
        break;
      case 'half':
        density = 0.5;
        for (let i = 0; i < atts.length; i++) (atts[i] as Att).count = countOf(atts[i] as Att);
        publish();
        break;
      case 'demote':
        if (tier !== 'full') return false;
        setPrefTier('lite', 'auto', 'demoted'); // → lifecycle → engine.setTier('lite')
        return true;
      case 'freeze':
        frozen = true;
        for (let i = 0; i < atts.length; i++) (atts[i] as Att).anim = false;
        setState('frozen');
        fire('frozen');
        break;
    }
    markAll();
    wake();
    return true;
  }

  // The upgrade test (core/probe.ts): on any page with a GL scene, after load + idle, only while the document is
  // visible (a hidden tab's throttled rAF must never read as slowness: hiding cancels, showing reschedules).
  function scheduleProbe(): void {
    if (probeOff || probe.active || destroyed || probeTries >= PROBE_TRIES || !atts.length || !probeEligible()) return;
    probeOff = afterLoadIdle(() => {
      probeOff = null;
      if (destroyed || probe.active || !gl || lost || broken || !atts.length || !probeEligible()) return;
      if (document.visibilityState !== 'visible') return; // onVisibility reschedules it
      probe.start();
      wake();
    });
  }

  function cancelProbe(): void {
    probeOff?.();
    probeOff = null;
    probe.cancel();
  }

  function onProbe(v: Verdict): void {
    if (v === 'pass') {
      if (getTier() === 'lite') setPrefTier('full', 'auto', 'promoted');
      else markProbe(getTier());
    } else if (v === 'fail') markProbe('lite');
    else {
      probeTries++;
      scheduleProbe(); // inconclusive (something else janked the page): again at the next idle
    }
  }

  /* ------------------------------------------------------------------ input, visibility, loss */

  function nearAnchor(x: number, y: number): boolean {
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      if (!a.vis) continue;
      const r = a.rect;
      if (x > r.x - REACH && y > r.y - REACH && x < r.x + r.width + REACH && y < r.y + r.height + REACH) return true;
    }
    return false;
  }

  function onPointerMove(e: PointerEvent): void {
    if (e.pointerType === 'touch') return;
    ptrX = e.clientX;
    ptrY = e.clientY;
    ptrIn = true;
    if (ptrOn && nearAnchor(ptrX, ptrY)) {
      layoutDirty = layoutDirty > 1 ? layoutDirty : 1; // holes (the readout pill) move with the pointer
      wake();
    }
  }

  function onPointerOut(e: PointerEvent): void {
    if (e.relatedTarget) return;
    ptrIn = false;
    if (anyVisible()) wake();
  }

  function updatePointerMode(): void {
    ptrOn = !reduced && !frozen && mq(MQ.fine).matches;
  }

  /** Focus inside a GL figure, or a tap on it → pulse (§5.4 parity). */
  function figureOf(target: EventTarget | null): boolean {
    const fig = target instanceof Element ? target.closest('figure') : null;
    if (!fig) return false;
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      if (a.vis && fig.contains(a.el)) return true;
    }
    return false;
  }

  function onFocusIn(e: FocusEvent): void {
    if (reduced || frozen || !figureOf(e.target)) return;
    const r = (e.target as Element).getBoundingClientRect();
    api.pulse(r.left + r.width / 2, r.top + r.height / 2);
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.pointerType !== 'touch' || reduced || frozen || !figureOf(e.target)) return;
    api.pulse(e.clientX, e.clientY);
  }

  function onVisibility(): void {
    if (document.hidden) {
      loop.stop();
      lastNow = 0;
      cancelProbe(); // throttled or stopped frames are not a measurement
    } else {
      layoutDirty = 2;
      markAll();
      wake();
      scheduleProbe();
    }
  }

  function onLost(): void {
    lost = true;
    loop.stop();
    lastNow = 0;
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      a.gen++;
      a.ready = false;
      a.state = null;
      a.stateTier = null;
      a.loading = false;
      if (a.live) {
        a.live = false;
        a.el.removeAttribute('data-gl-live');
      }
    }
    if (gl) clearPrograms(gl, false);
    const second = recordLoss();
    setState('lost');
    fire('lost');
    if (second) lockStatic('lost'); // → tier static → runtime destroys the engine
  }

  function onRestored(): void {
    if (destroyed || !gl) return;
    lost = false;
    enableParallel(gl);
    initState(gl);
    setState(frozen ? 'frozen' : 'ok');
    fire('restored');
    canvasDirty = true;
    layoutDirty = 2;
    for (let i = 0; i < atts.length; i++) {
      const a = atts[i] as Att;
      a.failed = false;
      if (a.near) void ensure(a); // data is still cached CPU-side: re-upload only
    }
    wake();
  }

  /* ------------------------------------------------------------------ API */

  const api: GlimmerEngine = {
    get tier() {
      return tier;
    },
    get state() {
      return state;
    },
    ready,

    mount(canvas: HTMLCanvasElement): void {
      if (destroyed || (canvas === cv && gl)) return;
      cv = canvas;
      gl = createContext(canvas, tier === 'full' && !mq(MQ.mobile).matches);
      if (!gl) {
        setState('none');
        resolveReady(false);
        return;
      }
      enableParallel(gl);
      initState(gl);
      const p = readPalette();
      frame.fg = p.fg;
      frame.glim = p.glim;
      onProgramError(() => {
        // a shader that cannot compile: no GL for this device (§6.0) → static
        if (broken) return;
        broken = true;
        loop.stop();
        if (gl && !lost) clearAll(gl);
        setState('none');
        lockStatic('noWebgl');
      });
      visIO = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            const a = find(en.target);
            if (!a) continue;
            a.vis = en.isIntersecting;
            a.dirty = true;
            if (!a.vis) needClear = true;
          }
          layoutDirty = 2;
          publish();
          wake();
        },
        { rootMargin: '64px 0px' },
      );
      nearIO = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            const a = find(en.target);
            if (!a) continue;
            a.near = en.isIntersecting;
            if (a.near) void ensure(a);
          }
        },
        { rootMargin: '100% 0px' },
      );
      ro = new ResizeObserver(() => {
        layoutDirty = 2;
        if (anyVisible()) wake();
      });
      const fineMq = mq(MQ.fine);
      fineMq.addEventListener('change', updatePointerMode);
      offs = [
        () => fineMq.removeEventListener('change', updatePointerMode),
        watchLoss(canvas, onLost, onRestored),
        watchLayout(
          () => {
            layoutDirty = 2;
            if (anyVisible()) wake();
          },
          () => {
            canvasDirty = true;
            layoutDirty = 2;
            if (anyVisible() || needClear) wake();
          },
        ),
        listen(document, 'visibilitychange', onVisibility),
        listen(window, 'pointermove', onPointerMove, { passive: true }),
        listen(window, 'pointerout', onPointerOut, { passive: true }),
        listen(document, 'focusin', onFocusIn),
        listen(document, 'pointerdown', onPointerDown, { passive: true }),
      ];
      updatePointerMode();
      t0 = performance.now();
      calib = 12;
      setState(frozen ? 'frozen' : 'ok');
      canvasDirty = true;
      resolveReady(true);
      fire('ready');
      wake();
    },

    register(def: SceneDef<any>): void {
      defs.set(def.id, def as Def);
      for (let i = 0; i < atts.length; i++) {
        const a = atts[i] as Att;
        if (a.id === def.id && !a.def) {
          a.def = def as Def;
          a.failed = false;
          if (a.near) void ensure(a);
        }
      }
    },

    attachAll(root: ParentNode): void {
      if (destroyed || !gl) return;
      for (const el of root.querySelectorAll<HTMLElement>('[data-gl-scene]')) {
        const id = el.dataset.glScene ?? '';
        if (!IDS.includes(id) || find(el)) continue;
        const a = makeAtt(el, id as SceneId);
        atts.push(a);
        visIO?.observe(el);
        nearIO?.observe(el);
        ro?.observe(el);
      }
      layoutDirty = 2;
      publish();
      probeTries = 0;
      scheduleProbe();
    },

    detachAll(): void {
      for (let i = 0; i < atts.length; i++) {
        const a = atts[i] as Att;
        a.gen++;
        destroyState(a);
        visIO?.unobserve(a.el);
        nearIO?.unobserve(a.el);
        ro?.unobserve(a.el);
      }
      atts.length = 0;
      cancelProbe();
      // the persisted canvas must never show the old page's glimmers over the new one
      if (gl && !lost) clearAll(gl);
      needClear = false;
      publish();
    },

    get(id: SceneId): SceneHandle | null {
      for (let i = 0; i < atts.length; i++) if ((atts[i] as Att).id === id) return (atts[i] as Att).handle;
      return null;
    },

    pulse(x: number, y: number, strength = 1): void {
      if (reduced || frozen || !gl || !anyVisible()) return;
      pulse.fire(x, y, now(), strength);
      wake();
    },

    async setTier(t: Tier): Promise<void> {
      if (destroyed) return;
      if (t === 'static') {
        api.destroy();
        return;
      }
      if (t === tier && !frozen) return;
      tier = t;
      frozen = false;
      dprCap = capFor(t);
      halo = t === 'full' ? 1 : 0;
      density = 1;
      guard.reset();
      canvasDirty = true;
      updatePointerMode();
      if (gl && !lost && state === 'frozen') setState('ok');
      for (let i = 0; i < atts.length; i++) {
        const a = atts[i] as Att;
        a.failed = false;
        if (a.near) void ensure(a); // keeps drawing the old state until the new one is created
      }
      fire('tier', t);
      publish();
      markAll();
      wake();
    },

    count,

    on(e: EngineEvent, cb: (d?: unknown) => void): () => void {
      let set = subs.get(e);
      if (!set) subs.set(e, (set = new Set()));
      set.add(cb);
      return () => set.delete(cb);
    },

    invalidate(): void {
      layoutDirty = 2;
      if (anyVisible()) wake();
    },

    setReduced(r: boolean): void {
      reduced = r;
      updatePointerMode();
      for (let i = 0; i < atts.length; i++) (atts[i] as Att).anim = false;
      markAll();
      wake();
    },

    destroy(): void {
      if (destroyed) return;
      api.detachAll();
      loop.stop();
      for (const off of offs) off();
      offs = [];
      visIO?.disconnect();
      nearIO?.disconnect();
      ro?.disconnect();
      visIO = nearIO = null;
      ro = null;
      onProgramError(null);
      if (gl) clearPrograms(gl, true);
      // free the full-viewport backing store; a later mount resizes it again
      if (cv) {
        cv.width = 1;
        cv.height = 1;
      }
      destroyed = true;
      gl = null;
      subs.clear();
      setState('off');
      resolveReady(false);
    },
  };

  return api;
}
