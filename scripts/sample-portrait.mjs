#!/usr/bin/env node
// scripts/sample-portrait.mjs — the glimmer portrait (spec §6.2, build-overrides §3). Owner: S3.
//
// Input (private, gitignored, never shipped): src/assets/portrait.png (553 × 942). When it is absent (CI,
// Cloudflare builds) this script exits 0 and the committed outputs stay as they are. Deterministic: the same photo
// always yields byte-identical bins (content-hashed names).
//
// Outputs (committed):
//   public/gl/portrait-a.<hash>.bin   the first 4,096 points (lite; the start of every tier)
//   public/gl/portrait-b.<hash>.bin   the next 8,192 points (full tier only)
//   src/data/gl-manifest.json         read-modify-write: keys "portrait" (a) and "portrait-b" (b); other keys kept
//   src/data/portrait-meta.json       rows, aspect, counts, accent count, poster size
//   src/assets/generated/portrait-dots.{avif,webp}   the static poster: the first 6,144 points as soft glimmers,
//                                                    rendered at 880px wide with the scene's own shader maths
// Fails (exit 1) when an output exceeds its cap in src/data/budgets.ts.
//
// Pipeline (art direction below; the numeric core is src/gl/gen/portrait.ts):
//   head-and-shoulders crop (553 × 720) → perceptual luma → the person's silhouette (a hand-set polygon for this
//   photo, feathered: the background wall stays black, so glimmers only ever form the person) → p2–p98 stretch
//   inside it → local contrast → structural edges (+ fine edges in the curly hair) → density = tone^1.5 + edges +
//   a floor (the "even mapping" of §6.2: the dark hair and coat still read through their edges and highlights,
//   never a lit face out of black) → 180 baselines, stratified inverse-CDF x, a per-row spacing cap (dots never merge
//   into dashes) → the round glasses' rims as fixed points that lead every tier → prefix-stable order.
//   Not mirrored. No raster of the photo is ever written.
//
// Usage: node scripts/sample-portrait.mjs [--preview]   (--preview also writes .cache/portrait-preview*.png)

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'src/assets/portrait.png');
const GL_DIR = resolve(ROOT, 'public/gl');
const GEN_DIR = resolve(ROOT, 'src/assets/generated');
const MANIFEST = resolve(ROOT, 'src/data/gl-manifest.json');
const META = resolve(ROOT, 'src/data/portrait-meta.json');
const PREVIEW = process.argv.includes('--preview');

if (!existsSync(SRC)) {
  console.log('sample-portrait: no source photo (src/assets/portrait.png is private); keeping the committed outputs.');
  process.exit(0);
}

const { default: sharp } = await import('sharp');
const G = await import(pathToFileURL(resolve(ROOT, 'src/gl/gen/portrait.ts')).href);
const { PT } = G;
const { SIGMA } = await import(pathToFileURL(resolve(ROOT, 'src/gl/gen/glimmer.ts')).href);

/* ------------------------------------------------------------------ art direction for THIS photo (source px) */

