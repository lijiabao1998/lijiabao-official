// src/motion/primitives/index.ts — builds the Primitives object handed to every section as ctx.prim (§9.3).
// Each primitive is safe to call under reduced motion (it lands on the end state at once) and records its
// tweens in the caller's gsap.context, so the runtime's revert cleans everything up.

import type { gsap as GsapCore } from 'gsap';
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';
import type { SplitText as SplitTextClass } from 'gsap/SplitText';
import type { Primitives } from '../registry';
import { makeInteractive } from './interactive';
import { makeMagnet } from './magnet';
import { makeRise } from './rise';
import { makeScan } from './scan';
import { makeSplit } from './split';
import { makeTick } from './tick';
import { makeUnderline } from './underline';
import { makeWeigh } from './weigh';

export type { Primitives };

export interface PrimDeps {
  gsap: typeof GsapCore;
  ST: typeof ScrollTriggerClass;
  SplitText: typeof SplitTextClass;
}

export function createPrimitives(d: PrimDeps): Primitives {
  const split = makeSplit(d);
  const interactive = makeInteractive();
  const weigh = makeWeigh(d, split);
  return {
    rise: makeRise(d),
    weigh,
    scan: makeScan(d),
    tick: makeTick(d),
    magnet: makeMagnet(d),
    interactive,
    split,
    underline: makeUnderline(d, interactive, weigh),
  };
}
