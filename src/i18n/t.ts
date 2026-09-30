// src/i18n/t.ts — dictionary lookup, P/PE gating, feature flags, fact interpolation, plurals.
// Build-time only (Astro frontmatter, node scripts). Runtime TS never imports copy: it reads the
// `data-i18n-*` attributes the components write at build time (DOM contract, spec §9.3).
import { dict, isKey, type Key } from './dict.ts';
import type { Entry, Locale, Seg, Val } from './types.ts';
import { facts, isFactKey } from '../data/facts.ts';
import { features } from '../data/features.ts';

export type Vars = Record<string, string | number>;

export const LOCALES: readonly Locale[] = ['zh-Hant', 'en'];

/** `PUBLIC_DRAFT=1` renders unapproved P/PE strings with the proposal outline (preview builds only). */
export const DRAFT: boolean = readDraft();

function readDraft(): boolean {
  let v: unknown;
  try {
    v = (import.meta as unknown as { env?: Record<string, unknown> }).env?.PUBLIC_DRAFT;
  } catch {
    v = undefined;
  }
  if (v === undefined) {
    v = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.PUBLIC_DRAFT;
  }
  return v === '1' || v === 1 || v === true || v === 'true';
}

/** BCP 47 tag for Intl formatting. */
export function intlLocale(locale: Locale): string {
  return locale === 'en' ? 'en' : 'zh-Hant-TW';
}

/** Page locale from an Astro context (currentLocale, else the URL prefix). */
export function localeOf(astro: { currentLocale?: string | undefined; url: URL }): Locale {
  if (astro.currentLocale === 'en' || astro.currentLocale === 'zh-Hant') return astro.currentLocale;
  const p = astro.url.pathname;
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'zh-Hant';
}

// ── entries and gating ─────────────────────────────────────────────────────────────────────

export function entryOf(key: Key): Entry {
  const e = (dict as Record<string, Entry | undefined>)[key];
  if (!e) throw new Error(`[i18n] unknown key "${key}"`);
  return e;
}

/** P/PE entries that the owner has not approved. */
export function isGated(e: Entry): boolean {
  return (e.cls === 'P' || e.cls === 'PE') && e.status !== 'APPROVED';
}

export function featureOn(e: Entry): boolean {
  if (!e.feature) return true;
  const v = features[e.feature];
  return typeof v === 'string' ? v.length > 0 : Boolean(v);
}

export interface Resolved {
  /** The key whose text renders (the fallback key when the asked-for entry is gated). */
  key: Key;
  entry: Entry;
  /** True only in draft builds, for an unapproved P/PE entry rendered as a proposal. */
  proposed: boolean;
}

/** What renders for `key`: the entry, its fallback, or nothing (`null` → omit the block). */
export function resolve(key: Key, draft: boolean = DRAFT): Resolved | null {
  const e = entryOf(key);
  if (!featureOn(e)) return null;
  if (isGated(e)) {
    if (draft) return { key, entry: e, proposed: true };
    if (e.fallback == null) return null;
    if (!isKey(e.fallback)) throw new Error(`[i18n] "${key}": fallback "${e.fallback}" is not a key`);
    return resolve(e.fallback, draft);
  }
  return { key, entry: e, proposed: false };
}

export function pick(e: Entry, locale: Locale): Val {
  return locale === 'en' ? e.en : e.zh;
}

// ── public lookups ─────────────────────────────────────────────────────────────────────────

/**
 * The value for `key` in `locale`, with `{fact.key}` filled from facts.ts and `{var}` from `vars`.
 * `null` → the entry is P/PE and not approved with `fallback: null`, or its feature flag is off:
 * callers must omit the block.
 */
export function t(key: Key, locale: Locale, vars?: Vars): Val | null {
  const r = resolve(key);
  if (!r) return null;
  return fill(pick(r.entry, locale), locale, vars, r.key);
}

/** Plain text (backticks stripped, lines joined, segments concatenated); '' when omitted. */
export function tStr(key: Key, locale: Locale, vars?: Vars): string {
  const v = t(key, locale, vars);
  return v === null ? '' : plain(v);
}

