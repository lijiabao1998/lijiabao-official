// src/motion/sections/gt-hero.ts — #gt-hero (§5.3). Owner: S4.
//
// - Direct load (not a ClientRouter arrival, where the h1 flies in by view transition): one scan runs along the
//   baseline under the title (the hairline draws from the left, an amber head rides it), and every character of
//   the title gains weight as the head passes its left edge, then settles back (rest → lit → rest): light comes
//   from the left. CJK is weighed per character (1em advance, no reflow); a Latin title as one locked line.
// - Every load: the baseline draws, and the fact chips settle from 0.92 (0.48s lj.settle, 0.05 stagger).
// - Reduced motion: nothing moves (the CSS before-states only exist under data-motion="full").
// Reads happen once, before any write; no layout reads while animating.

import type { Cleanup, MotionCtx } from '../registry';
import { MQ } from '../registry';
import { DUR, EASE, stagger } from '../eases';
import { isZh, qs, qsa } from '../../lib/dom';
import { restWeight } from '../primitives/weigh';

/** One module instance per document: only its first setup can be a direct load. */
let firstSetup = true;

function directLoad(): boolean {
  if (!firstSetup) return false;
  firstSetup = false;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return true;
  const bare = (u: string): string => u.split('#')[0] ?? u;
  return bare(nav.name) === bare(location.href);
}

export function setup(root: HTMLElement, ctx: MotionCtx): Cleanup {
  const { gsap } = ctx;
  const direct = directLoad();
  const title = qs('[data-gh-title] .display__line', root) ?? qs('[data-gh-title]', root);
  const line = qs('[data-gh-line]', root);
  const dot = qs('[data-gh-dot]', root);
  const chips = qsa('[data-gh-chip]', root);

  ctx.mm.add({ full: MQ.full, reduce: MQ.reduce, desktop: MQ.desktop, fine: MQ.fine }, (c, contextSafe) => {
    if (!(c.conditions as { full?: boolean } | undefined)?.full) return;

    // chips: 0.92 → 1 (the CSS before-state holds them at 0.92 until now)
    if (chips.length) {
      gsap.set(chips, { animation: 'none', scale: 0.92 });
      gsap.to(chips, {
        scale: 1,
        duration: DUR.m,
        ease: EASE.settle,
        stagger: stagger(0.05, chips.length),
        delay: direct ? 0.35 : 0.2,
      });
    }

    if (!line) return;
    gsap.set(line, { animation: 'none' });

    // title weigh targets + their left edges along the baseline, read once
    let targets: HTMLElement[] = [];
    let edges: number[] = [];
    let split: SplitText | null = null;
    if (direct && title) {
      const zh = isZh(title);
      if (zh) {
        split = ctx.prim.split(title, 'chars');
        targets = split.chars as HTMLElement[];
      } else targets = [title];
      const base = line.getBoundingClientRect().left;
      edges = targets.map((el) => el.getBoundingClientRect().left - base);
    }
    const width = line.offsetWidth || 1;
    const rest = title ? restWeight(title) : 560;
    const lit = rest + 200;
    const fired = new Array<boolean>(targets.length).fill(false);

    // rest → lit → rest as the head passes (created from a tween callback: contextSafe records it for revert)
    const weighIn = (el: HTMLElement): void => {
      gsap.set(el, { fontVariationSettings: `"wght" ${rest}` });
      gsap.to(el, {
        keyframes: [
          { fontVariationSettings: `"wght" ${lit}`, duration: 0.3, ease: EASE.weigh },
          { fontVariationSettings: `"wght" ${rest}`, duration: 0.5, ease: EASE.rise },
        ],
        onComplete: () => {
          gsap.set(el, { clearProps: 'fontVariationSettings' });
        },
      });
    };
    const weigh = (contextSafe ? contextSafe(weighIn) : weighIn) as (el: HTMLElement) => void;

    const tl = gsap.timeline({ delay: 0.1 });
    if (dot && direct) tl.to(dot, { opacity: 1, duration: DUR.xs, ease: EASE.rise }, 0);
    tl.add(
      ctx.prim.scan(line, {
        dot: direct ? (dot ?? undefined) : undefined,
        duration: direct ? 1 : 0.8,
        onProgress: (p) => {
          const x = p * width;
          for (let i = 0; i < targets.length; i++) {
            if (!fired[i] && x >= (edges[i] as number)) {
              fired[i] = true;
              weigh(targets[i] as HTMLElement);
            }
          }
        },
      }),
      0,
    );
    if (dot && direct) tl.to(dot, { opacity: 0, scale: 0.4, duration: DUR.s, ease: EASE.exit }, '>-0.1');
    if (split) {
      const s = split;
      tl.call(() => s.revert(), undefined, '+=0.6'); // the heading is plain text again once it has settled
    }

    return () => {
      split?.revert();
    };
  });

  return () => {};
}
