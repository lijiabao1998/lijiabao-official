#!/usr/bin/env node
// scripts/og.mjs — the six Open Graph cards (1200 × 630): public/og/{zh,en}-{home,gt,fr}.png (Seo.astro links
// them; the 404 reuses the home card). Build-prep, run by hand after `npm run build`; the PNGs are committed
// (build-overrides §2: sharp from SVG, no browser). Not part of `npm run build`: the text is set with the fonts
// of THIS machine's build (Geist, Geist Mono) plus the system Noto Sans TC, which CI does not have.
//
// Every mark on a card is a record, as on the site (law 1 「先有紀錄，才有光」):
//   home — every default-branch commit of snapshot.json on its repo lane, placed by time (the axis is compressed
//          before 2026-09-13, marked with a break), the latest commit of each lane amber;
//   gt   — the 12,513 PASS cells as the isometric lattice of the site (cell i at (i mod 112, i div 112));
//   fr   — the governance core and 15 rows × 10 problem cards, ◆ on each lab's first-round card.
// Every word comes from the dictionary (src/i18n) and every number from facts.ts / the snapshot. No seal, no
// paper, no glow: flat --bg, hairlines, points; amber only for the wordmark dot and the latest commits.
//
// Fonts: sharp's FreeType cannot read WOFF2, so the Geist / Geist Mono latin files that the Fonts API put in
// dist/_astro/fonts are decoded to TrueType (scripts/lib/woff2.mjs) into a temp folder and registered with
// fontconfig; librsvg then sets the SVG text with them. CJK falls through to the system Noto Sans TC. The script
// fails if the Geist faces do not take (it measures a known string against the fallback).
// Usage: npm run build && node scripts/og.mjs

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { DIST, ROOT, imp, rel } from './lib/gate.mjs';
import { readPage } from './lib/html.mjs';
import { woff2ToSfnt } from './lib/woff2.mjs';

const OUT = join(ROOT, 'public', 'og');
// fontconfig on Windows cannot open a font file whose path has non-ASCII characters (this repo lives under a
// CJK folder name), so the decoded fonts go to the OS temp directory.
const FONT_CACHE = join(tmpdir(), 'lijiabao-og-fonts');
const W = 1200;
const H = 630;
const M = 64; // side margin (--s-8)

// tokens.css (§2.1)
const C = {
  bg: '#0B0B0C',
  fg: '#EDEBE6',
  fg2: '#A8A59E',
  fg3: '#827F79',
  line: '#2A2A2D',
  lineUi: '#6A6964',
  glim: '#FFB547',
};
const FAMILY = {
  sans: 'Geist, Noto Sans TC',
  mono: 'Geist Mono, Noto Sans TC',
};

const { t, tStr, tList } = await imp('src/i18n/t.ts');
const { facts, SNAPSHOT } = await imp('src/data/facts.ts');
const { REPOS } = await imp('src/data/repos.ts');
const { LABS } = await imp('src/data/labs.ts');
const { SITE_URL } = await imp('src/data/links.ts');
const snapshot = JSON.parse(readFileSync(join(ROOT, 'src/data/snapshot.json'), 'utf8'));

const LOCALES = [
  { locale: 'zh-Hant', tag: 'zh' },
  { locale: 'en', tag: 'en' },
];

