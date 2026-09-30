// src/data/links.ts — every outbound URL the site uses. GitHub is the only social link
// (build-overrides §1: X is not approved, so no X URL exists here). Demos are linked, never embedded.
import type { RepoName } from './facts.ts';

export const SITE_URL = 'https://lijiabao.dev';
export const GITHUB_USER = 'lijiabao1998';
export const GITHUB_PROFILE = `https://github.com/${GITHUB_USER}`;

export const repoUrl = (repo: RepoName): string => `${GITHUB_PROFILE}/${repo}`;
export const commitUrl = (repo: RepoName, sha: string): string => `${GITHUB_PROFILE}/${repo}/commit/${sha}`;
export const fileUrl = (repo: RepoName, path: string, ref = 'main'): string => `${GITHUB_PROFILE}/${repo}/blob/${ref}/${path}`;
export const pullUrl = (repo: RepoName, n: number): string => `${GITHUB_PROFILE}/${repo}/pull/${n}`;

export const links = {
  github: GITHUB_PROFILE,
  demos: {
    gt3d: 'https://lijiabao1998.github.io/GlimmerTown3D-lab/',
    gtlab: 'https://lijiabao1998.github.io/GlimmerTown-lab/',
    gtlabShots: 'https://lijiabao1998.github.io/GlimmerTown-lab/shots/',
  },
  /** Citations used by the copy (`*.cite`, evidence lines, num sources). */
  docs: {
    d000Vision: fileUrl('GlimmerTown3D-lab', 'docs/D000-vision.md'),
    d011: fileUrl('GlimmerTown3D-lab', 'docs/D011-build-mvp.md'),
    d015: fileUrl('GlimmerTown3D-lab', 'docs/D015-incremental-rebuild.md'),
    d024: fileUrl('GlimmerTown3D-lab', 'docs/D024-counting.md'),
    labAutorun: fileUrl('GlimmerTown-lab', 'AUTORUN.md'),
    labAgents: fileUrl('GlimmerTown-lab', 'AGENTS.md'),
    gtReadme: fileUrl('GlimmerTown', 'README.md'),
    gtTests: fileUrl('GlimmerTown', 'test_fixde.js'),
    gtSurpass: fileUrl('GlimmerTown', 'docs/SURPASS.md'),
    gtChangelog: fileUrl('GlimmerTown', 'docs/CHANGELOG.md'),
    gtArch: fileUrl('GlimmerTown', 'docs/ARCH.md'),
    gtLineage: fileUrl('GlimmerTown', 'docs/LINEAGE.md'),
    govReadme: fileUrl('FrontierLab-Governance', 'README.md'),
    govStatus: fileUrl('FrontierLab-Governance', 'STATUS.md'),
    govAgents: fileUrl('FrontierLab-Governance', 'AGENTS.md'),
    govTool: fileUrl('FrontierLab-Governance', 'tools/frontier.py'),
    govBranchProtection: fileUrl('FrontierLab-Governance', 'BRANCH_PROTECTION_PROPOSAL.md'),
    govExpansion: fileUrl('FrontierLab-Governance', 'EXPANSION-2026-09-28.md'),
    csReadme: fileUrl('FrontierComputerScience', 'README.md'),
    mathStatus: fileUrl('FrontierMath', 'STATUS.md'),
    mathCanonical: fileUrl('FrontierMath', 'problems/MATH-001/experiments/canonical_evidence/CANONICAL_FACTS.md'),
    mathSuperseded: fileUrl('FrontierMath', 'problems/MATH-001/experiments/canonical_evidence/SUPERSEDED_CLAIMS.md'),
  },
  pulls: {
    phys4: pullUrl('FrontierPhysics', 4),
    bio2: pullUrl('FrontierBiology', 2),
    chem1: pullUrl('FrontierChemistry', 1),
    chem2: pullUrl('FrontierChemistry', 2),
  },
} as const;
