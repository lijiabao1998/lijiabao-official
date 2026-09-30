// src/gl/core/guard.ts — the adaptive guard (§6.0). Fed the interval between consecutive drawn frames.
//
// EMA of frame time; "slow" = EMA over the limit AND over 1.25× the display's own refresh interval (so a
// 30 Hz-capped display — Safari low-power — is not mistaken for jank). The refresh interval is calibrated from
// idle ticks at mount (nothing drawn yet), then tracks the fastest frame seen. Slow for 2s → one step down:
//   full: DPR → 1, halo off, portrait halved (prefix), then demote to lite ('tier.demoted')
//   lite: DPR → 1 (lite renders at ≤ 1.5 so the soft glimmers stay crisp on 2× screens), portrait halved, then
//         freeze if the EMA stays above 24ms ('tier.frozen')
// DATA scenes never subsample (k stays 1). It never promotes; the probe does that, once, before any demotion.

import type { Tier } from '../types';

export type GuardStep = 'dpr' | 'halo' | 'half' | 'demote' | 'freeze';

const FULL: readonly GuardStep[] = ['dpr', 'halo', 'half', 'demote'];
const LITE: readonly GuardStep[] = ['dpr', 'half', 'freeze'];

export class Guard {
  private ema = 16.7;
  /** display refresh interval estimate (ms); Infinity until calibrated */
  private base = Infinity;
  private slowMs = 0;
  private warm = 0;
  private readonly done = new Set<GuardStep>();

  /** `apply` returns false when a step changes nothing here (then the next step is tried at once). */
  constructor(private readonly apply: (s: GuardStep) => boolean) {}

  /** After a tier change: forget the history (a user choice gets a clean slate). */
  reset(): void {
    this.done.clear();
    this.rest();
  }

  /** An idle tick interval (no drawing): the display's refresh cadence. */
  calibrate(dt: number): void {
    if (dt > 4 && dt < 100 && dt < this.base) this.base = dt;
  }

  private rest(): void {
    this.ema = Number.isFinite(this.base) ? this.base : 16.7;
    this.slowMs = 0;
    this.warm = 0;
  }

  /** dt = ms since the previous drawn frame (only consecutive frames; the engine filters idle gaps). */
  sample(dt: number, tier: Tier): void {
    if (!(dt > 0) || dt > 250) return;
    if (!Number.isFinite(this.base)) this.base = 16.7;
    this.base = dt < this.base ? dt : this.base + (dt - this.base) * 0.001;
    if (this.warm < 20) {
      // shader compile, first uploads: ignore the first frames after a wake / step
      this.warm++;
      return;
    }
    this.ema += (dt - this.ema) * 0.1;
    const order = tier === 'full' ? FULL : LITE;
    let next: GuardStep | undefined;
    for (let i = 0; i < order.length; i++) {
      const s = order[i] as GuardStep;
      if (!this.done.has(s)) {
        next = s;
        break;
      }
    }
    if (!next) return;
    const limit = next === 'freeze' ? 24 : 20;
    const slow = this.ema > limit && this.ema > this.base * 1.25;
    this.slowMs = slow ? this.slowMs + dt : 0;
    if (this.slowMs < 2000) return;
    this.rest();
    for (const s of order) {
      if (this.done.has(s)) continue;
      this.done.add(s);
      if (this.apply(s)) return;
    }
  }
}
