// src/data/facts.ts — every number the copy uses, with its source and date (site law 4).
//
// Dictionary strings never hard-code these numbers: they write `{fact.key}` and `t()` formats the
// value with Intl.NumberFormat for the page locale. `<Num k="gt.pass">` reads the same records.
//
// Commit counts come from src/data/snapshot.json (scripts/snapshot.mjs, GitHub REST API, read-only,
// pulled 2026-09-30T13:44:28Z). The snapshot wins over the research brief for commit counts; see
// SNAPSHOT_DIFF below for what changed. Everything else is from the research brief (2026-09-30) or
// was re-read from the public repos on 2026-09-30 (marked `verified`).
//
// Plain data only: no copy. Node-safe (runs under `node` with native type stripping).

export type RepoName =
  | 'GlimmerTown' | 'GlimmerTown-lab' | 'GlimmerTown3D-lab'
  | 'FrontierLab-Governance' | 'FrontierMath' | 'FrontierPhysics' | 'FrontierBiology'
  | 'FrontierChemistry' | 'FrontierComputerScience' | 'FrontierStatistics' | 'FrontierMetaScience'
  | 'FrontierSocialScience' | 'FrontierMaterials' | 'FrontierAstronomy' | 'FrontierEarth'
  | 'FrontierNeuroscience' | 'FrontierEconomics' | 'FrontierEngineering' | 'FrontierMedicine';

export interface Source {
  /** A repo name, `github-api` (the snapshot / REST API), `pages` (a live demo HEAD), or `site` (this site's own build). */
  repo: RepoName | 'github-api' | 'pages' | 'site';
  /** File, directory, PR, tag or endpoint inside that source. */
  path?: string;
  /** Research report the brief summarises (class R), e.g. 'glimmer'. */
  report?: 'glimmer' | 'frontierA' | 'frontierB' | 'voice' | 'stack' | 'spec';
}

export interface Fact {
  value: number | string;
  source: Source;
  /** YYYY-MM-DD (Asia/Taipei) the value is true as of. */
  asOf: string;
  /** ISO timestamp of the read, when the value came from a live pull. */
  at?: string;
  /** Fixed fraction digits for display (e.g. 8.70 MB → 2). Integers need none. */
  digits?: number;
  /** Re-read from the public repo / demo on 2026-09-30 (not only from the brief). */
  verified?: boolean;
  /** Short provenance note (not rendered). */
  note?: string;
}

/** The commit snapshot (src/data/snapshot.json) this build is pinned to. */
export const SNAPSHOT = {
  asOf: '2026-09-30',
  generatedAt: '2026-09-30T13:44:28.178Z',
  tz: 'Asia/Taipei',
} as const;

const BRIEF = '2026-09-30';
const SNAP = { asOf: SNAPSHOT.asOf, at: SNAPSHOT.generatedAt } as const;
const api = (path: string): Source => ({ repo: 'github-api', path });
const commits = (repo: RepoName, value: number): Fact => ({
  value,
  source: api(`repos/lijiabao1998/${repo}/commits?sha=main`),
  ...SNAP,
});

