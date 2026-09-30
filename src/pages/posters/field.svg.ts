// /posters/field.svg — the record as a still image (spec §6.1 static tier; also no-JS, GL loss, forced colours,
// and the frames before WebGL draws). Built from the SAME generators as the GPU scene (gen/time-axis.ts,
// gen/lanes.ts), so the swap poster → canvas is seamless: every commit is one round dot at the same place.
//
// Geometry: viewBox 10000 × 2000 = axis x ∈ [0, 1] × 20 lane rows; `preserveAspectRatio="none"` stretches it over
// the plot band, and `vector-effect: non-scaling-stroke` keeps each zero-length round-capped segment a round dot
// of a fixed CSS size. Relative moves keep the path small (≈ 6 KB gzipped for 1,946 commits).
// Colours are the §2.1 tokens (an <img> cannot read CSS variables): --fg dots, --glim for each lane's latest.
import type { APIRoute } from 'astro';
import { facts } from '@data/facts';
import { REPOS } from '@data/repos';
import { LANES, laneRecords, pointOf, ROWS, type SnapshotLike } from '@gl/gen/lanes';

const FG = '#EDEBE6';
const GLIM = '#FFB547';
const W = 10000;
const H = ROWS * 100;

// The committed snapshot; a glob keeps the build alive without it (ordinal axis, spec §6.1).
const snap = Object.values(
  import.meta.glob<SnapshotLike>('../../data/snapshot.json', { eager: true, import: 'default' }),
)[0];

export const GET: APIRoute = () => {
  const counts = Object.fromEntries(REPOS.map((r) => [r.id, r.commits]));
  const rec = laneRecords(snap, counts);
  if (rec.count !== facts['commits.total'].value) throw new Error('[field.svg] record count differs from facts.ts');

  let dots = '';
  let latest = '';
  let cx = 0;
  let cy = 0;
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
      const dx = x - cx;
      const dy = y - cy;
      dots += dots ? `m${dx}${dy < 0 ? dy : ` ${dy}`}h0` : `M${x} ${y}h0`;
      cx = x;
      cy = y;
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" ` +
    `data-records="${rec.count}" data-lanes="${LANES.length}" data-axis="${rec.mode}">` +
    `<path d="${dots}" fill="none" stroke="${FG}" stroke-opacity=".86" stroke-width="2.25" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` +
    `<path d="${latest}" fill="none" stroke="${GLIM}" stroke-width="3.75" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` +
    `</svg>`;

  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
