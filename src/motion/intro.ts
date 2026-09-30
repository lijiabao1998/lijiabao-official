// src/motion/intro.ts — §5.2 the Baseline Scan (≤ 1.4s; it is the preloader). Owner: S1.
//
// Runs once per full load, before the sections, only when the head boot set html[data-intro] (home, motion full,
// tier not static, first visit). No overlay, no counter: the h1 is real text from the first paint.
//
//   0      first paint: the line dim (zh wght 160 via motion.css; en at rest — see Hero.astro), the rule at
//          scaleX 0, commits unlit (poster at 10%, or GL uScan 0)
//   0.10   a 6px amber head fades in on the rule under line 1
//   0.10 → 1.10  the scan (lj.scan): rule scaleX 0 → 1, the head rides it, and on the SAME clock
//          · every character weighs dim → rest (0.45s lj.weigh) as the head passes its left edge
//          · the field ignites every commit whose axis x is at or left of the head: engine uScan on the GL,
//            `--field-scan` on the poster's lit copy — one vertical time front through the whole hero
//   0.35 → 1.20  sub lines, meta and quick links mask-rise (0.8s lj.rise, 0.07 apart)
//   1.10 → 1.40  the head glides down into GlimmerTown's latest commit (the amber point of lane 1) and fades
//   end    splits reverted, inline states cleared, endIntro() (removes data-intro, writes lj.v, 'lj:intro-done')
//
// Skip: the first pointerdown / wheel / touchstart, or any key but Tab and modifiers, completes it in one frame
// (tl.progress(1)); a visually-hidden-until-focused button (a11y.intro.skip) is moved right after the skip link
// so it is the first Tab stop while the intro runs. A late engine needs nothing extra: uScan is buffered by the
// handle and the poster was lit by the same front, so GL takes over already lit.
// Weight-safety (§2.2): CJK glyphs have a fixed 1em advance; Latin glyphs are locked in rest-width slots (em)
// for the length of the intro, so the dim face never moves a line.

import { endIntro } from '../lib/prefs';
import { isZh, listen, pageAge, type Cleanup as DomCleanup } from '../lib/dom';
import { EASE } from './eases';
import { MQ, type Cleanup, type MotionCtx } from './registry';

const DIM = 160;
const HEAD_IN = 0.1;
const SCAN = 1.0;
const SETTLE_AT = 1.1;
const SETTLE = 0.3;
const RISE_AT = 0.35;
/** the scan front leads the head by this much of the axis (the GL front is 0.02 wide) */
const LEAD = 0.01;
/** later than this after navigation start, the fail-open is about to fire: skip the show */
const TOO_LATE_MS = 2200;
const NARROW = '(max-width: 639.98px)';

type Setter = (v: number) => void;

