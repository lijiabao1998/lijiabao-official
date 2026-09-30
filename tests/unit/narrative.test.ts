// S2 · home narrative (#work, #method, #not, #numbers, #contact): the copy and data the components build from,
// and the pure timing helpers of their motion modules.
import { describe, expect, it } from 'vitest';
import { formatFact, t, tList, tStr } from '@i18n/t';
import type { Key, Locale } from '@i18n/types';
import { NUMBERS, facts } from '@data/facts';
import { LABS } from '@data/labs';
import { features } from '@data/features';
import { beats, DIM, LIT, RESTORE, shift, THIN, TOTAL } from '@motion/sections/not';
import { chainWindow, UNLIT } from '@motion/sections/method';
import { columns, rowDelay } from '@motion/sections/numbers';
import { hasHan, LEAVE_SCALE } from '@motion/sections/work';

const LOCALES: Locale[] = ['zh-Hant', 'en'];

describe('#work copy and minis', () => {
  it('both rows resolve in both locales, numbers from facts', () => {
    for (const l of LOCALES) {
      for (const id of ['gt', 'fr'] as const) {
        for (const part of ['title', 'kicker', 'summary', 'dates', 'stat'] as const) {
          expect(tStr(`work.${id}.${part}` as Key, l), `${id}.${part} ${l}`).not.toBe('');
        }
      }
      expect(tStr('work.gt.stat', l)).toContain(formatFact('gt.pass', l));
      expect(tStr('work.gt.stat', l)).toContain(formatFact('commits.gt', l));
      expect(tStr('work.fr.summary', l)).toContain(formatFact('fr.cards', l));
    }
  });

  it('the CTA and the GitHub link end in the arrow the components draw separately', () => {
    for (const l of LOCALES) {
      expect(tStr('work.cta', l)).toMatch(/→$/u);
      expect(tStr('contact.github', l)).toMatch(/↗$/u);
    }
  });

  it('the mini matrix is 15 labs × 10 cards = fr.cards; the mini lattice is gt.pass', () => {
    expect(LABS).toHaveLength(facts['fr.labs'].value as number);
    for (const lab of LABS) expect(lab.cards).toHaveLength(facts['fr.cardsPerLab'].value as number);
    expect(LABS.reduce((n, l) => n + l.cards.length, 0)).toBe(facts['fr.cards'].value);
    // LatticeCss: 112 columns, the last row short by the surplus
    const pass = facts['gt.pass'].value as number;
    expect(Math.ceil(pass / 112) * 112 - pass).toBe(31);
  });
});

describe('#method', () => {
  it('the chain has five steps in both locales', () => {
    for (const l of LOCALES) expect(tList('method.chain', l)).toHaveLength(5);
  });

  it('the vendor-named writers line stays hidden while features.vendorNames is off', () => {
    expect(features.vendorNames).toBe(false);
    expect(t('method.writers.named', 'zh-Hant')).toBeNull();
    expect(t('method.writers.named', 'en')).toBeNull();
    expect(tStr('method.writers', 'zh-Hant')).not.toBe('');
  });

  it('each step owns an equal fifth of the scrub, the arrow landing before its step lights', () => {
    for (let i = 0; i < 5; i++) {
      const w = chainWindow(i, i > 0);
      expect(w.term[0]).toBeGreaterThanOrEqual(i);
      expect(w.term[0] + w.term[1]).toBeLessThanOrEqual(i + 1);
      if (w.line && w.head) {
        expect(w.line[0]).toBe(i);
        expect(w.head[0]).toBeGreaterThan(w.line[0]);
        expect(w.term[0]).toBeGreaterThanOrEqual(w.head[0]);
        expect(w.head[0] + w.head[1]).toBeLessThanOrEqual(i + 1);
      }
    }
    expect(UNLIT).toBeGreaterThan(0);
    expect(UNLIT).toBeLessThan(1);
  });
});

describe('#not', () => {
  it('three statements, each X / op / Y, plus the full sentence for assistive tech', () => {
    for (const l of LOCALES) {
      for (const n of [1, 2, 3]) {
        for (const p of ['x', 'op', 'y']) expect(tStr(`not.${n}.${p}` as Key, l)).not.toBe('');
      }
      const full = tStr('not.full', l);
      for (const n of [1, 2, 3]) {
        expect(full).toContain(tStr(`not.${n}.y` as Key, l));
      }
    }
  });

  it('phases stay inside their statement and in order (a → b → c → d)', () => {
    for (let i = 0; i < 3; i++) {
      const b = beats(i);
      expect(b.x).toBe(i);
      expect(b.bars).toBeGreaterThan(b.x);
      expect(b.slash).toBeGreaterThan(b.bars);
      expect(b.y).toBeGreaterThan(b.slash);
      expect(b.weigh).toBeGreaterThanOrEqual(b.y);
      expect(b.weigh).toBeLessThan(i + 1);
    }
    expect(RESTORE).toBeGreaterThan(beats(2).weigh);
    expect(TOTAL).toBeGreaterThan(RESTORE);
    expect(THIN).toBeLessThan(LIT);
    expect(DIM).toBeLessThan(1);
  });

  it('the active statement always sits in the last slot', () => {
    const tops = [0, 210, 420];
    expect(shift(tops, 0)).toBe(420);
    expect(shift(tops, 1)).toBe(210);
    expect(shift(tops, 2)).toBe(0);
    expect(shift([], 0)).toBe(0);
  });
});

describe('#numbers', () => {
  it('each num.N is [value, label, source] and its value shows the formatted fact', () => {
    expect(NUMBERS).toHaveLength(6);
    for (const l of LOCALES) {
      for (const { copy, fact } of NUMBERS) {
        const parts = tList(copy as Key, l);
        expect(parts, `${copy} ${l}`).toHaveLength(3);
        expect(parts[0], `${copy} ${l}`).toContain(formatFact(fact, l));
      }
    }
    // the only affix today: "$0" in English
    expect(tList('num.6', 'en')[0]).toBe(`$${formatFact('fr.budgetUsd', 'en')}`);
  });

  it('rows light left → right', () => {
    expect(columns(true, true)).toBe(3);
    expect(columns(false, true)).toBe(2);
    expect(columns(false, false)).toBe(1);
    expect(rowDelay(0, 3)).toBe(0);
    expect(rowDelay(4, 3)).toBeCloseTo(0.08);
    expect(rowDelay(5, 1)).toBe(0);
  });
});

describe('#contact', () => {
  it('X is not rendered: the flag is off and no URL exists', () => {
    expect(features.x).toBe(false);
    expect(features.xUrl).toBeNull();
    expect(t('contact.x', 'zh-Hant')).toBeNull();
    expect(t('contact.x', 'en')).toBeNull();
  });
});

describe('motion helpers', () => {
  it('weighs per character only where the text is CJK', () => {
    expect(hasHan('微光小鎮')).toBe(true);
    expect(hasHan('GlimmerTown')).toBe(false);
    expect(hasHan('correctness')).toBe(false);
    expect(LEAVE_SCALE).toBeCloseTo(1.4);
  });
});
