// src/components/fr/parts.ts — pure helpers for the Frontier page (S5). No copy lives here: every string these
// functions see comes from the dictionary at build time; they only split it into presentational parts.
// Node-safe and deterministic (tests/unit/fr-parts.test.ts); the motion modules import `roundPos` from here.

/** One authored string split at its first label colon: 「問題狀態：…」 / "Problem states: …". */
export interface Labelled {
  label: string;
  body: string;
}

/** Splits at the first full-width colon or an ASCII colon followed by a space. No colon → no label. */
export function splitLabel(s: string): Labelled {
  const m = /^(.*?)(?:：|:\s+)([\s\S]*)$/u.exec(s);
  if (!m || !m[1]) return { label: '', body: s.trim() };
  return { label: m[1].trim(), body: (m[2] ?? '').trim() };
}

/** 「A／B／C」 or "A / B / C" → items (the status vocabularies). */
export function splitSlash(s: string): string[] {
  return s
    .split(/\s*／\s*|\s+\/\s+/u)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** "a · b · c" → items (stats, commands). A middle dot without spaces is kept (it is part of a word). */
export function splitDots(s: string): string[] {
  return s
    .split(/\s+·\s+/u)
    .map((x) => x.trim())
    .filter(Boolean);
}

/** 「…」 — Source  →  { quote, cite }, split at the LAST spaced dash. No dash → the whole string is the quote. */
export function splitCite(s: string): { quote: string; cite: string } {
  const i = s.lastIndexOf(' — ');
  if (i < 0) return { quote: s.trim(), cite: '' };
  return { quote: s.slice(0, i).trim(), cite: s.slice(i + 3).trim() };
}

/** Unique x.y.z versions, in order of first appearance (the protocol path). */
export function versionsIn(s: string): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(/\d+\.\d+\.\d+/gu)) if (!out.includes(m[0])) out.push(m[0]);
  return out;
}

/** A run of a stats phrase: `code` from backticks, `num` for digit runs (visual emphasis only). */
export interface Run {
  text: string;
  code?: boolean;
  num?: boolean;
}

/** Splits `code` spans first, then digit runs (with , . / inside) in the plain parts. */
export function runs(s: string): Run[] {
  const out: Run[] = [];
  s.split('`').forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      out.push({ text: part, code: true });
      return;
    }
    let last = 0;
    for (const m of part.matchAll(/\d(?:[\d,./]*\d)?/gu)) {
      const at = m.index ?? 0;
      if (at > last) out.push({ text: part.slice(last, at) });
      out.push({ text: m[0], num: true });
      last = at + m[0].length;
    }
    if (last < part.length) out.push({ text: part.slice(last) });
  });
  return out;
}

/** The mono code of a lab or the governance repo: its id upper-cased (= the problem-card ID prefix). */
export function labCode(id: string): string {
  return id.toUpperCase();
}

/** "https://github.com/<user>/FrontierPhysics/pull/4" → "FrontierPhysics/pull/4" (source links, set in mono). */
export function ghPath(url: string): string {
  const m = /^https?:\/\/github\.com\/[^/]+\/(.+?)\/?$/u.exec(url);
  if (!m?.[1]) return url;
  return m[1].replace(/\/blob\/main\//u, '/');
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Where the round glimmer is: `active` = the stage whose gate it has reached; `u` = its position in gates (0 … n-1). */
export interface RoundPos {
  active: number;
  u: number;
}

/**
 * The pinned #fr-round (§5.3): progress 0..1 is cut into `n` equal sub-ranges. Inside sub-range i the glimmer rests on
 * gate i, and in the last `hop` of it glides to gate i+1 (smoothstep), arriving exactly when stage i+1 becomes active.
 * So a gate fills the moment its stage lights, and the last stage keeps a full sub-range.
 */
export function roundPos(p: number, n = 7, hop = 0.3): RoundPos {
  const x = clamp01(p) * n;
  const active = Math.min(n - 1, Math.floor(x));
  const t = x - active;
  let u = active;
  if (active < n - 1 && t > 1 - hop) u = active + smooth((t - (1 - hop)) / hop);
  return { active, u };
}

/** One column of the MATH-001 lattice schematic. */
export interface LatticeCol {
  n: number;
  /** column centre, viewBox units */
  x: number;
  /** baseline y and top y of the dotted column */
  y0: number;
  y1: number;
  /** n dots, one per lattice row of an n × n grid (column height carries no data, fr.math.lattice) */
  dots: number;
  /** the gap: drawn empty */
  empty: boolean;
}

export interface Lattice {
  cols: LatticeCol[];
  w: number;
  h: number;
  step: number;
  dy: number;
}

/** Geometry for n = min..max, one column per n; `gap` is left empty. Pure, so tests pin the shape. */
export function lattice(min: number, max: number, gap: number, step = 8, dy = 4, pad = 6): Lattice {
  const cols: LatticeCol[] = [];
  const h = pad * 2 + (max - 1) * dy;
  const y0 = h - pad;
  for (let n = min; n <= max; n++) {
    const x = pad + (n - min) * step;
    cols.push({ n, x, y0, y1: y0 - (n - 1) * dy, dots: n, empty: n === gap });
  }
  return { cols, w: pad * 2 + (max - min) * step, h, step, dy };
}
