// src/i18n/ns/home.ts — the home page copy.
//
// Owner decision 2026-11-18: the home page reads as an introduction and job-seeking site, not as a manifesto.
// Order: who he is (#hero) → about → work → skills → how the work is done → numbers → the commit record →
// contact. Only facts already public in the repos are used: no job title, no career or education history, no
// e-mail address (rules.mjs still forbids a job title anywhere).
//   - about.belief is the owner's own line (APPROVED, verbatim). It was the hero line until 2026-11-18 and now
//     sits small in #about, as a belief.
//   - The Hebrew line and the 「現在，由我來定義。」 signature are removed (the owner, 2026-11-18: 「去掉好了」).
//   - The #not statements are now the plain verification rules in #method; the #vision section is gone.
//   - X stays off.
import { defineNs, type DictShape, type ZhEntry } from '../types.ts';

const zh = {
  // ── Hero: the name, a plain introduction, three ways on ──────────────────────────────────────────────
  'hero.eyebrow': { zh: 'lijiabao1998 · 台灣', cls: 'F' },
  'hero.name': { zh: '李家宝', cls: 'F', display: true },
  'hero.intro': {
    zh: '主持兩件公開作品：遊戲「微光小鎮」，以及研究治理專案「前沿實驗室」。與多家廠商的 AI 模型協作開發：先寫驗收條件，再動工，檢查全過才合併。',
    cls: 'F',
    src: 'the two bodies of work; GlimmerTown-lab AUTORUN.md and AGENTS.md (the round of work, the writers)',
  },
  'hero.cta.work': { zh: '看作品', cls: 'F' },
  'hero.cta.github': { zh: 'GitHub', cls: 'F' },
  'hero.cta.articles': { zh: '讀文章', cls: 'F' },
  'hero.meta.repos': { zh: '{repos.count} 個公開倉庫', cls: 'F' },
  'hero.meta.snapshot': { zh: '資料快照 {snapshot.asOf}', cls: 'F' },

  // ── About ────────────────────────────────────────────────────────────────────────────────────────────
  'about.label': { zh: '關於', cls: 'F' },
  'about.role': { zh: '負責兩件作品的方向與最後決定，每個決定都寫上日期。', cls: 'F' },
  'about.repos': { zh: 'GitHub lijiabao1998 · {repos.count} 個公開倉庫 · 帳號建立於 2026-09-23', cls: 'F' },
  'about.older': { zh: '作品更早：微光小鎮主線的第一個 commit 是 2026-07-12。', cls: 'F' },
  'about.belief.label': { zh: '信念', cls: 'F' },
  'about.belief': {
    zh: '讓每個人，都有一座自己的實驗室。',
    cls: 'P',
    status: 'APPROVED',
    fallback: null,
    display: true,
    src: 'owner-decisions.md 1 (his own choice, confirmed in chat 2026-09-30); moved from the hero to #about on 2026-11-18',
  },
  // His X-bio lines (APPROVED). The zh gloss is empty on purpose: omit the gloss element when ''.
  'about.line1': { zh: '心存善念，盡力而為', cls: 'O', status: 'APPROVED', src: 'X bio [voice]' },
  'about.line1.gloss': { zh: '', cls: 'T', src: 'our English gloss of an O line' },
  'about.line2': { zh: '但行好事，勿問前程', cls: 'O', status: 'APPROVED', src: 'X bio [voice]' },
  'about.line2.gloss': { zh: '', cls: 'T', src: 'our English gloss of an O line' },
  'about.caption': { zh: '肖像：{n} 個點，沿基線排成。這張圖不是資料。', cls: 'F' },

  // ── Work ─────────────────────────────────────────────────────────────────────────────────────────────
  'work.label': { zh: '作品', cls: 'F' },
  'work.title': { zh: '兩件作品，同一套方法。', cls: 'F', display: true },
  'work.gt.title': { zh: '微光小鎮', cls: 'F', display: true },
  'work.gt.kicker': { zh: '遊戲 · 三條開發線', cls: 'F' },
  'work.gt.summary': { zh: '一座原創的等距像素城市。一個 HTML 檔，零依賴，可離線。', cls: 'F' },
  'work.gt.dates': { zh: '2026-07-12 → 2026-09-30', cls: 'F' },
  'work.gt.stat': { zh: '{commits.gt} commits · PASS={gt.pass}', cls: 'F' },
  'work.fr.title': { zh: '前沿實驗室', cls: 'F', display: true },
  'work.fr.kicker': { zh: '研究治理 · {fr.repos} 個倉庫', cls: 'F' },
  'work.fr.summary': { zh: '{fr.govRepos} 個治理庫、{fr.labs} 個學科實驗室、{fr.cards} 張問題卡。', cls: 'F' },
  'work.fr.dates': { zh: '2026-09-27 → 2026-09-29', cls: 'F' },
  'work.fr.stat': { zh: '{fr.cards} 張問題卡 · 每輪預設預算 {fr.budgetUsd} 美元', cls: 'F' },
  'work.cta': { zh: '看案例 →', cls: 'F' },

  // ── Skills: what the public record shows. Each item is [name, what the record says, its source]. ─────
  'skills.label': { zh: '能力', cls: 'F' },
  'skills.lede': { zh: '下面每一項，在公開倉庫裡都有紀錄可查。', cls: 'F' },
  'skills.1': {
    zh: ['規格與驗收', '動手之前先量測，先把驗收條件寫進任務卡。微光小鎮主線累積了 {gt.cards} 張任務卡。', '出處 GlimmerTown `docs/tasks/`'],
    cls: 'F',
  },
  'skills.2': {
    zh: ['測試與守衛', '主線測試套件 {gt.pass} 項 PASS；實驗線有 {gtlab.guards} 支像素守衛，全綠才合併。', '出處 GlimmerTown `test_fixde.js`'],
    cls: 'F',
  },
  'skills.3': {
    zh: ['多模型協作', '實驗線有 {gtlab.writers} 個來自不同廠商的模型寫入者，照同一份成文規則分工；每一次合併都要人工核可。', '出處 GlimmerTown-lab `AGENTS.md`'],
    cls: 'F',
  },
  'skills.4': {
    zh: ['遊戲與圖形', '一座原創的等距像素城市：一個 HTML 檔，零依賴，可離線。3D 線的 {gt3d.parityOps} 筆操作與 2D 程式逐位對拍，全部相等。', '出處 GlimmerTown3D-lab D011'],
    cls: 'F',
  },
  'skills.5': {
    zh: ['研究流程治理', '{fr.labs} 個學科實驗室、{fr.cards} 張問題卡，共用一套治理規則。治理工具 `frontier.py` 只用標準庫，有 {gov.tests} 個測試。', '出處 FrontierLab-Governance `STATUS.md`'],
    cls: 'F',
  },
  'skills.6': {
    zh: ['網站製作', '這個網站是 Astro 靜態輸出，手寫 WebGL2，中英雙語。關掉 JavaScript 也能讀完每一個字；沒有追蹤器，沒有 cookie。', '出處 本站原始碼'],
    cls: 'F',
  },

  // ── Method: how the work is done ─────────────────────────────────────────────────────────────────────
  'method.label': { zh: '工作方式', cls: 'F' },
  'method.chain.title': { zh: '一輪施工', cls: 'F' },
  // list: the five steps of the → chain (arrows are drawn between them)
  'method.chain': {
    zh: ['量測', '出卡：驗收條件寫在動手之前', '施工', '寫守衛', '全綠、業主點頭才合'],
    cls: 'OD',
    src: 'GlimmerTown-lab AUTORUN.md, AGENTS.md; en is T',
  },
  'method.writers': {
    zh: '實驗線有七個模型寫入者，來自不同廠商：兩個可以推 main，其餘五個各走自己的分支、開 PR。只有業主點頭才合。',
    cls: 'R',
    src: '[glimmer] GlimmerTown-lab AGENTS.md',
  },
  'method.writers.named': {
    zh: '可推 main：Claude、Codex。各走分支、開 PR：Grok、GLM、Kimi、DeepSeek、GPT。',
    cls: 'R',
    src: '[glimmer]',
    feature: 'vendorNames',
  },
  'method.undone': { zh: '「沒做成的事」不准空著，也不准美化。', cls: 'OD', src: 'GlimmerTown-lab AUTORUN.md; en is T' },
  'method.undone.cite': { zh: '— GlimmerTown-lab `AUTORUN.md`', cls: 'F' },
  'method.rules.title': { zh: '驗證原則', cls: 'F' },
  // list: three statements (the #not statements until 2026-11-18, now a plain list)
  'method.rules': {
    zh: ['編譯成功，不是 correctness。', 'benchmark 高分，不是一般能力。', '兩個模型同意，不是獨立驗證。'],
    cls: 'OD',
    src: 'FrontierComputerScience README; en is T',
  },
  'method.rules.cite': { zh: '— FrontierComputerScience README', cls: 'F' },

  // ── Numbers ── each num.N is a list of parts: [value, label, source]; the value part is the
  // formatted fact (see NUMBERS in src/data/facts.ts for the fact behind each odometer).
  'num.label': { zh: '數字', cls: 'F' },
  'num.title': { zh: '照實的數字。', cls: 'F', display: true },
  'num.asof': { zh: '截至 {snapshot.asOf}，取自公開倉庫。', cls: 'F' },
  'num.1': {
    zh: ['{commits.total}', '個 commit，{repos.count} 個公開倉庫的預設分支', '出處：GitHub API 快照'],
    cls: 'F',
    src: 'derived from src/data/snapshot.json; CI-checked',
  },
  'num.2': { zh: ['{gt.pass}', 'PASS：微光小鎮主線的測試套件', '出處 GlimmerTown `test_fixde.js`'], cls: 'F' },
  'num.3': {
    zh: ['{gt3d.parityOps}', '筆操作與 2D 程式逐位對拍，{gt3d.parityMaps} 張圖全部相等', '出處 GlimmerTown3D-lab D011'],
    cls: 'F',
  },
  'num.4': { zh: ['{math.configs}', '個構形驗證合法（n = 2..76）', '出處 FrontierMath MATH-001'], cls: 'F' },
  'num.5': { zh: ['{fr.cards}', '張問題卡，{fr.labs} 個實驗室', '出處 FrontierLab-Governance `STATUS.md`'], cls: 'F' },
  'num.6': { zh: ['{fr.budgetUsd}', '美元：每輪預設預算', '出處 FrontierLab-Governance'], cls: 'F' },

  // ── The record: every default-branch commit on its repo lane (figure#fig-record) ─────────────────────
  'record.label': { zh: '紀錄', cls: 'F' },
  'record.fig.title': { zh: '公開紀錄', cls: 'F' },
  // The second ● is amber (latest commit per lane).
  'record.fig.legend': { zh: '1 ●＝1 個 commit（預設分支）· ● 各倉庫最新一筆', cls: 'F' },
  'record.fig.caption': {
    zh: '{repos.count} 個公開倉庫、預設分支上的 {commits.total} 個 commit，2026-07-12 → 2026-09-30。每一點是一個 commit；2026-09-13 之前的時間軸已壓縮。',
    cls: 'F',
  },
  'record.fig.break': { zh: '軸線壓縮', cls: 'F' },
  'record.fig.ordinal': { zh: '位置＝提交順序，不是時間。', cls: 'F', src: 'only if the snapshot is unavailable (§6.1)' },
  'record.fig.tick.account': { zh: '帳號建立 2026-09-23', cls: 'F' },
  'record.fig.note': { zh: '早於帳號建立的 commit，是帶進來的較早歷史。', cls: 'F' },
  'record.table.caption': { zh: '{repos.count} 個公開倉庫的 commit 數（預設分支，快照 {snapshot.asOf}）', cls: 'F' },
  // list: column headers
  'record.table.cols': { zh: ['倉庫', '名稱', 'Commits', '首次', '最近'], cls: 'F' },
  'record.table.total': { zh: '合計', cls: 'F' },

  // ── Contact ──────────────────────────────────────────────────────────────────────────────────────────
  'contact.label': { zh: '聯絡', cls: 'F' },
  'contact.lede': { zh: '程式碼、任務卡、失敗紀錄，都在 GitHub。', cls: 'F' },
  'contact.github': { zh: 'GitHub · lijiabao1998 ↗', cls: 'F' },
  // Not approved (build-overrides §1): features.x is false, so this never renders.
  'contact.x': { zh: 'X ↗', cls: 'PE', fallback: null, feature: 'x' },
} satisfies Record<string, ZhEntry>;

