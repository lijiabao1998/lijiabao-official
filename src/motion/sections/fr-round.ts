// src/motion/sections/fr-round.ts — S5 (§5.3 #fr-round; §7 mobile + reduced motion).
//
// Server HTML = the end state (every gate filled, every detail shown). Three motion paths:
//   pin    desktop (≥1024 × ≥640 tall), fine pointer, motion full → [data-mode="pin"], pinned `top top` → `+=150%`,
//          scrub 0.6: a round glimmer runs through seven gates in 7 equal sub-ranges (parts.roundPos: it rests on a
//          gate, then glides to the next one and arrives exactly as that stage activates). The gate fills, the stage
//          name weighs in (CJK only; Latin changes colour, never width), the detail swaps with a mask rise. From stage
//          6 (記錄 / Record) the record shelf of failures rises, at the same weight as the passes.
//   stack  everything else with motion full (phones, tablets, short screens): no pin; each stage plays its own
//          sub-timeline once at `top 75%` (gate fills, detail rises); the shelf rises at `top 80%`.
//   still  reduced motion: nothing — the end state stays.
// No layout reads in onUpdate: gate spacing is read on refresh. Works without engine or Lenis.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE, stagger } from '../eases';
import { restWeight } from '../primitives/weigh';
import { isZh, qs, qsa } from '../../lib/dom';
import { roundPos } from '../../components/fr/parts';

const PIN = '(min-width: 1024px) and (min-height: 640px) and (pointer: fine)';
/** Stage index (0-based) from which the record shelf is up: 6 = 記錄 / Record. */
const SHELF_AT = 5;

type Setter = (v: number) => void;
type State = 'todo' | 'active' | 'done';

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap, ST, prim } = ctx;
  const rd = qs<HTMLElement>('[data-rd]', root);
  if (!rd) return () => {};
  const stages = qsa('[data-rd-stage]', rd);
  const names = stages.map((s) => qs<HTMLElement>('[data-rd-name]', s));
  const texts = stages.map((s) => qs<HTMLElement>('[data-rd-text]', s));
  const dot = qs<HTMLElement>('[data-rd-dot]', rd);
  const fill = qs<HTMLElement>('[data-rd-fill]', rd);
  const shelf = qs<HTMLElement>('[data-shelf]', rd);
  const shelfItems = qsa('[data-shelf-item]', rd);
  const n = stages.length;
  if (n < 2) return () => {};

  const setState = (el: HTMLElement, s: State | null): void => {
    if (s) el.dataset.state = s;
    else delete el.dataset.state;
  };

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, pin: PIN }, (c) => {
    const cond = (c.conditions ?? {}) as { full?: boolean; pin?: boolean };
    if (!cond.full) return;

    /* ------------------------------------------------------------------ stack (no pin) */
    if (!cond.pin) {
      const vh = window.innerHeight;
      // one batch of reads before any write
      const tops = stages.map((s) => s.getBoundingClientRect().top);
      const shelfTop = shelf ? shelf.getBoundingClientRect().top : 0;
      stages.forEach((stage, i) => {
        if ((tops[i] ?? 0) < vh * 0.75) return; // already on screen: leave it at rest
        setState(stage, 'todo');
        // the gate fills and the name brightens by CSS transition when the state clears
        ST.create({ trigger: stage, start: 'top 75%', once: true, onEnter: () => setState(stage, null) });
        const text = texts[i];
        if (text) prim.rise(text, { y: 16, duration: 0.7, trigger: { trigger: stage, start: 'top 75%' } });
      });
      if (shelf && shelfItems.length && shelfTop > vh * 0.8) {
        prim.rise(shelfItems, { stagger: 0.08, trigger: { trigger: shelf, start: 'top 80%' } });
      }
      return () => {
        for (const s of stages) setState(s, null);
      };
    }

    /* ------------------------------------------------------------------ pin */
    rd.dataset.mode = 'pin';
    const zh = isZh(rd);
    const rest = names[0] ? restWeight(names[0]) : 500;
    const setX = dot ? (gsap.quickSetter(dot, 'x', 'px') as Setter) : null;
    const setFill = fill ? (gsap.quickSetter(fill, 'scaleX') as Setter) : null;
    let step = 0;
    let current = -1;

    const measure = (): void => {
      const a = stages[0];
      const b = stages[1];
      step = a && b ? b.offsetLeft - a.offsetLeft : 0;
    };

    // the shelf waits below until stage 6; then it rises (and sinks back if the reader scrolls up)
    const shelfTl = gsap.timeline({ paused: true });
    if (shelfItems.length) {
      shelfTl.fromTo(
        shelfItems,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE.rise, stagger: stagger(0.08, shelfItems.length) },
      );
    }

    const activate = (i: number): void => {
      const prev = current;
      current = i;
      stages.forEach((s, j) => setState(s, j < i ? 'done' : j === i ? 'active' : 'todo'));

      // names: the active one weighs in (CJK only: 1em advance), the others return to rest
      if (zh) {
        names.forEach((el, j) => {
          if (!el || (j !== i && j !== prev)) return;
          gsap.to(el, {
            fontVariationSettings: `"wght" ${j === i ? rest + 200 : rest}`,
            duration: 0.35,
            ease: EASE.weigh,
            overwrite: true,
          });
        });
      }

      // details: the outgoing one leaves upward, the incoming one mask-rises
      const out = prev >= 0 ? texts[prev] : null;
      const inc = texts[i];
      if (out && out !== inc) {
        gsap.fromTo(
          out,
          { opacity: 1, yPercent: 0 },
          { opacity: 0, yPercent: -18, duration: DUR.s, ease: EASE.exit, overwrite: true, clearProps: 'opacity,transform' },
        );
      }
      if (inc) {
        const mask = inc.parentElement;
        mask?.setAttribute('data-masking', '');
        gsap.fromTo(
          inc,
          { opacity: 1, yPercent: prev < 0 ? 0 : i > prev ? 105 : -105 },
          {
            yPercent: 0,
            duration: prev < 0 ? 0 : 0.6,
            ease: EASE.rise,
            overwrite: true,
            clearProps: 'opacity,transform',
            onComplete: () => mask?.removeAttribute('data-masking'),
          },
        );
      }

      if (i >= SHELF_AT) shelfTl.play();
      else shelfTl.reverse();
    };

    const render = (p: number): void => {
      const pos = roundPos(p, n);
      setX?.(pos.u * step);
      setFill?.(pos.u / (n - 1));
      if (pos.active !== current) activate(pos.active);
    };

    const proxy = { p: 0 };
    measure();
    activate(0);
    render(0);
    gsap.to(proxy, {
      p: 1,
      ease: 'none',
      onUpdate: () => render(proxy.p),
      scrollTrigger: {
        trigger: rd,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefresh: () => {
          measure();
          render(proxy.p);
        },
      },
    });

    return () => {
      delete rd.dataset.mode;
      for (const s of stages) setState(s, null);
      for (const t of texts) t?.parentElement?.removeAttribute('data-masking');
    };
  });

  return () => {};
}
