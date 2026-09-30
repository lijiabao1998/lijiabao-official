// src/motion/sections/vision.ts — #vision (§5.3).
//
// Manifesto slot (`top 75%`, once): the line mask-rises, then one light passes left → right: the hairline beneath it
// scans in (lj.scan) and, as the head crosses each glyph, zh characters weigh in from --w-dim to rest (CJK has a 1em
// advance, so no reflow — §2.2 weight-safety). Latin never changes weight here: en terms fade in behind the head,
// as do the arrows. Content already on screen at setup stays at rest.
// Lists, the reading, tier cards and the readout's title rise through the generic [data-rise] reveal.
// Measured readout: re-counts as an odometer (prim.tick) when it first comes into view, and again once the bytes
// settle after a tier switch — never for every lazy load in between.
// Reduced motion: nothing moves (the server HTML is the end state). Works with ctx.engine / ctx.lenis === null.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE } from '../eases';
import { restWeight } from '../primitives/weigh';
import { on } from '../../lib/events';
import { inView, qsa } from '../../lib/dom';

const fvs = (w: number): string => `"wght" ${Math.round(w)}`;

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST, prim } = ctx;
  const mf = root.querySelector<HTMLElement>('[data-vi-mf]');
  const chain = mf?.querySelector<HTMLElement>('.vi-chain') ?? null;
  const set = mf?.querySelector<HTMLElement>('[data-vi-set]') ?? null;
  const line = mf?.querySelector<HTMLElement>('[data-vi-scan]') ?? null;
  const terms = mf ? qsa<HTMLElement>('[data-vi-term]', mf) : [];
  const arrows = mf ? qsa<HTMLElement>('[data-vi-arrow]', mf) : [];
  const zh = ctx.locale === 'zh-Hant';

  const box = root.querySelector<HTMLElement>('[data-measured]');
  const fig = box?.querySelector<HTMLElement>('.me-fig') ?? null;
  const value = box?.querySelector<HTMLElement>('[data-me-kb]') ?? null;
  const odo = box?.querySelector<HTMLElement>('[data-me-odo]') ?? null;
  let timer = 0;
  let offTier: (() => void) | null = null;
  let offMeasured: (() => void) | null = null;

  ctx.mm.add({ full: MQ.full }, (c, contextSafe) => {
    if (!(c.conditions as { full?: boolean }).full) return;
    const safe = <A extends unknown[]>(fn: (...a: A) => void): ((...a: A) => void) =>
      (contextSafe ? contextSafe(fn) : fn) as (...a: A) => void;

    /* ---- the manifesto: one pass of light ------------------------------------------------ */
    if (chain && set && line && terms.length && !inView(chain.getBoundingClientRect())) {
      const rest = restWeight(chain);
      const dim = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--w-dim')) || 160;
      // zh: per character; en: per term
      const glyphs: HTMLElement[] = zh ? terms.flatMap((t) => prim.split(t, 'chars').chars as HTMLElement[]) : terms;
      gsap.set(set, { yPercent: 105 });
      gsap.set(line, { scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(arrows, { opacity: 0 });
      if (zh) gsap.set(glyphs, { fontVariationSettings: fvs(dim) });
      else gsap.set(glyphs, { opacity: 0 });
      chain.setAttribute('data-masking', '');

      const play = safe(() => {
        // one batch of reads: where each glyph and arrow sits along the hairline (0..1)
        const lr = line.getBoundingClientRect();
        const at = (el: HTMLElement): number => {
          const r = el.getBoundingClientRect();
          return lr.width > 0 ? (r.left + r.width / 2 - lr.left) / lr.width : 0;
        };
        const gx = glyphs.map(at);
        const ax = arrows.map(at);
        const lit = new Uint8Array(glyphs.length);
        const shown = new Uint8Array(arrows.length);
        const tl = gsap.timeline({ onComplete: () => chain.removeAttribute('data-masking') });
        tl.to(set, { yPercent: 0, duration: 0.9, ease: EASE.rise }, 0);
        tl.add(
          prim.scan(line, {
            duration: 0.9,
            onProgress: (p) => {
              for (let i = 0; i < glyphs.length; i++) {
                if (lit[i] || (gx[i] as number) > p) continue;
                lit[i] = 1;
                const g = glyphs[i] as HTMLElement;
                if (zh) gsap.to(g, { fontVariationSettings: fvs(rest), duration: 0.45, ease: EASE.weigh });
                else gsap.to(g, { opacity: 1, duration: DUR.m, ease: EASE.rise });
              }
              for (let i = 0; i < arrows.length; i++) {
                if (shown[i] || (ax[i] as number) > p) continue;
                shown[i] = 1;
                gsap.to(arrows[i] as HTMLElement, { opacity: 1, duration: DUR.m, ease: EASE.rise });
              }
            },
          }),
          0.12,
        );
      });
      ST.create({ trigger: chain, start: 'top 75%', once: true, onEnter: () => play() });
    }

    /* ---- the measured readout: an odometer on first view and after a tier switch -------- */
    if (box && fig && value && odo) {
      let seen = false;
      // setup itself follows a load or a static → lite switch: let the first seconds of chunk loads settle too
      let switchedAt = performance.now();
      let last = '';
      const tick = safe(() => {
        const text = value.textContent ?? '';
        if (!text || text === last || !ST.isInViewport(box)) return;
        last = text;
        odo.textContent = text;
        fig.setAttribute('data-ticking', '');
        prim.tick(odo).call(() => {
          fig.removeAttribute('data-ticking');
          odo.textContent = ''; // the overlay only exists while it runs
        });
      });
      ST.create({
        trigger: box,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          seen = true;
          tick();
        },
      });
      const onMeasured = (): void => {
        if (!seen || performance.now() - switchedAt > 4000) return;
        window.clearTimeout(timer);
        timer = window.setTimeout(tick, 700);
      };
      box.addEventListener('lj-measured', onMeasured);
      offMeasured = () => box.removeEventListener('lj-measured', onMeasured);
      offTier = on('lj:tier', (d) => {
        if (d.reason) switchedAt = performance.now();
      });
    }

    return () => {
      window.clearTimeout(timer);
      offTier?.();
      offMeasured?.();
      offTier = offMeasured = null;
      fig?.removeAttribute('data-ticking');
      if (odo) odo.textContent = '';
      chain?.removeAttribute('data-masking');
    };
  });

  return () => {
    window.clearTimeout(timer);
    offTier?.();
    offMeasured?.();
  };
}
