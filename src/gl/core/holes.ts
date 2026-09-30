// src/gl/core/holes.ts — "text never sits on a glimmer" (§2.2 law 6, §8): [data-gl-hole] boxes dim the points
// under them (the scene multiplies alpha by .08 inside any hole). Collection + packing only; the rect reads
// happen in rects.ts with the anchor reads (one batch per frame).

export const MAX_HOLES = 8;
/** px of clearance around every hole (§6.1 "+ 12px pad"). */
export const HOLE_PAD = 12;

/**
 * Default hole elements for an anchor: every [data-gl-hole] in its section (else its figure / parent).
 * Only the first MAX_HOLES that overlap the anchor are packed each frame.
 */
export function collectHoles(anchor: Element): Element[] {
  const scope = anchor.closest('section') ?? anchor.closest('figure') ?? anchor.parentElement ?? anchor;
  return Array.from(scope.querySelectorAll('[data-gl-hole]'));
}

/**
 * Write hole `i` as anchor-local (x, y, w, h) + pad. Returns false (nothing written) when it does not overlap
 * the anchor or is empty.
 */
export function packHole(
  out: Float32Array,
  i: number,
  left: number,
  top: number,
  width: number,
  height: number,
  anchor: { x: number; y: number; width: number; height: number },
): boolean {
  if (width <= 0 || height <= 0) return false;
  const x = left - anchor.x - HOLE_PAD;
  const y = top - anchor.y - HOLE_PAD;
  const w = width + 2 * HOLE_PAD;
  const h = height + 2 * HOLE_PAD;
  if (x > anchor.width || y > anchor.height || x + w < 0 || y + h < 0) return false;
  const o = i * 4;
  out[o] = x;
  out[o + 1] = y;
  out[o + 2] = w;
  out[o + 3] = h;
  return true;
}