const en = {
  'hero.eyebrow': 'lijiabao1998 · Taiwan',
  'hero.name': 'Li Jiabao',
  'hero.intro':
    'Runs two public projects: GlimmerTown, a game, and Frontier Lab, a research-governance program. Builds with AI models from several vendors: acceptance criteria first, then the work, and nothing merges until every check is green.',
  'hero.cta.work': 'See the work',
  'hero.cta.github': 'GitHub',
  'hero.cta.articles': 'Read the articles',
  'hero.meta.repos': '{repos.count} public repos',
  'hero.meta.snapshot': 'Data snapshot {snapshot.asOf}',

  'about.label': 'About',
  'about.role': 'Sets the direction of both projects and makes the final call. Each decision is dated.',
  'about.repos': 'GitHub lijiabao1998 · {repos.count} public repos · account created 2026-09-23',
  'about.older': "The work is older: GlimmerTown's first main-line commit is from 2026-07-12.",
  'about.belief.label': 'Belief',
  'about.belief': 'Everyone deserves a lab of their own.',
  'about.line1': [{ lang: 'zh-Hant', text: '心存善念，盡力而為' }],
  'about.line1.gloss': 'Keep good intentions; do your best.',
  'about.line2': [{ lang: 'zh-Hant', text: '但行好事，勿問前程' }],
  'about.line2.gloss': "Do good; don't ask where it leads.",
  'about.caption': 'Portrait: {n} dots, set on baselines. This picture is not data.',

  'work.label': 'Work',
  'work.title': 'Two bodies of work. One method.',
  'work.gt.title': 'GlimmerTown',
  'work.gt.kicker': 'Game · three lines of development',
  'work.gt.summary': 'An original isometric pixel-art city. One HTML file, no dependencies, works offline.',
  'work.gt.dates': '2026-07-12 → 2026-09-30',
  'work.gt.stat': '{commits.gt} commits · PASS={gt.pass}',
  'work.fr.title': 'Frontier Lab',
  'work.fr.kicker': 'Research governance · {fr.repos} repos',
  'work.fr.summary': 'One governance repo, {fr.labs} discipline labs, {fr.cards} problem cards.',
  'work.fr.dates': '2026-09-27 → 2026-09-29',
  'work.fr.stat': '{fr.cards} problem cards · default budget ${fr.budgetUsd} per round',
  'work.cta': 'Read the case →',

  'skills.label': 'Skills',
  'skills.lede': 'Each item below has a record behind it in the public repos.',
  'skills.1': [
    'Specs and acceptance',
    "Measure first, and write the acceptance criteria into the task card before any work starts. GlimmerTown's main line has {gt.cards} task cards.",
    'source GlimmerTown `docs/tasks/`',
  ],
  'skills.2': [
    'Tests and guards',
    "{gt.pass} PASS in the main line's test suite; {gtlab.guards} pixel guards on the lab line, and nothing merges until all of them are green.",
    'source GlimmerTown `test_fixde.js`',
  ],
  'skills.3': [
    'Working with several models',
    'The lab line has {gtlab.writers} model writers from different vendors, working under one written rulebook. Every merge needs a human to approve it.',
    'source GlimmerTown-lab `AGENTS.md`',
  ],
  'skills.4': [
    'Game and graphics',
    'An original isometric pixel-art city: one HTML file, no dependencies, works offline. On the 3D line, {gt3d.parityOps} operations were checked exactly against the 2D code, and all were equal.',
    'source GlimmerTown3D-lab D011',
  ],
  'skills.5': [
    'Research governance',
    '{fr.labs} discipline labs and {fr.cards} problem cards share one set of governance rules. The governance tool `frontier.py` uses the standard library only and has {gov.tests} tests.',
    'source FrontierLab-Governance `STATUS.md`',
  ],
  'skills.6': [
    'Websites',
    'This site is static Astro output with hand-written WebGL2, in Chinese and English. With JavaScript off you can still read every word. No trackers, no cookies.',
    "source this site's code",
  ],

  'method.label': 'How the work is done',
  'method.chain.title': 'One round of work',
  'method.chain': [
    'Measure',
    'write the card: acceptance criteria before the work',
    'build',
    'write the guards',
    "green, and the owner's nod, before merge",
  ],
  'method.writers':
    "Seven model writers from different vendors work on the lab line. Two can push to main; the other five each work on a branch and open PRs. Nothing merges without the owner's nod.",
  'method.writers.named': 'Push to main: Claude, Codex. Branch and PR: Grok, GLM, Kimi, DeepSeek, GPT.',
  'method.undone': "What didn't get done may not be left blank, and may not be dressed up.",
  'method.undone.cite': '— GlimmerTown-lab `AUTORUN.md`',
  'method.rules.title': 'Verification rules',
  'method.rules': [
    'Compiling is not correctness.',
    'A high benchmark score is not general ability.',
    'Two models agreeing is not independent verification.',
  ],
  'method.rules.cite': '— FrontierComputerScience README',

  'num.label': 'Numbers',
  'num.title': 'Numbers, as they are.',
  'num.asof': 'As of {snapshot.asOf}, from the public repos.',
  'num.1': ['{commits.total}', 'commits on the default branches of {repos.count} public repos', 'source: GitHub API snapshot'],
  'num.2': ['{gt.pass}', "PASS in GlimmerTown's main test suite", 'source GlimmerTown `test_fixde.js`'],
  'num.3': [
    '{gt3d.parityOps}',
    'operations checked exactly against the 2D code, {gt3d.parityMaps} maps, all equal',
    'source GlimmerTown3D-lab D011',
  ],
  'num.4': ['{math.configs}', 'configurations verified legal (n = 2..76)', 'source FrontierMath MATH-001'],
  'num.5': ['{fr.cards}', 'problem cards across {fr.labs} labs', 'source FrontierLab-Governance `STATUS.md`'],
  'num.6': ['${fr.budgetUsd}', 'default budget per round', 'source FrontierLab-Governance'],

  'record.label': 'Record',
  'record.fig.title': 'The public record',
  'record.fig.legend': '1 ● = 1 commit (default branch) · ● latest in each repo',
  'record.fig.caption':
    '{commits.total} default-branch commits across {repos.count} public repos, 2026-07-12 → 2026-09-30. Each point is one commit; the time axis is compressed before 2026-09-13.',
  'record.fig.break': 'Axis compressed',
  'record.fig.ordinal': 'Position = commit order, not time.',
  'record.fig.tick.account': 'Account created 2026-09-23',
  'record.fig.note': 'Commits older than the account are earlier history brought in with the repos.',
  'record.table.caption': 'Commits in {repos.count} public repos (default branch, snapshot {snapshot.asOf})',
  'record.table.cols': ['Repo', 'Name', 'Commits', 'First', 'Latest'],
  'record.table.total': 'Total',

  'contact.label': 'Contact',
  'contact.lede': 'Code, task cards and failure records all live on GitHub.',
  'contact.github': 'GitHub · lijiabao1998 ↗',
  'contact.x': 'X ↗',
} satisfies DictShape<typeof zh>;

export default defineNs(zh, en);
