// The /articles/ and /views/ sections (owner decision 2026-10-07): slugs, the POSTS copy rules, what the sitemap and
// llms.txt include (empty vs non-empty), language pairs, and who each page is credited to. Pure data in, text out.
import { describe, expect, it } from 'vitest';
import {
  CALENDAR_DAY_MSG,
  alternateOf,
  calendarDay,
  contentRoutes,
  hasPosts,
  isSlug,
  isoDayStart,
  listedPages,
  localesOf,
  postIdFromPath,
  postsOf,
  rfc822Day,
  sectionsWithPosts,
  splitPostId,
  type PostMeta,
} from '@lib/posts';
import { sitemapGroups, sitemapXml } from '@lib/sitemap';
import { personId, postLd, sectionLd, siteOrg } from '@lib/postld';
import { feedCreator, rssXml } from '@lib/feed';
import { postLocaleOf, postTables, tableRegion } from '@lib/post-tables';
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
  it('are exactly the owner-privacy rules: never.* (the triad-only GSB rule) and spec.*, X URLs, flags and name variants', () => {
    const want = [
      ...(FORBIDDEN as { id: string }[]).filter((r) => /^(never|spec)\./.test(r.id) && r.id !== 'never.gsb').map((r) => r.id),
      'never.gsb-triad',
      'x-link',
    ];
    expect((POST_RULES as { id: string }[]).map((r) => r.id)).toEqual(want);
    expect(want).toContain('never.x-handle');
    expect(want.length).toBeGreaterThanOrEqual(10);
    expect(ids(findPostViolations('202606050549 This is the thing from started.'))).toContain('never.started');
    expect(ids(findPostViolations('跨域的預測與風險編排'))).toContain('never.cross-domain');
    expect(ids(findPostViolations('智慧，屬於每一個人'))).toContain('spec.wisdom');
    expect(ids(findPostViolations('Taiwan 🇹🇼'))).toEqual(['flag']);
    expect(ids(findPostViolations('李家寳'))).toEqual(['name']);
  });

  it("stop the owner's X handle and any X / Twitter link in a post (X is not approved)", () => {
    expect(ids(findPostViolations('關注 @LeonLRedfield 看更多'))).toContain('never.x-handle');
    expect(ids(findPostViolations('@leonlredfield'))).toContain('never.x-handle');
    expect(ids(findPostViolations('see https://x.com/LeonLRedfield'))).toEqual(expect.arrayContaining(['never.x-handle', 'x-link']));
    expect(ids(findPostViolations('see https://twitter.com/someone'))).toEqual(['x-link']);
    expect(ids(findPostViolations('see https://x.com/someone'))).toEqual(['x-link']);
    // the site copy keeps both
    expect(ids(findViolations('@LeonLRedfield'))).toContain('never.x-handle');
  });

  it('let a post cite Stanford or say "change the world"; only the borrowed triad together is stopped', () => {
    expect(findPostViolations('Stanford HAI published the AI Index; GSB courses; tools that change the world of testing.')).toEqual([]);
    expect(ids(findPostViolations('Change lives. Change organizations. Change the world.'))).toEqual(['never.gsb-triad']);
    expect(ids(findPostViolations('change lives, change organisations and change the world'))).toEqual(['never.gsb-triad']);
    expect(ids(findPostViolations('改變生命、改變組織、改變世界'))).toEqual(['never.gsb-triad']);
    // the site copy keeps the broad rule
    expect(ids(findViolations('Stanford'))).toContain('never.gsb');
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
    expect(ld.datePublished).toBe('2026-10-05T00:00:00+08:00');
    expect(ld.dateModified).toBe('2026-10-07T00:00:00+08:00');
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
    const empty = rssXml({ site: SITE, section: 'views', locale: 'en', title: 't', description: 'd', owner: 'Li Jiabao', posts: ALL });
    expect(empty).toContain('<rss version="2.0"');
    expect(empty).not.toContain('<item>');
    // the owner's name is passed in, but an articles feed credits the site whatever the caller passes
    const xml = rssXml({ site: SITE, section: 'articles', locale: 'zh-Hant', title: 't', description: 'd', owner: '李家宝', posts: ALL });
    expect([...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1])).toEqual([
      'https://lijiabao.dev/articles/',
      'https://lijiabao.dev/articles/zh-only/',
      'https://lijiabao.dev/articles/pair/',
    ]);
    const creators = [...xml.matchAll(/<dc:creator>([^<]*)<\/dc:creator>/g)].map((m) => m[1]);
    expect(creators).toEqual(['lijiabao.dev', 'lijiabao.dev']);
    expect(xml).not.toContain('李家宝');
    // dates: the start of the calendar day in Asia/Taipei, never a future GMT midnight
    expect(xml).toContain('<lastBuildDate>Wed, 07 Oct 2026 00:00:00 +0800</lastBuildDate>');
    expect(xml).toContain('<pubDate>Tue, 06 Oct 2026 00:00:00 +0800</pubDate>');
    expect(xml).not.toContain('GMT');
    const views = rssXml({ site: SITE, section: 'views', locale: 'zh-Hant', title: 't', description: 'd', owner: '李家宝', posts: ALL });
    expect([...views.matchAll(/<dc:creator>([^<]*)<\/dc:creator>/g)].map((m) => m[1])).toEqual(['李家宝']);
    expect(feedCreator(SITE, 'articles', 'Li Jiabao')).toBe('lijiabao.dev');
    expect(feedCreator(SITE, 'views', 'Li Jiabao')).toBe('Li Jiabao');
  });
});

