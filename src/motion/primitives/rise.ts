// primitives/rise.ts — "rise into place" (§5.3). Two forms, picked per element:
// - mask rise: the element's parent carries [data-mask] → yPercent 105 → 0, clipped by the parent (the parent gets
//   [data-masking] = overflow:clip only while it animates, base.css — reflow and text-spacing stay safe);
// - soft rise: y 24px → 0 with opacity 0 → 1 (opacity, not visibility, so hidden items stay focusable).
// Defaults: 0.8s lj.rise, stagger 0.06 capped at 0.6s total (§5.1).

import type { Primitives, RiseOpts } from '../registry';
import { EASE, stagger, STAGGER } from '../eases';
import { isReduced } from '../../lib/prefs';
import type { PrimDeps } from './index';

export function makeRise({ gsap }: PrimDeps): Primitives['rise'] {
  return (els, o: RiseOpts = {}) => {
    const list = (Array.isArray(els) ? els : [els]).filter((e): e is Element => !!e);
    const vars: gsap.TimelineVars = {};
    if (o.delay) vars.delay = o.delay;
    if (o.trigger && list.length)
      vars.scrollTrigger = { start: 'top 85%', once: true, ...o.trigger, trigger: o.trigger.trigger ?? list[0] };
    const tl = gsap.timeline(vars);
    if (!list.length || isReduced()) return tl;

    const masks: Element[] = [];
    const masked: Element[] = [];
    const soft: Element[] = [];
    for (const el of list) {
      const p = el.parentElement;
      if (p?.hasAttribute('data-mask')) {
        masked.push(el);
        if (!masks.includes(p)) masks.push(p);
      } else soft.push(el);
    }
    const each = stagger(o.stagger ?? STAGGER.item, list.length);
    const duration = o.duration ?? 0.8;

    // cancel any CSS fail-open animation so the inline state rules while we animate
    gsap.set(list, { animation: 'none' });
    const clip = (on: boolean): void => {
      for (const m of masks) {
        if (on) m.setAttribute('data-masking', '');
        else m.removeAttribute('data-masking');
      }
    };
    if (masks.length) {
      clip(true);
      tl.eventCallback('onInterrupt', () => clip(false));
    }
    if (masked.length)
      tl.fromTo(masked, { yPercent: 105 }, { yPercent: 0, duration, ease: EASE.rise, stagger: each }, 0);
    if (soft.length)
      tl.fromTo(
        soft,
        { y: o.y ?? 24, opacity: 0 },
        { y: 0, opacity: 1, duration, ease: EASE.rise, stagger: each, clearProps: 'transform' },
        masked.length ? each : 0,
      );
    if (masks.length) tl.call(() => clip(false));
    return tl;
  };
}
