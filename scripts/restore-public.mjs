#!/usr/bin/env node
// scripts/restore-public.mjs — first prebuild step, CI only.
//
// Workers Builds restores a "build output cache" right AFTER cloning, and that cache carries the previous build's
// public/ folder: on 2026-10-01 it put the old public/og/*.png back over the freshly committed ones, wrangler saw
// them as unchanged and the site kept serving stale cards (dashboard → Settings → Build → Build cache can only be
// cleared, not turned off). So in CI, public/ is reset to exactly what the commit contains before anything builds.
// Locally (no CI env) this does nothing.

import { execFileSync } from 'node:child_process';
import { ROOT } from './lib/gate.mjs';

const ci = process.env.WORKERS_CI || process.env.CI;
if (!ci) process.exit(0);

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
try {
  const before = git('status', '--porcelain', '--', 'public');
  git('checkout', 'HEAD', '--', 'public');
  git('clean', '-fdq', '--', 'public');
  const fixed = before ? before.split('\n').length : 0;
  process.stdout.write(`restore-public: public/ reset to HEAD (${fixed} cached path(s) replaced or removed)\n`);
} catch (err) {
  // never block a deploy on this guard; the build still runs from whatever is on disk
  process.stdout.write(`restore-public: skipped (${err instanceof Error ? err.message.split('\n')[0] : err})\n`);
}
