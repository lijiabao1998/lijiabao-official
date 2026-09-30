// src/i18n/ns/nf.ts — spec §4.6 (404).
import { defineNs, type DictShape, type ZhEntry } from '../types.ts';

const zh = {
  'nf.code': { zh: '404', cls: 'F' },
  'nf.title': { zh: '這一頁沒有紀錄，所以沒有光。', cls: 'F', display: true },
  'nf.body': { zh: '網址可能打錯，或頁面已經移走。', cls: 'F' },
  // list: link labels in order [home, GlimmerTown, Frontier]
  'nf.links': { zh: ['回首頁', '微光小鎮', '前沿實驗室'], cls: 'F' },
} satisfies Record<string, ZhEntry>;

const en = {
  'nf.code': '404',
  'nf.title': 'No record here, so no light.',
  'nf.body': 'The address may be mistyped, or the page has moved.',
  'nf.links': ['Home', 'GlimmerTown', 'Frontier Lab'],
} satisfies DictShape<typeof zh>;

export default defineNs(zh, en);
