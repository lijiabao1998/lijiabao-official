// primitives/split.ts — SplitText with the site's rules (§2.2, §8):
// - aria: 'none' inside an aria-hidden visual copy (<Display animate> renders an sr-only twin), else 'auto';
// - Chinese text has no spaces for SplitText to break on, so it is first cut into the units a browser itself breaks
//   CJK between (cjkUnits): one Han character each, Latin words and numbers whole, punctuation glued to its
//   neighbour (closing marks to the unit before, opening marks to the unit after: no line starts with 「，」 or ends
//   with 「「」). A space inside Chinese text (「跟 lab 線」) stays a real space BETWEEN units — SplitText leaves a
//   lone " " word as a plain text node — so it is a break opportunity that hangs at a line end, as in the plain
//   text (a no-break space glued to a unit counted toward the line and pushed 「lab」 to the next line at 320px).
//   Zero-width delimiters carry the cut; they are removed from the output. Every unit is an inline-block "word",
//   so the text WRAPS while split, at the same places as the plain text (no jump when it is reverted);
// - 'lines': masked lines built on those units (Chinese) or on spaces (Latin);
// - 'chars': Chinese → units → chars; Latin → smartWrap keeps words whole. No mask unless asked.
//   (smartWrap on Chinese made the whole unspaced sentence ONE nowrap run: a 643px line in a 343px column.)
// Created inside the caller's gsap.context, so it is reverted with it. Split only at resting weight. Entrances
// revert() when they end, so the resting DOM is the server HTML again.

import type { Primitives, SplitOpts } from '../registry';
import { isZh } from '../../lib/dom';
import type { PrimDeps } from './index';

// Unicode classes, not literal marks: runtime TypeScript carries no CJK characters (scripts/check-copy.mjs).
/** Closing punctuation (Pe, Pf, Po: full-width comma and stop, closing brackets, ellipsis; + the em dash): never
 *  starts a line. */
const CLOSE = /^[\p{Pe}\p{Pf}\p{Po}—]$/u;
/** Opening punctuation (Ps, Pi: opening corner brackets and parentheses): never ends a line. */
const OPEN = /^[\p{Ps}\p{Pi}]$/u;
/** Latin words and numbers stay whole (inner . - / apostrophe _ included: D000-vision.md, 8.70); a space; any char. */
const TOKEN = /[a-z\d](?:[\w\x27’/-]|\.(?=[a-z\d]))*|\s+|[^]/giu;
const NBSP = '\u00A0';
const SPACE = ' ';
const ZWSP = '\u200B';

/**
 * Chinese text → the units it may wrap between (see the header). Pure. A `' '` unit is a real space between two
 * units; a space that must not break (after an opening mark, before a closing one) is glued in as a no-break space.
 */
export function cjkUnits(text: string): string[] {
  if (!/\S/u.test(text)) return [text]; // whitespace between elements: left to SplitText as it is
  const out: string[] = [];
  let lead = '';
  for (const t of text.match(TOKEN) ?? []) {
    const n = out.length - 1;
    if (/^\s/.test(t)) {
      if (lead) lead += NBSP; // an opening mark, then a space: no break after an opening mark
      else if (out[n] !== SPACE) out.push(SPACE);
    } else if (OPEN.test(t)) lead += t;
    else if (CLOSE.test(t) && n >= 0 && !lead) {
      if (out[n] === SPACE) {
        // a space, then a closing mark: no break before a closing mark, even after a space
        out[n] = NBSP + t;
        if (n) out[n - 1] += out.pop();
      } else out[n] += t;
    } else {
      out.push(lead + t);
      lead = '';
    }
  }
  if (lead) out.push(lead);
  return out;
}

export function makeSplit({ SplitText }: PrimDeps): Primitives['split'] {
  return (el, type, o: SplitOpts = {}) => {
    const vars: SplitText.Vars = { type, aria: el.closest('[aria-hidden="true"]') ? 'none' : 'auto' };
    const zh = isZh(el);
    if (zh) {
      vars.prepareText = (t: string) => cjkUnits(t).join(ZWSP);
      vars.wordDelimiter = { delimiter: new RegExp(ZWSP), replaceWith: '' };
    }
    if (type === 'lines') {
      if (o.mask !== false) vars.mask = 'lines';
      if (zh) vars.type = 'lines,words';
    } else {
      if (zh) vars.type = 'words,chars'; // units wrap between each other; chars live inside them
      else vars.smartWrap = true;
      if (o.mask) vars.mask = 'chars';
    }
    if (o.autoSplit) vars.autoSplit = true;
    if (o.onSplit) vars.onSplit = o.onSplit;
    return SplitText.create(el, vars);
  };
}