// ── fonts ───────────────────────────────────────────────────────────────────────────────────────────────
async function prepareFonts() {
  const home = join(DIST, 'index.html');
  if (!existsSync(home)) throw new Error('og: dist/index.html not found; run `npm run build` first (the Geist files come from the build)');
  const doc = readPage(readFileSync(home, 'utf8'));
  const css = doc.styles.map((s) => s.content).join('\n');
  const vars = new Map([...css.matchAll(/(--font-[\w-]+)\s*:\s*([^;}]+)/g)].map((m) => [m[1], m[2].trim().replace(/^["']|["']$/g, '')]));
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => ({
    family: (/font-family\s*:\s*([^;]+)/.exec(m[1])?.[1] ?? '').trim().replace(/^["']|["']$/g, ''),
    url: /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(m[1])?.[1] ?? '',
    range: /unicode-range\s*:\s*([^;]+)/.exec(m[1])?.[1] ?? '',
  }));
  // the latin face of each family (its unicode-range starts at U+0000)
  const latin = (cssVar) => {
    const fam = vars.get(cssVar);
    const face = faces.find((f) => f.family === fam && /U\+0000-00FF/i.test(f.range)) ?? faces.find((f) => f.family === fam);
    if (!face) throw new Error(`og: no @font-face for ${cssVar} in dist/index.html`);
    return join(DIST, face.url.replace(/^\/+/, ''));
  };
  mkdirSync(FONT_CACHE, { recursive: true });
  const out = [];
  for (const [name, cssVar] of [
    ['geist', '--font-display'],
    ['geist-mono', '--font-mono'],
  ]) {
    const ttf = join(FONT_CACHE, `${name}.ttf`);
    writeFileSync(ttf, woff2ToSfnt(readFileSync(latin(cssVar))));
    // registering happens as a side effect of rendering with `fontfile` (libvips adds it to fontconfig)
    await sharp({ text: { text: '.', font: 'Geist 8', fontfile: ttf, rgba: true } }).png().toBuffer();
    out.push(ttf);
  }
  // proof that fontconfig took them: a monospaced face sets "iiiiiiii" as wide as "MMMMMMMM"; the fallback does not
  const mono = { size: 40, family: 'Geist Mono' };
  const [wi, wm] = [await measure('iiiiiiii', mono), await measure('MMMMMMMM', mono)];
  if (Math.abs(wi - wm) > 0.1 * wm) throw new Error(`og: Geist Mono did not register with fontconfig (${wi} vs ${wm} px); check ${FONT_CACHE}`);
  const [wg, wn] = [await measure('GlimmerTown', { size: 40, family: 'Geist' }), await measure('GlimmerTown', { size: 40, family: 'Noto Sans TC' })];
  if (wg === wn) throw new Error('og: Geist did not register with fontconfig');
  return out;
}

// ── text helpers ─────────────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Ink width in px of a run, measured by rendering exactly the <text> the card uses and reading where its ink ends
 * (Pango's own extents run a few percent short of what librsvg paints).
 */
const widthCache = new Map();
async function measure(str, { size, weight = 400, family = FAMILY.sans, ls = 0 }) {
  const key = `${str}|${size}|${weight}|${family}|${ls}`;
  if (widthCache.has(key)) return widthCache.get(key);
  const pad = 8;
  const w = Math.ceil(size * [...str].length * 1.4 + 2 * pad);
  const h = Math.ceil(size * 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${text(pad, size * 1.4, str, { size, weight, family, ls, fill: '#fff' })}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let right = pad;
  for (let x = info.width - 1; x >= 0 && right === pad; x--) {
    for (let y = 0; y < info.height; y++) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        right = x + 1;
        break;
      }
    }
  }
  const width = right - pad;
  widthCache.set(key, width);
  return width;
}

function text(x, y, str, { size, weight = 400, fill = C.fg, family = FAMILY.sans, ls = 0, anchor = 'start', lang } = {}) {
  return `<text x="${r2(x)}" y="${r2(y)}" font-family="${esc(family)}" font-size="${size}" font-weight="${weight}"${ls ? ` letter-spacing="${r2(ls)}"` : ''} fill="${fill}"${anchor !== 'start' ? ` text-anchor="${anchor}"` : ''}${lang ? ` xml:lang="${lang}"` : ''}>${esc(str)}</text>`;
}

/** Two or three balanced lines (like `text-wrap: balance`) for a Latin display string. */
async function balance(str, style, maxWidth) {
  const words = str.split(/\s+/).filter(Boolean);
  const full = await measure(str, style);
  if (full <= maxWidth || words.length < 2) return [str];
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const w = Math.max(await measure(a, style), await measure(b, style));
    if (w <= maxWidth && (!best || w < best.w)) best = { w, lines: [a, b] };
  }
  return best ? best.lines : [str];
}

/** The site's wordmark: 李家宝● / Li Jiabao● (amber dot on the baseline, §3). */
async function wordmark(locale, y) {
  const name = tStr('site.name', locale);
  const style = { size: 30, weight: locale === 'en' ? 560 : 600 };
  const w = await measure(name, style);
  const d = style.size * 0.3;
  return (
    text(M, y, name, { ...style, ls: locale === 'en' ? -0.3 : 0 }) +
    `<circle cx="${r2(M + w + style.size * 0.12 + d / 2)}" cy="${r2(y - d / 2)}" r="${r2(d / 2)}" fill="${C.glim}"/>`
  );
}

/** Top row: wordmark left, the domain right (mono, --fg-3). */
async function topRow(locale) {
  return (await wordmark(locale, 86)) + text(W - M, 84, new URL(SITE_URL).host, { size: 17, family: FAMILY.mono, fill: C.fg3, anchor: 'end', ls: 0.6 });
}

/**
 * X (Twitter) lays the page title over the BOTTOM-LEFT of a large-image card as a pill (≈ x 0–450, y 550–615 on
 * this 1200 × 630 canvas for our longest title, 「微光小鎮 GlimmerTown — 李家宝」), so nothing may be drawn there:
 * the caption row hid under it. Keep this box empty on every card.
 */
const X_TITLE_SAFE = { right: 490, top: 540 };
/** Widest caption line before it breaks after its first comma (keeps the row clear of X_TITLE_SAFE). */
const CAPTION_MAX = 560;

/**
 * The DATA chip (pill, 1px --line-ui, mono) and the caption, set RIGHT-aligned to the margin so the bottom-left
 * stays free for X's title pill. A caption wider than CAPTION_MAX breaks after its first comma; `yLast` is the
 * baseline of the last line and extra lines stack upward. Returns svg.
 */
async function captionRow(locale, captionKey, yLast) {
  const chip = tStr('chip.DATA', locale);
  const chipStyle = { size: 13, weight: 500, family: FAMILY.mono, ls: 0.8 };
  const capStyle = { size: 21, fill: C.fg2, ls: locale === 'en' ? 0 : 0.4 };
  const label = locale === 'en' ? chip.toUpperCase() : chip;
  const cw = (await measure(label, chipStyle)) + 22;
  const ch = 26;
  const lh = 31;
  const cap = tStr(captionKey, locale);
  let lines = [cap];
  if ((await measure(cap, capStyle)) > CAPTION_MAX) {
    const m = /，|,(?!\d)\s*/.exec(cap); // a clause comma — never the thousands comma in 1,946
    if (m) lines = [cap.slice(0, m.index + 1), cap.slice(m.index + m[0].length)];
  }
  const right = W - M;
  const y0 = yLast - (lines.length - 1) * lh;
  const w0 = await measure(lines[0], capStyle);
  const chipX = right - w0 - 16 - cw;
  if (chipX < X_TITLE_SAFE.right && yLast + 8 > X_TITLE_SAFE.top) {
    throw new Error(`[og] ${locale} ${captionKey}: caption reaches into X's title area (x ${Math.round(chipX)})`);
  }
  let svg =
    `<rect x="${r2(chipX + 0.5)}" y="${r2(y0 - ch + 7.5)}" width="${r2(cw)}" height="${ch}" rx="${ch / 2}" fill="none" stroke="${C.lineUi}"/>` +
    text(chipX + 11, y0, label, { ...chipStyle, fill: C.fg2 });
  lines.forEach((line, i) => {
    svg += text(right, y0 + i * lh, line, { ...capStyle, anchor: 'end' });
  });
  return svg;
}

/**
 * A legend string with one glyph (●, ◆ or ○) drawn as a shape, set right-aligned so it ends exactly at `xRight`:
 * the text after the glyph is end-anchored there, the glyph and the text before it are placed leftwards from it.
 */
async function legend(str, xRight, y, { amber = false } = {}) {
  const m = /[●◆○]/.exec(str);
  const style = { size: 14, family: FAMILY.mono, ls: 0.4 };
  if (!m) return text(xRight, y, str, { ...style, fill: C.fg3, anchor: 'end' });
  const before = str.slice(0, m.index).replace(/\s+$/, '');
  const after = str.slice(m.index + 1).replace(/^\s+/, '');
  const gap = 8;
  const glyph = 9;
  let x = xRight;
  let out = '';
  if (after) {
    out += text(x, y, after, { ...style, fill: C.fg3, anchor: 'end' });
    x -= (await measure(after, style)) + gap;
  }
  const cx = x - glyph / 2;
  const cy = y - 4.5;
  const fill = amber ? C.glim : C.fg;
  if (m[0] === '●') out += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="3.4" fill="${fill}"/>`;
  else if (m[0] === '○') out += `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="4" fill="none" stroke="${C.fg2}" stroke-width="1.25"/>`;
  else out += `<path d="M${r2(cx)} ${r2(cy - 4.6)}l4.6 4.6l-4.6 4.6l-4.6-4.6z" fill="${C.fg}"/>`;
  x -= glyph + gap;
  if (before) out += text(x, y, before, { ...style, fill: C.fg3, anchor: 'end' });
  return out;
}

const frame = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${C.bg}"/>${body}</svg>`;

// ── home: the record ──────────────────────────────────────────────────────────────────────────────────────
const TZ_OFFSET = '+08:00'; // Asia/Taipei (snapshot.tz)
const AXIS_START = Date.parse(`2026-07-12T00:00:00${TZ_OFFSET}`);
const AXIS_BREAK = Date.parse(`2026-09-13T00:00:00${TZ_OFFSET}`); // hero.fig.caption: compressed before this day
const BREAK_AT = 0.3; // share of the axis given to the compressed segment

function hash32(s) {
  return createHash('sha1').update(s).digest().readUInt32BE(0);
}

async function home(locale) {
  const end = Date.parse(snapshot.generatedAt);
  const x0 = M;
  const x1 = W - M;
  const axisX = (ms) => {
    const f = ms < AXIS_BREAK ? (BREAK_AT * (ms - AXIS_START)) / (AXIS_BREAK - AXIS_START) : BREAK_AT + ((1 - BREAK_AT) * (ms - AXIS_BREAK)) / (end - AXIS_BREAK);
    return x0 + (x1 - x0) * Math.min(1, Math.max(0, f));
  };
  // 20 rows: the three GlimmerTown lanes, a spacer, governance and the 15 labs (§6.1 lane order)
  const band = { top: 312, rowH: 10 };
  const rows = REPOS.map((r, i) => ({ repo: r, row: i < 3 ? i : i + 1 }));
  let lanes = '';
  let dots = '';
  let latest = '';
  let count = 0;
  for (const { repo, row } of rows) {
    const cy = band.top + row * band.rowH + band.rowH / 2;
    lanes += `<line x1="${x0}" y1="${cy}" x2="${x1}" y2="${cy}" stroke="${C.line}" stroke-width="1"/>`;
    const commits = snapshot.repos[repo.id] ?? [];
    commits.forEach(([iso, sha], i) => {
      count++;
      const x = axisX(Date.parse(iso));
      const jitter = ((hash32(sha) % 1000) / 1000 - 0.5) * band.rowH * 0.62;
      if (i === commits.length - 1) latest += `<circle cx="${r2(x)}" cy="${r2(cy)}" r="3.1" fill="${C.glim}"/>`;
      else dots += `<circle cx="${r2(x)}" cy="${r2(cy + jitter)}" r="1.3"/>`;
    });
  }
  if (count !== facts['commits.total'].value) throw new Error(`og: drew ${count} commits, facts say ${facts['commits.total'].value}`);

  // axis: hairline, end ticks, the compression break, three dates (data, not copy)
  const ay = band.top + 20 * band.rowH + 16;
  const bx = axisX(AXIS_BREAK);
  const day = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: snapshot.tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);
  const tick = (x) => `<line x1="${r2(x)}" y1="${ay - 4}" x2="${r2(x)}" y2="${ay + 4}" stroke="${C.fg3}"/>`;
  const axis =
    `<line x1="${x0}" y1="${ay}" x2="${r2(bx - 5)}" y2="${ay}" stroke="${C.lineUi}"/><line x1="${r2(bx + 5)}" y1="${ay}" x2="${x1}" y2="${ay}" stroke="${C.lineUi}"/>` +
    `<path d="M${r2(bx - 6)} ${ay + 5}l4-10M${r2(bx + 2)} ${ay + 5}l4-10" stroke="${C.fg3}" fill="none"/>` +
    tick(x0) +
    tick(x1) +
    text(x0, ay + 22, day(AXIS_START), { size: 13, family: FAMILY.mono, fill: C.fg3, ls: 0.4 }) +
    text(bx, ay + 22, day(AXIS_BREAK), { size: 13, family: FAMILY.mono, fill: C.fg3, ls: 0.4, anchor: 'middle' }) +
    text(x1, ay + 22, SNAPSHOT.asOf, { size: 13, family: FAMILY.mono, fill: C.fg3, ls: 0.4, anchor: 'end' });

  // the owner's line (authored lines in zh; balanced in en)
  const zh = locale === 'zh-Hant';
  const style = zh ? { size: 70, weight: 600, ls: 0 } : { size: 74, weight: 560, ls: -3.4 };
  const value = t('hero.line', locale);
  const lines = zh && Array.isArray(value) ? value : await balance(tStr('hero.line', locale), style, W - 2 * M);
  const lh = zh ? 80 : 74;
  const y1 = zh ? 184 : 180;
  const title = lines.map((l, i) => text(M, y1 + i * lh, l, style)).join('');

  // zh writes 「（預設分支）· ●…」 with no space before the dot, so split on the dot, not on ' · '
  const legendParts = tStr('hero.fig.legend', locale).split(/\s*·\s*/);
  const amberNote = legendParts[1] ?? '';

  return frame(
    (await topRow(locale)) +
      title +
      `<g>${lanes}</g><g fill="${C.fg}" fill-opacity="0.62">${dots}</g><g>${latest}</g>` +
      axis +
      // the amber legend keys the plot from above its top-right corner; the caption row sits bottom-right
      (amberNote ? await legend(amberNote, W - M, band.top - 14, { amber: true }) : '') +
      (await captionRow(locale, 'meta.og.home', 610)),
  );
}

// ── gt: the PASS lattice ──────────────────────────────────────────────────────────────────────────────────
async function gt(locale) {
  const count = facts['gt.pass'].value;
  const cols = 112;
  const rows = Math.ceil(count / cols);
  // The isometric diamond of LatticeCss / gl/gen/grid.ts: cell i at plane (i mod cols, i div cols), the plane
  // turned 45° and squashed to 2:1, so plane (gx, gy) → x = (gx − gy)·s, y = (gx + gy)·s/2 with s = width/(cols+rows).
  // Each cell is a rhombus filling 62% of its pitch (LatticeCss --g: 0.19); the tail of the last row stays empty.
  const width = 560;
  const s = width / (cols + rows);
  const cx = W - M - width / 2; // the diamond's centre line
  const cyMid = 322;
  const x0 = cx - ((cols - rows) * s) / 2; // plane origin (top corner) so the diamond is centred on cx
  const y0 = cyMid - ((cols + rows) * s) / 4;
  const hw = s * 0.62;
  const hh = s * 0.31;
  let d = '';
  for (let i = 0; i < count; i++) {
    const gx = i % cols;
    const gy = Math.floor(i / cols);
    const x = x0 + (gx - gy) * s;
    const y = y0 + (gx + gy + 1) * (s / 2);
    d += `M${r2(x)} ${r2(y - hh)}l${r2(hw)} ${r2(hh)}l${r2(-hw)} ${r2(hh)}l${r2(-hw)} ${r2(-hh)}z`;
  }
  const zh = locale === 'zh-Hant';
  const titleStyle = zh ? { size: 96, weight: 600 } : { size: 84, weight: 560, ls: -3.6 };
  return frame(
    (await topRow(locale)) +
      text(M, 196, tStr('gt.label', locale), { size: 15, weight: 500, family: FAMILY.mono, fill: C.fg3, ls: zh ? 1.2 : 0.9 }) +
      text(M, zh ? 300 : 292, tStr('gt.title', locale), titleStyle) +
      text(M, zh ? 358 : 348, tStr('gt.tagline', locale), { size: 30, weight: 400, fill: C.fg2, ls: zh ? 0.6 : -0.3 }) +
      text(M, 470, tStr('gt.pass.title', locale), { size: 56, weight: 300, family: FAMILY.mono, fill: C.fg, ls: -1.1 }) +
      `<path d="${d}" fill="${C.fg}" fill-opacity="0.9"/>` +
      (await captionRow(locale, 'meta.og.gt', 556)) +
      (await legend(tStr('gt.pass.legend', locale), W - M, 590)),
  );
}

// ── fr: governance + 15 × 10 problem cards ────────────────────────────────────────────────────────────────
async function fr(locale) {
  const pitchY = 21;
  const pitchX = 37;
  const top = 168;
  const spineX = 676;
  const labelX = 692;
  const cardX = 758;
  const midY = top + (pitchY * (LABS.length - 1)) / 2;
  let g = '';
  // governance core: one disc on the left, joined to the spine that reaches every lab row
  g += `<line x1="${spineX}" y1="${top}" x2="${spineX}" y2="${top + pitchY * (LABS.length - 1)}" stroke="${C.lineUi}"/>`;
  g += `<line x1="${spineX - 26}" y1="${midY}" x2="${spineX}" y2="${midY}" stroke="${C.lineUi}"/>`;
  g += `<circle cx="${spineX - 34}" cy="${midY}" r="8" fill="${C.fg}"/>`;
  LABS.forEach((lab, row) => {
    const y = top + row * pitchY;
    g += `<line x1="${spineX}" y1="${y}" x2="${labelX - 6}" y2="${y}" stroke="${C.lineUi}"/>`;
    const prefix = lab.cards[0]?.split('-')[0] ?? lab.id.toUpperCase();
    g += text(labelX, y + 4.5, prefix, { size: 12, weight: 500, family: FAMILY.mono, fill: C.fg3, ls: 0.6 });
    lab.cards.forEach((id, col) => {
      const x = cardX + col * pitchX;
      if (id === lab.first) g += `<path d="M${x} ${y - 6.2}l6.2 6.2l-6.2 6.2l-6.2-6.2z" fill="${C.fg}"/>`;
      else g += `<circle cx="${x}" cy="${y}" r="5.4" fill="none" stroke="${C.fg2}" stroke-width="1.25"/>`;
    });
  });
  const cards = LABS.reduce((n, l) => n + l.cards.length, 0);
  if (cards !== facts['fr.cards'].value) throw new Error(`og: drew ${cards} cards, facts say ${facts['fr.cards'].value}`);
  const zh = locale === 'zh-Hant';
  const titleStyle = zh ? { size: 96, weight: 600 } : { size: 84, weight: 560, ls: -3.6 };
  return frame(
    (await topRow(locale)) +
      text(M, 196, tStr('fr.label', locale), { size: 15, weight: 500, family: FAMILY.mono, fill: C.fg3, ls: zh ? 1.2 : 0.9 }) +
      text(M, zh ? 300 : 292, tStr('fr.title', locale), titleStyle) +
      tList('fr.chips', locale)
        .slice(0, 3)
        .map((c, i) => text(M, (zh ? 372 : 364) + i * 40, c, { size: 26, weight: 400, fill: C.fg2, ls: zh ? 0.5 : -0.2 }))
        .join('') +
      g +
      (await captionRow(locale, 'meta.og.fr', 556)) +
      (await legend(tStr('fr.matrix.legend', locale), W - M, 590)),
  );
}

// ── render ────────────────────────────────────────────────────────────────────────────────────────────────
await prepareFonts();
mkdirSync(OUT, { recursive: true });
const CARDS = { home, gt, fr };
// card URL path → content hash; Seo.astro appends it as ?v= so X/Facebook refetch a regenerated card
const manifest = {};
for (const { locale, tag } of LOCALES) {
  for (const [page, make] of Object.entries(CARDS)) {
    const svg = await make(locale);
    const file = join(OUT, `${tag}-${page}.png`);
    const png = await sharp(Buffer.from(svg), { density: 72 })
      .png({ palette: true, quality: 95, effort: 10, compressionLevel: 9 })
      .toBuffer({ resolveWithObject: true });
    writeFileSync(file, png.data);
    manifest[`/og/${tag}-${page}.png`] = createHash('sha1').update(png.data).digest('hex').slice(0, 8);
    process.stdout.write(`og: ${rel(file)} ${png.info.width}×${png.info.height} ${(png.info.size / 1024).toFixed(1)} KB\n`);
  }
}
writeFileSync(join(ROOT, 'src', 'data', 'og-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`og: ${rel(join(ROOT, 'src', 'data', 'og-manifest.json'))}\n`);
