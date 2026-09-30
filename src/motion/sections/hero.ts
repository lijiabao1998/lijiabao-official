// src/motion/sections/hero.ts — #hero (spec §5.3, §5.4, §6.1). Owner: S1.
//
// 1. Record inspect (every non-static tier, reduced motion included; the <table> stays the complete path):
//    - fine pointer over the band: the nearest commit within 16px is picked (amber, +3px, held in place while
//      the others part along their lane); a readout pill follows it (fig.readout.commit); click opens it;
//    - keyboard on the focusable stage: ← → by time, ↑ ↓ lanes, Home / End, Enter opens, Esc leaves;
//      the readout mirrors to an aria-live="polite" region, at most once per 300ms;
//    - touch: a tap shows the nearest record (28px); tapping the readout opens it.
// 2. Scroll-out (motion full), scrub 0.6. Over the hero (`top top` → `bottom top`) the line's characters go
//    rest → wght 200 in a left-to-right wave (the light leaves) and lift y: −i×3%. The field's uScroll 0 → 1
//    (points drift up 32px, alpha × 0.4) runs as the plot itself leaves (`top 12%` → `bottom top`), so records
//    never slip off their lanes while the figure is being read. The char split is built on the first scroll,
//    after the intro (chars locked in rest-width em slots, so no weight ever moves a line — §2.2).
// No copy here: the readout template and the "open" hint come from data-i18n-readout / data-i18n-open.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { fill, i18n, isFocusVisible, isZh, listen, type Cleanup as DomCleanup } from '../../lib/dom';
import { on } from '../../lib/events';
import { describe, pickAt, TAP_R, type RecordInfo } from '../../gl/scenes/inspect';
import type { StepDir } from '../../gl/types';

const KEYS: Record<string, StepDir> = {
  ArrowLeft: 'prev',
  ArrowRight: 'next',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Home: 'home',
  End: 'end',
};
const ROWS = 20;
/** field.ts PAD: the anchor overhangs the band by 16px left and 32px above */
const PAD_X = 16;
const PAD_TOP = 32;
const SAY_MS = 300;
const NARROW = '(max-width: 639.98px)';
/** field.vert: records drift up uScroll × 32px as the record leaves */
const DRIFT = 32;

/** The live scroll-out value (inspect picks against where records are drawn, not where they rest). */
interface Shared {
  scroll: number;
}

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const shared: Shared = { scroll: 0 };
  const offInspect = bindInspect(root, ctx, shared);
  bindScrollOut(root, ctx, shared);
  return offInspect;
}

/* ------------------------------------------------------------------ inspect */

