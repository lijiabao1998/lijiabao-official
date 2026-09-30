// src/i18n/ns/fr.ts — spec §4.4 (Frontier). No vendor names in any shipping string.
import { defineNs, type DictShape, type ZhEntry } from '../types.ts';

const zh = {
  // ── Hero, round, rules ───────────────────────────────────────────────────────────────────
  'fr.label': { zh: '作品 · 研究治理', cls: 'F' },
  'fr.title': { zh: '前沿實驗室', cls: 'F', display: true },
  'fr.quote': {
    zh: '「這個倉庫管理研究程序，不替自然界或數學決定真相。」 — FrontierLab-Governance README',
    cls: 'OD',
    src: 'FrontierLab-Governance README; en is T',
  },
  'fr.lead': {
    zh: '前沿實驗室把同一套方法帶到科學前沿。不因品牌給任何模型免驗證權；兩個模型同意，不算獨立驗證。工具只用 Python 標準庫，每輪預設預算 {fr.budgetUsd} 美元。狀態照實標示：多數問題仍是 OPEN；物理、生物、化學的結果仍在審核中；數學有 {math.roundsMerged} 輪已合併的證據，但沒有宣稱解決。',
    cls: 'F',
  },
  'fr.notbench': { zh: '這不是 benchmark，也不是題庫，是一套治理嚴格的多模型研究流程。', cls: 'R', src: '[frontierA]' },
  // list: fact chips
  'fr.chips': {
    zh: ['{fr.govRepos} 個治理庫', '{fr.labs} 個實驗室', '{fr.cards} 張問題卡', 'Python 標準庫', '每輪預設 {fr.budgetUsd} 美元'],
    cls: 'F',
  },
  'fr.dates': { zh: '整個計畫建立於 2026-09-27 至 2026-09-29。', cls: 'F' },
  'fr.matrix.caption': { zh: '左邊是治理庫；每一列是一個實驗室，每一格是一張問題卡。◆ 標出每個實驗室的首輪問題。', cls: 'F' },
  'fr.matrix.legend': { zh: '1 ○＝1 張問題卡', cls: 'F' },
  'fr.round.title': { zh: '一輪研究，七道關', cls: 'F', display: true },
  // display list: the seven stage names alone (display face); fr.stage.N = [name, detail]
  'fr.stage.names': {
    zh: ['先查是否已解', '重現', '凍結', '有界探索', '獨立核查', '記錄', '審核合併'],
    cls: 'F',
    display: true,
    src: 'FrontierLab-Governance README pipeline',
  },
  'fr.stage.1': {
    zh: ['先查是否已解', '開工後 {fr.searchHours} 小時內重做四路檢索：一般、學科、解答、批評；已有外部解答就記 COMPLETED_EXTERNAL，停手。'],
    cls: 'R',
    src: '[frontierA] frontier.py admit',
  },
  'fr.stage.2': { zh: ['重現', '先重現已知結果。'], cls: 'F' },
  'fr.stage.3': { zh: ['凍結', '問題與驗證器先凍結。'], cls: 'F' },
  'fr.stage.4': {
    zh: ['有界探索', '每輪預設預算：{fr.budgetMinutes} 分鐘、{fr.budgetUsd} 美元、{fr.budgetTries} 次。'],
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.stage.5': { zh: ['獨立核查', '作者不能簽核自己的獨立驗證。'], cls: 'F' },
  'fr.stage.6': { zh: ['記錄', '結果與失敗都留下；紀錄只能新增，不能刪除。'], cls: 'R', src: '[frontierA] GATE_CONTRACT.md' },
  'fr.stage.7': { zh: ['審核合併', '作者不合自己的工作；業主決定。'], cls: 'F' },
  'fr.shelf.title': { zh: '已記錄的失敗', cls: 'F', display: true },
  // fr.shelf.N = [lab, item, status words]; render the status with <Status> (same weight as a pass)
  'fr.shelf.1': { zh: ['物理', '凍結的 E3', '未通過・已記錄'], cls: 'R', src: '[frontierA] FrontierPhysics PR #4' },
  'fr.shelf.2': { zh: ['生物', '一個未經驗證的 PASS', '已撤回・紀錄保留'], cls: 'F', src: 'FrontierBiology PR #2' },
  'fr.shelf.3': { zh: ['化學', 'C4／C5 凍結門檻', '未通過・已記錄'], cls: 'R', src: '[frontierA] FrontierChemistry PR #1' },
  'fr.shelf.4': {
    zh: ['{fr.newLabs} 個新實驗室', '第一次 CI', '未通過・已記錄，修好後重新釘版'],
    cls: 'R',
    src: '[frontierB] EXPANSION-2026-09-28.md',
  },
  'fr.rules.title': { zh: '規則', cls: 'F', display: true },
  'fr.rule.1': { zh: '「不因品牌給任意 agent 免驗證權」', cls: 'OD', src: 'Frontier AGENTS.md; en is T' },
  'fr.rule.2': { zh: '「兩個模型同意不算獨立實驗」', cls: 'OD', src: 'Frontier AGENTS.md; en is T' },
  'fr.open.title': { zh: 'OPEN 是什麼意思', cls: 'F', display: true },
  'fr.open.body': { zh: 'OPEN 只代表：本次有界檢索未找到同範圍的已確認解答。不是「未解」。', cls: 'F' },
  'fr.vocab.problem': {
    zh: '問題狀態：OPEN／PARTIAL／CLAIMED_RESOLVED／COMPLETED_EXTERNAL／COMPLETED_INTERNAL／PAUSED／RETRACTED',
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.vocab.round': { zh: '回合狀態：DRAFT／ADMITTED／PAUSED／CLOSED_EXTERNAL／FINISHED', cls: 'R', src: '[frontierA]' },

  // ── Labs, math, review, governance, bounds ───────────────────────────────────────────────
  'fr.labs.title': { zh: '{fr.labs} 個實驗室，一個治理核心', cls: 'F', display: true },
  'fr.labs.cards': { zh: '每個實驗室 {fr.cardsPerLab} 張問題卡', cls: 'F' },
  'fr.labs.view': { zh: '顯示方式', cls: 'F' },
  'fr.labs.grid': { zh: '格狀', cls: 'F' },
  'fr.labs.list': { zh: '列表', cls: 'F' },
  'fr.labs.asof': { zh: '資料截至 {snapshot.asOf}', cls: 'F' },
  'fr.math.title': { zh: '聚焦：no-three-in-line（MATH-001）', cls: 'F', display: true },
  'fr.math.body': {
    zh: '公開的 Flammenkamp 資料庫中，n = 2..76 的全部 {math.configs} 個構形都驗證為合法；n = 75 是唯一的缺口。',
    cls: 'F',
  },
  'fr.math.cross': {
    zh: 'n = 71–74 與 76 的紀錄，經兩條獨立檢索路徑交叉核對；第三個獨立驗證器，以 {math.adversarial} 例對抗測試檢查。',
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.math.lattice': { zh: '每一欄是一個 n（2 到 76）；空著的那一欄是 n = 75。欄高沒有數值意義。', cls: 'F' },
  'fr.math.gap': { zh: 'n = 75 · 缺口', cls: 'F' },
  'fr.math.not.title': { zh: '沒有宣稱的', cls: 'F', display: true },
  'fr.math.not.1': { zh: '不宣稱 D(75) = 150。', cls: 'OD', src: 'FrontierMath NOT claimed list' },
  'fr.math.not.2': { zh: '沒有 UNSAT 證書。', cls: 'OD', src: 'FrontierMath NOT claimed list' },
  'fr.math.not.3': { zh: 'MATH-001 沒有被解決。', cls: 'OD', src: 'FrontierMath NOT claimed list' },
  'fr.math.lean': { zh: 'Lean 4 CI 釘在 v4.34.1；目前唯一的定理是工具鏈的煙霧測試，「不是前沿成果」。', cls: 'OD', src: 'FrontierMath README' },
  'fr.math.affil': { zh: 'FrontierMath 與 Epoch AI 的同名 benchmark 無隸屬關係。', cls: 'F' },
  'fr.review.title': { zh: '審核中', cls: 'F', display: true },
  'fr.review.lead': { zh: '這三項結果都在尚未合併的 PR 裡。', cls: 'F' },
  'fr.review.phys': {
    zh: '物理 PR #4：精確重現另一個模型的結構函數估計（差距 {phys.gap}），記下凍結的 E3 FAIL，並撤回一個「漸近飽和」的說法。不對真實的 Navier–Stokes 湍流做任何宣稱。',
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.review.bio': {
    zh: '生物 PR #2：撤回一個未經驗證的 PASS。找到 {bio.overlaps} 筆 train/test 重疊，改以 donor split 重估為 {bio.donorSplit}，歷史失敗保留。',
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.review.chem': {
    zh: '化學 PR #1：加入 FreeSolv 驗證器，重現 GAFF 錨點 {chem.gaffAnchor}；C4、C5 凍結門檻記為 FAIL。PR #2 修正 CRLF／LF 雜湊不符，並把 C4 標為事後（post-hoc）。',
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.gov.title': { zh: '治理核心', cls: 'F', display: true },
  'fr.gov.stats': {
    zh: '`frontier.py` {gov.lines} 行，只用標準庫 · {gov.tests} 個測試 · mutation {gov.mutationKilled}/{gov.mutationTotal} · {commits.gov} commits · {gov.prs} 個 PR（{gov.prsOpen} open）',
    cls: 'F',
  },
  'fr.gov.cli': { zh: '指令：validate · start · admit · check-diff · check-pins · decide', cls: 'R', src: '[frontierA]' },
  'fr.gov.protocol': {
    zh: 'protocol 1.0.0 → 1.1.0 → 1.2.0 → 2.0.0（breaking）。{fr.newLabs} 個新實驗室釘 2.0.0，最早 {fr.firstLabs} 個仍釘 1.0.0。',
    cls: 'R',
    src: '[frontierA]',
  },
  'fr.gov.roles': { zh: '角色包括 Explorer、Verifier、Skeptic、Integrator；作者不能簽核自己的獨立驗證；業主決定合併。', cls: 'F' },
  'fr.gov.ci': {
    zh: '{fr.newLabs} 個新實驗室第一次跑 CI 全部失敗；工具修好、重新釘版。「失敗沒有刪除或改寫成第一次就通過」。',
    cls: 'R',
    src: '[frontierB] EXPANSION-2026-09-28.md (quote OD; en is T)',
  },
  'fr.gov.bp': { zh: '分支保護目前只是提案，尚未啟用。', cls: 'F' },
  'fr.bounds.title': { zh: '各實驗室的安全邊界', cls: 'F', display: true },
  'fr.bounds.bio': { zh: '生物：只用良性公開基準；不碰病原體、毒素或濕實驗；不作臨床診斷或治療建議。', cls: 'R', src: '[frontierA]' },
  'fr.bounds.chem': { zh: '化學：拒絕武器、毒劑、爆裂物與濕實驗執行。', cls: 'R', src: '[frontierA]' },
  'fr.bounds.med': { zh: '醫學：不對個人提供診療結論。', cls: 'R', src: '[frontierB]' },
  'fr.bounds.eng': { zh: '工程：不連真實電網、交通、機器人或工控設備。', cls: 'R', src: '[frontierB]' },
  'fr.bounds.earth': { zh: '地球：只做公開資料與回測，不作個人即時災害指示。', cls: 'R', src: '[frontierB]' },
  'fr.bounds.neuro': { zh: '神經：不做侵入式研究，不用個人神經資料。', cls: 'R', src: '[frontierB]' },
  'fr.bounds.mat': { zh: '材料：付費的 DFT／GPU 運算需另外授權；預設預算 {fr.budgetUsd} 美元。', cls: 'R', src: '[frontierB]; brief C9' },

  // ── Undone and next ──────────────────────────────────────────────────────────────────────
  'fr.undone.title': { zh: '沒做成的事', cls: 'OD', display: true, src: 'GlimmerTown-lab AUTORUN.md rule' },
  'fr.undone.1': { zh: '{fr.labs} 個實驗室裡，{fr.labsNoRounds} 個還沒有研究輪次。', cls: 'F' },
  'fr.undone.2': { zh: '分支保護只是提案，尚未啟用。', cls: 'F' },
  'fr.undone.3': { zh: 'FrontierMath 的 `STATUS.md` 過時，仍寫 {math.statusRounds} 輪。', cls: 'F' },
  'fr.undone.4': { zh: '{fr.repos} 個倉庫都還沒有 live demo（Pages 回 404）。', cls: 'F' },
  'fr.next': { zh: '下一個：微光小鎮 →', cls: 'F', display: true },
} satisfies Record<string, ZhEntry>;

const en = {
  'fr.label': 'Work · Research governance',
  'fr.title': 'Frontier Lab',
  'fr.quote':
    '"This repository manages the research process. It does not decide what is true about nature or mathematics." — FrontierLab-Governance README',
  'fr.lead':
    "Frontier Lab takes the same method to open science. No model is exempt from checks because of its brand, and two models agreeing is not independent verification. The tooling is the Python standard library only, and each round's default budget is ${fr.budgetUsd}. Status is shown as it is: most problems are still OPEN; the Physics, Biology and Chemistry results are still in review; Math has one merged round of evidence and claims no resolution.",
  'fr.notbench': 'It is not a benchmark or a Q&A set. It is a multi-model research workflow under strict governance.',
  'fr.chips': ['{fr.govRepos} governance repo', '{fr.labs} labs', '{fr.cards} problem cards', 'Python standard library', '${fr.budgetUsd} default per round'],
  'fr.dates': 'The whole program was set up between 2026-09-27 and 2026-09-29.',
  'fr.matrix.caption': "Governance on the left; one row per lab, one cell per problem card. ◆ marks each lab's first-round problem.",
  'fr.matrix.legend': '1 ○ = 1 problem card',
  'fr.round.title': 'One round, seven gates',
  'fr.stage.names': [
    "Check whether it's solved",
    'Reproduce',
    'Freeze',
    'Bounded exploration',
    'Independent verification',
    'Record',
    'Reviewed merge',
  ],
  'fr.stage.1': [
    "Check whether it's solved",
    'a fresh four-way search within {fr.searchHours} hours of starting: general, discipline, solution, criticism. If an outside solution exists, it is recorded as COMPLETED_EXTERNAL and the work stops.',
  ],
  'fr.stage.2': ['Reproduce', 'reproduce the known result first.'],
  'fr.stage.3': ['Freeze', 'the problem and its verifier are frozen first.'],
  'fr.stage.4': ['Bounded exploration', 'default budget per round: {fr.budgetMinutes} minutes, ${fr.budgetUsd}, {fr.budgetTries} tries.'],
  'fr.stage.5': ['Independent verification', 'no author signs off their own independent verification.'],
  'fr.stage.6': ['Record', 'results and failures both stay; records can be added to, never deleted.'],
  'fr.stage.7': ['Reviewed merge', 'authors never merge their own work; the owner decides.'],
  'fr.shelf.title': 'Failures on record',
  'fr.shelf.1': ['Physics', 'frozen E3', 'Failed · recorded'],
  'fr.shelf.2': ['Biology', 'an unverified PASS', 'Withdrawn · kept on record'],
  'fr.shelf.3': ['Chemistry', 'frozen C4/C5 thresholds', 'Failed · recorded'],
  'fr.shelf.4': ['{fr.newLabs} new labs', 'first CI run', 'Failed · recorded, then fixed and re-pinned'],
  'fr.rules.title': 'Rules',
  'fr.rule.1': '"No agent is exempt from verification because of its brand."',
  'fr.rule.2': '"Two models agreeing is not an independent experiment."',
  'fr.open.title': 'What OPEN means',
  'fr.open.body': 'OPEN means only this: this bounded search found no confirmed solution of the same scope. It does not mean "unsolved".',
  'fr.vocab.problem':
    'Problem states: OPEN / PARTIAL / CLAIMED_RESOLVED / COMPLETED_EXTERNAL / COMPLETED_INTERNAL / PAUSED / RETRACTED',
  'fr.vocab.round': 'Round states: DRAFT / ADMITTED / PAUSED / CLOSED_EXTERNAL / FINISHED',

  'fr.labs.title': '{fr.labs} labs, one governance core',
  'fr.labs.cards': '{fr.cardsPerLab} problem cards per lab',
  'fr.labs.view': 'View',
  'fr.labs.grid': 'Grid',
  'fr.labs.list': 'List',
  'fr.labs.asof': 'Data as of {snapshot.asOf}',
  'fr.math.title': 'Focus: no-three-in-line (MATH-001)',
  'fr.math.body':
    'All {math.configs} configurations in the public Flammenkamp database for n = 2..76 were verified legal; n = 75 is the only gap.',
  'fr.math.cross':
    'Records for n = 71–74 and 76 were cross-checked through two independent retrieval paths; an independent third verifier was checked by a {math.adversarial}-case adversarial suite.',
  'fr.math.lattice': 'Each column is one n (2 to 76); the empty one is n = 75. Column height carries no data.',
  'fr.math.gap': 'n = 75 · gap',
  'fr.math.not.title': 'Not claimed',
  'fr.math.not.1': 'No claim that D(75) = 150.',
  'fr.math.not.2': 'No UNSAT certificate.',
  'fr.math.not.3': 'MATH-001 is not resolved.',
  'fr.math.lean': 'Lean 4 CI is pinned to v4.34.1. The only theorem so far is a toolchain smoke test, "not a frontier result".',
  'fr.math.affil': "FrontierMath is not affiliated with Epoch AI's FrontierMath benchmark.",
  'fr.review.title': 'In review',
  'fr.review.lead': "These three results sit in PRs that haven't been merged.",
  'fr.review.phys':
    'Physics PR #4 reproduces another model\'s structure-function estimator exactly (a {phys.gap} gap), records a frozen E3 FAIL, and retracts an "asymptotic saturation" claim. It makes no claim about real Navier–Stokes turbulence.',
  'fr.review.bio':
    'Biology PR #2 withdraws an unverified PASS. It found {bio.overlaps} train/test overlaps, re-estimated with a donor split at {bio.donorSplit}, and kept the historical failures.',
  'fr.review.chem':
    'Chemistry PR #1 adds a FreeSolv validator and reproduces the GAFF anchor ({chem.gaffAnchor}); the frozen C4 and C5 thresholds are recorded as FAIL. PR #2 fixes a CRLF/LF hash mismatch and marks C4 as post-hoc.',
  'fr.gov.title': 'The governance core',
  'fr.gov.stats':
    '`frontier.py` {gov.lines} lines, standard library only · {gov.tests} tests · mutation {gov.mutationKilled}/{gov.mutationTotal} · {commits.gov} commits · {gov.prs} PRs ({gov.prsOpen} open)',
  'fr.gov.cli': 'Commands: validate · start · admit · check-diff · check-pins · decide',
  'fr.gov.protocol':
    'Protocol 1.0.0 → 1.1.0 → 1.2.0 → 2.0.0 (breaking). The {fr.newLabs} newer labs pin 2.0.0; the first {fr.firstLabs} still pin 1.0.0.',
  'fr.gov.roles':
    'Roles include Explorer, Verifier, Skeptic and Integrator. No author signs off their own independent verification; the owner decides merges.',
  'fr.gov.ci':
    'All {fr.newLabs} new labs failed CI on their first run; the tooling was fixed and re-pinned. "The failure was not deleted or rewritten as a first-time pass."',
  'fr.gov.bp': "Branch protection is only a proposal; it isn't enabled.",
  'fr.bounds.title': "Each lab's safety limits",
  'fr.bounds.bio': 'Biology: benign public benchmarks only; no pathogens, toxins or wet-lab work; no clinical diagnosis or treatment advice.',
  'fr.bounds.chem': 'Chemistry: refuses weapons, toxic agents, explosives and wet-lab execution.',
  'fr.bounds.med': 'Medicine: no diagnostic or treatment conclusions for individuals.',
  'fr.bounds.eng': 'Engineering: no connection to real grids, traffic, robots or industrial control.',
  'fr.bounds.earth': 'Earth: public data and backtests only; no real-time hazard guidance for individuals.',
  'fr.bounds.neuro': 'Neuroscience: no invasive work, no personal neural data.',
  'fr.bounds.mat': 'Materials: paid DFT/GPU runs need separate authorization; the default budget is ${fr.budgetUsd}.',

  'fr.undone.title': "What didn't get done",
  'fr.undone.1': '{fr.labsNoRounds} of the {fr.labs} labs have no research rounds yet.',
  'fr.undone.2': "Branch protection is only a proposal; it isn't enabled.",
  'fr.undone.3': "FrontierMath's `STATUS.md` is stale and still says {math.statusRounds} rounds.",
  'fr.undone.4': 'None of the {fr.repos} repos has a live demo yet (Pages returns 404).',
  'fr.next': 'Next: GlimmerTown →',
} satisfies DictShape<typeof zh>;

export default defineNs(zh, en);
