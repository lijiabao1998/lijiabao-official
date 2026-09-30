// src/motion/sections/fr-round.ts — S5 (§5.3 #fr-round; §7 mobile + reduced motion).
//
// Server HTML = the end state (every gate filled, every detail shown). Three motion paths:
//   pin    desktop (≥1024 × ≥640 tall), fine pointer, motion full → [data-mode="pin"], pinned `top top` → `+=150%`,
//          scrub 0.6: a round glimmer runs through seven gates in 7 equal sub-ranges (parts.roundPos: it rests on a
//          gate, then glides to the next one and arrives exactly as that stage activates). The gate fills, the stage
//          name weighs in (CJK only; Latin changes colour, never width), the detail swaps: a STRICT cross-fade in the
//          one cell all seven details share — the outgoing one fades out first (0.2s lj.exit), only then does the
//          incoming one mask-rise; never two at once, however fast the scrub. A polite live region announces the
//          active stage (name + detail). From stage 6 (記錄 / Record) the record shelf — title and failures — rises,
//          at the same weight as the passes; before that it is not shown at all (no title over an empty shelf), after
//          the pin it stays up. Opacity only: the shelf's source links stay focusable, and focusing one shows it.
//   stack  everything else with motion full (phones, tablets, short screens): no pin; each stage plays its own
//          sub-timeline once at `top 75%` (gate fills, detail rises); the shelf rises at `top 80%`.
//   still  reduced motion: nothing — the end state stays.
// No layout reads in onUpdate: gate spacing is read on refresh. Works without engine or Lenis.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { EASE, stagger } from '../eases';
import { restWeight } from '../primitives/weigh';
import { isZh, qs, qsa } from '../../lib/dom';
import { roundPos } from '../../components/fr/parts';

