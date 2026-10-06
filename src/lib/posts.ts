// src/lib/posts.ts — the two content sections (owner decision 2026-10-07), as pure data rules shared by the Astro
// build (content.config.ts, pages, sitemap, feeds, header nav) and the node gates (llms.mjs, og.mjs, check-dist via
// Node's own TypeScript stripping, so relative imports carry their .ts extension and nothing here needs Vite).
//
//   /articles/<slug>/  SEO articles (tutorials, explainers, round-ups), credited to the site: never his views.
//   /views/<slug>/     the owner's own views only, credited to him.
//
// URL rules: one ASCII kebab-case slug per post, the same in both locales (file name = slug); no dates or categories
// in URLs; trailing slash; slugs never change. A post may exist in one locale only: it then has no alternate.
// "Published" = built: drafts never reach a page, a feed, the sitemap or llms.txt. A section with no published post
// in a locale still builds its index (links never 404) but is noindex and left out of the sitemap, llms.txt and nav.
// No copy lives here (labels are dictionary keys: posts.*).

import type { Locale } from '../i18n/types.ts';

export type PostSection = 'articles' | 'views';

export const SECTIONS: readonly PostSection[] = ['articles', 'views'];
export const POST_LOCALES: readonly Locale[] = ['zh-Hant', 'en'];

/** ASCII kebab-case: lower-case letters and digits, single hyphens between them. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

export function isSection(s: string): s is PostSection {
  return (SECTIONS as readonly string[]).includes(s);
}

/**
 * The collection id of a content file, from its path relative to the section folder: `<locale>/<slug>.md` →
 * `<locale>/<slug>`. Throws (failing the build) on anything else: a nested folder, an unknown locale folder, or a
 * file name that is not a valid slug.
 */
