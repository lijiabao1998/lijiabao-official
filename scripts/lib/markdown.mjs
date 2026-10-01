// scripts/lib/markdown.mjs — the built page's <main>, as Markdown, for llms.txt / llms-full.txt / <page>/index.md.
//
// Reads what a visitor reads, in reading order, from the rendered HTML (dist), so the Markdown can never drift from
// the page. Skipped: anything aria-hidden (the visual copies of animated lines and odometers — their sr-only text
// stays), [hidden], .js-only controls, [data-parity-ignore] (live readouts), controls (button/input/select/fieldset),
// svg, canvas, images, tooltips/popovers, <noscript>, in-page anchor links (↓ 作品) and the "(external site)" hints
// inside external links (the URL already says so).
//
// Kept on purpose: the DATA / SCHEMATIC / PORTRAIT chips with their definitions, as one line — "（示意：…）" — so a
// reader can tell a diagram from a record. Tables become Markdown tables (rowspan honoured; a table without a header
// row gets an empty one so data stays data). Multi-block list items keep one bullet; <ol> keeps its numbers. Inside
// an <article>, lines that come before its heading in the DOM (a lab tile's status) are written after the heading.
// Components can add `data-md-after="…"` to put a separator after an element (label — value) without changing
// what the page shows.

import { decode, parseAttrs, tokenize } from './html.mjs';

const SKIP_TAGS = new Set(['svg', 'canvas', 'img', 'picture', 'video', 'audio', 'button', 'input', 'select', 'textarea', 'fieldset', 'template', 'noscript', 'iframe', 'dialog', 'summary']);
const BLOCK = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dt', 'dd', 'blockquote', 'figcaption', 'caption', 'div', 'section',
  'article', 'header', 'footer', 'nav', 'figure', 'ul', 'ol', 'dl', 'details', 'aside', 'main', 'pre', 'hr',
  'address', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'form',
]);
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'track']);
const CJK_END = /[⺀-鿿豈-﫿＀-￯　-〿]$/u;
const CJK_START = /^[⺀-鿿豈-﫿＀-￯　-〿]/u;
const HAN1 = /^\p{Script=Han}$/u;
const BR = '\u0000';
/** a soft boundary between two adjacent elements (CSS gap on screen, nothing in the text) */
const SEP = '\u0001';
const CJK_PUNCT_END = /[，。、：；！？」』）〉》·—]$/u;
const CJK_PUNCT_START = /^[，。、：；！？「」『』（）〈〉《》·—]/u;
const hasClass = (attrs, c) => new RegExp(`(?:^|\\s)${c}(?:\\s|$)`).test(attrs.get('class') ?? '');

function skippable(name, attrs, ctx) {
  if (ctx.chip) return false; // a chip keeps its button label and its tooltip definition
  if (SKIP_TAGS.has(name)) return true;
  if (attrs.get('aria-hidden') === 'true') return true;
  if (attrs.has('hidden') || attrs.has('data-parity-ignore') || attrs.has('popover')) return true;
  if (hasClass(attrs, 'js-only')) return true;
  const role = attrs.get('role');
  if (role === 'tooltip' || role === 'presentation' || role === 'none') return true;
  // state-dependent notes (shown only under reduced motion) and keyboard hints for the interactive figures
  if (/(?:^|\s)[\w-]*-reduced(?:\s|$)/.test(attrs.get('class') ?? '')) return true;
  if (/-hint$/.test(attrs.get('id') ?? '')) return true;
  // in-page jump links (↓ 作品) are navigation, not content
  if (name === 'a' && (attrs.get('href') ?? '').startsWith('#')) return true;
  // "(external site)" inside an external link
  if (ctx.externalLink && hasClass(attrs, 'sr-only')) return true;
  return false;
}

const joinWith = (acc, part, glue) => (!acc ? part : !part ? acc : acc + glue(acc, part) + part);

/** Join text pieces: <br> glues CJK seams and spaces Latin; an element seam glues after/before CJK punctuation. */
function squash(s) {
  const t = s.replace(/[ \t\r\n\f]+/g, ' ');
  return t
    .split(BR)
    .map((line) =>
      line
        .split(SEP)
        .map((p) => p.trim())
        .reduce(
          (acc, part) =>
            joinWith(acc, part, (a, b) =>
              CJK_PUNCT_END.test(a) || CJK_PUNCT_START.test(b) || (HAN1.test(a.slice(-1)) && HAN1.test(b) ) ? '' : ' ',
            ),
          '',
        ),
    )
    .reduce((acc, part) => joinWith(acc, part, (a, b) => (CJK_END.test(a) || CJK_START.test(b) ? '' : ' ')), '')
    .trim();
}

/** Link labels: escape only what can break the link syntax (`code` spans and file_names stay readable). */
const labelEscape = (s) => s.replace(/([\\[\]])/g, '\\$1');
const cell = (s) => squash(s).replace(/\|/g, '\\|');

/**
 * @param {string} html  a built page
 * @param {string} site  e.g. https://lijiabao.dev
 * @returns {string} Markdown of <main>
 */
