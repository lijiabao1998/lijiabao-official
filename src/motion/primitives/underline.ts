// primitives/underline.ts — text links (§5.4): a 1px underline scaleX 0 → 1 from the left (0.24s lj.rise),
// leaving to the right (lj.exit); mono or CJK links also gain +160 weight. Markup: an optional child [data-ul]
// line element. The static tier (and no JS) gets the same look from CSS, so this is an enhancement only.

import type { Primitives } from '../registry';
import { DUR, EASE } from '../eases';
import { isZh } from '../../lib/dom';
import type { PrimDeps } from './index';
import { restWeight } from './weigh';

export function makeUnderline(
  { gsap }: PrimDeps,
  interactive: Primitives['interactive'],
  weigh: Primitives['weigh'],
): Primitives['underline'] {
  return (el, o = {}) => {
    const line = el.querySelector<HTMLElement>('[data-ul]');
    const heavy = o.weight ?? (isZh(el) || /mono/i.test(getComputedStyle(el).fontFamily));
    if (!line && !heavy) return () => {};
    if (line) gsap.set(line, { scaleX: 0, transformOrigin: '0% 50%' });
    const w = heavy ? weigh(el, { to: restWeight(el) + 160, per: 'line', duration: DUR.s, paused: true }) : null;
    return interactive(
      el,
      () => {
        if (line)
          gsap.to(line, { scaleX: 1, transformOrigin: '0% 50%', duration: DUR.s, ease: EASE.rise, overwrite: true });
        w?.play();
      },
      () => {
        if (line)
          gsap.to(line, { scaleX: 0, transformOrigin: '100% 50%', duration: DUR.s, ease: EASE.exit, overwrite: true });
        w?.reverse();
      },
    );
  };
}
