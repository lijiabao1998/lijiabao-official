#!/usr/bin/env node
// scripts/llms.mjs — postbuild: the site for language models (https://llmstxt.org/).
//
//   dist/llms.txt          the index: H1, the owner's line as the summary, then Pages, the two content sections,
//                          Optional
//   dist/llms-full.txt     every page in full, zh-Hant and English, one after another, then every published post
//   dist/<page>/index.md   one Markdown file per page (/, /glimmertown/, /frontier/ in both locales), per published
//                          post and per non-empty section index (/articles/, /views/ and their posts)
//
// Page text comes from the BUILT HTML (scripts/lib/markdown.mjs reads <main> the way a visitor reads it), so it
// cannot drift from the site; labels come from the dictionary (llms.*, meta.*, posts.*), numbers from facts.ts, links
// from links.ts / repos.ts. The output goes through the same copy rules as the pages (scripts/lib/rules.mjs: the full
// set for the site's own text, the POSTS set for what the posts say) and every lijiabao.dev link in it must resolve to
// a file in dist — otherwise the build fails.
//
// The two content sections (owner decision 2026-10-07) are never mixed: llms.txt lists 「李家宝本人的觀點 · Li Jiabao's
// own views」 (/views/) and 「lijiabao.dev 編輯整理（非本人觀點） · Edited by lijiabao.dev (not his personal views)」
// (/articles/) under two separate headings, each with its note, and every post's .md names its label. A section with
// no published post in a locale is left out (its index is noindex). Posts are read from dist (scripts/lib/posts.mjs),
// so drafts — never built — cannot appear.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, gate, imp, rel } from './lib/gate.mjs';
import { mainToMarkdown } from './lib/markdown.mjs';
import { readBuiltPosts, readBuiltSections } from './lib/posts.mjs';
import { findPostViolations, findViolations } from './lib/rules.mjs';

