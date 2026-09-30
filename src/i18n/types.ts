// src/i18n/types.ts — dictionary types (spec §9.3, frozen) plus the tiny authoring helper.
//
// Authoring model (spec §4.0): each namespace file declares
//   const zh = { 'key': { zh, cls, …meta } } satisfies Record<string, ZhEntry>;
//   const en = { 'key': 'English' }          satisfies DictShape<typeof zh>;   ← a missing or extra key fails typecheck
//   export default defineNs(zh, en);                                          ← Record<key, Entry>
//
// Value conventions (renderers rely on these):
// - `string[]` on a `display: true` entry = authored display lines (「｜」 in the copy deck).
// - `string[]` elsewhere = an ordered list of parts or items; the key's comment says which.
// - `Seg[]` = a mixed-language run; `{ lang, dir?, text }` segments get their own lang/dir span.
//   A Seg[] always contains at least one `{lang}` object (an all-string array is a string[]).
// - `''` = nothing in this locale (e.g. the zh gloss of a zh proverb): <T> renders no element.
// - Text in `backticks` is code (file names, IDs); `<T>` renders it as <code>.
// - `{fact.key}` (dotted) is filled from src/data/facts.ts and formatted per locale.
//   `{name}` (no dot) is a caller variable; left untouched when not supplied (runtime templates).
//   `{name|one|other}` prints the plural form for the number in `name` (Intl.PluralRules).
// - `display: true` means the string may be set with --ff-display (Noto Sans TC display subset on
//   zh pages). scripts/glyphs.mjs builds the subset from exactly these entries; set any other text
//   with --ff-body so no heading ever mixes two CJK fonts.

import type { Features } from '../data/features.ts';

export type Locale = 'zh-Hant' | 'en';
export type Seg = string | { lang: Locale | 'he'; dir?: 'rtl'; text: string };
export type Val = string | string[] | Seg[];
export type Cls = 'F' | 'R' | 'O' | 'OD' | 'T' | 'OB' | 'P' | 'PE';

export interface Entry {
  zh: Val;
  en: Val;
  cls: Cls;
  /** Provenance: a research report (`[glimmer]`), repo file, or note. */
  src?: string;
  /** May be set in the display face (see header). */
  display?: boolean;
  /** Alternative authored lines for widths under 640px. */
  narrow?: { zh?: string[]; en?: string[] };
  /** P/PE only: the KEY that renders while this entry is not approved; `null` = omit the block. */
  fallback?: string | null;
  /** P/PE approved by the owner: renders in production. */
  status?: 'APPROVED';
  /** Renders only while this owner flag is on (e.g. 'vendorNames' for *.named keys). */
  feature?: keyof Features;
}

/** Authoring form of an entry: the zh value plus all metadata. The en value lives in a parallel object. */
export type ZhEntry = Omit<Entry, 'en'>;

/** Shape the English object must satisfy: exactly the zh keys, each with a value. */
export type DictShape<Z> = { readonly [K in keyof Z]: Val };

/** Joins a namespace's zh entries and en values into `Entry` records. Throws if the key sets differ. */
export function defineNs<Z extends Record<string, ZhEntry>>(zh: Z, en: DictShape<Z>): { [K in keyof Z]: Entry } {
  const out = {} as { [K in keyof Z]: Entry };
  const enKeys = new Set(Object.keys(en));
  for (const key of Object.keys(zh) as (keyof Z & string)[]) {
    if (!enKeys.has(key)) throw new Error(`[i18n] missing en value for "${key}"`);
    enKeys.delete(key);
    out[key] = { ...zh[key], en: en[key] } as Entry;
  }
  if (enKeys.size) throw new Error(`[i18n] en keys without zh: ${[...enKeys].join(', ')}`);
  return out;
}

export type { Key } from './dict.ts';
