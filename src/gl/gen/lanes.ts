// src/gl/gen/lanes.ts — the hero record's 20 rows (spec §6.1). Pure, deterministic, Node-safe: shared by the
// field scene, the static poster, HeroField (DOM lane labels), CommitTable, scripts/pack-commits.mjs and tests.
//
// Rows: the 3 GlimmerTown lanes, one spacer, FrontierLab-Governance, then the 15 labs in brief order
// (= REPOS order in src/data/repos.ts; tests/unit/lanes.test.ts keeps the two in step). Each commit sits on its
// lane with a light beeswarm: y = (row + 0.5 + (swarm(hash(sha)) − 0.5) × JITTER) × laneH (triangular, centred on
// the rule), so dense days read as density.
// Lane labels here are repo names and repo IDs (data, not copy).

import type { RepoName } from '../../data/facts.ts';
import type { RepoId } from '../../data/repos.ts';
import { timeX, minutesOf, type AxisMode } from './time-axis.ts';

export interface Lane {
  id: RepoId;
  /** 0..19; row 3 is the spacer between the GlimmerTown lanes and Frontier */
  row: number;
  /** the GitHub repo (lane label, commit URLs) */
  repo: RepoName;
  /** short lane label under 640px (spec §7 mobile) */
  short: string;
}

/** Total rows including the spacer. */
export const ROWS = 20;
export const SPACER_ROW = 3;
/**
 * Beeswarm spread as a share of the lane height (±0.25 lane at most). The offsets are triangular (see `swarm`), so
 * most records sit close to the rule: a busy lane reads as one fine luminous trail along it, bright at the core
 * and grainy at the edges, with clear dark between lanes; the tails still keep single records apart.
 */
export const JITTER = 0.5;

const ORDER: readonly [RepoId, RepoName, string][] = [
  ['gt', 'GlimmerTown', 'GT'],
  ['gtlab', 'GlimmerTown-lab', 'GT-lab'],
  ['gt3d', 'GlimmerTown3D-lab', 'GT3D'],
  ['gov', 'FrontierLab-Governance', 'GOV'],
  ['math', 'FrontierMath', 'MATH'],
  ['phys', 'FrontierPhysics', 'PHYS'],
  ['bio', 'FrontierBiology', 'BIO'],
  ['chem', 'FrontierChemistry', 'CHEM'],
  ['cs', 'FrontierComputerScience', 'CS'],
  ['stat', 'FrontierStatistics', 'STAT'],
  ['meta', 'FrontierMetaScience', 'META'],
  ['soc', 'FrontierSocialScience', 'SOC'],
  ['mat', 'FrontierMaterials', 'MAT'],
  ['astro', 'FrontierAstronomy', 'ASTRO'],
  ['earth', 'FrontierEarth', 'EARTH'],
  ['neuro', 'FrontierNeuroscience', 'NEURO'],
  ['econ', 'FrontierEconomics', 'ECON'],
  ['eng', 'FrontierEngineering', 'ENG'],
  ['med', 'FrontierMedicine', 'MED'],
];

/** The 19 data lanes in draw order, with their rows (the spacer row has no lane). */
export const LANES: readonly Lane[] = ORDER.map(([id, repo, short], i) => ({
  id,
  repo,
  short,
  row: i < SPACER_ROW ? i : i + 1,
}));

