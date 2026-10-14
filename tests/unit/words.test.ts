// src/lib/words.ts — a zh-Hant title as plain runs and whole Han words (Post.astro / PostIndex.astro keep each word on one line).
import { describe, expect, it } from 'vitest';
import { titleParts } from '../../src/lib/words';

const words = (t: string): string[] => titleParts(t).filter((p) => p.word).map((p) => p.text);
const joined = (t: string): string => titleParts(t).map((p) => p.text).join('');

describe('titleParts', () => {
  it('keeps multi-character Han words whole and the text unchanged', () => {
    const t = 'AI 爬蟲 robots.txt 設定：擋訓練、留搜尋的寫法與官方清單';
    expect(words(t)).toEqual(['爬蟲', '設定', '訓練', '搜尋', '寫法', '官方', '清單']);
    expect(joined(t)).toBe(t);
  });

  it('leaves spaces, punctuation, Latin and single Han characters in the plain runs (they stay breakable)', () => {
    const t = 'llms.txt 是什麼？讓 AI 讀懂網站的完整指南';
    const parts = titleParts(t);
    expect(parts[0]).toEqual({ text: 'llms.txt 是', word: false });
    expect(words(t)).toEqual(expect.arrayContaining(['什麼', '網站', '完整', '指南']));
    expect(parts.some((p) => p.word && /[\s？]|[a-z]/i.test(p.text))).toBe(false);
  });

  it('merges neighbouring plain runs', () => {
    const parts = titleParts('What is llms.txt?');
    expect(parts).toEqual([{ text: 'What is llms.txt?', word: false }]);
  });
});
