// src/gl/gen/time-axis.ts — the hero record's honest, visibly broken time axis (spec §6.1). Pure, deterministic,
// Node-safe: shared by the field scene (GPU x), the static poster (/posters/field.svg), HeroField's DOM ticks,
// CommitTable's dates, scripts/pack-commits.mjs and tests/unit/time-axis.test.ts.
//
// Time is Asia/Taipei (UTC+8, no DST). Minutes are counted from 2026-07-12 00:00 +08:00.
//   Segment A  2026-07-12 → 2026-09-13 (63 days)  → x ∈ [0, 0.22]      (compressed: GlimmerTown's early history)
//   break      x ∈ [0.225, 0.245]                  (two slanted hairlines + hero.fig.break)
//   Segment B  2026-09-13 → 2026-10-01 (18 days)  → x ∈ [0.25, 1.0]
// Ordinal fallback (no snapshot): x = (i + 0.5) / n within each lane; no date is ever estimated.

export type AxisMode = 'time' | 'ordinal';

export const DAY_MIN = 1440;
/** Asia/Taipei offset in minutes (no daylight saving). */
export const TZ_MIN = 480;
/** 2026-07-12T00:00:00+08:00 in epoch ms. */
export const EPOCH_MS = Date.UTC(2026, 6, 11, 16, 0, 0);

export const SEG_A = { from: 0, to: 63 * DAY_MIN, x0: 0, x1: 0.22 } as const;
export const SEG_B = { from: 63 * DAY_MIN, to: 81 * DAY_MIN, x0: 0.25, x1: 1 } as const;
/** The axis break marker, in axis x. */
export const BREAK: readonly [number, number] = [0.225, 0.245];

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Minutes since 2026-07-12 00:00 (Taipei) of an ISO timestamp (floored; may be negative). NaN on bad input. */
export function minutesOf(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor((ms - EPOCH_MS) / 60000) : Number.NaN;
}

/**
 * Axis x ∈ [0, 1] of a record. `time`: its minute on the broken axis. `ordinal`: (i + 0.5) / n, the record's
 * position in its lane (i, n required). Out-of-range minutes clamp to the axis ends.
 */
export function timeX(minutesSince0712: number, mode: AxisMode, i?: number, n?: number): number {
  if (mode === 'ordinal') {
    const count = n && n > 0 ? n : 1;
    return clamp01(((i ?? 0) + 0.5) / count);
  }
  const m = minutesSince0712;
  if (!(m > SEG_A.from)) return SEG_A.x0;
  if (m < SEG_A.to) return SEG_A.x0 + ((m - SEG_A.from) / (SEG_A.to - SEG_A.from)) * (SEG_A.x1 - SEG_A.x0);
  if (m >= SEG_B.to) return SEG_B.x1;
  return SEG_B.x0 + ((m - SEG_B.from) / (SEG_B.to - SEG_B.from)) * (SEG_B.x1 - SEG_B.x0);
}

const pad = (v: number): string => (v < 10 ? `0${v}` : String(v));

/** Taipei calendar parts of a minute on the axis. */
export function taipeiParts(minutes: number): { y: number; mo: number; d: number; h: number; mi: number } {
  const t = new Date(EPOCH_MS + minutes * 60000 + TZ_MIN * 60000);
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes() };
}

/** 'YYYY-MM-DD' (Taipei). */
export function fmtDate(minutes: number): string {
  const p = taipeiParts(minutes);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
}

/** 'YYYY-MM-DD HH:mm' (Taipei). */
export function fmtDateTime(minutes: number): string {
  const p = taipeiParts(minutes);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`;
}

/** Minutes of a Taipei calendar day at 00:00 ('2026-09-23'). */
export function dayMinutes(ymd: string): number {
  return minutesOf(`${ymd}T00:00:00+08:00`);
}

export interface Tick {
  /** Taipei day, 'YYYY-MM-DD' */
  date: string;
  /** mono tick label, 'MM-DD' */
  label: string;
  x: number;
  /** the account-creation tick (labelled with hero.fig.tick.account) */
  account?: boolean;
  /** dropped under 640px so labels never collide */
  minor?: boolean;
}

function tick(date: string, extra: Partial<Tick> = {}): Tick {
  return { date, label: date.slice(5), x: timeX(dayMinutes(date), 'time'), ...extra };
}

function buildTicks(): readonly Tick[] {
  return [
    tick('2026-07-12'),
    tick('2026-08-08', { minor: true }),
    tick('2026-09-13'),
    tick('2026-09-23', { account: true }),
    tick('2026-09-27', { minor: true }),
    tick('2026-09-30'),
  ];
}

/** The DOM axis ticks (spec §6.1 table): 07-12 · 08-08 · 09-13 · 09-23 (account) · 09-27 · 09-30. */
export const TICKS: readonly Tick[] = /* @__PURE__ */ buildTicks();
