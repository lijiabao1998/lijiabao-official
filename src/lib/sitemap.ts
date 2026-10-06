// src/lib/sitemap.ts — the one /sitemap.xml (pure; src/pages/sitemap.xml.ts feeds it the build's posts).
//
// Fixed pages: both locales, each with its hreflang alternates (zh-Hant, en, x-default → zh-Hant), the same set
// Seo.astro puts in <head>; <lastmod> is the data snapshot date. Content (src/lib/posts.ts contentRoutes): every
// non-empty section index and every published post; <lastmod> = updated ?? date; alternates (+ x-default → zh-Hant)
// only when the page exists in both locales. Empty sections (noindex) and feeds are never listed. Still ONE file.

import type { Locale } from '../i18n/types.ts';
import { POST_LOCALES, contentRoutes, localized, type PostMeta } from './posts.ts';

const DEFAULT_LOCALE: Locale = 'zh-Hant';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** A URL group: the same page in the locales listed in `lastmod` (one or both). */
export interface SitemapGroup {
  path: string;
  lastmod: Partial<Record<Locale, string>>;
}

export function sitemapGroups(fixedPaths: readonly string[], asOf: string, posts: readonly PostMeta[]): SitemapGroup[] {
  const fixed = fixedPaths.map((path) => ({ path, lastmod: { 'zh-Hant': asOf, en: asOf } }));
  return [...fixed, ...contentRoutes(posts).map(({ path, lastmod }) => ({ path, lastmod }))];
}

export function sitemapXml(base: URL, groups: readonly SitemapGroup[]): string {
  const abs = (path: string): string => new URL(path, base).href;
  const urls = groups.flatMap(({ path, lastmod }) => {
    const locales = POST_LOCALES.filter((l) => lastmod[l] !== undefined);
    const paired = locales.length === POST_LOCALES.length;
    const links = paired
      ? [
          ...locales.map((l) => ({ hreflang: l as string, href: abs(localized(l, path)) })),
          { hreflang: 'x-default', href: abs(localized(DEFAULT_LOCALE, path)) },
        ]
          .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`)
          .join('\n')
      : '';
    return locales.map(
      (l) =>
        `  <url>\n    <loc>${esc(abs(localized(l, path)))}</loc>\n    <lastmod>${lastmod[l]}</lastmod>\n${links ? `${links}\n` : ''}  </url>`,
    );
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    `${urls.join('\n')}\n` +
    '</urlset>\n'
  );
}