export function mainToMarkdown(html, site) {
  const host = new URL(site).host;
  const zh = /<html[^>]*\blang="zh/i.test(html);
  const out = [];
  /** @type {{name:string, skip:boolean, attrs?:Map<string,string>, items?:number, blocks?:number, art?:object}[]} */
  const stack = [];
  let skipDepth = 0;
  let inMain = false;
  let buf = '';
  /** link being collected: { href, start } (start = buf index) */
  const links = [];
  /** table being collected: rows of cells, whether a <thead>/<th scope=col> header exists, rowspan carry */
  let table = null;
  let row = null;
  let cellBuf = null;
  let cellSpan = 1;
  /** chip being collected (data-chip): label (button text) and definition (tooltip text) */
  let chip = null;
  /** an element just closed and nothing has been written since: the next element is its visual neighbour */
  let seam = false;

  const write = (t) => {
    if (chip) chip[chip.part] += t;
    else if (cellBuf !== null) cellBuf += t;
    else buf += t;
  };

  const ctxFlags = () => {
    let externalLink = false;
    for (const e of stack) {
      if (e.name === 'a' && e.attrs) {
        const href = e.attrs.get('href') ?? '';
        try {
          externalLink ||= /^https?:/.test(href) && new URL(href).host !== host;
        } catch {
          /* relative */
        }
      }
    }
    return { chip: !!chip, externalLink };
  };

  /** the innermost <article> on the stack (lines before its heading wait in art.pre) */
  const article = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].name === 'article' && !stack[i].skip) return stack[i].art;
    return null;
  };

  const emit = (line, isHeading) => {
    const art = article();
    if (art && !art.headed) {
      if (isHeading) {
        art.headed = true;
        out.push(line, ...art.pre);
        art.pre = [];
      } else art.pre.push(line);
      return;
    }
    out.push(line);
  };

  const flush = () => {
    if (cellBuf !== null || chip) return; // a table cell / chip owns the text
    const text = squash(buf);
    buf = '';
    if (!text) return;
    let heading = 0;
    let quoteAt = -1;
    let term = false;
    let li = null;
    let liAt = -1;
    const lists = [];
    stack.forEach((e, i) => {
      if (/^h[1-6]$/.test(e.name)) heading = Number(e.name[1]);
      if (e.name === 'blockquote' && quoteAt < 0) quoteAt = i;
      if (e.name === 'dt') term = true;
      if (e.name === 'ul' || e.name === 'ol') lists.push(e);
      if (e.name === 'li') {
        li = e;
        liAt = i;
      }
    });
    let line = text;
    if (heading) line = `${'#'.repeat(Math.min(6, heading + 1))} ${text}`; // page h1 → ##: each page is a section
    else if (term) line = `**${text}**`;
    // a quote inside a list item is quoted after the bullet; a list inside a quote is quoted in front of it
    const quoteInside = quoteAt >= 0 && li && quoteAt > liAt;
    if (quoteInside) line = `> ${line}`;
    if (li && !heading) {
      const depth = Math.max(0, lists.length - 1);
      const list = lists[lists.length - 1];
      const indent = '   '.repeat(depth);
      if (!li.blocks) {
        const marker = list && list.name === 'ol' ? `${li.n}.` : '-';
        line = `${indent}${marker} ${line}`;
      } else line = `${indent}   ${line}`; // a later block of the same item: continuation, no new bullet
      li.blocks = (li.blocks ?? 0) + 1;
    }
    if (quoteAt >= 0 && !quoteInside) line = `> ${line}`;
    emit(line, !!heading);
  };

  const finishTable = () => {
    if (!table || !table.rows.length) return;
    const cols = Math.max(...table.rows.map((r) => r.length));
    const pad = (r) => [...r, ...Array(cols - r.length).fill('')];
    const rows = table.rows.map(pad);
    const head = table.header ? rows.shift() : Array(cols).fill('');
    out.push(`| ${head.join(' | ')} |`, `|${' --- |'.repeat(cols)}`, ...rows.map((r) => `| ${r.join(' | ')} |`));
  };

  /** fill the columns that a rowspan from an earlier row still covers */
  const fillCarry = () => {
    while (table && row && (table.carry[row.length] ?? 0) > 0) {
      table.carry[row.length]--;
      row.push('');
    }
  };

  for (const tok of tokenize(html)) {
    if (tok.type === 'raw') continue;
    if (tok.type === 'open') {
      const name = tok.name.toLowerCase();
      const attrs = tok.attrs instanceof Map ? tok.attrs : parseAttrs(tok.attrs ?? '');
      if (name === 'main') inMain = true;
      if (!inMain) continue;
      const isVoid = VOID.has(name) || tok.selfClosing;
      if (skipDepth > 0 || skippable(name, attrs, ctxFlags())) {
        if (!isVoid) {
          stack.push({ name, skip: true });
          skipDepth++;
        }
        continue;
      }
      if (name === 'br') {
        write(cellBuf !== null || chip ? ' ' : BR);
        seam = false;
        continue;
      }
      const entry = { name, skip: false, attrs };
      if (attrs.has('data-chip') && !chip && cellBuf === null) {
        chip = { label: '', def: '', part: 'label' };
      } else if (chip && attrs.get('role') === 'tooltip') {
        chip.part = 'def';
      } else if (name === 'table') {
        flush();
        table = { rows: [], header: false, carry: [] };
      } else if (name === 'thead' && table) {
        table.header = true;
      } else if (name === 'tr' && table) {
        row = [];
      } else if ((name === 'td' || name === 'th') && row) {
        fillCarry();
        cellBuf = '';
        cellSpan = Math.max(1, Number(attrs.get('rowspan')) || 1);
        if (name === 'th' && attrs.get('scope') === 'col' && !table.rows.length) table.header = true;
      } else if (name === 'li') {
        flush();
        const list = [...stack].reverse().find((e) => e.name === 'ul' || e.name === 'ol');
        if (list) list.items = (list.items ?? 0) + 1;
        entry.n = list ? list.items : 1;
      } else if (name === 'article') {
        flush();
        entry.art = { headed: false, pre: [] };
      } else if (BLOCK.has(name)) {
        flush();
      } else if (seam || hasClass(attrs, 'sr-only')) {
        write(cellBuf !== null || chip ? ' ' : SEP);
      }
      seam = false;
      if (name === 'a') links.push({ href: attrs.get('href') ?? '', start: cellBuf !== null || chip ? null : buf.length });
      if (name === 'code') write('`');
      if (!isVoid) stack.push(entry);
      continue;
    }
    if (tok.type === 'close') {
      const name = tok.name.toLowerCase();
      if (!inMain) continue;
      let idx = -1;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) {
          idx = i;
          break;
        }
      }
      if (idx < 0) continue;
      if (stack[idx].skip) {
        for (const p of stack.splice(idx)) if (p.skip) skipDepth--;
        // a skipped inline neighbour (an aria-hidden " · ") still separates what is around it
        if (skipDepth === 0 && !BLOCK.has(name)) seam = true;
        continue;
      }
      const entry = stack[idx];
      // finish the element while it is still on the stack (headings, list items and quotes read their context)
      if (name === 'main') {
        flush();
        stack.splice(idx);
        inMain = false;
        break;
      }
      if (chip && entry.attrs?.has('data-chip')) {
        const label = squash(chip.label);
        const def = squash(chip.def);
        chip = null;
        stack.splice(idx);
        if (label) {
          flush();
          emit(zh ? `（${label}${def ? `：${def}` : ''}）` : `(${label}${def ? `: ${def}` : ''})`, false);
        }
        seam = false;
        continue;
      }
      if (chip && entry.attrs?.get('role') === 'tooltip') chip.part = 'label';
      if ((name === 'td' || name === 'th') && row && cellBuf !== null) {
        row.push(cell(cellBuf));
        if (cellSpan > 1) table.carry[row.length - 1] = cellSpan - 1;
        cellBuf = null;
      } else if (name === 'tr' && table && row) {
        fillCarry();
        if (row.length) table.rows.push(row);
        row = null;
      } else if (name === 'table' && table) {
        finishTable();
        table = null;
      } else if (name === 'a') {
        const l = links.pop();
        if (l && l.start !== null && cellBuf === null && !chip) {
          const label = squash(buf.slice(l.start));
          if (label && l.href && !l.href.startsWith('javascript:')) {
            buf = `${buf.slice(0, l.start)}[${labelEscape(label)}](${new URL(l.href, site).href})`;
          }
        }
      } else if (name === 'code') {
        write('`');
      } else if (name === 'article') {
        flush();
        const art = entry.art;
        if (art && art.pre.length) out.push(...art.pre);
      } else if (BLOCK.has(name)) {
        flush();
      }
      const after = entry.attrs?.get('data-md-after');
      for (const p of stack.splice(idx)) if (p.skip) skipDepth--;
      if (after) {
        write(after);
        seam = false;
      } else seam = !BLOCK.has(name);
      continue;
    }
    if (tok.type === 'text' && inMain && skipDepth === 0) {
      const t = decode(tok.text);
      if (!t.trim()) {
        write(' '); // the {" "} Astro keeps at zh/Latin seams: a real space, not a seam
        continue;
      }
      write(t);
      seam = false;
    }
  }
  flush();
  // collapse runs of identical adjacent lines and keep blank lines between blocks
  const lines = out.filter((l, i) => l !== out[i - 1]);
  const kind = (l) => (l.startsWith('|') ? 'table' : /^(?:> )?\s*(?:-|\d+\.)\s/.test(l) || /^(?:> )?\s{3,}\S/.test(l) ? 'list' : 'block');
  const md = [];
  for (const l of lines) {
    const prev = md.length ? md[md.length - 1] : null;
    // tables and lists stay tight; every other block gets a blank line before it
    if (prev !== null && !(kind(l) !== 'block' && kind(l) === kind(prev))) md.push('');
    md.push(l);
  }
  return `${md.join('\n')}\n`;
}
