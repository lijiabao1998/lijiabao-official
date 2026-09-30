#!/usr/bin/env node
// scripts/pack-commits.mjs — src/data/snapshot.json → public/gl/commits.<hash>.bin + src/data/gl-manifest.json
// (spec §6.1; prebuild). Runs under plain `node` (Node strips the TypeScript types of the shared generators).
//
// Binary (read by src/gl/scenes/inspect.ts `decode`), little-endian:
//   header 16 B: 'LJC1' · u8 version 1 · u8 axis mode (0 time, 1 ordinal) · u8 lanes 19 · u8 rows 20 ·
//                u32 count · u32 snapshot date YYYYMMDD
//   9 B per commit: u8 lane · u32 minutes since 2026-07-12 00:00 +08:00 · u32 sha7 (28 bits);
//   sorted by lane (gen/lanes.ts order), then time. No subjects, no authors.
//
// Ordinal fallback (spec §6.1): if the snapshot is missing or malformed, every lane gets its facts.ts commit
// count with no dates and no shas (axis mode 1); the page then says so (hero.fig.ordinal) and never estimates
// a date. With a valid snapshot, every lane must match facts.ts exactly (else exit 1: the record and the copy
// would disagree).
//
// The manifest is shared with other scenes (S3 portrait, S4 grid): read-modify-write, only the `field` key is
// ours; keys are written sorted so concurrent generators merge cleanly. Old commits.*.bin files are removed.
//
// Usage: node scripts/pack-commits.mjs [--check]   (--check: verify only, write nothing)

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = resolve(ROOT, 'src/data/snapshot.json');
const MANIFEST = resolve(ROOT, 'src/data/gl-manifest.json');
const OUT_DIR = resolve(ROOT, 'public/gl');
const KEY = 'field';
const CHECK = process.argv.includes('--check');

const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);
const { LANES, ROWS, laneRecords, shaInt } = await imp('src/gl/gen/lanes.ts');
const { facts, SNAPSHOT } = await imp('src/data/facts.ts');
const { budgets } = await imp('src/data/budgets.ts');

const fail = (msg) => {
  console.error(`[pack-commits] ${msg}`);
  process.exit(1);
};

/* ---------------------------------------------------------------- read */

let snap = null;
try {
  snap = JSON.parse(readFileSync(SNAP, 'utf8'));
} catch {
  snap = null;
}

const counts = Object.fromEntries(LANES.map((l) => [l.id, facts[`commits.${l.id}`]?.value]));
for (const [id, n] of Object.entries(counts)) {
  if (!Number.isInteger(n) || n < 0) fail(`facts.ts has no commit count for "${id}"`);
}

const rec = laneRecords(snap, counts);
if (rec.mode === 'ordinal') {
  console.warn('[pack-commits] snapshot unavailable or malformed: writing the ORDINAL axis (no dates, no shas)');
} else {
  for (const l of rec.lanes) {
    if (l.minutes.length !== counts[l.id]) {
      fail(`${l.repo}: snapshot has ${l.minutes.length} commits, facts.ts says ${counts[l.id]}`);
    }
    const early = l.minutes.findIndex((m) => m < 0);
    if (early >= 0) fail(`${l.repo}: commit ${l.shas[early]} predates 2026-07-12 (the axis origin)`);
  }
}
const total = facts['commits.total'].value;
if (rec.count !== total) fail(`${rec.count} commits packed, facts.ts commits.total is ${total}`);

/* ---------------------------------------------------------------- encode */

const HEADER = 16;
const STRIDE = 9;
const buf = Buffer.alloc(HEADER + rec.count * STRIDE);
buf.write('LJC1', 0, 'ascii');
buf.writeUInt8(1, 4);
buf.writeUInt8(rec.mode === 'ordinal' ? 1 : 0, 5);
buf.writeUInt8(LANES.length, 6);
buf.writeUInt8(ROWS, 7);
buf.writeUInt32LE(rec.count, 8);
const asOf = rec.mode === 'time' ? String(snap?.asOf ?? SNAPSHOT.asOf) : SNAPSHOT.asOf;
buf.writeUInt32LE(Number(asOf.replaceAll('-', '')) || 0, 12);

let o = HEADER;
for (const l of rec.lanes) {
  for (let i = 0; i < l.minutes.length; i++, o += STRIDE) {
    buf.writeUInt8(l.lane, o);
    buf.writeUInt32LE(Math.max(0, l.minutes[i]) >>> 0, o + 1);
    buf.writeUInt32LE(shaInt(l.shas[i]) >>> 0, o + 5);
  }
}

const cap = budgets.bins.commits * 1024;
if (buf.length > cap) fail(`commits.bin is ${buf.length} B, over the ${cap} B budget`);

const hash = createHash('sha256').update(buf).digest('hex').slice(0, 10);
const file = `commits.${hash}.bin`;
const url = `/gl/${file}`;

/* ---------------------------------------------------------------- write */

let manifest = {};
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) ?? {};
} catch {
  manifest = {};
}
const entry = { url, bytes: buf.length, count: rec.count, mode: rec.mode, asOf };
const sameEntry = JSON.stringify(manifest[KEY]) === JSON.stringify(entry);
const binPath = resolve(OUT_DIR, file);

if (CHECK) {
  if (!sameEntry || !existsSync(binPath)) fail(`gl-manifest.json "${KEY}" or ${file} is stale: run without --check`);
  console.log(`[pack-commits] ok: ${rec.count} commits (${rec.mode}), ${file} ${buf.length} B`);
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const f of readdirSync(OUT_DIR)) {
  if (/^commits\.[0-9a-f]+\.bin$/.test(f) && f !== file) unlinkSync(resolve(OUT_DIR, f));
}
if (!existsSync(binPath) || !readFileSync(binPath).equals(buf)) writeFileSync(binPath, buf);

manifest[KEY] = entry;
const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
const text = `${JSON.stringify(sorted, null, 2)}\n`;
if (!existsSync(MANIFEST) || readFileSync(MANIFEST, 'utf8') !== text) writeFileSync(MANIFEST, text);

console.log(`[pack-commits] ${rec.count} commits on ${LANES.length} lanes (${rec.mode} axis) → public/gl/${file} (${buf.length} B)`);