const g = gate('llms');
const { t, tStr } = await imp('src/i18n/t.ts');
const { REPOS } = await imp('src/data/repos.ts');
const { SITE_URL, GITHUB_PROFILE } = await imp('src/data/links.ts');
const { features } = await imp('src/data/features.ts');
const P = await imp('src/lib/posts.ts');

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
/** demote every ATX heading by `n` levels (max ######), leaving fenced code alone */
const demote = (md, n) => {
  let fence = null;
  return md
    .split('\n')
    .map((l) => {
      const f = /^(`{3,}|~{3,})/.exec(l);
      if (f) {
        if (!fence) fence = f[1];
        else if (l.startsWith(fence)) fence = null;
        return l;
      }
      if (fence) return l;
      return l.replace(/^(#{1,6}) /, (_, h) => `${'#'.repeat(Math.min(6, h.length + n))} `);
    })
    .join('\n');
};

const written = [];
/** text checked against the copy rules: `posts` → the POSTS rule set (what a post says), else the full set */
const checked = [];
const write = (file, text, posts = false) => {
  writeFileSync(file, text);
  written.push({ file, text });
  checked.push({ file, text, posts });
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

// ── the content sections: one .md per published post and per non-empty section index ─────────────────────────
const posts = readBuiltPosts(DIST);
const indexes = readBuiltSections(DIST);
for (const s of indexes) {
  const listed = P.hasPosts(posts, s.section, s.locale);
  if (s.noindex === listed) g.fail(`dist/${s.file}: noindex is ${s.noindex} but the section has ${listed ? 'posts' : 'no posts'} in ${s.locale}`);
}
/** per section: [{ kind, locale, title, desc, html, md, content }] in llms order (index, then posts newest first) */
const content = { views: [], articles: [] };
for (const section of ['views', 'articles']) {
  // per locale with ≥ 1 published post: the index, then the posts newest first (src/lib/posts.ts listedPages)
  for (const item of P.listedPages(posts, section)) {
    const { locale, prefix, lang } = LOCALES.find((l) => l.locale === item.locale);
    const other = LOCALES.find((l) => l.locale !== locale);
    const label = tStr(`posts.${section}.label`, locale);

    if (item.kind === 'post') {
      const p = item.post;
      const path = P.postPath(section, p.slug);
      const alt = P.alternateOf(p, posts);
      const dates = `${tStr('posts.published', locale)} ${P.isoDay(p.date)}${p.updated ? ` · ${tStr('posts.updated', locale)} ${P.isoDay(p.updated)}` : ''}`;
      const entry = {
        kind: 'post',
        locale,
        title: p.title,
        desc: p.description,
        date: P.isoDay(p.date),
        html: url(`${prefix}${path}`),
        md: url(`${prefix}${path}index.md`),
      };
      entry.content =
        `# ${p.title}\n\n> ${p.description}\n\n` +
        `URL: ${entry.html} · lang: ${lang} · ${label} · ${dates}\n` +
        `${alt ? `${tStr('llms.alt', locale)}: ${url(`${other.prefix}${path}index.md`)}\n` : ''}\n` +
        mainToMarkdown(p.html, SITE_URL);
      write(join(DIST, p.file.replace(/index\.html$/, 'index.md')), entry.content, true);
      content[section].push(entry);
      continue;
    }

    // the section index
    const ipath = P.sectionPath(section);
    const ihtml = join(DIST, `${prefix}${ipath}`, 'index.html');
    const index = {
      kind: 'section',
      locale,
      title: tStr(`meta.${section}.title`, locale),
      desc: tStr(`meta.${section}.desc`, locale),
      html: url(`${prefix}${ipath}`),
      md: url(`${prefix}${ipath}index.md`),
    };
    const ialt = P.hasPosts(posts, section, other.locale) ? `${tStr('llms.alt', locale)}: ${url(`${other.prefix}${ipath}index.md`)}\n` : '';
    index.content =
      `# ${index.title}\n\n> ${index.desc}\n\n` +
      `URL: ${index.html} · lang: ${lang} · ${label}\n${ialt}\n` +
      mainToMarkdown(readFileSync(ihtml, 'utf8'), SITE_URL);
    write(join(DIST, `${prefix}${ipath}`, 'index.md'), index.content, true);
    content[section].push(index);
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
// the two content sections, each under its own heading with its note; never one list
const sectionBlock = (section) =>
  content[section].length
    ? `## ${both(`llms.${section}`)}\n\n${both(`llms.${section}.note`)}\n\n` +
      content[section]
        .map((e) => `- [${e.title}](${e.md}): ${e.desc}${e.kind === 'post' ? ` (${e.locale}, ${e.date})` : ''}`)
        .join('\n') +
      '\n\n'
    : '';
const sectionsText = sectionBlock('views') + sectionBlock('articles');
// GitHub pages are HTML, not LLM-friendly text, so every repository link sits under Optional (an agent short of
// context skips them); the site's own repository is listed apart from the dated count of work repositories.
const optional = [
  `- [llms-full.txt](${url('/llms-full.txt')}): ${both('llms.full')}`,
  `- [sitemap.xml](${url('/sitemap.xml')}): ${both('llms.sitemap')}`,
  `- [${new URL(GITHUB_PROFILE).pathname.slice(1)}](${GITHUB_PROFILE}): ${both('llms.profile')}`,
  ...REPOS.map((r) => `- [${r.repo}](${r.url}): ${tStr(r.nameKey, 'zh-Hant')} · ${tStr(r.nameKey, 'en')}`),
  `- [lijiabao-official](${SITE_REPO}): ${both('llms.site')}`,
].join('\n');

const siteIndex = `${header}\n` + `## ${both('llms.pages')}\n\n${pageList}\n\n`;
const index = `${siteIndex}${sectionsText}## Optional\n\n${optional}\n`;
writeFileSync(join(DIST, 'llms.txt'), index);
written.push({ file: join(DIST, 'llms.txt'), text: index });
checked.push({ file: join(DIST, 'llms.txt'), text: `${siteIndex}## Optional\n\n${optional}\n`, posts: false });
checked.push({ file: join(DIST, 'llms.txt'), text: sectionsText, posts: true });

// ── llms-full.txt ───────────────────────────────────────────────────────────────────────────────────────────
const sitePart = `${header}\n${pages.map((p) => `---\n\n${demote(p.content, 1)}`).join('\n')}`;
const fullSection = (section) =>
  content[section].length
    ? `---\n\n## ${both(`llms.${section}`)}\n\n${both(`llms.${section}.note`)}\n\n` +
      content[section].map((e) => `---\n\n${demote(e.content, 2)}`).join('\n')
    : '';
const postsPart = [fullSection('views'), fullSection('articles')].filter(Boolean).join('\n');
const full = postsPart ? `${sitePart}\n${postsPart}` : sitePart;
writeFileSync(join(DIST, 'llms-full.txt'), full);
written.push({ file: join(DIST, 'llms-full.txt'), text: full });
checked.push({ file: join(DIST, 'llms-full.txt'), text: sitePart, posts: false });
if (postsPart) checked.push({ file: join(DIST, 'llms-full.txt'), text: postsPart, posts: true });

// ── headers for the text files (appended to dist/_headers; headers.mjs then adds the CSP to its `/*` block) ───
// Each page .md points search engines at its HTML page (canonical; every path already carries the llms.txt
// describedby Link from the `/*` block of public/_headers). The full-text file stays readable by everyone but out
// of search results, where it would duplicate every page. Posts use one placeholder rule per section and locale
// (`:slug`), so the number of rules stays fixed however many posts there are (Cloudflare allows 100).
const headersFile = join(DIST, '_headers');
const md = 'text/markdown; charset=utf-8';
const txt = 'text/plain; charset=utf-8';
const contentRules = [];
for (const section of ['articles', 'views']) {
  for (const { locale, prefix } of LOCALES) {
    if (!P.hasPosts(posts, section, locale)) continue;
    const base = `${prefix}${P.sectionPath(section)}`;
    contentRules.push(`${base}index.md\n  Content-Type: ${md}\n  Link: <${url(base)}>; rel="canonical"`);
    contentRules.push(`${base}:slug/index.md\n  Content-Type: ${md}\n  Link: <${url(base)}:slug/>; rel="canonical"`);
  }
}
const rules = [
  `/llms.txt\n  Content-Type: ${txt}`,
  `/llms-full.txt\n  Content-Type: ${txt}\n  X-Robots-Tag: noindex`,
  ...pages.map((p) => `${new URL(p.md).pathname}\n  Content-Type: ${md}\n  Link: <${p.html}>; rel="canonical"`),
  ...contentRules,
];
const existing = existsSync(headersFile) ? readFileSync(headersFile, 'utf8').replace(/\n# llms\.mjs[\s\S]*$/, '') : '';
writeFileSync(headersFile, `${existing.trimEnd()}\n\n# llms.mjs — text for language models\n${rules.join('\n\n')}\n`);

// ── gates: the copy rules, every lijiabao.dev link resolves, robots.txt is the endpoint's ───────────────────
const host = new URL(SITE_URL).host;
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!/^Content-Signal: /m.test(robots) || !/^Sitemap: /m.test(robots)) {
  g.fail('dist/robots.txt is not the src/pages/robots.txt.ts output (a stale public/robots.txt would shadow it)');
}
for (const { file, text, posts: isPost } of checked) {
  const hits = isPost ? findPostViolations(text) : findViolations(text, { vendors: features.vendorNames === true });
  for (const v of hits) g.fail(`${rel(file)}: ${v.id} "${v.match}" — ${v.why}`);
}
for (const { file, text } of written) {
  for (const m of text.matchAll(/https?:\/\/[^\s)>\]]+/g)) {
    const u = new URL(m[0]);
    if (u.host !== host) continue;
    let p = decodeURIComponent(u.pathname);
    if (p.endsWith('/')) p += 'index.html';
    if (!existsSync(join(DIST, p)) && !existsSync(join(DIST, `${p}.html`))) g.fail(`${rel(file)}: ${m[0]} does not resolve in dist`);
  }
}
if (!heroZh || !heroEn) g.fail('hero.line is empty');

const nPosts = posts.length;
const nIndexes = content.views.filter((e) => e.kind === 'section').length + content.articles.filter((e) => e.kind === 'section').length;
g.done(
  `${written.length} files — llms.txt ${(Buffer.byteLength(index) / 1024).toFixed(1)} KB, llms-full.txt ${(Buffer.byteLength(full) / 1024).toFixed(1)} KB, ${pages.length} page .md, ${nPosts} post .md, ${nIndexes} section .md`,
);
