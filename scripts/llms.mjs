#!/usr/bin/env node
// scripts/llms.mjs — postbuild: the site for language models (https://llmstxt.org/).
//
//   dist/llms.txt          the index: H1, the owner's line as the summary, then Pages / Source code / Optional
//   dist/llms-full.txt     every page in full, zh-Hant and English, one after another
//   dist/<page>/index.md   one Markdown file per page (/, /glimmertown/, /frontier/ in both locales)
//
// Page text comes from the BUILT HTML (scripts/lib/markdown.mjs reads <main> the way a visitor reads it), so it
// cannot drift from the site; labels come from the dictionary (llms.*, meta.*), numbers from facts.ts, links from
// links.ts / repos.ts. The output goes through the same copy rules as the pages (scripts/lib/rules.mjs) and every
// lijiabao.dev link in it must resolve to a file in dist — otherwise the build fails.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, gate, imp, rel } from './lib/gate.mjs';
import { mainToMarkdown } from './lib/markdown.mjs';
import { findViolations } from './lib/rules.mjs';

const g = gate('llms');
const { t, tStr } = await imp('src/i18n/t.ts');
const { REPOS } = await imp('src/data/repos.ts');
const { SITE_URL, GITHUB_PROFILE } = await imp('src/data/links.ts');
const { features } = await imp('src/data/features.ts');

const SITE_REPO = `${GITHUB_PROFILE}/lijiabao-official`;
const LOCALES = [
  { locale: 'zh-Hant', prefix: '', lang: 'zh-Hant' },
  { locale: 'en', prefix: '/en', lang: 'en' },
];
const PAGES = [
  { id: 'home', path: '/' },
  { id: 'gt', path: '/glimmertown/' },
  { id: 'fr', path: '/frontier/' },
];
const url = (p) => new URL(p, SITE_URL).href;
const both = (key, vars) => `${tStr(key, 'zh-Hant', vars)} · ${tStr(key, 'en', vars)}`;
/** a dictionary value that may be authored as lines → one line */
const line = (key, locale) => {
  const v = t(key, locale);
  return (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x.text)).join('') : tStr(key, locale)).trim();
};

const written = [];
const write = (file, text) => {
  writeFileSync(file, text);
  written.push({ file, text });
};

// ── one Markdown file per page ──────────────────────────────────────────────────────────────────────────────
const pages = [];
for (const { id, path } of PAGES) {
  for (const { locale, prefix, lang } of LOCALES) {
    const html = join(DIST, `${prefix}${path}`, 'index.html');
    if (!existsSync(html)) g.fail(`${rel(html)} not found — run \`astro build\` first`);
    const body = mainToMarkdown(readFileSync(html, 'utf8'), SITE_URL);
    const other = LOCALES.find((l) => l.locale !== locale);
    const page = {
      id,
      locale,
      title: tStr(`meta.${id}.title`, locale),
      desc: tStr(`meta.${id}.desc`, locale),
      html: url(`${prefix}${path}`),
      md: url(`${prefix}${path}index.md`),
      otherMd: url(`${other.prefix}${path}index.md`),
      lang,
    };
    const md =
      `# ${page.title}\n\n` +
      `> ${page.desc}\n\n` +
      `URL: ${page.html} · lang: ${lang} · ${tStr('llms.snapshot', locale)}\n` +
      `${tStr('llms.alt', locale)}: ${page.otherMd}\n\n` +
      body;
    page.content = md;
    pages.push(page);
    write(join(DIST, `${prefix}${path}`, 'index.md'), md);
  }
}

// ── llms.txt ────────────────────────────────────────────────────────────────────────────────────────────────
const heroZh = line('hero.line', 'zh-Hant');
const heroEn = line('hero.line', 'en');
// The summary blockquote is ONE line describing the site (parsers keep only the first `>` line); the owner's line
// follows as prose, in both languages.
const header =
  `# ${tStr('site.name', 'zh-Hant')} ${tStr('site.name', 'en')} — ${new URL(SITE_URL).host}\n\n` +
  `> ${tStr('meta.home.desc', 'zh-Hant')} ${tStr('meta.home.desc', 'en')}\n\n` +
  `${heroZh}\n${heroEn}\n\n` +
  `${tStr('llms.snapshot', 'zh-Hant')} ${tStr('llms.snapshot', 'en')}\n` +
  `${tStr('llms.policy', 'zh-Hant')} ${tStr('llms.policy', 'en')}\n`;

