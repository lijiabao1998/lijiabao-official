// src/gl/gen/portrait.ts — the glimmer portrait's pure core (spec §6.2): sampling, prefix order, binary format.
// Pure, deterministic and Node-safe (no DOM, no imports): scripts/sample-portrait.mjs runs it under plain `node`
// (native type stripping) to build the bins and posters, the portrait scene decodes with it, vitest tests it.
//
// Geometry: points sit EXACTLY on ROWS horizontal baselines (row centres at (r + 0.5) · H / ROWS). Along each row,
// the point count is proportional to the row's importance and x follows the row's importance CDF with stratified
// jitter, so density reads as tone. Brightness and size come from `lum`.
//
// Prefix order: every point gets a key = the radical inverse (van der Corput) of its index along its row, rotated
// by a seeded per-row offset (mulberry32, seed 0x6C6A62), with a seeded tie-break. Points are stored sorted by key,
// so ANY prefix takes the same fraction of every row, spread evenly along it: the lite tier (first 4,096), the
// mobile full tier (first 8,192) and the guard's half-density fallback all draw a uniform, stratified subsample.
//
// Binary (little-endian): a 16-byte header, then `count` points × 6 bytes:
//   header  u32 magic 'LJPT' · u8 version · u8 stride (6) · u16 rows · u32 count · u16 source w · u16 source h
//   point   u16 x (0..65535 = 0..1 of the width) · u16 y (same, of the height) · u8 lum · u8 edge
// edge = 255 marks an accent point (the round glasses' rims), drawn amber; 0..254 is the edge strength.

export const PT = {
  /** the sampled frame (px): the photo's full width, head-and-shoulders crop from the top; the stage keeps this aspect */
  W: 553,
  H: 720,
  /** baselines (one every 4 source px) */
  ROWS: 180,
  /** portrait-a.bin: lite, and the first part of every tier */
  A: 4096,
  /** portrait-b.bin: the next points (full tier only) */
  B: 8192,
  SEED: 0x6c6a62,
  HEADER: 16,
  STRIDE: 6,
  /** 'LJPT' */
  MAGIC: 0x54504a4c,
  VERSION: 1,
  ACCENT: 255,
} as const;

/**
 * The look at rest, shared by the scene (uniforms) and the poster. Every point is a soft glimmer (gen/glimmer.ts:
 * a gaussian, σ = SIGMA × size): size in CSS px = mix(size[0], size[1], lum), so the highlights
 * (face, shirt, glasses) are fuller and the dark hair and coat stay fine and sparse — smaller in full, where three
 * times the points share the frame — and alpha = peak × mix(alpha0, 1, lum). Accent points burn at 1.
 */
export const LOOK = {
  lite: [1.8, 3.6],
  full: [1.6, 3.2],
  alpha0: 0.3,
  peak: { lite: 0.7, full: 0.6 },
} as const;

/** Points drawn per tier (spec §6.2 counts). */
export function tierCount(tier: 'full' | 'lite' | 'static', mobile: boolean): number {
  if (tier === 'full') return mobile ? PT.B : PT.A + PT.B;
  return PT.A;
}

/** mulberry32: a tiny seeded PRNG (uniform 0..1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Radical inverse in base 2 (van der Corput): 0, .5, .25, .75, .125 … */
export function vdc(i: number): number {
  let v = 0;
  let f = 0.5;
  let n = i >>> 0;
  while (n > 0) {
    if (n & 1) v += f;
    n >>>= 1;
    f *= 0.5;
  }
  return v;
}

/* ------------------------------------------------------------------ image fields */

/** Per-pixel inputs of the sampler, all w × h, row-major. */
export interface Field {
  w: number;
  h: number;
  /** sampling density (≥ 0; 0 = no points) */
  imp: Float32Array;
  /** tone 0..1 → brightness and size */
  lum: Float32Array;
  /** edge strength 0..1 */
  edge: Float32Array;
}

