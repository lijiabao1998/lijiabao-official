// src/i18n/ns/posts.ts — the two content sections (owner decision 2026-10-07; rules in src/lib/posts.ts).
//
//   articles  SEO articles (tutorials, explainers, round-ups), credited to the SITE: 「lijiabao.dev 編輯整理」.
//             Never the owner's views and never in his first person; the section intro and llms.txt say so.
//   views     the owner's OWN views only, credited to him: 「李家宝 觀點」.
//
// Only the chrome around the posts lives here; the posts themselves are Markdown in src/content/.
// `{title}` / `{label}` are caller variables (no dot), filled at build time.
import { defineNs, type DictShape, type ZhEntry } from '../types.ts';

const zh = {
  'nav.articles': { zh: '文章', cls: 'F' },
  'nav.views': { zh: '觀點', cls: 'F' },

  // section index h1 (display face: two glyphs each)
  'posts.articles.title': { zh: '文章', cls: 'F', display: true },
  'posts.views.title': { zh: '觀點', cls: 'F', display: true },
  // the labels: at the top of every post and on every list item (owner decision 2026-10-07)
  'posts.articles.label': { zh: 'lijiabao.dev 編輯整理', cls: 'F', src: 'owner decision 2026-10-07' },
  'posts.views.label': { zh: '李家宝 觀點', cls: 'F', src: 'owner decision 2026-10-07' },
  'posts.articles.intro': {
    zh: '教學、整理與解釋型的文章，由 lijiabao.dev 編輯整理。這些文章不是李家宝本人的觀點；他本人的觀點只放在「觀點」。',
    cls: 'F',
    src: 'owner decision 2026-10-07',
  },
  'posts.views.intro': { zh: '李家宝本人的觀點。', cls: 'OB', src: 'owner decision 2026-10-07: /views/ = his own views' },
  'posts.articles.empty': { zh: '這裡還沒有文章。', cls: 'F' },
  'posts.views.empty': { zh: '這裡還沒有觀點。', cls: 'F' },
  'posts.articles.back': { zh: '全部文章', cls: 'F' },
  'posts.views.back': { zh: '全部觀點', cls: 'F' },
  'posts.articles.list': { zh: '文章列表', cls: 'F' },
  'posts.views.list': { zh: '觀點列表', cls: 'F' },
  // the byline: first item of the meta row under a post title (articles: the site; views: the owner's name)
  'posts.articles.byline': { zh: 'lijiabao.dev 編輯整理', cls: 'F', src: 'owner decision 2026-10-07' },
  'posts.views.byline': { zh: '李家宝', cls: 'F' },
  'posts.published': { zh: '發布', cls: 'F' },
  'posts.updated': { zh: '更新', cls: 'F' },
  'posts.sources': { zh: '來源', cls: 'F' },
  'posts.feed': { zh: 'RSS 訂閱', cls: 'F' },
  // aria-label of the scroll region around each table in a post (src/lib/rehype-tables.ts); {n} counts from 1
  'posts.table': { zh: '表格 {n}', cls: 'F' },
  // the link to the same post in the other locale, written in that locale (like lang.switch)
  'posts.other': { zh: [{ lang: 'en', text: 'Read this in English' }], cls: 'F' },
  // the language switch's sr-only sentence when THIS page has no version in the other locale (LangSwitch.astro),
  // written in the target language like lang.switch.aria. `post.<section>`: to that locale's section index;
  // `….home`: that index is empty too, so to that locale's home page (never to an empty noindex page)
  'lang.switch.post.articles': { zh: [{ lang: 'en', text: 'This article has no English version — go to Articles in English' }], cls: 'F' },
  'lang.switch.post.views': { zh: [{ lang: 'en', text: 'This view has no English version — go to Views in English' }], cls: 'F' },
  'lang.switch.post.articles.home': { zh: [{ lang: 'en', text: 'This article has no English version — go to the English home page' }], cls: 'F' },
  'lang.switch.post.views.home': { zh: [{ lang: 'en', text: 'This view has no English version — go to the English home page' }], cls: 'F' },
  'lang.switch.section.articles.home': { zh: [{ lang: 'en', text: 'No articles in English yet — go to the English home page' }], cls: 'F' },
  'lang.switch.section.views.home': { zh: [{ lang: 'en', text: 'No views in English yet — go to the English home page' }], cls: 'F' },
  // <title> of a post
  'posts.articles.docTitle': { zh: '{title} — lijiabao.dev', cls: 'F' },
  'posts.views.docTitle': { zh: '{title} — 李家宝', cls: 'F' },
  // og:image:alt of a post card
  'posts.og.alt': { zh: '{label}：{title}', cls: 'F' },

  'meta.articles.title': { zh: '文章 — lijiabao.dev', cls: 'F' },
  'meta.articles.desc': { zh: 'lijiabao.dev 編輯整理的教學、整理與解釋型文章。不是李家宝本人的觀點。', cls: 'F' },
  'meta.views.title': { zh: '觀點 — 李家宝', cls: 'F' },
  'meta.views.desc': { zh: '李家宝本人的觀點。', cls: 'OB', src: 'owner decision 2026-10-07: /views/ = his own views' },
  'meta.og.articles': { zh: 'lijiabao.dev 編輯整理：文章', cls: 'F' },
  'meta.og.views': { zh: '李家宝 觀點', cls: 'F' },

  // llms.txt (scripts/llms.mjs): the two sections are never mixed; both locales are printed side by side
  'llms.views': { zh: '李家宝本人的觀點', cls: 'F', src: 'owner decision 2026-10-07' },
  'llms.views.note': { zh: '只收李家宝本人的觀點。', cls: 'OB', src: 'owner decision 2026-10-07: /views/ = his own views' },
  'llms.articles': { zh: 'lijiabao.dev 編輯整理（非本人觀點）', cls: 'F', src: 'owner decision 2026-10-07' },
  'llms.articles.note': { zh: '由 lijiabao.dev 編輯整理的文章，不代表李家宝本人的觀點，也不是他的第一人稱。', cls: 'F' },
  // the credit in the URL line of every article .md (and the /articles/ index .md)
  'llms.articles.credit': { zh: '由 lijiabao.dev 編輯整理，不是李家宝本人的觀點', cls: 'F', src: 'owner decision 2026-10-07' },
} satisfies Record<string, ZhEntry>;

