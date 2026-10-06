// src/i18n/dict.ts — the one dictionary (spec §4.0): merges the namespaces, throws on duplicate keys.
// ns/posts.ts (2026-10-07): the /articles/ and /views/ chrome.
import type { Entry } from './types.ts';
import common from './ns/common.ts';
import home from './ns/home.ts';
import gt from './ns/gt.ts';
import fr from './ns/fr.ts';
import labs from './ns/labs.ts';
import nf from './ns/nf.ts';
import posts from './ns/posts.ts';

const namespaces = { common, home, gt, fr, labs, nf, posts };

type Merged = typeof common & typeof home & typeof gt & typeof fr & typeof labs & typeof nf & typeof posts;

function merge(parts: Record<string, Record<string, Entry>>): Merged {
  const out: Record<string, Entry> = {};
  const owner: Record<string, string> = {};
  for (const [ns, part] of Object.entries(parts)) {
    for (const [key, entry] of Object.entries(part)) {
      if (key in out) throw new Error(`[i18n] duplicate key "${key}" in ns/${ns}.ts (already in ns/${owner[key]}.ts)`);
      out[key] = entry;
      owner[key] = ns;
    }
  }
  return out as Merged;
}

export const dict: Merged = merge(namespaces);

/** Every dictionary key. */
export type Key = keyof Merged & string;

/** Namespace of each key (for reports and checks). */
export const keyNamespace: Readonly<Record<Key, keyof typeof namespaces>> = Object.fromEntries(
  Object.entries(namespaces).flatMap(([ns, part]) => Object.keys(part).map((k) => [k, ns])),
) as Record<Key, keyof typeof namespaces>;

export function isKey(key: string): key is Key {
  return Object.prototype.hasOwnProperty.call(dict, key);
}

export const keys = Object.keys(dict) as Key[];