/** sRGB 8-bit → perceptual luma 0..1 (Rec. 709 weights on the encoded values). */
export function lumaOf(px: Uint8Array, w: number, h: number, channels: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let i = 0, j = 0; i < out.length; i++, j += channels) {
    out[i] = (0.2126 * (px[j] ?? 0) + 0.7152 * (px[j + 1] ?? 0) + 0.0722 * (px[j + 2] ?? 0)) / 255;
  }
  return out;
}

/** Separable box blur, radius r, `passes` times (3 passes ≈ gaussian). Edges clamp. */
export function blur(src: Float32Array, w: number, h: number, r: number, passes = 3): Float32Array {
  const a = Float32Array.from(src);
  const b = new Float32Array(a.length);
  const d = 2 * r + 1;
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const o = y * w;
      let s = 0;
      for (let k = -r; k <= r; k++) s += a[o + Math.min(w - 1, Math.max(0, k))] ?? 0;
      for (let x = 0; x < w; x++) {
        b[o + x] = s / d;
        s += (a[o + Math.min(w - 1, x + r + 1)] ?? 0) - (a[o + Math.max(0, x - r)] ?? 0);
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += b[Math.min(h - 1, Math.max(0, k)) * w + x] ?? 0;
      for (let y = 0; y < h; y++) {
        a[y * w + x] = s / d;
        s += (b[Math.min(h - 1, y + r + 1) * w + x] ?? 0) - (b[Math.max(0, y - r) * w + x] ?? 0);
      }
    }
  }
  return a;
}

/** Sobel gradient magnitude, normalised so the p99 edge = 1 (clamped). */
export function sobel(a: Float32Array, w: number, h: number): Float32Array {
  const g = new Float32Array(w * h);
  const at = (x: number, y: number): number =>
    a[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))] ?? 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      g[y * w + x] = Math.hypot(gx, gy);
    }
  }
  const hi = percentile(g, 0.99) || 1;
  for (let i = 0; i < g.length; i++) g[i] = Math.min(1, (g[i] ?? 0) / hi);
  return g;
}

/** The q-quantile (0..1) of `a`, optionally only where mask > 0.5. */
export function percentile(a: Float32Array, q: number, mask?: Float32Array): number {
  const v: number[] = [];
  for (let i = 0; i < a.length; i++) if (!mask || (mask[i] ?? 0) > 0.5) v.push(a[i] ?? 0);
  if (!v.length) return 0;
  v.sort((x, y) => x - y);
  return v[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))] ?? 0;
}

/** Contrast stretch: [p(lo), p(hi)] → [0, 1] (clamped), percentiles taken inside `mask`. */
export function stretch(a: Float32Array, lo: number, hi: number, mask?: Float32Array): Float32Array {
  const l = percentile(a, lo, mask);
  const hgh = percentile(a, hi, mask);
  const k = hgh > l ? 1 / (hgh - l) : 1;
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = Math.min(1, Math.max(0, ((a[i] ?? 0) - l) * k));
  return out;
}

/** Histogram equalisation inside `mask` (256 bins): the "even mapping" of §6.2. Outside the mask → 0. */
export function equalize(a: Float32Array, mask: Float32Array): Float32Array {
  const bins = new Float64Array(256);
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    const m = mask[i] ?? 0;
    if (m <= 0) continue;
    bins[Math.min(255, Math.max(0, Math.floor((a[i] ?? 0) * 255)))] += m;
    total += m;
  }
  const cdf = new Float64Array(256);
  let run = 0;
  for (let b = 0; b < 256; b++) {
    run += bins[b] ?? 0;
    cdf[b] = total > 0 ? run / total : 0;
  }
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    if ((mask[i] ?? 0) <= 0) continue;
    out[i] = cdf[Math.min(255, Math.max(0, Math.floor((a[i] ?? 0) * 255)))] ?? 0;
  }
  return out;
}

