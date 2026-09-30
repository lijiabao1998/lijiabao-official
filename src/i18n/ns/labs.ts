// src/i18n/ns/labs.ts — spec §4.5: lab tile templates + the 16 tile descriptions.
// Tile facts and the status chip come from src/data/labs.ts, never from a uniform string (brief C1).
// Names are `repo.<id>.name` (ns/common.ts). `labs.<id>.desc`: zh = the README method chain (OD),
// en = the brief's one-liner (F). Content rules: the matrix shows card IDs only; SOC shows only
// SOC-008 and its method; no country content anywhere.
import { defineNs, type DictShape, type ZhEntry } from '../types.ts';

const OD = 'zh: lab README method chain (OD); en: brief one-liner (F)';

const zh = {
  'lab.commits': { zh: '{n} commits', cls: 'F' },
  'lab.prs.merged': { zh: '{n} 個已合併 PR', cls: 'F' },
  'lab.prs.open': { zh: '{n} 個 open PR', cls: 'F' },
  'lab.rounds.merged': { zh: '{n} 輪已合併', cls: 'F' },
  'lab.first': { zh: '首輪 {id}', cls: 'F' },
  'lab.protocol': { zh: 'protocol {v}', cls: 'F' },
  'lab.ci': { zh: 'CI 綠', cls: 'F' },

  'labs.gov.desc': { zh: '共用規則與閘門軟體', cls: 'OD', src: OD },
  'labs.math.desc': { zh: '精確構造 → 反例／證書 → 形式證明', cls: 'OD', src: OD },
  'labs.phys.desc': { zh: '可重現基線 → 物理一致性 → 可區分預測', cls: 'OD', src: OD },
  'labs.bio.desc': { zh: '公開資料 → 基線重現 → 跨條件驗證 → 可檢驗假說', cls: 'OD', src: OD },
  'labs.chem.desc': { zh: '計算／實驗參照分清 → 基線重現 → 誤差與外推 → 候選假說', cls: 'OD', src: OD },
  'labs.cs.desc': { zh: '可執行規格 → 可重現基線 → 對抗性驗證 → 系統／演算法進步', cls: 'OD', src: OD },
  'labs.stat.desc': { zh: '識別條件 → finite-sample／asymptotic 保證 → 壓力測試 → 外部泛化', cls: 'OD', src: OD },
  'labs.meta.desc': { zh: '研究流程本身也要被實驗', cls: 'OD', src: OD },
  'labs.soc.desc': {
    zh: [{ lang: 'en', text: 'measurement → identification → replication → transportability' }],
    cls: 'OD',
    src: OD,
  },
  'labs.mat.desc': { zh: '虛擬候選 → 穩定性／可合成性 → 性質驗證 → 實驗邊界', cls: 'OD', src: OD },
  'labs.astro.desc': { zh: '觀測 selection function → 基線重現 → 競爭模型可區分預測 → 新資料外部驗證', cls: 'OD', src: OD },
  'labs.earth.desc': { zh: '觀測資料 → 物理／統計基線 → 極端／低頻事件校準 → 外部時空驗證', cls: 'OD', src: OD },
  'labs.neuro.desc': { zh: '可區分假說 → 跨刺激／個體驗證 → 因果或干預證據 → 機制邊界', cls: 'OD', src: OD },
  'labs.econ.desc': {
    zh: [
      'AI 經濟的 ',
      { lang: 'en', text: 'measurement → causal identification → organization／task redesign → general-equilibrium interpretation' },
    ],
    cls: 'OD',
    src: OD,
  },
  'labs.eng.desc': { zh: 'simulation-first → 故障注入 → OOD／不確定性 → 安全邊界 → 才談部署', cls: 'OD', src: OD },
  'labs.med.desc': {
    zh: [{ lang: 'en', text: 'technical validity → external validity → clinical utility → prospective／real-world evidence' }],
    cls: 'OD',
    src: OD,
  },
} satisfies Record<string, ZhEntry>;

const en = {
  'lab.commits': '{n} commits',
  'lab.prs.merged': '{n} merged {n|PR|PRs}',
  'lab.prs.open': '{n} open {n|PR|PRs}',
  'lab.rounds.merged': '{n} merged {n|round|rounds}',
  'lab.first': 'First round: {id}',
  'lab.protocol': 'protocol {v}',
  'lab.ci': 'CI green',

  'labs.gov.desc': 'Shared rulebook and gate software',
  'labs.math.desc': 'Exact constructions → certificates → Lean proofs',
  'labs.phys.desc': 'Reproducible baseline → physical consistency → predictions that tell models apart',
  'labs.bio.desc': 'Public data → baseline → cross-condition validation → testable hypotheses',
  'labs.chem.desc': 'Keeps computed and experimental references separate; starts from solvation',
  'labs.cs.desc': 'Formal verification and honest evaluation of AI coding agents',
  'labs.stat.desc': 'Valid inference under distribution shift, selection and dependence',
  'labs.meta.desc': 'Tests whether AI-agent science and its governance actually improve research',
  'labs.soc.desc': 'Measurement → identification → replication → transportability',
  'labs.mat.desc': 'Separates what computation predicts from what can actually be synthesized',
  'labs.astro.desc': 'Treats catalogs and their selection functions as research objects',
  'labs.earth.desc': 'Calibrating forecasts of rare, extreme events',
  'labs.neuro.desc': 'Designs stimuli that make brain-computation models disagree',
  'labs.econ.desc': 'Measures what AI actually does to firms, tasks and work',
  'labs.eng.desc': 'Simulation-first: fault injection and uncertainty before any deployment',
  'labs.med.desc': 'Validating medical AI across hospitals and over time',
} satisfies DictShape<typeof zh>;

export default defineNs(zh, en);
