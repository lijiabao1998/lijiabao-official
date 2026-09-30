// primitives/magnet.ts — magnetic pull on [data-magnet] only (§5.4): quickTo x/y, 0.5s lj.settle, capped.
// Only with a fine pointer, motion full and a tier other than static; never on keyboard focus or touch.
// The element's centre is read once per pointerenter (no layout reads while the pointer moves).

import type { Primitives } from '../registry';
import { EASE } from '../eases';
import { clamp, isFine } from '../../lib/dom';
import { getTier, isReduced } from '../../lib/prefs';
import type { PrimDeps } from './index';

const PULL = 0.35;

export function makeMagnet({ gsap }: PrimDeps): Primitives['magnet'] {
  return (el, max = 10) => {
    if (!isFine() || isReduced() || getTier() === 'static') return () => {};
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: EASE.settle });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: EASE.settle });
    let cx = 0;
    let cy = 0;
    let on = false;

    const enter = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      const r = el.getBoundingClientRect();
      cx = r.left + r.width / 2 - (Number(gsap.getProperty(el, 'x')) || 0);
      cy = r.top + r.height / 2 - (Number(gsap.getProperty(el, 'y')) || 0);
      on = true;
    };
    const move = (e: PointerEvent): void => {
      if (!on) return;
      xTo(clamp(-max, max, (e.clientX - cx) * PULL));
      yTo(clamp(-max, max, (e.clientY - cy) * PULL));
    };
    const leave = (): void => {
      if (!on) return;
      on = false;
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(el, 'x,y');
      gsap.set(el, { clearProps: 'transform' });
    };
  };
}
