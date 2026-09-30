// src/lib/events.ts — the document event bus (§9.3). Static-tier safe: no GSAP, no engine.
//
//   'lj:tier'       {tier, src, count, reason?}  tier changed, OR the live glimmer count changed (same tier,
//                                                src 'auto', no reason). HUD + TierFieldset listen to this.
//   'lj:intro-done' null                         the §5.2 intro ended (played, skipped or cut short).
//   'lj:gl'         {state, count}               GL runtime state (mirrors html[data-gl]) or count changed.
//
// UI never imports the engine; it listens here and reads <html> data attributes.

import type { GlState, Tier } from '../gl/types';

export type TierSrc = 'user' | 'auto';
/** Why the tier changed. Absent on count-only updates. */
export type TierReason = 'user' | 'cleared' | 'session' | 'promoted' | 'demoted' | 'lost' | 'noWebgl';

export interface TierDetail {
  tier: Tier;
  src: TierSrc;
  /** Glimmers drawn now (engine.count()); 0 when no engine runs. */
  count: number;
  reason?: TierReason;
}

export interface GlDetail {
  state: GlState | 'off';
  count: number;
}

export interface LjEventMap {
  'lj:tier': TierDetail;
  'lj:intro-done': null;
  'lj:gl': GlDetail;
}
export type LjEvent = keyof LjEventMap;

declare global {
  interface DocumentEventMap {
    'lj:tier': CustomEvent<TierDetail>;
    'lj:intro-done': CustomEvent<null>;
    'lj:gl': CustomEvent<GlDetail>;
  }
}

const latest: { [K in LjEvent]?: LjEventMap[K] } = {};

export function emit<K extends LjEvent>(type: K, detail: LjEventMap[K]): void {
  latest[type] = detail;
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

export function on<K extends LjEvent>(type: K, cb: (detail: LjEventMap[K]) => void): () => void {
  const h = (e: Event): void => cb((e as CustomEvent<LjEventMap[K]>).detail);
  document.addEventListener(type, h);
  return () => document.removeEventListener(type, h);
}

/** The last detail emitted for `type` in this document (for listeners that mount late, e.g. after a swap). */
export function last<K extends LjEvent>(type: K): LjEventMap[K] | undefined {
  return latest[type];
}
