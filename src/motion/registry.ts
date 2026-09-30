// src/motion/registry.ts — section modules keyed by [data-motion] (§9.3, frozen).
//
// The map below already has ONE line per section module in §9.1; owners only replace the body of their
// file in ./sections/ (keep `export function setup(root, ctx): Cleanup`). Never edit this map.
//
// Rules for a section module (§9.3):
// - setup() runs inside gsap.context(root) and gets its OWN ctx.mm = gsap.matchMedia(root); create every
//   tween/ScrollTrigger inside ctx.mm.add(MQ-conditions, fn) so reduced motion / breakpoints revert cleanly.
// - Return a Cleanup for anything GSAP does not own (listeners, observers, engine handles…).
//   The runtime calls it, then reverts the context and the matchMedia, on every ClientRouter swap.
// - Eases only from ./eases (EASE.*). No layout reads in onUpdate. Pins only where §5.3 says.
// - Must work when ctx.engine === null (static GL / mock) and when ctx.lenis === null (touch, reduced).
// - No copy strings in .ts: read data-i18n-* attributes (lib/dom `i18n()`).

import type { gsap as GsapCore } from 'gsap';
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import type { GlimmerEngine, Tier } from '../gl/types';
import type { Locale } from '../i18n/types';
import { MQ } from '../lib/dom';

export { MQ };

/* ------------------------------------------------------------------ frozen (§9.3) */

export type Cleanup = () => void;

export interface MotionCtx {
  gsap: typeof GsapCore;
  ST: typeof ScrollTriggerClass;
  mm: gsap.MatchMedia;
  tier: Tier;
  reduced: boolean;
  mobile: boolean;
  fine: boolean;
  locale: Locale;
  engine: GlimmerEngine | null;
  lenis: Lenis | null;
  prim: Primitives;
}

export type SectionModule = { setup(root: HTMLElement, ctx: MotionCtx): Cleanup };

export interface Primitives {
  /** Rise into place: `yPercent 105→0` inside a [data-mask] parent, else `y 24→0` + opacity. `trigger` → once ScrollTrigger (default start 'top 85%'). */
  rise(els: Element | Element[], o?: RiseOpts): gsap.core.Timeline;
  /** font-variation-settings "wght" from → to (defaults: resting weight → +200). `per:'char'` splits chars (CJK or locked single lines only, §2.2). */
  weigh(el: HTMLElement, o: WeighOpts): gsap.core.Tween;
  /** Hairline scaleX 0→1 from the left with lj.scan; `dot` follows the head; `onProgress(p)` gets the eased 0..1 (drive engine uScan with it). */
  scan(line: HTMLElement, o?: ScanOpts): gsap.core.Tween;
  /** Odometer from the final text already in the DOM (left digit first). Restores the plain text when done or reverted. */
  tick(el: HTMLElement): gsap.core.Timeline;
  /** Magnetic pull ≤ max px (fine pointer, motion full, tier ≠ static; never on keyboard focus). */
  magnet(el: HTMLElement, max?: number): Cleanup;
  /** Hover == :focus-visible. `on` when either starts, `off` when both end. */
  interactive(el: HTMLElement, on: () => void, off: () => void): Cleanup;
  /** SplitText with the site's aria rules (aria:'none' inside aria-hidden copies) and CJK line breaking. */
  split(el: HTMLElement, type: 'chars' | 'lines', o?: SplitOpts): SplitText;

  /** F0+ — text-link underline (a child [data-ul] line) + weight for mono/CJK links; CSS covers the static tier. */
  underline(el: HTMLElement, o?: { weight?: boolean }): Cleanup;
}

export interface RiseOpts {
  stagger?: number;
  trigger?: ScrollTrigger.Vars;
  /** F0+ */
  duration?: number;
  /** F0+ — soft-rise distance in px (default 24). */
  y?: number;
  /** F0+ */
  delay?: number;
}

export interface WeighOpts {
  from?: number;
  to?: number;
  sweep?: 'ltr' | 'none';
  per?: 'char' | 'line';
  /** F0+ — per target (default 0.35s). */
  duration?: number;
  /** F0+ — per-char stagger (default 0.018, capped by §5.1). */
  each?: number;
  /** F0+ — create paused (hover: play()/reverse(); reverse uses lj.exit via easeReverse). */
  paused?: boolean;
}

export interface ScanOpts {
  dot?: HTMLElement;
  onProgress?: (p: number) => void;
  /** F0+ — default 1.0s. */
  duration?: number;
}

export interface SplitOpts {
  /** default: 'lines' → mask lines; 'chars' → no mask. */
  mask?: boolean;
  /** re-split on resize / font load; create animations in onSplit and return them. */
  autoSplit?: boolean;
  onSplit?: (self: SplitText) => gsap.core.Animation | void;
}

