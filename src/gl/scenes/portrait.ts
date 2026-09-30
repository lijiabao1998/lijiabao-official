// src/gl/scenes/portrait.ts — scene `portrait` (§6.2): the glimmer portrait in #about, chipped PORTRAIT (not data).
//
// Data: gl-manifest "portrait" (a: the first 4,096 points) and "portrait-b" (b: the next 8,192, full tier only),
// written by scripts/sample-portrait.mjs. Points are stored in prefix order, so a tier just draws a prefix:
// lite 4,096 · full 12,288 (8,192 on mobile) · × f.density after the guard halves it. One VAO, one gl.POINTS draw.
// Uniforms: uAssemble comes from motion/sections/about.ts (scroll scrub; 1 under reduced motion, and 1 when nothing
// ever sets it, so the portrait is never stuck scattered).

import type { Frame, SceneDef, Tier } from '../types';
import { POINT_FRAG, program, type Program } from '../core/program';
import VERT from '../shaders/portrait.vert?raw';
import manifest from '../../data/gl-manifest.json';
import { decode, LOOK, PT, tierCount, type Decoded } from '../gen/portrait';
import { MQ, mq } from '../../lib/dom';

interface Data {
  bytes: Uint8Array;
  count: number;
}

const U = ['uView', 'uRect', 'uLook', 'uDpr', 'uTime', 'uAssemble', 'uPointer', 'uPulse', 'uFg', 'uGlim', 'uHalo'] as const;
type Loc = Record<(typeof U)[number], WebGLUniformLocation | null>;

interface State {
  prog: Program;
  vao: WebGLVertexArrayObject;
  buf: WebGLBuffer;
  count: number;
  look: readonly [number, number];
  u: Loc | null;
}

/** Decoded bins, kept for the session: a tier switch or a page revisit never refetches. */
const bins = new Map<string, Promise<Decoded>>();

function bin(key: string): Promise<Decoded> {
  let p = bins.get(key);
  if (!p) {
    const url = (manifest as Record<string, string | undefined>)[key];
    p = url
      ? fetch(url)
          .then((r) => {
            if (!r.ok) throw new Error(`portrait: ${r.status} ${url}`);
            return r.arrayBuffer();
          })
          .then(decode)
      : Promise.reject(new Error(`portrait: no "${key}" in gl-manifest`));
    bins.set(key, p);
    p.catch(() => bins.delete(key));
  }
  return p;
}

const scene: SceneDef<Data> = {
  id: 'portrait',
  kind: 'PORTRAIT',

  async load(src: string, tier: Tier): Promise<Data> {
    const want = tierCount(tier, mq(MQ.mobile).matches);
    const a = await bin(src);
    if (want <= a.count) return { bytes: a.data.subarray(0, want * PT.STRIDE), count: want };
    const b = await bin(`${src}-b`);
    const count = Math.min(want, a.count + b.count);
    const bytes = new Uint8Array(count * PT.STRIDE);
    bytes.set(a.data);
    bytes.set(b.data.subarray(0, (count - a.count) * PT.STRIDE), a.data.length);
    return { bytes, count };
  },

  create(gl: WebGL2RenderingContext, d: Data, tier: Tier): State {
    const prog = program(gl, 'portrait', VERT, POINT_FRAG);
    const vao = gl.createVertexArray() as WebGLVertexArrayObject;
    const buf = gl.createBuffer() as WebGLBuffer;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, d.bytes, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.UNSIGNED_SHORT, true, PT.STRIDE, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.UNSIGNED_BYTE, true, PT.STRIDE, 4);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return { prog, vao, buf, count: d.count, look: tier === 'full' ? LOOK.full : LOOK.lite, u: null };
  },

  draw(gl: WebGL2RenderingContext, state: unknown, f: Frame): boolean {
    const s = state as State;
    if (!s.prog.ready()) return true;
    let u = s.u;
    if (!u) {
      u = {} as Loc;
      for (const name of U) u[name] = s.prog.loc(name);
      s.u = u;
    }
    // contain-fit the frame in the anchor (the stage keeps the same aspect ratio, so this is normally the anchor)
    const vw = f.view[0];
    const vh = f.view[1];
    let w = vw;
    let h = (vw * PT.H) / PT.W;
    if (h > vh) {
      h = vh;
      w = (vh * PT.W) / PT.H;
    }
    const asm = f.params.uAssemble;
    gl.useProgram(s.prog.glp);
    gl.bindVertexArray(s.vao);
    gl.uniform2f(u.uView, vw, vh);
    gl.uniform4f(u.uRect, (vw - w) / 2, (vh - h) / 2, w, h);
    gl.uniform3f(u.uLook, s.look[0], s.look[1], LOOK.alpha0);
    gl.uniform1f(u.uDpr, f.dpr);
    gl.uniform1f(u.uTime, f.t);
    gl.uniform1f(u.uAssemble, typeof asm === 'number' ? asm : 1);
    gl.uniform3f(u.uPointer, f.pointer[0], f.pointer[1], f.pointer[2]);
    gl.uniform4f(u.uPulse, f.pulse[0], f.pulse[1], f.pulse[2], f.pulse[3]);
    gl.uniform3f(u.uFg, f.fg[0], f.fg[1], f.fg[2]);
    gl.uniform3f(u.uGlim, f.glim[0], f.glim[1], f.glim[2]);
    gl.uniform1f(u.uHalo, f.halo);
    gl.drawArrays(gl.POINTS, 0, Math.floor(s.count * f.density));
    gl.bindVertexArray(null);
    return !f.reduced;
  },

  resize(): void {
    /* the frame is fitted from f.view on every draw */
  },

  destroy(gl: WebGL2RenderingContext, state: unknown): void {
    const s = state as State;
    gl.deleteVertexArray(s.vao);
    gl.deleteBuffer(s.buf);
  },

  count(state: unknown): number {
    return (state as State).count;
  },
};

export default scene;