const FACTS = {
  // ── snapshot / GitHub API ────────────────────────────────────────────────────────────────
  'snapshot.asOf': { value: SNAPSHOT.asOf, source: { repo: 'github-api', path: 'src/data/snapshot.json' }, ...SNAP },
  'repos.count': { value: 19, source: api('users/lijiabao1998/repos'), ...SNAP, verified: true },
  'commits.total': {
    value: 1946,
    source: api('repos/lijiabao1998/{19 repos}/commits?sha=main'),
    ...SNAP,
    note: 'Sum of all 19 default branches. The brief said 1,938 (GlimmerTown-lab +5, GlimmerTown3D-lab +3 since).',
  },
  'commits.gt': commits('GlimmerTown', 1392),
  'commits.gtlab': commits('GlimmerTown-lab', 292),
  'commits.gt3d': commits('GlimmerTown3D-lab', 141),
  'commits.gov': commits('FrontierLab-Governance', 30),
  'commits.math': commits('FrontierMath', 8),
  'commits.phys': commits('FrontierPhysics', 2),
  'commits.bio': commits('FrontierBiology', 2),
  'commits.chem': commits('FrontierChemistry', 2),
  'commits.cs': commits('FrontierComputerScience', 7),
  'commits.stat': commits('FrontierStatistics', 7),
  'commits.meta': commits('FrontierMetaScience', 7),
  'commits.soc': commits('FrontierSocialScience', 7),
  'commits.mat': commits('FrontierMaterials', 7),
  'commits.astro': commits('FrontierAstronomy', 7),
  'commits.earth': commits('FrontierEarth', 7),
  'commits.neuro': commits('FrontierNeuroscience', 7),
  'commits.econ': commits('FrontierEconomics', 7),
  'commits.eng': commits('FrontierEngineering', 7),
  'commits.med': commits('FrontierMedicine', 7),

  // ── GlimmerTown (main line) ──────────────────────────────────────────────────────────────
  'gt.pass': { value: 12513, source: { repo: 'GlimmerTown', path: 'test_fixde.js', report: 'glimmer' }, asOf: BRIEF },
  'gt.codeLines': { value: 50578, source: { repo: 'GlimmerTown', path: 'index.html', report: 'glimmer' }, asOf: BRIEF },
  'gt.sizeMb': { value: 4.4, digits: 1, source: { repo: 'GlimmerTown', path: 'index.html', report: 'glimmer' }, asOf: BRIEF },
  'gt.cards': { value: 453, source: { repo: 'GlimmerTown', path: 'docs/tasks/', report: 'glimmer' }, asOf: BRIEF },
  'gt.changelog': { value: 637, source: { repo: 'GlimmerTown', path: 'docs/CHANGELOG.md', report: 'glimmer' }, asOf: BRIEF },
  'gt.surpass': { value: 17, source: { repo: 'GlimmerTown', path: 'docs/SURPASS.md', report: 'glimmer' }, asOf: BRIEF },
  'gt.forkAssertions': {
    value: 4307,
    source: { repo: 'GlimmerTown', path: 'tag fork/mobile-T420', report: 'glimmer' },
    asOf: BRIEF,
  },

  // ── GlimmerTown-lab ──────────────────────────────────────────────────────────────────────
  'gtlab.guards': {
    value: 94,
    source: { repo: 'GlimmerTown-lab', path: 'probe*.js (main @ 597e05b)' },
    asOf: BRIEF,
    at: '2026-09-30T13:50:00Z',
    verified: true,
    note: 'Brief: 92 at T699 (e6d020a, re-counted: 92). T700 and T701 added probe700.js and probe701.js.',
  },
  'gtlab.prs': { value: 6, source: api('repos/lijiabao1998/GlimmerTown-lab/pulls?state=all'), asOf: BRIEF, verified: true },
  'gtlab.demoMb': {
    value: 8.7,
    digits: 2,
    source: { repo: 'pages', path: 'https://lijiabao1998.github.io/GlimmerTown-lab/ (HEAD Content-Length 8,702,191 B)' },
    asOf: BRIEF,
    at: '2026-09-30T13:50:00Z',
    verified: true,
    note: 'Brief: 8.37 MB (8,370,067 B) before T700/T701. Same file as GlimmerTown-lab/index.html on main.',
  },
  'gtlab.shots': { value: 8, source: { repo: 'pages', path: 'https://lijiabao1998.github.io/GlimmerTown-lab/shots/', report: 'glimmer' }, asOf: BRIEF },
  'gtlab.writers': { value: 7, source: { repo: 'GlimmerTown-lab', path: 'AGENTS.md', report: 'glimmer' }, asOf: BRIEF },
  'gtlab.pushMain': { value: 2, source: { repo: 'GlimmerTown-lab', path: 'AGENTS.md', report: 'glimmer' }, asOf: BRIEF },
  'gtlab.branchPr': { value: 5, source: { repo: 'GlimmerTown-lab', path: 'AGENTS.md', report: 'glimmer' }, asOf: BRIEF },
  'gtlab.compareMin': { value: 2, source: { repo: 'GlimmerTown-lab', path: 'AGENTS.md', report: 'glimmer' }, asOf: BRIEF },
  'gtlab.compareMax': { value: 3, source: { repo: 'GlimmerTown-lab', path: 'AGENTS.md', report: 'glimmer' }, asOf: BRIEF },

  // ── GlimmerTown3D-lab ────────────────────────────────────────────────────────────────────
  'gt3d.demoMb': {
    value: 1.06,
    digits: 2,
    source: { repo: 'pages', path: 'https://lijiabao1998.github.io/GlimmerTown3D-lab/ (HEAD Content-Length 1,064,451 B)' },
    asOf: BRIEF,
    at: '2026-09-30T13:50:00Z',
    verified: true,
  },
  'gt3d.parityMaps': { value: 256, source: { repo: 'GlimmerTown3D-lab', path: 'docs/D011-build-mvp.md', report: 'glimmer' }, asOf: BRIEF },
  'gt3d.parityOps': { value: 9659, source: { repo: 'GlimmerTown3D-lab', path: 'docs/D011-build-mvp.md', report: 'glimmer' }, asOf: BRIEF },
  'gt3d.parity2Maps': { value: 1400, source: { repo: 'GlimmerTown3D-lab', path: 'docs/D024-counting.md', report: 'glimmer' }, asOf: BRIEF },
  'gt3d.parity2Counts': { value: 155, source: { repo: 'GlimmerTown3D-lab', path: 'docs/D024-counting.md', report: 'glimmer' }, asOf: BRIEF },
  'gt3d.gpuBeforeMb': { value: 2.3, digits: 1, source: { repo: 'GlimmerTown3D-lab', path: 'docs/D015-incremental-rebuild.md', report: 'glimmer' }, asOf: BRIEF },
  'gt3d.gpuAfterKb': { value: 190, source: { repo: 'GlimmerTown3D-lab', path: 'docs/D015-incremental-rebuild.md', report: 'glimmer' }, asOf: BRIEF },

  // ── Frontier program ─────────────────────────────────────────────────────────────────────
  'fr.govRepos': { value: 1, source: { repo: 'FrontierLab-Governance', path: 'README.md', report: 'frontierB' }, asOf: BRIEF },
  'fr.labs': { value: 15, source: { repo: 'FrontierLab-Governance', path: 'README.md', report: 'frontierB' }, asOf: BRIEF },
  'fr.repos': { value: 16, source: api('users/lijiabao1998/repos'), asOf: BRIEF, verified: true },
  'fr.cards': { value: 150, source: { repo: 'FrontierLab-Governance', path: 'STATUS.md', report: 'frontierA' }, asOf: BRIEF, verified: true },
  'fr.cardsPerLab': { value: 10, source: { repo: 'FrontierLab-Governance', path: 'STATUS.md', report: 'frontierA' }, asOf: BRIEF, verified: true },
  'fr.budgetUsd': { value: 0, source: { repo: 'FrontierLab-Governance', path: 'README.md', report: 'frontierA' }, asOf: BRIEF },
  'fr.budgetMinutes': { value: 30, source: { repo: 'FrontierLab-Governance', path: 'README.md', report: 'frontierA' }, asOf: BRIEF },
  'fr.budgetTries': { value: 100, source: { repo: 'FrontierLab-Governance', path: 'README.md', report: 'frontierA' }, asOf: BRIEF },
  'fr.searchHours': { value: 24, source: { repo: 'FrontierLab-Governance', path: 'tools/frontier.py (admit)', report: 'frontierA' }, asOf: BRIEF },
  'fr.newLabs': { value: 11, source: { repo: 'FrontierLab-Governance', path: 'EXPANSION-2026-09-28.md', report: 'frontierB' }, asOf: BRIEF },
  'fr.firstLabs': { value: 4, source: { repo: 'FrontierLab-Governance', path: 'STATUS.md', report: 'frontierA' }, asOf: BRIEF },
  'fr.labsNoRounds': {
    value: 11,
    source: { repo: 'FrontierLab-Governance', path: 'STATUS.md', report: 'frontierB' },
    asOf: BRIEF,
    note: 'CS, Statistics, MetaScience + the 8 labs in [frontierB]: no research rounds and no research PRs.',
  },
  'gov.lines': { value: 796, source: { repo: 'FrontierLab-Governance', path: 'tools/frontier.py', report: 'frontierA' }, asOf: BRIEF },
  'gov.tests': { value: 168, source: { repo: 'FrontierLab-Governance', path: 'tests/', report: 'frontierA' }, asOf: BRIEF },
  'gov.mutationKilled': { value: 29, source: { repo: 'FrontierLab-Governance', path: 'STATUS.md', report: 'frontierA' }, asOf: BRIEF },
  'gov.mutationTotal': { value: 29, source: { repo: 'FrontierLab-Governance', path: 'STATUS.md', report: 'frontierA' }, asOf: BRIEF },
  'gov.prs': { value: 7, source: api('repos/lijiabao1998/FrontierLab-Governance/pulls?state=all'), asOf: BRIEF, verified: true },
  'gov.prsOpen': { value: 2, source: api('repos/lijiabao1998/FrontierLab-Governance/pulls?state=open'), asOf: BRIEF, verified: true },
  'math.configs': {
    value: 431008,
    source: { repo: 'FrontierMath', path: 'problems/MATH-001/experiments/canonical_evidence/CANONICAL_FACTS.md', report: 'frontierA' },
    asOf: BRIEF,
  },
  'math.adversarial': {
    value: 429,
    source: { repo: 'FrontierMath', path: 'problems/MATH-001/experiments/canonical_evidence/evidence/adversarial_summary.json', report: 'frontierA' },
    asOf: BRIEF,
  },
  'math.roundsMerged': { value: 1, source: { repo: 'FrontierMath', path: 'problems/MATH-001/', report: 'frontierA' }, asOf: BRIEF },
  'math.statusRounds': { value: 0, source: { repo: 'FrontierMath', path: 'STATUS.md', report: 'frontierA' }, asOf: BRIEF },
  'phys.gap': { value: '1.1e-14', source: { repo: 'FrontierPhysics', path: 'PR #4', report: 'frontierA' }, asOf: BRIEF },
  'bio.overlaps': { value: 3929, source: { repo: 'FrontierBiology', path: 'PR #2', report: 'frontierA' }, asOf: BRIEF },
  'bio.donorSplit': { value: 0.1616, digits: 4, source: { repo: 'FrontierBiology', path: 'PR #2', report: 'frontierA' }, asOf: BRIEF },
  'chem.gaffAnchor': { value: 1.114, digits: 3, source: { repo: 'FrontierChemistry', path: 'PR #1', report: 'frontierA' }, asOf: BRIEF },

  // ── this site ────────────────────────────────────────────────────────────────────────────
  'portrait.full': { value: 12288, source: { repo: 'site', path: 'scripts/sample-portrait.mjs', report: 'spec' }, asOf: BRIEF },
  'portrait.lite': { value: 4096, source: { repo: 'site', path: 'scripts/sample-portrait.mjs', report: 'spec' }, asOf: BRIEF },
} satisfies Record<string, Fact>;

