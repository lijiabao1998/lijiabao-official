// primitives/tick.ts — the odometer (§5.3 #numbers): every digit becomes a 0–9 column in a mask that runs
// translateY to its target, LEFT digit first (law 2), 1.2s lj.rise, 0.04s per digit.
// Works from the final text already in the DOM (put it on the aria-hidden [data-tick] copy next to the real
// <data>; mark it [data-parity-ignore]). The plain text is put back when the timeline completes or is reverted,
// so the resting DOM is exactly the server HTML. Tabular numerals keep every column the same width (no CLS).
// Typical use: ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, animation: prim.tick(el) }).

import type { Primitives } from '../registry';
import { DUR, EASE } from '../eases';
import { isReduced } from '../../lib/prefs';
import type { PrimDeps } from './index';

const COL = 'display:inline-block;overflow:hidden;vertical-align:top;height:1em;height:1lh';
const CELL = 'display:block;height:1em;height:1lh';

export function makeTick({ gsap }: PrimDeps): Primitives['tick'] {
  return (el) => {
    const tl = gsap.timeline();
    const text = el.textContent ?? '';
    if (isReduced() || !/\d/.test(text)) return tl;

    const saved = Array.from(el.childNodes);
    const strips: HTMLElement[] = [];
    const digits: number[] = [];
    const frag = document.createDocumentFragment();
    for (const ch of text.trim()) {
      const col = document.createElement('span');
      col.style.cssText = COL;
      col.setAttribute('aria-hidden', 'true');
      if (ch >= '0' && ch <= '9') {
        const strip = document.createElement('span');
        strip.style.cssText = 'display:block';
        for (let i = 0; i < 10; i++) {
          const cell = document.createElement('span');
          cell.style.cssText = CELL;
          cell.textContent = String(i);
          strip.append(cell);
        }
        col.append(strip);
        strips.push(strip);
        digits.push(ch.charCodeAt(0) - 48);
      } else col.textContent = ch === ' ' ? ' ' : ch;
      frag.append(col);
    }

    let built = true;
    const restore = (): void => {
      if (!built) return;
      built = false;
      el.replaceChildren(...saved);
    };
    el.replaceChildren(frag);
    tl.fromTo(
      strips,
      { yPercent: 0 },
      { yPercent: (i: number) => -(digits[i] ?? 0) * 10, duration: DUR.xl, ease: EASE.rise, stagger: 0.04 },
    );
    tl.call(restore);
    tl.eventCallback('onInterrupt', restore);
    return tl;
  };
}