// The person's silhouette, clockwise from the hair's left edge: hair crown, right temple and jaw, the coat collar and
// right shoulder, the frame's right and bottom edges, the coat's left edge and shoulder, the left lapel, neck, ear.
// Feathered below, so stray curls fade instead of being cut.
const SILHOUETTE = [
  75, 105, 86, 76, 101, 50, 126, 30, 150, 20, 200, 13, 250, 15, 282, 23, 310, 38, 330, 58, 345, 88, 351, 124,
  354, 165, 358, 200, 363, 217, 359, 240, 356, 262, 352, 285, 347, 305, 346, 318, 356, 324, 374, 340, 396, 358,
  424, 390, 455, 404, 500, 424, 553, 440, 553, 942, 0, 942, 0, 760, 6, 650, 18, 560, 30, 510, 55, 494, 78, 490,
  100, 467, 125, 437, 150, 402, 170, 374, 177, 362, 160, 346, 142, 332, 130, 326, 113, 320, 101, 302, 95, 277,
  97, 256, 93, 236, 83, 210, 75, 172, 72, 134,
];
// The round glasses, measured on the photo: two lens rims and the bridge as rotated ellipses
// (centre x, y, radius x, y; the frame follows the head's tilt, ≈ −10.6°). Their row crossings become fixed points
// that lead every tier, so the round glasses always read. Light comes from the left: the rims' upper-left arcs glint
// amber (edge byte 255), the rest stay --fg.
const TILT = (-10.6 * Math.PI) / 180;
const LENSES = [
  [206.4, 261.3, 39.5, 34],
  [313, 241, 39, 34],
];
const BRIDGE = [260, 247, 15, 16];
// The curly hair, down to the hairline and the temples: fine edges (the curls' highlights) count extra here.
const HAIR = [
  75, 105, 86, 76, 101, 50, 126, 30, 150, 20, 200, 13, 250, 15, 282, 23, 310, 38, 330, 58, 345, 88, 351, 124,
  354, 165, 352, 190, 338, 178, 318, 162, 296, 152, 268, 150, 240, 157, 212, 168, 186, 182, 164, 200, 148, 218,
  138, 244, 122, 250, 100, 246, 90, 228, 81, 204, 74, 170, 72, 134,
];
/** hair: fine-edge weight */
const HAIR_EDGE = 0.45;
/** the dots around each rim thin out (half-width in ellipse units, strength) so the round frames stay legible */
const RIM_CLEAR = 0.2;
const RIM_CLEAR_K = 0.9;
/** minimum mean dot spacing along a row for the full set (source px) */
const MIN_GAP = 2.0;
/** the photo this art direction was measured on */
const SRC_W = 553;
const SRC_H = 942;
/** rim half-thickness in ellipse units */
const RIM = 0.05;
/** dot spacing along a rim run (source px) */
const RIM_STEP = 3.2;
/** local-contrast gain */
const LOCAL = 0.9;
/** density: tone weight, tone exponent, edge weight, floor */
const TONE = 0.7;
const TONE_EXP = 1.5;
const EDGE = 0.35;
const FLOOR = 0.04;
/** the chest and coat carry fewer points than the head: weight falls to REST_W between these fractions of H */
const FOCUS_FROM = 0.55;
const FOCUS_TO = 0.85;
const REST_W = 0.6;
/** the coat dissolves into the page over the last part of the frame (fraction of H where the fade starts) */
const FADE_FROM = 0.8;
/** Poster raster width (px). */
const POSTER_W = 880;
/** Points on the static poster: fewer than full, at the lite dot size (the most legible stipple; fits ≤ 30 KB AVIF). */
const POSTER_POINTS = 6144;

/* ------------------------------------------------------------------ fields */

const probe = await sharp(SRC).metadata();
if (probe.width !== SRC_W || probe.height !== SRC_H) {
  console.error(`sample-portrait: expected a ${SRC_W}×${SRC_H} photo, got ${probe.width}×${probe.height}; update the art direction first.`);
  process.exit(1);
}
// head-and-shoulders: the full width, the top PT.H rows (below them the frame is only the dark coat)
const { data: px, info } = await sharp(SRC)
  .removeAlpha()
  .extract({ left: 0, top: 0, width: PT.W, height: PT.H })
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;

const luma = G.lumaOf(new Uint8Array(px.buffer, px.byteOffset, px.length), W, H, info.channels);
const hard = G.polygonMask(SILHOUETTE, W, H);
const mask = G.blur(hard, W, H, 3); // ≈ 9px feather
const flat = G.stretch(luma, 0.02, 0.98, hard);
// local contrast (unsharp mask) so eyes, brows, nostrils and the mouth line survive the baseline sampling
const soft = G.blur(flat, W, H, 10);
const lum = new Float32Array(W * H);
for (let i = 0; i < lum.length; i++) lum[i] = Math.min(1, Math.max(0, flat[i] + LOCAL * (flat[i] - soft[i])));
// structural edges (lapels, collar, jaw, curls), not fabric grain: Sobel on a softened tone map, then a soft threshold
const sob = G.sobel(G.blur(lum, W, H, 2), W, H);
const edge = new Float32Array(W * H);
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
for (let i = 0; i < edge.length; i++) edge[i] = smooth(0.12, 0.7, sob[i]);
// the curls: fine edges on the unsoftened tone map, inside the (feathered) hair region only
const hair = G.blur(G.polygonMask(HAIR, W, H), W, H, 3);
const fine = G.sobel(lum, W, H);

