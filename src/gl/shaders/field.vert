#version 300 es
// field.vert — the record (spec §6.1). One gl.POINTS draw: every default-branch commit is one point on its repo
// lane. Positions are analytic (no simulation): axis x from gen/time-axis.ts, beeswarm y from gen/lanes.ts.
// Light comes from the left (uScan ignites records whose axis x ≤ uScan); the pointer only slides records along
// their own lane and never changes brightness; the pulse adds light to records only; holes dim text areas.
precision highp float;

layout(location = 0) in float aX;       // axis x, 0..1
layout(location = 1) in float aY;       // y in lane units (row + .5 + beeswarm)
layout(location = 2) in float aSeed;    // twinkle seed, 0..1
layout(location = 3) in float aLatest;  // 1 = the latest commit of its lane (amber)

uniform vec4 uBand;        // plot band inside the anchor, CSS px (x, y, w, h)
uniform vec2 uView;        // anchor size, CSS px
uniform float uLaneH;      // CSS px
uniform float uDpr;
uniform float uTime;
uniform float uScan;       // ignition front on the axis (≥ 1 = all lit)
uniform float uScroll;     // hero scroll-out 0..1
uniform mediump float uHalo; // 1 in full; also read by point.frag (mediump): precisions must match to link
uniform float uPicked;     // record index, < 0 = none
uniform float uSize;       // base point size, CSS px
uniform vec3 uPointer;     // anchor-local CSS px (smoothed), z = active 0..1
uniform vec4 uHoles[8];    // [data-gl-hole] rects (+12px pad), anchor-local
uniform int uHoleCount;
uniform vec4 uPulse;       // x, y, t0, strength

out float vA;
out float vAmber;

void main() {
  vec2 p = vec2(uBand.x + aX * uBand.z, uBand.y + aY * uLaneH);
  float picked = (uPicked >= 0. && gl_VertexID == int(uPicked + .5)) ? 1. : 0.;
  float lit = smoothstep(aX - .02, aX, uScan);

  // the pointer parts the records along their lane (x only, ≤ 18px); the inspected record holds its place
  vec2 d = p - uPointer.xy;
  float k = uPointer.z * exp(-dot(d, d) / (2. * 120. * 120.)) * step(abs(d.y), uLaneH * 2.) * (1. - picked);
  p.x += sign(d.x) * 18. * k;
  p.y -= uScroll * 32.;

  // equal peak for every record; the rate differs per record so the field never pulses in unison
  float tw = .82 + .18 * sin(uTime * (.5 + aSeed) + aSeed * 40.);
  float a = mix(.10, 1., lit) * tw * (1. - uScroll * .6);

  for (int i = 0; i < 8; i++) {
    if (i >= uHoleCount) break;
    vec4 h = uHoles[i];
    vec2 q = abs(p - (h.xy + h.zw * .5)) - h.zw * .5;
    if (max(q.x, q.y) < 0.) a *= .08;
  }

  if (uPulse.w > 0.) {
    float pt = uTime - uPulse.z;
    float pr = length(p - uPulse.xy);
    a += lit * uPulse.w * exp(-pow((pr - pt * 600.) / 24., 2.)) * exp(-pt * 2.);
  }

  vA = a;
  vAmber = max(aLatest, picked);
  gl_Position = vec4((p / uView * 2. - 1.) * vec2(1., -1.), 0., 1.);
  gl_PointSize = (uSize + aLatest * 1.5 + uHalo * 2. + picked * 3.) * uDpr;
}
