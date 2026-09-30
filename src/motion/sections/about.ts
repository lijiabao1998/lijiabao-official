// src/motion/sections/about.ts — #about (§5.3): the glimmer portrait assembles as it scrolls in.
// `top 90%` → `center 55%` of the stage, scrub 1: the scene's uAssemble 0 → 1 (rows settle top → bottom, points
// left → right, each sliding along its own row; see gl/shaders/portrait.vert). Reduced motion: one still frame,
// assembled (uAssemble = 1). Scrolling back up takes it apart again: the scrub is the only driver.
// The text column rises through the generic [data-rise] reveal (About.astro), so nothing else moves here.
// Also reports the scene's live point count to the caption (Portrait.astro reads [data-pt-count]).
// Works with ctx.engine === null (the mock / no GL) and ctx.lenis === null.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { on } from '../../lib/events';

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const stage = root.querySelector<HTMLElement>('[data-gl-scene="portrait"]');
  if (!stage) return () => {};
  const engine = ctx.engine;
  const assemble = (v: number): void => engine?.get('portrait')?.set('uAssemble', v);

  const report = (): void => {
    const n = engine?.get('portrait')?.count ?? 0;
    if (n > 0) stage.dataset.ptCount = String(n);
    else delete stage.dataset.ptCount;
  };
  const off = on('lj:gl', report);
  report();

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c) => {
    if (!(c.conditions as { full?: boolean }).full) {
      assemble(1);
      return;
    }
    // scattered until the scrub says otherwise (never a flash of the finished face before it assembles)
    assemble(0);
    const p = { v: 0 };
    ctx.gsap.to(p, {
      v: 1,
      ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top 90%', end: 'center 55%', scrub: 1 },
      onUpdate: () => assemble(p.v),
    });
    return () => assemble(1);
  });

  return () => {
    off();
    delete stage.dataset.ptCount;
  };
}
