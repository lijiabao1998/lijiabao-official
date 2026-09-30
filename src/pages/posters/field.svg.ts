// /posters/field.svg — the record as a still image (spec §6.1 static tier; also no-JS, GL loss, forced colours,
// the intro's lit copy and the frames before WebGL draws). Built from the SAME generators as the GPU scene
// (gen/time-axis.ts, gen/lanes.ts, gen/glimmer.ts), so the swap poster → canvas is seamless: every commit is one
// soft round glimmer at the same place, the same size and (on average) the same brightness.
//
// Geometry: viewBox 10000 × 2000 = axis x ∈ [0, 1] × 20 lane rows; `preserveAspectRatio="none"` stretches it over
// the plot band, and `vector-effect: non-scaling-stroke` keeps each zero-length round-capped segment a round dot
// of a fixed CSS size. Relative moves keep the paths small.
// The glimmer: the scene's gaussian (σ = SIGMA × size, lite size) as three concentric round dots whose "over"
// alphas step down the same curve (the rasteriser's antialiasing smooths the steps). Records are dealt round-robin
// into GROUPS paths, each drawn three times (one per ring): overlapping records in different groups add up
// (1 − Π(1 − a), as they composite in the scene), so busy runs build into bright streaks here too.
// Colours are the §2.1 tokens (an <img> cannot read CSS variables): --fg dots, --glim for each lane's latest.
import type { APIRoute } from 'astro';
import { facts } from '@data/facts';
import { REPOS } from '@data/repos';
import { LANES, laneRecords, pointOf, ROWS, type SnapshotLike } from '@gl/gen/lanes';
import { FIELD_LOOK, SIGMA } from '@gl/gen/glimmer';

const FG = '#EDEBE6';
const GLIM = '#FFB547';
const W = 10000;
const H = ROWS * 100;
/** Paths the records are dealt into (more = closer to the scene's accumulation in dense runs, a few bytes more). */
const GROUPS = 6;
/** field.vert's twinkle, .82 + .18 sin(…), averages .82 of a record's peak: the still shows that mean. */
const TWINKLE = 0.82;
/** Ring radii in σ: each ring carries the gaussian's mean over its annulus (0–.85σ, .85–1.55σ, 1.55–2.3σ). */
const RINGS = [0.85, 1.55, 2.3] as const;

// The committed snapshot; a glob keeps the build alive without it (ordinal axis, spec §6.1).
const snap = Object.values(
  import.meta.glob<SnapshotLike>('../../data/snapshot.json', { eager: true, import: 'default' }),
)[0];

/**
 * A gaussian glimmer of `size` CSS px and `peak` alpha as three nested dots: [diameter, alpha] from the outer ring
 * in. Composited "over", the alpha inside ring k is 1 − Π(1 − a) of every ring that covers it = the gaussian's mean
 * over that annulus.
 */
function rings(size: number, peak: number): [number, number][] {
  const s = size * SIGMA;
  const g = (u: number) => Math.exp(-0.5 * u * u);
  // mean of peak·g over the annulus [a, b] (in σ): peak · 2(g(a) − g(b)) / (b² − a²)
  const mean = (a: number, b: number) => (peak * 2 * (g(a) - g(b))) / (b * b - a * a);
  const target = [mean(0, RINGS[0]), mean(RINGS[0], RINGS[1]), mean(RINGS[1], RINGS[2])];
  const a3 = target[2] as number;
  const a2 = 1 - (1 - (target[1] as number)) / (1 - a3);
  const a1 = 1 - (1 - (target[0] as number)) / ((1 - a3) * (1 - a2));
  return [
    [2 * RINGS[2] * s, a3],
    [2 * RINGS[1] * s, a2],
    [2 * RINGS[0] * s, a1],
  ];
}

const f2 = (v: number) => String(Math.round(v * 100) / 100);

export const GET: APIRoute = () => {
  const counts = Object.fromEntries(REPOS.map((r) => [r.id, r.commits]));
  const rec = laneRecords(snap, counts);
  if (rec.count !== facts['commits.total'].value) throw new Error('[field.svg] record count differs from facts.ts');

  const groups = Array.from({ length: GROUPS }, () => ({ d: '', x: 0, y: 0 }));
  let latest = '';
  let k = 0;
  for (const l of rec.lanes) {
    const n = l.minutes.length;
    for (let i = 0; i < n; i++) {
      const p = pointOf(rec.mode, l, i);
      const x = Math.round(p.x * W);
      const y = Math.round(p.y * (H / ROWS));
      if (i === n - 1) {
        latest += `M${x} ${y}h0`;
        continue;
      }
      // round-robin: neighbours in time land in different groups, so a busy run accumulates
      const g = groups[k++ % GROUPS] as { d: string; x: number; y: number };
      const dx = x - g.x;
      const dy = y - g.y;
      g.d += g.d ? `m${dx}${dy < 0 ? dy : ` ${dy}`}h0` : `M${x} ${y}h0`;
      g.x = x;
      g.y = y;
    }
  }

  // each path three times, outer ring first (same colour: the order of the groups does not matter); the repeats sit
  // next to each other, so gzip stores each path's data about once
  const draw = (d: string, size: number, peak: number, colour: string) =>
    rings(size, peak)
      .map(
        ([w, a]) =>
          `<path d="${d}" stroke="${colour}" stroke-width="${f2(w)}" stroke-opacity="${f2(a)}" ` +
          `vector-effect="non-scaling-stroke"/>`,
      )
      .join('');
  const lite = FIELD_LOOK.size.lite;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" ` +
    `data-records="${rec.count}" data-lanes="${LANES.length}" data-axis="${rec.mode}">` +
    `<g fill="none" stroke-linecap="round">` +
    groups.map((g) => draw(g.d, lite, FIELD_LOOK.peak * TWINKLE, FG)).join('') +
    draw(latest, lite + FIELD_LOOK.latest, TWINKLE, GLIM) +
    `</g></svg>`;

  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
