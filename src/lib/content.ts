// src/lib/content.ts — the build's view of the two content collections (src/content.config.ts). Drafts are dropped
// here, once, so no page, feed, sitemap entry or nav link can ever see one. Everything else is the pure rules of
// ./posts.ts. Build time only (Astro frontmatter and endpoints).

import type { APIRoute } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_URL } from '../data/links.ts';
import type { Locale } from '../i18n/types.ts';
import { ts } from '../components/chrome/i18n.ts';
import { rssXml } from './feed.ts';
import { siteOrg } from './postld.ts';
import { SECTIONS, newestFirst, sectionPath, sectionsWithPosts, splitPostId, type PostMeta, type PostSection } from './posts.ts';

export type ArticleEntry = CollectionEntry<'articles'>;
export type ViewEntry = CollectionEntry<'views'>;
export type PostEntry = ArticleEntry | ViewEntry;

/** A published post: its meta plus the collection entry (for render()). */
export interface Post extends PostMeta {
  entry: PostEntry;
  sources: readonly { title: string; url: string }[];
}

function toPost(section: PostSection, entry: PostEntry): Post {
  const { locale, slug } = splitPostId(entry.id);
  const d = entry.data;
  return {
    section,
    locale,
    slug,
    title: d.title,
    description: d.description,
    date: d.date,
    updated: d.updated,
    tags: d.tags,
    sources: 'sources' in d ? d.sources : [],
    entry,
  };
}

/**
 * The Markdown files on disk, keys only (nothing is loaded): an empty section is answered without calling
 * getCollection, which would log "collection does not exist or is empty" once per page render.
 */
const FILES: Record<PostSection, Record<string, unknown>> = {
  articles: import.meta.glob('../content/articles/**/*.md'),
  views: import.meta.glob('../content/views/**/*.md'),
};

/** Every published post of one section (both locales), newest first. */
export async function sectionPosts(section: PostSection): Promise<Post[]> {
  if (!Object.keys(FILES[section]).length) return [];
  const entries: PostEntry[] = await getCollection(section, ({ data }) => data.draft !== true);
  return newestFirst(entries.map((e) => toPost(section, e)));
}

/** Every published post of both sections. */
export async function allPosts(): Promise<Post[]> {
  return (await Promise.all(SECTIONS.map(sectionPosts))).flat();
}

/** getStaticPaths for /<section>/[slug] in one locale. */
export async function postStaticPaths(section: PostSection, locale: Locale): Promise<{ params: { slug: string }; props: { post: Post } }[]> {
  return (await sectionPosts(section)).filter((p) => p.locale === locale).map((post) => ({ params: { slug: post.slug }, props: { post } }));
}

/** Header / menu links to the sections that have ≥ 1 published post in `locale` (none today). */
export async function navSections(locale: Locale): Promise<{ section: PostSection; path: string }[]> {
  return sectionsWithPosts(await allPosts(), locale).map((section) => ({ section, path: sectionPath(section) }));
}

/** The RSS 2.0 endpoint of one section in one locale (src/pages/[en/]<section>/rss.xml.ts). */
export function feedRoute(section: PostSection, locale: Locale): APIRoute {
  return async ({ site }) => {
    const base = site ?? new URL(SITE_URL);
    const xml = rssXml({
      site: base,
      section,
      locale,
      title: ts(`meta.${section}.title`, locale),
      description: ts(`meta.${section}.desc`, locale),
      creator: section === 'articles' ? String(siteOrg(base).name) : ts('site.name', locale),
      posts: await sectionPosts(section),
    });
    return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
  };
}
