// src/motion/sections/not.ts — S2 · §5.3 #not: the ONE pin on home.
//
// Desktop (≥ 1024px, not a coarse pointer), motion full: the stage pins `top top` (under the header) → `+=150%`,
// scrub 0.6. The statements behave like a log: the active one always sits in the LAST slot; the list starts two
// rows down and moves up one row as each statement enters, the earlier ones dimming. Per statement, in its
// third of the pin:
//   (a) X rises in its mask   (statement 1 rises as the stage comes into view, before the pin)
//   (b) two hairlines draw "=" from the left
//   (c) the amber slash draws through them, lower left → upper right: ≠   (the operator's reading fades in)
//   (d) Y fades in thin and weighs 200 → lit (CJK per character, left → right; Latin as one locked line)
//   (e) as the next statement enters, this one moves up one row and dims
// When the last Y has landed, the earlier statements come back to full: the record is complete (= the no-JS
// end state). Tablet / mobile / coarse pointers: no pin; each statement plays (a)–(d) once at `top 75%`.
// Reduced motion, or a stage already on screen when this runs: the resting state (all drawn, all lit).

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE } from '../eases';
import { qs, qsa } from '../../lib/dom';

/** Opacity of a statement that has been superseded (≈ --fg-2 on --bg). */
export const DIM = 0.62;
/** Y's weight before it lands, and its lit (= resting) weight: Display m rest 520 + 200. */
export const THIN = 200;
export const LIT = 720;
/** Timeline length in statement units (3 statements + the closing restore). */
export const TOTAL = 3.2;
/** When the earlier statements return to full. */
export const RESTORE = 2.95;

export interface Beats {
  /** the list moves up one row / the previous statement dims (statements after the first) */
  move: number;
  /** X rises (statements after the first) */
  x: number;
  bars: number;
  slash: number;
  y: number;
  weigh: number;
}

/** Start of each phase of statement `i` (0-based), in timeline units; statement i owns [i, i + 1). */
export function beats(i: number): Beats {
  return { move: i, x: i, bars: i + 0.22, slash: i + 0.44, y: i + 0.5, weigh: i + 0.55 };
}

/** The list's translateY while statement `i` is active: statement i sits where the last one rests. */
export function shift(tops: readonly number[], i: number): number {
  if (!tops.length) return 0;
  return (tops[tops.length - 1] ?? 0) - (tops[i] ?? 0);
}

const hasHan = (s: string): boolean => /[㐀-鿿豈-﫿]/.test(s);

interface Statement {
  st: HTMLElement;
  xm: HTMLElement | null;
  x: HTMLElement | null;
  bars: HTMLElement[];
  slash: HTMLElement | null;
  op: HTMLElement | null;
  y: HTMLElement | null;
}

function statement(st: HTMLElement): Statement {
  return {
    st,
    xm: qs('[data-not-xmask]', st),
    x: qs('[data-not-x]', st),
    bars: qsa('[data-neq-bar]', st),
    slash: qs('[data-neq-slash]', st),
    op: qs('[data-not-op]', st),
    y: qs('[data-not-y]', st),
  };
}

