// src/motion/sections/record.ts — #record: inspecting figure#fig-record (spec §5.4, §6.1).
//
// Every non-static tier, reduced motion included; the <table> stays the complete path:
//   - fine pointer over the band: the nearest commit within 16px is picked (amber, +3px, held in place while
//     the others part along their lane); a readout pill follows it (fig.readout.commit); click opens it;
//   - keyboard on the focusable stage: ← → by time, ↑ ↓ lanes, Home / End, Enter opens, Esc leaves;
//     the readout mirrors to an aria-live="polite" region, at most once per 300ms;
//   - touch: a tap shows the nearest record (28px); tapping the readout opens it.
// The record sat in the hero until 2026-11-18 and thinned out as the hero scrolled away; it is now a section of
// its own and simply stays lit.
// No copy here: the readout template and the "open" hint come from data-i18n-readout / data-i18n-open.

import type { Cleanup, MotionCtx } from '../registry';
import { fill, i18n, isFocusVisible, listen, type Cleanup as DomCleanup } from '../../lib/dom';
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

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  return bindInspect(root, ctx);
}

/* ------------------------------------------------------------------ inspect */

function bindInspect(root: HTMLElement, ctx: MotionCtx): Cleanup {
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
    const y = (info.y / ROWS) * h;
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

  /** anchor-local coordinates of a client point (one rect read) */
  function local(clientX: number, clientY: number): [number, number] {
    const r = plot!.getBoundingClientRect();
    return [clientX - r.left + PAD_X, clientY - r.top + PAD_TOP];
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
