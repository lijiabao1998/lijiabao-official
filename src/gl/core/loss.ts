// src/gl/core/loss.ts — WebGL context loss / restore (§6.0).
// lost: preventDefault (so the browser may restore), the engine stops and sets html[data-gl="lost"] (posters).
// restored: the engine recompiles and re-uploads from the CPU-side data it keeps, then re-attaches.
// Two losses within 60s → static for the rest of the session.

const WINDOW_MS = 60_000;
const KEY = 'lj.loss';
let lastLoss = 0;

export function watchLoss(cv: HTMLCanvasElement, onLost: () => void, onRestored: () => void): () => void {
  const lost = (e: Event): void => {
    e.preventDefault();
    onLost();
  };
  cv.addEventListener('webglcontextlost', lost);
  cv.addEventListener('webglcontextrestored', onRestored);
  return () => {
    cv.removeEventListener('webglcontextlost', lost);
    cv.removeEventListener('webglcontextrestored', onRestored);
  };
}

/** Record a loss. true → this is the second loss within 60s (across ClientRouter pages and reloads). */
export function recordLoss(): boolean {
  const now = Date.now();
  let prev = lastLoss;
  try {
    prev = Math.max(prev, Number(sessionStorage.getItem(KEY)) || 0);
    sessionStorage.setItem(KEY, String(now));
  } catch {
    /* private mode: memory only */
  }
  lastLoss = now;
  return prev > 0 && now - prev < WINDOW_MS;
}
