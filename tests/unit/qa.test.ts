// S6: the QA gates' building blocks (scripts/lib/*) and the sitemap endpoint. The gates themselves run in
// `npm run build:prod`; these pin the rules they apply so a refactor cannot quietly weaken them.
// (No node:* imports here: the project has no @types/node, so file access goes through the untyped .mjs helpers.)
import { describe, expect, it } from 'vitest';
import { FLAG_RE, factPlaceholders, findViolations, strayDigits, stripComments } from '../../scripts/lib/rules.mjs';
import { cspHash, inlineScripts, readPage } from '../../scripts/lib/html.mjs';
import { policy, readCsp, withCsp } from '../../scripts/lib/csp.mjs';
import { DIST, bytes, walk } from '../../scripts/lib/gate.mjs';
import { woff2ToSfnt } from '../../scripts/lib/woff2.mjs';
import { literals } from '@data/facts';
import { GET } from '../../src/pages/sitemap.xml';

type Hit = { id: string };
type Text = { text: string; lang: string; dir: string };

const ids = (text: string, allow?: { vendors?: boolean; names?: boolean }): string[] =>
  (findViolations(text, allow) as Hit[]).map((v) => v.id);

describe('copy rules', () => {
  it('flags every NEVER-publish item of build-overrides §1', () => {
    expect(ids('跨域的預測與風險編排')).toContain('never.cross-domain');
    expect(ids('202606050549 This is the thing from started.')).toContain('never.started');
    expect(ids('無岸.共見')).toContain('never.wuan');
    expect(ids('Change lives. Change organizations. Change the world.')).toContain('never.gsb');
    expect(ids('立德立言，無問西東')).toContain('never.lide');
    expect(ids('Senior data scientist')).toContain('job-title');
    expect(ids('AI-generated portrait')).toContain('ai-caption');
    expect(ids('https://x.com/LeonLRedfield')).toContain('x-link');
  });

  it('flags seals and stamps, not ordinary words that contain them', () => {
    expect(ids('李家寳印')).toContain('seal');
    expect(ids('a red seal on paper')).toContain('seal');
    expect(ids('timestamps, sealed tests, Engineering, FrontierEngineering')).toEqual([]);
  });

  it('flags flag emoji, one hit per flag', () => {
    expect(ids('Taiwan 🇹🇼')).toEqual(['flag']);
    expect(FLAG_RE.test('🏳️')).toBe(true);
    expect(FLAG_RE.test('● ◆ ○ → ↗')).toBe(false);
  });

  it('allows vendor names and name variants only when asked', () => {
    expect(ids('Claude、Codex、DeepSeek')).toContain('vendor');
    expect(ids('Claude、Codex', { vendors: true })).toEqual([]);
    expect(ids('李家寳')).toEqual(['name']);
    expect(ids('李家寶', { names: true })).toEqual([]);
    expect(ids('李家宝 · Li Jiabao · lijiabao1998 · Epoch AI · FrontierMetaScience')).toEqual([]);
  });

  it('finds digits that are neither a {fact} nor a registered literal', () => {
    const lits = [...literals].sort((a, b) => b.length - a.length);
    expect(strayDigits('{commits.total} 個 commit，2026-07-12 → 2026-09-30', lits)).toEqual([]);
    expect(strayDigits('PASS={gt.pass}，n = 2..76', lits)).toEqual([]);
    expect(strayDigits('1,938 commits', lits)).toEqual(['1', '938']);
    expect(strayDigits('１２ 個', lits)).toEqual(['１２']);
  });

  it('reads fact placeholders, plural forms included', () => {
    expect(factPlaceholders('{fr.cards} {k|card|cards} {n} {gt.pass|x|y}')).toEqual(['fr.cards', 'gt.pass']);
  });

  it('strips comments but keeps strings and URLs', () => {
    const src = "// 印章 in a note\nconst u = 'https://github.com/x'; /* 無岸 */ const s = \"// not a comment\";\n<!-- 共見 -->";
    const out = stripComments(src);
    expect(out).not.toMatch(/印章|無岸|共見/);
    expect(out).toContain('https://github.com/x');
    expect(out).toContain('"// not a comment"');
  });
});

