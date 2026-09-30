#!/usr/bin/env node
// scripts/check-dist.mjs — what actually ships (spec §8 budgets and headers, §9.5 items 1, 14, 15; §3 routes and
// head; build-overrides §1–3). Run after `npm run build` (postbuild has written dist/_headers).
//
// Budgets (src/data/budgets.ts, the same numbers `tier.cap` prints; KB = 1024 B, gzip -9 unless raw):
//   HTML per page · head boot script · Geist latin / Geist Mono / Noto hero / Noto display (woff2, raw) ·
//   JS static tier (entry scripts + their static imports) · JS lite/full (+ the motion runtime and the page's
//   section modules) · GL engine + scenes · commits.bin · portrait bins (raw) · field poster · portrait AVIF ·
//   first view of the home page (zh/en × lite/static).
// Privacy and safety: the raw portrait photo never ships (by name and by content hash); no resource loads from a
//   third-party origin (HTML, CSS, JS); no <iframe>/<embed>/<object>; no cookies; no X link; no jobTitle.
// Language: <html lang> per locale; lang values are zh-Hant / en / he; /en/ pages carry no CJK outside a
//   lang="zh-Hant" element (text and visible/ARIA attributes); Hebrew only inside lang="he" dir="rtl"; the
//   Noto faces load only on zh pages and the hero subset is preloaded on the zh home only.
// Structure: one h1 per page, no skipped heading levels, unique ids; no data-copy-status="proposed".
// Links: every internal href/src/srcset/url()/og:image resolves to a file in dist (Workers auto-trailing-slash
//   rules) and every #fragment to an id on the target page; sitemap.xml and robots.txt agree with the pages.
// Copy: the rules of scripts/lib/rules.mjs over the rendered text (JSON-LD excluded: alternateName keeps the
//   other written forms of the name, by design).
// Headers: dist/_headers carries the CSP of scripts/lib/csp.mjs with a hash for every inline script in dist.
// Workers limits: ≤ 20,000 files, ≤ 25 MiB each.
// Usage: node scripts/check-dist.mjs [--verbose]

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, posix, relative, sep } from 'node:path';
import { DIST, ROOT, excerpt, gate, gz, imp, kb, size, walk } from './lib/gate.mjs';
import { readPage } from './lib/html.mjs';
import { collectHashes, policy, readCsp } from './lib/csp.mjs';
import { CJK_RE, HEBREW_RE, findViolations } from './lib/rules.mjs';

const g = gate('check-dist');
const VERBOSE = process.argv.includes('--verbose');

if (!existsSync(DIST)) {
  g.fail('dist/ not found; run `npm run build` first');
  g.done();
  process.exit();
}

const { budgets } = await imp('src/data/budgets.ts');
const { facts } = await imp('src/data/facts.ts');
const { features } = await imp('src/data/features.ts');
const { SITE_URL } = await imp('src/data/links.ts');

const SITE = new URL(SITE_URL);
const K = 1024;
const files = walk(DIST);
const distRel = (p) => relative(DIST, p).split(sep).join('/');
const fileSet = new Set(files.map(distRel));

// ── routes (§3) ────────────────────────────────────────────────────────────────────────────────────────────
const PAGES = [
  { file: 'index.html', url: '/', locale: 'zh-Hant', kind: 'home' },
  { file: 'glimmertown/index.html', url: '/glimmertown/', locale: 'zh-Hant', kind: 'gt' },
  { file: 'frontier/index.html', url: '/frontier/', locale: 'zh-Hant', kind: 'fr' },
  { file: '404.html', url: '/404.html', locale: 'zh-Hant', kind: 'nf' },
  { file: 'en/index.html', url: '/en/', locale: 'en', kind: 'home' },
  { file: 'en/glimmertown/index.html', url: '/en/glimmertown/', locale: 'en', kind: 'gt' },
  { file: 'en/frontier/index.html', url: '/en/frontier/', locale: 'en', kind: 'fr' },
  { file: 'en/404.html', url: '/en/404.html', locale: 'en', kind: 'nf' },
];
for (const p of PAGES) if (!fileSet.has(p.file)) g.fail(`missing page dist/${p.file}`);
for (const f of ['_headers', 'robots.txt', 'sitemap.xml', 'favicon.svg']) if (!fileSet.has(f)) g.fail(`missing dist/${f}`);
// any other HTML file is checked too (locale from its path)
for (const f of fileSet) {
  if (f.endsWith('.html') && !PAGES.some((p) => p.file === f)) {
    const en = f.startsWith('en/');
    PAGES.push({ file: f, url: `/${f.replace(/index\.html$/, '')}`, locale: en ? 'en' : 'zh-Hant', kind: 'other' });
  }
}
const pages = PAGES.filter((p) => fileSet.has(p.file)).map((p) => {
  const html = readFileSync(join(DIST, p.file), 'utf8');
  return { ...p, html, doc: readPage(html) };
});
const idsOf = new Map(
  pages.map((p) => [p.file, new Set(p.doc.elements.filter((e) => e.attrs.has('id')).map((e) => e.attrs.get('id')))]),
);

