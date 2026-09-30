// src/gl/scenes/grid.ts — scene `grid`: the PASS grid on GlimmerTown (#fig-pass), DATA (§6.3).
//
// 12,513 instanced diamonds in one draw call, every one a passing check. Positions are analytic (gl_InstanceID →
// gen/grid.ts geometry), so there is no binary to fetch: load() resolves at once and the manifest key is unused.
// The section (motion/sections/gt-pass.ts) drives `uProgress` 0 → 1 through the engine handle; until it does, the
// grid shows its end state (all lit), exactly like the static CSS lattice. No picking (cells have no identity).
// Full and lite draw the same 12,513 cells (law 3); full only gets a sharper backing store (DPR ≤ 1.75).

import { program, type Program } from '../core/program';
import { BOX_H, BOX_W, COUNT } from '../gen/grid';
import vert from '../shaders/grid.vert?raw';
import frag from '../shaders/grid.frag?raw';
import type { SceneDef } from '../types';

/** Uniform names; `State.u` holds their locations in this order. */
// No uHoles / uHoleCount: nothing is ever set over this stage (the readout and captions sit outside it).
const U = ['uView', 'uOrigin', 'uCell', 'uProgress', 'uTime', 'uStill', 'uPulse', 'uFg', 'uGlim', 'uPx'];

/** Pitch-diamond corners as a triangle strip: left, top, bottom, right. */
const QUAD = new Float32Array([-1, 0, 0, -1, 0, 1, 1, 0]);

interface State {
  prog: Program;
  vao: WebGLVertexArrayObject | null;
  buf: WebGLBuffer | null;
  u: (WebGLUniformLocation | null)[] | null;
}

const scene: SceneDef<null> = {
  id: 'grid',
  kind: 'DATA',

  load: () => Promise.resolve(null),

  create(gl): State {
    const prog = program(gl, 'grid', vert, frag);
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return { prog, vao, buf, u: null };
  },

  draw(gl, state, f): boolean {
    const s = state as State;
    if (!s.prog.ready()) return true;
    const u = s.u ?? (s.u = U.map((n) => s.prog.loc(n)));
    const w = f.view[0];
    const h = f.view[1];
    // the diamond fits the anchor rect (2:1 in the layout, so it fills it), centred
    const cell = Math.min(w / BOX_W, h / BOX_H);
    const pv = f.params['uProgress'];
    gl.useProgram(s.prog.glp);
    gl.uniform2f(u[0], w, h);
    gl.uniform2f(u[1], (w - BOX_W * cell) / 2, (h - BOX_H * cell) / 2);
    gl.uniform1f(u[2], cell);
    gl.uniform1f(u[3], typeof pv === 'number' ? pv : 1); // unset → end state (fail-open)
    gl.uniform1f(u[4], f.t);
    gl.uniform1f(u[5], f.reduced ? 1 : 0);
    gl.uniform4fv(u[6], f.pulse);
    gl.uniform3f(u[7], f.fg[0], f.fg[1], f.fg[2]);
    gl.uniform3f(u[8], f.glim[0], f.glim[1], f.glim[2]);
    gl.uniform1f(u[9], cell * f.dpr);
    gl.bindVertexArray(s.vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, COUNT);
    gl.bindVertexArray(null);
    return !f.reduced; // the twinkle keeps it alive; reduced motion / frozen draw on change only
  },

  resize(): void {
    // geometry is derived from f.view on every draw (two divisions): nothing to rebuild
  },

  destroy(gl, state): void {
    const s = state as State;
    gl.deleteVertexArray(s.vao);
    gl.deleteBuffer(s.buf);
  },

  count: () => COUNT,
};

export default scene;
