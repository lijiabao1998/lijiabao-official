// F0: dictionary invariants (§4.0, build-overrides §1). Owners add their own tests next to this file.
import { describe, expect, it } from 'vitest';
import { dict, type Key } from '@i18n/dict';
import { resolve, t, tStr } from '@i18n/t';
import type { Entry } from '@i18n/types';
import { facts } from '@data/facts';
import { REPOS, COMMITS_TOTAL } from '@data/repos';
import { LABS } from '@data/labs';

const entries = Object.entries(dict) as [Key, Entry][];

describe('dictionary', () => {
  it('every key has both locales (empty string allowed only as an explicit "nothing")', () => {
    for (const [k, e] of entries) {
      expect(e.zh, k).not.toBeUndefined();
      expect(e.en, k).not.toBeUndefined();
    }
  });

  it('every gated P/PE entry resolves to a real fallback or to nothing', () => {
    for (const [k] of entries) expect(() => resolve(k, false), k).not.toThrow();
  });

  it('every entry renders in both locales without unknown facts', () => {
    for (const [k] of entries) {
      expect(() => t(k, 'zh-Hant'), k).not.toThrow();
      expect(() => t(k, 'en'), k).not.toThrow();
    }
  });

  it('the owner-approved hero line ships on both locales', () => {
    expect(tStr('hero.line', 'zh-Hant')).toBe('讓每個人，都有一座自己的實驗室。');
    expect(tStr('hero.line', 'en')).toBe('Everyone deserves a lab of their own.');
  });

  it('never publishes the forbidden lines', () => {
    const all = JSON.stringify(entries);
    for (const s of ['跨域的預測與風險編排', '202606050549', '無岸', '立德立言', '無問西東']) {
      expect(all.includes(s), s).toBe(false);
    }
  });
});

describe('data sums', () => {
  it('repo commits add up to the snapshot total', () => {
    expect(REPOS).toHaveLength(19);
    expect(COMMITS_TOTAL).toBe(facts['commits.total'].value);
  });
  it('15 labs', () => {
    expect(LABS).toHaveLength(15);
  });
});
