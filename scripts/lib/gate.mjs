// scripts/lib/gate.mjs — shared plumbing for the S6 gates (check-dict, check-copy, check-dist, headers, og):
// repo paths, TypeScript imports (Node strips types natively), a failure collector, file walking and byte sizes.
// Node-only, no dependencies.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** The built site; `--dist=<dir>` points a gate at another copy (e.g. a deliberately broken one, to test the gate). */
const distArg = process.argv.find((a) => a.startsWith('--dist='));
export const DIST = distArg ? resolve(distArg.slice('--dist='.length)) : join(ROOT, 'dist');

/** Import a repo file (TypeScript included: Node ≥ 22.18 strips the types). */
export const imp = (p) => import(pathToFileURL(resolve(ROOT, p)).href);

/** Repo-relative path with forward slashes (for messages). */
export const rel = (p) => relative(ROOT, p).split(sep).join('/');

/** Every file under `dir` (recursive), absolute paths, sorted for stable output. */
export function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) out.push(p);
    }
  }
  return out.sort();
}

export const size = (p) => statSync(p).size;

/** File bytes (a Buffer). */
export const bytes = (p) => readFileSync(p);

/** gzip -9 size in bytes (budgets.ts sizes are gzipped unless marked raw). */
export const gz = (buf) => gzipSync(buf, { level: 9 }).length;

/** Bytes → "12.3 KB" (1 KB = 1024 B, as budgets.ts). */
export const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/**
 * A named gate: collects failures and warnings, prints one report, sets the exit code.
 * `fail` makes the gate exit 1; `warn` is printed but never fails the build.
 */
export function gate(name) {
  const fails = [];
  const warns = [];
  const infos = [];
  return {
    fail: (msg) => fails.push(msg),
    warn: (msg) => warns.push(msg),
    info: (msg) => infos.push(msg),
    get failed() {
      return fails.length > 0;
    },
    /** Print everything; exit 1 on any failure. */
    done(summary = '') {
      for (const m of infos) process.stdout.write(`  ${m}\n`);
      for (const m of warns) process.stdout.write(`  warn  ${m}\n`);
      for (const m of fails) process.stderr.write(`  FAIL  ${m}\n`);
      const tail = summary ? ` · ${summary}` : '';
      if (fails.length) {
        process.stderr.write(`${name}: ${fails.length} failure(s)${warns.length ? `, ${warns.length} warning(s)` : ''}${tail}\n`);
        process.exitCode = 1;
      } else {
        process.stdout.write(`${name}: ok${warns.length ? ` (${warns.length} warning(s))` : ''}${tail}\n`);
      }
    },
  };
}

/** Short, single-line excerpt of `text` around `index` for messages. */
export function excerpt(text, index, len = 0, span = 36) {
  const a = Math.max(0, index - span);
  const b = Math.min(text.length, index + len + span);
  return `${a > 0 ? '…' : ''}${text.slice(a, b).replace(/\s+/g, ' ').trim()}${b < text.length ? '…' : ''}`;
}