/** t ∈ [0, 1] where ease(t) = y (the eases are monotonic). */
function invert(ease: (t: number) => number, y: number): number {
  if (y <= 0) return 0;
  if (y >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const fvs = (w: number): string => `"wght" ${Math.round(w)}`;

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const html = document.documentElement;
  const hero = root.querySelector<HTMLElement>('#hero');
  const display = hero?.querySelector<HTMLElement>('[data-weigh="scan"]') ?? null;
  const rule = hero?.querySelector<HTMLElement>('[data-intro-line]') ?? null;
  const dot = hero?.querySelector<HTMLElement>('[data-intro-dot]') ?? null;
  if (!hero || !display || !rule || !dot || !html.hasAttribute('data-intro') || ctx.reduced || pageAge() > TOO_LATE_MS) {
    endIntro();
    return () => {};
  }
  const { gsap } = ctx;

  ctx.mm.add({ full: MQ.full, narrow: NARROW }, (c) => {
    const cond = (c.conditions ?? {}) as { full?: boolean; narrow?: boolean };
    if (!cond.full || !html.hasAttribute('data-intro')) {
      endIntro();
      return;
    }

    const set =
      display.querySelector<HTMLElement>(cond.narrow ? '.display__set--narrow' : '.display__set--wide') ??
      display.querySelector<HTMLElement>('.display__set--wide');
    const lineBox = rule.parentElement as HTMLElement;
    const plot = hero.querySelector<HTMLElement>('[data-field-plot]');
    const posters = plot ? Array.from(plot.querySelectorAll<HTMLElement>('.field-poster, .field-lit')) : [];
    const rises = Array.from(hero.querySelectorAll<HTMLElement>('[data-intro-rise]'));
    const sub = hero.querySelector<HTMLElement>('.hero-sub[data-intro-rise]');
    const skipBtn = hero.querySelector<HTMLButtonElement>('[data-intro-skip]');
    const handle = ctx.engine?.get('field') ?? null;
    const zh = isZh(display);

    // ---- DOM writes that must precede the one batch of reads ---------------------------------------------
    // cancel the CSS fail-open on everything this timeline drives (it would snap them mid-scan)
    gsap.set([display, rule, ...rises, ...posters], { animation: 'none' });
    const chars = set ? ctx.prim.split(set, 'chars') : null;
    const subSplit = sub ? ctx.prim.split(sub, 'lines') : null;
    if (sub && subSplit) {
      // the paragraph is not an aria-hidden copy: keep its real text readable (no aria-label on a <p>)
      sub.removeAttribute('aria-label');
      for (const l of subSplit.lines) l.removeAttribute('aria-hidden');
    }

    // ---- one batch of reads ---------------------------------------------------------------------------------
    const box = lineBox.getBoundingClientRect();
    const ruleX = box.left;
    const ruleW = rule.offsetWidth || box.width || 1;
    const dotBox = dot.getBoundingClientRect();
    const pr = plot?.getBoundingClientRect() ?? null;
    const cs = getComputedStyle(display);
    const rest = parseFloat(cs.fontWeight) || (zh ? 600 : 560);
    const fontPx = parseFloat(getComputedStyle(set ?? display).fontSize) || 1;
    const charEls = (chars?.chars ?? []) as HTMLElement[];
    const charBoxes = charEls.map((el) => el.getBoundingClientRect());
    const latestX = Number(plot?.dataset.latestX ?? 1);
    const latestY = Number(plot?.dataset.latestY ?? 0.5);

    // ---- writes ----------------------------------------------------------------------------------------------
    if (!zh) charBoxes.forEach((b, i) => ((charEls[i] as HTMLElement).style.width = `${b.width / fontPx}em`));
    if (subSplit?.lines.length) gsap.set(sub, { yPercent: 0, y: 0 });
    gsap.set(dot, { opacity: 0, x: 0, y: 0, scale: 1 });
    handle?.set('uScan', -0.05);
    plot?.style.setProperty('--field-scan', '0');

    const setScan: Setter = (p) => {
      const headX = ruleX + p * ruleW;
      if (pr && pr.width > 0) {
        const s = (headX - pr.left) / pr.width;
        handle?.set('uScan', p >= 1 ? 1.1 : s + LEAD);
        plot?.style.setProperty('--field-scan', String(s < 0 ? 0 : s > 1 ? 1 : s));
      }
    };

    const tl = gsap.timeline({ paused: true });

    // the head appears on the rule, then scans (prim.scan: rule scaleX, head x, onProgress = the time front)
    tl.to(dot, { opacity: 1, duration: 0.12, ease: 'none' }, HEAD_IN);
    tl.add(ctx.prim.scan(rule, { dot, onProgress: setScan, duration: SCAN }), HEAD_IN);

    // characters weigh in as the head passes their left edge
    const scanEase = gsap.parseEase(EASE.scan) as (t: number) => number;
    if (!zh && charEls.length) tl.fromTo(charEls, { fontVariationSettings: fvs(rest) }, { fontVariationSettings: fvs(DIM), duration: HEAD_IN, ease: 'none' }, 0);
    charEls.forEach((el, i) => {
      const b = charBoxes[i] as DOMRect;
      const fx = (b.left - ruleX) / ruleW;
      const at = HEAD_IN + invert(scanEase, fx) * SCAN;
      tl.fromTo(
        el,
        { fontVariationSettings: fvs(DIM) },
        { fontVariationSettings: fvs(rest), duration: 0.45, ease: EASE.weigh, immediateRender: zh },
        at,
      );
    });

    // sub lines, meta and quick links rise inside their masks
    const risers: Element[] = subSplit?.lines.length ? [...subSplit.lines, ...rises.filter((el) => el !== sub)] : rises;
    if (risers.length) {
      // y: 0 — GSAP would otherwise parse motion.css's translateY(105%) pre-state as a px `y` and keep it
      gsap.set(risers, { yPercent: 105, y: 0 });
      tl.to(risers, { yPercent: 0, duration: 0.8, ease: EASE.rise, stagger: 0.07 }, RISE_AT);
    }

    // the head comes to rest in GlimmerTown's latest commit (an arc: x rises fast, y follows the scan curve)
    if (pr && pr.width > 0) {
      const cx = dotBox.left + dotBox.width / 2;
      const cy = dotBox.top + dotBox.height / 2;
      const tx = pr.left + latestX * pr.width - cx;
      const ty = pr.top + (latestY / 20) * pr.height - cy;
      tl.to(dot, { x: tx, duration: SETTLE, ease: EASE.rise }, SETTLE_AT);
      tl.to(dot, { y: ty, duration: SETTLE, ease: EASE.scan }, SETTLE_AT);
      tl.to(dot, { scale: 0.5, duration: SETTLE, ease: EASE.weigh }, SETTLE_AT);
    }
    tl.to(dot, { opacity: 0, duration: 0.12, ease: 'none' }, SETTLE_AT + SETTLE - 0.12);

    // ---- skip ------------------------------------------------------------------------------------------------
    const skip = (): void => {
      if (tl.progress() < 1) tl.progress(1);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') return;
      skip();
    };
    const offs: DomCleanup[] = [
      listen(window, 'pointerdown', skip, { passive: true }),
      listen(window, 'wheel', skip, { passive: true }),
      listen(window, 'touchstart', skip, { passive: true }),
      listen(window, 'keydown', onKey),
    ];
    if (skipBtn) {
      const anchor = document.querySelector('a.skip');
      if (anchor) anchor.after(skipBtn);
      skipBtn.hidden = false;
      offs.push(listen(skipBtn, 'click', skip));
    }

    // ---- end -------------------------------------------------------------------------------------------------
    let ended = false;
    const finish = (): void => {
      if (ended) return;
      ended = true;
      for (const off of offs) off();
      offs.length = 0;
      handle?.set('uScan', 1.1);
      chars?.revert();
      subSplit?.revert();
      gsap.set([display, ...posters], { clearProps: 'animation' });
      gsap.set(rule, { clearProps: 'animation,transform,transformOrigin' });
      gsap.set(dot, { clearProps: 'opacity,transform' });
      gsap.set(rises, { clearProps: 'animation,transform' });
      plot?.style.removeProperty('--field-scan');
      if (skipBtn) skipBtn.hidden = true;
      endIntro();
    };
    tl.eventCallback('onComplete', finish);
    tl.play(0);

    return () => {
      tl.kill();
      finish();
    };
  });

  return () => endIntro();
}