describe('html reader', () => {
  const html =
    '<!doctype html><html lang="en"><head><title>T</title><script>a()</script><script type="application/ld+json">{"x":1}</script>' +
    '<script type="module">b()\r\n</script></head><body><a lang="zh-Hant" href="/">中文</a><p>Hi &amp; <span lang="he" dir="rtl">שלום</span></p>' +
    '<svg><use href="#i"/></svg><img src="/a.png" alt="x"></body></html>';

  it('tracks the effective lang and dir of every text run', () => {
    const doc = readPage(html);
    const texts = doc.texts as Text[];
    expect(doc.htmlLang).toBe('en');
    expect(texts.find((t) => t.text === '中文')?.lang).toBe('zh-Hant');
    const he = texts.find((t) => t.text === 'שלום');
    expect(he?.lang).toBe('he');
    expect(he?.dir).toBe('rtl');
    expect(texts.some((t) => t.text.includes('Hi &') && t.lang === 'en')).toBe(true);
    expect((doc.elements as { name: string }[]).filter((e) => e.name === 'img')).toHaveLength(1);
  });

  it('hashes executable inline scripts only, CR LF normalised as the HTML parser does', () => {
    expect(inlineScripts(html)).toEqual(['a()', 'b()\n']);
    expect(cspHash('a()')).toBe("'sha256-qVpDBgj7bpq5hMAcGp3AOc79J3Y1Z4HvySTwKrWDoy4='");
  });
});

describe('_headers CSP', () => {
  const template = '# c\n\n/*\n  X-Content-Type-Options: nosniff\n\n/_astro/*\n  Cache-Control: public, max-age=31536000, immutable\n';

  it('places the CSP in the /* block, keeps every other rule, and is idempotent', () => {
    const csp = policy(["'sha256-abc'"]);
    const once = withCsp(template, csp);
    expect(withCsp(once, csp)).toBe(once);
    expect(readCsp(once)).toBe(csp);
    expect(once).toContain('/_astro/*\n  Cache-Control: public, max-age=31536000, immutable');
    expect(once.indexOf('Content-Security-Policy')).toBeLessThan(once.indexOf('/_astro/*'));
  });

  it('never allows inline or eval for scripts', () => {
    const scriptSrc = /script-src([^;]*)/.exec(policy([]))?.[1] ?? '';
    expect(scriptSrc.trim()).toBe("'self'");
    expect(policy([])).toContain("frame-ancestors 'none'");
    expect(policy([])).toContain("connect-src 'self'");
  });
});

describe('woff2 decoder (og.mjs)', () => {
  const fonts = (walk(`${DIST}/_astro/fonts`) as string[]).filter((f) => f.endsWith('.woff2'));
  it.skipIf(fonts.length === 0)('rebuilds a consistent TrueType font from every built woff2', () => {
    for (const f of fonts) {
      const ttf = woff2ToSfnt(bytes(f));
      expect(ttf.readUInt32BE(0), f).toBe(0x00010000);
      const tables = new Map<string, { off: number; len: number }>();
      for (let i = 0; i < ttf.readUInt16BE(4); i++) {
        const r = 12 + 16 * i;
        tables.set(ttf.toString('latin1', r, r + 4), { off: ttf.readUInt32BE(r + 8), len: ttf.readUInt32BE(r + 12) });
      }
      for (const tag of ['head', 'glyf', 'loca', 'hmtx', 'maxp', 'cmap']) expect(tables.has(tag), `${f} ${tag}`).toBe(true);
      const head = tables.get('head');
      const loca = tables.get('loca');
      const glyf = tables.get('glyf');
      if (!head || !loca || !glyf) continue;
      const long = ttf.readInt16BE(head.off + 50) === 1;
      const end = long ? ttf.readUInt32BE(loca.off + loca.len - 4) : ttf.readUInt16BE(loca.off + loca.len - 2) * 2;
      expect(end, f).toBe(glyf.len);
    }
  });
});

describe('sitemap.xml', () => {
  it('lists the six pages with zh-Hant / en / x-default alternates and no 404', async () => {
    const res = await GET({ site: new URL('https://lijiabao.dev') } as unknown as Parameters<typeof GET>[0]);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual([
      'https://lijiabao.dev/',
      'https://lijiabao.dev/en/',
      'https://lijiabao.dev/glimmertown/',
      'https://lijiabao.dev/en/glimmertown/',
      'https://lijiabao.dev/frontier/',
      'https://lijiabao.dev/en/frontier/',
    ]);
    expect(xml.match(/<xhtml:link /g)).toHaveLength(18);
    expect(xml).not.toMatch(/hreflang="x-default" href="https:\/\/lijiabao\.dev\/en\//);
    expect(xml).not.toContain('404');
    expect(res.headers.get('Content-Type')).toContain('application/xml');
  });
});
