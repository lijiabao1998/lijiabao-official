#!/usr/bin/env node
// scripts/glyphs.mjs — dictionary → Noto Sans TC glyph subsets (spec §2.2) → src/data/glyphs.json.
//
//   hero    = every CJK character of the zh `site.name`, `hero.name` and `hero.line` as they render in
//             production (P/PE gating applied: hero.line is APPROVED, so its fallback is not included).
//   display = every CJK character of the zh entries flagged `display: true` (production values,
//             narrow lines included), minus the hero set.
//
// CJK = Han ideographs plus CJK / full-width punctuation, so a display line never mixes two faces.
// Fails (exit 1) above 40 hero glyphs or 140 display glyphs.
//
// Runs under plain `node` (≥ 22.18 / 23.6): Node strips the TypeScript types of the dictionary itself.
// Usage: node scripts/glyphs.mjs [--check]   (--check: verify budgets and that glyphs.json is current)

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/glyphs.json');
const HERO_KEYS = ['site.name', 'hero.name', 'hero.line'];
const LOCALE = 'zh-Hant';

const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { dict } = await imp('src/i18n/dict.ts');
const { resolve: resolveKey, pick, fill, tNarrow, plain } = await imp('src/i18n/t.ts');
const { budgets } = await imp('src/data/budgets.ts');

const MAX_HERO = budgets.glyphs.hero;
const MAX_DISPLAY = budgets.glyphs.display;

const CJK = /[⺀-⿿　-〿぀-ヿ㄀-ㄯ㆐-ㇿ㐀-䶿一-鿿豈-﫿︰-﹏＀-｠￠-￦]/u;

/** Production zh text of a key (gated, feature-flagged; narrow lines included). '' when omitted. */
function zhText(key) {
  const r = resolveKey(key, false);
  if (!r) return '';
  const v = fill(pick(r.entry, LOCALE), LOCALE, undefined, r.key);
  const narrow = tNarrow(key, LOCALE) ?? [];
  // Segments in another language (he, en) are not set in the CJK face.
  const text = Array.isArray(v) && v.some((s) => typeof s !== 'string')
    ? v.map((s) => (typeof s === 'string' ? s : s.lang === LOCALE ? s.text : '')).join('')
    : plain(v);
  return text + narrow.join('');
}

function cjkSet(text) {
  const set = new Set();
  for (const ch of text) if (CJK.test(ch)) set.add(ch);
  return set;
}

const sortCp = (arr) => [...arr].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));

const heroSet = cjkSet(HERO_KEYS.map(zhText).join(''));
const displayAll = new Set();
const perKey = [];
for (const [key, entry] of Object.entries(dict)) {
  if (!entry.display) continue;
  const set = cjkSet(zhText(key));
  for (const ch of set) displayAll.add(ch);
  perKey.push([key, set.size]);
}
const displaySet = new Set([...displayAll].filter((ch) => !heroSet.has(ch)));

const hero = sortCp(heroSet).join('');
const display = sortCp(displaySet).join('');
const out = {
  hero,
  display,
  heroCount: heroSet.size,
  displayCount: displaySet.size,
  budget: { hero: MAX_HERO, display: MAX_DISPLAY },
  source: 'scripts/glyphs.mjs (zh production values of site.name, hero.name, hero.line; display:true entries)',
};

const report = `hero ${heroSet.size}/${MAX_HERO}: ${hero}\ndisplay ${displaySet.size}/${MAX_DISPLAY}: ${display}\n`;
let failed = false;
if (heroSet.size > MAX_HERO) {
  process.stderr.write(`glyphs: hero subset has ${heroSet.size} glyphs (max ${MAX_HERO})\n`);
  failed = true;
}
if (displaySet.size > MAX_DISPLAY) {
  const top = perKey.sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => `  ${k}: ${n}`).join('\n');
  process.stderr.write(`glyphs: display subset has ${displaySet.size} glyphs (max ${MAX_DISPLAY}). Largest display keys:\n${top}\n`);
  failed = true;
}
process.stdout.write(report);
if (failed) process.exit(1);

const json = JSON.stringify(out, null, 2) + '\n';
if (process.argv.includes('--check')) {
  const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (cur !== json) {
    process.stderr.write('glyphs: src/data/glyphs.json is stale; run `node scripts/glyphs.mjs`\n');
    process.exit(1);
  }
  process.stdout.write('glyphs.json is current\n');
} else {
  writeFileSync(OUT, json, 'utf8');
  process.stdout.write(`→ ${OUT}\n`);
}
