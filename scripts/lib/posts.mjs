// scripts/lib/posts.mjs — the /articles/ and /views/ posts as BUILT (dist), for the node-only steps that run after
// `astro build`: llms.mjs (Markdown + llms.txt), og.mjs (per-post cards) and check-dist. Reading the pages instead of
// the Markdown sources means drafts (never built) can never leak in, and nothing here re-implements the YAML parser:
// each post page states its own facts in its head — JSON-LD (headline, description, datePublished, inLanguage,
// keywords) and <meta property="article:modified_time"> (present only when the post sets `updated`).
// The section/locale/slug come from the path; the inclusion rules are src/lib/posts.ts (imported by the callers).
// Also: the POSTS copy-rule set lives in ./rules.mjs (findPostViolations).

import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { readPage } from './html.mjs';
import { walk } from './gate.mjs';

const POST_RE = /^(?:(en)\/)?(articles|views)\/([a-z0-9]+(?:-[a-z0-9]+)*)\/index\.html$/;
const INDEX_RE = /^(?:(en)\/)?(articles|views)\/index\.html$/;

/** dist-relative path → { kind, section, locale, slug? } for content pages, else null. */
export function contentRoute(rel) {
  const p = rel.split(sep).join('/');
  let m = INDEX_RE.exec(p);
  if (m) return { kind: 'section', section: m[2], locale: m[1] ? 'en' : 'zh-Hant' };
  m = POST_RE.exec(p);
  if (m) return { kind: 'post', section: m[2], locale: m[1] ? 'en' : 'zh-Hant', slug: m[3] };
  return null;
}

const day = (s) => (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}/.test(s) ? new Date(`${s.slice(0, 10)}T00:00:00Z`) : null);

/** Every JSON-LD node of a page (the @graph flattened). */
export function ldNodes(doc) {
  const out = [];
  for (const s of doc.scripts) {
    if ((s.attrs.get('type') ?? '') !== 'application/ld+json') continue;
    try {
      const j = JSON.parse(s.content);
      out.push(...(Array.isArray(j['@graph']) ? j['@graph'] : [j]));
    } catch {
      /* check-dist reports unparsable JSON-LD */
    }
  }
  return out;
}

const metaOf = (doc, prop) => doc.elements.find((e) => e.name === 'meta' && e.attrs.get('property') === prop)?.attrs.get('content');

/**
 * The published posts in `dist`: PostMeta (src/lib/posts.ts) plus `file` (dist-relative) and `html`.
 * Throws when a post page does not state its facts (a broken template must not produce an empty llms.txt).
 */
export function readBuiltPosts(dist) {
  if (!existsSync(dist)) return [];
  const posts = [];
  for (const abs of walk(dist)) {
    const file = relative(dist, abs).split(sep).join('/');
    const r = contentRoute(file);
    if (!r || r.kind !== 'post') continue;
    const html = readFileSync(abs, 'utf8');
    const doc = readPage(html);
    const node = ldNodes(doc).find((n) => n['@type'] === 'TechArticle' || n['@type'] === 'BlogPosting');
    const date = day(node?.datePublished);
    if (!node || !date || typeof node.headline !== 'string') throw new Error(`[posts] dist/${file}: no post JSON-LD (headline, datePublished)`);
    const updated = day(metaOf(doc, 'article:modified_time'));
    posts.push({
      section: r.section,
      locale: r.locale,
      slug: r.slug,
      title: node.headline,
      description: typeof node.description === 'string' ? node.description : '',
      date,
      ...(updated ? { updated } : {}),
      tags: Array.isArray(node.keywords) ? node.keywords.map(String) : [],
      type: node['@type'],
      file,
      html,
    });
  }
  return posts;
}

/** The four section index pages as built: { section, locale, file, noindex, html }. */
export function readBuiltSections(dist) {
  const out = [];
  for (const section of ['articles', 'views']) {
    for (const [locale, prefix] of [['zh-Hant', ''], ['en', 'en/']]) {
      const file = `${prefix}${section}/index.html`;
      const abs = join(dist, file);
      if (!existsSync(abs)) continue;
      const html = readFileSync(abs, 'utf8');
      const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
      out.push({ section, locale, file, noindex, html });
    }
  }
  return out;
}

/** File name of a post's OG card (same rule as src/components/chrome/og.ts). */
export const postCardName = (p) => `${p.section}-${p.locale === 'en' ? 'en' : 'zh'}-${p.slug}.png`;
