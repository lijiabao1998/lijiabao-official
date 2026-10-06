// The /articles/ and /views/ sections (owner decision 2026-10-07): slugs, the POSTS copy rules, what the sitemap and
// llms.txt include (empty vs non-empty), language pairs, and who each page is credited to. Pure data in, text out.
import { describe, expect, it } from 'vitest';
import {
  alternateOf,
  contentRoutes,
  hasPosts,
  isSlug,
  listedPages,
  localesOf,
  postIdFromPath,
  postsOf,
  sectionsWithPosts,
  splitPostId,
  type PostMeta,
} from '@lib/posts';
import { sitemapGroups, sitemapXml } from '@lib/sitemap';
import { personId, postLd, sectionLd, siteOrg } from '@lib/postld';
import { rssXml } from '@lib/feed';
import { FORBIDDEN, POST_RULES, findPostViolations, findViolations } from '../../scripts/lib/rules.mjs';
import { contentRoute } from '../../scripts/lib/posts.mjs';

const SITE = new URL('https://lijiabao.dev');
const FIXED = ['/', '/glimmertown/', '/frontier/'];
const AS_OF = '2026-09-30';
const d = (s: string): Date => new Date(`${s}T00:00:00Z`);

const post = (o: Partial<PostMeta> & Pick<PostMeta, 'section' | 'locale' | 'slug'>): PostMeta => ({
  title: `${o.slug} (${o.locale})`,
  description: 'A description.',
  date: d('2026-10-05'),
  tags: [],
  ...o,
});

const pairZh = post({ section: 'articles', locale: 'zh-Hant', slug: 'pair', date: d('2026-10-05'), updated: d('2026-10-07') });
const pairEn = post({ section: 'articles', locale: 'en', slug: 'pair', date: d('2026-10-05') });
const zhOnly = post({ section: 'articles', locale: 'zh-Hant', slug: 'zh-only', date: d('2026-10-06') });
const viewZh = post({ section: 'views', locale: 'zh-Hant', slug: 'a-view', date: d('2026-10-07') });
const ALL = [pairZh, pairEn, zhOnly, viewZh];

const locs = (xml: string): string[] => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '');
const urlBlock = (xml: string, loc: string): string => xml.split('<url>').find((b) => b.includes(`<loc>${loc}</loc>`)) ?? '';
const ids = (hits: { id: string }[]): string[] => hits.map((h) => h.id);

describe('slugs', () => {
  it('accepts ASCII kebab-case only', () => {
    for (const s of ['a', 'how-to-read-a-sitemap', 'astro7', 'web-gl-2']) expect(isSlug(s), s).toBe(true);
    for (const s of ['', 'Foo', 'foo_bar', 'foo--bar', '-foo', 'foo-', 'foo bar', 'föö', '文章', '2026/10/foo', 'foo.md']) {
      expect(isSlug(s), s).toBe(false);
    }
  });

  it('takes the id from <locale>/<slug>.md and fails the build on anything else', () => {
    expect(postIdFromPath('zh-Hant/how-to.md', 'articles')).toBe('zh-Hant/how-to');
    expect(postIdFromPath('en/how-to.md', 'views')).toBe('en/how-to');
    expect(postIdFromPath('en\\windows-path.md', 'articles')).toBe('en/windows-path');
    expect(() => postIdFromPath('zh-Hant/How_To.md', 'articles')).toThrow(/not a valid slug/);
    expect(() => postIdFromPath('zh/how-to.md', 'articles')).toThrow(/not a locale folder/);
    expect(() => postIdFromPath('how-to.md', 'articles')).toThrow(/live directly in/);
    expect(() => postIdFromPath('en/2026/how-to.md', 'views')).toThrow(/live directly in/);
    expect(splitPostId('zh-Hant/how-to')).toEqual({ locale: 'zh-Hant', slug: 'how-to' });
  });

  it('reads the content routes of the built site from their paths', () => {
    expect(contentRoute('articles/index.html')).toEqual({ kind: 'section', section: 'articles', locale: 'zh-Hant' });
    expect(contentRoute('en/views/a-view/index.html')).toEqual({ kind: 'post', section: 'views', locale: 'en', slug: 'a-view' });
    expect(contentRoute('glimmertown/index.html')).toBeNull();
    expect(contentRoute('articles/rss.xml')).toBeNull();
  });
});

