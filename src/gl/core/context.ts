// src/gl/core/context.ts — WebGL2 context creation + fixed GL state (§6.0).

export type RGB = readonly [number, number, number];

/** null → no usable WebGL2 (missing, blocklisted, or software: failIfMajorPerformanceCaveat). */
export function createContext(canvas: HTMLCanvasElement, highPerf: boolean): WebGL2RenderingContext | null {
  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      failIfMajorPerformanceCaveat: true,
      powerPreference: highPerf ? 'high-performance' : 'default',
    });
  } catch {
    gl = null;
  }
  return gl && !gl.isContextLost() ? gl : null;
}

/** Premultiplied "over" blending, no depth, transparent clear, scissor on (every scene draws in its anchor rect). */
export function initState(gl: WebGL2RenderingContext): void {
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.SCISSOR_TEST);
}

/** Clear the whole drawing buffer (one fast clear, scissor lifted). */
export function clearAll(gl: WebGL2RenderingContext): void {
  gl.disable(gl.SCISSOR_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.SCISSOR_TEST);
}

const FG: RGB = [0xed / 255, 0xeb / 255, 0xe6 / 255];
const GLIM: RGB = [1, 0xb5 / 255, 0x47 / 255];

function hex(v: string, fallback: RGB): RGB {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim());
  if (!m || !m[1]) return fallback;
  const h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** --fg / --glim from tokens.css as sRGB 0..1 (read once at mount; falls back to the §2.1 values). */
export function readPalette(): { fg: RGB; glim: RGB } {
  const cs = getComputedStyle(document.documentElement);
  return { fg: hex(cs.getPropertyValue('--fg'), FG), glim: hex(cs.getPropertyValue('--glim'), GLIM) };
}
