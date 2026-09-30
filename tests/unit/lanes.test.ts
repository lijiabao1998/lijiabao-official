// S1: the hero record's lanes and records (spec §6.1): 19 repo lanes on 20 rows, every default-branch commit
// in the snapshot on its lane, counts equal to facts.ts, and a binary the scene can decode.
import { describe, expect, it } from 'vitest';
import { facts } from '@data/facts';
import { REPOS } from '@data/repos';
import snapshot from '@data/snapshot.json';
import manifest from '@data/gl-manifest.json';
import { JITTER, LANES, laneRecords, laneY, pointOf, ROWS, rowY, seedOf, shaHex, shaInt, SPACER_ROW } from '@gl/gen/lanes';
import { timeX } from '@gl/gen/time-axis';
import { decode, PickGrid, stepFrom, type Band } from '@gl/scenes/inspect';

const counts = Object.fromEntries(REPOS.map((r) => [r.id, r.commits]));

describe('lanes', () => {
  it('follows REPOS order: 3 GlimmerTown lanes, a spacer, governance, 15 labs', () => {
    expect(LANES.map((l) => l.id)).toEqual(REPOS.map((r) => r.id));
    expect(LANES.map((l) => l.repo)).toEqual(REPOS.map((r) => r.repo));
    expect(LANES.map((l) => l.row)).toEqual([0, 1, 2, ...Array.from({ length: 16 }, (_, i) => i + 4)]);
    expect(ROWS).toBe(20);
    expect(LANES.some((l) => l.row === SPACER_ROW)).toBe(false);
    expect(new Set(LANES.map((l) => l.short)).size).toBe(LANES.length);
  });

  it('keeps every record inside its own lane (beeswarm ≤ ±0.35 lane)', () => {
    for (const s of [0, 0.5, 0.999999]) {
      const y = rowY(7, s);
      expect(y).toBeGreaterThanOrEqual(7 + 0.5 - JITTER / 2);
      expect(y).toBeLessThanOrEqual(7 + 0.5 + JITTER / 2);
    }
    expect(laneY(0, 0.5, 20)).toBe(10);
  });

  it('seeds are deterministic and in [0, 1)', () => {
    const a = seedOf(0x758c39d);
    expect(seedOf(0x758c39d)).toEqual(a);
    expect(seedOf(0x758c39e)).not.toEqual(a);
    for (const v of [...a, ...seedOf(0, 3, 9)]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(shaHex(shaInt('0f9ae29'))).toBe('0f9ae29');
    expect(shaInt('nope')).toBe(0);
  });
});

describe('records', () => {
  const rec = laneRecords(snapshot, counts);

  it('reads every snapshot commit on the time axis, counts equal to facts.ts', () => {
    expect(rec.mode).toBe('time');
    expect(rec.count).toBe(facts['commits.total'].value);
    for (const l of rec.lanes) {
      expect(l.minutes.length, l.repo).toBe(facts[`commits.${l.id}` as keyof typeof facts].value);
      for (let i = 1; i < l.minutes.length; i++) expect(l.minutes[i]).toBeGreaterThanOrEqual(l.minutes[i - 1] as number);
      expect(l.minutes[0], l.repo).toBeGreaterThanOrEqual(0); // nothing predates the axis origin
    }
  });

  it('falls back to the ordinal axis with facts.ts counts and no dates', () => {
    for (const bad of [null, {}, { repos: { gt: [['x', 'y']] } }]) {
      const o = laneRecords(bad as never, counts);
      expect(o.mode).toBe('ordinal');
      expect(o.count).toBe(facts['commits.total'].value);
      expect(o.lanes.every((l) => l.shas.every((s) => s === ''))).toBe(true);
      const p = pointOf('ordinal', o.lanes[5]!, 0); // FrontierPhysics: 2 commits
      expect(p.x).toBe(0.25);
    }
  });

  it('pointOf is the shared geometry (x from the axis, y from the lane)', () => {
    const l = rec.lanes[0]!;
    const p = pointOf('time', l, 0);
    expect(p.x).toBe(timeX(l.minutes[0]!, 'time'));
    expect(p.y).toBe(rowY(l.row, seedOf(shaInt(l.shas[0]))[1]));
  });
});

// node:fs without @types/node (the project ships none): a typed dynamic import.
type Fs = { readFileSync(p: URL): { buffer: ArrayBuffer; byteOffset: number; byteLength: number } };
const fs = (await import('node:fs' as string)) as Fs;

describe('commits.bin', () => {
  const entry = (manifest as unknown as Record<string, { url: string; count: number; mode: string }>).field!;
  const file = fs.readFileSync(new URL(`../../public${entry.url}`, import.meta.url));
  const bin = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
  const d = decode(bin);
  const rec = laneRecords(snapshot, counts);

  it('decodes to the same records and geometry as the poster', () => {
    expect(d.count).toBe(entry.count);
    expect(d.mode).toBe('time');
    expect(d.asOf).toBe(snapshot.asOf);
    let i = 0;
    for (const l of rec.lanes) {
      expect(d.laneStart[l.lane]).toBe(i);
      for (let k = 0; k < l.minutes.length; k++, i++) {
        const p = pointOf('time', l, k);
        expect(d.lane[i]).toBe(l.lane);
        expect(shaHex(d.sha[i]!)).toBe(l.shas[k]);
        expect(d.x[i]).toBeCloseTo(p.x, 5);
        expect(d.y[i]).toBeCloseTo(p.y, 5);
      }
      expect(d.latest[i - 1]).toBe(1);
    }
    expect(d.latest.reduce((n, v) => n + v, 0)).toBe(LANES.length);
  });

  it('picks the nearest record within 16px and steps by lane and time', () => {
    const band: Band = { x: 16, y: 32, w: 1000, h: 400, laneH: 20 };
    const g = new PickGrid();
    g.build(d, band);
    const last = (d.laneStart[1] as number) - 1; // GlimmerTown's latest commit
    const px = band.x + d.x[last]! * band.w;
    const py = band.y + d.y[last]! * band.laneH;
    expect(g.nearest(px + 1, py - 1)).toBe(last);
    expect(g.nearest(px, py + 400)).toBe(-1);
    expect(stepFrom(d, -1, 'next')).toBe(last);
    expect(stepFrom(d, last, 'next')).toBe(last);
    expect(stepFrom(d, last, 'prev')).toBe(last - 1);
    expect(stepFrom(d, last, 'home')).toBe(0);
    const down = stepFrom(d, last, 'down');
    expect(d.lane[down]).toBe(1);
    expect(stepFrom(d, 0, 'up')).toBe(0);
  });
});
