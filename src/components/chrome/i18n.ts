// Build-time helpers for chrome + ui components (Astro frontmatter only; never shipped to the client).
// No copy lives here: every string comes from the dictionary through src/i18n/t.ts (§9.3). These wrappers
// accept plain `string` keys (components build keys like `nav.${id}`); an unknown key still throws in t().
import { intlLocale, localeOf as localeOfAstro, t, tList, tStr, type Vars } from '@i18n/t';
import type { Key } from '@i18n/dict';
import type { Locale, Val } from '@i18n/types';

export type { Vars };
export type PageId = 'home' | 'gt' | 'fr' | 'nf';

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
