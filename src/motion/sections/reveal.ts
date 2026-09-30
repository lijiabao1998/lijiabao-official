// src/motion/sections/reveal.ts — F0's generic [data-rise] handler, run once per page on <main> after every
// section module (so pins exist before these triggers are measured). Elements rise in batches as they reach
// 85% of the viewport, once, 0.06s apart (total capped at 0.6s).
//
//   data-rise           soft rise: y 24px → 0, opacity 0 → 1 (0.8s lj.rise)
//   data-rise="mask"    mask rise: yPercent 105 → 0 inside its [data-mask] parent (0.9s lj.rise)
//   data-rise="clip"    clip left → right: inset(0 100% 0 0) → inset(0) (0.48s lj.rise; #vision lists)
//   data-rise="fade"    opacity only (0.48s)
//
// Never hides content that is already on screen: items in the first viewport are left alone unless CSS has
// them hidden and the page is fresh (< 2.4s), so a slow runtime never makes visible text blink. Items already
// scrolled past (restored scroll, #hash, back/forward) stay at rest too: nobody would see them arrive.
// The runtime's fail-open (settle.ts) finishes anything in or above the viewport 2.5s after page-load.
// Reduced motion: nothing moves (rest state = the server HTML). Don't put [data-rise] on elements your own
// section module animates.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE, stagger, STAGGER } from '../eases';
import { inView, pageAge, qsa } from '../../lib/dom';

type Kind = 'soft' | 'mask' | 'clip' | 'fade';

const kindOf = (el: HTMLElement): Kind => {
  const v = el.dataset.rise;
  return v === 'mask' || v === 'clip' || v === 'fade' ? v : 'soft';
};

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const items = qsa('[data-rise]', root);
  if (!items.length) return () => {};
  const { gsap, ST } = ctx;

  ctx.mm.add({ full: MQ.full }, (c, contextSafe) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;

    // one batch of reads before any write
    const fresh = pageAge() < 2400;
    const todo = items.filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom <= 0) return false; // above the viewport: at rest
      if (!inView(r)) return true;
      return fresh && getComputedStyle(el).opacity === '0';
    });
    if (!todo.length) return;

    const masks = new Set<HTMLElement>();
    for (const el of todo) {
      const k = kindOf(el);
      if (k === 'mask' && el.parentElement?.hasAttribute('data-mask')) masks.add(el.parentElement);
    }
    for (const m of masks) m.setAttribute('data-masking', '');

    gsap.set(todo, { animation: 'none' });
    // Only set kinds that are present: gsap.set([]) logs "GSAP target not found".
    const preset = (kind: Kind, vars: gsap.TweenVars): void => {
      const els = todo.filter((el) => kindOf(el) === kind);
      if (els.length) gsap.set(els, vars);
    };
    preset('soft', { y: 24, opacity: 0 });
    preset('fade', { opacity: 0 });
    preset('mask', { yPercent: 105 });
    preset('clip', { clipPath: 'inset(0% 100% 0% 0%)' });

    const play = (batch: Element[]): void => {
      const each = stagger(STAGGER.item, batch.length);
      batch.forEach((node, i) => {
        const el = node as HTMLElement;
        const delay = i * each;
        switch (kindOf(el)) {
          case 'mask':
            gsap.to(el, {
              yPercent: 0,
              duration: 0.9,
              delay,
              ease: EASE.rise,
              clearProps: 'transform',
              onComplete: () => el.parentElement?.removeAttribute('data-masking'),
            });
            break;
          case 'clip':
            gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.m, delay, ease: EASE.rise, clearProps: 'clipPath' });
            break;
          case 'fade':
            gsap.to(el, { opacity: 1, duration: DUR.m, delay, ease: EASE.rise });
            break;
          default:
            gsap.to(el, { y: 0, opacity: 1, duration: 0.8, delay, ease: EASE.rise, clearProps: 'transform' });
        }
      });
    };
    const safePlay = (contextSafe ? contextSafe(play) : play) as (batch: Element[]) => void;

    ST.batch(todo, { start: 'top 85%', once: true, onEnter: (batch) => safePlay(batch) });

    return () => {
      for (const m of masks) m.removeAttribute('data-masking');
    };
  });

  return () => {};
}