const en = {
  'nav.articles': 'Articles',
  'nav.views': 'Views',

  'posts.articles.title': 'Articles',
  'posts.views.title': 'Views',
  'posts.articles.label': 'Edited by lijiabao.dev',
  'posts.views.label': 'Views · Li Jiabao',
  'posts.articles.intro':
    "Tutorials, round-ups and explainers, edited by lijiabao.dev. They are not Li Jiabao's personal views; his own views appear only under Views.",
  'posts.views.intro': "Li Jiabao's own views.",
  'posts.articles.empty': 'No articles here yet.',
  'posts.views.empty': 'No views here yet.',
  'posts.articles.back': 'All articles',
  'posts.views.back': 'All views',
  'posts.articles.list': 'Articles',
  'posts.views.list': 'Views',
  'posts.articles.byline': 'Edited by lijiabao.dev',
  'posts.views.byline': 'Li Jiabao',
  'posts.published': 'Published',
  'posts.updated': 'Updated',
  'posts.sources': 'Sources',
  'posts.feed': 'RSS feed',
  'posts.table': 'Table {n}',
  'posts.other': [{ lang: 'zh-Hant', text: '以中文閱讀這一篇' }],
  'lang.switch.post.articles': [{ lang: 'zh-Hant', text: '這篇文章沒有中文版，前往中文文章列表' }],
  'lang.switch.post.views': [{ lang: 'zh-Hant', text: '這篇觀點沒有中文版，前往中文觀點列表' }],
  'lang.switch.post.articles.home': [{ lang: 'zh-Hant', text: '這篇文章沒有中文版，前往中文首頁' }],
  'lang.switch.post.views.home': [{ lang: 'zh-Hant', text: '這篇觀點沒有中文版，前往中文首頁' }],
  'lang.switch.section.articles.home': [{ lang: 'zh-Hant', text: '還沒有中文文章，前往中文首頁' }],
  'lang.switch.section.views.home': [{ lang: 'zh-Hant', text: '還沒有中文觀點，前往中文首頁' }],
  'posts.articles.docTitle': '{title} — lijiabao.dev',
  'posts.views.docTitle': '{title} — Li Jiabao',
  'posts.og.alt': '{label}: {title}',

  'meta.articles.title': 'Articles — lijiabao.dev',
  'meta.articles.desc': "Tutorials, round-ups and explainers edited by lijiabao.dev. Not Li Jiabao's personal views.",
  'meta.views.title': 'Views — Li Jiabao',
  'meta.views.desc': "Li Jiabao's own views.",
  'meta.og.articles': 'Edited by lijiabao.dev: articles',
  'meta.og.views': 'Views · Li Jiabao',

  'llms.views': "Li Jiabao's own views",
  'llms.views.note': "Only Li Jiabao's own views.",
  'llms.articles': 'Edited by lijiabao.dev (not his personal views)',
  'llms.articles.note': "Articles edited by lijiabao.dev. They do not represent Li Jiabao's personal views and are not in his first person.",
  'llms.articles.credit': "Edited by lijiabao.dev — not Li Jiabao's personal views",
} satisfies DictShape<typeof zh>;

export default defineNs(zh, en);
