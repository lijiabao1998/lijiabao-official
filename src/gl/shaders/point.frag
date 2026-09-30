#version 300 es
// point.frag — the shared glimmer (§6.1). One round point: a soft core plus an optional halo (full tier).
// Inputs from the vertex shader: vA (alpha: record + twinkle + pulse), vAmber (0 = --fg, 1 = --glim).
// Output is premultiplied (blend ONE, ONE_MINUS_SRC_ALPHA). The pointer never changes brightness here.
precision mediump float;

uniform vec3 uFg;     // --fg   (sRGB 0..1)
uniform vec3 uGlim;   // --glim (sRGB 0..1)
uniform float uHalo;  // 1 in full, 0 in lite / guard

in float vA;
in float vAmber;
out vec4 o;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float core = smoothstep(0.5, 0.15, d);
  float halo = uHalo * exp(-d * d * 18.0) * 0.35;
  float a = clamp((core + halo) * vA, 0.0, 1.0);
  o = vec4(mix(uFg, uGlim, vAmber) * a, a);
}