/** Even-odd polygon fill (pixel centres), 1 inside, 0 outside. `poly` = [x0, y0, x1, y1, …] in px. */
export function polygonMask(poly: readonly number[], w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const n = poly.length >> 1;
  const xs: number[] = [];
  for (let y = 0; y < h; y++) {
    const cy = y + 0.5;
    xs.length = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = poly[2 * i] ?? 0;
      const yi = poly[2 * i + 1] ?? 0;
      const xj = poly[2 * j] ?? 0;
      const yj = poly[2 * j + 1] ?? 0;
      if (yi > cy !== yj > cy) xs.push(xi + ((cy - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.max(0, Math.ceil((xs[k] ?? 0) - 0.5));
      const x1 = Math.min(w - 1, Math.floor((xs[k + 1] ?? 0) - 0.5));
      for (let x = x0; x <= x1; x++) out[y * w + x] = 1;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ sampling */

export interface Points {
  n: number;
  rows: number;
  /** normalised 0..1 */
  x: Float32Array;
  y: Float32Array;
  /** 0..255 */
  lum: Uint8Array;
  /** 0..254 edge, 255 accent */
  edge: Uint8Array;
  row: Uint16Array;
  /** prefix key 0..1 (points are sorted by it) */
  key: Float32Array;
}

/** A point placed by art direction (e.g. on the glasses' rims). It leads every prefix (drawn in every tier). */
export interface FixedPoint {
  /** normalised 0..1 */
  x: number;
  row: number;
  /** 0..255 */
  lum: number;
  /** 0..254 edge, 255 accent */
  edge: number;
}

export interface SampleOpts {
  /** points in all, fixed ones included */
  total: number;
  rows?: number;
  seed?: number;
  /** stratified jitter inside each stratum, 0 (centred) … 1 (full stratum) */
  jitter?: number;
  /** centred fraction of each row band averaged for lum / edge (importance always uses the whole band) */
  core?: number;
  /**
   * Minimum mean spacing along a row, in source px, for the FULL point set: the densest runs are clipped so dots
   * stay discrete (never merge into dashes); the clipped share flows to the rest of the row.
   */
  minGap?: number;
  /** per-pixel multiplier applied AFTER the density cap (e.g. clearances that must stay dark), band-averaged */
  post?: Float32Array;
  fixed?: readonly FixedPoint[];
}

/**
 * Sample `total` points on `rows` baselines. Row r covers the source band [r·H/rows, (r+1)·H/rows); the density
 * profile is the band average of imp, the tone profile the average of lum / edge over the band's centred `core`.
 * Fixed points come first (key −1). Deterministic for a given field and options.
 */
export function sampleRows(f: Field, o: SampleOpts): Points {
  const rows = o.rows ?? PT.ROWS;
  const fixed = o.fixed ?? [];
  const total = Math.max(0, Math.floor(o.total) - fixed.length);
  const rnd = mulberry32(o.seed ?? PT.SEED);
  const jitter = o.jitter ?? 0.7;
  const core = Math.min(1, Math.max(0, o.core ?? 1));
  const { w, h } = f;

  // 1. band profiles
  const imp = new Float64Array(rows * w);
  const lum = new Float32Array(rows * w);
  const edge = new Float32Array(rows * w);
  const rowSum = new Float64Array(rows);
  for (let r = 0; r < rows; r++) {
    const y0 = Math.floor((r * h) / rows);
    const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * h) / rows));
    const half = ((y1 - y0) * core) / 2;
    const mid = (y0 + y1) / 2;
    const c0 = Math.max(y0, Math.floor(mid - half));
    const c1 = Math.min(y1, Math.max(c0 + 1, Math.ceil(mid + half)));
    const inv = 1 / (y1 - y0);
    const cinv = 1 / (c1 - c0);
    for (let x = 0; x < w; x++) {
      let si = 0;
      let sl = 0;
      let se = 0;
      for (let y = y0; y < y1; y++) si += f.imp[y * w + x] ?? 0;
      for (let y = c0; y < c1; y++) {
        sl += f.lum[y * w + x] ?? 0;
        se += f.edge[y * w + x] ?? 0;
      }
      const o2 = r * w + x;
      imp[o2] = si * inv;
      lum[o2] = sl * cinv;
      edge[o2] = se * cinv;
      rowSum[r] = (rowSum[r] ?? 0) + si * inv;
    }
  }

  // 2. points per row ∝ row importance (largest remainder → exactly `total`)
  let all = 0;
  for (let r = 0; r < rows; r++) all += rowSum[r] ?? 0;
  const per = new Int32Array(rows);
  if (all > 0 && total > 0) {
    const rem: [number, number][] = [];
    let used = 0;
    for (let r = 0; r < rows; r++) {
      const exact = ((rowSum[r] ?? 0) / all) * total;
      per[r] = Math.floor(exact);
      used += per[r] ?? 0;
      rem.push([exact - Math.floor(exact), r]);
    }
    rem.sort((p, q) => q[0] - p[0] || p[1] - q[1]);
    for (let k = 0; used < total && k < rem.length; k++, used++) per[(rem[k] as [number, number])[1]]++;
  }

  // 2b. keep dots discrete: clip each row's density at 1 / minGap (a few passes of water-filling)
  if (o.minGap && o.minGap > 0) {
    for (let r = 0; r < rows; r++) {
      const m = per[r] ?? 0;
      if (m < 2) continue;
      const base = r * w;
      for (let pass = 0; pass < 6; pass++) {
        let T = 0;
        for (let x = 0; x < w; x++) T += imp[base + x] ?? 0;
        const cap = T / (m * o.minGap);
        let clipped = false;
        for (let x = 0; x < w; x++) {
          if ((imp[base + x] ?? 0) > cap) {
            imp[base + x] = cap;
            clipped = true;
          }
        }
        if (!clipped) break;
      }
    }
  }
  if (o.post) {
    for (let r = 0; r < rows; r++) {
      const y0 = Math.floor((r * h) / rows);
      const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * h) / rows));
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let y = y0; y < y1; y++) s += o.post[y * w + x] ?? 1;
        imp[r * w + x] = (imp[r * w + x] ?? 0) * (s / (y1 - y0));
      }
    }
  }

  // 3. fixed points (key −1: first in every prefix), then stratified inverse-CDF sampling along each row
  const n = fixed.length + per.reduce((s, v) => s + v, 0);
  const X = new Float32Array(n);
  const Y = new Float32Array(n);
  const L = new Uint8Array(n);
  const E = new Uint8Array(n);
  const R = new Uint16Array(n);
  const K = new Float32Array(n);
  const tie = new Float32Array(n);
  const cdf = new Float64Array(w + 1);
  let p = 0;
  for (const q of fixed) {
    const r = Math.min(rows - 1, Math.max(0, Math.round(q.row)));
    X[p] = Math.min(1, Math.max(0, q.x));
    Y[p] = (r + 0.5) / rows;
    L[p] = Math.min(255, Math.max(0, Math.round(q.lum)));
    E[p] = Math.min(255, Math.max(0, Math.round(q.edge)));
    R[p] = r;
    K[p] = -1;
    tie[p] = rnd();
    p++;
  }
  for (let r = 0; r < rows; r++) {
    const m = per[r] ?? 0;
    const rot = rnd();
    if (m === 0) continue;
    const base = r * w;
    cdf[0] = 0;
    for (let x = 0; x < w; x++) cdf[x + 1] = (cdf[x] ?? 0) + (imp[base + x] ?? 0);
    const T = cdf[w] ?? 0;
    let cx = 0;
    for (let k = 0; k < m; k++) {
      const u = ((k + 0.5 + (rnd() - 0.5) * jitter) / m) * T;
      while (cx < w - 1 && (cdf[cx + 1] ?? 0) < u) cx++;
      const c0 = cdf[cx] ?? 0;
      const c1 = cdf[cx + 1] ?? 0;
      const fx = c1 > c0 ? (u - c0) / (c1 - c0) : 0.5;
      const xp = Math.min(w, Math.max(0, cx + fx));
      const xi = Math.min(w - 1, Math.max(0, Math.floor(xp)));
      X[p] = xp / w;
      Y[p] = (r + 0.5) / rows;
      L[p] = Math.round(Math.min(1, Math.max(0, lum[base + xi] ?? 0)) * 255);
      E[p] = Math.min(254, Math.round(Math.min(1, Math.max(0, edge[base + xi] ?? 0)) * 254));
      R[p] = r;
      K[p] = (vdc(k) + rot) % 1;
      tie[p] = rnd();
      p++;
    }
  }

  // 4. store sorted by key → any prefix is a stratified subsample of every row
  const order = Array.from({ length: n }, (_, i) => i);
  order.sort((a2, b2) => (K[a2] ?? 0) - (K[b2] ?? 0) || (tie[a2] ?? 0) - (tie[b2] ?? 0) || a2 - b2);
  const out: Points = {
    n,
    rows,
    x: new Float32Array(n),
    y: new Float32Array(n),
    lum: new Uint8Array(n),
    edge: new Uint8Array(n),
    row: new Uint16Array(n),
    key: new Float32Array(n),
  };
  order.forEach((src, i) => {
    out.x[i] = X[src] ?? 0;
    out.y[i] = Y[src] ?? 0;
    out.lum[i] = L[src] ?? 0;
    out.edge[i] = E[src] ?? 0;
    out.row[i] = R[src] ?? 0;
    out.key[i] = K[src] ?? 0;
  });
  return out;
}

