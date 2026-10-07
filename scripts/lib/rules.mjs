// scripts/lib/rules.mjs — the copy rules every S6 gate applies (spec §4.0 "Not used anywhere", §9.5 item 3;
// build-overrides §1 NEVER-publish list and the owner's style rule 「明確不要印章，現代化的」).
// Pure functions over strings: check-copy runs them on the dictionary and the source tree, check-dist on the
// rendered HTML, tests/unit/rules.test.ts pins their behaviour. No copy is produced here; the patterns are
// what must never ship.

/**
 * Terms that must never appear in shipped copy, in either locale. Latin patterns are case-insensitive and
 * bounded by \b so that ordinary words (timestamp, Engineering, sealed) do not trip them.
 * `id` names the rule in messages; `why` says where it comes from.
 */
export const FORBIDDEN = [
  // build-overrides §1 NEVER publish (owner-decisions 3)
  { id: 'never.cross-domain', re: /跨域的?預測與?風險編排|跨域的?预测与?风险编排|風險編排/u, why: 'overrides §1: 「跨域的預測與風險編排」' },
  { id: 'never.started', re: /202606050549|this is the thing from started/iu, why: 'overrides §1: 「202606050549 This is the thing from started.」' },
  { id: 'never.wuan', re: /無岸|无岸|共見|共见/u, why: 'overrides §1: 無岸.共見' },
  {
    id: 'never.gsb',
    re: /\bchange\s+lives\b|\bchange\s+organi[sz]ations\b|\bchange\s+the\s+world\b|\bstanford\b|\bGSB\b/iu,
    why: 'overrides §1: the Stanford-GSB "Change lives…" triad',
  },
  { id: 'never.lide', re: /立德立言|無問西東|无问西东/u, why: 'overrides §1: 立德立言／無問西東' },
  // X is not approved (overrides §1): the owner's handle, in any form, anywhere — site copy AND posts
  { id: 'never.x-handle', re: /@?LeonLRedfield/iu, why: 'overrides §1: the X handle is not approved' },
  // spec §4.0 "Not used anywhere"
  { id: 'spec.wisdom', re: /智慧[，,、\s]*屬於每一個人|智慧[，,、\s]*属于每一个人/u, why: 'spec §4.0: 智慧，屬於每一個人' },
  { id: 'spec.they-say', re: /他們說[，,]?\s*他是|他们说[，,]?\s*他是/u, why: 'spec §4.0: 「他們說，他是」' },
  { id: 'spec.grain', re: /\bgrain[-\s]+and[-\s]+spears\b/iu, why: 'spec §4.0: Grain-and-Spears' },
  // job titles (overrides §1: "any job title"; JSON-LD carries no jobTitle)
  {
    id: 'job-title',
    re: /\bjobTitle\b|\bdata\s+scientists?\b|資料科學家|數據科學家|数据科学家|\b(?:CEO|CTO|COO|CFO|CIO)\b|\bco-?founder\b|\bfounder\b|創辦人|创始人|創始人|執行長|首席執行官|工程師|工程师|\b(?:software|data|ml|ai|research)\s+engineer\b|\bresearcher\b|研究員|研究员|\bscientist\b|\bdeveloper\b|開發者|開發人員|\bdesigner\b|設計師/iu,
    why: 'overrides §1: no job title anywhere',
  },
  // the owner's style rule: no seals, stamps, dossiers or file numbers (spec §2.5, §4.0)
  {
    id: 'seal',
    re: /印章|鈐印|钤印|印鑑|印鉴|篆刻|落款|李家寳印|李家寶印|\bseals?\b|\bstamps?\b|\bhanko\b|\bdossiers?\b|卷宗|檔案編號|档案编号|\bfile\s+(?:no\.|number)/iu,
    why: 'owner: 「明確不要印章，現代化的」 (no seals, stamps, dossiers, file numbers)',
  },
  // the portrait carries no AI caption (owner-decisions 4)
  { id: 'ai-caption', re: /\bAI[-\s]?generated\b|\bgenerated\s+by\s+AI\b|AI\s*生成|人工智慧生成|人工智能生成/iu, why: 'owner: no "AI-generated" caption' },
  // X is not approved (overrides §1): no X / Twitter URL (the handle is never.x-handle). Posts too (POST_RULES).
  { id: 'x-link', re: /(?:^|[^\w.])(?:x|twitter)\.com\//iu, why: 'overrides §1: X links are not approved (the owner has not approved X on the site)' },
  // no politics (brief; spec §4.5 "no country content")
  {
    id: 'politics',
    re: /中華民國|中华民国|中華人民共和國|中华人民共和国|共產黨|共产党|國民黨|国民党|民進黨|民进党|台獨|台独|統獨|统独|習近平|习近平|蔡英文|賴清德|赖清德|\bcommunist\s+party\b|\bkuomintang\b/iu,
    why: 'brief: no politics',
  },
];

/** Flag emoji: regional-indicator letters, the flag pictographs, and tag sequences (subdivision flags). */
export const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{1,2}|[\u{1F3F3}\u{1F3F4}\u{1F6A9}\u{1F38C}]|[\u{E0020}-\u{E007F}]+/u;

/** Model and vendor names: allowed only in `*.named` dictionary keys behind features.vendorNames (spec §4.0). */
export const VENDOR_RE =
  /\b(?:Claude|Anthropic|OpenAI|ChatGPT|GPT(?:-?\d[\w.]*)?|Codex|Gemini|Bard|Grok|xAI|GLM|Zhipu|Kimi|Moonshot|DeepSeek|Qwen|Llama|Mistral|Copilot|Doubao|ERNIE|Baichuan|MiniMax)\b|智譜|智谱|月之暗面|深度求索|通義千問|通义千问|豆包|文心一言/u;

/** 李家宝 everywhere (overrides §1); the other written forms live only in JSON-LD alternateName. */
export const NAME_VARIANT_RE = /李家寳|李家寶/u;

/** `D(75) = 150` is quoted only as a claim that is NOT made (spec §9.5 item 3). */
export const D75_RE = /D\s*\(\s*75\s*\)\s*=\s*150/u;
export const D75_KEYS = new Set(['fr.math.not.1']);

/** 未解 / "unsolved" appear only where OPEN is defined as NOT meaning unsolved (spec §9.5 item 3). */
export const UNSOLVED_RE = /未解|\bunsolved\b/iu;
export const UNSOLVED_KEYS = new Set(['status.open.def', 'fr.open.body']);

/**
 * Every rule hit in `text`: forbidden terms, flags, and (unless allowed) vendor names and name variants.
 * @param {string} text
 * @param {{ vendors?: boolean, names?: boolean }} [allow]
 * @returns {{ id: string, why: string, match: string, index: number }[]}
 */
export function findViolations(text, allow = {}) {
  const hits = [];
  const scan = (id, re, why) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(g)) hits.push({ id, why, match: m[0], index: m.index ?? 0 });
  };
  for (const r of FORBIDDEN) scan(r.id, r.re, r.why);
  scan('flag', FLAG_RE, 'no flags anywhere (overrides §1)');
  if (!allow.vendors) scan('vendor', VENDOR_RE, 'vendor names only in *.named keys behind features.vendorNames (§4.0)');
  if (!allow.names) scan('name', NAME_VARIANT_RE, 'the name is 李家宝 everywhere (overrides §1)');
  return hits;
}

