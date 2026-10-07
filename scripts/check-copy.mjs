#!/usr/bin/env node
// scripts/check-copy.mjs — what the copy says (spec §4.0 numeric policy and "Not used anywhere", §9.5 items 3–4;
// build-overrides §1 NEVER-publish list; site law 4 "every number has a source").
//
// Dictionary (every entry, both locales, gated ones included — a proposal must not carry them either):
// - forbidden terms, flag emoji, 李家寳/李家寶, vendor names outside `*.named` (scripts/lib/rules.mjs);
// - numeric provenance: after removing `{placeholders}` and the registered literals of facts.ts, no digit is
//   left; every `{fact.key}` exists;
// - `D(75) = 150` only in fr.math.not.1; 未解 / "unsolved" only in the OPEN definitions.
// Data (numbers the copy leans on):
// - snapshot.json agrees with facts.ts (total, every repo, dates) and with repos.ts; 15 labs × 10 cards = 150;
//   every fact has a source and an as-of date; the six odometers print their own fact.
// Source tree (src/, comments removed): forbidden terms, flags and vendor names never hard-coded; runtime
// TypeScript carries no CJK copy (DOM contract §9.3: strings come from data-i18n-* attributes).
// Posts (src/content/{articles,views}/<locale>/<slug>.md, drafts included): the POSTS rule set (owner privacy only —
// a tech article may say "developer" or "ChatGPT") over the whole file, a valid locale folder and slug, and no
// `author` field (articles are credited to the site, views to the owner, by the build — never by a post).
// Usage: node scripts/check-copy.mjs

import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT, excerpt, gate, imp, rel, walk } from './lib/gate.mjs';
import {
  CJK_RE,
  D75_KEYS,
  D75_RE,
  UNSOLVED_KEYS,
  UNSOLVED_RE,
  factPlaceholders,
  findPostViolations,
  findViolations,
  strayDigits,
  stripComments,
  strings,
} from './lib/rules.mjs';

const g = gate('check-copy');

const { dict } = await imp('src/i18n/dict.ts');
const { facts, literals, SNAPSHOT, NUMBERS } = await imp('src/data/facts.ts');
const { REPOS, COMMITS_TOTAL } = await imp('src/data/repos.ts');
const { LABS } = await imp('src/data/labs.ts');
const snapshot = JSON.parse(readFileSync(join(ROOT, 'src/data/snapshot.json'), 'utf8'));

const LITS = [...literals].sort((a, b) => b.length - a.length);
const keys = Object.keys(dict);
let values = 0;

// ── dictionary ─────────────────────────────────────────────────────────────────────────────────────────────
for (const key of keys) {
  const e = dict[key];
  const named = key.endsWith('.named');
  for (const loc of ['zh', 'en']) {
    for (const s of strings(e[loc])) {
      values++;
      for (const v of findViolations(s, { vendors: named })) {
        g.fail(`${key} [${loc}]: ${v.id} "${v.match}" — ${v.why}`);
      }
      const stray = strayDigits(s, LITS);
      if (stray.length) {
        g.fail(`${key} [${loc}]: unregistered number(s) ${stray.map((d) => `"${d}"`).join(', ')} in "${excerpt(s, 0, 0, 60)}" — use {fact.key} or register a literal in facts.ts`);
      }
      for (const f of factPlaceholders(s)) {
        if (!Object.prototype.hasOwnProperty.call(facts, f)) g.fail(`${key} [${loc}]: unknown fact {${f}}`);
      }
      if (D75_RE.test(s) && !D75_KEYS.has(key)) g.fail(`${key} [${loc}]: "D(75) = 150" appears outside ${[...D75_KEYS].join(', ')} (it is a claim NOT made)`);
      if (UNSOLVED_RE.test(s) && !UNSOLVED_KEYS.has(key)) {
        g.fail(`${key} [${loc}]: 未解 / "unsolved" outside the OPEN definitions (${[...UNSOLVED_KEYS].join(', ')})`);
      }
    }
  }
}

