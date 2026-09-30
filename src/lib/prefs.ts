// src/lib/prefs.ts — tier + intro preferences (§7, §5.2, §9.3). Static-tier safe (no GSAP, no engine).
//
// The tier lives on <html data-tier>. setTier/clearTier write it, persist it, and emit 'lj:tier';
// motion/lifecycle.ts reacts (boots the motion core + engine, or tears them down). No reload is needed.
//
// Storage (every access is try/catch; private windows may throw):
//   localStorage   lj.tier   the user's explicit choice (read by the head boot before first paint)
//   localStorage   lj.v      intro seen (falls back to sessionStorage)
//   sessionStorage lj.auto   the last automatic decision: 'full' (probe promoted) | 'lite' (guard demoted)
//   sessionStorage lj.probe  the upgrade probe already ran this session
//   sessionStorage lj.lock   static for the session (two context losses in 60s, or no usable WebGL2)

import type { Tier } from '../gl/types';
import { emit, last, type TierReason, type TierSrc } from './events';

const TIERS: readonly string[] = ['full', 'lite', 'static'];
const K_TIER = 'lj.tier';
const K_INTRO = 'lj.v';
const K_AUTO = 'lj.auto';
const K_PROBE = 'lj.probe';
const K_LOCK = 'lj.lock';

type Kind = 'local' | 'session';

function storage(kind: Kind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}
function read(kind: Kind, key: string): string | null {
  try {
    return storage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function write(kind: Kind, key: string, value: string | null): boolean {
  try {
    const s = storage(kind);
    if (!s) return false;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

const html = (): HTMLElement => document.documentElement;

export function isTier(v: unknown): v is Tier {
  return typeof v === 'string' && TIERS.includes(v);
}

/* ---------------------------------------------------------------- §9.3 frozen API */

/** The effective tier (html[data-tier]); 'static' when absent or invalid (the SSR default). */
export function getTier(): Tier {
  const t = html().dataset.tier;
  return isTier(t) ? t : 'static';
}

/**
 * Change the tier. 'user' persists the choice in localStorage (and lifts a session lock);
 * 'auto' (probe, guard) caches the decision in sessionStorage only. Always emits 'lj:tier'.
 * `reason` is an F0+ extra read by the HUD ('promoted', 'demoted', …).
 */
export function setTier(t: Tier, src: TierSrc, reason?: TierReason): void {
  if (!isTier(t)) return;
  if (src === 'user') {
    write('local', K_TIER, t);
    write('session', K_LOCK, null);
  } else if (reason === 'promoted' || reason === 'demoted') {
    write('session', K_AUTO, t);
  }
  apply(t, src, reason ?? (src === 'user' ? 'user' : undefined));
}

/** 「恢復自動」: forget the stored choice and return to the automatic tier. */
export function clearTier(): void {
  write('local', K_TIER, null);
  write('session', K_LOCK, null);
  apply(autoTier(), 'user', 'cleared');
}

export function introSeen(): boolean {
  return read('local', K_INTRO) !== null || read('session', K_INTRO) !== null;
}

export function markIntro(): void {
  if (!write('local', K_INTRO, '1')) write('session', K_INTRO, '1');
}

/* ---------------------------------------------------------------- F0+ */

/** The user's stored choice, if any. */
export function storedTier(): Tier | null {
  const t = read('local', K_TIER);
  return isTier(t) ? t : null;
}

/** The automatic decision cached for this session ('full' promoted / 'lite' demoted), if any. */
export function sessionTier(): Tier | null {
  const t = read('session', K_AUTO);
  return isTier(t) ? t : null;
}

/** What the head boot computes with no stored choice: 'static' on Save-Data, 2G, no WebGL2, forced colours. */
export function envTier(): Tier {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (
    c?.saveData ||
    /(^|-)2g/.test(c?.effectiveType ?? '') ||
    !('WebGL2RenderingContext' in window) ||
    window.matchMedia('(forced-colors: active)').matches
  )
    return 'static';
  return 'lite';
}

/** The tier 「恢復自動」 lands on: session lock → static; env static → static; else the cached auto decision or lite. */
export function autoTier(): Tier {
  if (isLocked()) return 'static';
  const env = envTier();
  return env === 'static' ? env : (sessionTier() ?? env);
}

export function isReduced(): boolean {
  return html().dataset.motion === 'reduced';
}

export function saveData(): boolean {
  return !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
}

/** Keep the site static for the rest of the session (context lost twice in 60s, or no usable WebGL2). */
export function lockStatic(reason: 'lost' | 'noWebgl'): void {
  write('session', K_LOCK, '1');
  if (getTier() !== 'static') apply('static', 'auto', reason);
}

export function isLocked(): boolean {
  return read('session', K_LOCK) !== null;
}

/** The probe already ran (or promoted) this session. */
export function probeDone(): boolean {
  return read('session', K_PROBE) !== null || sessionTier() !== null;
}

export function markProbe(result: Tier): void {
  write('session', K_PROBE, result);
}

/**
 * Re-apply session decisions on a full page load (the head boot only reads localStorage):
 * a session lock wins; otherwise a cached auto decision applies when the user has no stored choice.
 * Returns true when the tier changed. Called by motion/lifecycle.ts before anything boots.
 */
export function restoreSession(): boolean {
  const cur = getTier();
  if (isLocked()) {
    if (cur === 'static') return false;
    apply('static', 'auto', 'session');
    return true;
  }
  const auto = sessionTier();
  if (!auto || storedTier() || cur === 'static' || auto === cur) return false;
  apply(auto, 'auto', 'session');
  return true;
}

/**
 * End the §5.2 intro: remove html[data-intro], remember it (lj.v) and emit 'lj:intro-done'.
 * Idempotent: does nothing when the intro is not running. intro.ts calls it; the runtime calls it
 * as a safety net on teardown, tier → static, or boot failure.
 */
export function endIntro(): void {
  const h = html();
  if (!h.hasAttribute('data-intro')) return;
  h.removeAttribute('data-intro');
  markIntro();
  emit('lj:intro-done', null);
}

function apply(t: Tier, src: TierSrc, reason: TierReason | undefined): void {
  html().dataset.tier = t;
  const count = t === 'static' ? 0 : (last('lj:gl')?.count ?? 0);
  emit('lj:tier', reason ? { tier: t, src, count, reason } : { tier: t, src, count });
}
