// src/gl/scenes/inspect.ts — the CPU side of the hero record (spec §5.4 #fig-record, §6.1 picking). Shared by
// the field scene (decode, pick, step) and motion/sections/hero.ts (readout data for a picked record), so both
// read the same decoded commits. No copy and no URLs: labels are repo names, dates and shas (data); the page
// supplies the readout template (data-i18n-*) and the GitHub URL templates (data-commit-url / data-repo-url,
// built from src/data/links.ts at build time).
//
// Binary (scripts/pack-commits.mjs, little-endian): a 16-byte header, then 9 bytes per commit.
//   0 'LJC1' magic · 4 u8 version (1) · 5 u8 axis mode (0 time, 1 ordinal) · 6 u8 lanes (19) · 7 u8 rows (20)
//   8 u32 count · 12 u32 snapshot date as YYYYMMDD
//   record: u8 lane · u32 minutes since 2026-07-12 00:00 +08:00 · u32 sha7 (28 bits)
//   Records are sorted by lane, then time.

import { LANES, ROWS, rowY, seedOf, shaHex } from '../gen/lanes.ts';
import { fmtDateTime, timeX, type AxisMode } from '../gen/time-axis.ts';

export const MAGIC = 0x31434a4c; // 'LJC1' read as a little-endian u32
export const HEADER = 16;
export const STRIDE = 9;
/** Nearest record within this many CSS px (spec §6.1; fine pointers). */
export const PICK_R = 16;
/** Touch taps are coarser. */
export const TAP_R = 28;

export interface FieldData {
  count: number;
  mode: AxisMode;
  /** snapshot date 'YYYY-MM-DD' ('' when unknown) */
  asOf: string;
  /** lane index (LANES) per record */
  lane: Uint8Array;
  minutes: Uint32Array;
  sha: Uint32Array;
  /** axis x ∈ [0, 1] */
  x: Float32Array;
  /** y in lane units (row + 0.5 + beeswarm) */
  y: Float32Array;
  /** twinkle seed ∈ [0, 1) */
  sx: Float32Array;
  /** 1 on the latest record of each lane */
  latest: Uint8Array;
  /** first record of each lane; laneStart[LANES.length] = count */
  laneStart: Uint32Array;
}

/** Decode commits.<hash>.bin. Throws on a malformed file (the engine then keeps the poster). */
export function decode(buf: ArrayBuffer): FieldData {
  if (buf.byteLength < HEADER) throw new Error('commits.bin: too short');
  const v = new DataView(buf);
  if (v.getUint32(0, true) !== MAGIC || v.getUint8(4) !== 1) throw new Error('commits.bin: bad header');
  const mode: AxisMode = v.getUint8(5) === 1 ? 'ordinal' : 'time';
  const count = v.getUint32(8, true);
  if (buf.byteLength < HEADER + count * STRIDE) throw new Error('commits.bin: truncated');
  const ymd = v.getUint32(12, true);
  const asOf = ymd ? `${Math.floor(ymd / 10000)}-${String(Math.floor(ymd / 100) % 100).padStart(2, '0')}-${String(ymd % 100).padStart(2, '0')}` : '';

  const d: FieldData = {
    count,
    mode,
    asOf,
    lane: new Uint8Array(count),
    minutes: new Uint32Array(count),
    sha: new Uint32Array(count),
    x: new Float32Array(count),
    y: new Float32Array(count),
    sx: new Float32Array(count),
    latest: new Uint8Array(count),
    laneStart: new Uint32Array(LANES.length + 1),
  };
  let o = HEADER;
  for (let i = 0; i < count; i++, o += STRIDE) {
    const l = v.getUint8(o);
    if (l >= LANES.length || (i > 0 && l < (d.lane[i - 1] as number))) throw new Error('commits.bin: lane order');
    d.lane[i] = l;
    d.minutes[i] = v.getUint32(o + 1, true);
    d.sha[i] = v.getUint32(o + 5, true);
  }
  // lane ranges
  let l = 0;
  for (let i = 0; i < count; i++) {
    const li = d.lane[i] as number;
    while (l < li) d.laneStart[++l] = i;
  }
  while (l < LANES.length) d.laneStart[++l] = count;
  // geometry (the same functions build the static poster)
  for (let li = 0; li < LANES.length; li++) {
    const lane = LANES[li] as (typeof LANES)[number];
    const a = d.laneStart[li] as number;
    const b = d.laneStart[li + 1] as number;
    const n = b - a;
    for (let i = a; i < b; i++) {
      const k = i - a;
      const [sx, sy] = seedOf(d.sha[i] as number, li, k);
      d.x[i] = timeX(d.minutes[i] as number, mode, k, n);
      d.y[i] = rowY(lane.row, sy);
      d.sx[i] = sx;
    }
    if (n > 0) d.latest[b - 1] = 1;
  }
  return d;
}

/* ------------------------------------------------------------------ band geometry */

/** The plot band inside the anchor, CSS px: x, y, w, h (+ lane height). */
export interface Band {
  x: number;
  y: number;
  w: number;
  h: number;
  laneH: number;
}

export const newBand = (): Band => ({ x: 0, y: 0, w: 0, h: 0, laneH: 0 });

/* ------------------------------------------------------------------ picking: 32 × 20 bucket grid */

const GX = 32;
const GY = ROWS;

/** Rest positions of every record in anchor px, bucketed for nearest-record queries (no per-query allocation). */
export class PickGrid {
  private head = new Int32Array(GX * GY);
  private next = new Int32Array(0);
  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private band: Band = newBand();
  ready = false;

