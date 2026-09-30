// S4: the PASS grid generator (src/gl/gen/grid.ts, §6.3). Pure and deterministic; shared by the GL scene, the
// static CSS lattice and the #gt-pass readout, so the three always agree on count, shape and ignition order.
import { describe, expect, it } from 'vitest';
import {
  BOX_H,
  BOX_W,
  cellCenter,
  COLS,
  COUNT,
  diagonal,
  DIAGONALS,
  gridCell,
  litCount,
  ROWS,
} from '@gl/gen/grid';
import { facts } from '@data/facts';

const all = Array.from({ length: COUNT }, (_, i) => gridCell(i));

describe('gen/grid', () => {
  it('draws exactly one cell per PASS in facts.ts', () => {
    expect(COUNT).toBe(facts['gt.pass'].value);
    expect(COUNT).toBe(12513);
  });

  it('is the 112 × 112 plane minus the 31 surplus positions of the last row (ui/LatticeCss geometry)', () => {
    expect(COLS).toBe(112);
    expect(ROWS).toBe(Math.ceil(COUNT / COLS));
    expect(COLS * ROWS - COUNT).toBe(31);
    expect(gridCell(0)).toMatchObject({ gx: 0, gy: 0 });
    expect(gridCell(111)).toMatchObject({ gx: 111, gy: 0 });
    expect(gridCell(112)).toMatchObject({ gx: 0, gy: 1 });
    expect(gridCell(COUNT - 1)).toMatchObject({ gx: 80, gy: 111 });
  });

  it('rejects indexes outside 0..12512', () => {
    for (const i of [-1, COUNT, 1.5, Number.NaN]) expect(() => gridCell(i)).toThrow(RangeError);
  });

  it('gives every drawn cell a distinct position', () => {
    const seen = new Set(all.map((c) => `${c.gx},${c.gy}`));
    expect(seen.size).toBe(COUNT);
  });

  it('lights from the LEFT corner (law 2): order grows with the cell’s x on screen', () => {
    const first = all.reduce((a, b) => (b.order < a.order ? b : a));
    expect(first).toMatchObject({ gx: 0, gy: ROWS - 1 });
    for (let i = 0; i < COUNT; i += 97) {
      const a = gridCell(i);
      const x = cellCenter(i).x;
      for (let j = 1; j < COUNT; j += 1601) {
        if (cellCenter(j).x > x) expect(gridCell(j).order, `${i} vs ${j}`).toBeGreaterThan(a.order);
      }
    }
  });

  it('keeps every order inside (0, 1] so progress 0 lights nothing and progress 1 lights everything', () => {
    for (const c of all) {
      expect(c.order).toBeGreaterThan(0);
      expect(c.order).toBeLessThanOrEqual(1);
      expect(diagonal(c.gx, c.gy)).toBeGreaterThanOrEqual(0);
      expect(diagonal(c.gx, c.gy)).toBeLessThan(DIAGONALS);
    }
    expect(litCount(0)).toBe(0);
    expect(litCount(-1)).toBe(0);
    expect(litCount(1)).toBe(COUNT);
    expect(litCount(2)).toBe(COUNT);
  });

  it('litCount(p) is exactly the number of cells with order ≤ p, and never decreases', () => {
    let prev = 0;
    for (let k = 0; k <= 2000; k++) {
      const p = k / 2000;
      const brute = all.reduce((n, c) => n + (c.order <= p ? 1 : 0), 0);
      const n = litCount(p);
      expect(n, `p=${p}`).toBe(brute);
      expect(n).toBeGreaterThanOrEqual(prev);
      prev = n;
    }
    // exact diagonal boundaries are inclusive
    for (const d of [0, 1, 110, 111, 221, 222]) {
      const p = (d + 1) / DIAGONALS;
      expect(litCount(p)).toBe(all.filter((c) => c.order <= p + 1e-12).length);
    }
  });

  it('places every cell centre inside the 2:1 diamond box (224 × 112 cell units)', () => {
    expect(BOX_W).toBe(2 * BOX_H);
    for (let i = 0; i < COUNT; i++) {
      const { x, y } = cellCenter(i);
      // pitch diamond spans ±1 in x and ±0.5 in y around the centre
      expect(x - 1).toBeGreaterThanOrEqual(0);
      expect(x + 1).toBeLessThanOrEqual(BOX_W);
      expect(y - 0.5).toBeGreaterThanOrEqual(0);
      expect(y + 0.5).toBeLessThanOrEqual(BOX_H);
      // |dx| + 2|dy| ≤ half-width: inside the diamond
      expect(Math.abs(x - BOX_W / 2) + 2 * Math.abs(y - BOX_H / 2)).toBeLessThanOrEqual(BOX_W / 2);
    }
    expect(cellCenter(0)).toEqual({ x: BOX_W / 2, y: 0.5 }); // top corner
    expect(cellCenter(ROWS * COLS - COLS)).toEqual({ x: 1, y: BOX_H / 2 }); // left corner (gx 0, gy 111)
  });

  it('is deterministic', () => {
    expect(gridCell(4242)).toEqual(gridCell(4242));
    expect(litCount(0.4242)).toBe(litCount(0.4242));
  });
});
