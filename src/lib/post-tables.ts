// src/lib/post-tables.ts — the tables of /articles/ and /views/ posts. Astro 7 renders Markdown with Sätteri; this is a
// Sätteri hast plugin that astro.config.mjs adds to the default processor (no extra dependency). Every <table> of a
// post is wrapped in a named, focusable scroll region,
//
//   <div class="table-wrap" role="region" aria-label="表格 1" tabindex="0"><table>…</table></div>
//
// so the table keeps display: table (and its semantics for assistive technology) while a table too wide for the
// measure scrolls sideways inside the region, reachable by keyboard (styles/prose.css; .table-wrap in base.css).
// The label comes from the dictionary (posts.table) in the post's locale, read from its path
// (src/content/<section>/<zh-Hant|en>/<slug>.md); any other Markdown is left untouched.

import { tStr } from '../i18n/t.ts';
import type { Locale } from '../i18n/types.ts';

/** The hast element this plugin builds (the shape Sätteri and unified share). */
export interface HastElement {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: unknown[];
}

/** The part of Sätteri's HastVisitorContext used here. */
interface VisitorContext {
  readonly fileURL: URL | undefined;
  readonly data: Record<string, unknown>;
  wrapNode(node: unknown, parent: HastElement): void;
}

const POST_PATH = /[\\/]src[\\/]content[\\/](?:articles|views)[\\/](zh-Hant|en)[\\/][^\\/]+\.md$/;
const COUNT = 'ljPostTables';

/** The locale of a post file from its path, or null for anything that is not a post. */
export function postLocaleOf(path: string): Locale | null {
  const m = POST_PATH.exec(path);
  return m ? (m[1] as Locale) : null;
}

/** The scroll region around the `n`-th table (from 1) of a post in `locale`. */
export function tableRegion(locale: Locale, n: number): HastElement {
  return {
    type: 'element',
    tagName: 'div',
    properties: { className: ['table-wrap'], role: 'region', ariaLabel: tStr('posts.table', locale, { n }), tabIndex: 0 },
    children: [],
  };
}

/** The Sätteri hast plugin (a HastVisitorInstance with a name). */
export const postTables = {
  name: 'lj:post-tables',
  element: {
    filter: ['table'],
    visit(node: unknown, ctx: VisitorContext): void {
      const path = ctx.fileURL ? decodeURIComponent(ctx.fileURL.pathname) : '';
      const locale = postLocaleOf(path);
      if (!locale) return;
      const n = (Number(ctx.data[COUNT]) || 0) + 1;
      ctx.data[COUNT] = n;
      ctx.wrapNode(node, tableRegion(locale, n));
    },
  },
};
