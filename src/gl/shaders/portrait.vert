#version 300 es
// portrait.vert — the glimmer portrait (§6.2). PORTRAIT, not data. Fragment: the shared point.frag.
//
// Every point lives on its own horizontal baseline and only ever moves ALONG it (y never changes):
// - assembly (uAssemble 0 → 1, scroll-scrubbed): rows settle top → bottom, points left → right; each slides in from
//   a scattered x on the same row (scissored to the stage, so most start out of frame);
// - the pointer nudges points sideways along their row (≤ 24px, a smooth parting); it never changes brightness and
//   carries no light;
// - a breath of ≤ 0.6px along the row and a faint twinkle keep the glimmers alive.
// Rim points of the round glasses (edge byte 255) turn amber as they settle: light comes from the left.
// Each point is one soft glimmer (point.frag, gen/glimmer.ts), fuller and brighter with the tone it samples.
precision highp float;

layout(location = 0) in vec2 aXY;   // baseline position, 0..1 of the frame
layout(location = 1) in vec2 aLE;   // tone 0..1, edge 0..1 (1 = accent)

uniform vec2 uView;      // anchor size, CSS px
uniform vec4 uRect;      // the frame inside the anchor: x, y, w, h (CSS px)
uniform vec4 uLook;      // gen/portrait.ts LOOK: size range (CSS px), alpha of the darkest point, peak alpha
uniform float uSigma;    // core σ per unit of size (gen/glimmer.ts SIGMA)
uniform mediump float uHalo; // 1 in full; also read by point.frag (mediump): precisions must match to link
uniform float uDpr;
uniform float uTime;
uniform float uAssemble;
uniform vec3 uPointer;   // anchor-local CSS px; z = active 0..1
uniform vec4 uPulse;     // x, y, t0, strength

out float vA;
out float vAmber;
out vec2 vS;             // point.frag: sprite size and core σ, device px

void main() {
  float s = fract(sin(dot(aXY, vec2(12.9898, 78.233))) * 43758.5453 + aLE.x * 7.13);
  vec2 target = uRect.xy + aXY * uRect.zw;

  float start = aXY.y * .45 + aXY.x * .15 + s * .08;
  float t = smoothstep(start, start + .32, uAssemble);
  float sx = uRect.x + (s * 2.2 - .6) * uRect.z;
  vec2 p = vec2(mix(sx, target.x, t), target.y);

  vec2 d = p - uPointer.xy;
  p.x += 24. * uPointer.z * t * (d.x / 40.) * exp(.5 - d.x * d.x / 3200. - d.y * d.y / 450.);
  p.x += sin(uTime * .7 + s * 20.) * .6 * t;

  float a = mix(uLook.z, 1., aLE.x) * mix(.22, 1., t) * (.9 + .1 * sin(uTime * (.4 + s) + s * 6.2832));
  // the focus / tap pulse: one ring of brightness through the points (never empty space); squared, not pow()
  float pt = uTime - uPulse.z;
  float q = (length(p - uPulse.xy) - pt * 600.) / 24.;
  a += uPulse.w * t * .5 * exp(-q * q) * exp(-pt * 2.);

  float amber = step(.999, aLE.y) * t;
  vA = a * mix(uLook.w, 1., amber);
  vAmber = amber;
  // the sprite reaches 2.4σ, or 5.6σ to hold the full tier's halo
  float sig = mix(uLook.x, uLook.y, aLE.x) * uSigma;
  float spr = 2. * sig * (2.4 + 3.2 * uHalo);
  gl_Position = vec4((p / uView * 2. - 1.) * vec2(1, -1), 0, 1);
  gl_PointSize = spr * uDpr;
  vS = vec2(spr, sig) * uDpr;
}
