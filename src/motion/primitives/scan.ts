// primitives/scan.ts — the light from the left (§2.5 law 2, §5.2). A hairline scaleX 0 → 1 (origin left, lj.scan).
// The optional `dot` rides the head; `onProgress(p)` gets the same eased 0..1 every tick — drive
// engine.get('field')?.set('uScan', p) and per-character weigh-ins from it (no layout reads per tick:
// the line width is read once here).

import type { Primitives, ScanOpts } from '../registry';
import { EASE } from '../eases';
import { isReduced } from '../../lib/prefs';
import type { PrimDeps } from './index';

type Setter = (v: number) => void;

export function makeScan({ gsap }: PrimDeps): Primitives['scan'] {
  return (line, o: ScanOpts = {}) => {
    const width = line.offsetWidth;
    const dot = o.dot;
    const onProgress = o.onProgress;
    gsap.set(line, { transformOrigin: '0% 50%', scaleX: 0 });
    if (dot) gsap.set(dot, { x: 0 });
    const setS = gsap.quickSetter(line, 'scaleX') as Setter;
    const setX = dot ? (gsap.quickSetter(dot, 'x', 'px') as Setter) : null;
    const p = { v: 0 };
    const update = (): void => {
      setS(p.v);
      setX?.(p.v * width);
      onProgress?.(p.v);
    };
    return gsap.to(p, {
      v: 1,
      duration: isReduced() ? 0 : (o.duration ?? 1),
      ease: EASE.scan,
      onUpdate: update,
      onComplete: update,
    });
  };
}
