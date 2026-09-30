// src/motion/boot.ts — the motion core runtime. Loaded ONLY when the tier is not static (lifecycle.ts imports it
// dynamically), so the static tier never fetches GSAP (§7, ≤ 10 KB JS).
//
// One clock (§5.1): gsap.ticker drives Timeline.updateRoot → lenis.raf (→ ScrollTrigger.update via Lenis'
// scroll event) → the engine frame, which is (re)added at the END of the ticker whenever it wakes.
// lagSmoothing(0). Lenis only with (pointer: fine), tier lite/full, motion full: {autoRaf:false, lerp:0.1,
// syncTouch:false}. Touch scrolling stays native. Lenis CSS is in base.css.
// In-page anchors are NOT given to Lenis (§5.1 said anchors:{offset:-72}): ClientRouter already intercepts every
// same-origin link, hashes included, and jumps via location.href; Lenis 1.3.26 does not preventDefault, so both
// would scroll at once. The native jump (header offset = CSS scroll-padding-top) keeps history, Back and the focus
// start point correct; Lenis resyncs from the native scroll event.

import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import type { Clock, EngineOptions, GlimmerEngine, Tier } from '../gl/types';
import type { TierSrc } from '../lib/events';
import { isFine, isMobile, listen, locale, MQ, mq, type Cleanup } from '../lib/dom';
import { endIntro, getTier, isReduced } from '../lib/prefs';
import { registerEases } from './eases';
import { createPrimitives } from './primitives';
import { intro, load, run, runModule, type BaseCtx, type PageMotion, type Primitives } from './registry';

export type EngineFactory = (o: EngineOptions) => GlimmerEngine;

export interface Runtime {
  readonly gsap: typeof gsap;
  readonly ST: typeof ScrollTrigger;
  readonly prim: Primitives;
  readonly lenis: Lenis | null;
  readonly engine: GlimmerEngine | null;
  /** true → WebGL2 unusable here; lifecycle then locks the session to static. */
  readonly glFailed: boolean;
  /** astro:page-load: engine.attachAll(main) → intro (first load, home) → sections → reveal → refresh. */
  initPage(main: HTMLElement): Promise<void>;
  /** astro:before-swap: every section cleanup, stray ScrollTriggers, engine.detachAll(), Lenis inertia. */
  teardownPage(): void;
  /** astro:after-swap: push → top; hash / back-forward → keep Astro's scroll, resync Lenis. */
  afterSwap(navigationType: string): void;
  /** lite ⇄ full without a reload. */
  setTier(t: Tier, src: TierSrc): void;
  /** prefers-reduced-motion changed (the caller re-inits the page). */
  refreshMotion(): void;
  /** → static: tear everything down (GSAP stays cached for a later boot). */
  destroy(): void;
}

let registered = false;

