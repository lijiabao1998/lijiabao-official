// src/motion/sections/contact.ts — S2 · §5.3 #contact.
//
// Enter (`top 80%`, once): the GitHub display link rises in its mask (yPercent 105 → 0, 0.9s lj.rise).
// Hover == focus-visible: the text weighs rest → lit (Latin as one locked line: only from 640px, where the link
// never wraps; 0.35s lj.weigh in, 0.25s lj.exit out). The underline and the amber ↗ are CSS (every tier).
// The ↗ is magnetic, ≤ 12px (fine pointer, motion full, tier ≠ static — prim.magnet checks).
// Reduced motion: nothing moves; CSS gives the instant weight. A link already on screen keeps its state.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE } from '../eases';
import { qs } from '../../lib/dom';

type Conds = { full?: boolean; wide?: boolean };

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const mask = qs('[data-contact-mask]', root);
  const link = qs('[data-contact-link]', root);
  const text = qs('[data-contact-text]', root);
  const go = qs('[data-contact-go]', root);
  if (!mask || !link) return () => {};
  const { gsap, prim } = ctx;

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, wide: '(min-width: 640px)' }, (c) => {
    const cond = (c.conditions ?? {}) as Conds;
    if (!cond.full) return;

    const fresh = mask.getBoundingClientRect().top >= window.innerHeight;
    const offs: Cleanup[] = [];

    if (fresh) {
      mask.setAttribute('data-masking', '');
      gsap.fromTo(
        link,
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 0.9,
          ease: EASE.rise,
          clearProps: 'transform',
          scrollTrigger: { trigger: mask, start: 'top 80%', once: true },
          onComplete: () => mask.removeAttribute('data-masking'),
        },
      );
      offs.push(() => mask.removeAttribute('data-masking'));
    }

    if (text && cond.wide) {
      const w = prim.weigh(text, { per: 'line', sweep: 'none', paused: true });
      offs.push(
        prim.interactive(
          link,
          () => {
            w.timeScale(1).play();
          },
          () => {
            w.timeScale(0.35 / 0.25).reverse();
          },
        ),
      );
    }
    if (go) offs.push(prim.magnet(go, 12));

    return () => {
      for (const off of offs) off();
    };
  });

  return () => {};
}
