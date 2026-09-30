// src/motion/sections/numbers.ts — S2 · §5.3 #numbers.
//
// Each stat (`top 85%`, once): its hairline scans in from the left (0.9s lj.scan); the odometer runs every digit
// column to its value, LEFT digit first (prim.tick: 1.2s lj.rise, 0.04s per digit); the label rises; the source
// fades in. Stats that share a row start 0.08s apart, left to right.
// prim.tick is called at setup, so a stat below the fold already shows its reels at 0 when it scrolls in (no
// flash of the final number). The real <data> text is never touched: the odometer is its aria-hidden twin.
// Reduced motion: nothing moves (the odometer shows the final text). Stats already on screen keep their state.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE } from '../eases';
import { qs, qsa } from '../../lib/dom';

/** Columns of the stat grid (Numbers.astro): 3 from 1024px, 2 from 640px, else 1. */
export function columns(desktop: boolean, tablet: boolean): number {
  return desktop ? 3 : tablet ? 2 : 1;
}

/** Start offset of stat `index` inside its row, so a row lights left → right. */
export function rowDelay(index: number, cols: number, each = 0.08): number {
  return (index % Math.max(1, cols)) * each;
}

type Conds = { full?: boolean; desktop?: boolean; tablet?: boolean };

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const items = qsa('[data-num-item]', root);
  if (!items.length) return () => {};
  const { gsap, prim } = ctx;

  ctx.mm.add(
    { full: MQ.full, reduce: MQ.reduce, desktop: MQ.desktop, tablet: '(min-width: 640px)' },
    (c) => {
      const cond = (c.conditions ?? {}) as Conds;
      if (!cond.full) return;

      // one batch of reads before any write
      const vh = window.innerHeight;
      const fresh = items.map((el) => el.getBoundingClientRect().top >= vh);
      const cols = columns(!!cond.desktop, !!cond.tablet);
      const saved: [HTMLElement, string][] = [];

      items.forEach((item, i) => {
        if (!fresh[i]) return;
        const rule = qs('[data-num-rule]', item);
        const odo = qs('[data-tick]', item);
        const label = qs('[data-num-label]', item);
        const src = qs('[data-num-src]', item);
        const o = rowDelay(i, cols);

        const tl = gsap.timeline({ scrollTrigger: { trigger: item, start: 'top 85%', once: true } });
        if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: EASE.scan }, o);
        if (odo) {
          saved.push([odo, odo.textContent ?? '']);
          tl.add(prim.tick(odo), o + 0.1);
        }
        if (label)
          tl.fromTo(
            label,
            { y: 12, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: EASE.rise, clearProps: 'transform' },
            o + 0.25,
          );
        if (src) tl.fromTo(src, { opacity: 0 }, { opacity: 1, duration: DUR.m, ease: EASE.rise }, o + 0.55);
      });

      // a revert mid-count (swap, breakpoint) puts the plain final text back
      return () => {
        for (const [el, text] of saved) if (el.childElementCount) el.textContent = text;
      };
    },
  );

  return () => {};
}
