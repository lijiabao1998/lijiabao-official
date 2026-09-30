// S3: the glimmer portrait's generator (src/gl/gen/portrait.ts) and the committed bins it produced.
// The key property: points are stored in prefix order, so ANY prefix (lite 4,096 · mobile full 8,192 · the guard's
// half density) is a stratified subsample — every row keeps its share, spread along the row.
import { describe, expect, it } from 'vitest';
import {
  decode,
  encode,
  LOOK,
  mulberry32,
  PT,
  sampleRows,
  tierCount,
  vdc,
  type Field,
  type Points,
} from '@gl/gen/portrait';
import { facts } from '@data/facts';
import manifest from '@data/gl-manifest.json';
import meta from '@data/portrait-meta.json';

/** A synthetic "face": a bright disc on a dark field, plus a horizontal gradient (deterministic). */
function field(w = 160, h = 200): Field {
  const imp = new Float32Array(w * h);
  const lum = new Float32Array(w * h);
  const edge = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const d = Math.hypot((x - w / 2) / (w * 0.35), (y - h * 0.4) / (h * 0.3));
      const v = d < 1 ? 0.9 - 0.4 * d : 0.08 + 0.1 * (x / w);
      lum[i] = v;
      imp[i] = 0.05 + v;
      edge[i] = Math.abs(d - 1) < 0.05 ? 1 : 0;
    }
  }
  return { w, h, imp, lum, edge };
}

const ROWS = 40;
const TOTAL = 3000;

function sample(extra: Partial<Parameters<typeof sampleRows>[1]> = {}): Points {
  return sampleRows(field(), { total: TOTAL, rows: ROWS, seed: PT.SEED, ...extra });
}

function perRow(p: Points, n: number): number[] {
  const out = new Array<number>(p.rows).fill(0);
  for (let i = 0; i < n; i++) out[p.row[i] as number]++;
  return out;
}

describe('portrait generator', () => {
  it('mulberry32 is deterministic and uniform in [0, 1)', () => {
    const a = mulberry32(PT.SEED);
    const b = mulberry32(PT.SEED);
    let sum = 0;
    for (let i = 0; i < 10000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 10000).toBeGreaterThan(0.48);
    expect(sum / 10000).toBeLessThan(0.52);
  });

  it('vdc is the base-2 radical inverse', () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(vdc)).toEqual([0, 0.5, 0.25, 0.75, 0.125, 0.625, 0.375, 0.875]);
  });

  it('samples exactly `total` points, deterministically', () => {
    const p = sample();
    const q = sample();
    expect(p.n).toBe(TOTAL);
    expect(Array.from(p.x)).toEqual(Array.from(q.x));
    expect(Array.from(p.key)).toEqual(Array.from(q.key));
  });

  it('every point sits exactly on a baseline (y is the row centre)', () => {
    const p = sample();
    for (let i = 0; i < p.n; i++) {
      expect(p.y[i]).toBeCloseTo(((p.row[i] as number) + 0.5) / ROWS, 6);
      expect(p.x[i]).toBeGreaterThanOrEqual(0);
      expect(p.x[i]).toBeLessThanOrEqual(1);
    }
  });

  it('points are stored in prefix (key) order', () => {
    const p = sample();
    for (let i = 1; i < p.n; i++) expect(p.key[i]).toBeGreaterThanOrEqual(p.key[i - 1] as number);
  });

  it('any prefix keeps every row at its share (stratified, not just random)', () => {
    const p = sample();
    const all = perRow(p, p.n);
    for (const frac of [1 / 3, 1 / 2, 2 / 3]) {
      const n = Math.round(p.n * frac);
      const pre = perRow(p, n);
      for (let r = 0; r < ROWS; r++) {
        const expected = (all[r] as number) * frac;
        // van der Corput keys: within ~2 points of the share per row (a random shuffle drifts by √(n·f(1−f)) ≈ 4
        // here, and by ~10 at the worst of 40 rows)
        expect(Math.abs((pre[r] as number) - expected), `row ${r} at ${frac.toFixed(2)}`).toBeLessThanOrEqual(2.5);
      }
    }
  });

  it('a prefix is spread along each row (no half of a row left empty)', () => {
    const p = sample();
    const n = Math.round(p.n / 3);
    for (let r = 0; r < ROWS; r++) {
      const full: number[] = [];
      const pre: number[] = [];
      for (let i = 0; i < p.n; i++) if (p.row[i] === r) (i < n ? pre : full).push(p.x[i] as number);
      full.push(...pre);
      if (full.length < 12) continue;
      full.sort((a, b) => a - b);
      pre.sort((a, b) => a - b);
      // compare in rank space: the prefix's points must cover the row's ranks evenly
      const rank = (x: number): number => full.findIndex((v) => v === x) / (full.length - 1);
      const ranks = pre.map(rank);
      let gap = ranks[0] as number;
      for (let i = 1; i < ranks.length; i++) gap = Math.max(gap, (ranks[i] as number) - (ranks[i - 1] as number));
      gap = Math.max(gap, 1 - (ranks[ranks.length - 1] as number));
      expect(gap, `row ${r}`).toBeLessThan(0.3);
    }
  });

  it('fixed points lead every prefix', () => {
    const fixed = [
      { x: 0.25, row: 10, lum: 240, edge: PT.ACCENT },
      { x: 0.75, row: 10, lum: 240, edge: 254 },
    ];
    const p = sample({ fixed });
    expect(p.n).toBe(TOTAL);
    expect(p.edge[0] === PT.ACCENT || p.edge[1] === PT.ACCENT).toBe(true);
    expect(p.key[0]).toBe(-1);
    expect(p.key[1]).toBe(-1);
    expect(p.key[2]).toBeGreaterThanOrEqual(0);
  });

  it('the density cap keeps rows from saturating', () => {
    const p = sample({ minGap: 3 });
    const q = sample();
    expect(p.n).toBe(q.n);
    // the cap flattens the densest runs: the bright disc holds fewer points than without it
    const inDisc = (s: Points): number => {
      let c = 0;
      for (let i = 0; i < s.n; i++) if (Math.abs((s.x[i] as number) - 0.5) < 0.2) c++;
      return c;
    };
    expect(inDisc(p)).toBeLessThan(inDisc(q));
  });

  it('encode → decode round-trips the header and points', () => {
    const p = sample({ fixed: [{ x: 0.5, row: 3, lum: 200, edge: PT.ACCENT }] });
    const buf = encode(p, 0, 100, 160, 200);
    expect(buf.length).toBe(PT.HEADER + 100 * PT.STRIDE);
    const d = decode(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
    expect(d.count).toBe(100);
    expect(d.rows).toBe(ROWS);
    expect([d.w, d.h]).toEqual([160, 200]);
    const dv = new DataView(d.data.buffer, d.data.byteOffset, d.data.byteLength);
    for (let i = 0; i < 100; i++) {
      expect(dv.getUint16(i * 6, true) / 65535).toBeCloseTo(p.x[i] as number, 4);
      expect(dv.getUint16(i * 6 + 2, true) / 65535).toBeCloseTo(p.y[i] as number, 4);
      expect(dv.getUint8(i * 6 + 4)).toBe(p.lum[i]);
      expect(dv.getUint8(i * 6 + 5)).toBe(p.edge[i]);
    }
  });

  it('decode rejects foreign or truncated files', () => {
    expect(() => decode(new ArrayBuffer(8))).toThrow();
    expect(() => decode(new ArrayBuffer(32))).toThrow();
    const p = sample();
    const buf = encode(p, 0, 10);
    expect(() => decode(buf.buffer.slice(0, buf.byteLength - 1) as ArrayBuffer)).toThrow();
  });

  it('tier counts match the facts the copy prints (tier.*.desc)', () => {
    expect(tierCount('lite', false)).toBe(facts['portrait.lite'].value);
    expect(tierCount('full', false)).toBe(facts['portrait.full'].value);
    expect(tierCount('full', true)).toBe(PT.B);
    expect(tierCount('static', false)).toBe(PT.A);
    expect(PT.A + PT.B).toBe(facts['portrait.full'].value);
  });

  it('the look keeps full-tier points smaller than lite ones', () => {
    expect(LOOK.full[1]).toBeLessThan(LOOK.lite[1]);
    expect(LOOK.alpha0).toBeGreaterThan(0);
  });
});