const cos = Math.cos(TILT);
const sin = Math.sin(TILT);
/** normalised distance from a rotated ellipse's centre (1 = on the rim) */
function ellipseD([cx, cy, rx, ry], x, y) {
  const dx = x - cx;
  const dy = y - cy;
  return Math.hypot((dx * cos + dy * sin) / rx, (-dx * sin + dy * cos) / ry);
}

// even mapping inside the person (§6.2): tone and edges share the density, so the dark hair and coat read through
// their edges and highlights instead of a lit face floating in black
const imp = new Float32Array(W * H);
for (let y = 0; y < H; y++) {
  const fy = y / H;
  const focus = 1 - (1 - REST_W) * smooth(FOCUS_FROM, FOCUS_TO, fy);
  const fade = fy <= FADE_FROM ? 1 : Math.pow(1 - (fy - FADE_FROM) / (1 - FADE_FROM), 1.6);
  for (let x = 0; x < W; x++) {
    const i = y * W + x;
    const curls = hair[i] * (HAIR_EDGE * smooth(0.1, 0.6, fine[i]) * Math.pow(lum[i], 0.6));
    imp[i] = mask[i] * focus * fade * (FLOOR + TONE * Math.pow(lum[i], TONE_EXP) + EDGE * edge[i] + curls);
  }
}
// a dark moat on both sides of each rim (applied after the density cap) keeps the round frames legible
const post = new Float32Array(W * H).fill(1);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    for (const L of LENSES) {
      const d = Math.abs(ellipseD(L, x + 0.5, y + 0.5) - 1);
      if (d < RIM_CLEAR) post[y * W + x] *= 1 - RIM_CLEAR_K * Math.pow(1 - d / RIM_CLEAR, 0.7);
    }
  }
}

/** Row crossings of a rotated ellipse's rim → fixed points (x normalised). `keep(nx, ny)` filters by position. */
function rim([cx, cy, rx, ry], keep = () => true) {
  const out = [];
  for (let r = 0; r < PT.ROWS; r++) {
    const y = ((r + 0.5) * H) / PT.ROWS;
    if (y < cy - ry - 6 || y > cy + ry + 6) continue;
    let run = null;
    const flush = () => {
      if (!run) return;
      const len = run[1] - run[0];
      const k = Math.max(1, Math.round(len / RIM_STEP));
      for (let j = 0; j < k; j++) {
        const x = run[0] + ((j + 0.5) / k) * len;
        const dx = x - cx;
        const dy = y - cy;
        const nx = (dx * cos + dy * sin) / rx;
        const ny = (-dx * sin + dy * cos) / ry;
        // light from the left: the upper-left arc glints amber
        const ang = Math.atan2(ny, nx);
        const glint = ang < -1.75 || ang > 2.95;
        out.push({ x: x / W, row: r, lum: 236, edge: glint ? PT.ACCENT : 254 });
      }
      run = null;
    };
    for (let x = cx - rx - 8; x <= cx + rx + 8; x += 0.25) {
      const dx = x - cx;
      const dy = y - cy;
      const nx = (dx * cos + dy * sin) / rx;
      const ny = (-dx * sin + dy * cos) / ry;
      const on = Math.abs(Math.hypot(nx, ny) - 1) < RIM && keep(nx, ny);
      if (on) run = run ? [run[0], x] : [x, x];
      else flush();
    }
    flush();
  }
  return out;
}
const fixed = [...rim(LENSES[0]), ...rim(LENSES[1]), ...rim(BRIDGE, (nx, ny) => ny < -0.45 && Math.abs(nx) < 0.8)];

