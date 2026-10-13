#!/usr/bin/env node
// scripts/post-figures.mjs — postbuild: every image in a post body (/articles/, /views/) links to its full-size file.
//
// Post figures are dense diagrams drawn at 1600 px; in a 343 px phone column their smallest labels shrink to ~6 px.
// Astro only decides an image's final URL (/_astro/<name>.<hash>.webp) when it renders the page, so the link is
// added here, on the built HTML: <img> → <a class="fig-zoom" href="<its src>" data-hint="點圖看原尺寸"><img></a>.
// No JavaScript; styles/prose.css shows the hint under the figure on narrow screens only. An image that already
// sits inside a link is left alone. Runs before llms.mjs (which reads the same HTML) and headers.mjs.

import { readFileSync, writeFileSync } from 'node:fs';
import { DIST, gate, imp, rel, walk } from './lib/gate.mjs';
import { parseAttrs, tokenize } from './lib/html.mjs';

const g = gate('post-figures');
const { tStr } = await imp('src/i18n/t.ts');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let pages = 0;
let figures = 0;
for (const file of walk(DIST)) {
  const p = rel(file);
  if (!/^dist\/(?:en\/)?(?:articles|views)\/[a-z0-9-]+\/index\.html$/.test(p)) continue;
  const html = readFileSync(file, 'utf8');
  const locale = /<html[^>]*\blang="en"/.test(html) ? 'en' : 'zh-Hant';
  const hint = esc(tStr('posts.figure.zoom', locale));

  // find the post body and the <img> tags in it that are not inside an <a>
  const edits = [];
  let inBody = 0;
  let depth = 0;
  let inLink = 0;
  for (const tok of tokenize(html)) {
    if (tok.type !== 'open' && tok.type !== 'close') continue;
    const name = tok.name.toLowerCase();
    if (tok.type === 'open') {
      const attrs = tok.attrs instanceof Map ? tok.attrs : parseAttrs(tok.attrs ?? '');
      if (!inBody && name === 'div' && attrs.has('data-post-body')) {
        inBody = 1;
        depth = 0;
        continue;
      }
      if (!inBody) continue;
      if (name === 'div' && !tok.selfClosing) depth++;
      if (name === 'a') inLink++;
      if (name === 'img' && !inLink) {
        const src = attrs.get('src');
        if (!src) {
          g.fail(`${p}: a post image has no src`);
          continue;
        }
        const end = html.indexOf('>', tok.index) + 1;
        edits.push({ start: tok.index, end, src });
      }
    } else if (inBody) {
      if (name === 'a' && inLink) inLink--;
      if (name === 'div') {
        if (depth === 0) inBody = 0;
        else depth--;
      }
    }
  }
  if (!edits.length) continue;
  let out = html;
  for (const e of edits.reverse()) {
    const img = out.slice(e.start, e.end);
    out = `${out.slice(0, e.start)}<a class="fig-zoom" href="${esc(e.src)}" data-hint="${hint}">${img}</a>${out.slice(e.end)}`;
  }
  writeFileSync(file, out);
  pages++;
  figures += edits.length;
}

g.done(`${figures} figure(s) linked to full size in ${pages} post page(s)`);