const PIN = '(min-width: 1024px) and (min-height: 640px) and (pointer: fine)';
/** Stage index (0-based) from which the record shelf is up: 6 = 記錄 / Record. */
const SHELF_AT = 5;
/** Cross-fade: the outgoing detail leaves in OUT seconds; the incoming one starts only then. */
const OUT = 0.2;

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
  const live = qs<HTMLElement>('[data-rd-live]', rd);
  const shelf = qs<HTMLElement>('[data-shelf]', rd);
  const shelfItems = qsa('[data-shelf-item]', rd);
  const shelfTitle = shelf ? qs<HTMLElement>('.shelf-title', shelf) : null;
  const n = stages.length;
  if (n < 2) return () => {};

  const setState = (el: HTMLElement, s: State | null): void => {
    if (s) el.dataset.state = s;
    else delete el.dataset.state;
  };

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, pin: PIN }, (c, contextSafe) => {
    const cond = (c.conditions ?? {}) as { full?: boolean; pin?: boolean };
    if (!cond.full) return;

    /* ------------------------------------------------------------------ stack (no pin) */
    if (!cond.pin) {
      const vh = window.innerHeight;
      // one batch of reads before any write
      const tops = stages.map((s) => s.getBoundingClientRect().top);
      const shelfTop = shelf ? shelf.getBoundingClientRect().top : 0;
      stages.forEach((stage, i) => {
        if ((tops[i] ?? 0) < vh) return; // already on screen (or above): leave it at rest
        setState(stage, 'todo');
        // the gate fills and the name brightens by CSS transition when the state clears
        ST.create({ trigger: stage, start: 'top 75%', once: true, onEnter: () => setState(stage, null) });
        const text = texts[i];
        if (text) prim.rise(text, { y: 16, duration: 0.7, trigger: { trigger: stage, start: 'top 75%' } });
      });
      if (shelf && shelfItems.length && shelfTop >= vh) {
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

    // the shelf — its title and its failures — is not shown before stage 6; then it rises (and sinks back if the
    // reader scrolls up). Opacity only: its links stay focusable, and focus inside shows it at once.
    const shelfParts = [shelfTitle, ...shelfItems].filter((el): el is HTMLElement => !!el);
    const shelfTl = gsap.timeline({ paused: true });
    if (shelfParts.length) {
      shelfTl.fromTo(
        shelfParts,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: EASE.rise, stagger: stagger(0.08, shelfParts.length) },
      );
    }
    const onShelfFocus = (): void => void shelfTl.play();
    shelf?.addEventListener('focusin', onShelfFocus);

    const texts$ = texts.filter((t): t is HTMLElement => !!t);
    const say = (i: number): void => {
      if (!live) return;
      const name = names[i]?.textContent?.trim() ?? '';
      const detail = texts[i]?.textContent?.trim() ?? '';
      live.textContent = name && detail ? `${name}${live.dataset.sep ?? ' '}${detail}` : name || detail;
    };

    /** the running swap (outgoing fade → incoming mask-rise): a newer activation kills it */
    let swap: gsap.core.Timeline | null = null;
    /** How much of `t` is on screen right now: its opacity, 0 when it sits entirely outside its mask. */
    const shown = (t: HTMLElement): number => {
      const o = Number(gsap.getProperty(t, 'opacity')) || 0;
      const y = Math.abs(Number(gsap.getProperty(t, 'yPercent')) || 0);
      return y >= 100 && t.parentElement?.hasAttribute('data-masking') ? 0 : o;
    };

    const activate = (i: number): void => {
      const prev = current;
      current = i;
      // read what the outgoing detail shows BEFORE the states change (its CSS opacity follows the state)
      const out = prev >= 0 && prev !== i ? (texts[prev] ?? null) : null;
      const outAlpha = out ? shown(out) : 0;
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

      // details, a STRICT cross-fade in their shared cell. Every step is explicit, so no interrupted swap can leave
      // a detail showing: the running swap stops; every detail but the outgoing and the incoming one is hidden
      // outright (inline opacity 0, unmasked, in place); the outgoing one fades out from where it is (if it shows at
      // all); the incoming one is held hidden and mask-rises only once the outgoing one is gone.
      const inc = texts[i] ?? null;
      swap?.kill();
      swap = null;
      for (const t of texts$) {
        if (t === out || t === inc) continue;
        t.parentElement?.removeAttribute('data-masking');
        // (only when it is not already there: every set is recorded in this context until it reverts)
        if (Number(gsap.getProperty(t, 'opacity')) || Number(gsap.getProperty(t, 'yPercent'))) {
          gsap.set(t, { opacity: 0, yPercent: 0 });
        }
      }
      if (prev < 0 || !inc) {
        if (inc) gsap.set(inc, { clearProps: 'opacity,transform' }); // first render: in place, no motion
        inc?.parentElement?.removeAttribute('data-masking');
        if (i >= SHELF_AT) shelfTl.progress(1);
        return;
      }
      const mask = inc.parentElement;
      const outMask = out?.parentElement ?? null;
      gsap.set(inc, { opacity: 0 }); // hidden from this very frame, whatever state it was left in
      const tl = gsap.timeline();
      if (out && outAlpha > 0.01) {
        tl.fromTo(
          out,
          { opacity: outAlpha },
          { opacity: 0, yPercent: `+=${i > prev ? -18 : 18}`, duration: OUT, ease: EASE.exit },
        );
      }
      if (out) {
        tl.set(out, { opacity: 0, yPercent: 0 });
        tl.call(() => outMask?.removeAttribute('data-masking'));
      }
      tl.call(() => mask?.setAttribute('data-masking', ''));
      tl.fromTo(
        inc,
        { opacity: 1, yPercent: i > prev ? 105 : -105 },
        // not before its turn: until then the set above keeps it hidden
        { yPercent: 0, duration: 0.6, ease: EASE.rise, immediateRender: false },
      );
      tl.call(() => {
        mask?.removeAttribute('data-masking');
        gsap.set(inc, { clearProps: 'opacity,transform' }); // at rest: the CSS (active) state shows it
      });
      swap = tl;
      say(i);

      if (i >= SHELF_AT) shelfTl.play();
      else if (!shelf?.contains(document.activeElement)) shelfTl.reverse();
    };
    // activate() runs from the scrub's onUpdate: record what it creates in this context (reverted with it)
    const go = (contextSafe ? contextSafe(activate) : activate) as (i: number) => void;

    const render = (p: number): void => {
      const pos = roundPos(p, n);
      setX?.(pos.u * step);
      setFill?.(pos.u / (n - 1));
      if (pos.active !== current) go(pos.active);
    };

    const proxy = { p: 0 };
    measure();
    go(0);
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
      shelf?.removeEventListener('focusin', onShelfFocus);
      delete rd.dataset.mode;
      for (const s of stages) setState(s, null);
      for (const t of texts) t?.parentElement?.removeAttribute('data-masking');
      if (live) live.textContent = '';
    };
  });

  return () => {};
}