const TOTAL = PT.A + PT.B;
const pts = G.sampleRows({ w: W, h: H, imp, lum, edge }, {
  total: TOTAL,
  rows: PT.ROWS,
  seed: PT.SEED,
  core: 0.6,
  minGap: MIN_GAP,
  post,
  fixed,
});
if (pts.n !== TOTAL) {
  console.error(`sample-portrait: sampled ${pts.n} points, expected ${TOTAL}`);
  process.exit(1);
}
let accents = 0;
for (let i = 0; i < pts.n; i++) if (pts.edge[i] === PT.ACCENT) accents++;

/* ------------------------------------------------------------------ bins + manifest */

const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
mkdirSync(GL_DIR, { recursive: true });
const binA = G.encode(pts, 0, PT.A);
const binB = G.encode(pts, PT.A, PT.B);
const nameA = `portrait-a.${hash(binA)}.bin`;
const nameB = `portrait-b.${hash(binB)}.bin`;
for (const f of readdirSync(GL_DIR)) {
  if (/^portrait-[ab]\.[0-9a-f]{8}\.bin$/.test(f) && f !== nameA && f !== nameB) rmSync(resolve(GL_DIR, f));
}
writeFileSync(resolve(GL_DIR, nameA), binA);
writeFileSync(resolve(GL_DIR, nameB), binB);

let manifest = {};
if (existsSync(MANIFEST)) {
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    console.error('sample-portrait: src/data/gl-manifest.json is not valid JSON; refusing to overwrite it.');
    process.exit(1);
  }
}
manifest.portrait = `/gl/${nameA}`;
manifest['portrait-b'] = `/gl/${nameB}`;
const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
writeFileSync(MANIFEST, `${JSON.stringify(sorted, null, 2)}\n`);

/* ------------------------------------------------------------------ poster (all points, assembled) */

// The scene's own maths on the CPU (gl/shaders/portrait.vert + point.frag at rest, uAssemble = 1): every point is a
// gaussian glimmer, σ = SIGMA × mix(size0, size1, lum) CSS px, alpha = peak × mix(alpha0, 1, lum) × the twinkle's
// mean, windowed to 0 at 2.4σ, composited premultiplied "over" in draw order (the engine's ONE, ONE_MINUS_SRC_ALPHA)
// and then over --bg (a pixel-for-pixel check against the GL scene at the same size differs by ~1 grey level on
// average: the twinkle). The GL points keep their CSS size on any stage while the poster scales with it, so it is drawn
// for a POSTER_STAGE-wide stage, between a phone's ≈340px and a desktop's ≈560–660px: the poster → canvas handoff
// shows the same soft light at the same brightness within a few percent. No halo (the lite look).
const POSTER_STAGE = 450;
const PH = Math.round((POSTER_W * H) / W);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const BG = hex('#0B0B0C');
const FG = hex('#EDEBE6');
const GLIM = hex('#FFB547');
/** portrait.vert's twinkle, .9 + .1 sin(…), averages .9 */
const TWINKLE = 0.9;
const mix = (a, b, t) => a + (b - a) * t;

/** The first `count` points rendered `width` px wide (RGB, 8-bit); `scale` = poster px per CSS px. */
function renderDots(count, width, scale, look, peak) {
  const [s0, s1] = look;
  const height = Math.round((width * H) / W);
  // the canvas: premultiplied rgb and alpha, starting transparent
  const C = [0, 1, 2].map(() => new Float32Array(width * height));
  const A = new Float32Array(width * height);
  for (let i = 0; i < Math.min(count, pts.n); i++) {
    const tone = pts.lum[i] / 255;
    const accent = pts.edge[i] === PT.ACCENT;
    const col = accent ? GLIM : FG;
    const a0 = mix(G.LOOK.alpha0, 1, tone) * TWINKLE * (accent ? 1 : peak);
    const sig = mix(s0, s1, tone) * SIGMA * scale;
    const R = 2.4 * sig;
    const cx = pts.x[i] * width;
    const cy = pts.y[i] * height;
    const k = 0.5 / (sig * sig);
    for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(height - 1, Math.ceil(cy + R)); y++) {
      for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(width - 1, Math.ceil(cx + R)); x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const r2 = dx * dx + dy * dy;
        const q = r2 / (R * R);
        if (q >= 1) continue;
        const t = Math.min(1, Math.max(0, (q - 0.45) / 0.55));
        const a = Math.min(1, a0 * Math.exp(-r2 * k) * (1 - t * t * (3 - 2 * t)));
        const o = y * width + x;
        // ONE, ONE_MINUS_SRC_ALPHA
        for (let c = 0; c < 3; c++) C[c][o] = col[c] * a + C[c][o] * (1 - a);
        A[o] = a + A[o] * (1 - a);
      }
    }
  }
  const out = Buffer.alloc(width * height * 3);
  for (let o = 0; o < width * height; o++) {
    // the premultiplied canvas over the page: rgb + bg · (1 − alpha)
    for (let c = 0; c < 3; c++) out[o * 3 + c] = Math.round(Math.min(1, C[c][o] + BG[c] * (1 - A[o])) * 255);
  }
  return { data: out, width, height };
}

