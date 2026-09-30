// src/gl/gen/grid.ts — the PASS grid (§6.3), pure, deterministic and Node-safe. Shared by the GL scene
// (gl/scenes/grid.ts + grid.vert), the static CSS lattice (ui/LatticeCss: same cell order) and the tests.
//
// 12,513 cells, one per passing check in GlimmerTown's `test_fixde.js` (facts `gt.pass`). Cell i sits at
// (i mod 112, i div 112) on a 112 × 112 plane; the plane is turned into a 2:1 isometric diamond, and the 31
// surplus positions (the tail of the last row) are never drawn: 112² − 31 = 12,513.
//
// Ignition order (site law 2, light comes from the left): cells light on the grid's anti-diagonals, starting
// at the diamond's LEFT corner (gx = 0, gy = 111) and ending at its right corner. On screen the front is a
// vertical line sweeping left → right. `order` ∈ (0, 1]: a cell is lit once progress ≥ order, so progress 0
// lights nothing and progress 1 lights all 12,513 — `litCount(p)` is the exact number the readout prints.
//
// No copy, no DOM, no facts import (the GL chunk stays tiny); tests pin COUNT to facts['gt.pass'].

/** Columns (and rows) of the square plane. */
export const COLS = 112;
/** Rows needed for COUNT cells. */
export const ROWS = 112;
/** Cells drawn: one per PASS (= facts['gt.pass'].value; asserted in tests/unit/grid.test.ts). */
export const COUNT = 12513;
/** Anti-diagonals of the plane: d = gx − gy + (ROWS − 1) ∈ [0, COLS + ROWS − 2]. */
export const DIAGONALS = COLS + ROWS - 1;
/** The diamond's bounding box in cell units (x: COLS + ROWS, y: half of it). */
export const BOX_W = COLS + ROWS;
export const BOX_H = (COLS + ROWS) / 2;
/** Share of a cell's pitch its diamond fills (the CSS lattice's 1 − 2g with g = 0.19). */
export const FILL = 0.62;

export interface Cell {
  gx: number;
  gy: number;
  /** ignition point on the 0..1 progress axis: lit when progress ≥ order */
  order: number;
}

/** Anti-diagonal index of a cell (0 = the left corner). */
export function diagonal(gx: number, gy: number): number {
  return gx - gy + (ROWS - 1);
}

/** Ignition point of a diagonal: (d + 1) / DIAGONALS ∈ (0, 1]. */
export function orderOf(d: number): number {
  return (d + 1) / DIAGONALS;
}

export function gridCell(i: number): Cell {
  if (!Number.isInteger(i) || i < 0 || i >= COUNT) throw new RangeError(`[grid] cell ${i} is outside 0..${COUNT - 1}`);
  const gx = i % COLS;
  const gy = (i - gx) / COLS;
  return { gx, gy, order: orderOf(diagonal(gx, gy)) };
}

/**
 * Centre of cell i inside the diamond's bounding box, in cell units: x ∈ (0, BOX_W), y ∈ (0, BOX_H).
 * One unit = one CSS px of `uCell` in the shader; the cell's pitch diamond spans ±1 in x and ±0.5 in y.
 * Same geometry as ui/LatticeCss (scaleY(.5) rotate(45deg) of the cols × rows plane).
 */
export function cellCenter(i: number): { x: number; y: number } {
  const { gx, gy } = gridCell(i);
  return { x: gx - gy + ROWS, y: (gx + gy + 1) / 2 };
}

let cum: Uint16Array | null = null;

/** cum[d] = number of cells on diagonals 0..d (built once from the real cell list). */
function cumulative(): Uint16Array {
  if (cum) return cum;
  const per = new Uint16Array(DIAGONALS);
  for (let i = 0; i < COUNT; i++) {
    const gx = i % COLS;
    const gy = (i - gx) / COLS;
    per[diagonal(gx, gy)] += 1;
  }
  const out = new Uint16Array(DIAGONALS);
  let n = 0;
  for (let d = 0; d < DIAGONALS; d++) {
    n += per[d];
    out[d] = n;
  }
  return (cum = out);
}

/** Exact number of cells lit at progress p (cells with order ≤ p). 0 at p ≤ 0, COUNT at p ≥ 1. */
export function litCount(p: number): number {
  if (!(p > 0)) return 0;
  if (p >= 1) return COUNT;
  // order ≤ p  ⇔  d ≤ p·DIAGONALS − 1   (a tiny epsilon keeps exact boundaries inclusive)
  const d = Math.floor(p * DIAGONALS - 1 + 1e-9);
  return d < 0 ? 0 : cumulative()[Math.min(d, DIAGONALS - 1)];
}
