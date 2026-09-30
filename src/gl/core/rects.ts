// src/gl/core/rects.ts — the ONLY place the engine reads layout.
//
// Policy: events (scroll, wheel, resize, font loads, ResizeObserver, IntersectionObserver, Lenis' scroll via
// engine.invalidate) only raise a dirty flag; the engine then reads, in one batch at the end of that frame's
// tick, the rects of VISIBLE anchors (≤ 2) and their holes, and nothing else. Frames that only twinkle read
// nothing. The canvas box is read on resize only.
//
// Reading at the END of the tick (after lenis.raf, ScrollTrigger and every GSAP write) is deliberate: Lenis
// moves the page inside that same tick, so a read at the start would draw one scroll-step behind the DOM
// (visible shear against the DOM lane labels) and would be wrong for pinned anchors. With no writes after it,
// this read costs the one style/layout pass the browser needs before paint anyway — no thrash.

import { MAX_HOLES, packHole } from './holes';

/** A reusable, mutable rect (native DOMRect: no per-frame allocation on our side). */
export const newRect = (): DOMRect => new DOMRect();

/** getBoundingClientRect → `out` (viewport CSS px). Returns true when it changed. */
export function readRect(el: Element, out: DOMRect): boolean {
  const b = el.getBoundingClientRect();
  if (b.left === out.x && b.top === out.y && b.width === out.width && b.height === out.height) return false;
  out.x = b.left;
  out.y = b.top;
  out.width = b.width;
  out.height = b.height;
  return true;
}

/** Hole rects → `out` (anchor-local, padded). Returns the hole count (≤ MAX_HOLES). */
export function readHoles(els: readonly Element[], anchor: DOMRect, out: Float32Array): number {
  let n = 0;
  for (let i = 0; i < els.length && n < MAX_HOLES; i++) {
    const el = els[i] as Element;
    // a hidden hole covers no text (the hero's inspect readout at rest sits at the band's top-left corner,
    // visibility: hidden): the records under it stay lit
    if (el.checkVisibility?.({ visibilityProperty: true, checkVisibilityCSS: true }) === false) continue;
    const b = el.getBoundingClientRect();
    if (packHole(out, n, b.left, b.top, b.width, b.height, anchor)) n++;
  }
  return n;
}

export interface CanvasBox {
  /** canvas CSS size */
  cssW: number;
  cssH: number;
  /** backing store size (device px) */
  pxW: number;
  pxH: number;
  /** device px per CSS px, per axis (≈ dpr; sy differs while a small height change is absorbed) */
  sx: number;
  sy: number;
  dpr: number;
}

export const newBox = (): CanvasBox => ({ cssW: 0, cssH: 0, pxW: 0, pxH: 0, sx: 1, sy: 1, dpr: 1 });

/**
 * Size the backing store to the canvas' CSS box × dpr. A height-only change under 160 CSS px (mobile URL bar)
 * keeps the current backing height (§6.0); mapping stays exact through sx/sy. Returns true when anything changed.
 */
export function sizeCanvas(cv: HTMLCanvasElement, dpr: number, box: CanvasBox): boolean {
  const cssW = cv.clientWidth;
  const cssH = cv.clientHeight;
  if (!cssW || !cssH) {
    const changed = box.cssW !== cssW || box.cssH !== cssH;
    box.cssW = cssW;
    box.cssH = cssH;
    return changed;
  }
  const pxW = Math.max(1, Math.round(cssW * dpr));
  let pxH = Math.max(1, Math.round(cssH * dpr));
  if (dpr === box.dpr && cssW === box.cssW && cv.width === pxW && cv.height > 1 && Math.abs(cssH - box.cssH) < 160)
    pxH = cv.height;
  const changed = cv.width !== pxW || cv.height !== pxH || box.cssW !== cssW || box.cssH !== cssH;
  if (cv.width !== pxW) cv.width = pxW;
  if (cv.height !== pxH) cv.height = pxH;
  box.cssW = cssW;
  box.cssH = cssH;
  box.pxW = pxW;
  box.pxH = pxH;
  box.sx = pxW / cssW;
  box.sy = pxH / cssH;
  box.dpr = dpr;
  return changed;
}

/** Layout-change sources → dirty flags. `onLayout` for scroll-like changes, `onResize` for viewport/DPR changes. */
export function watchLayout(onLayout: () => void, onResize: () => void): () => void {
  const passive = { passive: true } as const;
  const capture = { passive: true, capture: true } as const;
  const vv = window.visualViewport;
  const fonts = document.fonts as FontFaceSet | undefined;
  window.addEventListener('scroll', onLayout, capture);
  window.addEventListener('wheel', onLayout, passive);
  window.addEventListener('resize', onResize, passive);
  vv?.addEventListener('resize', onResize, passive);
  fonts?.addEventListener?.('loadingdone', onLayout);
  return () => {
    window.removeEventListener('scroll', onLayout, capture);
    window.removeEventListener('wheel', onLayout);
    window.removeEventListener('resize', onResize);
    vv?.removeEventListener('resize', onResize);
    fonts?.removeEventListener?.('loadingdone', onLayout);
  };
}
