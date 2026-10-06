// src/pages/sitemap.xml.ts — static endpoint (§3): the ONE /sitemap.xml. Every fixed page in both locales, each with
// its hreflang alternates (zh-Hant, en, x-default → zh-Hant), the same set Seo.astro puts in <head>; the 404 is not
// listed and <lastmod> is the data snapshot date. Plus the content sections (src/lib/sitemap.ts): non-empty section
// indexes and every published post, <lastmod> = updated ?? date, alternates only when both locales exist.
// Build time only; the XML holds URLs, no copy.
import type { APIRoute } from 'astro';
import { SNAPSHOT } from '@data/facts';
import { SITE_URL } from '@data/links';
import { allPosts } from '@lib/content';
import { sitemapGroups, sitemapXml } from '@lib/sitemap';
import { PAGE_PATH, type PageId } from '../components/chrome/i18n';

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(SITE_URL);
  const paths = (Object.keys(PAGE_PATH) as PageId[]).flatMap((id) => {
    const p = PAGE_PATH[id];
    return p ? [p] : [];
  });
  const xml = sitemapXml(base, sitemapGroups(paths, SNAPSHOT.asOf, await allPosts()));
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
