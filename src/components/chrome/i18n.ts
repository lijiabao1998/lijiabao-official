// Build-time helpers for chrome + ui components (Astro frontmatter only; never shipped to the client).
// No copy lives here: every string comes from the dictionary through src/i18n/t.ts (§9.3). These wrappers
// accept plain `string` keys (components build keys like `nav.${id}`); an unknown key still throws in t().
import { intlLocale, localeOf as localeOfAstro, t, tList, tStr, type Vars } from '@i18n/t';
import type { Key } from '@i18n/dict';
import type { Locale, Val } from '@i18n/types';
import type { ImageMetadata } from 'astro';
import type { PostSection } from '@lib/posts';

export type { Vars };
export type PageId = 'home' | 'gt' | 'fr' | 'nf';

/**
 * A content page (/articles/, /views/ and their posts, src/views/Post*.astro): unlike a fixed PageId it carries its
 * own head. Base, Seo, JsonLd, Header, Menu and LangSwitch accept either (`Page`).
 */
export interface ContentPage {
  kind: 'section' | 'post';
  section: PostSection;
  /** <title>, og:title */
  title: string;
  description: string;
  /** unprefixed path per locale this page exists in (both → hreflang pair; one → none) */
  paths: Partial<Record<Locale, string>>;
  /** where the language switch goes when the page does not exist in the other locale (its section index) */
  fallback: string;
  /** empty section: <meta name="robots" content="noindex">, no Markdown alternate */
  noindex: boolean;
  /** og:image (a post card, else the section card) and its alt */
  ogImage: ImageMetadata;
  ogAlt: string;
  /** <meta name="author">: the site for articles, the owner for views */
  author: string;
  /** posts: og:type article + article:* times and tags */
  published?: Date;
  modified?: Date;
  tags?: readonly string[];
  /** the section's RSS feed (unprefixed) */
  feed: string;
  /** JSON-LD nodes of this page (JsonLd adds the Person node when an @id refers to it) */
  jsonld: Record<string, unknown>[];
}

export type Page = PageId | ContentPage;

export function isContent(page: Page): page is ContentPage {
  return typeof page === 'object';
}

/** data-layout of <main>: the PageId, or `post` / `posts` for content pages. */
export function layoutOf(page: Page): string {
  return isContent(page) ? (page.kind === 'post' ? 'post' : 'posts') : page;
}

/** Page locale from the Astro global (currentLocale, else the URL prefix). */
export function localeOf(astro: { currentLocale?: string | undefined; url: URL }): Locale {
  return localeOfAstro(astro);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh-Hant' : 'en';
}

/** Short tag used in file names (og images). */
export function localeTag(locale: Locale): 'zh' | 'en' {
  return locale === 'en' ? 'en' : 'zh';
}

/** Raw dictionary value; null when a P/PE key is gated with a null fallback (omit the block). */
export function tv(key: string, locale: Locale, vars?: Vars): Val | null {
  return t(key as Key, locale, vars);
}

/** Plain text (for attributes, <title>, JSON-LD, runtime templates); '' when omitted. */
export function ts(key: string, locale: Locale, vars?: Vars): string {
  return tStr(key as Key, locale, vars);
}

/** A list value (`a／b／c` in the copy deck) as plain strings; [] when omitted. */
export function tl(key: string, locale: Locale, vars?: Vars): string[] {
  return tList(key as Key, locale, vars);
}

/**
 * A runtime template: the string with its `{placeholders}` intact, for `data-i18n-*` attributes that
 * TypeScript fills in the browser (DOM contract, §9.3).
 */
export function tpl(key: string, locale: Locale, names: string[]): string {
  const vars: Vars = {};
  for (const n of names) vars[n] = `{${n}}`;
  return ts(key, locale, vars);
}

/** Locale-prefixed absolute path; `path` is the zh (unprefixed) path: '/', '/glimmertown/', '/#work'. */
export function localePath(locale: Locale, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return locale === 'en' ? `/en${p}` : p; // '/' → '/en/', '/#work' → '/en/#work'
}

/** The zh (unprefixed) path of each page. The 404 has no canonical path. */
export const PAGE_PATH: Record<PageId, string | null> = {
  home: '/',
  gt: '/glimmertown/',
  fr: '/frontier/',
  nf: null,
};

export function numberFormat(locale: Locale, digits?: number): Intl.NumberFormat {
  return new Intl.NumberFormat(
    intlLocale(locale),
    digits === undefined ? undefined : { minimumFractionDigits: digits, maximumFractionDigits: digits },
  );
}
