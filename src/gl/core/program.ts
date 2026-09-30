// src/gl/core/program.ts — shader programs, cached per context, compiled without blocking (§6.0 warm-up).
//
// Scenes call program(gl, key, vert, frag) in create(); the same key returns the same compiled program on every
// later create (tier switch, page revisit), so NEVER delete a program in SceneDef.destroy. In draw():
//   if (!prog.ready()) return true;   // still compiling (KHR_parallel_shader_compile) → keep polling
// Look up uniform locations once (prog.loc) after ready() and keep them in the scene state (zero per-frame work).
// A link failure reports to the engine, which goes data-gl="none" → static (§6.0 "shader compile error").

import POINT_SRC from '../shaders/point.frag?raw';

/** The shared point fragment shader (inputs vA, vAmber; uniforms uFg, uGlim, uHalo). */
export const POINT_FRAG: string = POINT_SRC;

const COMPLETION_STATUS_KHR = 0x91b1;

export interface Program {
  readonly key: string;
  readonly glp: WebGLProgram;
  /** Non-blocking with KHR_parallel_shader_compile; true once linked OK. */
  ready(): boolean;
  readonly failed: boolean;
  /** Cached uniform location (call after ready()). */
  loc(name: string): WebGLUniformLocation | null;
  /** Cached attribute location (-1 when absent). */
  attrib(name: string): number;
}

interface Entry extends Program {
  status: 0 | 1 | 2; // pending | ok | failed
  failed: boolean;
  vs: WebGLShader | null;
  fs: WebGLShader | null;
  warm: boolean;
}

const caches = new WeakMap<WebGL2RenderingContext, Map<string, Entry>>();
const pendings = new WeakMap<WebGL2RenderingContext, Entry[]>();
const parallel = new WeakMap<WebGL2RenderingContext, boolean>();
let onError: ((key: string, log: string) => void) | null = null;

/** Enable KHR_parallel_shader_compile when present (call once per context / restore). */
export function enableParallel(gl: WebGL2RenderingContext): void {
  parallel.set(gl, !!gl.getExtension('KHR_parallel_shader_compile'));
}

export function onProgramError(cb: ((key: string, log: string) => void) | null): void {
  onError = cb;
}

function shader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function resolve(gl: WebGL2RenderingContext, e: Entry): void {
  if (e.status !== 0 || gl.isContextLost()) return;
  if (parallel.get(gl) && !gl.getProgramParameter(e.glp, COMPLETION_STATUS_KHR)) return;
  if (gl.getProgramParameter(e.glp, gl.LINK_STATUS)) {
    e.status = 1;
    for (const s of [e.vs, e.fs]) {
      if (!s) continue;
      gl.detachShader(e.glp, s);
      gl.deleteShader(s);
    }
    e.vs = e.fs = null;
  } else {
    e.status = 2;
    e.failed = true;
    const log = [gl.getProgramInfoLog(e.glp), e.vs && gl.getShaderInfoLog(e.vs), e.fs && gl.getShaderInfoLog(e.fs)]
      .filter(Boolean)
      .join('\n');
    if (import.meta.env.DEV) console.error(`[gl] program "${e.key}" failed\n${log}`);
    onError?.(e.key, log);
  }
}

export function program(gl: WebGL2RenderingContext, key: string, vert: string, frag: string): Program {
  let cache = caches.get(gl);
  if (!cache) caches.set(gl, (cache = new Map()));
  const hit = cache.get(key);
  if (hit) return hit;

  const glp = gl.createProgram() as WebGLProgram;
  const vs = shader(gl, gl.VERTEX_SHADER, vert);
  const fs = shader(gl, gl.FRAGMENT_SHADER, frag);
  if (vs) gl.attachShader(glp, vs);
  if (fs) gl.attachShader(glp, fs);
  gl.linkProgram(glp);

  const locs = new Map<string, WebGLUniformLocation | null>();
  const attrs = new Map<string, number>();
  const e: Entry = {
    key,
    glp,
    status: 0,
    failed: false,
    vs,
    fs,
    warm: false,
    ready: () => {
      resolve(gl, e);
      return e.status === 1;
    },
    loc: (name) => {
      let l = locs.get(name);
      if (l === undefined) locs.set(name, (l = gl.getUniformLocation(glp, name)));
      return l;
    },
    attrib: (name) => {
      let a = attrs.get(name);
      if (a === undefined) attrs.set(name, (a = gl.getAttribLocation(glp, name)));
      return a;
    },
  };
  cache.set(key, e);
  let list = pendings.get(gl);
  if (!list) pendings.set(gl, (list = []));
  list.push(e);
  return e;
}

/**
 * Engine-side, once per frame while programs are pending: resolve them without blocking and warm each newly
 * linked program with one invisible 1×1 draw (colour writes off) so its first real frame never stalls.
 * Returns a bitmask: 1 = something resolved this frame, 2 = programs still pending.
 */
export function pollPrograms(gl: WebGL2RenderingContext): number {
  const list = pendings.get(gl);
  if (!list || list.length === 0) return 0;
  let out = 0;
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i] as Entry;
    resolve(gl, e);
    if (e.status === 0) continue;
    list.splice(i, 1);
    out |= 1;
    if (e.status === 1 && !e.warm) {
      e.warm = true;
      gl.useProgram(e.glp);
      gl.bindVertexArray(null);
      gl.colorMask(false, false, false, false);
      gl.viewport(0, 0, 1, 1);
      gl.scissor(0, 0, 1, 1);
      gl.drawArrays(gl.POINTS, 0, 1);
      gl.colorMask(true, true, true, true);
    }
  }
  return list.length ? out | 2 : out;
}

/** Forget every program of this context (`del` = also delete them; skip after a context loss). */
export function clearPrograms(gl: WebGL2RenderingContext, del: boolean): void {
  const cache = caches.get(gl);
  if (cache && del && !gl.isContextLost()) for (const e of cache.values()) gl.deleteProgram(e.glp);
  caches.delete(gl);
  pendings.delete(gl);
}
