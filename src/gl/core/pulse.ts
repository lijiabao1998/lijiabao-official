// src/gl/core/pulse.ts — engine.pulse(x, y): one ring of brightness through the RECORDS (never empty space)
// over ~0.8s (§5.4). Parity for focus / tap. The scene shader does the ring; this only holds its origin + t0.

/** seconds a pulse keeps the loop awake (ring + decay) */
export const PULSE_LIFE = 1.2;

export class Pulse {
  x = 0;
  y = 0;
  t0 = -1e9;
  s = 0;

  /** x, y viewport CSS px; t = engine seconds */
  fire(x: number, y: number, t: number, strength: number): void {
    this.x = x;
    this.y = y;
    this.t0 = t;
    this.s = strength;
  }

  active(t: number): boolean {
    return this.s > 0 && t - this.t0 < PULSE_LIFE;
  }

  /** → Frame.pulse, anchor-local. strength 0 when inactive. */
  write(out: [number, number, number, number], anchor: { x: number; y: number }, t: number): void {
    const on = this.active(t);
    out[0] = this.x - anchor.x;
    out[1] = this.y - anchor.y;
    out[2] = on ? this.t0 : -1e9;
    out[3] = on ? this.s : 0;
  }
}