type Conds = { full?: boolean; desktop?: boolean; mobile?: boolean };

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const stage = qs('[data-not-stage]', root);
  const list = qs('[data-not-lines]', root);
  if (!stage || !list) return () => {};
  const sts = qsa('[data-not-st]', list).map(statement);
  if (!sts.length) return () => {};
  const { gsap, prim } = ctx;

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, desktop: MQ.desktop, mobile: MQ.mobile }, (c) => {
    const cond = (c.conditions ?? {}) as Conds;
    if (!cond.full) return;

    // one batch of reads before any write
    const vh = window.innerHeight;
    const stageTop = stage.getBoundingClientRect().top;
    const fresh = sts.map((s) => s.st.getBoundingClientRect().top >= vh);

    if (cond.desktop && !cond.mobile) {
      if (stageTop < vh) return; // on screen or scrolled past: a pin now would shift the page under the reader
      return pinned(stage, list);
    }
    return stacked(fresh);
  });

  /** Y: fade in thin, then weigh to lit. CJK per character (1em advances); Latin as one locked line. */
  function weighY(y: HTMLElement, duration: number): gsap.core.Tween {
    const cjk = hasHan(y.textContent ?? '');
    return prim.weigh(y, {
      from: THIN,
      to: LIT,
      per: cjk ? 'char' : 'line',
      sweep: cjk ? 'ltr' : 'none',
      each: 0.04,
      duration,
    });
  }

  function pinned(pinEl: HTMLElement, rows: HTMLElement): Cleanup {
    pinEl.classList.add('is-pin');
    const tops = (): number[] => sts.map((s) => s.st.offsetTop); // offsetTop ignores transforms
    const offset = (): number =>
      (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 72) + 24;

    // (a) for statement 1: it rises as the stage comes into view, so the stage never arrives empty
    const first = sts[0] as Statement;
    if (first.x && first.xm)
      gsap.fromTo(
        first.x,
        { yPercent: 105 },
        { yPercent: 0, duration: 0.9, ease: EASE.rise, scrollTrigger: { trigger: first.xm, start: 'top 88%', once: true } },
      );

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pinEl,
        pin: pinEl,
        start: () => `top top+=${offset()}`,
        end: '+=150%',
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        // a resize before the pin: re-seat the list in its first position with the new row heights
        onRefresh: (self) => {
          if (self.progress === 0) gsap.set(rows, { y: shift(tops(), 0) });
        },
      },
    });

    sts.forEach((s, i) => {
      const b = beats(i);
      if (i > 0) {
        // (e) for the previous statement, (a) for this one
        tl.fromTo(
          rows,
          { y: () => shift(tops(), i - 1) },
          { y: () => shift(tops(), i), duration: 0.3, ease: EASE.snap, immediateRender: i === 1 },
          b.move,
        );
        tl.to((sts[i - 1] as Statement).st, { opacity: DIM, duration: 0.3 }, b.move);
        if (s.x) tl.fromTo(s.x, { yPercent: 105 }, { yPercent: 0, duration: 0.3, ease: EASE.rise }, b.x);
      }
      if (s.bars.length)
        tl.fromTo(s.bars, { scaleX: 0 }, { scaleX: 1, duration: 0.2, stagger: 0.06, ease: EASE.scan }, b.bars);
      if (s.slash)
        tl.fromTo(
          s.slash,
          { scaleX: 0, rotation: -60, skewX: 0, skewY: 0 },
          { scaleX: 1, rotation: -60, skewX: 0, skewY: 0, duration: 0.16, ease: EASE.scan },
          b.slash,
        );
      if (s.op) tl.fromTo(s.op, { opacity: 0 }, { opacity: 1, duration: 0.14 }, b.slash);
      if (s.y) {
        tl.fromTo(s.y, { opacity: 0 }, { opacity: 1, duration: 0.12 }, b.y);
        tl.add(weighY(s.y, 0.3), b.weigh);
      }
    });
    const earlier = sts.slice(0, -1).map((s) => s.st);
    if (earlier.length) tl.to(earlier, { opacity: 1, duration: 0.2 }, RESTORE);
    tl.set({}, {}, TOTAL);

    return () => pinEl.classList.remove('is-pin');
  }

  function stacked(fresh: boolean[]): Cleanup {
    const masks: HTMLElement[] = [];
    sts.forEach((s, i) => {
      if (!fresh[i]) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: s.st, start: 'top 75%', once: true } });
      if (s.x && s.xm) {
        const xm = s.xm;
        xm.setAttribute('data-masking', '');
        masks.push(xm);
        tl.fromTo(
          s.x,
          { yPercent: 105 },
          {
            yPercent: 0,
            duration: 0.8,
            ease: EASE.rise,
            clearProps: 'transform',
            onComplete: () => xm.removeAttribute('data-masking'),
          },
          0,
        );
      }
      if (s.bars.length)
        tl.fromTo(s.bars, { scaleX: 0 }, { scaleX: 1, duration: 0.4, stagger: 0.08, ease: EASE.scan }, 0.3);
      if (s.slash)
        tl.fromTo(s.slash, { scaleX: 0, rotation: -60, skewX: 0, skewY: 0 }, { scaleX: 1, rotation: -60, skewX: 0, skewY: 0, duration: 0.35, ease: EASE.scan }, 0.6);
      if (s.op) tl.fromTo(s.op, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: EASE.rise }, 0.6);
      if (s.y) {
        tl.fromTo(s.y, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE.rise }, 0.75);
        // below 1024px lines may wrap: only CJK (1em advances) changes weight here
        if (hasHan(s.y.textContent ?? '')) tl.add(weighY(s.y, 0.45), 0.8);
      }
    });
    return () => {
      for (const m of masks) m.removeAttribute('data-masking');
    };
  }

  return () => {};
}
