// S5 Frontier: the pure helpers behind the page's presentation (src/components/fr/parts.ts), checked against the
// real dictionary strings and data so a copy edit that breaks a split fails here, not silently in the page.
import { describe, expect, it } from 'vitest';
import { tList, tStr } from '@i18n/t';
import type { Locale } from '@i18n/types';
import { GOV, LABS, TILES, labStatus } from '@data/labs';
import { facts } from '@data/facts';
import { links } from '@data/links';
import {
  ghPath, labCode, lattice, roundPos, runs, splitCite, splitDots, splitLabel, splitSlash, versionsIn,
} from '../../src/components/fr/parts';

const LOCALES: Locale[] = ['zh-Hant', 'en'];

describe('splitLabel', () => {
  it('splits the status vocabularies and the command list in both locales', () => {
    for (const l of LOCALES) {
      for (const k of ['fr.vocab.problem', 'fr.vocab.round', 'fr.gov.cli'] as const) {
        const { label, body } = splitLabel(tStr(k, l));
        expect(label, `${k} ${l}`).not.toBe('');
        expect(body, `${k} ${l}`).not.toBe('');
      }
    }
    expect(splitSlash(splitLabel(tStr('fr.vocab.problem', 'en')).body)).toEqual([
      'OPEN', 'PARTIAL', 'CLAIMED_RESOLVED', 'COMPLETED_EXTERNAL', 'COMPLETED_INTERNAL', 'PAUSED', 'RETRACTED',
    ]);
    expect(splitSlash(splitLabel(tStr('fr.vocab.round', 'zh-Hant')).body)).toEqual([
      'DRAFT', 'ADMITTED', 'PAUSED', 'CLOSED_EXTERNAL', 'FINISHED',
    ]);
    expect(splitDots(splitLabel(tStr('fr.gov.cli', 'zh-Hant')).body)).toEqual([
      'validate', 'start', 'admit', 'check-diff', 'check-pins', 'decide',
    ]);
  });

  it('splits every safety bound into a lab label and its limit', () => {
    for (const l of LOCALES) {
      for (const id of ['bio', 'chem', 'med', 'eng', 'earth', 'neuro', 'mat']) {
        const { label, body } = splitLabel(tStr(`fr.bounds.${id}` as never, l));
        expect(label.length, `${id} ${l}`).toBeGreaterThan(0);
        expect(body.length, `${id} ${l}`).toBeGreaterThan(label.length);
      }
    }
    expect(splitLabel('Materials: paid DFT/GPU runs').label).toBe('Materials');
    expect(splitLabel('no colon here')).toEqual({ label: '', body: 'no colon here' });
  });
});

describe('splitCite / splitDots / runs', () => {
  it('separates the governance quote from its source in both locales', () => {
    for (const l of LOCALES) {
      const { quote, cite } = splitCite(tStr('fr.quote', l));
      expect(cite).toBe('FrontierLab-Governance README');
      expect(quote.length).toBeGreaterThan(20);
    }
  });

  it('keeps every digit of the governance stats and marks them as numbers', () => {
    for (const l of LOCALES) {
      const raw = tStr('fr.gov.stats', l);
      const items = splitDots(raw);
      expect(items).toHaveLength(5);
      const nums = items.flatMap((s) => runs(s).filter((r) => r.num).map((r) => r.text));
      expect(nums).toEqual(
        expect.arrayContaining([
          String(facts['gov.lines'].value),
          String(facts['gov.tests'].value),
          `${facts['gov.mutationKilled'].value}/${facts['gov.mutationTotal'].value}`,
        ]),
      );
    }
    const r = runs('`frontier.py` 796 lines');
    expect(r[0]).toEqual({ text: 'frontier.py', code: true });
    expect(r.filter((x) => x.num).map((x) => x.text)).toEqual(['796']);
    expect(runs('1.1e-14').map((x) => x.text).join('')).toBe('1.1e-14');
  });
});

