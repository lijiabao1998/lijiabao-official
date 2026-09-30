// P3 motion robustness: the pure rules behind CJK-safe splitting (primitives/split.ts), the entrance settle
// (motion/settle.ts) and the lite → full upgrade probe (gl/core/probe.ts).
import { describe, expect, it } from 'vitest';
import { cjkUnits } from '../../src/motion/primitives/split';
import { due } from '../../src/motion/settle';
import { judge } from '../../src/gl/core/probe';

const NBSP = '\u00A0';

describe('cjkUnits', () => {
  it('cuts Han text into single characters and keeps Latin words and numbers whole', () => {
    expect(cjkUnits('直接做吧')).toEqual(['直', '接', '做', '吧']);
    expect(cjkUnits('跑了8.70分')).toEqual(['跑', '了', '8.70', '分']);
    expect(cjkUnits('見D000-vision.md。')).toEqual(['見', 'D000-vision.md。']);
  });

  it('glues closing marks to the unit before and opening marks to the unit after', () => {
    expect(cjkUnits('「直接，做」')).toEqual(['「直', '接，', '做」']);
    expect(cjkUnits('（一）')).toEqual(['（一）']);
  });

  it('keeps a space inside Chinese text as its own breakable unit, never glued to a neighbour', () => {
    const u = cjkUnits('就跟 lab 線一樣');
    expect(u).toEqual(['就', '跟', ' ', 'lab', ' ', '線', '一', '樣']);
    expect(u.join('')).toBe('就跟 lab 線一樣');
    // runs of whitespace collapse to one space unit
    expect(cjkUnits('跟  lab')).toEqual(['跟', ' ', 'lab']);
  });

  it('never breaks after an opening mark or before a closing mark, even across a space', () => {
    expect(cjkUnits('「 lab')).toEqual([`「${NBSP}lab`]);
    expect(cjkUnits('lab ，好')).toEqual([`lab${NBSP}，`, '好']);
  });

  it('keeps a slash and a middle dot off the start of a line, as the browser does', () => {
    expect(cjkUnits('C4 / C5 門檻')).toEqual([`C4${NBSP}/`, ' ', 'C5', ' ', '門', '檻']);
    expect(cjkUnits('未通過・已記錄')).toEqual(['未', '通', '過・', '已', '記', '錄']);
  });

  it('leaves whitespace-only text (between elements) untouched', () => {
    expect(cjkUnits(' ')).toEqual([' ']);
    expect(cjkUnits('\n  ')).toEqual(['\n  ']);
  });

  it('round-trips the visible text (spaces aside) for the real quote', () => {
    const q = '「直接做吧，就跟 lab 線一樣，開始是美術好看，後來長出了自己的標準。」';
    expect(cjkUnits(q).join('').replaceAll(NBSP, ' ')).toBe(q);
    for (const u of cjkUnits(q)) {
      expect(u === ' ' || !/^[，。」]/u.test(u), u).toBe(true); // no unit starts with a closing mark
      expect(/「$/u.test(u), u).toBe(false); // none ends with an opening mark
    }
  });
});

describe('settle', () => {
  it('fails open for anything in or above the viewport, never below it', () => {
    expect(due(-400, 900)).toBe(true); // scrolled past
    expect(due(300, 900)).toBe(true); // on screen
    expect(due(899.5, 900)).toBe(false); // its top is at the bottom edge
    expect(due(1200, 900)).toBe(false); // below the fold: it waits for the reader
  });
});

describe('upgrade probe verdict', () => {
  const frames = (n: number, f: (i: number) => number): number[] => Array.from({ length: n }, (_, i) => f(i));
  const idle = frames(80, () => 0.8);

  it('passes a capable desktop at 60 Hz and at 120 Hz', () => {
    expect(judge(frames(80, (i) => 16.6 + (i % 3) * 0.1), idle)).toBe('pass');
    expect(judge(frames(80, (i) => 8.3 + (i % 2) * 0.1), idle)).toBe('pass');
  });

  it('tolerates the odd long frame', () => {
    expect(judge(frames(80, (i) => (i % 20 === 0 ? 33.4 : 16.7)), idle)).toBe('pass');
  });

  it('fails when the engine JS is not comfortably inside the frame, or the page cannot hold 60 fps', () => {
    expect(judge(frames(80, () => 16.7), frames(80, () => 5))).toBe('fail');
    expect(judge(frames(80, () => 33.3), idle)).toBe('fail');
    // a GPU that misses every other frame at 60 Hz
    expect(judge(frames(80, (i) => (i % 2 ? 16.7 : 33.4)), idle)).toBe('fail');
  });

  it('is inconclusive when mostly steady frames are janked by something else', () => {
    expect(judge(frames(80, (i) => (i % 5 === 0 ? 33.4 : 16.7)), idle)).toBe('retry');
    expect(judge([], [])).toBe('retry');
  });
});
