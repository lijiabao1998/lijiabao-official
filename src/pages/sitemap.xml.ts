// src/pages/sitemap.xml.ts — static endpoint (§3): /sitemap.xml with every page in both locales, each carrying
// its hreflang alternates (zh-Hant, en, x-default → zh-Hant), the same set Seo.astro puts in <head>. The 404 is not
// listed. <lastmod> is the data snapshot date: the day the pages' numbers are true as of.
// Build time only; the XML holds URLs, no copy.
import type { APIRoute } from 'astro';
import { SNAPSHOT } from '@data/facts';
import { SITE_URL } from '@data/links';
import type { Locale } from '@i18n/types';
import { PAGE_PATH, localePath, type PageId } from '../components/chrome/i18n';

const LOCALES: readonly Locale[] = ['zh-Hant', 'en'];
const DEFAULT_LOCALE: Locale = 'zh-Hant';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL(SITE_URL);
  const abs = (path: string): string => new URL(path, base).href;
  const paths = (Object.keys(PAGE_PATH) as PageId[]).flatMap((id) => {
    const p = PAGE_PATH[id];
    return p ? [p] : [];
  });

  const urls = paths.flatMap((path) => {
    const alternates = [
      ...LOCALES.map((l) => ({ hreflang: l as string, href: abs(localePath(l, path)) })),
      { hreflang: 'x-default', href: abs(localePath(DEFAULT_LOCALE, path)) },
    ];
    const links = alternates.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(a.href)}"/>`).join('\n');
    return LOCALES.map(
      (l) => `  <url>\n    <loc>${esc(abs(localePath(l, path)))}</loc>\n    <lastmod>${SNAPSHOT.asOf}</lastmod>\n${links}\n  </url>`,
    );
  });

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    `${urls.join('\n')}\n` +
    '</urlset>\n';

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
