// src/motion/sections/nf.ts — S6 (§5.3 #nf). The 404 has no record, so it has no light.
//
// - The empty lane: the time front scans the hairline under the digits from the left (prim.scan, lj.scan) and
//   finds nothing to light; its head is grey and fades at the end. Once per page, motion full only; the CSS
//   before-state in views/NotFound.astro fails open after 2.5s if this never runs.
// - `404` is Geist Mono (fixed advance), so weight never moves the layout (§2.2 weight-safety rule).
//   · fine pointer: the weight follows the pointer's x, 100 at the left edge → 900 at the right (quickTo, 0.4s);
//     each digit follows a little later than the one on its left, so the change travels left → right (law 2).
//     Leaving the window settles them back to 600.
//   · no hover pointer: they breathe 300 ↔ 700 over 4s, each a beat after its left neighbour, only while on screen.
//   · reduced motion, static tier, no JS: they rest at 600 (CSS).
// The pointer never carries or emits light (§2.5): it only changes the weight of the digits.
// Writes only (fontVariationSettings, transforms, opacity); the one layout read is prim.scan's line width.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE } from '../eases';
import { clamp, qs, qsa } from '../../lib/dom';

const REST = 600;
const MIN = 100;
const MAX = 900;
const LOW = 300;
const HIGH = 700;
/** extra follow time per digit (s): the weight change reads left → right */
const LAG = 0.08;
/** breathing offset per digit (s) */
const BEAT = 0.2;

type Conditions = { full?: boolean; fine?: boolean } | undefined;

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST } = ctx;
  const digits = qsa<HTMLElement>('[data-nf-d]', root);
  const code = qs<HTMLElement>('[data-nf-code]', root);
  const rule = qs<HTMLElement>('[data-nf-rule]', root);
  const head = qs<HTMLElement>('[data-nf-head]', root);

  // ── the empty lane: one scan per page (kept out of the pointer block so a pointer change never replays it)
  ctx.mm.add({ full: MQ.full }, (c) => {
    if (!(c.conditions as Conditions)?.full || !rule) return;
    gsap.set(rule, { animation: 'none' }); // take over from the CSS fail-open
    const tl = gsap.timeline({ delay: 0.2 });
    if (head) tl.to(head, { opacity: 1, duration: DUR.xs, ease: EASE.rise });
    tl.add(ctx.prim.scan(rule, head ? { dot: head, duration: 1.1 } : { duration: 1.1 }));
    if (head) tl.to(head, { opacity: 0, scale: 0.4, duration: DUR.s, ease: EASE.exit });
  });

  if (!digits.length) return () => {};

  // ── the digits' weight
  ctx.mm.add({ full: MQ.full, fine: MQ.fine }, (c) => {
    const cond = c.conditions as Conditions;
    if (!cond?.full) return;
    const state = digits.map(() => ({ w: REST }));
    const paint = digits.map((el, i) => (): void => {
      el.style.fontVariationSettings = `"wght" ${Math.round(state[i]?.w ?? REST)}`;
    });
    const restore = (): void => {
      for (const el of digits) el.style.fontVariationSettings = '';
    };

    if (cond.fine) {
      const to = state.map((s, i) => gsap.quickTo(s, 'w', { duration: 0.4 + i * LAG, ease: EASE.weigh, onUpdate: paint[i] }));
      let vw = Math.max(1, window.innerWidth);
      const onResize = (): void => {
        vw = Math.max(1, window.innerWidth);
      };
      const onMove = (e: PointerEvent): void => {
        if (e.pointerType === 'touch') return;
        const w = MIN + (MAX - MIN) * clamp(0, 1, e.clientX / vw);
        for (const t of to) t(w);
      };
      const onLeave = (): void => {
        for (const t of to) t(REST);
      };
      const docEl = document.documentElement;
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('resize', onResize, { passive: true });
      docEl.addEventListener('pointerleave', onLeave);
      return () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('resize', onResize);
        docEl.removeEventListener('pointerleave', onLeave);
        restore();
      };
    }

    // no hover pointer: breathe (rest → 700, then 300 ↔ 700, 2s each way), paused while off screen
    const tl = gsap.timeline({ paused: true });
    state.forEach((s, i) => {
      tl.to(s, { w: HIGH, duration: 1, ease: EASE.weigh, onUpdate: paint[i] }, i * BEAT).to(
        s,
        { w: LOW, duration: 2, ease: EASE.weigh, repeat: -1, yoyo: true, onUpdate: paint[i] },
        i * BEAT + 1,
      );
    });
    if (code) {
      ST.create({ trigger: code, start: 'top bottom', end: 'bottom top', animation: tl, toggleActions: 'play pause play pause' });
    } else {
      tl.play();
    }
    return restore;
  });

  return () => {};
}