describe('POSTS copy rules', () => {
  it('are exactly the owner-privacy rules: never.* and spec.* plus flags and name variants', () => {
    const want = (FORBIDDEN as { id: string }[]).filter((r) => /^(never|spec)\./.test(r.id)).map((r) => r.id);
    expect((POST_RULES as { id: string }[]).map((r) => r.id)).toEqual(want);
    expect(want.length).toBeGreaterThanOrEqual(8);
    expect(ids(findPostViolations('202606050549 This is the thing from started.'))).toContain('never.started');
    expect(ids(findPostViolations('跨域的預測與風險編排'))).toContain('never.cross-domain');
    expect(ids(findPostViolations('智慧，屬於每一個人'))).toContain('spec.wisdom');
    expect(ids(findPostViolations('Taiwan 🇹🇼'))).toEqual(['flag']);
    expect(ids(findPostViolations('李家寳'))).toEqual(['name']);
  });

  it('let a tech article say what the site copy may not (job titles, seals, vendors, AI captions)', () => {
    const text = 'A developer asked ChatGPT and Claude about the timestamp; the seal on an AI-generated image; data scientist; GPT-4.';
    expect(findPostViolations(text)).toEqual([]);
    expect(ids(findViolations(text))).toEqual(expect.arrayContaining(['job-title', 'vendor', 'seal', 'ai-caption']));
  });
});

describe('sitemap: what is listed', () => {
  it('with no posts: the six fixed pages only, no empty section index, nothing else', () => {
    const xml = sitemapXml(SITE, sitemapGroups(FIXED, AS_OF, []));
    expect(locs(xml)).toEqual([
      'https://lijiabao.dev/',
      'https://lijiabao.dev/en/',
      'https://lijiabao.dev/glimmertown/',
      'https://lijiabao.dev/en/glimmertown/',
      'https://lijiabao.dev/frontier/',
      'https://lijiabao.dev/en/frontier/',
    ]);
    expect(xml).not.toMatch(/articles|views|rss/);
  });

  it('with posts: non-empty indexes and every post; alternates only for pairs; lastmod = updated ?? date', () => {
    const xml = sitemapXml(SITE, sitemapGroups(FIXED, AS_OF, ALL));
    const l = locs(xml);
    expect(l).toEqual(
      expect.arrayContaining([
        'https://lijiabao.dev/articles/',
        'https://lijiabao.dev/en/articles/',
        'https://lijiabao.dev/articles/pair/',
        'https://lijiabao.dev/en/articles/pair/',
        'https://lijiabao.dev/articles/zh-only/',
        'https://lijiabao.dev/views/',
        'https://lijiabao.dev/views/a-view/',
      ]),
    );
    expect(l).toHaveLength(6 + 7);
    // /en/views/ is empty: not listed; zh-only pages carry no alternates
    expect(l).not.toContain('https://lijiabao.dev/en/views/');
    expect(urlBlock(xml, 'https://lijiabao.dev/articles/zh-only/')).not.toContain('xhtml:link');
    expect(urlBlock(xml, 'https://lijiabao.dev/views/')).not.toContain('xhtml:link');
    const pair = urlBlock(xml, 'https://lijiabao.dev/en/articles/pair/');
    expect(pair).toContain('hreflang="zh-Hant" href="https://lijiabao.dev/articles/pair/"');
    expect(pair).toContain('hreflang="x-default" href="https://lijiabao.dev/articles/pair/"');
    expect(pair).toContain('<lastmod>2026-10-05</lastmod>');
    expect(urlBlock(xml, 'https://lijiabao.dev/articles/pair/')).toContain('<lastmod>2026-10-07</lastmod>');
    // a non-empty index: its newest change; paired only when both locales have posts
    expect(urlBlock(xml, 'https://lijiabao.dev/articles/')).toContain('<lastmod>2026-10-07</lastmod>');
    expect(urlBlock(xml, 'https://lijiabao.dev/articles/')).toContain('hreflang="en" href="https://lijiabao.dev/en/articles/"');
  });

  it('groups each page once, index first, posts newest first', () => {
    expect(contentRoutes(ALL).map((r) => `${r.kind}:${r.path}`)).toEqual([
      'section:/articles/',
      'post:/articles/zh-only/',
      'post:/articles/pair/',
      'section:/views/',
      'post:/views/a-view/',
    ]);
  });
});

