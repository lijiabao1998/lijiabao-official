// src/motion/sections/fr-math.ts — S5 (§5.3 #fr-math).
//
//   columns   the 75 lattice columns (n = 2..76, n = 75 empty) fill left → right with the scroll:
//             `top 75%` → `bottom 70%` of the plot, scrub 0.5, each column growing up from its baseline.
//   counter   the verified count runs as a Geist Mono odometer, left digit first (prim.tick), once — armed only
//             while it is still below the fold at setup (a reload / #hash / back that lands on it keeps the number
//             as it is: no 000,000 on screen waiting for a scroll).
//   ring      the n = 75 ring's outline breathes 0.4 ↔ 1 on a 2.4s cycle (CSS, Lattice.astro) — switched on only
//             while the figure is in view, so it stops off-screen; never under reduced motion or in the static tier.
// Reduced motion: nothing moves (every column drawn, the number final, the ring still). Works without engine/Lenis.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { qs, qsa } from '../../lib/dom';

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST, prim } = ctx;
  const plot = qs<HTMLElement>('#fig-lattice .lat-plot', root);
  const cols = qsa<SVGPathElement>('#fig-lattice .lat-col', root);
  const ring = qs<HTMLElement>('[data-lat-ring]', root);
  const odo = qs<HTMLElement>('[data-tick]', root);

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;

    if (plot && cols.length) {
      gsap.fromTo(
        cols,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: '50% 100%',
          ease: 'none',
          duration: 0.35,
          stagger: 0.02,
          scrollTrigger: { trigger: plot, start: 'top 75%', end: 'bottom 70%', scrub: 0.5 },
        },
      );
    }

    if (odo && odo.getBoundingClientRect().top >= window.innerHeight)
      ST.create({ trigger: odo, start: 'top 85%', once: true, animation: prim.tick(odo) });

    if (ring && plot) {
      ST.create({
        trigger: plot,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => ring.toggleAttribute('data-live', self.isActive),
      });
    }

    return () => ring?.removeAttribute('data-live');
  });

  return () => {};
}
