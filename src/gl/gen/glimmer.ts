// src/gl/gen/glimmer.ts — the glimmer's look (spec §2.5, §6.1, §6.2): one soft, round point of light per record.
// Pure, deterministic, Node-safe. Shared by the GL scenes (as uniforms of field.vert / portrait.vert) and by the
// static posters (/posters/field.svg, scripts/sample-portrait.mjs), so the poster → canvas handoff shows the same
// points at the same size and brightness.
//
// A glimmer is a gaussian, alpha(r) = peak · exp(−r² / 2σ²) with σ = SIGMA × its size (size ≈ the visible
// diameter, 4σ), windowed to exactly 0 before the sprite's edge (gl/shaders/point.frag); the full tier adds a faint
// halo (point.frag HALO_A, HALO_S). Glimmers composite premultiplied "over": a spot lit by glimmers a, b, … reads
// --fg × (1 − (1 − a)(1 − b)…) — additive while dim (≈ a + b), rolling off softly into --fg and never past it, so
// a busy run becomes a bright streak without clipping to flat white. (A pure ONE, ONE add clips; a screen blend
// rolls off into #FFF, brighter than the glimmer core --fg.) Same-coloured light composites in any order.

/** Core σ per unit of size (size ≈ 4σ). */
export const SIGMA = 0.24;

/**
 * The hero record: scene `field` and /posters/field.svg. Sizes in CSS px. Small, fairly dim points on purpose:
 * a single record still reads as a distinct point, and a busy day (up to ~100 commits within 4px of GlimmerTown's
 * lane) builds its brightness from many overlaps — a fine streak with grain at its edges, not soft lumps.
 */
export const FIELD_LOOK = {
  /** one record; full adds point.frag's faint halo on top */
  size: { lite: 2.6, full: 2.8 },
  /** a lane's latest commit (amber, full peak) is this much larger */
  latest: 1.25,
  /** peak alpha of one record (the latest commit and the inspected record burn at 1) */
  peak: 0.5,
} as const;
