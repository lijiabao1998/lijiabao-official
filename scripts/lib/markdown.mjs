// scripts/lib/markdown.mjs — the built page's <main>, as Markdown, for llms.txt / llms-full.txt / <page>/index.md.
//
// Reads what a visitor reads, in reading order, from the rendered HTML (dist), so the Markdown can never drift from
// the page. Skipped: anything aria-hidden (the visual copies of animated lines and odometers — their sr-only text
// stays), [hidden], [data-parity-ignore] (live readouts), controls (button/input/select/fieldset), svg, canvas,
// images, tooltips/popovers and <noscript>. Tables become Markdown tables; links keep absolute URLs.

import { decode, parseAttrs, tokenize } from './html.mjs';

const SKIP_TAGS = new Set(['svg', 'canvas', 'img', 'picture', 'video', 'audio', 'button', 'input', 'select', 'textarea', 'fieldset', 'template', 'noscript', 'iframe', 'dialog', 'summary']);
const BLOCK = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dt', 'dd', 'blockquote', 'figcaption', 'caption', 'div', 'section',
  'article', 'header', 'footer', 'nav', 'figure', 'ul', 'ol', 'dl', 'details', 'summary', 'aside', 'main', 'pre', 'hr',
  'address', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'form',
]);
const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'track']);
const CJK_END = /[⺀-鿿豈-﫿＀-￯　-〿]$/u;
const CJK_START = /^[⺀-鿿豈-﫿＀-￯　-〿]/u;
const BR = '\u0000';
/** a soft boundary between two adjacent elements (CSS gap on screen, nothing in the text) */
const SEP = '\u0001';
const CJK_PUNCT_END = /[，。、：；！？」』）〉》·]$/u;
const CJK_PUNCT_START = /^[，。、：；！？「」『』（）〈〉《》·]/u;

function skippable(name, attrs) {
  if (SKIP_TAGS.has(name)) return true;
  if (attrs.get('aria-hidden') === 'true') return true;
  if (attrs.has('hidden') || attrs.has('data-parity-ignore') || attrs.has('popover')) return true;
  const role = attrs.get('role');
  if (role === 'tooltip' || role === 'presentation' || role === 'none') return true;
  // state-dependent notes (shown only under reduced motion) and keyboard hints for the interactive figures
  if (/(?:^|\s)[\w-]*-reduced(?:\s|$)/.test(attrs.get('class') ?? '')) return true;
  if (/-hint$/.test(attrs.get('id') ?? '')) return true;
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
        .reduce((acc, part) => joinWith(acc, part, (a, b) => (CJK_PUNCT_END.test(a) || CJK_PUNCT_START.test(b) ? '' : ' ')), ''),
    )
    .reduce((acc, part) => joinWith(acc, part, (a, b) => (CJK_END.test(a) || CJK_START.test(b) ? '' : ' ')), '')
    .trim();
}

