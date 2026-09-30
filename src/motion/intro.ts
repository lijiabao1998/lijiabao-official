// src/motion/intro.ts — STUB from F0. Owner: S1 (§5.2 the Baseline Scan, ≤ 1.4s).
// Replace the body; keep the signature. The runtime (boot.ts) calls setup(main, ctx) once per FULL load, before
// the sections, only when html[data-intro] is present on home (the head boot decides; see motion.css contract:
// [data-weigh="scan"], [data-intro-line], [data-intro-rise], [data-intro-dot]).
//
// Contract:
// - Call endIntro() from ../lib/prefs when the scan ends or is skipped (first pointerdown/keydown/wheel/touchstart
//   → tl.progress(1)). It removes html[data-intro], writes lj.v and emits 'lj:intro-done'.
// - Drive the field with ctx.engine?.get('field')?.set('uScan', p) (prim.scan's onProgress). Late engine: when
//   ctx.engine?.ready resolves after the scan, ignite over 600ms.
// - Return a Cleanup; the runtime also calls endIntro() on teardown as a safety net.
// This stub ends the intro at once (every before-state returns to rest).

import { endIntro } from '../lib/prefs';
import type { Cleanup, MotionCtx } from './registry';

export function setup(_root: HTMLElement, _ctx: MotionCtx): Cleanup {
  endIntro();
  return () => {};
}