export type FactKey = keyof typeof FACTS;

/** Every fact, keyed by name (`{gt.pass}` in copy, `<Num k="gt.pass">`). */
export const facts: Readonly<Record<FactKey, Fact>> = FACTS;

export function fact(key: FactKey): Fact {
  return facts[key];
}

export function isFactKey(key: string): key is FactKey {
  return Object.prototype.hasOwnProperty.call(facts, key);
}

/** Order and facts of the six #numbers odometers (copy: `num.1` … `num.6`). */
export const NUMBERS = [
  { copy: 'num.1', fact: 'commits.total' },
  { copy: 'num.2', fact: 'gt.pass' },
  { copy: 'num.3', fact: 'gt3d.parityOps' },
  { copy: 'num.4', fact: 'math.configs' },
  { copy: 'num.5', fact: 'fr.cards' },
  { copy: 'num.6', fact: 'fr.budgetUsd' },
] as const satisfies readonly { copy: string; fact: FactKey }[];

/** What the live snapshot changed relative to the research brief (listed for the owner report). */
export const SNAPSHOT_DIFF = [
  { fact: 'commits.total', brief: 1938, snapshot: 1946 },
  { fact: 'commits.gtlab', brief: 287, snapshot: 292 },
  { fact: 'commits.gt3d', brief: 138, snapshot: 141 },
] as const satisfies readonly { fact: FactKey; brief: number; snapshot: number }[];