const mdEscape = (s) => s.replace(/([\\`*_[\]])/g, '\\$1');
const cell = (s) => squash(s).replace(/\|/g, '\\|');

/**
 * @param {string} html  a built page
 * @param {string} site  e.g. https://lijiabao.dev
 * @returns {string} Markdown of <main>
 */
export function mainToMarkdown(html, site) {
  const out = [];
  const stack = []; // { name, skip, prefixKind }
  let skipDepth = 0;
  let inMain = false;
  let buf = '';
  /** link being collected: { href, start } (start = buf index) */
  const links = [];
  /** table being collected */
  let table = null;
  let row = null;
  let cellBuf = null;

  const context = () => {
    let heading = 0;
    let quote = false;
    let lists = 0;
    let item = false;
    let term = false;
    for (const e of stack) {
      if (/^h[1-6]$/.test(e.name)) heading = Number(e.name[1]);
      if (e.name === 'blockquote') quote = true;
      if (e.name === 'ul' || e.name === 'ol') lists++;
      if (e.name === 'li') item = true;
      if (e.name === 'dt') term = true;
    }
    return { heading, quote, lists, item, term };
  };

  const flush = () => {
    if (cellBuf !== null) return; // inside a table cell: the cell owns the text
    const text = squash(buf);
    buf = '';
    if (!text) return;
    const c = context();
    let line = text;
    if (c.heading) line = `${'#'.repeat(Math.min(6, c.heading + 1))} ${text}`; // page h1 → ##: each page is a section
    else if (c.term) line = `**${text}**`;
    if (c.item && !c.heading) line = `${'  '.repeat(Math.max(0, c.lists - 1))}- ${line}`;
    if (c.quote) line = `> ${line}`;
    out.push(line);
  };

  /** an element just closed and nothing has been written since: the next element is its visual neighbour */
  let seam = false;
  const write = (t) => {
    if (cellBuf !== null) cellBuf += t;
    else buf += t;
  };

  for (const tok of tokenize(html)) {
    if (tok.type === 'raw') continue;
    if (tok.type === 'open') {
      const name = tok.name.toLowerCase();
      const attrs = tok.attrs instanceof Map ? tok.attrs : parseAttrs(tok.attrs ?? '');
      if (name === 'main') inMain = true;
      if (!inMain) continue;
      const isVoid = VOID.has(name) || tok.selfClosing;
      if (skipDepth > 0 || skippable(name, attrs)) {
        if (!isVoid) {
          stack.push({ name, skip: true });
          skipDepth++;
        }
        continue;
      }
      if (name === 'br') {
        write(cellBuf !== null ? ' ' : BR);
        seam = false;
        continue;
      }
      if (name === 'table') {
        flush();
        table = [];
      } else if (name === 'tr' && table) {
        row = [];
      } else if ((name === 'td' || name === 'th') && row) {
        cellBuf = '';
      } else if (BLOCK.has(name)) {
        flush();
      } else if (seam || /(?:^|\s)sr-only(?:\s|$)/.test(attrs.get('class') ?? '')) {
        // a neighbour element, or screen-reader-only text such as "(external site)" glued to a link label
        write(cellBuf !== null ? ' ' : SEP);
      }
      seam = false;
      if (name === 'a') links.push({ href: attrs.get('href') ?? '', start: cellBuf !== null ? null : buf.length });
      if (name === 'code') write('`');
      if (!isVoid) stack.push({ name, skip: false });
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
        continue;
      }
      // finish the element while it is still on the stack (headings, list items and quotes read their context)
      if (name === 'main') {
        flush();
        stack.splice(idx);
        inMain = false;
        break;
      }
      if ((name === 'td' || name === 'th') && row && cellBuf !== null) {
        row.push(cell(cellBuf));
        cellBuf = null;
      } else if (name === 'tr' && table && row) {
        if (row.length) table.push(row);
        row = null;
      } else if (name === 'table' && table) {
        if (table.length) {
          const cols = Math.max(...table.map((r) => r.length));
          const pad = (r) => [...r, ...Array(cols - r.length).fill('')];
          const [head, ...body] = table;
          out.push(`| ${pad(head).join(' | ')} |`, `|${' --- |'.repeat(cols)}`, ...body.map((r) => `| ${pad(r).join(' | ')} |`));
        }
        table = null;
      } else if (name === 'a') {
        const l = links.pop();
        if (l && l.start !== null && cellBuf === null) {
          const label = squash(buf.slice(l.start));
          if (label && l.href && !l.href.startsWith('#') && !l.href.startsWith('javascript:')) {
            buf = `${buf.slice(0, l.start)}[${mdEscape(label)}](${new URL(l.href, site).href})`;
          }
        }
      } else if (name === 'code') {
        write('`');
      } else if (BLOCK.has(name)) {
        flush();
      }
      for (const p of stack.splice(idx)) if (p.skip) skipDepth--;
      seam = !BLOCK.has(name);
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
  // collapse runs of identical adjacent lines (sr-only + caption repeats) and keep blank lines between blocks
  const lines = out.filter((l, i) => l !== out[i - 1]);
  const md = [];
  const kind = (l) => (l.startsWith('|') ? 'table' : /^(?:> )?\s*- /.test(l) ? 'list' : 'block');
  for (const l of lines) {
    const prev = md.length ? md[md.length - 1] : null;
    // tables and lists stay tight; every other block gets a blank line before it
    if (prev !== null && !(kind(l) !== 'block' && kind(l) === kind(prev))) md.push('');
    md.push(l);
  }
  return `${md.join('\n')}\n`;
}
