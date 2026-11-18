// src/motion/sections/method.ts — S2 · §5.3 #method.
//
// Chain (`top 70%` → `top 30%`, scrub 0.5): five equal sub-ranges. In each, the → hairline draws from the left
// (scaleX), its chevron draws when the line lands (stroke-dashoffset on pathLength = 1), and the step it leads
// into lights (opacity; body text never changes weight, §2.2). Step 1 has no arrow: it lights on its own.
// Reduced motion: nothing moves. Anything already on screen when this runs keeps its resting state.
// (The owner's quote and its character rise left the section on 2026-11-18.)

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE } from '../eases';
import { qs, qsa } from '../../lib/dom';

/** Opacity of a step before it is lit (the step exists before its arrow reaches it). */
export const UNLIT = 0.22;

export interface ChainWindow {
  /** [start, duration] in timeline units; step i owns [i, i + 1). */
  line: [number, number] | null;
  head: [number, number] | null;
  term: [number, number];
}

/** The sub-range of step `i` of the chain (5 equal sub-ranges, §5.3). */
export function chainWindow(i: number, hasArrow: boolean): ChainWindow {
  if (!hasArrow) return { line: null, head: null, term: [i + 0.15, 0.6] };
  return { line: [i, 0.55], head: [i + 0.48, 0.14], term: [i + 0.58, 0.37] };
}

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const chain = qs('[data-chain]', root);
  const { gsap } = ctx;

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;
    // a chain already on screen keeps its resting state
    if (chain && chain.getBoundingClientRect().top >= window.innerHeight) steps(chain);
  });

  function steps(list: HTMLElement): void {
    const items = qsa('[data-chain-step]', list);
    if (!items.length) return;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: list, start: 'top 70%', end: 'top 30%', scrub: 0.5 },
    });
    items.forEach((item, i) => {
      const line = qs('[data-chain-line]', item);
      const head = item.querySelector<SVGPathElement>('[data-chain-head]');
      const term = qs('[data-chain-term]', item);
      const w = chainWindow(i, !!line);
      if (line && w.line)
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: w.line[1], ease: EASE.scan }, w.line[0]);
      if (head && w.head) tl.fromTo(head, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: w.head[1] }, w.head[0]);
      if (term) tl.fromTo(term, { opacity: UNLIT }, { opacity: 1, duration: w.term[1], ease: EASE.weigh }, w.term[0]);
    });
    // pad to five full sub-ranges so every step owns an equal slice of the scroll
    tl.set({}, {}, items.length);
  }

  return () => {};
}
