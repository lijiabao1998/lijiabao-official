#version 300 es
// grid.vert — the PASS grid (§6.3). One instanced draw: 4 vertices × 12,513 instances, one per passing check.
// Cell i = (i mod 112, i div 112) on a 112 × 112 plane, turned into a 2:1 isometric diamond whose bounding box is
// 224 × 112 cell units. Geometry and ignition order are gl/gen/grid.ts (and the static CSS lattice) exactly.
// Every light is a PASS: no random windows, no ambient points; unlit cells stay faint because they are records too.
// No [data-gl-hole] handling: nothing is ever set over this stage (the readout and captions sit outside it).
// (Vertex shaders default to highp float/int: the integer maths and the hash need it.)

layout(location = 0) in vec2 aQuad; // corner of the cell's pitch diamond: (±1, 0), (0, ±1)

uniform vec2 uView, uOrigin;  // anchor size; top-left of the diamond's bounding box (CSS px)
uniform float uCell;          // CSS px per cell unit
uniform float uProgress;      // 0..1: a cell is lit once uProgress ≥ its order
uniform float uTime, uStill;  // seconds; 1 under reduced motion / frozen (no twinkle)
uniform vec4 uPulse;          // x, y, t0, strength (anchor-local; strength 0 = none)

out vec2 vL;          // local pitch-diamond coords
out float vA, vAmber; // brightness; ignition glow (the light arriving, 0 once the front has passed)

void main() {
  int i = gl_InstanceID;
  float gx = float(i % 112), gy = float(i / 112);
  // anti-diagonal d = gx − gy + 111; order = (d + 1) / 223: the diamond's LEFT corner lights first (law 2)
  float o = (gx - gy + 112.) / 223.;
  vec2 p = uOrigin + (vec2(gx - gy + 112., (gx + gy + 1.) * .5) + aQuad * vec2(1., .5)) * uCell;
  float lit = smoothstep(max(o - .02, 0.), o, uProgress); // exactly nothing lit at progress 0

  uint x = uint(i) * 2654435761u; // per-cell phase (integer hash)
  x ^= x >> 15u; x *= 0x2c1b3c6du; x ^= x >> 12u;
  float h = float(x) * 2.3283064e-10;

  // engine.pulse: one ring of brightness through the LIT records only (never empty space)
  float pt = uTime - uPulse.z, r = (length(p - uPulse.xy) - pt * 600.) / 24.;

  vL = aQuad;
  vA = mix(.12, 1., lit) * mix(.9 + .1 * sin(uTime * (.4 + h) + h * 40.), 1., uStill) // equal peak for every cell
     + lit * uPulse.w * .5 * exp(-r * r - pt * 2.);
  vAmber = lit * (1. - smoothstep(o, o + .06, uProgress * 1.06));
  gl_Position = vec4((p / uView * 2. - 1.) * vec2(1, -1), 0, 1);
}