function bindInspect(root: HTMLElement, ctx: MotionCtx, shared: Shared): Cleanup {
  const field = root.querySelector<HTMLElement>('[data-field]');
  const stage = field?.closest<HTMLElement>('.fig-stage') ?? null;
  const plot = field?.querySelector<HTMLElement>('[data-field-plot]') ?? null;
  const anchor = field?.querySelector<HTMLElement>('[data-gl-scene="field"]') ?? null;
  const pill = field?.querySelector<HTMLAnchorElement>('[data-field-readout]') ?? null;
  const pillText = pill?.querySelector<HTMLElement>('[data-field-readout-text]') ?? null;
  const pillOpen = pill?.querySelector<HTMLElement>('[data-field-readout-open]') ?? null;
  const live = field?.querySelector<HTMLElement>('[data-field-live]') ?? null;
  if (!field || !stage || !plot || !anchor || !pill || !pillText || !pillOpen) return () => {};

  const tpl = i18n(field, 'readout');
  const openHint = i18n(field, 'open');
  const commitTpl = field.dataset.commitUrl ?? '';
  const repoTpl = field.dataset.repoUrl ?? '';
  const hrefOf = (info: RecordInfo): string =>
    info.sha ? fill(commitTpl, { repo: info.repo, sha: info.sha }) : fill(repoTpl, { repo: info.repo });
  const lanes = Array.from(field.querySelectorAll<HTMLElement>('.field-lane[data-lane]'));
  const handle = () => ctx.engine?.get('field') ?? null;

  let cur = -1;
  let how0 = '';
  let lastTouch = -1e9;
  let laneOn: HTMLElement | null = null;
  let px = 0;
  let py = 0;
  let raf = 0;
  let lastSay = 0;
  let sayTimer = 0;

  const say = (text: string): void => {
    if (!live) return;
    window.clearTimeout(sayTimer);
    const wait = Math.max(0, SAY_MS - (performance.now() - lastSay));
    sayTimer = window.setTimeout(() => {
      live.textContent = text;
      lastSay = performance.now();
    }, wait);
  };

  const textOf = (info: RecordInfo): string =>
    fill(tpl, { repo: info.repo, date: info.date || '—', sha: info.sha || '—' });

  function show(i: number, how: 'pointer' | 'key' | 'touch'): void {
    const info = describe(i);
    if (!info) return hide();
    if (i === cur && how === how0 && pill!.hasAttribute('data-on')) return;
    how0 = how;
    const w = plot!.clientWidth;
    const h = plot!.clientHeight;
    if (i !== cur) {
      cur = i;
      handle()?.set('uPicked', i);
      const text = textOf(info);
      pillText!.textContent = text;
      pill!.href = hrefOf(info);
      const lane = lanes.find((el) => el.dataset.lane === String(info.lane)) ?? null;
      if (lane !== laneOn) {
        laneOn?.removeAttribute('data-active');
        lane?.setAttribute('data-active', '');
        laneOn = lane;
      }
      if (how !== 'pointer') say(how === 'key' ? `${text}. ${openHint}` : text);
    }
    pillOpen!.textContent = how === 'key' ? openHint : '';
    const x = info.x * w;
    const y = (info.y / ROWS) * h - shared.scroll * DRIFT;
    // beside the record (left of it past 62%); where that does not fit (phones), just below or above it —
    // never over the record itself. One size read per change.
    const pw = pill!.offsetWidth;
    const side = x > w * 0.62 ? x - 14 - pw : x + 14;
    let left = side;
    let top = y;
    let shift = '-50%';
    if (side < 0 || side + pw > w) {
      left = Math.max(0, Math.min(x - pw / 2, w - pw));
      const below = y < h / 2;
      top = below ? y + 12 : y - 12;
      shift = below ? '0%' : '-100%';
    }
    pill!.style.transform = `translate(${left.toFixed(1)}px, ${top.toFixed(1)}px) translateY(${shift})`;
    pill!.toggleAttribute('data-touch', how === 'touch');
    if (how === 'touch') {
      pill!.target = '_blank';
      pill!.tabIndex = 0;
    } else {
      pill!.removeAttribute('target');
      pill!.tabIndex = -1;
    }
    pill!.setAttribute('data-on', '');
  }

  function hide(): void {
    if (cur < 0 && !pill!.hasAttribute('data-on')) return;
    cur = -1;
    how0 = '';
    handle()?.set('uPicked', -1);
    pill!.removeAttribute('data-on');
    pill!.removeAttribute('data-touch');
    pill!.tabIndex = -1;
    laneOn?.removeAttribute('data-active');
    laneOn = null;
  }

  function open(): void {
    const info = describe(cur);
    if (info) window.open(hrefOf(info), '_blank', 'noopener');
  }

  /** anchor-local rest coordinates of a client point (one rect read; undoes the scroll-out drift) */
  function local(clientX: number, clientY: number): [number, number] {
    const r = plot!.getBoundingClientRect();
    return [clientX - r.left + PAD_X, clientY - r.top + PAD_TOP + shared.scroll * DRIFT];
  }

  // ---- fine pointer: nearest within 16px, once per frame --------------------------------------------------
  const frame = (): void => {
    raf = 0;
    const h = handle();
    if (!h?.pick) return;
    const [x, y] = local(px, py);
    const ref = h.pick(x, y);
    if (ref) show(ref.index, 'pointer');
    else hide();
  };
  const onMove = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    px = e.clientX;
    py = e.clientY;
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const onLeave = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (!isFocusVisible(stage)) hide(); // a keyboard-held readout stays; a mouse-focused stage lets go
  };
  const onClick = (e: MouseEvent): void => {
    if ((e.target as Element | null)?.closest('[data-field-readout]')) return; // the link opens itself
    if (performance.now() - lastTouch < 800) return; // the click that follows a tap (Safari: no pointerType)
    if (cur >= 0) open();
  };

  // ---- touch: tap shows the nearest record; tapping the readout opens it -----------------------------------
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType !== 'touch') return;
    lastTouch = performance.now();
    if ((e.target as Element | null)?.closest('[data-field-readout]')) return;
    const [x, y] = local(e.clientX, e.clientY);
    const i = pickAt(x, y, TAP_R);
    if (i >= 0) show(i, 'touch');
    else hide();
  };

  // ---- keyboard on the stage ------------------------------------------------------------------------------
  const onKey = (e: KeyboardEvent): void => {
    if (e.target !== stage || e.altKey || e.ctrlKey || e.metaKey) return;
    const dir = KEYS[e.key];
    if (dir) {
      const h = handle();
      if (!h?.step) return;
      e.preventDefault();
      const ref = h.step(dir);
      if (ref) show(ref.index, 'key');
      return;
    }
    if (e.key === 'Enter' && cur >= 0) {
      e.preventDefault();
      open();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hide();
      stage.blur();
    }
  };
  const onFocus = (e: FocusEvent): void => {
    if (e.target !== stage || !isFocusVisible(stage)) return;
    if (cur >= 0) return show(cur, 'key');
    const ref = handle()?.step?.('end');
    if (ref) show(ref.index, 'key');
  };
  const onBlur = (e: FocusEvent): void => {
    if (e.target === stage && !stage.contains(e.relatedTarget as Node | null)) hide();
  };

  const offs: DomCleanup[] = [
    listen(plot, 'pointermove', onMove, { passive: true }),
    listen(plot, 'pointerleave', onLeave, { passive: true }),
    listen(plot, 'pointerdown', onDown, { passive: true }),
    listen(plot, 'click', onClick),
    listen(stage, 'keydown', onKey),
    listen(stage, 'focus', onFocus),
    listen(stage, 'blur', onBlur),
    // a tap anywhere else dismisses a touch readout
    listen(document, 'pointerdown', (e: PointerEvent) => {
      if (e.pointerType === 'touch' && cur >= 0 && !plot.contains(e.target as Node)) hide();
    }),
  ];

  return () => {
    for (const off of offs) off();
    if (raf) cancelAnimationFrame(raf);
    window.clearTimeout(sayTimer);
    hide();
  };
}

