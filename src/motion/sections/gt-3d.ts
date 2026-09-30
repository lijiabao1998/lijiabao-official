// src/motion/sections/gt-3d.ts — #gt-3d (§5.3). Owner: S4.
//
// - figure#fig-parity, `top 70%`, once: the pairs light in reading order, the 2D cell and its 3D twin together
//   (1.2s lj.rise, 0.004 stagger); each row's "=" draws as the last pair of that row lights (0.3s lj.settle).
// - The GPU-upload bars grow from the left at `top 80%`, once (1.2s lj.rise, 0.15 stagger): light from the left.
// The three mode cards rise through the generic [data-rise]. Reduced motion / static / no JS: the finished state.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE } from '../eases';
import { qs, qsa } from '../../lib/dom';

const EACH = 0.004;

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap } = ctx;
  const parity = qs('[data-parity]', root);
  const a = parity ? qsa('[data-parity-a] > i', parity) : [];
  const b = parity ? qsa('[data-parity-b] > i', parity) : [];
  const eqs = parity ? qsa('[data-parity-eq]', parity) : [];
  const gpu = qs('[data-gpu]', root);
  const bars = gpu ? qsa('[data-gpu-bar]', gpu) : [];

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;

    if (parity && a.length && a.length === b.length) {
      const perRow = eqs.length ? Math.ceil(a.length / eqs.length) : a.length;
      gsap.set([...a, ...b], { opacity: 0.14 });
      gsap.set(eqs, { opacity: 0, scaleX: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: parity, start: 'top 70%', once: true } });
      const lit = { opacity: 1, duration: DUR.xl, ease: EASE.rise, stagger: EACH };
      tl.to(a, lit, 0).to(b, lit, 0);
      eqs.forEach((eq, r) => {
        const last = Math.min(a.length, (r + 1) * perRow) - 1;
        tl.to(eq, { opacity: 1, scaleX: 1, duration: 0.3, ease: EASE.settle }, last * EACH + 0.15);
      });
    }

    if (gpu && bars.length) {
      gsap.fromTo(
        bars,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: DUR.xl,
          ease: EASE.rise,
          stagger: 0.15,
          scrollTrigger: { trigger: gpu, start: 'top 80%', once: true },
        },
      );
    }
  });

  return () => {};
}
