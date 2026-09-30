// src/motion/sections/fr-labs.ts — S5 (§5.3 #fr-labs).
//
//   rise     the 16 tiles rise in reading order at `top 80%`, once (0.035 apart).
//   hover    hover == focus-visible (prim.interactive): the mono code weighs in (Geist Mono: fixed advance), the
//            status glyph pulses once (0.6s); the border change is CSS (it also works in the static tier).
//   toggle   grid ⇄ list with Flip: 0.7s lj.snap, absolute, nested (each tile and its parts).
//            FrLabs.astro's script owns the switch in every tier; here we take the cancelable 'fr:labs-view' event,
//            measure, let it apply, then animate. Flip is imported lazily (idle prefetch) — the only page that
//            fetches it. The list's height is held and eased so nothing below jumps while the tiles are absolute.
// Reduced motion: no rise, no Flip (the switch is instant), no pulse. Works without engine or Lenis.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE, STAGGER } from '../eases';
import { inView, onIdle, qs, qsa } from '../../lib/dom';

type FlipPlugin = typeof import('gsap/Flip').Flip;

interface ViewDetail {
  view: string;
  apply: () => void;
}

let flipLoad: Promise<FlipPlugin | null> | null = null;

function loadFlip(register: (p: FlipPlugin) => void): Promise<FlipPlugin | null> {
  flipLoad ??= import('gsap/Flip')
    .then((m) => {
      register(m.Flip);
      return m.Flip;
    })
    .catch(() => {
      flipLoad = null;
      return null;
    });
  return flipLoad;
}

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST, prim } = ctx;
  const list = qs<HTMLElement>('[data-labs-list]', root);
  if (!list) return () => {};
  const items = qsa('.labs-li', list);
  const tiles = qsa('.tile', list);
  /** what Flip morphs: each tile and its parts (Flip assigns the data-flip-ids on first use) */
  const FLIP = '.labs-li, .tile-code, .tile-status, .tile-name, .tile-desc, .tile-facts, .tile-note';

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, fine: MQ.fine }, (c, contextSafe) => {
    const cond = (c.conditions ?? {}) as { full?: boolean; fine?: boolean };
    if (!cond.full) return;
    const safe = <A extends unknown[]>(fn: (...a: A) => void): ((...a: A) => void) =>
      (contextSafe ? contextSafe(fn) : fn) as (...a: A) => void;
    const offs: Cleanup[] = [];

    /* ---- rise, once, in reading order (skip if the list is already on screen) */
    const r = list.getBoundingClientRect();
    if (!inView(r) || r.top > window.innerHeight * 0.8) {
      prim.rise(items, { stagger: STAGGER.tile, y: 20, trigger: { trigger: list, start: 'top 80%' } });
    }

    /* ---- hover / focus: the code weighs in, the status ring pulses once */
    if (cond.fine) {
      for (const tile of tiles) {
        const code = qs<HTMLElement>('.tile-code', tile);
        const ring = qs<SVGElement>('.tile-status .status-g', tile);
        const w = code ? prim.weigh(code, { per: 'line', paused: true }) : null;
        const pulse = ring
          ? gsap
              .timeline({ paused: true })
              .to(ring, { scale: 1.3, duration: 0.24, ease: EASE.rise, transformOrigin: '50% 50%' })
              .to(ring, { scale: 1, duration: 0.36, ease: EASE.settle })
          : null;
        offs.push(
          prim.interactive(
            tile,
            safe(() => {
              w?.play();
              pulse?.restart();
            }),
            safe(() => {
              w?.reverse();
            }),
          ),
        );
      }
    }

    /* ---- grid ⇄ list with Flip */
    let Flip: FlipPlugin | null = null;
    const register = (p: FlipPlugin): void => gsap.registerPlugin(p);
    offs.push(
      onIdle(() => {
        void loadFlip(register).then((f) => {
          Flip = f;
        });
      }),
    );

    let busy: gsap.core.Timeline | null = null;
    const morph = safe((F: FlipPlugin, apply: () => void) => {
      busy?.progress(1);
      const targets = qsa(FLIP, list);
      const h0 = list.offsetHeight;
      const state = F.getState(targets);
      apply();
      const h1 = list.offsetHeight;
      const tl = gsap.timeline({
        onComplete: () => {
          busy = null;
          ST.refresh();
        },
      });
      tl.fromTo(list, { height: h0 }, { height: h1, duration: 0.7, ease: EASE.snap, clearProps: 'height' }, 0);
      tl.add(F.from(state, { duration: 0.7, ease: EASE.snap, absolute: true, nested: true }), 0);
      busy = tl;
    });

    const onView = (e: Event): void => {
      const detail = (e as CustomEvent<ViewDetail>).detail;
      if (!detail || typeof detail.apply !== 'function') return;
      e.preventDefault();
      if (Flip) {
        morph(Flip, detail.apply);
        return;
      }
      void loadFlip(register).then((f) => {
        Flip = f;
        if (f && list.isConnected) morph(f, detail.apply);
        else detail.apply();
      });
    };
    root.addEventListener('fr:labs-view', onView);
    offs.push(() => root.removeEventListener('fr:labs-view', onView));

    return () => {
      busy?.progress(1);
      for (const off of offs) off();
    };
  });

  return () => {};
}