/* ------------------------------------------------------------------ scroll-out */

function bindScrollOut(root: HTMLElement, ctx: MotionCtx, shared: Shared): void {
  const display = root.querySelector<HTMLElement>('[data-weigh="scan"]');
  if (!display) return;
  const { gsap } = ctx;

  ctx.mm.add({ full: MQ.full, narrow: NARROW }, (c, contextSafe) => {
    const cond = (c.conditions ?? {}) as { full?: boolean; narrow?: boolean };
    if (!cond.full) return;

    let built = false;
    const offs: (() => void)[] = [];

    const build = (): void => {
      if (built || document.documentElement.hasAttribute('data-intro')) return;
      built = true;
      for (const off of offs) off();
      offs.length = 0;

      const set =
        display.querySelector<HTMLElement>(cond.narrow ? '.display__set--narrow' : '.display__set--wide') ??
        display.querySelector<HTMLElement>('.display__set--wide');
      if (!set) return;
      const chars = ctx.prim.split(set, 'chars').chars as HTMLElement[];
      if (!chars.length) return;

      // one batch of reads: rest weight, font size, every glyph box, and where the line ends in the hero
      const rest = parseFloat(getComputedStyle(display).fontWeight) || (isZh(display) ? 600 : 560);
      const fontPx = parseFloat(getComputedStyle(set).fontSize) || 1;
      const boxes = chars.map((el) => el.getBoundingClientRect());
      const heroBox = root.getBoundingClientRect();
      const setBox = set.getBoundingClientRect();

      // writes: lock every glyph in its rest-width slot (em: survives fit-to-line resizes)
      boxes.forEach((b, i) => ((chars[i] as HTMLElement).style.width = `${(b.width / fontPx).toFixed(4)}em`));

      const left = setBox.left;
      const width = setBox.width || 1;
      const tops: number[] = [];
      const lineOf = boxes.map((b) => {
        let k = tops.findIndex((t) => Math.abs(t - b.top) < fontPx * 0.5);
        if (k < 0) k = tops.push(b.top) - 1;
        return k;
      });
      const idx = new Map<number, number>();
      const inLine = lineOf.map((k) => {
        const v = idx.get(k) ?? 0;
        idx.set(k, v + 1);
        return v;
      });

      // the wave finishes about when the line has left the viewport
      const height = heroBox.height || 1;
      const leave = Math.min(0.6, Math.max(0.2, ((setBox.bottom - heroBox.top) / height) * 0.9));
      const dur = leave * 0.55;

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      tl.set({}, {}, 1); // the wave's timeline spans the whole hero range
      chars.forEach((el, i) => {
        const b = boxes[i] as DOMRect;
        const fx = Math.min(1, Math.max(0, (b.left - left) / width));
        tl.fromTo(
          el,
          { fontVariationSettings: `"wght" ${rest}`, yPercent: 0 },
          { fontVariationSettings: '"wght" 200', yPercent: -3 * ((inLine[i] as number) + 1), duration: dur },
          fx * (leave - dur),
        );
      });
    };
    const safeBuild = (contextSafe ? contextSafe(build) : build) as () => void;

    // The record keeps its lanes while it is being read: it drifts up and dims (the light leaves) only as the
    // plot itself leaves under the header. (§5.3 maps uScroll to the hero range, which assumed a hero no taller
    // than the viewport; this hero's record starts below the fold.)
    const plot = root.querySelector<HTMLElement>('[data-field-plot]');
    if (plot) {
      const p = { v: 0 };
      gsap.fromTo(
        p,
        { v: 0 },
        {
          v: 1,
          ease: 'none',
          scrollTrigger: { trigger: plot, start: 'top 12%', end: 'bottom top', scrub: 0.6 },
          onUpdate: () => {
            shared.scroll = p.v;
            ctx.engine?.get('field')?.set('uScroll', p.v);
          },
        },
      );
    }

    // build on the first scroll (and never while the intro still owns the line)
    const onScroll = (): void => {
      if (window.scrollY > 0) safeBuild();
    };
    if (window.scrollY > 0 && !document.documentElement.hasAttribute('data-intro')) safeBuild();
    else {
      offs.push(listen(window, 'scroll', onScroll, { passive: true }));
      offs.push(on('lj:intro-done', () => onScroll()));
    }

    return () => {
      for (const off of offs) off();
      offs.length = 0;
      shared.scroll = 0;
      ctx.engine?.get('field')?.set('uScroll', 0);
    };
  });
}