const pageList = pages.map((p) => `- [${p.title}](${p.md}): ${p.desc}`).join('\n');
// GitHub pages are HTML, not LLM-friendly text, so every repository link sits under Optional (an agent short of
// context skips them); the site's own repository is listed apart from the dated count of work repositories.
const optional = [
  `- [llms-full.txt](${url('/llms-full.txt')}): ${both('llms.full')}`,
  `- [sitemap.xml](${url('/sitemap.xml')}): ${both('llms.sitemap')}`,
  `- [${new URL(GITHUB_PROFILE).pathname.slice(1)}](${GITHUB_PROFILE}): ${both('llms.profile')}`,
  ...REPOS.map((r) => `- [${r.repo}](${r.url}): ${tStr(r.nameKey, 'zh-Hant')} · ${tStr(r.nameKey, 'en')}`),
  `- [lijiabao-official](${SITE_REPO}): ${both('llms.site')}`,
].join('\n');

const index = `${header}\n` + `## ${both('llms.pages')}\n\n${pageList}\n\n` + `## Optional\n\n${optional}\n`;
write(join(DIST, 'llms.txt'), index);

// ── llms-full.txt ───────────────────────────────────────────────────────────────────────────────────────────
const full = `${header}\n${pages.map((p) => `---\n\n${p.content.replace(/^# /, '## ').replace(/\n(#{2,5}) /g, '\n#$1 ')}`).join('\n')}`;
write(join(DIST, 'llms-full.txt'), full);

// ── headers for the text files (appended to dist/_headers; headers.mjs then adds the CSP to its `/*` block) ───
// Each page .md points search engines at its HTML page (canonical; every path already carries the llms.txt
// describedby Link from the `/*` block of public/_headers). The full-text file stays readable by everyone but out
// of search results, where it would duplicate every page.
const headersFile = join(DIST, '_headers');
const md = 'text/markdown; charset=utf-8';
const txt = 'text/plain; charset=utf-8';
const rules = [
  `/llms.txt\n  Content-Type: ${txt}`,
  `/llms-full.txt\n  Content-Type: ${txt}\n  X-Robots-Tag: noindex`,
  ...pages.map((p) => `${new URL(p.md).pathname}\n  Content-Type: ${md}\n  Link: <${p.html}>; rel="canonical"`),
];
const existing = existsSync(headersFile) ? readFileSync(headersFile, 'utf8').replace(/\n# llms\.mjs[\s\S]*$/, '') : '';
writeFileSync(headersFile, `${existing.trimEnd()}\n\n# llms.mjs — text for language models\n${rules.join('\n\n')}\n`);

// ── gates: the copy rules, every lijiabao.dev link resolves, robots.txt is the endpoint's ───────────────────
const host = new URL(SITE_URL).host;
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!/^Content-Signal: /m.test(robots) || !/^Sitemap: /m.test(robots)) {
  g.fail('dist/robots.txt is not the src/pages/robots.txt.ts output (a stale public/robots.txt would shadow it)');
}
for (const { file, text } of written) {
  for (const v of findViolations(text, { vendors: features.vendorNames === true })) {
    g.fail(`${rel(file)}: ${v.id} "${v.match}" — ${v.why}`);
  }
  for (const m of text.matchAll(/https?:\/\/[^\s)>\]]+/g)) {
    const u = new URL(m[0]);
    if (u.host !== host) continue;
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    if (!existsSync(join(DIST, p)) && !existsSync(join(DIST, `${p}.html`))) g.fail(`${rel(file)}: ${m[0]} does not resolve in dist`);
  }
}
if (!heroZh || !heroEn) g.fail('hero.line is empty');

g.done(
  `${written.length} files — llms.txt ${(Buffer.byteLength(index) / 1024).toFixed(1)} KB, llms-full.txt ${(Buffer.byteLength(full) / 1024).toFixed(1)} KB, ${pages.length} page .md`,
);