describe('llms.txt and the nav: what is listed', () => {
  it('lists nothing for an empty section, and an index before its posts for each locale with posts', () => {
    expect(listedPages([], 'articles')).toEqual([]);
    expect(listedPages(ALL, 'articles').map((x) => `${x.kind}:${x.locale}:${x.post?.slug ?? ''}`)).toEqual([
      'section:zh-Hant:',
      'post:zh-Hant:zh-only',
      'post:zh-Hant:pair',
      'section:en:',
      'post:en:pair',
    ]);
    expect(listedPages(ALL, 'views').map((x) => `${x.kind}:${x.locale}`)).toEqual(['section:zh-Hant', 'post:zh-Hant']);
  });

  it('puts a section in the nav of a locale only when it has a published post there', () => {
    expect(sectionsWithPosts([], 'zh-Hant')).toEqual([]);
    expect(sectionsWithPosts(ALL, 'zh-Hant')).toEqual(['articles', 'views']);
    expect(sectionsWithPosts(ALL, 'en')).toEqual(['articles']);
    expect(hasPosts(ALL, 'views', 'en')).toBe(false);
    expect(postsOf(ALL, 'articles', 'zh-Hant').map((p) => p.slug)).toEqual(['zh-only', 'pair']);
  });
});

describe('language pairs', () => {
  it('pairs the same section and slug across locales, and nothing else', () => {
    expect(alternateOf(pairZh, ALL)).toBe(pairEn);
    expect(alternateOf(pairEn, ALL)).toBe(pairZh);
    expect(alternateOf(zhOnly, ALL)).toBeNull();
    // same slug in the other section is not a translation
    const viewPair = post({ section: 'views', locale: 'en', slug: 'zh-only' });
    expect(alternateOf(zhOnly, [...ALL, viewPair])).toBeNull();
    expect(localesOf(ALL, 'articles', 'pair')).toEqual(['zh-Hant', 'en']);
    expect(localesOf(ALL, 'articles', 'zh-only')).toEqual(['zh-Hant']);
  });
});

describe('credit (JSON-LD, feeds)', () => {
  const image = 'https://lijiabao.dev/_astro/x.png';

  it('an article is the site\'s: author AND publisher are the Organization, never the Person', () => {
    const ld = postLd({ site: SITE, post: pairZh, image, sources: [{ title: 'Spec', url: 'https://spec.example/' }] });
    const org = { '@type': 'Organization', '@id': 'https://lijiabao.dev/#site', name: 'lijiabao.dev', url: 'https://lijiabao.dev/' };
    expect(siteOrg(SITE)).toEqual(org);
    expect(ld['@type']).toBe('TechArticle');
    expect(ld.author).toEqual(org);
    expect(ld.publisher).toEqual(org);
    expect(ld.dateModified).toBe('2026-10-07');
    expect(JSON.stringify(ld)).not.toContain('#person');
    expect(JSON.stringify(sectionLd({ site: SITE, section: 'articles', locale: 'en', name: 'n', description: 'd', posts: [pairEn] }))).not.toContain('#person');
  });

  it('a view is the owner\'s: BlogPosting with the Person as author', () => {
    const ld = postLd({ site: SITE, post: viewZh, image });
    expect(ld['@type']).toBe('BlogPosting');
    expect(ld.author).toEqual({ '@id': personId(SITE) });
    expect(personId(SITE)).toBe('https://lijiabao.dev/#person');
    const index = sectionLd({ site: SITE, section: 'views', locale: 'zh-Hant', name: 'n', description: 'd', posts: [viewZh] });
    expect(index.find((n) => n['@type'] === 'Blog')?.author).toEqual({ '@id': 'https://lijiabao.dev/#person' });
  });

  it('feeds list the section\'s posts of one locale, newest first, credited; an empty feed is a valid channel', () => {
    const empty = rssXml({ site: SITE, section: 'views', locale: 'en', title: 't', description: 'd', creator: 'Li Jiabao', posts: ALL });
    expect(empty).toContain('<rss version="2.0"');
    expect(empty).not.toContain('<item>');
    const xml = rssXml({ site: SITE, section: 'articles', locale: 'zh-Hant', title: 't', description: 'd', creator: 'lijiabao.dev', posts: ALL });
    expect([...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1])).toEqual([
      'https://lijiabao.dev/articles/',
      'https://lijiabao.dev/articles/zh-only/',
      'https://lijiabao.dev/articles/pair/',
    ]);
    expect(xml).toContain('<dc:creator>lijiabao.dev</dc:creator>');
    expect(xml).toContain('<lastBuildDate>Wed, 07 Oct 2026 00:00:00 GMT</lastBuildDate>');
  });
});
