// S1: the hero record's broken time axis (spec §6.1). Shared by the GPU scene, the static poster, the DOM ticks
// and the table, so these numbers are the contract between them.
import { describe, expect, it } from 'vitest';
import {
  BREAK,
  dayMinutes,
  EPOCH_MS,
  fmtDate,
  fmtDateTime,
  minutesOf,
  SEG_A,
  SEG_B,
  TICKS,
  timeX,
} from '@gl/gen/time-axis';

describe('time axis', () => {
  it('starts at 2026-07-12 00:00 Asia/Taipei', () => {
    expect(new Date(EPOCH_MS).toISOString()).toBe('2026-07-11T16:00:00.000Z');
    expect(minutesOf('2026-07-12T00:00:00+08:00')).toBe(0);
    expect(minutesOf('2026-07-12T01:27:31Z')).toBe(9 * 60 + 27);
    expect(Number.isNaN(minutesOf('not a date'))).toBe(true);
  });

  it('segment A is 63 days on [0, 0.22], segment B 18 days on [0.25, 1]', () => {
    expect(SEG_A.to / 1440).toBe(63);
    expect((SEG_B.to - SEG_B.from) / 1440).toBe(18);
    expect(timeX(0, 'time')).toBe(0);
    expect(timeX(dayMinutes('2026-09-13') - 1, 'time')).toBeCloseTo(0.22, 4);
    expect(timeX(dayMinutes('2026-09-13'), 'time')).toBe(0.25);
    expect(timeX(dayMinutes('2026-10-01'), 'time')).toBe(1);
  });

  it('the break sits in the gap between the segments', () => {
    expect(BREAK[0]).toBeGreaterThan(SEG_A.x1);
    expect(BREAK[1]).toBeLessThan(SEG_B.x0);
  });

  it('is monotonic and clamps out-of-range times', () => {
    let prev = -1;
    for (let m = -2000; m < 90 * 1440; m += 97) {
      const x = timeX(m, 'time');
      expect(x).toBeGreaterThanOrEqual(prev);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      prev = x;
    }
    expect(timeX(Number.NaN, 'time')).toBe(0);
  });

  it('places the spec §6.1 ticks', () => {
    const at = Object.fromEntries(TICKS.map((t) => [t.label, t.x]));
    expect(at['07-12']).toBe(0);
    expect(at['08-08']).toBeCloseTo(0.094, 3);
    expect(at['09-13']).toBe(0.25);
    expect(at['09-23']).toBeCloseTo(0.667, 3);
    expect(at['09-27']).toBeCloseTo(0.833, 3);
    expect(at['09-30']).toBeCloseTo(0.958, 3);
    expect(TICKS.filter((t) => t.account).map((t) => t.date)).toEqual(['2026-09-23']);
  });

  it('ordinal mode is (i + 0.5) / n and never reads the time', () => {
    expect(timeX(123456, 'ordinal', 0, 2)).toBe(0.25);
    expect(timeX(0, 'ordinal', 1, 2)).toBe(0.75);
    expect(timeX(0, 'ordinal', 0, 1)).toBe(0.5);
  });

  it('formats Taipei dates', () => {
    const m = minutesOf('2026-09-30T13:19:24Z'); // 21:19 in Taipei
    expect(fmtDate(m)).toBe('2026-09-30');
    expect(fmtDateTime(m)).toBe('2026-09-30 21:19');
    expect(fmtDate(minutesOf('2026-09-30T16:30:00Z'))).toBe('2026-10-01');
  });
});
