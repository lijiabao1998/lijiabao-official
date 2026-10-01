#!/usr/bin/env node
// scripts/og-redirects.mjs — postbuild. The OG cards used to live at /og/{zh,en}-{home,gt,fr}.png; they are now
// emitted by Astro as /_astro/<name>.<hash>.png (see Seo.astro). Posts already shared with the old card URLs keep
// working through 301s in dist/_redirects (Workers static assets read that file).

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, rel } from './lib/gate.mjs';

const ASTRO = join(DIST, '_astro');
const CARD = /^((?:zh|en)-(?:home|gt|fr))\.[\w-]+\.png$/;

const found = new Map();
for (const f of readdirSync(ASTRO)) {
  const m = CARD.exec(f);
  if (m) found.set(m[1], f);
}
if (found.size !== 6) throw new Error(`og-redirects: expected 6 OG cards in ${rel(ASTRO)}, found ${found.size}`);

const file = join(DIST, '_redirects');
const keep = existsSync(file)
  ? readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('/og/'))
  : [];
const lines = [...found].sort().map(([name, f]) => `/og/${name}.png /_astro/${f} 301`);
writeFileSync(file, `${[...keep, '# old OG card URLs → hashed cards (scripts/og-redirects.mjs)', ...lines].join('\n')}\n`);
process.stdout.write(`og-redirects: ${lines.length} → ${rel(file)}\n`);
