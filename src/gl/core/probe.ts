// src/gl/core/probe.ts — the one-time upgrade test lite → full (auto) (§6.0; first thing to cut, §10).
//
// When: after `load`, then idle, on home, in lite, motion full, no stored user choice, no Save-Data, not yet
// decided this session, deviceMemory ?? 8 ≥ 4, hardwareConcurrency ≥ 4.
// What: 60 consecutive frames in which a scene is actually drawn.
// Pass: p90 frame interval < 11ms — read relative to the display: ≤ max(11ms, 1.2 × its refresh interval), i.e.
//       no dropped frames on 60 Hz, and literally < 11ms on ≥ 90 Hz — AND p90 engine JS time < 3ms (§8 budget).
// The decision is cached in sessionStorage (prefs); the HUD shows `tier.promoted` for 3s.

import { getTier, isLocked, isReduced, probeDone, saveData, storedTier } from '../../lib/prefs';

const N = 60;
/** give up (no decision cached) after this much sampling time */
const TIMEOUT_MS = 12000;

export function probeEligible(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (
    getTier() === 'lite' &&
    !isReduced() &&
    !storedTier() &&
    !probeDone() &&
    !isLocked() &&
    !saveData() &&
    (nav.deviceMemory ?? 8) >= 4 &&
    (navigator.hardwareConcurrency ?? 0) >= 4
  );
}

export class Probe {
  active = false;
  private readonly dts = new Float32Array(N);
  private readonly busy = new Float32Array(N);
  private n = 0;
  private spent = 0;

  /** `done(true)` promote · `done(false)` stay lite · `done(null)` inconclusive (timed out / cancelled) */
  constructor(private readonly done: (promote: boolean | null) => void) {}

  start(): void {
    this.active = true;
    this.n = 0;
    this.spent = 0;
  }

  cancel(): void {
    if (!this.active) return;
    this.active = false;
  }

  /** One drawn frame: dt = ms since the previous tick, busyMs = the engine's JS time this frame. */
  sample(dt: number, busyMs: number): void {
    if (!this.active) return;
    this.spent += dt;
    if (this.spent > TIMEOUT_MS) {
      this.active = false;
      this.done(null);
      return;
    }
    if (!(dt > 0) || dt > 250) return;
    this.dts[this.n] = dt;
    this.busy[this.n] = busyMs;
    if (++this.n < N) return;
    this.active = false;
    const base = Math.min(...this.dts);
    const p90 = (a: Float32Array): number => a.slice().sort()[Math.floor(N * 0.9)] ?? Infinity;
    this.done(p90(this.dts) <= Math.max(11, base * 1.2) && p90(this.busy) < 3);
  }
}
