// src/gl/core/loop.ts — the engine runs on ONE clock (gsap.ticker, §5.1) and only while something needs it.
// The frame callback returns true to keep going; two idle frames in a row remove it from the clock, so the
// rAF stops when nothing animates. wake() re-adds it at the END of the clock's list (after lenis.raf and
// ScrollTrigger), so rects are read after this frame's scroll position and every GSAP write.

import type { Clock } from '../types';

/** Standalone rAF clock (tests, mock, and the case where no gsap.ticker is passed). */
export function rafClock(): Clock {
  const fns: (() => void)[] = [];
  let id = 0;
  const run = (): void => {
    id = 0;
    for (let i = 0; i < fns.length; i++) (fns[i] as () => void)();
    if (fns.length && !id) id = requestAnimationFrame(run);
  };
  return {
    add(fn) {
      if (!fns.includes(fn)) fns.push(fn);
      if (!id) id = requestAnimationFrame(run);
    },
    remove(fn) {
      const i = fns.indexOf(fn);
      if (i >= 0) fns.splice(i, 1);
      if (!fns.length && id) {
        cancelAnimationFrame(id);
        id = 0;
      }
    },
  };
}

export interface Loop {
  wake(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop(clock: Clock, frame: () => boolean): Loop {
  let running = false;
  let idle = 0;
  const run = (): void => {
    if (frame()) idle = 0;
    else if (++idle > 1) stop();
  };
  function stop(): void {
    if (!running) return;
    running = false;
    clock.remove(run);
  }
  return {
    wake() {
      idle = 0;
      if (running) return;
      running = true;
      clock.add(run);
    },
    stop,
    get running() {
      return running;
    },
  };
}
