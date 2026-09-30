// src/motion/sections/gt-lines.ts — #gt-lines, the fork timeline (§5.3). Owner: S4.
//
// figure#fig-fork has two drawings (wide ≥ 640px, tall below); only the visible one animates. A clip front reveals
// the three lanes in time order — from the left (wide) or from the top (tall) — scrubbed from `top 70%` to
// `bottom 60%` (scrub 0.6). Each node pops (scale 0 → 1, 0.3s lj.settle) and its label fades in as the front passes
// it; scrolling back reverses them. The three line columns above rise through the generic [data-rise].
// Reduced motion / static / no JS: everything drawn (the server HTML).

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE } from '../eases';
import { qs, qsa } from '../../lib/dom';

type Conditions = { full?: boolean; wide?: boolean };

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap } = ctx;

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, wide: '(min-width: 640px)' }, (c, contextSafe) => {
    const { full, wide } = (c.conditions ?? {}) as Conditions;
    if (!full) return;
    const v = qs(`[data-ft="${wide ? 'w' : 't'}"]`, root);
    const clip = v ? qs<SVGRectElement>('[data-ft-clip]', v) : null;
    if (!v || !clip) return;
    const nodes = qsa<SVGCircleElement>('[data-ft-node]', v);
    const labels = qsa('[data-ft-label]', v);
    const at = (el: Element): number => Number(el.getAttribute('data-at')) || 0;
    const items = [
      ...nodes.map((el) => ({ el: el as Element, at: at(el), node: true, on: false })),
      ...labels.map((el) => ({ el: el as Element, at: at(el), node: false, on: false })),
    ];

    const axis = wide ? 'scaleX' : 'scaleY';
    gsap.set(clip, { [axis]: 0, transformOrigin: '0% 0%' });
    gsap.set(nodes, { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(labels, { opacity: 0 });
    const setClip = gsap.quickSetter(clip, axis) as (v: number) => void;

    type Item = (typeof items)[number];
    const turn = (it: Item, on: boolean): void => {
      if (it.node) {
        gsap.to(it.el, on
          ? { scale: 1, duration: 0.3, ease: EASE.settle, overwrite: true }
          : { scale: 0, duration: DUR.s, ease: EASE.exit, overwrite: true });
      } else {
        gsap.to(it.el, { opacity: on ? 1 : 0, duration: DUR.s, ease: on ? EASE.rise : EASE.exit, overwrite: true });
      }
    };
    // tweens made from onUpdate are recorded in this context, so a swap or a breakpoint change reverts them
    const flip = (contextSafe ? contextSafe(turn) : turn) as (it: Item, on: boolean) => void;

    const proxy = { p: 0 };
    gsap.to(proxy, {
      p: 1,
      ease: 'none', // time on the axis maps linearly to scroll; the scrub smooths it
      scrollTrigger: { trigger: v, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 },
      onUpdate: () => {
        // the front sits a hair ahead of p so a node pops as the line reaches it, not after
        const p = proxy.p;
        setClip(p);
        for (const it of items) {
          const on = p >= it.at - 0.004;
          if (on === it.on) continue;
          it.on = on;
          flip(it, on);
        }
      },
    });
  });

  return () => {};
}
