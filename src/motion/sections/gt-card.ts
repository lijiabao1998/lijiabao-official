// src/motion/sections/gt-card.ts — #gt-card, the life of one card (§5.3). Owner: S4. Not pinned.
//
// The server HTML shows every step finished. With full motion the steps start "to do"; as each step reaches 75% of
// the viewport (once), an amber DOM marker glimmer steps down the rail to it (0.48s lj.rise), the step becomes the
// current one (its name gains weight from the left: CJK per character, Latin as one line; colour → --fg), and the
// steps before it are finished (● filled). The marker's target is read once per step (in the trigger callback,
// never per frame) and re-read on resize. Reduced motion: the end state, no marker.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE } from '../eases';
import { isZh, qs, qsa } from '../../lib/dom';

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST } = ctx;
  const track = qs('[data-card-track]', root);
  const marker = qs('[data-card-marker]', root);
  const steps = qsa('[data-card-step]', root);
  if (!track || !marker || !steps.length) return () => {};

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c, contextSafe) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;

    const set = (i: number, state: 'todo' | 'current' | 'done'): void => {
      const s = steps[i];
      if (s) s.dataset.state = state;
    };
    steps.forEach((_, i) => set(i, 'todo'));

    const weighs = steps.map((s) => {
      const name = qs('[data-card-name]', s);
      return name ? ctx.prim.weigh(name, { per: isZh(name) ? 'char' : 'line', sweep: 'ltr', paused: true }) : null;
    });

    let current = -1;
    /** centre of step i's glyph, relative to the track (one read) */
    const targetY = (i: number): number => {
      const glyph = qs('[data-card-glyph]', steps[i] as HTMLElement);
      if (!glyph) return 0;
      const g = glyph.getBoundingClientRect();
      return g.top + g.height / 2 - track.getBoundingClientRect().top;
    };

    const goTo = (i: number): void => {
      if (i <= current) return;
      for (let j = 0; j < i; j++) set(j, 'done');
      set(i, 'current');
      if (current >= 0) weighs[current]?.reverse();
      weighs[i]?.play();
      const first = current < 0;
      current = i;
      const y = targetY(i);
      if (first) gsap.set(marker, { y });
      gsap.to(marker, { y, opacity: 1, duration: DUR.m, ease: EASE.rise, overwrite: true });
    };
    const go = (contextSafe ? contextSafe(goTo) : goTo) as (i: number) => void;

    steps.forEach((s, i) => {
      ST.create({ trigger: s, start: 'top 75%', once: true, onEnter: () => go(i) });
    });

    // layout changed under the marker (resize, fonts): put it back on its step
    const ro = new ResizeObserver(() => {
      if (current >= 0) gsap.set(marker, { y: targetY(current) });
    });
    ro.observe(track);

    return () => {
      ro.disconnect();
      steps.forEach((_, i) => set(i, 'done'));
    };
  });

  return () => {};
}
