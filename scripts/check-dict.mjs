#!/usr/bin/env node
// scripts/check-dict.mjs — the dictionary's structure (spec §4.0 gating, §9.1, §9.5 item 2; build-overrides §1).
//
// Fails when:
// - a namespace fails to load (duplicate keys, zh/en key sets that differ);
// - an entry has an unknown class, a malformed value, or is empty in both locales (English may never be empty;
//   Chinese may be '' only on class-T glosses of a line that is itself Chinese);
// - a P/PE entry has no `fallback` field, or its fallback is not a key / loops / is itself gated;
// - an owner flag named by `feature` does not exist; a `*.named` key is not behind `vendorNames`;
// - a vendor name appears outside `*.named` keys;
// - a class-R entry has no `src` (research provenance);
// - a list (non-display string[]) has a different number of parts in zh and en, or a `{fact}` placeholder
//   names an unknown fact;
// - the owner decisions of build-overrides §1 drift: hero.line approved and verbatim, its alt candidates gone,
//   the X-bio / Hebrew / signature lines approved, the manifesto candidates NOT approved, X and vendor names off;
// - the Noto glyph subsets exceed their budgets or src/data/glyphs.json is stale (scripts/glyphs.mjs --check).
// Usage: node scripts/check-dict.mjs

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT, gate, imp } from './lib/gate.mjs';
import { VENDOR_RE, factPlaceholders, strings } from './lib/rules.mjs';

const g = gate('check-dict');
const CLASSES = new Set(['F', 'R', 'O', 'OD', 'T', 'OB', 'P', 'PE']);
const SEG_LANGS = new Set(['zh-Hant', 'en', 'he']);

let dict;
let t;
let facts;
let features;
try {
  ({ dict } = await imp('src/i18n/dict.ts'));
  t = await imp('src/i18n/t.ts');
  ({ facts } = await imp('src/data/facts.ts'));
  ({ features } = await imp('src/data/features.ts'));
} catch (err) {
  g.fail(`the dictionary does not load: ${err?.message ?? err}`);
  g.done();
  process.exit();
}

const isSeg = (s) => s !== null && typeof s === 'object' && typeof s.text === 'string';
const isSegs = (v) => Array.isArray(v) && v.some((s) => typeof s !== 'string');
const isEmpty = (v) => v === '' || (Array.isArray(v) && v.length === 0);

/** '' when the value is well-formed, else what is wrong. */
function shapeError(v) {
  if (typeof v === 'string') return '';
  if (!Array.isArray(v)) return `value is ${v === null ? 'null' : typeof v}`;
  for (const s of v) {
    if (typeof s === 'string') continue;
    if (!isSeg(s)) return 'array item is neither a string nor a {lang, text} segment';
    if (!SEG_LANGS.has(s.lang)) return `segment lang "${s.lang}" is not zh-Hant / en / he`;
    if (s.dir !== undefined && s.dir !== 'rtl') return `segment dir "${s.dir}" is not rtl`;
    if (s.lang === 'he' && s.dir !== 'rtl') return 'a Hebrew segment must carry dir: "rtl"';
  }
  return '';
}

const keys = Object.keys(dict);
let gated = 0;
let displayKeys = 0;