/**
 * The POSTS rule set (owner decision 2026-10-07): what the /articles/ and /views/ posts (titles, descriptions,
 * bodies) are checked against. Only the owner-privacy rules — every FORBIDDEN entry whose id starts with `never.` or
 * `spec.` (the owner's X handle included), X / Twitter URLs (`x-link`: X is not approved), flags, and the name
 * variants — and NOT the job-title, seal, vendor or ai-caption rules: a tech article legitimately says "developer",
 * "timestamp" or "ChatGPT". `never.gsb` is replaced by `never.gsb-triad`, which matches only the borrowed triad
 * presented together, so a post may mention Stanford or "change the world". The site's own copy (dictionary,
 * chrome) keeps the full set.
 */
export const POST_RULES = [
  ...FORBIDDEN.filter((r) => (r.id.startsWith('never.') || r.id.startsWith('spec.')) && r.id !== 'never.gsb'),
  // a post may cite a Stanford paper or say "change the world": only the borrowed triad, presented together, is his
  {
    id: 'never.gsb-triad',
    re: /\bchange\s+lives\b[\s\S]{0,40}?\bchange\s+organi[sz]ations\b[\s\S]{0,40}?\bchange\s+the\s+world\b|改變(?:生命|人生)[\s\S]{0,20}?改變組織[\s\S]{0,20}?改變世界|改变(?:生命|人生)[\s\S]{0,20}?改变组织[\s\S]{0,20}?改变世界/iu,
    why: 'overrides §1: the Stanford-GSB "Change lives… Change organizations… Change the world" triad',
  },
  // the owner has not approved X on the site: no X / Twitter URL in a post either
  ...FORBIDDEN.filter((r) => r.id === 'x-link'),
];

