#!/usr/bin/env node
// scripts/snapshot.mjs — read-only commit snapshot of the 19 public lijiabao1998 repos.
//
// Pulls EVERY commit on each repo's default branch through the authenticated `gh` CLI
// (`gh api --paginate`, GET only) and writes src/data/snapshot.json:
//
//   { asOf: "YYYY-MM-DD" (Asia/Taipei), generatedAt: ISO, tz: "Asia/Taipei", owner, total,
//     counts: {[id]: n}, branches: {[id]: name},
//     repos: {[id]: [[isoCommitterDate, sha7], …]} }   ← oldest first
//
// Only the short sha and the committer date are kept. No subjects and no authors: both could
// leak vendor names or unvetted text (spec §6.1). Run by hand; the output is committed.
// It never writes anything to GitHub. If `gh` fails, the existing snapshot is left untouched.
// Usage: node scripts/snapshot.mjs [--dry]   (--dry: pull and report drift vs facts.ts, write nothing)

import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/snapshot.json');
const OWNER = 'lijiabao1998';
const DRY = process.argv.includes('--dry');

/** Lane order (spec §6.1 / §9.6): 3 GlimmerTown lanes, Governance, then the 15 labs in brief order. */
export const REPOS = [
  ['gt', 'GlimmerTown'],
  ['gtlab', 'GlimmerTown-lab'],
  ['gt3d', 'GlimmerTown3D-lab'],
  ['gov', 'FrontierLab-Governance'],
  ['math', 'FrontierMath'],
  ['phys', 'FrontierPhysics'],
  ['bio', 'FrontierBiology'],
  ['chem', 'FrontierChemistry'],
  ['cs', 'FrontierComputerScience'],
  ['stat', 'FrontierStatistics'],
  ['meta', 'FrontierMetaScience'],
  ['soc', 'FrontierSocialScience'],
  ['mat', 'FrontierMaterials'],
  ['astro', 'FrontierAstronomy'],
  ['earth', 'FrontierEarth'],
  ['neuro', 'FrontierNeuroscience'],
  ['econ', 'FrontierEconomics'],
  ['eng', 'FrontierEngineering'],
  ['med', 'FrontierMedicine'],
];

function gh(args) {
  return execFileSync('gh', ['api', ...args], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

/** YYYY-MM-DD of an instant in Asia/Taipei. */
function taipeiDate(d) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function main() {
  const generatedAt = new Date();
  const repos = {};
  const counts = {};
  const branches = {};
  let total = 0;

  for (const [id, name] of REPOS) {
    const branch = gh([`repos/${OWNER}/${name}`, '--jq', '.default_branch']).trim();
    if (!branch) throw new Error(`no default branch for ${name}`);
    // --paginate follows every Link: rel="next"; --jq prints one TSV line per commit.
    const raw = gh([
      '--paginate',
      `repos/${OWNER}/${name}/commits?sha=${encodeURIComponent(branch)}&per_page=100`,
      '--jq',
      '.[] | [.sha, .commit.committer.date] | @tsv',
    ]);
    const seen = new Set();
    const rows = [];
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const [sha, date] = line.split('\t');
      if (!/^[0-9a-f]{40}$/.test(sha) || !date) throw new Error(`bad row in ${name}: ${line}`);
      if (seen.has(sha)) continue;
      seen.add(sha);
      const iso = new Date(date).toISOString().replace('.000Z', 'Z');
      rows.push([iso, sha.slice(0, 7)]);
    }
    // API order is newest first; reverse, then stable-sort by committer time (oldest first).
    rows.reverse();
    rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    repos[id] = rows;
    counts[id] = rows.length;
    branches[id] = branch;
    total += rows.length;
    process.stdout.write(`${name.padEnd(26)} ${branch.padEnd(6)} ${String(rows.length).padStart(5)}  ${rows[0]?.[0] ?? '-'} → ${rows.at(-1)?.[0] ?? '-'}\n`);
  }

  const snapshot = {
    asOf: taipeiDate(generatedAt),
    generatedAt: generatedAt.toISOString(),
    tz: 'Asia/Taipei',
    owner: OWNER,
    source: 'GitHub REST API via `gh api --paginate repos/{owner}/{repo}/commits?sha={default_branch}` (read-only)',
    total,
    counts,
    branches,
    repos,
  };

  const json = JSON.stringify(snapshot, null, 0)
    // one commit per line keeps diffs readable without bloating the file much
    .replace(/\],\[/g, '],\n[');
  if (DRY) {
    process.stdout.write(`\nTOTAL ${total} · asOf ${snapshot.asOf} · --dry: snapshot.json not written\n`);
  } else {
    writeFileSync(OUT, json + '\n', 'utf8');
    process.stdout.write(`\nTOTAL ${total} · asOf ${snapshot.asOf} · generatedAt ${snapshot.generatedAt}\n→ ${OUT}\n`);
  }

  // Drift report against src/data/facts.ts (which must be updated by hand, with every copy string
  // that cites a changed count, T/D card number or version).
  const factsPath = resolve(ROOT, 'src/data/facts.ts');
  if (existsSync(factsPath)) {
    const src = readFileSync(factsPath, 'utf8');
    const byRepo = Object.fromEntries([...src.matchAll(/commits\('([^']+)',\s*(\d+)\)/g)].map((m) => [m[1], Number(m[2])]));
    const totalM = src.match(/'commits\.total':\s*\{\s*value:\s*(\d+)/);
    const drift = [];
    for (const [id, name] of REPOS) if (byRepo[name] !== counts[id]) drift.push(`${name}: facts ${byRepo[name]} → snapshot ${counts[id]}`);
    if (totalM && Number(totalM[1]) !== total) drift.push(`TOTAL: facts ${totalM[1]} → snapshot ${total}`);
    process.stdout.write(drift.length ? `\nfacts.ts is out of date:\n  ${drift.join('\n  ')}\n` : '\nfacts.ts matches the snapshot.\n');
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`snapshot failed (existing snapshot.json left untouched): ${err?.stderr || err?.message || err}\n`);
  process.exit(1);
}
