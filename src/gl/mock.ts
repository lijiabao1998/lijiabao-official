// src/gl/mock.ts — a GlimmerEngine that draws nothing and logs every call (§9.2 item 9).
// Use it to develop sections and tier switching without WebGL: open any page with ?gl=mock
// (motion/lifecycle.ts loads this instead of engine.ts). It never touches html[data-gl], so posters stay visible.

import type {
  EngineEvent,
  EngineOptions,
  GlimmerEngine,
  RecordRef,
  SceneDef,
  SceneHandle,
  SceneId,
  StepDir,
  Tier,
} from './types';

const log = (...args: unknown[]): void => console.debug('[gl:mock]', ...args);

export function createMockEngine(opts: EngineOptions): GlimmerEngine {
  let tier: Tier = opts.tier === 'static' ? 'lite' : opts.tier;
  const subs = new Map<EngineEvent, Set<(d?: unknown) => void>>();
  const handles = new Map<SceneId, SceneHandle>();
  const fire = (e: EngineEvent, d?: unknown): void => subs.get(e)?.forEach((cb) => cb(d));

  const handle = (id: SceneId): SceneHandle => ({
    set(name: string, v: number | number[]): void {
      log(id, 'set', name, v);
    },
    holes(els: Element[]): void {
      log(id, 'holes', els.length);
    },
    pick(x: number, y: number): RecordRef | null {
      log(id, 'pick', x, y);
      return null;
    },
    step(dir: StepDir): RecordRef | null {
      log(id, 'step', dir);
      return null;
    },
    k: 1,
    count: 0,
  });

  const api: GlimmerEngine = {
    get tier() {
      return tier;
    },
    get state() {
      return 'ok' as const;
    },
    ready: Promise.resolve(true),
    mount(canvas: HTMLCanvasElement): void {
      log('mount', canvas.id);
      fire('ready');
    },
    register(def: SceneDef<any>): void {
      log('register', def.id);
    },
    attachAll(root: ParentNode): void {
      for (const el of root.querySelectorAll<HTMLElement>('[data-gl-scene]')) {
        const id = el.dataset.glScene as SceneId;
        handles.set(id, handle(id));
      }
      log('attachAll', [...handles.keys()]);
    },
    detachAll(): void {
      log('detachAll');
      handles.clear();
    },
    get(id: SceneId): SceneHandle | null {
      return handles.get(id) ?? null;
    },
    pulse(x: number, y: number, strength = 1): void {
      log('pulse', x, y, strength);
    },
    async setTier(t: Tier, src: 'user' | 'auto'): Promise<void> {
      log('setTier', t, src);
      tier = t;
      fire('tier', t);
    },
    count: () => 0,
    on(e: EngineEvent, cb: (d?: unknown) => void): () => void {
      let set = subs.get(e);
      if (!set) subs.set(e, (set = new Set()));
      set.add(cb);
      return () => set.delete(cb);
    },
    invalidate(): void {},
    setReduced(r: boolean): void {
      log('setReduced', r);
    },
    destroy(): void {
      log('destroy');
      handles.clear();
      subs.clear();
    },
  };
  log('created', tier, opts.reduced ? 'reduced' : 'full motion');
  return api;
}
