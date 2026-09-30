// src/motion/eases.ts — the named curves, durations and staggers of §5.1. The ONLY source of eases:
// sections pass EASE.* names (strings registered with CustomEase by boot.ts). CSS twins live in tokens.css
// as --ease-*; EASE_CSS mirrors them for WAAPI / inline use. No runtime GSAP import here (static-safe).

import type { CustomEase } from 'gsap/CustomEase';

/** GSAP ease names (registered by registerEases). */
export const EASE = {
  /** mask rises, odometers, VT in */
  rise: 'lj.rise',
  /** weight gains */
  weigh: 'lj.weigh',
  /** hairline scans, line draws, ignition front */
  scan: 'lj.scan',
  /** Flip, title VT group */
  snap: 'lj.snap',
  /** leaves, VT out, easeReverse */
  exit: 'lj.exit',
  /** magnet return, chip settle */
  settle: 'lj.settle',
} as const;

export type EaseKey = keyof typeof EASE;
export type EaseName = (typeof EASE)[EaseKey];

/** CustomEase SVG paths (§5.1, verbatim). */
export const EASE_PATH: Readonly<Record<EaseName, string>> = {
  'lj.rise': 'M0,0 C0.16,1 0.3,1 1,1',
  'lj.weigh': 'M0,0 C0.45,0 0.15,1 1,1',
  'lj.scan': 'M0,0 C0.65,0 0.25,1 1,1',
  'lj.snap': 'M0,0 C0.8,0 0.1,1 1,1',
  'lj.exit': 'M0,0 C0.5,0 0.75,0 1,1',
  'lj.settle': 'M0,0 C0.3,1.4 0.55,1 1,1',
};

/** The matching CSS timing functions (= tokens.css --ease-*). */
export const EASE_CSS: Readonly<Record<EaseKey, string>> = {
  rise: 'cubic-bezier(.16,1,.3,1)',
  weigh: 'cubic-bezier(.45,0,.15,1)',
  scan: 'cubic-bezier(.65,0,.25,1)',
  snap: 'cubic-bezier(.8,0,.1,1)',
  exit: 'cubic-bezier(.5,0,.75,0)',
  settle: 'cubic-bezier(.3,1.4,.55,1)',
};

/** Durations in seconds (= --d-*). */
export const DUR = { xs: 0.12, s: 0.24, m: 0.48, l: 0.8, xl: 1.2 } as const;

/** Staggers in seconds (§5.1). Total stagger is capped at `cap`. */
export const STAGGER = {
  char: 0.015,
  charMin: 0.012,
  charMax: 0.018,
  line: 0.07,
  item: 0.06,
  tile: 0.035,
  cap: 0.6,
} as const;

/** Per-item stagger for `n` items, shrunk so the whole stagger never exceeds `cap` (§5.1). */
export function stagger(each: number, n: number, cap: number = STAGGER.cap): number {
  return n > 1 && each * (n - 1) > cap ? cap / (n - 1) : each;
}

let registered = false;
/** Idempotent. boot.ts calls it once after gsap.registerPlugin(CustomEase). */
export function registerEases(ce: typeof CustomEase): void {
  if (registered) return;
  registered = true;
  for (const name of Object.keys(EASE_PATH) as EaseName[]) ce.create(name, EASE_PATH[name]);
}