describe('versionsIn', () => {
  it('reads the protocol path in order, once each', () => {
    for (const l of LOCALES) expect(versionsIn(tStr('fr.gov.protocol', l))).toEqual(['1.0.0', '1.1.0', '1.2.0', '2.0.0']);
  });

  it('every lab pins a version on that path; the counts match facts.ts', () => {
    const path = versionsIn(tStr('fr.gov.protocol', 'en'));
    for (const lab of LABS) expect(path).toContain(lab.protocol);
    expect(LABS.filter((x) => x.protocol === '1.0.0')).toHaveLength(facts['fr.firstLabs'].value as number);
    expect(LABS.filter((x) => x.protocol === '2.0.0')).toHaveLength(facts['fr.newLabs'].value as number);
  });
});

describe('labCode / ghPath', () => {
  it('the lab code is the problem-card prefix of every card', () => {
    for (const lab of LABS) {
      expect(lab.cards).toHaveLength(10);
      for (const id of lab.cards) expect(id.startsWith(`${labCode(lab.id)}-`), id).toBe(true);
      expect(lab.first && lab.cards.includes(lab.first), lab.id).toBe(true);
    }
    expect(labCode(GOV.id)).toBe('GOV');
  });

  it('turns GitHub URLs into short mono paths', () => {
    expect(ghPath(links.pulls.phys4)).toBe('FrontierPhysics/pull/4');
    expect(ghPath(links.docs.govTool)).toBe('FrontierLab-Governance/tools/frontier.py');
    expect(ghPath('https://example.com/x')).toBe('https://example.com/x');
  });
});

describe('roundPos', () => {
  it('cuts the pin into 7 equal sub-ranges and ends on the last stage', () => {
    expect(roundPos(0)).toEqual({ active: 0, u: 0 });
    expect(roundPos(1)).toEqual({ active: 6, u: 6 });
    for (let i = 0; i < 7; i++) expect(roundPos((i + 0.5) / 7).active).toBe(i);
  });

  it('the glimmer is monotonic and reaches gate i exactly when stage i activates', () => {
    let prev = -1;
    for (let k = 0; k <= 1000; k++) {
      const { active, u } = roundPos(k / 1000);
      expect(u).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(u).toBeGreaterThanOrEqual(active);
      expect(u).toBeLessThanOrEqual(active + 1);
      prev = u;
    }
    for (let i = 1; i < 7; i++) {
      expect(roundPos(i / 7 - 1e-9).u).toBeCloseTo(i, 6);
      expect(roundPos(i / 7).active).toBe(i);
    }
  });
});

describe('lattice', () => {
  it('has one column per n = 2..76, only n = 75 empty, heights growing with n', () => {
    const g = lattice(2, 76, 75);
    expect(g.cols).toHaveLength(75);
    expect(g.cols.filter((c) => c.empty).map((c) => c.n)).toEqual([75]);
    for (let i = 1; i < g.cols.length; i++) {
      const a = g.cols[i - 1];
      const b = g.cols[i];
      expect(b && a && b.x - a.x).toBe(g.step);
      expect(b && a && b.y1 < a.y1).toBe(true);
    }
    const last = g.cols[g.cols.length - 1];
    expect(last && last.x + 6).toBe(g.w);
    expect(last && last.y1).toBeGreaterThanOrEqual(0);
  });
});

describe('tiles', () => {
  it('governance first, then 15 labs; status comes from data', () => {
    expect(TILES[0]).toBe(GOV);
    expect(TILES).toHaveLength(16);
    expect(labStatus(GOV)).toBeNull();
    const counts = { merged: 0, review: 0, none: 0 };
    for (const lab of LABS) {
      const s = labStatus(lab);
      if (s === 'merged' || s === 'review' || s === 'none') counts[s]++;
    }
    expect(counts).toEqual({ merged: 1, review: 3, none: facts['fr.labsNoRounds'].value });
  });

  it('stage names and stage parts agree in both locales', () => {
    for (const l of LOCALES) {
      const names = tList('fr.stage.names', l);
      expect(names).toHaveLength(7);
      names.forEach((name, i) => expect(tList(`fr.stage.${i + 1}` as never, l)[0]).toBe(name));
    }
  });
});
