// src/motion/sections/gt-pass.ts — #gt-pass, the PASS grid (§5.3, §6.3, §7). Owner: S4.
//
// One progress value p ∈ [0, 1] drives three views of the same 12,513 records, so they can never disagree:
//   - the GL grid: engine handle `grid` → uProgress (cells ignite on the anti-diagonals from the LEFT corner);
//   - the CSS lattice poster (shown whenever GL is not live): `--p` reveals its lit copy left → right;
//   - the readout: exactly litCount(p) cells (gl/gen/grid.ts), written only when the number changes.
// Desktop with a fine pointer: the block pins for 150% of the viewport (the site's one pin on this page), scrub 0.6;
// the grid is fully lit at 86% of the pin and holds while the legend and the table link rise. Elsewhere (mobile,
// touch, tablets): no pin — the grid auto-ignites over 2.4s when it reaches 75% of the viewport.
// Reduced motion (or any failure before setup): the end state — everything lit, readout 12,513.
// Works with ctx.engine === null (the poster and readout still run).

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE, stagger } from '../eases';
import { qs } from '../../lib/dom';
import { litCount } from '../../gl/gen/grid';

type Conditions = { full?: boolean; desktop?: boolean; fine?: boolean };

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST } = ctx;
  const pin = qs('[data-pass-pin]', root);
  const stage = qs('[data-gl-scene="grid"]', root);
  const fig = qs('#fig-pass', root);
  if (!pin || !stage || !fig) return () => {};
  const readout = qs('[data-pass-x]', root);
  const poster = qs('[data-pass-poster]', root);
  const late = [qs('[data-legend]', fig), qs('summary', fig)].filter((el): el is HTMLElement => el !== null);
  const grid = ctx.engine?.get('grid') ?? null;
  const nf = new Intl.NumberFormat(ctx.locale === 'en' ? 'en' : 'zh-Hant-TW');

  let shown = -1;
  const apply = (p: number): void => {
    grid?.set('uProgress', p);
    poster?.style.setProperty('--p', p.toFixed(4));
    const n = litCount(p);
    if (n !== shown && readout) {
      shown = n;
      readout.textContent = nf.format(n);
    }
  };

  // opening the table while pinned changes the pinned block's height: re-measure
  const details = qs<HTMLDetailsElement>('details', fig);
  const onToggle = (): void => ST.refresh();
  details?.addEventListener('toggle', onToggle);

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, desktop: MQ.desktop, fine: MQ.fine }, (c, contextSafe) => {
    const { full, desktop, fine } = (c.conditions ?? {}) as Conditions;
    if (!full) {
      apply(1);
      return;
    }
    const proxy = { p: 0 };
    const update = (): void => apply(proxy.p);
    apply(0);

    if (desktop && fine) {
      gsap.set(late, { opacity: 0, y: 12 });
      const reveal = gsap.to(late, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: EASE.rise,
        stagger: stagger(0.08, late.length),
        paused: true,
      });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: pin, pin: true, start: 'top top', end: '+=150%', scrub: 0.6, invalidateOnRefresh: true },
      });
      tl.to(proxy, {
        p: 1,
        duration: 0.86,
        ease: 'none', // a linear map from scroll to records; the scrub smooths it
        onUpdate: () => {
          update();
          if (proxy.p >= 0.999) reveal.play();
          else if (proxy.p < 0.97 && reveal.progress() > 0 && !fig.contains(document.activeElement)) reveal.reverse();
        },
      });
      tl.to({}, { duration: 0.14 }); // hold: the whole grid lit, the legend and table link rising
      // keyboard: never focus an invisible control — anything in the figure taking focus shows them at once
      const onFocus = (): void => void reveal.play();
      fig.addEventListener('focusin', onFocus);
      return () => {
        fig.removeEventListener('focusin', onFocus);
        apply(1);
      };
    }

    // no pin: ignite once on enter (also when the page opens already scrolled past the grid)
    let done = false;
    const run = (): void => {
      if (done) return;
      done = true;
      gsap.to(proxy, { p: 1, duration: 2.4, ease: EASE.scan, onUpdate: update });
    };
    const ignite = (contextSafe ? contextSafe(run) : run) as () => void; // recorded, so a swap reverts it
    const st = ST.create({ trigger: stage, start: 'top 75%', once: true, onEnter: ignite });
    if (st.progress > 0) ignite();
    return () => apply(1);
  });

  return () => {
    details?.removeEventListener('toggle', onToggle);
  };
}
