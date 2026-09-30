// src/motion/sections/fr-hero.ts — S5 (§5.3 #fr-hero, #fr-hero matrix).
//
// Everything in the hero is readable from the first paint; nothing is hidden or dimmed while the runtime loads.
// On arrival (motion full, page fresh, hero in view) three things happen once:
//   1. the h1 — only on a direct load (a ClientRouter arrival already morphed it via view transition): the light
//      passes through the name left → right, each character rest → lit → rest (0.8s lj.weigh, 0.02 stagger). CJK
//      has a 1em advance and the Latin title is one locked, left-aligned line (§2.2 weight-safety);
//   2. the fact chips settle: scale .92 → 1 (0.48s lj.settle, 0.05);
//   3. the matrix: the governance spine draws in light first (top → bottom), then each row lights its cards
//      left → right (rows 0.03 apart), each card a brief amber pass that returns to rest (0.6s).
// Reduced motion / static: nothing runs (the server HTML is the end state). Works without engine or Lenis.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE, stagger } from '../eases';
import { restWeight } from '../primitives/weigh';
import { inView, isZh, pageAge, qs, qsa } from '../../lib/dom';

/** A page older than this was already shown in full (late runtime): don't replay the arrival. */
const FRESH_MS = 2400;

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, prim } = ctx;
  const line = qs<HTMLElement>('[data-frh-title] .display__line', root);
  const chips = qsa('[data-frh-chip]', root);
  const light = qs<HTMLElement>('[data-mx-light]', root);
  const rows = qsa('#fig-matrix .mx-row', root).map((r) => qsa('.mx-c', r));

  const age = pageAge();
  // pageAge() restarts on every ClientRouter swap; equal to performance.now() only on the first document.
  const direct = performance.now() - age < 1;

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;
    if (age > FRESH_MS || !inView(root.getBoundingClientRect())) return;

    const tl = gsap.timeline({ delay: direct ? 0.1 : 0.35 });

    // 1 · h1: rest → lit → rest, per character, left → right
    if (direct && line && (isZh(line) || window.innerWidth >= 640)) {
      const rest = restWeight(line);
      const split = prim.split(line, 'chars');
      const chars = split.chars;
      if (chars.length) {
        gsap.set(line, { whiteSpace: 'nowrap' });
        tl.to(
          chars,
          {
            keyframes: [
              { fontVariationSettings: `"wght" ${rest + 200}`, duration: 0.35, ease: EASE.weigh },
              { fontVariationSettings: `"wght" ${rest}`, duration: 0.45, ease: EASE.weigh },
            ],
            stagger: stagger(0.02, chars.length),
          },
          0,
        );
        tl.call(
          () => {
            split.revert();
            gsap.set(line, { clearProps: 'whiteSpace' });
          },
          undefined,
          '>',
        );
      }
    }

    // 2 · chips settle
    if (chips.length) {
      tl.fromTo(
        chips,
        { scale: 0.92 },
        { scale: 1, duration: 0.48, ease: EASE.settle, stagger: stagger(0.05, chips.length), clearProps: 'transform' },
        0.1,
      );
    }

    // 3 · matrix: the spine draws in light, then the rows light left → right
    const at = 0.15;
    if (light) {
      tl.fromTo(light, { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.6, ease: EASE.scan }, at);
      tl.to(light, { opacity: 0, duration: 0.5, ease: EASE.rise }, at + 0.6);
    }
    const flat = rows.flat();
    if (flat.length) {
      const rowOf: number[] = [];
      const colOf: number[] = [];
      rows.forEach((cells, r) =>
        cells.forEach((_, c) => {
          rowOf.push(r);
          colOf.push(c);
        }),
      );
      tl.to(
        flat,
        {
          keyframes: [
            { '--lit': 1, duration: 0.16, ease: EASE.rise },
            { '--lit': 0, duration: 0.44, ease: EASE.weigh },
          ],
          stagger: (i: number) => (rowOf[i] ?? 0) * 0.03 + (colOf[i] ?? 0) * 0.02,
        },
        at + 0.35,
      );
    }
  });

  return () => {};
}
