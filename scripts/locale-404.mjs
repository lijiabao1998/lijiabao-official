// F0 postbuild: Astro only special-cases the root 404 (dist/404.html). src/pages/en/404.astro is emitted as
// dist/en/404/index.html, but Workers static assets (`not_found_handling: "404-page"`) serve the NEAREST
// `404.html` walking up from the requested path (§3). Copy it to dist/en/404.html so /en/* misses get the
// English 404. Idempotent; exits 0 when there is nothing to copy.
import { copyFileSync, existsSync, rmSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const src = new URL('en/404/index.html', dist);
const out = new URL('en/404.html', dist);
if (existsSync(src)) {
  copyFileSync(src, out);
  // keep a single English 404 document (the /en/404/ route itself is never linked)
  rmSync(new URL('en/404/', dist), { recursive: true, force: true });
  console.log('404: dist/en/404.html');
}