/**
 * Every POSTS-rule hit in `text` (same shape as findViolations).
 * @param {string} text
 * @returns {{ id: string, why: string, match: string, index: number }[]}
 */
export function findPostViolations(text) {
  const hits = [];
  const scan = (id, re, why) => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const m of text.matchAll(g)) hits.push({ id, why, match: m[0], index: m.index ?? 0 });
  };
  for (const r of POST_RULES) scan(r.id, r.re, r.why);
  scan('flag', FLAG_RE, 'no flags anywhere (overrides §1)');
  scan('name', NAME_VARIANT_RE, 'the name is 李家宝 everywhere (overrides §1)');
  return hits;
}

/**
 * Digit runs left in `s` after removing `{placeholders}` and registered literals (spec §4.0 numeric policy).
 * `literals` must be sorted longest first. Full-width digits count.
 * @param {string} s
 * @param {readonly string[]} literals
 * @returns {string[]}
 */
export function strayDigits(s, literals) {
  let r = s.replace(/\{[^{}]*\}/g, ' ');
  for (const l of literals) if (l) r = r.split(l).join(' ');
  return r.match(/[0-9０-９]+/g) ?? [];
}

/** `{fact.key}` placeholders (dotted names) in a string, with any plural suffix stripped. */
export function factPlaceholders(s) {
  return [...s.matchAll(/\{([A-Za-z][\w]*(?:\.[\w]+)+)(?:\|[^{}|]*\|[^{}|]*)?\}/g)].map((m) => m[1]);
}

/** Every plain string inside a dictionary value (string | string[] | Seg[]). */
export function strings(v) {
  if (typeof v === 'string') return [v];
  if (!Array.isArray(v)) return [];
  return v.flatMap((s) => (typeof s === 'string' ? [s] : s && typeof s.text === 'string' ? [s.text] : []));
}

/** Han ideographs plus CJK / full-width punctuation (same set as src/i18n/t.ts). */
export const CJK_RE = /[⺀-⿿　-〿぀-ヿ㄀-ㄯ㆐-ㇿ㐀-䶿一-鿿豈-﫿︰-﹏＀-｠￠-￦]/u;
/** Hebrew letters and points. */
export const HEBREW_RE = /[֐-׿יִ-ﭏ]/u;

/**
 * Remove comments from JS/TS/Astro/CSS source so explanatory notes (which name what is forbidden) are not
 * mistaken for copy. String contents are kept. Good enough for a lint pass, not a parser.
 */
export function stripComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let quote = '';
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += d ?? '';
        i += 2;
        continue;
      }
      if (c === quote) quote = '';
      i++;
      continue;
    }
    if (c === '/' && d === '*') {
      const e = src.indexOf('*/', i + 2);
      i = e < 0 ? n : e + 2;
      continue;
    }
    if (c === '/' && d === '/' && (i === 0 || !/[:\w]/.test(src[i - 1] ?? ''))) {
      // `//` after `:` or a word char is a URL (https://…) or a regex tail, not a comment
      const e = src.indexOf('\n', i);
      i = e < 0 ? n : e;
      continue;
    }
    if (c === '<' && src.startsWith('<!--', i)) {
      const e = src.indexOf('-->', i + 4);
      i = e < 0 ? n : e + 3;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    out += c;
    i++;
  }
  return out;
}