  build(d: FieldData, band: Band): void {
    this.band = { ...band };
    if (this.next.length !== d.count) {
      this.next = new Int32Array(d.count);
      this.px = new Float32Array(d.count);
      this.py = new Float32Array(d.count);
    }
    this.head.fill(-1);
    for (let i = 0; i < d.count; i++) {
      const x = band.x + (d.x[i] as number) * band.w;
      const y = band.y + (d.y[i] as number) * band.laneH;
      this.px[i] = x;
      this.py[i] = y;
      const c = this.cell(x, y);
      this.next[i] = this.head[c] as number;
      this.head[c] = i;
    }
    this.ready = band.w > 0 && band.h > 0;
  }

  private cx(x: number): number {
    const v = Math.floor(((x - this.band.x) / (this.band.w || 1)) * GX);
    return v < 0 ? 0 : v >= GX ? GX - 1 : v;
  }
  private cy(y: number): number {
    const v = Math.floor(((y - this.band.y) / (this.band.h || 1)) * GY);
    return v < 0 ? 0 : v >= GY ? GY - 1 : v;
  }
  private cell(x: number, y: number): number {
    return this.cy(y) * GX + this.cx(x);
  }

  /** Index of the nearest record within `r` px of (x, y) (anchor px), or -1. */
  nearest(x: number, y: number, r: number = PICK_R): number {
    if (!this.ready) return -1;
    let best = -1;
    let bd = r * r;
    const x0 = this.cx(x - r);
    const x1 = this.cx(x + r);
    const y0 = this.cy(y - r);
    const y1 = this.cy(y + r);
    for (let gy = y0; gy <= y1; gy++) {
      for (let gx = x0; gx <= x1; gx++) {
        for (let i = this.head[gy * GX + gx] as number; i >= 0; i = this.next[i] as number) {
          const dx = (this.px[i] as number) - x;
          const dy = (this.py[i] as number) - y;
          const dd = dx * dx + dy * dy;
          if (dd <= bd) {
            bd = dd;
            best = i;
          }
        }
      }
    }
    return best;
  }
}

/* ------------------------------------------------------------------ keyboard stepping (sorted arrays) */

export type Dir = 'prev' | 'next' | 'up' | 'down' | 'home' | 'end';

function laneRange(d: FieldData, l: number): [number, number] {
  return [d.laneStart[l] as number, (d.laneStart[l + 1] as number) - 1];
}

/** The record in lane `l` whose x is closest to `x` (lanes are sorted by x). -1 for an empty lane. */
function closestIn(d: FieldData, l: number, x: number): number {
  let [lo, hi] = laneRange(d, l);
  if (hi < lo) return -1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((d.x[mid] as number) < x) lo = mid + 1;
    else hi = mid;
  }
  const prev = lo - 1;
  if (prev >= (d.laneStart[l] as number) && x - (d.x[prev] as number) <= (d.x[lo] as number) - x) return prev;
  return lo;
}

/**
 * ← → step through a lane by time, ↑ ↓ change lanes (nearest in time), Home / End jump to the lane's first /
 * last record. With no current record, start on the first lane's latest commit (its amber point).
 */
export function stepFrom(d: FieldData, cur: number, dir: Dir): number {
  if (d.count === 0) return -1;
  if (cur < 0 || cur >= d.count) {
    const [a, b] = laneRange(d, 0);
    return dir === 'home' ? a : b;
  }
  const l = d.lane[cur] as number;
  const [a, b] = laneRange(d, l);
  switch (dir) {
    case 'prev':
      return cur > a ? cur - 1 : cur;
    case 'next':
      return cur < b ? cur + 1 : cur;
    case 'home':
      return a;
    case 'end':
      return b;
    case 'up':
    case 'down': {
      const step = dir === 'up' ? -1 : 1;
      for (let t = l + step; t >= 0 && t < LANES.length; t += step) {
        const j = closestIn(d, t, d.x[cur] as number);
        if (j >= 0) return j;
      }
      return cur;
    }
  }
}

/* ------------------------------------------------------------------ the live record set + readout data */

let live: { data: FieldData; grid: PickGrid; band: Band } | null = null;

/** field.ts registers its current data (the last created state wins; a stale state's destroy never clears it). */
export function setLive(data: FieldData, grid: PickGrid, band: Band): void {
  live = { data, grid, band };
}
export function clearLive(data: FieldData): void {
  if (live?.data === data) live = null;
}

/** Nearest record to an anchor-local point within `r` px (touch uses TAP_R). */
export function pickAt(x: number, y: number, r: number = PICK_R): number {
  return live ? live.grid.nearest(x, y, r) : -1;
}

export interface RecordInfo {
  index: number;
  lane: number;
  row: number;
  /** the GitHub repo name */
  repo: string;
  /** 'YYYY-MM-DD HH:mm' Taipei; '' on the ordinal axis */
  date: string;
  /** sha7; '' on the ordinal axis */
  sha: string;
  /** rest position in the band: axis x ∈ [0, 1] and y in lane units */
  x: number;
  y: number;
  /** band in anchor px when the grid was last built */
  band: Band;
}

/** Data behind record `i` of the live set (readout text, link, pill position). */
export function describe(i: number): RecordInfo | null {
  if (!live || i < 0 || i >= live.data.count) return null;
  const d = live.data;
  const lane = d.lane[i] as number;
  const L = LANES[lane] as (typeof LANES)[number];
  const timed = d.mode === 'time';
  return {
    index: i,
    lane,
    row: L.row,
    repo: L.repo,
    date: timed ? fmtDateTime(d.minutes[i] as number) : '',
    sha: timed ? shaHex(d.sha[i] as number) : '',
    x: d.x[i] as number,
    y: d.y[i] as number,
    band: live.band,
  };
}
