// src/data/labs.ts — Frontier: the governance repo + 15 labs (spec §4.5), with the inputs of each
// tile's status chip. PR counts, CI and problem IDs were re-read from the GitHub API on 2026-09-30
// and match the research brief. No copy lives here: names/descriptions are dictionary keys.
import { facts, type FactKey } from './facts.ts';
import { REPO_BY_ID } from './repos.ts';

export type LabId =
  | 'gov' | 'math' | 'phys' | 'bio' | 'chem' | 'cs' | 'stat' | 'meta'
  | 'soc' | 'mat' | 'astro' | 'earth' | 'neuro' | 'econ' | 'eng' | 'med';

/** Status codes shared by <Status> (spec §2.4). */
export type StatusCode =
  | 'open' | 'review' | 'merged' | 'none' | 'fail' | 'withdrawn' | 'notclaimed' | 'paused' | 'active';

export interface Lab {
  id: LabId;
  kind: 'governance' | 'lab';
  nameKey: `repo.${LabId}.name`;
  descKey: `labs.${LabId}.desc`;
  commitsFact: FactKey;
  commits: number;
  prs: { total: number; open: number; merged: number };
  /** Research rounds merged to main. */
  roundsMerged: number;
  /** Research results sit in open (unmerged) PRs. */
  researchInReview: boolean;
  /** Governance protocol version the lab pins. */
  protocol: string;
  /** Latest CI run on main succeeded (2026-09-30). */
  ciGreen: boolean;
  /** The 10 problem-card IDs (IDs only; topics are never shown). Empty for governance. */
  cards: readonly string[];
  /** First-round problem (◆ in the matrix). */
  first: string | null;
  /** SOC: show only the first card and its method. */
  firstNote?: 'methods-only';
  /** Cards with status OPEN, when the research reports counted them; null = not counted. */
  openCards: number | null;
  report: 'frontierA' | 'frontierB';
}

const ids = (prefix: string): string[] =>
  Array.from({ length: 10 }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`);

function lab(
  id: LabId,
  o: Omit<Lab, 'id' | 'kind' | 'nameKey' | 'descKey' | 'commitsFact' | 'commits'> & { kind?: Lab['kind'] },
): Lab {
  const commitsFact = `commits.${id}` as FactKey;
  return {
    id,
    kind: o.kind ?? 'lab',
    nameKey: `repo.${id}.name`,
    descKey: `labs.${id}.desc`,
    commitsFact,
    commits: REPO_BY_ID[id].commits,
    ...o,
  };
}

const B = { roundsMerged: 0, researchInReview: false, protocol: '2.0.0', ciGreen: true, prs: { total: 2, open: 0, merged: 2 } } as const;

export const GOV: Lab = lab('gov', {
  kind: 'governance',
  prs: { total: 7, open: 2, merged: 5 },
  roundsMerged: 0,
  researchInReview: false,
  protocol: '2.0.0',
  ciGreen: true,
  cards: [],
  first: null,
  openCards: null,
  report: 'frontierA',
});

/** The 15 labs, in brief order (= matrix rows = hero lanes 5–19). */
export const LABS: readonly Lab[] = [
  lab('math', {
    prs: { total: 10, open: 6, merged: 2 },
    roundsMerged: 1,
    researchInReview: true,
    protocol: '1.0.0',
    ciGreen: true,
    cards: ids('MATH'),
    first: 'MATH-001',
    openCards: null,
    report: 'frontierA',
  }),
  lab('phys', {
    prs: { total: 6, open: 5, merged: 0 },
    roundsMerged: 0,
    researchInReview: true,
    protocol: '1.0.0',
    ciGreen: true,
    cards: ids('PHYS'),
    first: 'PHYS-001',
    openCards: null,
    report: 'frontierA',
  }),
  lab('bio', {
    prs: { total: 2, open: 2, merged: 0 },
    roundsMerged: 0,
    researchInReview: true,
    protocol: '1.0.0',
    ciGreen: true,
    cards: ids('BIO'),
    first: 'BIO-001',
    openCards: null,
    report: 'frontierA',
  }),
  lab('chem', {
    prs: { total: 2, open: 2, merged: 0 },
    roundsMerged: 0,
    researchInReview: true,
    protocol: '1.0.0',
    ciGreen: true,
    cards: ids('CHEM'),
    first: 'CHEM-004',
    openCards: null,
    report: 'frontierA',
  }),
  lab('cs', { ...B, cards: ids('CS'), first: 'CS-001', openCards: null, report: 'frontierA' }),
  lab('stat', { ...B, cards: ids('STAT'), first: 'STAT-001', openCards: null, report: 'frontierA' }),
  lab('meta', { ...B, cards: ids('META'), first: 'META-001', openCards: null, report: 'frontierA' }),
  lab('soc', { ...B, cards: ids('SOC'), first: 'SOC-008', firstNote: 'methods-only', openCards: 10, report: 'frontierB' }),
  lab('mat', { ...B, cards: ids('MAT'), first: 'MAT-003', openCards: 10, report: 'frontierB' }),
  lab('astro', { ...B, cards: ids('ASTRO'), first: 'ASTRO-003', openCards: 10, report: 'frontierB' }),
  lab('earth', { ...B, cards: ids('EARTH'), first: 'EARTH-003', openCards: 10, report: 'frontierB' }),
  lab('neuro', { ...B, cards: ids('NEURO'), first: 'NEURO-001', openCards: 10, report: 'frontierB' }),
  lab('econ', { ...B, cards: ids('ECON'), first: 'ECON-001', openCards: 10, report: 'frontierB' }),
  lab('eng', { ...B, cards: ids('ENG'), first: 'ENG-004', openCards: 10, report: 'frontierB' }),
  lab('med', { ...B, cards: ids('MED'), first: 'MED-001', openCards: 10, report: 'frontierB' }),
];

/** Governance first, then the labs (the 16 tiles of #fr-labs). */
export const TILES: readonly Lab[] = [GOV, ...LABS];

/**
 * The tile's status chip, computed from data (brief C1), never from a uniform string:
 * `merged` if a research round is merged, else `review` if research sits in open PRs, else `none`.
 * Governance has no research status (null).
 */
export function labStatus(l: Lab): StatusCode | null {
  if (l.kind === 'governance') return null;
  if (l.roundsMerged > 0) return 'merged';
  if (l.researchInReview) return 'review';
  return 'none';
}

// Sanity: 15 labs × 10 cards = 150; labs without rounds or review = fr.labsNoRounds.
const cardTotal = LABS.reduce((n, l) => n + l.cards.length, 0);
if (LABS.length !== facts['fr.labs'].value || cardTotal !== facts['fr.cards'].value) {
  throw new Error(`[labs] ${LABS.length} labs / ${cardTotal} cards disagree with facts.ts`);
}
if (LABS.filter((l) => labStatus(l) === 'none').length !== facts['fr.labsNoRounds'].value) {
  throw new Error('[labs] labs with no research rounds disagree with facts.ts fr.labsNoRounds');
}
