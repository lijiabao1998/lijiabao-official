// src/motion/sections/gt-3d.ts — STUB from F0. Owner: S4 (§5.3 #gt-3d parity figure).
// Replace the body; keep the signature (motion/registry.ts already maps data-motion="gt-3d" to this file).
// Contract (§9.3): you run inside gsap.context(root) with your own ctx.mm; create tweens and ScrollTriggers
// inside ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, desktop: MQ.desktop, fine: MQ.fine }, …), use EASE.*
// from ../eases, return a Cleanup for non-GSAP work, and keep working when ctx.engine / ctx.lenis are null.

import type { Cleanup, MotionCtx } from '../registry';

export function setup(_root: HTMLElement, _ctx: MotionCtx): Cleanup {
  return () => {};
}