/** The value as a list of plain strings (lists, parts and lines); [] when omitted. */
export function tList(key: Key, locale: Locale, vars?: Vars): string[] {
  const v = t(key, locale, vars);
  if (v === null) return [];
  if (typeof v === 'string') return [stripCode(v)];
  if (isSegs(v)) return [plain(v)];
  return (v as string[]).map(stripCode);
}

/** Authored narrow lines (< 640px) for the entry that renders, or null. */
export function tNarrow(key: Key, locale: Locale, vars?: Vars): string[] | null {
  const r = resolve(key);
  if (!r) return null;
  const n = locale === 'en' ? r.entry.narrow?.en : r.entry.narrow?.zh;
  return n ? n.map((s) => fillStr(s, locale, vars, r.key)) : null;
}

/** `lang`/`dir` when the whole value is one language segment (e.g. `lang.switch`), else null. */
export function langOf(v: Val | null): { lang: Locale | 'he'; dir?: 'rtl' } | null {
  if (!Array.isArray(v) || v.length !== 1) return null;
  const s = v[0];
  return typeof s === 'object' && s !== null ? { lang: s.lang, ...(s.dir ? { dir: s.dir } : {}) } : null;
}

/** `proposed` in draft builds for an unapproved P/PE entry; otherwise null (no attribute). */
export function copyStatus(key: Key): 'proposed' | null {
  return resolve(key)?.proposed ? 'proposed' : null;
}

// ── facts and numbers ──────────────────────────────────────────────────────────────────────

const nfCache = new Map<string, Intl.NumberFormat>();

export function formatNumber(n: number, locale: Locale, digits?: number): string {
  const id = `${locale}|${digits ?? ''}`;
  let f = nfCache.get(id);
  if (!f) {
    f = new Intl.NumberFormat(
      intlLocale(locale),
      digits === undefined ? { maximumFractionDigits: 20 } : { minimumFractionDigits: digits, maximumFractionDigits: digits },
    );
    nfCache.set(id, f);
  }
  return f.format(n);
}

/** A fact formatted for display (e.g. `formatFact('gt.pass','en')` → "12,513"). */
export function formatFact(key: string, locale: Locale): string {
  if (!isFactKey(key)) throw new Error(`[i18n] unknown fact "${key}"`);
  const f = facts[key];
  return typeof f.value === 'number' ? formatNumber(f.value, locale, f.digits) : f.value;
}

const prCache = new Map<Locale, Intl.PluralRules>();
function pluralOf(n: number, locale: Locale): Intl.LDMLPluralRule {
  let p = prCache.get(locale);
  if (!p) {
    p = new Intl.PluralRules(intlLocale(locale));
    prCache.set(locale, p);
  }
  return p.select(n);
}

// ── interpolation ──────────────────────────────────────────────────────────────────────────

/** `{name}`, `{fact.key}`, `{name|one|other}`. */
const PH = /\{([A-Za-z][\w.]*)(?:\|([^{}|]*)\|([^{}|]*))?\}/g;

export function fillStr(s: string, locale: Locale, vars?: Vars, key = ''): string {
  return s.replace(PH, (match: string, name: string, one?: string, other?: string) => {
    let v: string | number;
    let digits: number | undefined;
    if (vars && Object.prototype.hasOwnProperty.call(vars, name)) {
      v = vars[name] as string | number;
    } else if (name.includes('.')) {
      if (!isFactKey(name)) throw new Error(`[i18n] "${key}": unknown fact {${name}}`);
      const f = facts[name];
      v = f.value;
      digits = f.digits;
    } else {
      return match; // runtime template variable: keep for the browser
    }
    if (one !== undefined) {
      const n = typeof v === 'number' ? v : Number(v);
      return pluralOf(n, locale) === 'one' ? one : (other ?? '');
    }
    return typeof v === 'number' ? formatNumber(v, locale, digits) : v;
  });
}

