#!/usr/bin/env node
// scripts/headers.mjs — postbuild (spec §8 "Caching and headers"): hash every inline executable <script> in
// dist/**/*.html and write the Content-Security-Policy into the `/*` block of dist/_headers.
//
// - dist/_headers starts as Astro's copy of public/_headers (F0 template: security headers and the immutable
//   cache rules for /_astro/* and /gl/*). Every rule already there is kept verbatim; only the CSP line is
//   (re)placed, so re-running is harmless.
// - Hashed: classic and module inline scripts (the head boot, Astro's hoisted inline modules). Skipped: scripts
//   with `src` (covered by 'self') and data blocks such as application/ld+json (never executed).
// - ClientRouter re-inserts a page's inline scripts on navigation with identical text, so the same hashes hold.
// - Cloudflare limits a header line to 2,000 characters: fail loudly rather than write a line Workers would drop.
// Usage: node scripts/headers.mjs [--check]   (--check: verify dist/_headers is current, write nothing)

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, ROOT, rel } from './lib/gate.mjs';
import { MAX_LINE, collectHashes, cspLine, policy, withCsp } from './lib/csp.mjs';

const OUT = join(DIST, '_headers');
const TEMPLATE = join(ROOT, 'public', '_headers');

if (!existsSync(DIST)) {
  process.stderr.write('headers: dist/ not found; run `astro build` first\n');
  process.exit(1);
}

const { hashes, pages, scripts } = collectHashes();
const csp = policy(hashes);
if (cspLine(csp).length > MAX_LINE) {
  process.stderr.write(
    `headers: the CSP line is ${cspLine(csp).length} characters (Cloudflare's limit is ${MAX_LINE}); ${hashes.length} distinct inline scripts\n`,
  );
  process.exit(1);
}

const base = existsSync(OUT) ? readFileSync(OUT, 'utf8') : existsSync(TEMPLATE) ? readFileSync(TEMPLATE, 'utf8') : '';
const next = withCsp(base, csp);

if (process.argv.includes('--check')) {
  const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (cur !== next) {
    process.stderr.write(`headers: ${rel(OUT)} is missing or stale; run \`node scripts/headers.mjs\`\n`);
    process.exit(1);
  }
  process.stdout.write(`headers: ${rel(OUT)} is current (${hashes.length} hash(es))\n`);
} else {
  writeFileSync(OUT, next, 'utf8');
  process.stdout.write(`headers: CSP with ${hashes.length} inline-script hash(es) from ${scripts} script(s) in ${pages} page(s) → ${rel(OUT)}\n`);
}
