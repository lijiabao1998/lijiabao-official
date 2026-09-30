// src/motion/sections/work.ts — S2 · §5.3 #work rows.
//
// Enter (each row, `top 85%`, once): the lane hairline scans in from its record point (0.9s lj.scan); the title
// mask-rises (0.9s lj.rise); kicker, summary and facts rise y 8 → 0 (0.6s, +0.15s, 0.08 apart); the arrow slides
// x −8 → 0; the mini lights left → right — the CSS lattice by clip-path inset(0 100% 0 0) → inset(0), the matrix
// spine first and then its 150 cards row by row, 0.004s apart.
// Hover == focus-visible (prim.interactive): the title weighs rest → lit as a left-to-right sweep — CJK per
// character (0.018s), Latin as one locked line — over 0.35s lj.weigh, leaving in 0.25s lj.exit (easeReverse).
// The row dot turns amber in CSS; the arrow is magnetic (≤ 10px, fine pointer only).
// Reduced motion: nothing moves (the server HTML is the end state; CSS gives the instant hover).
// Rows already on screen when this runs keep their resting state (no blink on reload / hash jumps).

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE, STAGGER, stagger } from '../eases';
import { qs, qsa } from '../../lib/dom';

/** CJK text (1em advances): safe to weigh per character (§2.2 weight-safety rule). */
export const hasHan = (s: string): boolean => /[㐀-鿿豈-﫿]/.test(s);

/** Seconds the hover weigh takes to leave (§5.3), expressed as a timeScale on the 0.35s tween. */
export const LEAVE_SCALE = 0.35 / 0.25;

interface Row {
  row: HTMLElement;
  line: HTMLElement | null;
  dot: HTMLElement | null;
  mask: HTMLElement | null;
  title: HTMLElement | null;
  metas: HTMLElement[];
  cta: HTMLElement | null;
  arrow: HTMLElement | null;
  go: HTMLElement | null;
  lattice: HTMLElement | null;
  spine: HTMLElement | null;
  cells: HTMLElement[];
  legend: HTMLElement | null;
}

function parts(row: HTMLElement): Row {
  return {
    row,
    line: qs('[data-wrow-line]', row),
    dot: qs('[data-wrow-dot]', row),
    mask: qs('[data-wrow-mask]', row),
    title: qs('[data-wrow-title]', row),
    metas: qsa('[data-wrow-meta]', row),
    cta: qs('[data-wrow-cta]', row),
    arrow: qs('[data-arrow]', row),
    go: qs('[data-wrow-go]', row),
    lattice: qs('.lattice', row),
    spine: qs('[data-mm-spine]', row),
    cells: qsa('[data-mm-cell]', row),
    legend: qs('.legend', row),
  };
}

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const rows = qsa('[data-work-row]', root).map(parts);
  if (!rows.length) return () => {};
  const { gsap, prim } = ctx;

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce }, (c) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;

    // one batch of reads before any write
    const vh = window.innerHeight;
    const fresh = rows.map((r) => r.row.getBoundingClientRect().top >= vh);

    const offs: Cleanup[] = [];
    rows.forEach((r, i) => {
      if (fresh[i]) enter(r);
      offs.push(hover(r));
    });
    return () => {
      for (const off of offs) off();
      for (const r of rows) r.mask?.removeAttribute('data-masking');
    };
  });

  function enter(r: Row): void {
    const tl = gsap.timeline({ scrollTrigger: { trigger: r.row, start: 'top 85%', once: true } });

    if (r.dot) tl.fromTo(r.dot, { scale: 0 }, { scale: 1, duration: DUR.s, ease: EASE.settle }, 0);
    if (r.line) tl.fromTo(r.line, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: EASE.scan }, 0);

    if (r.title && r.mask) {
      const mask = r.mask;
      mask.setAttribute('data-masking', '');
      tl.fromTo(
        r.title,
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 0.9,
          ease: EASE.rise,
          clearProps: 'transform',
          onComplete: () => mask.removeAttribute('data-masking'),
        },
        0.08,
      );
    }

    const each = stagger(0.08, r.metas.length);
    if (r.metas.length)
      tl.fromTo(
        r.metas,
        { y: 8, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE.rise, stagger: each, clearProps: 'transform' },
        0.23,
      );
    const late = 0.23 + each * r.metas.length;
    if (r.cta) tl.fromTo(r.cta, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: EASE.rise }, late);
    if (r.arrow) tl.fromTo(r.arrow, { x: -8 }, { x: 0, duration: 0.6, ease: EASE.rise, clearProps: 'transform' }, late);

    // the mini lights left → right (law 2)
    if (r.lattice)
      tl.fromTo(
        r.lattice,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE.scan, clearProps: 'clipPath' },
        0.3,
      );
    if (r.spine) tl.fromTo(r.spine, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: EASE.scan }, 0.3);
    if (r.cells.length)
      tl.fromTo(
        r.cells,
        { opacity: 0.12 },
        { opacity: 1, duration: 0.3, ease: EASE.rise, stagger: 0.004, clearProps: 'opacity' },
        0.55,
      );
    if (r.legend) tl.fromTo(r.legend, { opacity: 0 }, { opacity: 1, duration: DUR.m, ease: EASE.rise }, 0.9);
  }

  function hover(r: Row): Cleanup {
    const offs: Cleanup[] = [];
    // weigh the aria-hidden visual copy (<Display animate>), never the heading's accessible text
    const vis = r.title ? (qs('.display__set', r.title) ?? r.title) : null;
    if (vis) {
      const cjk = hasHan(vis.textContent ?? '');
      const w = prim.weigh(
        vis,
        cjk
          ? { per: 'char', sweep: 'ltr', each: STAGGER.charMax, paused: true }
          : { per: 'line', sweep: 'none', paused: true },
      );
      offs.push(
        prim.interactive(
          r.row,
          () => {
            w.timeScale(1).play();
          },
          () => {
            w.timeScale(LEAVE_SCALE).reverse();
          },
        ),
      );
    }
    if (r.go) offs.push(prim.magnet(r.go, 10));
    return () => {
      for (const off of offs) off();
    };
  }

  return () => {};
}