/** One entry per section module in §9.1 (+ the generic reveal). Owners edit their file, never this map. */
export const sections: Record<string, () => Promise<SectionModule>> = {
  hero: () => import('./sections/hero'),
  work: () => import('./sections/work'),
  method: () => import('./sections/method'),
  not: () => import('./sections/not'),
  numbers: () => import('./sections/numbers'),
  contact: () => import('./sections/contact'),
  vision: () => import('./sections/vision'),
  about: () => import('./sections/about'),
  'gt-hero': () => import('./sections/gt-hero'),
  'gt-pass': () => import('./sections/gt-pass'),
  'gt-lines': () => import('./sections/gt-lines'),
  'gt-card': () => import('./sections/gt-card'),
  'gt-3d': () => import('./sections/gt-3d'),
  'fr-hero': () => import('./sections/fr-hero'),
  'fr-round': () => import('./sections/fr-round'),
  'fr-labs': () => import('./sections/fr-labs'),
  'fr-math': () => import('./sections/fr-math'),
  nf: () => import('./sections/nf'),
  reveal: () => import('./sections/reveal'),
};

/** §5.2 intro (S1). Same shape as a section; run once per full load when html[data-intro] is set on home. */
export const intro = (): Promise<SectionModule> => import('./intro');

/* ------------------------------------------------------------------ runner (used by boot.ts) */

export type BaseCtx = Omit<MotionCtx, 'mm'>;

export interface Job {
  key: string;
  el: HTMLElement;
  mod: SectionModule | null;
}

export interface PageMotion {
  cleanup: Cleanup;
  /** Every ctx handed out (the runtime updates `tier` in place on lite ⇄ full). */
  ctxs: MotionCtx[];
}

/** Resolve the modules for `root`: [data-motion] sections in DOM order, then the generic reveal on root. */
export async function load(root: HTMLElement): Promise<Job[]> {
  const jobs: { key: string; el: HTMLElement }[] = [];
  for (const el of root.querySelectorAll<HTMLElement>('[data-motion]')) {
    const key = el.dataset.motion ?? '';
    if (key === 'reveal') continue;
    if (key in sections) jobs.push({ key, el });
    else if (import.meta.env.DEV) console.warn(`[motion] no module for data-motion="${key}"`);
  }
  jobs.push({ key: 'reveal', el: root });
  const mods = await Promise.all(
    jobs.map((j) =>
      (sections[j.key] as () => Promise<SectionModule>)().catch((err: unknown) => {
        if (import.meta.env.DEV) console.error(`[motion] ${j.key} failed to load`, err);
        return null;
      }),
    ),
  );
  return jobs.map((j, i) => ({ ...j, mod: mods[i] ?? null }));
}

/**
 * Run one module on one element inside its own gsap.context + gsap.matchMedia.
 * A throwing setup is contained (its section just stays at rest) and never breaks the others.
 */
export function runModule(mod: SectionModule, el: HTMLElement, base: BaseCtx, ctxs?: MotionCtx[]): Cleanup {
  const g = base.gsap;
  const mm = g.matchMedia(el);
  const ctx: MotionCtx = { ...base, mm };
  ctxs?.push(ctx);
  const box: { user?: Cleanup } = {};
  const gctx = g.context(() => {
    try {
      const c = mod.setup(el, ctx);
      if (typeof c === 'function') box.user = c;
    } catch (err) {
      if (import.meta.env.DEV) console.error('[motion] setup failed', el, err);
    }
  }, el);
  return () => {
    try {
      box.user?.();
    } catch (err) {
      if (import.meta.env.DEV) console.error('[motion] cleanup failed', err);
    }
    gctx.revert();
    mm.revert();
  };
}

/** Set up loaded jobs in order (sections first — pins before the reveals below them — then reveal). */
export function run(jobs: Job[], base: BaseCtx): PageMotion {
  const ctxs: MotionCtx[] = [];
  const cleanups: Cleanup[] = [];
  for (const j of jobs) if (j.mod) cleanups.push(runModule(j.mod, j.el, base, ctxs));
  return {
    ctxs,
    cleanup: () => {
      for (let i = cleanups.length - 1; i >= 0; i--) (cleanups[i] as Cleanup)();
      cleanups.length = 0;
    },
  };
}

/** load + run. `stale()` → true when the page was swapped while modules loaded (nothing is set up). */
export async function init(root: HTMLElement, base: BaseCtx, stale?: () => boolean): Promise<PageMotion> {
  const jobs = await load(root);
  if (stale?.()) return { ctxs: [], cleanup: () => {} };
  return run(jobs, base);
}