// ── data: the numbers behind the copy ──────────────────────────────────────────────────────────────────────
const num = (k) => facts[k]?.value;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
for (const [k, f] of Object.entries(facts)) {
  if (!f.source || !f.source.repo) g.fail(`facts.${k}: no source`);
  if (!DATE.test(f.asOf ?? '')) g.fail(`facts.${k}: asOf "${f.asOf}" is not YYYY-MM-DD`);
}
if (snapshot.total !== num('commits.total')) g.fail(`snapshot.json total ${snapshot.total} ≠ facts commits.total ${num('commits.total')}`);
if (COMMITS_TOTAL !== num('commits.total')) g.fail(`repos.ts COMMITS_TOTAL ${COMMITS_TOTAL} ≠ facts commits.total ${num('commits.total')}`);
if (REPOS.length !== num('repos.count')) g.fail(`repos.ts has ${REPOS.length} repos; facts repos.count is ${num('repos.count')}`);
let sum = 0;
for (const r of REPOS) {
  const n = snapshot.counts?.[r.id];
  const rows = snapshot.repos?.[r.id];
  sum += Array.isArray(rows) ? rows.length : 0;
  if (n !== num(`commits.${r.id}`)) g.fail(`snapshot.json ${r.id}: ${n} commits ≠ facts commits.${r.id} ${num(`commits.${r.id}`)}`);
  if (!Array.isArray(rows) || rows.length !== n) g.fail(`snapshot.json ${r.id}: ${rows?.length ?? 0} rows ≠ count ${n}`);
}
if (sum !== snapshot.total) g.fail(`snapshot.json rows add up to ${sum}, total says ${snapshot.total}`);
if (snapshot.asOf !== SNAPSHOT.asOf || num('snapshot.asOf') !== SNAPSHOT.asOf) {
  g.fail(`snapshot dates disagree: snapshot.json ${snapshot.asOf}, SNAPSHOT ${SNAPSHOT.asOf}, facts ${num('snapshot.asOf')}`);
}
const cards = LABS.reduce((n, l) => n + l.cards.length, 0);
if (LABS.length !== num('fr.labs') || LABS.length * num('fr.cardsPerLab') !== num('fr.cards') || cards !== num('fr.cards')) {
  g.fail(`labs: ${LABS.length} labs × ${num('fr.cardsPerLab')} = ${cards} cards; facts say ${num('fr.labs')} labs, ${num('fr.cards')} cards`);
}
for (const { copy, fact } of NUMBERS) {
  for (const loc of ['zh', 'en']) {
    const first = strings(dict[copy]?.[loc] ?? '')[0] ?? '';
    if (!factPlaceholders(first).includes(fact)) g.fail(`${copy} [${loc}]: the odometer value must print {${fact}} (got "${first}")`);
  }
}

// ── source tree: nothing forbidden hard-coded, no CJK copy in runtime TypeScript ──────────────────────────
const SRC = join(ROOT, 'src');
const SKIP = [/[\\/]src[\\/]i18n[\\/]ns[\\/]/, /[\\/]src[\\/]content[\\/](?:articles|views)[\\/]/,/[\\/]src[\\/]data[\\/](snapshot|glyphs|gl-manifest|portrait-meta)\.json$/, /\.(png|jpe?g|webp|avif|gif|bin|woff2?)$/i];
const RUNTIME_TS = /[\\/]src[\\/](?!i18n[\\/]|data[\\/]).*\.ts$/;
let files = 0;
for (const file of walk(SRC)) {
  if (SKIP.some((re) => re.test(file))) continue;
  if (!/\.(astro|ts|mjs|js|css|json|svg|md)$/i.test(file)) continue;
  files++;
  const code = stripComments(readFileSync(file, 'utf8'));
  // the name variants are allowed in source (JSON-LD alternateName); check-dist checks the rendered text
  for (const v of findViolations(code, { names: true })) {
    g.fail(`${rel(file)}: ${v.id} "${v.match}" in "${excerpt(code, v.index, v.match.length)}" — ${v.why}`);
  }
  if (RUNTIME_TS.test(file)) {
    const m = CJK_RE.exec(code);
    if (m) g.fail(`${rel(file)}: CJK text "${excerpt(code, m.index, 1, 20)}" in runtime TypeScript — copy belongs in the dictionary (data-i18n-*)`);
  }
}

// ── posts: /articles/ and /views/ (owner decision 2026-10-07) ─────────────────────────────────────────────
const P = await imp('src/lib/posts.ts');
let postFiles = 0;
for (const section of P.SECTIONS) {
  const base = join(ROOT, 'src', 'content', section);
  for (const file of walk(base)) {
    if (!/\.md$/i.test(file)) continue;
    postFiles++;
    const where = rel(file);
    try {
      P.postIdFromPath(relative(base, file).split(sep).join('/'), section);
    } catch (err) {
      g.fail(err instanceof Error ? err.message : String(err));
    }
    const text = readFileSync(file, 'utf8');
    for (const v of findPostViolations(text)) {
      g.fail(`${where}: ${v.id} "${v.match}" in "${excerpt(text, v.index, v.match.length)}" — ${v.why} (POSTS rules)`);
    }
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    if (!front) g.fail(`${where}: no frontmatter`);
    // dates are calendar days as written: YAML would turn `2026-10-07T00:00:00Z` into the same Date as a plain
    // day, so the schema alone cannot see a timestamp at UTC midnight — the raw text can
    for (const m of front.matchAll(/^(date|updated)\s*:(.*)$/gm)) {
      if (!/^\s*(['"]?)\d{4}-\d{2}-\d{2}\1\s*(?:#.*)?$/.test(m[2])) g.fail(`${where}: \`${m[1]}:${m[2]}\` ${P.CALENDAR_DAY_MSG}`);
    }
    const author = /^(authors?|creator|byline)\s*:/im.exec(front);
    if (author) {
      g.fail(`${where}: \`${author[1]}\` in the frontmatter — ${section === 'articles' ? 'articles are credited to the site (lijiabao.dev), never to a person' : 'views are credited to the owner by the build'}; remove it`);
    }
  }
}

g.done(`${keys.length} keys / ${values} strings, ${files} source files, ${postFiles} post(s), ${LITS.length} registered literals`);