export function postIdFromPath(entry: string, section: PostSection): string {
  const parts = entry.replace(/\\/g, '/').replace(/^\.?\//, '').split('/');
  const where = `src/content/${section}/${parts.join('/')}`;
  if (parts.length !== 2) {
    throw new Error(`[content] ${where}: posts live directly in src/content/${section}/<zh-Hant|en>/<slug>.md`);
  }
  const [locale = '', file = ''] = parts;
  if (!(POST_LOCALES as readonly string[]).includes(locale)) {
    throw new Error(`[content] ${where}: "${locale}" is not a locale folder (zh-Hant or en)`);
  }
  const slug = file.replace(/\.md$/i, '');
  if (!isSlug(slug)) {
    throw new Error(`[content] ${where}: "${slug}" is not a valid slug (ASCII kebab-case: ${SLUG_RE.source})`);
  }
  return `${locale}/${slug}`;
}

/** `<locale>/<slug>` → its parts. */
export function splitPostId(id: string): { locale: Locale; slug: string } {
  const cut = id.indexOf('/');
  const locale = id.slice(0, cut);
  if (cut < 0 || !(POST_LOCALES as readonly string[]).includes(locale)) throw new Error(`[content] bad post id "${id}"`);
  return { locale: locale as Locale, slug: id.slice(cut + 1) };
}

/** What every consumer needs to know about a published post. */
export interface PostMeta {
  section: PostSection;
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  date: Date;
  updated?: Date | undefined;
  tags: readonly string[];
}

/** The unprefixed (zh) path of a section index: `/articles/`. */
export function sectionPath(section: PostSection): string {
  return `/${section}/`;
}

/** The unprefixed (zh) path of a post: `/articles/<slug>/`. Same slug in both locales. */
export function postPath(section: PostSection, slug: string): string {
  return `/${section}/${slug}/`;
}

/** The feed of a section, unprefixed: `/articles/rss.xml`. */
export function feedPath(section: PostSection): string {
  return `/${section}/rss.xml`;
}

/** Locale prefix (same rule as chrome/i18n localePath, kept here so node scripts need no Vite aliases). */
export function localized(locale: Locale, path: string): string {
  return locale === 'en' ? `/en${path}` : path;
}

/** YYYY-MM-DD (the dates are calendar days, stored as UTC midnight). */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The last change of a post: `updated`, else `date`. */
export function lastChange(p: Pick<PostMeta, 'date' | 'updated'>): Date {
  return p.updated ?? p.date;
}

/** Newest first (date, then updated, then slug for a stable order). */
export function newestFirst<T extends Pick<PostMeta, 'date' | 'updated' | 'slug'>>(posts: readonly T[]): T[] {
  return [...posts].sort(
    (a, b) =>
      b.date.getTime() - a.date.getTime() ||
      lastChange(b).getTime() - lastChange(a).getTime() ||
      a.slug.localeCompare(b.slug),
  );
}

/** Published posts of one section in one locale, newest first. */
export function postsOf<T extends PostMeta>(all: readonly T[], section: PostSection, locale: Locale): T[] {
  return newestFirst(all.filter((p) => p.section === section && p.locale === locale));
}

/** A section counts (index indexed, in nav, sitemap, llms.txt) only with ≥ 1 published post in that locale. */
export function hasPosts(all: readonly PostMeta[], section: PostSection, locale: Locale): boolean {
  return all.some((p) => p.section === section && p.locale === locale);
}

/** Sections with ≥ 1 published post in `locale`, in SECTIONS order (the header nav). */
export function sectionsWithPosts(all: readonly PostMeta[], locale: Locale): PostSection[] {
  return SECTIONS.filter((s) => hasPosts(all, s, locale));
}

/** The same post in the other locale (same section and slug), or null. Pairs exist only when both are published. */
export function alternateOf<T extends PostMeta>(post: PostMeta, all: readonly T[]): T | null {
  return all.find((p) => p.section === post.section && p.slug === post.slug && p.locale !== post.locale) ?? null;
}

/** The locales a post exists in (one or both). */
export function localesOf(all: readonly PostMeta[], section: PostSection, slug: string): Locale[] {
  return POST_LOCALES.filter((l) => all.some((p) => p.section === section && p.slug === slug && p.locale === l));
}

/** One page of a section as listed for language models (llms.txt, llms-full.txt): its index, then its posts. */
export interface ListedPage<T extends PostMeta = PostMeta> {
  kind: 'section' | 'post';
  section: PostSection;
  locale: Locale;
  post?: T;
}

/**
 * What llms.txt lists for one section: per locale (zh-Hant, then en) that has ≥ 1 published post, the section
 * index and then its posts, newest first. An empty locale contributes nothing; an empty section is [] (no heading).
 */
export function listedPages<T extends PostMeta>(all: readonly T[], section: PostSection): ListedPage<T>[] {
  const out: ListedPage<T>[] = [];
  for (const locale of POST_LOCALES) {
    const list = postsOf(all, section, locale);
    if (!list.length) continue;
    out.push({ kind: 'section', section, locale });
    for (const post of list) out.push({ kind: 'post', section, locale, post });
  }
  return out;
}

/**
 * One indexable URL group: a page and its language versions. `paths` holds only the locales that exist (and are
 * indexable); hreflang alternates are emitted only when it holds both.
 */
export interface RouteGroup {
  kind: 'section' | 'post';
  section: PostSection;
  slug?: string;
  /** unprefixed path shared by the locales (sections/posts use the same path in both) */
  path: string;
  /** locale → lastmod (YYYY-MM-DD), only for the locales that are indexable */
  lastmod: Partial<Record<Locale, string>>;
}

/**
 * Every indexable content URL group: non-empty section indexes (lastmod = their newest change) and every
 * published post (lastmod = updated ?? date). Empty sections are not listed. Order: articles then views; the
 * index first, then posts newest first (by their zh date when both exist).
 */
export function contentRoutes(all: readonly PostMeta[]): RouteGroup[] {
  const out: RouteGroup[] = [];
  for (const section of SECTIONS) {
    const index: RouteGroup = { kind: 'section', section, path: sectionPath(section), lastmod: {} };
    for (const locale of POST_LOCALES) {
      const list = postsOf(all, section, locale);
      if (!list.length) continue;
      const newest = Math.max(...list.map((p) => lastChange(p).getTime()));
      index.lastmod[locale] = isoDay(new Date(newest));
    }
    if (Object.keys(index.lastmod).length) out.push(index);
    const seen = new Set<string>();
    for (const p of newestFirst(all.filter((x) => x.section === section))) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      const group: RouteGroup = { kind: 'post', section, slug: p.slug, path: postPath(section, p.slug), lastmod: {} };
      for (const locale of POST_LOCALES) {
        const v = all.find((x) => x.section === section && x.slug === p.slug && x.locale === locale);
        if (v) group.lastmod[locale] = isoDay(lastChange(v));
      }
      out.push(group);
    }
  }
  return out;
}