export async function boot(createEngine?: EngineFactory): Promise<Runtime> {
  if (!registered) {
    registered = true;
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
    registerEases(CustomEase);
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.ticker.lagSmoothing(0);
  }

  const prim = createPrimitives({ gsap, ST: ScrollTrigger, SplitText });
  const clock: Clock = {
    add: (fn) => {
      gsap.ticker.add(fn);
    },
    remove: (fn) => gsap.ticker.remove(fn),
  };

  let lenis: Lenis | null = null;
  let engine: GlimmerEngine | null = null;
  let glFailed = false;
  let page: PageMotion | null = null;
  let introCleanup: Cleanup | null = null;
  let seq = 0;
  let refreshTimer = 0;
  const offs: Cleanup[] = [];

  const lenisRaf = (time: number): void => lenis?.raf(time * 1000);
  const onLenisScroll = (): void => {
    ScrollTrigger.update();
    engine?.invalidate?.();
  };

  function makeLenis(): void {
    if (lenis || getTier() === 'static' || isReduced() || !mq(MQ.pointerFine).matches) return;
    lenis = new Lenis({ autoRaf: false, anchors: false, lerp: 0.1, syncTouch: false });
    lenis.on('scroll', onLenisScroll);
    gsap.ticker.add(lenisRaf); // before the engine frame: the engine re-adds itself at the end on wake
  }

  function killLenis(): void {
    if (!lenis) return;
    gsap.ticker.remove(lenisRaf);
    lenis.destroy();
    lenis = null;
  }

  function baseCtx(): BaseCtx {
    return {
      gsap,
      ST: ScrollTrigger,
      tier: getTier(),
      reduced: isReduced(),
      mobile: isMobile(),
      fine: isFine(),
      locale: locale(),
      engine,
      lenis,
      prim,
    };
  }

  function refreshSoon(): void {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      engine?.invalidate?.();
    }, 150);
  }

  makeLenis();

  // the mobile menu stops page scrolling while open (Menu.astro emits 'lj:menu' {open})
  offs.push(
    listen(document, 'lj:menu', (e: Event) => {
      const open = (e as CustomEvent<{ open?: boolean }>).detail?.open;
      if (open) lenis?.stop();
      else lenis?.start();
    }),
  );
  // late fonts shift layout: re-measure triggers (debounced)
  const fonts = document.fonts as FontFaceSet | undefined;
  if (fonts?.addEventListener) {
    fonts.addEventListener('loadingdone', refreshSoon);
    offs.push(() => fonts.removeEventListener('loadingdone', refreshSoon));
  }

  const canvas = document.getElementById('gl');
  if (createEngine && canvas instanceof HTMLCanvasElement) {
    engine = createEngine({ tier: getTier(), reduced: isReduced(), clock });
    engine.mount(canvas);
    if (!(await engine.ready)) {
      glFailed = true;
      engine.destroy();
      engine = null;
    }
  }

  const rt: Runtime = {
    gsap,
    ST: ScrollTrigger,
    prim,
    get lenis() {
      return lenis;
    },
    get engine() {
      return engine;
    },
    get glFailed() {
      return glFailed;
    },

    async initPage(main: HTMLElement): Promise<void> {
      const my = ++seq;
      engine?.attachAll(main); // before the sections, so their setup can already take engine.get() handles
      const root = document.documentElement;
      const home = main.dataset.layout === 'home';
      const wantIntro = root.hasAttribute('data-intro') && home;
      if (!home) endIntro();
      const [introMod, jobs] = await Promise.all([
        wantIntro ? intro().catch(() => null) : Promise.resolve(null),
        load(main),
      ]);
      if (my !== seq || !main.isConnected) return;
      const base = baseCtx();
      if (introMod && root.hasAttribute('data-intro')) introCleanup = runModule(introMod, main, base);
      else endIntro();
      page = run(jobs, base);
      ScrollTrigger.refresh();
      lenis?.resize();
      engine?.invalidate?.();
    },

    teardownPage(): void {
      seq++;
      window.clearTimeout(refreshTimer);
      if (lenis) lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true }); // kill inertia
      introCleanup?.();
      introCleanup = null;
      endIntro();
      page?.cleanup();
      page = null;
      // anything created outside a context (should be none) must not leak into the next page
      for (const t of ScrollTrigger.getAll()) t.kill(true);
      engine?.detachAll();
    },

    afterSwap(navigationType: string): void {
      if (!lenis) return;
      lenis.resize();
      const top = navigationType !== 'traverse' && !location.hash;
      lenis.scrollTo(top ? 0 : lenis.actualScroll, { immediate: true, force: true });
    },

    setTier(t: Tier, src: TierSrc): void {
      if (t === 'static') return;
      if (page) for (const c of page.ctxs) c.tier = t;
      void engine?.setTier(t, src);
    },

    refreshMotion(): void {
      engine?.setReduced?.(isReduced());
      killLenis();
      makeLenis();
    },

    destroy(): void {
      rt.teardownPage();
      killLenis();
      engine?.destroy();
      engine = null;
      for (const off of offs) off();
      offs.length = 0;
    },
  };
  return rt;
}
