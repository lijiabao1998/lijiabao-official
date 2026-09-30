#version 300 es
// point.frag — the shared glimmer (§6.1, §6.2): one soft, round point of light, in device px.
// A gaussian core (σ from the vertex shader) plus, in the full tier, a faint wide halo (σ × HALO_S); a window takes
// both to exactly 0 before the sprite's edge, so no point ever shows a square or a hard rim at any DPR.
// Inputs: vA (peak alpha: record/tone × twinkle + pulse), vAmber (0 = --fg, 1 = --glim), vS = (sprite size, core σ)
// in device px — the vertex shader sizes the sprite to R ≥ 2.4σ (lite) / 5.6σ (halo on).
// Output is premultiplied, blended ONE, ONE_MINUS_SRC_ALPHA: for light of one colour that is additive while dim and
// rolls off softly into --fg (the glimmer core, §2.1) — never past it, never clipping to flat white — so dense runs
// build up into smooth luminous streaks and sparse records stay single points (gen/glimmer.ts). The pointer never
// changes brightness here.
precision mediump float;

uniform vec3 uFg;     // --fg   (sRGB 0..1)
uniform vec3 uGlim;   // --glim (sRGB 0..1)
uniform float uHalo;  // 1 in full, 0 in lite / guard

in float vA;
in float vAmber;
in vec2 vS;
out vec4 o;

const float HALO_A = 0.04; // halo peak, share of the core's
const float HALO_S = 2.6;  // halo σ / core σ

void main() {
  vec2 p = (gl_PointCoord - 0.5) * vS.x;
  float r2 = dot(p, p);
  float k = 0.5 / (vS.y * vS.y);
  float m = exp(-r2 * k) + uHalo * HALO_A * exp(-r2 * k / (HALO_S * HALO_S));
  m *= 1.0 - smoothstep(0.45, 1.0, r2 / (0.25 * vS.x * vS.x));
  float a = min(m * vA, 1.0);
  o = vec4(mix(uFg, uGlim, vAmber) * a, a);
}
