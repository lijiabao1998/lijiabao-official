// Not type-checked: @types/node is not a dependency (Node-only config file).
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { defineConfig, fontProviders } from 'astro/config';

/**
 * CJK glyph subsets (§2.2).
 * `scripts/glyphs.mjs` (prebuild) writes `src/data/glyphs.json` = { hero, display } from the dictionary.
 * If it is absent (first checkout, `astro dev` before a build), fall back to a tiny set so the Google
 * request always carries `&text=` — an empty glyph list would download the whole 4 MB family.
 */
const GLYPH_FALLBACK = {
  hero: '李家宝讓每個人，都有一座自己的實驗室。',
  display: '作品方法不是數字願景關於聯絡微光小鎮前沿實驗室',
};

/** Keep only characters Geist cannot render (CJK, full-width punctuation); dedupe; drop whitespace. */
/** @param {unknown} input */
function cjkOnly(input) {
  const out = new Set();
  for (const ch of String(input ?? '')) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0x2e80 && !/\s/u.test(ch)) out.add(ch);
  }
  return [...out].join('');
}

function readGlyphs() {
  let hero = '';
  let display = '';
  try {
    const raw = JSON.parse(readFileSync(new URL('./src/data/glyphs.json', import.meta.url), 'utf8'));
    hero = cjkOnly(raw?.hero);
    display = cjkOnly(raw?.display);
  } catch {
    /* file absent or unreadable: use the fallback below */
  }
  if (!hero) hero = cjkOnly(GLYPH_FALLBACK.hero);
  // The display subset never repeats a hero glyph (a heading can't mix two CJK fonts for one char).
  const heroSet = new Set(hero);
  display = [...(display || cjkOnly(GLYPH_FALLBACK.display))].filter((c) => !heroSet.has(c)).join('');
  if (!display) display = '一';
  return { hero, display };
}

const glyphs = readGlyphs();

/**
 * `.glsl` / `.vert` / `.frag` imports (with or without `?raw`) resolve to a default-exported,
 * comment-stripped source string. Newlines are kept so preprocessor lines (#version, #define) stay valid.
 */
function glsl() {
  const ext = /\.(glsl|vert|frag)$/;
  /** @param {string} src */
  const minify = (src) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n\r]*/g, '')
      .split(/\r?\n/)
      .map((l) => l.trim().replace(/[ \t]+/g, ' '))
      .filter(Boolean)
      .join('\n');
  return {
    name: 'lj:glsl',
    enforce: /** @type {const} */ ('pre'),
    /** @param {string} id */
    async load(id) {
      const [file, query = ''] = id.split('?');
      if (!ext.test(file)) return null;
      if (query && !/(^|&)raw(&|=|$)/.test(query)) return null;
      const src = await readFile(file, 'utf8');
      return { code: `export default ${JSON.stringify(minify(src))};`, map: null };
    },
  };
}

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://lijiabao.dev',
  // node_modules is shared between worktrees: keep every cache inside this checkout.
  cacheDir: './.cache/astro',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    // First paint without a render-blocking CSS request (budget counts inline CSS in HTML, §8).
    inlineStylesheets: 'always',
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  devToolbar: { enabled: false },
  i18n: {
    defaultLocale: 'zh-Hant',
    locales: ['zh-Hant', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  fonts: [
    {
      // Latin display + text. No generic fallback inside the variable: stacks are composed in
      // tokens.css so CJK glyphs fall through to the Noto subsets / system CJK, never to `sans-serif`.
      provider: fontProviders.google(),
      name: 'Geist',
      cssVariable: '--font-display',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: [],
    },
    {
      provider: fontProviders.google(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      weights: ['100 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: [],
    },
    {
      // Hero subset: the LCP h1 on zh pages. Preloaded on zh only (Base.astro).
      provider: fontProviders.google(),
      name: 'Noto Sans TC',
      cssVariable: '--font-cjk-hero',
      weights: ['100 900'],
      styles: ['normal'],
      fallbacks: [],
      optimizedFallbacks: false,
      options: { experimental: { glyphs: [glyphs.hero] } },
    },
    {
      // Display subset: CJK h2/h3, stage names, display lines. zh pages only, not preloaded.
      provider: fontProviders.google(),
      name: 'Noto Sans TC',
      cssVariable: '--font-cjk-display',
      weights: ['300 900'],
      styles: ['normal'],
      fallbacks: [],
      optimizedFallbacks: false,
      options: { experimental: { glyphs: [glyphs.display] } },
    },
  ],
  vite: {
    cacheDir: './.cache/vite',
    plugins: [glsl()],
  },
});
