// src/motion/settle.ts — scroll entrances can never get stuck (P3).
//
// Every one-shot entrance on this site is a ScrollTrigger with `once: true` (a tween's or timeline's scrollTrigger,
// ST.create or ST.batch). ScrollTrigger keeps such a trigger alive until it has entered, so the live ones in
// ST.getAll() are exactly the entrances still waiting. The runtime (boot.ts) settles the ones a reader can no
// longer wait for — at the fail-open (§5.1, astro:page-load + 2.5s) and at the very end of the page (a start line
// that can never be crossed): a waiting entrance whose trigger element is in or above the viewport enters now and
// plays. Sections register nothing. Scrubbed and pinned animations are never touched (the scroll position owns
// them). A starved requestAnimationFrame (hidden / occluded window) is boot.ts's pump's job: it ticks GSAP itself.

import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';

/** Is an entrance whose trigger element's top is `top` px from the viewport top in or above the viewport? Pure. */
export const due = (top: number, vh: number): boolean => top < vh - 1;

/** Settle the waiting entrances (see the header). */
export function settle(ST: typeof ScrollTriggerClass): void {
  ST.update(); // catch up with a scroll event still queued: what the reader just reached enters on its own
  const vh = window.innerHeight;
  for (const st of ST.getAll()) {
    const el = st.trigger;
    const a = st.animation;
    if (!st.vars.once || !(el instanceof Element) || !due(el.getBoundingClientRect().top, vh)) continue;
    // entered and playing (a timeline-attached trigger may have entered without un-pausing: play that one)
    if (st.progress > 0 && (!a || !a.paused())) continue;
    if (!st.progress) (st.vars.onEnter as ((self: ScrollTrigger) => void) | undefined)?.(st);
    a?.play();
    st.kill(false, true);
  }
}