for (const key of keys) {
  const e = dict[key];
  if (!CLASSES.has(e.cls)) g.fail(`${key}: unknown class "${e.cls}"`);
  for (const loc of ['zh', 'en']) {
    const err = shapeError(e[loc]);
    if (err) g.fail(`${key} [${loc}]: ${err}`);
  }
  if (isEmpty(e.en)) g.fail(`${key}: the English value is empty`);
  if (isEmpty(e.zh) && e.cls !== 'T') g.fail(`${key}: the Chinese value is empty (only class-T glosses may be '')`);
  if (e.display) displayKeys++;

  // P/PE gating (§4.0): every P/PE entry declares what renders while it is not approved.
  if (e.cls === 'P' || e.cls === 'PE') {
    if (!Object.prototype.hasOwnProperty.call(e, 'fallback')) g.fail(`${key}: ${e.cls} entry without a \`fallback\` (use null to omit the block)`);
    if (e.status !== 'APPROVED') gated++;
    const seen = new Set([key]);
    let f = e.fallback;
    while (typeof f === 'string') {
      if (!Object.prototype.hasOwnProperty.call(dict, f)) {
        g.fail(`${key}: fallback "${f}" is not a key`);
        break;
      }
      if (seen.has(f)) {
        g.fail(`${key}: fallback loop through "${f}"`);
        break;
      }
      seen.add(f);
      const fe = dict[f];
      if ((fe.cls === 'P' || fe.cls === 'PE') && fe.status !== 'APPROVED') {
        g.fail(`${key}: fallback "${f}" is itself an unapproved ${fe.cls} entry`);
        break;
      }
      f = fe.fallback;
    }
  } else if (e.fallback !== undefined) {
    g.warn(`${key}: \`fallback\` on a class-${e.cls} entry has no effect`);
  }
  if (e.status !== undefined && e.status !== 'APPROVED') g.fail(`${key}: status "${e.status}" (only 'APPROVED' exists)`);

  // owner flags
  if (e.feature !== undefined && !Object.prototype.hasOwnProperty.call(features, e.feature)) {
    g.fail(`${key}: feature "${e.feature}" is not in src/data/features.ts`);
  }
  const named = key.endsWith('.named');
  if (named) {
    if (e.feature !== 'vendorNames') g.fail(`${key}: a *.named key must carry feature: 'vendorNames'`);
    if (!Object.prototype.hasOwnProperty.call(dict, key.slice(0, -'.named'.length))) {
      g.fail(`${key}: no anonymous base key "${key.slice(0, -'.named'.length)}"`);
    }
  }
  // vendor names only behind the flag (§4.0)
  if (!named) {
    for (const loc of ['zh', 'en']) {
      for (const s of strings(e[loc])) {
        const m = s.match(VENDOR_RE);
        if (m) g.fail(`${key} [${loc}]: vendor name "${m[0]}" outside a *.named key`);
      }
    }
  }

  // provenance
  if (e.cls === 'R' && !e.src) g.fail(`${key}: class-R entry without \`src\` (the research file it comes from)`);

  // narrow lines belong to display entries
  if (e.narrow !== undefined) {
    if (!e.display) g.fail(`${key}: \`narrow\` lines on an entry that is not display: true`);
    for (const loc of ['zh', 'en']) {
      const n = e.narrow[loc];
      if (n !== undefined && !(Array.isArray(n) && n.length > 0 && n.every((s) => typeof s === 'string'))) {
        g.fail(`${key}: narrow.${loc} must be a non-empty string[]`);
      }
    }
  }

  // ordered parts: non-display string[] in both locales = lists / parts; they must line up
  if (!e.display && Array.isArray(e.zh) && Array.isArray(e.en) && !isSegs(e.zh) && !isSegs(e.en) && e.zh.length !== e.en.length) {
    g.fail(`${key}: ${e.zh.length} parts in zh but ${e.en.length} in en`);
  }

  // {fact} placeholders name real facts. (The sets may differ between locales: English spells out
  // "One governance repo" where Chinese writes {fr.govRepos} 個治理庫.)
  for (const loc of ['zh', 'en']) {
    for (const s of strings(e[loc])) {
      for (const f of factPlaceholders(s)) {
        if (!Object.prototype.hasOwnProperty.call(facts, f)) g.fail(`${key} [${loc}]: unknown fact {${f}}`);
      }
    }
  }
}

// ── owner decisions (build-overrides §1, owner-decisions.md) ──────────────────────────────────────────────
const need = (cond, msg) => {
  if (!cond) g.fail(msg);
};
const e = (k) => dict[k];
need(e('hero.line')?.status === 'APPROVED', 'hero.line must be APPROVED (overrides §1)');
need(t.tStr('hero.line', 'zh-Hant') === '讓每個人，都有一座自己的實驗室。', 'hero.line (zh) must be the owner\'s line verbatim');
need(t.tStr('hero.line', 'en') === 'Everyone deserves a lab of their own.', 'hero.line (en) must be the owner\'s line verbatim');
need(!keys.some((k) => k.startsWith('hero.line.alt')), 'hero.line.alt* candidates must be deleted (overrides §1)');
for (const k of ['about.line1', 'about.line2', 'about.hebrew', 'about.signature']) {
  need(e(k)?.status === 'APPROVED', `${k} must be APPROVED (overrides §1)`);
}
for (const k of ['manifesto.title', 'manifesto.alt1', 'manifesto.alt2', 'manifesto.date']) {
  if (e(k)) need(e(k).status !== 'APPROVED', `${k}: the owner has not written a manifesto; it must not be APPROVED (overrides §1)`);
}
need(features.x === false && features.xUrl === null, 'features: the X link is not approved (x: false, xUrl: null)');
need(features.vendorNames === false, 'features.vendorNames must stay false');
need(features.hebrew === true && features.signature === true, 'features: the Hebrew line and the signature are approved (on)');

// ── glyph budgets (§2.2): the F0 script is the single source of truth ─────────────────────────────────────
const glyphs = spawnSync(process.execPath, [join(ROOT, 'scripts', 'glyphs.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
if (glyphs.status !== 0) {
  g.fail(`glyph subsets: ${(glyphs.stderr || glyphs.stdout || 'scripts/glyphs.mjs --check failed').trim().split('\n').join(' | ')}`);
} else {
  const counts = (glyphs.stdout.match(/(hero|display) (\d+)\/(\d+)/g) ?? []).join(', ');
  g.info(`glyph subsets within budget: ${counts}`);
}

g.done(`${keys.length} keys, ${displayKeys} display, ${gated} gated P/PE`);
