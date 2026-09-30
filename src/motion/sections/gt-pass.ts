// src/motion/sections/gt-pass.ts — STUB from F0. Owner: S4 (§5.3 #gt-pass pinned PASS grid).
// Replace the body; keep the signature (motion/registry.ts already maps data-motion="gt-pass" to this file).
// Contract (§9.3): you run inside gsap.context(root) with your own ctx.mm; create tweens and ScrollTriggers
// inside ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, desktop: MQ.desktop, fine: MQ.fine }, …), use EASE.*
// from ../eases, return a Cleanup for non-GSAP work, and keep working when ctx.engine / ctx.lenis are null.

import type { Cleanup, MotionCtx } from '../registry';

export function setup(_root: HTMLElement, _ctx: MotionCtx): Cleanup {
  return () => {};
}
