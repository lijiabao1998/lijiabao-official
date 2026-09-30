// primitives/weigh.ts — weight gains (§2.2 weight-safety rule, §5.3). Animates font-variation-settings "wght".
// Callers own the weight-safety rule: per:'char' only on CJK (1em advance), Geist Mono, or locked single
// left-aligned Latin lines; body paragraphs never change weight. Text is split at resting weight.
// Hover pattern: `const w = prim.weigh(title, { per: 'char', sweep: 'ltr', paused: true })` → on: w.play(),
// off: w.reverse() (reverse runs lj.exit via easeReverse).

import type { Primitives, WeighOpts } from '../registry';
import { EASE, stagger } from '../eases';
import { isReduced } from '../../lib/prefs';
import type { PrimDeps } from './index';

/** Resting weight: the element's computed "wght" setting, else its font-weight. One style read. */
export function restWeight(el: Element): number {
  const cs = getComputedStyle(el);
  const m = /["']wght["']\s+(-?[\d.]+)/.exec(cs.fontVariationSettings);
  if (m?.[1]) return parseFloat(m[1]);
  return parseFloat(cs.fontWeight) || 400;
}

const fvs = (w: number): string => `"wght" ${Math.round(w)}`;

export function makeWeigh({ gsap }: PrimDeps, split: Primitives['split']): Primitives['weigh'] {
  return (el, o: WeighOpts = {}) => {
    const rest = o.from === undefined || o.to === undefined ? restWeight(el) : 0;
    const from = o.from ?? rest;
    const to = o.to ?? rest + 200;
    const targets: Element[] = o.per === 'char' ? split(el, 'chars').chars : [el];
    const still = isReduced();
    const each = o.sweep === 'none' || targets.length < 2 || still ? 0 : stagger(o.each ?? 0.018, targets.length);
    return gsap.fromTo(
      targets,
      { fontVariationSettings: fvs(from) },
      {
        fontVariationSettings: fvs(to),
        duration: still ? 0 : (o.duration ?? 0.35),
        ease: EASE.weigh,
        easeReverse: EASE.exit,
        stagger: each,
        paused: o.paused ?? false,
      },
    );
  };
}