/**
 * Registered literals: digit-bearing tokens that may appear verbatim in dictionary values
 * (dates, versions, card/PR/problem IDs, file and repo names, fixed notation). `check-copy`
 * removes `{placeholders}` and these tokens; any digit left over is an unregistered number.
 * Longest tokens are matched first.
 */
export const literals: readonly string[] = [
  // dates (Asia/Taipei)
  '2026-07-12', '2026-08-08', '2026-09-13', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-27',
  '2026-09-29', '2026-09-30', '2026-__-__', '© 2026',
  // versions and protocol
  'v11.210', 'v11.46', 'v12.87', 'v14.05', 'v4.34.1', 'v1.0', 'Lean 4',
  '1.0.0', '1.1.0', '1.2.0', '2.0.0',
  // task / design card IDs (GlimmerTown lines)
  'T420', 'T531', 'T532', 'T601', 'T701', 'D000', 'D011', 'D024', 'D030',
  // Frontier IDs
  'MATH-001', 'PHYS-001', 'BIO-001', 'CHEM-004', 'CS-001', 'STAT-001', 'META-001', 'SOC-008',
  'MAT-003', 'ASTRO-003', 'EARTH-003', 'NEURO-001', 'ECON-001', 'ENG-004', 'MED-001',
  'PR #1', 'PR #2', 'PR #4', 'E3', 'C4', 'C5',
  // file and repo names
  'GlimmerTown3D-lab', 'D000-vision.md', 'lijiabao1998',
  // notation
  'n = 2..76', 'n = 71–74', 'n = 75', ' 76', 'D(75) = 150', '2 到 76', '2 to 76',
  '1 ●＝1', '1 ● = 1', '1 ●＝', '1 ● = ', '1 ◆＝1', '1 ◆ = 1', '1 ○＝1', '1 ○ = 1',
  '2D', '3D', 'WebGL2', 'Noto Sans TC', '404',
];