describe('dates: calendar days in Asia/Taipei', () => {
  it('accepts YYYY-MM-DD only (a YAML day or the quoted string), never a timestamp', () => {
    expect(calendarDay(new Date('2026-10-07T00:00:00Z'))?.toISOString()).toBe('2026-10-07T00:00:00.000Z');
    expect(calendarDay('2026-10-07')?.toISOString()).toBe('2026-10-07T00:00:00.000Z');
    // YAML date: 2026-10-07T07:00:00+08:00 is 2026-10-06T23:00Z: refused, not moved to the 6th
    expect(calendarDay(new Date('2026-10-07T07:00:00+08:00'))).toBeNull();
    expect(calendarDay(new Date('2026-10-07T00:00:01Z'))).toBeNull();
    for (const s of ['2026-10-07T07:00:00+08:00', '2026-10-7', '2026/10/07', '2026-02-30', '', 'today']) expect(calendarDay(s), s).toBeNull();
    expect(calendarDay(20261007)).toBeNull();
    expect(CALENDAR_DAY_MSG).toMatch(/YYYY-MM-DD/);
  });

  it('writes the start of the day with the +08:00 offset wherever a time is required', () => {
    expect(isoDayStart(d('2026-10-07'))).toBe('2026-10-07T00:00:00+08:00');
    expect(rfc822Day(d('2026-10-07'))).toBe('Wed, 07 Oct 2026 00:00:00 +0800');
    expect(rfc822Day(d('2026-01-01'))).toBe('Thu, 01 Jan 2026 00:00:00 +0800');
  });
});

describe('post tables', () => {
  it('wraps every table of a post in a named, focusable scroll region, numbered per document', () => {
    expect(tableRegion('en', 2)).toEqual({
      type: 'element',
      tagName: 'div',
      properties: { className: ['table-wrap'], role: 'region', ariaLabel: 'Table 2', tabIndex: 0 },
      children: [],
    });
    expect(tableRegion('zh-Hant', 1).properties.ariaLabel).toBe('表格 1');
    const wrapped: { node: unknown; parent: { properties: Record<string, unknown> } }[] = [];
    const ctx = (path: string) => ({
      fileURL: new URL(`file://${path}`),
      data: {} as Record<string, unknown>,
      wrapNode: (node: unknown, parent: { properties: Record<string, unknown> }) => wrapped.push({ node, parent }),
    });
    const post = ctx('/C:/site/src/content/articles/en/how-to.md');
    postTables.element.visit('t1', post);
    postTables.element.visit('t2', post);
    postTables.element.visit('t3', ctx('/C:/site/src/content/_templates/articles/README.md'));
    expect(wrapped.map((w) => [w.node, w.parent.properties.ariaLabel])).toEqual([
      ['t1', 'Table 1'],
      ['t2', 'Table 2'],
    ]);
  });

  it('reads the locale of a post from its path and leaves other Markdown alone', () => {
    expect(postLocaleOf('C:\\site\\src\\content\\articles\\zh-Hant\\how-to.md')).toBe('zh-Hant');
    expect(postLocaleOf('/site/src/content/views/en/a-view.md')).toBe('en');
    expect(postLocaleOf('/site/src/content/_templates/articles/README.md')).toBeNull();
    expect(postLocaleOf('/site/README.md')).toBeNull();
  });
});