export function fill(v: Val, locale: Locale, vars?: Vars, key = ''): Val {
  if (typeof v === 'string') return fillStr(v, locale, vars, key);
  if (isSegs(v)) {
    return v.map((s) => (typeof s === 'string' ? fillStr(s, locale, vars, key) : { ...s, text: fillStr(s.text, locale, vars, key) }));
  }
  return (v as string[]).map((s) => fillStr(s, locale, vars, key));
}

// ── shapes and text ────────────────────────────────────────────────────────────────────────

/** A Seg[] contains at least one `{lang, text}` segment; an all-string array is a string[]. */
export function isSegs(v: Val): v is Seg[] {
  return Array.isArray(v) && v.some((s) => typeof s !== 'string');
}

export function stripCode(s: string): string {
  return s.replace(/`/g, '');
}

const CJK = /[⺀-⿿　-〿぀-ヿ㄀-ㄯ㆐-ㇿ㐀-䶿一-鿿豈-﫿︰-﹏＀-｠￠-￦]/;
const HAN = /[㐀-䶿一-鿿豈-﫿]/;

export function isCJKChar(ch: string): boolean {
  return CJK.test(ch);
}

/** Joins authored lines: no space after/before CJK, one space between Latin lines. */
export function joinLines(lines: readonly string[]): string {
  let out = '';
  for (const line of lines) {
    if (!out) {
      out = line;
      continue;
    }
    const a = out.slice(-1);
    const b = line.charAt(0);
    out += isCJKChar(a) || isCJKChar(b) || /\s/.test(a) ? line : ` ${line}`;
  }
  return out;
}

/** Flattens any value to plain text. */
export function plain(v: Val): string {
  if (typeof v === 'string') return stripCode(v);
  if (isSegs(v)) return v.map((s) => stripCode(typeof s === 'string' ? s : s.text)).join('');
  return joinLines((v as string[]).map(stripCode));
}

/** One rendered run of text: plain, code (from backticks), or a language segment. */
export interface Run {
  text: string;
  code?: boolean;
  lang?: Locale | 'he';
  dir?: 'rtl';
}

function codeRuns(s: string, base: Omit<Run, 'text'> = {}): Run[] {
  const parts = s.split('`');
  const out: Run[] = [];
  parts.forEach((text, i) => {
    if (text) out.push({ ...base, text, ...(i % 2 === 1 ? { code: true } : {}) });
  });
  return out;
}

/**
 * Splits one line (a string or a Seg[] run) into runs. Where two runs meet Han ↔ Latin/digit with
 * no whitespace between them, a ' ' run is inserted: compressHTML strips template whitespace, and
 * the space is part of the copy.
 */
export function runsOf(line: string | Seg[]): Run[] {
  const raw: Run[] = typeof line === 'string'
    ? codeRuns(line)
    : line.flatMap((s) => (typeof s === 'string' ? codeRuns(s) : codeRuns(s.text, { lang: s.lang, ...(s.dir ? { dir: s.dir } : {}) })));
  const out: Run[] = [];
  for (const r of raw) {
    const prev = out[out.length - 1];
    if (prev) {
      const a = prev.text.slice(-1);
      const b = r.text.charAt(0);
      if ((HAN.test(a) && /[A-Za-z0-9]/.test(b)) || (/[A-Za-z0-9]/.test(a) && HAN.test(b))) out.push({ text: ' ' });
    }
    out.push(r);
  }
  return out;
}

/** Lines of a value for rendering: string → 1 line; string[] → its lines/items; Seg[] → 1 line. */
export function linesOf(v: Val): (string | Seg[])[] {
  if (typeof v === 'string') return [v];
  if (isSegs(v)) return [v];
  return v as string[];
}

/**
 * Fit-to-line width of one line in em (spec §2.2): full-width characters and punctuation count 1,
 * everything else (Latin, digits, spaces) counts 0.56. `track` adds letter-spacing per character.
 */
export function fitUnits(line: string | Seg[], track = 0): number {
  const text = typeof line === 'string' ? stripCode(line) : plain(line);
  let n = 0;
  for (const ch of text) n += (isCJKChar(ch) ? 1 : 0.56) + track;
  return Math.round(n * 100) / 100;
}