/* ------------------------------------------------------------------ binary */

/** Points [start, start + count) → one bin (header + 6 B per point). */
export function encode(pts: Points, start: number, count: number, w: number = PT.W, h: number = PT.H): Uint8Array {
  const c = Math.max(0, Math.min(count, pts.n - start));
  const buf = new Uint8Array(PT.HEADER + c * PT.STRIDE);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, PT.MAGIC, true);
  dv.setUint8(4, PT.VERSION);
  dv.setUint8(5, PT.STRIDE);
  dv.setUint16(6, pts.rows, true);
  dv.setUint32(8, c, true);
  dv.setUint16(12, w, true);
  dv.setUint16(14, h, true);
  for (let i = 0; i < c; i++) {
    const s = start + i;
    const o = PT.HEADER + i * PT.STRIDE;
    dv.setUint16(o, Math.round(Math.min(1, Math.max(0, pts.x[s] ?? 0)) * 65535), true);
    dv.setUint16(o + 2, Math.round(Math.min(1, Math.max(0, pts.y[s] ?? 0)) * 65535), true);
    dv.setUint8(o + 4, pts.lum[s] ?? 0);
    dv.setUint8(o + 5, pts.edge[s] ?? 0);
  }
  return buf;
}

export interface Decoded {
  count: number;
  rows: number;
  w: number;
  h: number;
  /** interleaved points, stride 6 (u16 x, u16 y, u8 lum, u8 edge): upload as-is */
  data: Uint8Array;
}

/** Validates the header; throws on a foreign or truncated file. */
export function decode(ab: ArrayBuffer): Decoded {
  if (ab.byteLength < PT.HEADER) throw new Error('portrait: short file');
  const dv = new DataView(ab);
  if (dv.getUint32(0, true) !== PT.MAGIC || dv.getUint8(4) !== PT.VERSION || dv.getUint8(5) !== PT.STRIDE) {
    throw new Error('portrait: bad header');
  }
  const count = dv.getUint32(8, true);
  if (ab.byteLength < PT.HEADER + count * PT.STRIDE) throw new Error('portrait: truncated');
  return {
    count,
    rows: dv.getUint16(6, true),
    w: dv.getUint16(12, true),
    h: dv.getUint16(14, true),
    data: new Uint8Array(ab, PT.HEADER, count * PT.STRIDE),
  };
}
