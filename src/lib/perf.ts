// src/lib/perf.ts — measured-bytes readout for #vision (§3, §8 "measured-bytes readout").
// F0 ships a working minimal implementation; S3 owns and may extend the body (keep the exports).
// Reads the Resource Timing buffer only (no network, no trackers). Numbers only — no copy here.

export interface ByteReadout {
  /** Bytes over the wire (0 for cache hits). */
  transfer: number;
  /** Compressed body bytes, cache hits included: "what this page weighs". */
  encoded: number;
  /** encoded bytes per bucket */
  html: number;
  js: number;
  css: number;
  font: number;
  img: number;
  /** /gl/*.bin records */
  gl: number;
  other: number;
  /** resources counted */
  entries: number;
}

type Bucket = 'js' | 'css' | 'font' | 'img' | 'gl' | 'other';

function bucket(e: PerformanceResourceTiming): Bucket {
  const u = e.name.split(/[?#]/)[0] ?? '';
  if (/\/gl\/[^/]+\.bin$/.test(u)) return 'gl';
  if (/\.m?js$/.test(u) || e.initiatorType === 'script') return 'js';
  if (/\.css$/.test(u) || (e.initiatorType === 'link' && /css/.test(u))) return 'css';
  if (/\.(woff2?|ttf|otf)$/.test(u)) return 'font';
  if (/\.(avif|webp|png|jpe?g|gif|svg)$/.test(u) || e.initiatorType === 'img') return 'img';
  return 'other';
}

/** Same-origin only: cross-origin entries report 0 without Timing-Allow-Origin (and the site has none). */
export function measureBytes(): ByteReadout {
  const r: ByteReadout = { transfer: 0, encoded: 0, html: 0, js: 0, css: 0, font: 0, img: 0, gl: 0, other: 0, entries: 0 };
  if (typeof performance === 'undefined' || !performance.getEntriesByType) return r;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav) {
    r.html = nav.encodedBodySize;
    r.encoded += nav.encodedBodySize;
    r.transfer += nav.transferSize;
    r.entries++;
  }
  for (const e of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
    if (!e.name.startsWith(location.origin)) continue;
    const b = bucket(e);
    r[b] += e.encodedBodySize;
    r.encoded += e.encodedBodySize;
    r.transfer += e.transferSize;
    r.entries++;
  }
  return r;
}

/** Calls `cb` now and whenever new resources finish (coalesced to one call per 250ms). Returns a stop fn. */
export function observeBytes(cb: (r: ByteReadout) => void): () => void {
  cb(measureBytes());
  if (typeof PerformanceObserver === 'undefined') return () => {};
  let timer = 0;
  const po = new PerformanceObserver(() => {
    if (timer) return;
    timer = window.setTimeout(() => {
      timer = 0;
      cb(measureBytes());
    }, 250);
  });
  try {
    po.observe({ type: 'resource', buffered: false });
  } catch {
    return () => {};
  }
  return () => {
    po.disconnect();
    window.clearTimeout(timer);
  };
}

/** Bytes → KB with one decimal (1 KB = 1024 B). Formatting for display is the caller's (Intl). */
export function kb(bytes: number): number {
  return Math.round(bytes / 102.4) / 10;
}
