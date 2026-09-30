// scripts/lib/csp.mjs — the Content-Security-Policy of spec §8 and the `_headers` rewrite. Used by
// scripts/headers.mjs (postbuild, writes) and scripts/check-dist.mjs (verifies the written file is current).

import { readFileSync } from 'node:fs';
import { DIST, walk } from './gate.mjs';
import { cspHash, inlineScripts } from './html.mjs';

/** Cloudflare `_headers`: a header line may not exceed 2,000 characters. */
export const MAX_LINE = 2000;

/**
 * The policy of spec §8 (`default-src 'self'; script-src 'self' <hashes>; style-src 'self' 'unsafe-inline';
 * img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'`), plus
 * `object-src 'none'` and `form-action 'self'`. `hashes` are the inline-script sources.
 * @param {string[]} hashes
 */
export function policy(hashes) {
  return [
    "default-src 'self'",
    `script-src 'self'${hashes.length ? ` ${hashes.join(' ')}` : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/** Every distinct inline-script hash in the built pages, sorted (stable output). */
export function collectHashes(dist = DIST) {
  const hashes = new Set();
  let pages = 0;
  let scripts = 0;
  for (const file of walk(dist)) {
    if (!file.endsWith('.html')) continue;
    pages++;
    for (const body of inlineScripts(readFileSync(file, 'utf8'))) {
      scripts++;
      hashes.add(cspHash(body));
    }
  }
  return { hashes: [...hashes].sort(), pages, scripts };
}

/** The `  Content-Security-Policy: …` line as it sits in `_headers`. */
export const cspLine = (csp) => `  Content-Security-Policy: ${csp}`;

/**
 * `_headers` text with the CSP placed as the last header of the `/*` block; the block is created when missing.
 * Every other line is kept verbatim, and any earlier CSP line is replaced (idempotent).
 * @param {string} text
 * @param {string} csp
 */
export function withCsp(text, csp) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const kept = lines.filter((l) => !/^\s+Content-Security-Policy\s*:/i.test(l));
  const start = kept.findIndex((l) => l.trim() === '/*');
  if (start < 0) {
    const body = kept.join('\n').trim();
    return `/*\n${cspLine(csp)}\n${body ? `\n${body}\n` : ''}`;
  }
  let end = start + 1;
  while (end < kept.length && /^\s+\S/.test(kept[end])) end++;
  kept.splice(end, 0, cspLine(csp));
  return `${kept.join('\n').trimEnd()}\n`;
}

/** The CSP value found in a `_headers` text for the `/*` block, or null. */
export function readCsp(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((l) => l.trim() === '/*');
  if (start < 0) return null;
  for (let i = start + 1; i < lines.length && /^\s+\S/.test(lines[i]); i++) {
    const m = /^\s+Content-Security-Policy\s*:\s*(.*)$/i.exec(lines[i]);
    if (m) return m[1].trim();
  }
  return null;
}