describe('committed portrait bins', () => {
  // node:fs through a non-literal specifier: the project has no @types/node (tests run under Node via vitest)
  const load = async (url: string): Promise<ArrayBuffer> => {
    const spec = 'node:fs';
    const fs = (await import(/* @vite-ignore */ spec)) as { readFileSync(p: string | URL): Uint8Array };
    const u8 = fs.readFileSync(new URL(`../../public${url}`, import.meta.url));
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
  };
  const m = manifest as unknown as Record<string, string | undefined>;

  it('the manifest names both bins with content hashes', () => {
    expect(m.portrait).toMatch(/^\/gl\/portrait-a\.[0-9a-f]{8}\.bin$/);
    expect(m['portrait-b']).toMatch(/^\/gl\/portrait-b\.[0-9a-f]{8}\.bin$/);
  });

  it('a + b hold 4,096 + 8,192 points on the committed baselines, prefix-ordered', async () => {
    const a = decode(await load(m.portrait as string));
    const b = decode(await load(m['portrait-b'] as string));
    expect(a.count).toBe(PT.A);
    expect(b.count).toBe(PT.B);
    expect(a.rows).toBe(meta.rows);
    expect([a.w, a.h]).toEqual([PT.W, PT.H]);
    expect(meta.aspect).toBe(`${PT.W}/${PT.H}`);

    const rows = new Array<number>(a.rows).fill(0);
    const rowsA = new Array<number>(a.rows).fill(0);
    let accents = 0;
    for (const [d, isA] of [
      [a, true],
      [b, false],
    ] as const) {
      const dv = new DataView(d.data.buffer, d.data.byteOffset, d.data.byteLength);
      for (let i = 0; i < d.count; i++) {
        const y = dv.getUint16(i * 6 + 2, true) / 65535;
        const r = Math.round(y * a.rows - 0.5);
        expect(Math.abs(y - (r + 0.5) / a.rows)).toBeLessThan(1e-4); // exactly on a baseline
        rows[r]++;
        if (isA) rowsA[r]++;
        if (dv.getUint8(i * 6 + 5) === PT.ACCENT) accents++;
      }
    }
    expect(accents).toBe(meta.accents);
    expect(accents).toBeLessThan((PT.A + PT.B) * 0.01);
    // the lite prefix keeps each well-populated row near a third of its points (fixed rim points sit on top)
    for (let r = 0; r < a.rows; r++) {
      const all = rows[r] as number;
      if (all < 30) continue;
      expect(Math.abs((rowsA[r] as number) / all - PT.A / (PT.A + PT.B)), `row ${r}`).toBeLessThan(0.12);
    }
  });
});
