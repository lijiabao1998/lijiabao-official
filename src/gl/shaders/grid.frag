#version 300 es
// grid.frag — one PASS cell: the inner diamond of its pitch (fill .62, the CSS lattice's 1 − 2g), antialiased.
// Below ~2 device px per cell unit a diamond cannot be resolved: the cell is drawn at its mean coverage
// (.62² = .3844) instead, so the dense lattice reads as an even field rather than moiré (same idea as the mini).
// Output is premultiplied (blend ONE, ONE_MINUS_SRC_ALPHA). Amber only while a cell ignites.
precision mediump float;

uniform vec3 uFg, uGlim; // --fg, --glim
uniform float uPx;       // device px per cell unit

in vec2 vL;
in float vA, vAmber;
out vec4 o;

void main() {
  float d = abs(vL.x) + abs(vL.y), w = fwidth(d) * .75; // L1: 1 on the pitch diamond's edge
  float a = clamp(mix(.3844, 1. - smoothstep(.62 - w, .62 + w, d), smoothstep(2., 4., uPx)) * vA, 0., 1.);
  o = vec4(mix(uFg, uGlim, vAmber) * a, a);
}
