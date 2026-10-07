// scripts/lib/html.mjs — a small HTML reader for the built pages (no dependencies). Astro 7's compiler emits
// well-formed markup, so a tokenizer plus an element stack is enough to know, for every text run and element,
// its effective `lang` / `dir` and its ancestors. Also: inline-script extraction and CSP hashing (headers.mjs).

import { createHash } from 'node:crypto';

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);
const TAG = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/y;
const ATTR = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Decode character references in text or attribute values. */
export function decode(s) {
  if (!s.includes('&')) return s;
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, ref) => {
    if (ref[0] === '#') {
      const cp = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return NAMED[ref.toLowerCase()] ?? m;
  });
}

/** Attribute string → Map (names lower-cased, values decoded; a bare attribute has the value ''). */
export function parseAttrs(s) {
  const out = new Map();
  for (const m of s.matchAll(ATTR)) out.set(m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? ''));
  return out;
}

/**
 * Tokens in document order:
 *   { type: 'open', name, attrs, selfClosing, index } · { type: 'close', name, index }
 *   { type: 'text', text, index } · { type: 'raw', name, attrs, content, index } (script / style bodies)
 * Comments and the doctype are skipped.
 */
export function* tokenize(html) {
  let i = 0;
  const n = html.length;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt < 0) {
      yield { type: 'text', text: html.slice(i), index: i };
      return;
    }
    if (lt > i) yield { type: 'text', text: html.slice(i, lt), index: i };
    i = lt;
    if (html.startsWith('<!--', i)) {
      const e = html.indexOf('-->', i + 4);
      i = e < 0 ? n : e + 3;
      continue;
    }
    if (html[i + 1] === '!' || html[i + 1] === '?') {
      const e = html.indexOf('>', i);
      i = e < 0 ? n : e + 1;
      continue;
    }
    TAG.lastIndex = i;
    const m = TAG.exec(html);
    if (!m) {
      yield { type: 'text', text: '<', index: i };
      i++;
      continue;
    }
    const [whole, slash, rawName, attrStr, self] = m;
    const name = rawName.toLowerCase();
    const start = i;
    i += whole.length;
    if (slash) {
      yield { type: 'close', name, index: start };
      continue;
    }
    const attrs = parseAttrs(attrStr);
    if (RAW.has(name) && !self) {
      const endRe = new RegExp(`</${name}\\s*>`, 'ig');
      endRe.lastIndex = i;
      const e = endRe.exec(html);
      const content = html.slice(i, e ? e.index : n);
      i = e ? e.index + e[0].length : n;
      yield { type: 'raw', name, attrs, content, index: start };
      continue;
    }
    yield { type: 'open', name, attrs, selfClosing: Boolean(self) || VOID.has(name), index: start };
  }
}

/**
 * A page model: every element (with effective lang/dir, ancestor names and its parent element), every non-blank text run
 * (decoded, with effective lang/dir and whether it sits in <head>), and the raw script / style bodies.
 * `scope` is the nearest data-copy-scope value ('' when none): `post` marks what a post says (check-dist applies
 * the POSTS rule set there).
 */
export function readPage(html) {
  const elements = [];
  const texts = [];
  const scripts = [];
  const styles = [];
  const stack = [];
  const top = () => stack[stack.length - 1];
  let htmlLang = '';
  for (const tok of tokenize(html)) {
    const parent = top();
    const lang = parent?.lang ?? '';
    const dir = parent?.dir ?? '';
    if (tok.type === 'open' || tok.type === 'raw') {
      const el = {
        name: tok.name,
        attrs: tok.attrs,
        lang: tok.attrs.has('lang') ? tok.attrs.get('lang') : lang,
        dir: tok.attrs.has('dir') ? tok.attrs.get('dir') : dir,
        scope: tok.attrs.has('data-copy-scope') ? tok.attrs.get('data-copy-scope') : (parent?.scope ?? ''),
        ancestors: stack.map((s) => s.name),
        parent: parent ?? null,
        inHead: stack.some((s) => s.name === 'head'),
        index: tok.index,
      };
      if (tok.name === 'html') htmlLang = tok.attrs.get('lang') ?? '';
      elements.push(el);
      if (tok.type === 'raw') {
        (tok.name === 'script' ? scripts : styles).push({ attrs: tok.attrs, content: tok.content, el });
      } else if (!tok.selfClosing) {
        stack.push(el);
      }
    } else if (tok.type === 'close') {
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].name === tok.name) {
          stack.length = k;
          break;
        }
      }
    } else if (tok.type === 'text') {
      if (!tok.text.trim()) continue;
      texts.push({
        text: decode(tok.text),
        lang,
        dir,
        el: parent ?? null,
        scope: parent?.scope ?? '',
        inHead: stack.some((s) => s.name === 'head'),
        index: tok.index,
      });
    }
  }
  return { htmlLang, elements, texts, scripts, styles };
}

/** Script types a browser executes (and CSP therefore governs). JSON-LD and other data blocks are not. */
export function isExecutable(attrs) {
  const type = (attrs.get('type') ?? '').trim().toLowerCase();
  return type === '' || type === 'module' || type === 'text/javascript' || type === 'application/javascript' || type === 'speculationrules';
}

/**
 * Inline (no src) executable script bodies of a page, as the browser sees them: script text is raw (no
 * character references), and the HTML parser turns CR LF / CR into LF before anything is hashed.
 */
export function inlineScripts(html) {
  const out = [];
  for (const tok of tokenize(html)) {
    if (tok.type === 'raw' && tok.name === 'script' && !tok.attrs.has('src') && isExecutable(tok.attrs)) {
      out.push(tok.content.replace(/\r\n?/g, '\n'));
    }
  }
  return out;
}

/** CSP source expression for an inline script body: 'sha256-<base64>' of its UTF-8 bytes. */
export function cspHash(content) {
  return `'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`;
}