/** fmix32 (MurmurHash3 finalizer): a well-mixed 32-bit hash of a 32-bit integer. */
export function hash32(n: number): number {
  let h = n >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Two stable seeds in [0, 1) for a record: `sx` (twinkle rate) and `sy` (beeswarm offset). From the 28-bit sha7
 * value; records without a sha (ordinal fallback) seed from their lane and index instead.
 */
export function seedOf(sha: number, lane = 0, index = 0): [number, number] {
  const base = sha > 0 ? sha : ((lane + 1) * 65536 + index) | 0;
  const a = hash32(base);
  const b = hash32(a ^ 0x6c6a6231);
  return [a / 4294967296, b / 4294967296];
}

/**
 * A uniform seed u ∈ [0, 1) → a triangular one in [0, 1) (inverse CDF of the triangular distribution on [0, 1]
 * with its mode at 0.5): monotonic, symmetric, 0 → 0, 0.5 → 0.5, → 1 as u → 1. Half of all records land within
 * ±0.15 of the centre (a uniform seed puts them within ±0.25).
 */
export function swarm(u: number): number {
  return u < 0.5 ? Math.sqrt(u / 2) : 1 - Math.sqrt((1 - u) / 2);
}

/** Lane-local y in lane units: row + 0.5 + (swarm(shaHash) − 0.5) × JITTER. */
export function rowY(row: number, shaHash: number): number {
  return row + 0.5 + (swarm(shaHash) - 0.5) * JITTER;
}

/** y (CSS px from the band top) of a record on `row` with beeswarm seed `shaHash` ∈ [0, 1). */
export function laneY(row: number, shaHash: number, laneH: number): number {
  return rowY(row, shaHash) * laneH;
}

/** sha7 hex → 28-bit integer (0 when absent or malformed). */
export function shaInt(sha7: string | null | undefined): number {
  if (!sha7 || !/^[0-9a-f]{7}$/i.test(sha7)) return 0;
  return parseInt(sha7, 16) >>> 0;
}

/** 28-bit integer → sha7 hex. */
export function shaHex(n: number): string {
  return (n >>> 0).toString(16).padStart(7, '0');
}

/* ------------------------------------------------------------------ records from the snapshot */

/** The part of src/data/snapshot.json this module reads: per repo id, [isoDate, sha7] pairs (oldest first). */
export interface SnapshotLike {
  repos?: Partial<Record<string, readonly (readonly string[])[]>>;
}

export interface LaneRecords extends Lane {
  /** index of this lane in LANES */
  lane: number;
  /** minutes since 2026-07-12 00:00 Taipei, ascending (0 in ordinal mode) */
  minutes: number[];
  /** sha7 hex ('' in ordinal mode) */
  shas: string[];
}

export interface FieldRecords {
  mode: AxisMode;
  lanes: LaneRecords[];
  count: number;
}

function validLane(list: unknown): list is readonly (readonly [string, string, ...string[]])[] {
  return (
    Array.isArray(list) &&
    list.every(
      (r) => Array.isArray(r) && typeof r[0] === 'string' && Number.isFinite(Date.parse(r[0])) && shaInt(r[1]) > 0,
    )
  );
}

/**
 * Every lane's commits, sorted by time. With a valid snapshot the axis is `time`; otherwise (`snap` missing or
 * malformed) the axis is `ordinal` and each lane holds `counts[id]` records with no dates and no shas.
 */
export function laneRecords(
  snap: SnapshotLike | null | undefined,
  counts: Readonly<Partial<Record<RepoId, number>>>,
): FieldRecords {
  const repos = snap?.repos;
  const ok = !!repos && LANES.every((l) => validLane(repos[l.id]));
  const lanes: LaneRecords[] = LANES.map((l, lane) => {
    const list = ok ? repos?.[l.id] : undefined;
    if (list) {
      const rows = list
        .map((r, i) => ({ m: minutesOf(r[0] ?? ''), sha: (r[1] ?? '').toLowerCase(), i }))
        .sort((a, b) => a.m - b.m || a.i - b.i);
      return { ...l, lane, minutes: rows.map((r) => r.m), shas: rows.map((r) => r.sha) };
    }
    const n = Math.max(0, Math.floor(counts[l.id] ?? 0));
    return { ...l, lane, minutes: new Array<number>(n).fill(0), shas: new Array<string>(n).fill('') };
  });
  return { mode: ok ? 'time' : 'ordinal', lanes, count: lanes.reduce((n, l) => n + l.minutes.length, 0) };
}

/** Geometry of record `i` of a lane: axis x ∈ [0, 1], y in lane units, twinkle seed. Same for GPU and poster. */
export function pointOf(
  mode: AxisMode,
  l: { lane: number; row: number; minutes: readonly number[]; shas: readonly string[] },
  i: number,
): { x: number; y: number; sx: number; sy: number } {
  const n = l.minutes.length;
  const x = timeX(l.minutes[i] ?? 0, mode, i, n);
  const [sx, sy] = seedOf(shaInt(l.shas[i]), l.lane, i);
  return { x, y: rowY(l.row, sy), sx, sy };
}
