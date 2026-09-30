// src/data/repos.ts — the 19 public repos (spec §9.6), in lane order: 3 GlimmerTown lanes,
// Governance, then the 15 labs in brief order. Commit counts come from facts.ts (the snapshot).
// Names are dictionary keys (`repo.<id>.name`); no copy lives here. Never iframe or embed a demo.
import { facts, type FactKey, type RepoName } from './facts.ts';
import { repoUrl } from './links.ts';

export type RepoId =
  | 'gt' | 'gtlab' | 'gt3d' | 'gov'
  | 'math' | 'phys' | 'bio' | 'chem' | 'cs' | 'stat' | 'meta'
  | 'soc' | 'mat' | 'astro' | 'earth' | 'neuro' | 'econ' | 'eng' | 'med';

export interface Demo {
  url: string;
  /** Last HEAD status seen. */
  status: 200;
  /** Weight of the page / single file, as a facts.ts key (formatted MB). */
  weight?: FactKey;
  /** The full GET timed out in research: link it with its weight, never embed it. */
  heavy?: boolean;
}

export interface Repo {
  id: RepoId;
  repo: RepoName;
  group: 'gt' | 'fr';
  /** Lane label in the hero figure (the repo name, mono). */
  lane: string;
  /** Dictionary key of the localized name. */
  nameKey: `repo.${RepoId}.name`;
  /** facts.ts key of the default-branch commit count. */
  commitsFact: FactKey;
  /** Default-branch commits in the snapshot. */
  commits: number;
  defaultBranch: 'main';
  url: string;
  /** Live demos. Empty = none (Pages returns 404). */
  demos: readonly Demo[];
}

function repo(id: RepoId, name: RepoName, group: Repo['group'], demos: readonly Demo[] = []): Repo {
  const commitsFact = `commits.${id}` as FactKey;
  const value = facts[commitsFact].value;
  if (typeof value !== 'number') throw new Error(`[repos] ${commitsFact} is not a number`);
  return {
    id,
    repo: name,
    group,
    lane: name,
    nameKey: `repo.${id}.name`,
    commitsFact,
    commits: value,
    defaultBranch: 'main',
    url: repoUrl(name),
    demos,
  };
}

export const REPOS: readonly Repo[] = [
  repo('gt', 'GlimmerTown', 'gt'),
  repo('gtlab', 'GlimmerTown-lab', 'gt', [
    { url: 'https://lijiabao1998.github.io/GlimmerTown-lab/', status: 200, weight: 'gtlab.demoMb', heavy: true },
    { url: 'https://lijiabao1998.github.io/GlimmerTown-lab/shots/', status: 200 },
  ]),
  repo('gt3d', 'GlimmerTown3D-lab', 'gt', [
    { url: 'https://lijiabao1998.github.io/GlimmerTown3D-lab/', status: 200, weight: 'gt3d.demoMb' },
  ]),
  repo('gov', 'FrontierLab-Governance', 'fr'),
  repo('math', 'FrontierMath', 'fr'),
  repo('phys', 'FrontierPhysics', 'fr'),
  repo('bio', 'FrontierBiology', 'fr'),
  repo('chem', 'FrontierChemistry', 'fr'),
  repo('cs', 'FrontierComputerScience', 'fr'),
  repo('stat', 'FrontierStatistics', 'fr'),
  repo('meta', 'FrontierMetaScience', 'fr'),
  repo('soc', 'FrontierSocialScience', 'fr'),
  repo('mat', 'FrontierMaterials', 'fr'),
  repo('astro', 'FrontierAstronomy', 'fr'),
  repo('earth', 'FrontierEarth', 'fr'),
  repo('neuro', 'FrontierNeuroscience', 'fr'),
  repo('econ', 'FrontierEconomics', 'fr'),
  repo('eng', 'FrontierEngineering', 'fr'),
  repo('med', 'FrontierMedicine', 'fr'),
];

export const REPO_BY_ID: Readonly<Record<RepoId, Repo>> = Object.fromEntries(REPOS.map((r) => [r.id, r])) as Record<RepoId, Repo>;

/** Sum of default-branch commits over the 19 repos (must equal facts['commits.total']). */
export const COMMITS_TOTAL = REPOS.reduce((n, r) => n + r.commits, 0);

if (COMMITS_TOTAL !== facts['commits.total'].value) {
  throw new Error(`[repos] per-repo commits sum to ${COMMITS_TOTAL}, facts says ${facts['commits.total'].value}`);
}
if (REPOS.length !== facts['repos.count'].value) {
  throw new Error(`[repos] ${REPOS.length} repos, facts says ${facts['repos.count'].value}`);
}
