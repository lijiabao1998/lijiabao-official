// src/motion/lifecycle.ts — the always-loaded entry (static tier included; no GSAP here). Import it once from
// the Base layout's <script>:   import '@motion/lifecycle';   (it starts itself; start() is idempotent)
//
// §5.5 ClientRouter sequence:
//   astro:before-preparation  remember the navigation type (the 1px progress line is Header.astro's)
//   astro:before-swap         copy data-tier / data-motion / data-gl / data-js (+ Lenis' html classes) onto
//                             event.newDocument's <html>; tear the page down (sections, triggers, engine.detachAll)
//   astro:after-swap          push → top; back/forward or #hash → keep Astro's scroll, resync Lenis
//   astro:page-load           boot the runtime if the tier allows (once), then initPage(main)
// 'lj:tier' → boot (static → lite/full), destroy (→ static), or engine.setTier (lite ⇄ full). No reload.

import type { EngineFactory, Runtime } from './boot';
import { on, type TierDetail } from '../lib/events';
import { markPageStart, MQ, mq } from '../lib/dom';
import { endIntro, getTier, lockStatic, restoreSession } from '../lib/prefs';

/** <html> attributes that must survive a swap (§5.5); everything else comes from the new document. */
const KEEP = ['data-tier', 'data-motion', 'data-gl', 'data-js'] as const;

interface NavEvent extends Event {
  navigationType?: 'push' | 'replace' | 'traverse';
  newDocument?: Document;
}

let started = false;
let rt: Runtime | null = null;
/** reconcile steps run one at a time, each against the latest tier / page */
let chain: Promise<void> = Promise.resolve();
let main: HTMLElement | null = null;
let inited: HTMLElement | null = null;
let navType = 'push';

function currentMain(): HTMLElement | null {
  return document.getElementById('main') ?? document.querySelector('main');
}

async function bootRuntime(): Promise<Runtime | null> {
  try {
    const mock = /[?&]gl=mock(?:&|$)/.test(location.search);
    const [b, factory] = await Promise.all([
      import('./boot'),
      (mock
        ? import('../gl/mock').then((m) => m.createMockEngine)
        : import('../gl/engine').then((m) => m.createEngine)) as Promise<EngineFactory>,
    ]);
    return await b.boot(factory);
  } catch (err) {
    if (import.meta.env.DEV) console.error('[motion] runtime failed to boot', err);
    return null;
  }
}

/** Bring the runtime in line with the tier and the current page. Queued; safe to call any number of times. */
function reconcile(): void {
  chain = chain.then(step).catch((err: unknown) => {
    if (import.meta.env.DEV) console.error('[motion] reconcile failed', err);
  });
}

async function step(): Promise<void> {
  if (getTier() === 'static') {
    if (rt) {
      rt.destroy();
      rt = null;
    }
    inited = null;
    endIntro();
    return;
  }
  if (!rt) {
    const r = await bootRuntime();
    if (!r) {
      endIntro();
      return;
    }
    rt = r;
    if (r.glFailed) lockStatic('noWebgl'); // WebGL2 unusable: static for the session (HUD: tier.noWebgl)
    if (getTier() === 'static') {
      rt.destroy();
      rt = null;
      inited = null;
      endIntro();
      return;
    }
  }
  const m = main;
  if (m && m.isConnected && inited !== m) {
    inited = m;
    await rt.initPage(m);
  }
}

function onPageLoad(): void {
  const m = currentMain();
  if (!m || m === main) return;
  main = m;
  reconcile();
}

function onBeforePreparation(e: Event): void {
  navType = (e as NavEvent).navigationType ?? 'push';
}

function onBeforeSwap(e: Event): void {
  const ev = e as NavEvent;
  navType = ev.navigationType ?? navType;
  const from = document.documentElement;
  const to = ev.newDocument?.documentElement;
  if (to) {
    for (const name of KEEP) {
      const v = from.getAttribute(name);
      if (v === null) to.removeAttribute(name);
      else to.setAttribute(name, v);
    }
    to.removeAttribute('data-intro'); // the intro only ever plays on a full load
    for (const c of from.classList) if (c.startsWith('lenis')) to.classList.add(c);
  }
  rt?.teardownPage();
  inited = null;
  main = null;
}

function onAfterSwap(): void {
  markPageStart();
  rt?.afterSwap(navType);
}

function onTier(d: TierDetail): void {
  if (!d.reason) return; // count-only update from the engine
  if (rt && d.tier !== 'static') rt.setTier(d.tier, d.src);
  reconcile();
}

function onMotionPref(e: MediaQueryListEvent): void {
  document.documentElement.dataset.motion = e.matches ? 'reduced' : 'full';
  if (!rt) return;
  rt.teardownPage();
  rt.refreshMotion();
  inited = null;
  reconcile();
}

export function start(): void {
  if (started || typeof document === 'undefined') return;
  started = true;
  restoreSession();
  document.addEventListener('astro:before-preparation', onBeforePreparation);
  document.addEventListener('astro:before-swap', onBeforeSwap);
  document.addEventListener('astro:after-swap', onAfterSwap);
  document.addEventListener('astro:page-load', onPageLoad);
  on('lj:tier', onTier);
  mq(MQ.reduce).addEventListener('change', onMotionPref);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onPageLoad, { once: true });
  else onPageLoad();
}

start();
