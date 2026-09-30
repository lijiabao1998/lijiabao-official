// src/lib/dom.ts — tiny DOM helpers shared by the runtime, primitives, sections and the GL engine.
// Static-tier safe (no GSAP). No copy lives here: runtime strings come from data-i18n-* attributes.

export type Cleanup = () => void;

/** §5.1 matchMedia conditions (use them in ctx.mm.add so every section agrees). */
export const MQ = {
  full: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  desktop: '(min-width: 1024px)',
  fine: '(hover: hover) and (pointer: fine)',
  /** §7 mobile: < 640px or a coarse pointer. */
  mobile: '(max-width: 639.98px), (pointer: coarse)',
  pointerFine: '(pointer: fine)',
  contrast: '(prefers-contrast: more)',
} as const;

const mqs = new Map<string, MediaQueryList>();
/** Cached MediaQueryList. */
export function mq(query: string): MediaQueryList {
  let m = mqs.get(query);
  if (!m) mqs.set(query, (m = window.matchMedia(query)));
  return m;
}

export const isFine = (): boolean => mq(MQ.fine).matches;
export const isMobile = (): boolean => mq(MQ.mobile).matches;
export const isDesktop = (): boolean => mq(MQ.desktop).matches;

export function qs<T extends Element = HTMLElement>(sel: string, scope: ParentNode = document): T | null {
  return scope.querySelector<T>(sel);
}
export function qsa<T extends Element = HTMLElement>(sel: string, scope: ParentNode = document): T[] {
  return Array.from(scope.querySelectorAll<T>(sel));
}

/** Page locale from <html lang>. */
export function locale(): 'zh-Hant' | 'en' {
  return document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'zh-Hant';
}

/** True when the element's own language (nearest [lang]) is Chinese. */
export function isZh(el: Element): boolean {
  const l = el.closest('[lang]')?.getAttribute('lang') ?? document.documentElement.lang;
  return l.toLowerCase().startsWith('zh');
}

/** Read a build-time string: data-i18n-<key> ('readout' → data-i18n-readout). Empty string when missing. */
export function i18n(el: Element, key: string): string {
  return el.getAttribute(`data-i18n-${key}`) ?? '';
}

/** Fill `{name}` placeholders; unknown names are left as-is. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** addEventListener that returns its own remover. */
export function listen<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  fn: (e: WindowEventMap[K]) => void,
  opts?: AddEventListenerOptions,
): Cleanup;
export function listen<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  fn: (e: DocumentEventMap[K]) => void,
  opts?: AddEventListenerOptions,
): Cleanup;
export function listen<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  fn: (e: HTMLElementEventMap[K]) => void,
  opts?: AddEventListenerOptions,
): Cleanup;
export function listen(target: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): Cleanup;
export function listen(target: EventTarget, type: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): Cleanup {
  target.addEventListener(type, fn, opts);
  return () => target.removeEventListener(type, fn, opts);
}

type IdleWin = Window & {
  requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** requestIdleCallback with a setTimeout fallback. */
export function onIdle(fn: () => void, timeout = 2000): Cleanup {
  const w = window as IdleWin;
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}

/** After window `load`, then idle (§6.0 probe timing). */
export function afterLoadIdle(fn: () => void, timeout = 3000): Cleanup {
  let cancel: Cleanup = () => {};
  const go = (): void => {
    cancel = onIdle(fn, timeout);
  };
  if (document.readyState === 'complete') go();
  else {
    const off = listen(window, 'load', go, { once: true });
    cancel = off;
  }
  return () => cancel();
}

let pageStart = 0;
/** ms since the current page became the document (full load or ClientRouter swap). */
export function pageAge(): number {
  return performance.now() - pageStart;
}
/** lifecycle.ts calls this on every swap. */
export function markPageStart(): void {
  pageStart = performance.now();
}

/** `:focus-visible`, tolerant of engines without it. */
export function isFocusVisible(el: Element | null): boolean {
  if (!el) return false;
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** Rect ∩ viewport test on an already-read rect (no layout read). */
export function inView(r: { top: number; bottom: number; left: number; right: number }, margin = 0): boolean {
  return r.bottom > -margin && r.top < window.innerHeight + margin && r.right > 0 && r.left < window.innerWidth;
}

export const clamp = (lo: number, hi: number, v: number): number => (v < lo ? lo : v > hi ? hi : v);
