// src/lib/postld.ts — JSON-LD for the two content sections (pure; JsonLd.astro adds the shared Person node).
//
//   /articles/ post   TechArticle — author AND publisher = the site as an Organization (never the Person)
//   /articles/ index  CollectionPage — publisher = the site; an ItemList of the articles
//   /views/ post      BlogPosting — author = the Person node of JsonLd.astro ({"@id": "<site>/#person"})
//   /views/ index     CollectionPage whose mainEntity is the Blog (author = the Person) with its posts
//
// Every node carries inLanguage and its canonical url. Dates are calendar days (YYYY-MM-DD).

import type { Locale } from '../i18n/types.ts';
import { isoDay, lastChange, localized, postPath, sectionPath, type PostMeta, type PostSection } from './posts.ts';

export type Node = Record<string, unknown>;

/** `https://lijiabao.dev` (no trailing slash) from the Astro site URL. */
export const siteRoot = (site: URL | string): string => new URL(site).href.replace(/\/$/, '');

/** The Person node's id (the node itself is defined once, in JsonLd.astro). */
export const personId = (site: URL | string): string => `${siteRoot(site)}/#person`;

/** The site as an Organization: the author and publisher of every /articles/ page. */
export function siteOrg(site: URL | string): Node {
  const root = siteRoot(site);
  return { '@type': 'Organization', '@id': `${root}/#site`, name: new URL(root).host, url: `${root}/` };
}

const abs = (site: URL | string, locale: Locale, path: string): string => `${siteRoot(site)}${localized(locale, path)}`;

interface PostLdInput {
  site: URL | string;
  post: PostMeta;
  /** absolute og:image URL */
  image: string;
  /** articles only */
  sources?: readonly { title: string; url: string }[];
}

/** The node of one post: TechArticle (articles, site-authored) or BlogPosting (views, by the Person). */
export function postLd({ site, post, image, sources = [] }: PostLdInput): Node {
  const url = abs(site, post.locale, postPath(post.section, post.slug));
  const indexUrl = abs(site, post.locale, sectionPath(post.section));
  const base: Node = {
    '@id': `${url}#post`,
    headline: post.title,
    description: post.description,
    inLanguage: post.locale,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: isoDay(post.date),
    dateModified: isoDay(lastChange(post)),
    image,
    ...(post.tags.length ? { keywords: [...post.tags] } : {}),
  };
  if (post.section === 'articles') {
    const org = siteOrg(site);
    return {
      '@type': 'TechArticle',
      ...base,
      author: org,
      publisher: org,
      isPartOf: { '@type': 'CollectionPage', '@id': indexUrl, url: indexUrl },
      ...(sources.length ? { citation: sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })) } : {}),
    };
  }
  return {
    '@type': 'BlogPosting',
    ...base,
    author: { '@id': personId(site) },
    isPartOf: { '@type': 'Blog', '@id': `${indexUrl}#blog`, url: indexUrl },
  };
}

interface SectionLdInput {
  site: URL | string;
  section: PostSection;
  locale: Locale;
  name: string;
  description: string;
  /** the section's published posts in this locale, newest first */
  posts: readonly PostMeta[];
}

/** The node(s) of a section index: CollectionPage (+ the Blog for /views/). */
export function sectionLd({ site, section, locale, name, description, posts }: SectionLdInput): Node[] {
  const url = abs(site, locale, sectionPath(section));
  const page: Node = {
    '@type': 'CollectionPage',
    '@id': url,
    url,
    name,
    description,
    inLanguage: locale,
    isPartOf: { '@type': 'WebSite', url: `${siteRoot(site)}${localized(locale, '/')}`, name: new URL(siteRoot(site)).host },
  };
  const item = (p: PostMeta): Node => ({ url: abs(site, locale, postPath(section, p.slug)), name: p.title });
  if (section === 'articles') {
    page.publisher = siteOrg(site);
    page.mainEntity = {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, ...item(p) })),
    };
    return [page];
  }
  const blog: Node = {
    '@type': 'Blog',
    '@id': `${url}#blog`,
    url,
    name,
    description,
    inLanguage: locale,
    author: { '@id': personId(site) },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      '@id': `${abs(site, locale, postPath(section, p.slug))}#post`,
      headline: p.title,
      url: abs(site, locale, postPath(section, p.slug)),
      datePublished: isoDay(p.date),
    })),
  };
  page.mainEntity = { '@id': `${url}#blog` };
  return [page, blog];
}
