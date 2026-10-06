// src/lib/feed.ts — RSS 2.0 for one section in one locale (pure, no dependency): /articles/rss.xml,
// /views/rss.xml, /en/articles/rss.xml, /en/views/rss.xml. Items newest first; each names its credit in dc:creator
// (articles: the site; views: the owner). lastBuildDate is the newest change, never the build time, so an
// unchanged section rebuilds to the same bytes. An empty section is a valid, empty channel.

import type { Locale } from '../i18n/types.ts';
import { feedPath, lastChange, localized, newestFirst, postPath, sectionPath, type PostMeta, type PostSection } from './posts.ts';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export interface FeedInput {
  site: URL | string;
  section: PostSection;
  locale: Locale;
  title: string;
  description: string;
  /** dc:creator of every item: the site for articles, the owner for views */
  creator: string;
  posts: readonly PostMeta[];
}

export function rssXml({ site, section, locale, title, description, creator, posts }: FeedInput): string {
  const abs = (p: string): string => new URL(localized(locale, p), site).href;
  const list = newestFirst(posts.filter((p) => p.section === section && p.locale === locale));
  const newest = list.length ? new Date(Math.max(...list.map((p) => lastChange(p).getTime()))) : null;
  const items = list.map((p) => {
    const link = abs(postPath(section, p.slug));
    return [
      '    <item>',
      `      <title>${esc(p.title)}</title>`,
      `      <link>${esc(link)}</link>`,
      `      <guid isPermaLink="true">${esc(link)}</guid>`,
      `      <pubDate>${p.date.toUTCString()}</pubDate>`,
      `      <description>${esc(p.description)}</description>`,
      `      <dc:creator>${esc(creator)}</dc:creator>`,
      ...p.tags.map((t) => `      <category>${esc(t)}</category>`),
      '    </item>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${esc(title)}</title>`,
    `    <link>${esc(abs(sectionPath(section)))}</link>`,
    `    <description>${esc(description)}</description>`,
    `    <language>${locale}</language>`,
    `    <atom:link href="${esc(abs(feedPath(section)))}" rel="self" type="application/rss+xml"/>`,
    ...(newest ? [`    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>`] : []),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
