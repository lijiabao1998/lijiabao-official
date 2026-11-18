// src/data/features.ts — owner feature flags (spec §9.6, build-overrides §1).
// Decided by the owner:
//   - the X link is NOT approved: `x` is false and no X URL is stored anywhere (2026-09-30);
//   - vendor names stay hidden: the anonymous writers line ships (2026-09-30);
//   - the Hebrew bio line and the 「現在，由我來定義。」 signature line are removed from the site (2026-11-18:
//     「去掉好了」), so their two flags are gone with them.

export interface Features {
  /** Show `*.named` dictionary variants that name model vendors. */
  vendorNames: boolean;
  /** X profile URL. `null` = not published. */
  xUrl: string | null;
  /** Render the X link in #contact. */
  x: boolean;
  /** Render the dot portrait in #about. */
  portrait: boolean;
}

export const features: Features = {
  vendorNames: false,
  xUrl: null,
  x: false,
  portrait: true,
};

/** True when a flag is on (a string flag counts as on when it is non-empty). */
export function isOn(flag: keyof Features): boolean {
  const v = features[flag];
  return typeof v === 'string' ? v.length > 0 : Boolean(v);
}