const dots = renderDots(POSTER_POINTS, POSTER_W, POSTER_W / POSTER_STAGE, G.LOOK.lite, G.LOOK.peak.lite);
const raster = sharp(dots.data, { raw: { width: dots.width, height: dots.height, channels: 3 } });

mkdirSync(GEN_DIR, { recursive: true });
const avif = await raster.clone().avif({ quality: 44, effort: 9, chromaSubsampling: '4:2:0' }).toBuffer();
const webp = await raster.clone().webp({ quality: 64, effort: 6 }).toBuffer();
writeFileSync(resolve(GEN_DIR, 'portrait-dots.avif'), avif);
writeFileSync(resolve(GEN_DIR, 'portrait-dots.webp'), webp);

/* ------------------------------------------------------------------ meta */

const meta = {
  rows: PT.ROWS,
  aspect: `${W}/${H}`,
  a: PT.A,
  b: PT.B,
  poster: { points: POSTER_POINTS, width: POSTER_W, height: PH },
  accents,
  seed: `0x${PT.SEED.toString(16).toUpperCase()}`,
};
writeFileSync(META, `${JSON.stringify(meta, null, 2)}\n`);

if (PREVIEW) {
  const out = resolve(ROOT, '.cache');
  mkdirSync(out, { recursive: true });
  await raster.clone().png().toFile(resolve(out, 'portrait-preview.png'));
  // what a ~560px stage shows at DPR 1 (no halo): lite (first 4,096), mobile full (8,192), full (12,288)
  for (const n of [PT.A, PT.B, pts.n]) {
    const full = n > PT.A;
    const r = renderDots(n, 560, 1, full ? G.LOOK.full : G.LOOK.lite, full ? G.LOOK.peak.full : G.LOOK.peak.lite);
    await sharp(r.data, { raw: { width: r.width, height: r.height, channels: 3 } })
      .png()
      .toFile(resolve(out, `portrait-preview-${n}.png`));
  }
  // silhouette overlay (diagnostic only; stays in .cache, never committed)
  const ov = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    ov[i * 4] = 0;
    ov[i * 4 + 1] = 255;
    ov[i * 4 + 2] = 0;
    ov[i * 4 + 3] = Math.round((1 - mask[i]) * 150);
  }
  await sharp(SRC)
    .composite([{ input: ov, raw: { width: W, height: H, channels: 4 } }])
    .png()
    .toFile(resolve(out, 'portrait-mask.png'));
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const { budgets } = await import(pathToFileURL(resolve(ROOT, 'src/data/budgets.ts')).href);
const over = [
  ['portrait-a.bin', binA.length, budgets.bins.portraitA],
  ['portrait-b.bin', binB.length, budgets.bins.portraitB],
  ['portrait-dots.avif', avif.length, budgets.posters.portraitAvif],
].filter(([, size, cap]) => size > cap * 1024);
for (const [name, size, cap] of over) console.error(`sample-portrait: ${name} is ${kb(size)} (cap ${cap} KB, budgets.ts)`);
console.log(
  `sample-portrait: ${pts.n} points on ${PT.ROWS} rows (${accents} accents) → ${nameA} ${kb(binA.length)}, ` +
    `${nameB} ${kb(binB.length)}; poster avif ${kb(avif.length)}, webp ${kb(webp.length)}`,
);
if (over.length) process.exit(1);
