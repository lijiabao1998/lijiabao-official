// src/data/budgets.ts — byte and glyph budgets (spec §8). Read by the CI checks (check-dist,
// glyphs) and by the page (`tier.cap`). Sizes are KB (1 KB = 1024 B), gzipped unless marked raw.

export type Tier = 'full' | 'lite' | 'static';
export type BudgetLocale = 'zh-Hant' | 'en';

export const budgets = {
  html: {
    /** HTML per page including inline CSS, JSON-LD and tables. */
    home: 36,
    case: 32,
  },
  /** The inline head boot script. */
  headInline: 1,
  fonts: {
    /** Geist latin, preloaded. */
    geistLatin: 29,
    /** Geist Mono latin, not preloaded. */
    geistMono: 25,
    /** Noto Sans TC hero subset, zh pages only, preloaded. */
    notoHero: 16,
    /** Noto Sans TC display subset, zh pages only, not preloaded. */
    notoDisplay: 90,
  },
  js: {
    /**
     * Static tier: ClientRouter + prefetch, the lifecycle entry, prefs/events, HUD, tier fieldset.
     * RFC S6 2026-09-30: 10 → 11. check-dist measured the F0 build at 10.5 KB (gzip -9, per file): ClientRouter
     * with prefetch is 5.7 KB, not the probe's 5.6, and the runtime entry, HUD and tier switch add 4.8 KB.
     * RFC integration 2026-10-01: 11 → 12. S3's TierCards (the way out of static) and the portrait caption
     * sync are static-tier component scripts on home: 11.8 KB measured.
     * liteHomeGt RFC integration 2026-10-01: 82 → 84 (home measured 83.5 KB after S1–S3).
     * The first-view totals below are held at their published values (they are what `tier.cap` prints);
     * measured today: zh lite 241, zh static 145, en lite 194, en static 97.
     */
    static: 12,
    /** lite/full, home and GlimmerTown: ClientRouter 5.6 + motion core + app. */
    liteHomeGt: 84,
    /** lite/full, Frontier (+ Flip, lazy). */
    liteFr: 92,
  },
  /**
   * GL engine + 3 scenes + inspect, lazy chunks (the union any page can load).
   * RFC integration 2026-10-01: 9 → 16. Measured after merging S1/S3/S4: engine 7.5, field 2.1, inspect 2.2,
   * portrait 2.0, grid 1.6 (incl. gen/grid) = 15.6 KB. The spec's 9 was a pre-build estimate; a page only
   * fetches its own scenes (home ≈ 13.4, GlimmerTown ≈ 9.3). Cut order §10 #2 (inspect) would save 2.2.
   */
  gl: 16,
  bins: {
    commits: 18,
    /** raw */
    portraitA: 26,
    /** raw, full tier only */
    portraitB: 50,
  },
  posters: {
    field: 9,
    portraitAvif: 30,
  },
  /** First view of the home page (the portrait loads lazily and is outside it). */
  firstView: {
    zhHomeLite: 305, // 36 + 29 + 25 + 16 + 90 + 82 + 9 + 18
    enHomeLite: 200, // 36 + 29 + 25 + 82 + 9 + 18 (= 199, capped at 200)
    zhHomeStatic: 216, // 36 + 29 + 25 + 16 + 90 + 11 + 9 (field poster); js.static RFC S6
    enHomeStatic: 110, // 36 + 29 + 25 + 11 + 9 — derived, not in the spec table
  },
  /** Noto Sans TC subset sizes in glyphs (scripts/glyphs.mjs fails above these). */
  glyphs: {
    hero: 40,
    display: 140,
  },
} as const;

/** The first-view cap shown by `tier.cap` ({kb}) for the home page in a locale and tier. */
export function firstViewCap(locale: BudgetLocale, tier: Tier): number {
  const fv = budgets.firstView;
  if (tier === 'static') return locale === 'en' ? fv.enHomeStatic : fv.zhHomeStatic;
  return locale === 'en' ? fv.enHomeLite : fv.zhHomeLite;
}
