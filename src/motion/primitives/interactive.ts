// primitives/interactive.ts — hover == focus (§5.4). `on` runs when a mouse/pen enters OR focus becomes
// :focus-visible inside the element; `off` when both have ended. Touch never triggers hover.

import type { Primitives } from '../registry';
import { isFocusVisible } from '../../lib/dom';

export function makeInteractive(): Primitives['interactive'] {
  return (el, on, off) => {
    let hover = false;
    let focus = false;
    let active = false;
    const sync = (): void => {
      const next = hover || focus;
      if (next === active) return;
      active = next;
      if (next) on();
      else off();
    };
    const enter = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      hover = true;
      sync();
    };
    const leave = (e: PointerEvent): void => {
      if (e.pointerType === 'touch') return;
      hover = false;
      sync();
    };
    const focusIn = (e: FocusEvent): void => {
      focus = isFocusVisible(e.target as Element | null);
      sync();
    };
    const focusOut = (e: FocusEvent): void => {
      if (e.relatedTarget instanceof Node && el.contains(e.relatedTarget)) return;
      focus = false;
      sync();
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('focusin', focusIn);
    el.addEventListener('focusout', focusOut);
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('focusin', focusIn);
      el.removeEventListener('focusout', focusOut);
      if (active) {
        active = false;
        off();
      }
    };
  };
}