// ── URL resolution (Workers static assets, html_handling: auto-trailing-slash) ────────────────────────────
/** @returns {{ internal: boolean, file?: string|null, hash?: string, path?: string }} */
function resolveUrl(raw, fromUrl) {
  const v = raw.trim();
  if (!v || /^(mailto|tel|data|blob|javascript|about):/i.test(v)) return { internal: false, skip: true };
  let u;
  try {
    u = new URL(v, new URL(fromUrl, SITE));
  } catch {
    return { internal: true, file: null, path: v };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { internal: false, skip: true };
  if (u.host !== SITE.host) return { internal: false, host: u.host };
  let path;
  try {
    path = decodeURIComponent(u.pathname);
  } catch {
    path = u.pathname;
  }
  const hash = u.hash ? decodeURIComponent(u.hash.slice(1)) : '';
  const clean = path.replace(/^\/+/, '');
  const candidates = [];
  if (clean === '' || path.endsWith('/')) candidates.push(`${clean}index.html`);
  else if (posix.extname(clean)) candidates.push(clean);
  else candidates.push(`${clean}.html`, `${clean}/index.html`);
  const file = candidates.find((c) => fileSet.has(c)) ?? null;
  return { internal: true, file, hash, path };
}

function checkLink(page, raw, what, { load = false, needHash = true } = {}) {
  const r = resolveUrl(raw, page.url);
  if (r.skip) return;
  if (!r.internal) {
    if (load) g.fail(`${page.file}: ${what} loads from a third-party origin (${r.host}): ${raw}`);
    return;
  }
  if (!r.file) {
    g.fail(`${page.file}: ${what} → ${raw} does not resolve to a file in dist`);
    return;
  }
  if (r.hash && needHash && r.file.endsWith('.html')) {
    const ids = idsOf.get(r.file);
    if (ids && !ids.has(r.hash)) g.fail(`${page.file}: ${what} → ${raw}: no id="${r.hash}" on ${r.file}`);
  }
}

// ── per page ───────────────────────────────────────────────────────────────────────────────────────────────
const LOAD_RELS = /(^|\s)(stylesheet|preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|apple-touch-icon|manifest|mask-icon)(\s|$)/i;
const LANGS = new Set(['zh-Hant', 'en', 'he']);
const TEXT_ATTRS = ['alt', 'title', 'aria-label', 'aria-description', 'aria-roledescription', 'placeholder', 'label'];
const META_TEXT = /^(description|author|og:title|og:description|og:image:alt|og:site_name|twitter:title|twitter:description|twitter:image:alt)$/;
const cssUrls = (css) => [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].map((m) => m[2]).concat([...css.matchAll(/@import\s+(['"])([^'"]+)\1/g)].map((m) => m[2]));
const srcsetUrls = (v) => v.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);

for (const page of pages) {
  const { doc, file } = page;
  const en = page.locale === 'en';

  // language
  if (doc.htmlLang !== page.locale) g.fail(`${file}: <html lang="${doc.htmlLang}">, expected "${page.locale}"`);
  for (const el of doc.elements) {
    if (el.attrs.has('lang') && !LANGS.has(el.attrs.get('lang'))) g.fail(`${file}: <${el.name} lang="${el.attrs.get('lang')}"> (zh-Hant / en / he only)`);
    if (el.attrs.has('hreflang') && !['zh-Hant', 'en', 'x-default'].includes(el.attrs.get('hreflang'))) {
      g.fail(`${file}: hreflang="${el.attrs.get('hreflang')}"`);
    }
  }
  const langProblems = (text, lang, dir, where) => {
    if (en && CJK_RE.test(text) && !lang.startsWith('zh')) {
      const m = CJK_RE.exec(text);
      g.fail(`${file}: CJK outside a lang="zh-Hant" element (${where}): "${excerpt(text, m.index, 1, 24)}"`);
    }
    if (HEBREW_RE.test(text) && (lang !== 'he' || dir !== 'rtl')) g.fail(`${file}: Hebrew outside lang="he" dir="rtl" (${where})`);
  };
  const copy = [];
  for (const t of doc.texts) {
    langProblems(t.text, t.lang, t.dir, `<${t.el?.name ?? '?'}> text`);
    copy.push(t.text);
  }
  for (const el of doc.elements) {
    const texts = [];
    for (const a of TEXT_ATTRS) if (el.attrs.has(a)) texts.push([a, el.attrs.get(a)]);
    for (const [a, v] of el.attrs) if (a.startsWith('data-i18n-')) texts.push([a, v]);
    if (el.name === 'meta' && META_TEXT.test(el.attrs.get('name') ?? el.attrs.get('property') ?? '')) texts.push(['content', el.attrs.get('content') ?? '']);
    for (const [a, v] of texts) {
      langProblems(v, el.lang, el.dir, `<${el.name} ${a}>`);
      copy.push(v);
    }
  }

  // copy rules over the rendered text
  const all = copy.join('\n');
  for (const v of findViolations(all, { vendors: features.vendorNames === true })) {
    g.fail(`${file}: ${v.id} "${v.match}" in "${excerpt(all, v.index, v.match.length)}" — ${v.why}`);
  }

  // structure
  const heads = doc.elements.filter((e) => /^h[1-6]$/.test(e.name)).map((e) => Number(e.name[1]));
  const h1 = heads.filter((h) => h === 1).length;
  if (h1 !== 1) g.fail(`${file}: ${h1} <h1> elements (exactly one per page)`);
  for (let i = 1; i < heads.length; i++) {
    if (heads[i] > heads[i - 1] + 1) g.fail(`${file}: heading level skips from h${heads[i - 1]} to h${heads[i]}`);
  }
  const seen = new Map();
  for (const el of doc.elements) {
    const id = el.attrs.get('id');
    if (id === undefined) continue;
    if (!id) g.fail(`${file}: empty id on <${el.name}>`);
    if (seen.has(id)) g.fail(`${file}: duplicate id="${id}"`);
    seen.set(id, true);
  }
  for (const el of doc.elements) {
    if (el.attrs.get('data-copy-status') === 'proposed') g.fail(`${file}: data-copy-status="proposed" ships in production (§4.0)`);
    if (['iframe', 'embed', 'object', 'frame', 'frameset'].includes(el.name)) g.fail(`${file}: <${el.name}> (demos are linked, never embedded)`);
    if (el.name === 'meta' && (el.attrs.get('http-equiv') ?? '').toLowerCase() === 'refresh') g.fail(`${file}: <meta http-equiv="refresh">`);
  }

  // JSON-LD: valid, no jobTitle
  for (const s of doc.scripts) {
    if ((s.attrs.get('type') ?? '') !== 'application/ld+json') continue;
    try {
      JSON.parse(s.content);
    } catch (err) {
      g.fail(`${file}: JSON-LD does not parse (${err.message})`);
    }
    if (/"jobTitle"/.test(s.content)) g.fail(`${file}: JSON-LD carries a jobTitle (owner decision: none)`);
  }

  // links and loads
  for (const el of doc.elements) {
    const a = el.attrs;
    if ((el.name === 'a' || el.name === 'area') && a.has('href')) {
      const href = a.get('href');
      if (/^(?:https?:)?\/\/(?:www\.)?(?:x|twitter)\.com(?:\/|$)/i.test(href)) g.fail(`${file}: link to X/Twitter (not approved): ${href}`);
      if (href === '#' || href === '') g.warn(`${file}: <a href="${href}"> goes nowhere`);
      else checkLink(page, href, `<a href>`);
    }
    if (el.name === 'link' && a.has('href')) checkLink(page, a.get('href'), `<link rel="${a.get('rel') ?? ''}">`, { load: LOAD_RELS.test(a.get('rel') ?? '') });
    if (el.name === 'script' && a.has('src')) checkLink(page, a.get('src'), '<script src>', { load: true });
    if (['img', 'source', 'video', 'audio', 'track', 'input'].includes(el.name)) {
      for (const attr of ['src', 'poster']) if (a.has(attr)) checkLink(page, a.get(attr), `<${el.name} ${attr}>`, { load: true });
      if (a.has('srcset')) for (const u of srcsetUrls(a.get('srcset'))) checkLink(page, u, `<${el.name} srcset>`, { load: true });
    }
    if (el.name === 'use' && (a.has('href') || a.has('xlink:href'))) checkLink(page, a.get('href') ?? a.get('xlink:href'), '<use href>', { load: true });
    if (el.name === 'meta' && /^(og:image|og:url|twitter:image)$/.test(a.get('property') ?? a.get('name') ?? '')) {
      checkLink(page, a.get('content') ?? '', `<meta ${a.get('property') ?? a.get('name')}>`);
    }
    if (a.has('style')) for (const u of cssUrls(a.get('style'))) checkLink(page, u, 'style url()', { load: true });
  }
  for (const s of doc.styles) for (const u of cssUrls(s.content)) checkLink(page, u, '<style> url()', { load: true });
}

// ── CSS and JS files: third-party origins, cookies ────────────────────────────────────────────────────────
// Hosts a script may name without loading anything: namespaces, the libraries' own doc links, and link
// targets the page builds at runtime (commit links). A new host here needs a reason.
const JS_HOSTS = new Set(['www.w3.org', 'gsap.com', 'greensock.com', 'github.com', 'lijiabao1998.github.io', SITE.host]);
for (const f of files) {
  const r = distRel(f);
  if (r.endsWith('.css')) {
    for (const u of cssUrls(readFileSync(f, 'utf8'))) {
      const res = resolveUrl(u, `/${r}`);
      if (res.skip) continue;
      if (!res.internal) g.fail(`${r}: url() loads from a third-party origin: ${u}`);
      else if (!res.file) g.fail(`${r}: url(${u}) does not resolve`);
    }
  }
  if (r.endsWith('.js') || r.endsWith('.mjs')) {
    const code = readFileSync(f, 'utf8');
    for (const m of code.matchAll(/\b(?:https?:)?\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?=[/"'`:?#\s)]|$)/gi)) {
      const host = m[1].toLowerCase();
      if (!JS_HOSTS.has(host)) g.fail(`${r}: names the third-party origin ${host} ("${excerpt(code, m.index ?? 0, m[0].length, 30)}")`);
    }
    if (/\bdocument\.cookie\b/.test(code)) g.fail(`${r}: touches document.cookie (no cookies, §8)`);
  }
}

// ── the raw portrait never ships (build-overrides §3) ─────────────────────────────────────────────────────
const photo = join(ROOT, 'src', 'assets', 'portrait.png');
const photoHash = existsSync(photo) ? createHash('sha256').update(readFileSync(photo)).digest('hex') : null;
for (const f of files) {
  const r = distRel(f);
  if (/(^|\/)portrait(\.[\w-]+)?\.(png|jpe?g|webp|avif|gif|heic|tiff?)$/i.test(r)) g.fail(`${r}: looks like the raw portrait photo (only the sampled dots may ship)`);
  if (photoHash && /\.(png|jpe?g|webp|avif|gif)$/i.test(r) && createHash('sha256').update(readFileSync(f)).digest('hex') === photoHash) {
    g.fail(`${r}: is byte-identical to src/assets/portrait.png`);
  }
  if (/\.(html|js|css|json|svg|xml|txt)$/i.test(r) && /portrait\.png/i.test(readFileSync(f, 'utf8'))) g.fail(`${r}: references portrait.png`);
}

// ── JS module graph (Rolldown output: `import{…}from"./x.js"`, `import("./x.js")`) ────────────────────────
const jsCode = new Map();
const jsGz = new Map();
for (const f of files) {
  const r = distRel(f);
  if (r.startsWith('_astro/') && r.endsWith('.js')) {
    const buf = readFileSync(f);
    jsCode.set(r, buf.toString('utf8'));
    jsGz.set(r, gz(buf));
  }
}
const STATIC_IMPORT = /\b(?:import|export)\s*(?:\{[^}]*\}|\*(?:\s*as\s*[\w$]+)?|[\w$]+(?:\s*,\s*(?:\{[^}]*\}|\*\s*as\s*[\w$]+))?)?\s*(?:from\s*)?["'`]([^"'`\s]+\.js)["'`]/g;
const DYNAMIC_IMPORT = /\bimport\(\s*["'`]([^"'`\s]+\.js)["'`]\s*\)/g;
/** A specifier seen from `fromRel` (a dist-relative path) → dist-relative JS path, or null. */
function jsTarget(spec, fromRel) {
  if (spec.startsWith('/')) return spec.slice(1);
  if (spec.startsWith('./') || spec.startsWith('../')) return posix.normalize(posix.join(posix.dirname(fromRel), spec));
  return null;
}
const edges = (r, re) => [...(jsCode.get(r) ?? '').matchAll(re)].map((m) => jsTarget(m[1], r)).filter((x) => x && jsCode.has(x));
function staticClosure(roots) {
  const out = new Set();
  const stack = [...roots];
  while (stack.length) {
    const r = stack.pop();
    if (out.has(r) || !jsCode.has(r)) continue;
    out.add(r);
    stack.push(...edges(r, STATIC_IMPORT));
  }
  return out;
}
const sumGz = (set) => [...set].reduce((n, r) => n + (jsGz.get(r) ?? 0), 0);
const chunkName = (r) => basename(r).split('.')[0];

// registry keys → section chunk names (motion/registry.ts is TypeScript with extensionless imports: read it)
const registrySrc = readFileSync(join(ROOT, 'src/motion/registry.ts'), 'utf8');
const SECTION = new Map([...registrySrc.matchAll(/['"]?([\w-]+)['"]?\s*:\s*\(\)\s*=>\s*import\(\s*['"]\.\/sections\/([\w-]+)['"]\s*\)/g)].map((m) => [m[2], m[1]]));
const INTRO = 'intro';
const GL_NAMES = new Set(['engine', 'field', 'portrait', 'grid', 'inspect']);
const DEV_ONLY = new Set(['mock']);

/** Entry scripts of a page: module/classic `src` scripts under /_astro/ plus what inline modules import. */
function entries(page) {
  const out = [];
  for (const s of page.doc.scripts) {
    const src = s.attrs.get('src');
    if (src) {
      const t = jsTarget(src.replace(SITE.origin, ''), page.file);
      if (t && jsCode.has(t)) out.push(t);
    } else if ((s.attrs.get('type') ?? '') === 'module') {
      for (const m of s.content.matchAll(STATIC_IMPORT)) {
        const t = jsTarget(m[1], page.file);
        if (t && jsCode.has(t)) out.push(t);
      }
    }
  }
  return out;
}

/** static tier, lite/full tier and GL sets for a page. */
function jsSets(page) {
  const motion = new Set(page.doc.elements.filter((e) => e.attrs.has('data-motion')).map((e) => e.attrs.get('data-motion')));
  const wantSection = (name) => {
    if (name === INTRO) return page.kind === 'home';
    const key = SECTION.get(name);
    return key === 'reveal' || motion.has(key);
  };
  const stat = staticClosure(entries(page));
  const lite = new Set(stat);
  const glRoots = new Set();
  const queue = [...stat];
  const visited = new Set();
  while (queue.length) {
    const r = queue.shift();
    if (visited.has(r)) continue;
    visited.add(r);
    for (const d of edges(r, DYNAMIC_IMPORT)) {
      const name = chunkName(d);
      if (DEV_ONLY.has(name)) continue;
      if (GL_NAMES.has(name)) {
        glRoots.add(d);
        continue;
      }
      if ((SECTION.has(name) || name === INTRO) && !wantSection(name)) continue;
      for (const x of staticClosure([d])) {
        if (!lite.has(x)) {
          lite.add(x);
          queue.push(x);
        }
      }
    }
  }
  // GL: the engine and every scene it can load, minus what the runtime already brought
  const gl = new Set();
  const glQueue = [...glRoots];
  while (glQueue.length) {
    const r = glQueue.shift();
    for (const x of staticClosure([r])) {
      if (lite.has(x) || gl.has(x)) continue;
      gl.add(x);
      for (const d of edges(x, DYNAMIC_IMPORT)) if (!DEV_ONLY.has(chunkName(d))) glQueue.push(d);
    }
  }
  return { stat, lite, gl };
}

// ── fonts (@font-face per page, woff2 raw bytes) ──────────────────────────────────────────────────────────
function fontFaces(page) {
  const css = page.doc.styles.map((s) => s.content).join('\n');
  const vars = new Map([...css.matchAll(/(--font-[\w-]+)\s*:\s*([^;}]+)/g)].map((m) => [m[1], m[2].trim().replace(/^["']|["']$/g, '')]));
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const body = m[1];
    const family = (/font-family\s*:\s*([^;]+)/.exec(body)?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
    const url = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(body)?.[1] ?? '';
    const range = /unicode-range\s*:\s*([^;]+)/.exec(body)?.[1] ?? '';
    return { family, url, range };
  });
  return { vars, faces };
}
const covers = (range, cp) =>
  !range.trim() ||
  range.split(',').some((part) => {
    const m = /U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/i.exec(part.trim());
    if (!m) return false;
    const lo = parseInt(m[1].replace(/\?/g, '0'), 16);
    const hi = m[2] ? parseInt(m[2], 16) : parseInt(m[1].replace(/\?/g, 'f'), 16);
    return cp >= lo && cp <= hi;
  });
function fontBytes(page, cssVar, latinOnly) {
  const { vars, faces } = fontFaces(page);
  const family = vars.get(cssVar);
  if (!family) return null;
  let bytes = 0;
  const seenUrls = new Set();
  for (const f of faces) {
    if (f.family !== family || seenUrls.has(f.url)) continue;
    if (latinOnly && !covers(f.range, 0x41)) continue;
    seenUrls.add(f.url);
    const r = resolveUrl(f.url, page.url);
    if (r.file) bytes += size(join(DIST, r.file));
  }
  return bytes;
}

// ── budgets ───────────────────────────────────────────────────────────────────────────────────────────────
const cap = (label, bytes, capKb, where = '') => {
  const ok = bytes <= capKb * K;
  const msg = `${label}${where ? ` (${where})` : ''}: ${kb(bytes)} / ${capKb} KB`;
  if (ok) {
    if (VERBOSE) g.info(msg);
  } else g.fail(`budget ${msg}`);
  return bytes;
};

const firstView = {};
let glBytes = null;
for (const page of pages) {
  const { file, kind } = page;
  const htmlGz = gz(Buffer.from(page.html));
  cap('HTML', htmlGz, kind === 'home' ? budgets.html.home : budgets.html.case, file);

  const boot = page.doc.scripts.find((s) => s.el.inHead && !s.attrs.has('src') && !s.attrs.has('type'));
  if (!boot) g.fail(`${file}: no inline head boot script (§7)`);
  else cap('head boot script', gz(Buffer.from(boot.content)), budgets.headInline, file);

  const { stat, lite, gl } = jsSets(page);
  const statGz = cap('JS static tier', sumGz(stat), budgets.js.static, file);
  const liteGz = cap('JS lite/full', sumGz(lite), kind === 'fr' ? budgets.js.liteFr : budgets.js.liteHomeGt, file);
  const glGz = sumGz(gl);
  glBytes = Math.max(glBytes ?? 0, glGz);

  // fonts: the Noto faces exist only on zh pages; the hero subset is preloaded on the zh home only
  const zh = page.locale === 'zh-Hant';
  const f = {
    geist: fontBytes(page, '--font-display', true),
    mono: fontBytes(page, '--font-mono', true),
    hero: fontBytes(page, '--font-cjk-hero', false),
    display: fontBytes(page, '--font-cjk-display', false),
  };
  if (f.geist === null || f.mono === null) g.fail(`${file}: Geist / Geist Mono @font-face missing`);
  if (zh && (f.hero === null || f.display === null)) g.fail(`${file}: Noto Sans TC subsets missing on a zh page`);
  if (!zh && (f.hero !== null || f.display !== null)) g.fail(`${file}: Noto Sans TC @font-face on an /en/ page`);
  if (f.geist !== null) cap('Geist latin', f.geist, budgets.fonts.geistLatin, file);
  if (f.mono !== null) cap('Geist Mono latin', f.mono, budgets.fonts.geistMono, file);
  if (f.hero !== null) cap('Noto hero subset', f.hero, budgets.fonts.notoHero, file);
  if (f.display !== null) cap('Noto display subset', f.display, budgets.fonts.notoDisplay, file);
  const heroFile = (() => {
    const { vars, faces } = fontFaces(page);
    const fam = vars.get('--font-cjk-hero');
    return faces.find((x) => x.family === fam)?.url ?? null;
  })();
  const preloads = page.doc.elements.filter((e) => e.name === 'link' && /(^|\s)preload(\s|$)/.test(e.attrs.get('rel') ?? '')).map((e) => e.attrs.get('href'));
  if (heroFile && preloads.includes(heroFile) !== (zh && kind === 'home')) {
    g.fail(`${file}: the Noto hero subset must be preloaded on the zh home only`);
  }

  if (kind === 'home') {
    firstView[page.locale] = { htmlGz, statGz, liteGz, fonts: (f.geist ?? 0) + (f.mono ?? 0) + (f.hero ?? 0) + (f.display ?? 0) };
  }
  if (VERBOSE) g.info(`${file}: html ${kb(htmlGz)} · js static ${kb(statGz)} · js lite ${kb(liteGz)} · gl ${kb(glGz)}`);
}
if (glBytes !== null) cap('GL engine + scenes', glBytes, budgets.gl);

// bins and posters (produced by S1 / S3; checked when present)
const findDist = (re) => [...fileSet].filter((r) => re.test(r));
let commitsGz = 0;
for (const r of findDist(/^gl\/commits[.\w-]*\.bin$/)) commitsGz = Math.max(commitsGz, cap('commits.bin', gz(readFileSync(join(DIST, r))), budgets.bins.commits, r));
for (const r of findDist(/^gl\/portrait-a[.\w-]*\.bin$/)) cap('portrait-a.bin (raw)', size(join(DIST, r)), budgets.bins.portraitA, r);
for (const r of findDist(/^gl\/portrait-b[.\w-]*\.bin$/)) cap('portrait-b.bin (raw)', size(join(DIST, r)), budgets.bins.portraitB, r);
let posterGz = 0;
for (const r of findDist(/^posters\/field\.svg$/)) posterGz = cap('field poster', gz(readFileSync(join(DIST, r))), budgets.posters.field, r);
for (const r of findDist(/portrait[\w.-]*\.avif$/i)) cap('portrait poster (AVIF)', size(join(DIST, r)), budgets.posters.portraitAvif, r);

// the gl-manifest (S1/S3) resolves every data-gl-src, and each bin it names ships
const manifestPath = join(ROOT, 'src/data/gl-manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null;
if (manifest) {
  const walkJson = (v, out = []) => {
    if (typeof v === 'string') out.push(v);
    else if (v && typeof v === 'object') for (const x of Object.values(v)) walkJson(x, out);
    return out;
  };
  for (const s of walkJson(manifest)) {
    if (/\.bin$/.test(s) && !fileSet.has(s.replace(/^\/+/, ''))) g.fail(`gl-manifest.json names ${s}, which is not in dist`);
  }
}
for (const page of pages) {
  for (const el of page.doc.elements) {
    const src = el.attrs.get('data-gl-src');
    if (src === undefined) continue;
    if (!manifest) g.warn(`${page.file}: data-gl-src="${src}" but src/data/gl-manifest.json does not exist yet (the poster stays)`);
    else if (!Object.prototype.hasOwnProperty.call(manifest, src)) g.fail(`${page.file}: data-gl-src="${src}" is not a key of gl-manifest.json`);
  }
  // the PASS lattice is exact (§9.5 item 4)
  for (const el of page.doc.elements) {
    if (el.attrs.has('data-count') && (el.attrs.get('class') ?? '').split(/\s+/).includes('lattice')) {
      if (Number(el.attrs.get('data-count')) !== facts['gt.pass'].value) g.fail(`${page.file}: lattice data-count ${el.attrs.get('data-count')} ≠ gt.pass ${facts['gt.pass'].value}`);
    }
  }
}

// first view of the home page (§8): html + fonts + JS + GL + commits.bin (lite) / field poster (static)
const fv = budgets.firstView;
const zhHome = firstView['zh-Hant'];
const enHome = firstView.en;
const gl = glBytes ?? 0;
if (zhHome) {
  cap('first view, zh home, lite', zhHome.htmlGz + zhHome.fonts + zhHome.liteGz + gl + commitsGz, fv.zhHomeLite);
  cap('first view, zh home, static', zhHome.htmlGz + zhHome.fonts + zhHome.statGz + posterGz, fv.zhHomeStatic);
}
if (enHome) {
  cap('first view, en home, lite', enHome.htmlGz + enHome.fonts + enHome.liteGz + gl + commitsGz, fv.enHomeLite);
  cap('first view, en home, static', enHome.htmlGz + enHome.fonts + enHome.statGz + posterGz, fv.enHomeStatic);
}

// ── headers: the CSP is current (every inline script hashed, nothing unsafe for scripts) ─────────────────
if (fileSet.has('_headers')) {
  const text = readFileSync(join(DIST, '_headers'), 'utf8');
  const csp = readCsp(text);
  if (!csp) g.fail('dist/_headers: no Content-Security-Policy in the /* block (postbuild scripts/headers.mjs)');
  else {
    const want = policy(collectHashes().hashes);
    if (csp !== want) g.fail('dist/_headers: the CSP does not match the inline scripts in dist (re-run scripts/headers.mjs)');
    const scriptSrc = /script-src([^;]*)/.exec(csp)?.[1] ?? '';
    if (/unsafe-inline|unsafe-eval|\*/.test(scriptSrc)) g.fail('dist/_headers: script-src allows unsafe-inline / unsafe-eval / *');
  }
  for (const rule of ['/_astro/*']) {
    if (!text.split('\n').some((l) => l.trim() === rule)) g.fail(`dist/_headers: the ${rule} cache rule is missing`);
  }
  if (!/Referrer-Policy/.test(text) || !/X-Content-Type-Options/.test(text)) g.fail('dist/_headers: security headers missing');
}

// ── sitemap.xml and robots.txt ─────────────────────────────────────────────────────────────────────────────
if (fileSet.has('sitemap.xml')) {
  const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  if (!/^<\?xml[^>]*\?>\s*<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/.test(xml)) g.fail('sitemap.xml: not a sitemap urlset');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const alts = [...xml.matchAll(/<xhtml:link\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]);
  const want = pages.filter((p) => p.kind !== 'nf' && p.kind !== 'other').map((p) => new URL(p.url, SITE).href);
  for (const w of want) if (!locs.includes(w)) g.fail(`sitemap.xml: missing ${w}`);
  for (const u of [...locs, ...alts]) {
    const r = resolveUrl(u, '/');
    if (!r.internal || !r.file) g.fail(`sitemap.xml: ${u} does not resolve to a page in dist`);
    else if (/404/.test(r.file)) g.fail(`sitemap.xml: lists the 404 page (${u})`);
  }
  if (!/hreflang="x-default"/.test(xml)) g.fail('sitemap.xml: no x-default alternate');
}
if (fileSet.has('robots.txt')) {
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  const m = /^Sitemap:\s*(\S+)/im.exec(robots);
  if (!m) g.fail('robots.txt: no Sitemap line');
  else if (!resolveUrl(m[1], '/').file) g.fail(`robots.txt: ${m[1]} does not resolve`);
}

// ── Workers static-asset limits ─────────────────────────────────────────────────────────────────────────────
if (files.length > 20000) g.fail(`${files.length} files in dist (Workers Free allows 20,000)`);
for (const f of files) if (size(f) > 25 * K * K) g.fail(`${distRel(f)} exceeds 25 MiB`);

g.done(`${pages.length} pages, ${files.length} files`);
