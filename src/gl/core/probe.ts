// src/gl/core/probe.ts — the one-time upgrade test lite → full (auto) (§6.0, §7; first thing to cut, §10).
//
// Who (probeEligible): tier lite, motion full, no stored user choice (localStorage lj.tier always wins), no Save-Data,
// not decided or locked this session, a desktop-class device — a fine hovering pointer, not the §7 mobile query —
// with hardwareConcurrency ≥ 8 or deviceMemory ≥ 8, and a working WebGL2 context (the engine only probes once mounted).
// Phones, tablets and small machines stay lite without being measured.
// When: after `load`, then idle, on any page with a GL scene, only while the document is VISIBLE — a hidden or
// occluded tab throttles or stops rAF, and a throttled rAF must never read as a slow GPU. Hiding the tab mid-sample
// discards the sample; it starts again once visible.
// What: 90 consecutive frames in which a scene is actually drawn (the first 10 are warm-up: uploads, first draws).
// Verdict (judge):
//   - the display's cadence = the 25th percentile frame interval (robust to the odd long frame, unlike the minimum);
//   - FAIL when the engine's own JS time is not comfortably inside the frame (p90 ≥ 4ms, a quarter of 16.7ms), when
//     the page cannot hold 60fps (cadence > 18ms: a weak GPU, or a 30Hz-capped screen), or when it keeps missing
//     frames at that cadence (median > 1.5× the cadence + 1ms: the GPU cannot keep up with every other frame);
//   - PASS when the frames are steady at that cadence: median ≤ 1.2× and p90 ≤ 1.5× the cadence (+1ms);
//   - otherwise INCONCLUSIVE — mostly steady, but something else janked the main thread (a lazy chunk, a font):
//     the probe tries again at the next idle, up to 3 times per page, and decides nothing if it never settles.
// The decision is cached in sessionStorage (prefs); the HUD shows `tier.promoted` for 3s. The adaptive guard still
// watches full afterwards and demotes if it ever struggles.

import { getTier, isLocked, isReduced, probeDone, saveData, storedTier } from '../../lib/prefs';
import { MQ } from '../../lib/dom';

const N = 90;
const WARM = 10;
/** give up on one attempt (inconclusive) after this much drawn time */
const TIMEOUT_MS = 6000;

export type Verdict = 'pass' | 'fail' | 'retry';

const q = (a: Float32Array | number[], f: number): number => {
  const s = Array.from(a).sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(s.length * f))] ?? Infinity;
};

/** The probe's rule (see the header), on frame intervals and engine JS times in ms. Pure. */
export function judge(dts: ArrayLike<number>, busy: ArrayLike<number>): Verdict {
  const d = Array.from(dts);
  const b = Array.from(busy);
  if (!d.length) return 'retry';
  const cadence = q(d, 0.25);
  const med = q(d, 0.5);
  const p90 = q(d, 0.9);
  if (q(b, 0.9) >= 4 || cadence > 18 || med > cadence * 1.5 + 1) return 'fail';
  if (med <= cadence * 1.2 && p90 <= cadence * 1.5 + 1) return 'pass';
  return 'retry';
}

/** A desktop-class device with the cores or memory for the full tier (§6.0 / §7). */
export function capable(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 0;
  const cores = nav.hardwareConcurrency ?? 0;
  return window.matchMedia(MQ.fine).matches && !window.matchMedia(MQ.mobile).matches && (cores >= 8 || mem >= 8);
}

export function probeEligible(): boolean {
  return (
    getTier() === 'lite' &&
    !isReduced() &&
    !storedTier() &&
    !probeDone() &&
    !isLocked() &&
    !saveData() &&
    capable()
  );
}

export class Probe {
  active = false;
  private readonly dts = new Float32Array(N);
  private readonly busy = new Float32Array(N);
  private n = 0;
  private warm = 0;
  private spent = 0;

  /** `done('pass')` promote · `done('fail')` stay lite · `done('retry')` inconclusive (noisy, timed out) */
  constructor(private readonly done: (v: Verdict) => void) {}

  start(): void {
    this.active = true;
    this.n = 0;
    this.warm = 0;
    this.spent = 0;
  }

  /** Stop without a verdict (tab hidden, page left): the samples are dropped. */
  cancel(): void {
    this.active = false;
  }

  /**
   * One drawn frame. `dt` = ms since the previous tick, `busyMs` = the engine's JS time this frame, `continuous`
   * = the previous tick was the frame before (no idle gap, no wake-up) — only those intervals are frame times.
   */
  sample(dt: number, busyMs: number, continuous = true): void {
    if (!this.active) return;
    if (!continuous || !(dt > 0) || dt > 100) return;
    this.spent += dt;
    if (this.spent > TIMEOUT_MS) {
      this.active = false;
      this.done('retry');
      return;
    }
    if (this.warm < WARM) {
      this.warm++;
      return;
    }
    this.dts[this.n] = dt;
    this.busy[this.n] = busyMs;
    if (++this.n < N) return;
    this.active = false;
    this.done(judge(this.dts, this.busy));
  }
}
