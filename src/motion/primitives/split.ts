// primitives/split.ts — SplitText with the site's rules (§2.2, §8):
// - aria: 'none' inside an aria-hidden visual copy (<Display animate> renders an sr-only twin), else 'auto';
// - 'lines': masked lines; Chinese text is segmented into words with Intl.Segmenter first, because CJK has no
//   spaces for SplitText to find line breaks on (zero-width delimiters, removed from the output);
// - 'chars': smartWrap keeps words whole; no mask unless asked.
// Created inside the caller's gsap.context, so it is reverted with it. Split only at resting weight.

import type { Primitives, SplitOpts } from '../registry';
import { isZh } from '../../lib/dom';
import type { PrimDeps } from './index';

export function makeSplit({ SplitText }: PrimDeps): Primitives['split'] {
  return (el, type, o: SplitOpts = {}) => {
    const vars: SplitText.Vars = { type, aria: el.closest('[aria-hidden="true"]') ? 'none' : 'auto' };
    if (type === 'lines') {
      if (o.mask !== false) vars.mask = 'lines';
      if (isZh(el) && typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const seg = new Intl.Segmenter('zh-Hant', { granularity: 'word' });
        vars.type = 'lines,words';
        vars.prepareText = (t: string) => Array.from(seg.segment(t), (s) => s.segment).join('​');
        vars.wordDelimiter = { delimiter: /​/, replaceWith: '' };
      }
    } else {
      vars.smartWrap = true;
      if (o.mask) vars.mask = 'chars';
    }
    if (o.autoSplit) vars.autoSplit = true;
    if (o.onSplit) vars.onSplit = o.onSplit;
    return SplitText.create(el, vars);
  };
}
