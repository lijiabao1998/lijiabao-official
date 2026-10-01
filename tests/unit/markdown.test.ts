// scripts/lib/markdown.mjs — the HTML → Markdown reader behind llms.txt, llms-full.txt and <page>/index.md.
import { describe, expect, it } from 'vitest';
import { mainToMarkdown } from '../../scripts/lib/markdown.mjs';

const SITE = 'https://lijiabao.dev';
const page = (main: string, lang = 'en') => `<!doctype html><html lang="${lang}"><head><title>t</title></head><body><header>nav</header><main>${main}</main><footer>f</footer></body></html>`;
const md = (main: string, lang?: string): string => mainToMarkdown(page(main, lang), SITE);

describe('mainToMarkdown', () => {
  it('reads only <main>, maps h1 to ## and keeps reading order', () => {
    expect(md('<h1>Title</h1><p>Body</p>')).toBe('## Title\n\nBody\n');
  });

  it('skips aria-hidden copies, js-only controls, in-page jumps and external-site hints', () => {
    const out = md(
      '<p><span class="sr-only">Real line</span><span aria-hidden="true">Real line</span></p>' +
        '<div class="js-only"><span>View</span><button>Grid</button></div>' +
        '<a href="#work">↓ Work</a>' +
        '<p><a href="https://github.com/x">GitHub<span class="sr-only"> (external site)</span></a></p>',
    );
    expect(out).toBe('Real line\n\n[GitHub](https://github.com/x)\n');
  });

  it('keeps a seam where an aria-hidden separator was skipped', () => {
    expect(md('<p><span>works on phones<span aria-hidden="true"> · </span><span>1.06 MB</span></span></p>')).toBe('works on phones 1.06 MB\n');
  });

  it('honours data-md-after separators', () => {
    expect(md('<p><span data-md-after=" — ">Card</span><span>what changes</span></p>')).toBe('Card — what changes\n');
  });

  it('honours rowspan and gives a header-less table an empty header', () => {
    const out = md(
      '<table><thead><tr><th></th><th></th><th scope="col">001</th></tr></thead><tbody>' +
        '<tr><th scope="rowgroup" rowspan="2">Gov</th><th>Math</th><td>M1</td></tr>' +
        '<tr><th>Phys</th><td>P1</td></tr></tbody></table>' +
        '<table><tr><th>Version</th><td>v1</td></tr></table>',
    );
    expect(out).toContain('| Gov | Math | M1 |\n|  | Phys | P1 |');
    expect(out).toContain('|  |  |\n| --- | --- |\n| Version | v1 |');
  });

  it('keeps one bullet per list item, numbers ordered lists, and quotes inside items after the bullet', () => {
    const out = md('<ol><li><p>First</p><p>— source</p></li><li>Second</li></ol><ul><li>Item<blockquote>Q</blockquote></li></ul>');
    expect(out).toBe('1. First\n   — source\n2. Second\n- Item\n   > Q\n');
  });

  it('writes a chip and its definition as one line', () => {
    const zh = md('<span class="chip-wrap" data-chip><button class="chip">示意</button><span role="tooltip">示意圖，不是資料。</span></span>', 'zh-Hant');
    expect(zh).toBe('（示意：示意圖，不是資料。）\n');
  });

  it('moves lines that precede an article heading below it', () => {
    const out = md('<article><div><span>Merged</span></div><h3>FrontierMath</h3><p>Body</p></article>');
    expect(out).toBe('#### FrontierMath\n\nMerged\n\nBody\n'); // h3 → #### (each page's h1 is ##)
  });

  it('glues CJK at <br> and around CJK punctuation, spaces Latin', () => {
    expect(md('<h1><span data-md-after=" — ">李家宝</span><span>讓每個人，<br>都有一座實驗室。</span></h1>', 'zh-Hant')).toBe('## 李家宝 — 讓每個人，都有一座實驗室。\n');
  });
});
