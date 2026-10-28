// The blog index's foot (../../blog/shore-scene.tsx): the shore in the hero boat's
// world (../boat-scene/scene.js), drawn live. Laid out after the Blender study in
// animation/blog-shore (the lighthouse where it stood, at its proportions; the same
// camera) and the owner's marks on frames of it: one low dune across the view, nothing
// above it, the girl on the near sand by the lighthouse, and on the right the shore
// coming in toward us, the water down to the corner. Made and drawn as the hero is:
// - the lighthouse and its rocks are soft clay in the hero's tones, printed smooth (an
//   even tone between ink and paper, not dots), outlined in ink one dot wide; the red
//   band and cap print in their own ink, as the hero's coloured things do;
// - the girl alone is printed in the hero's 1-bit dots (8×8 Bayer);
// - the sand is drawn as the hero draws its water: colour pixels, from a shaded to a lit
//   tone by its slope to the sun, crossed by long pale streaks along the wind and short
//   one-row dashes, and marked with fine contour lines that follow the dune's shape (in
//   place of grass), wet and darker where the beach meets the sea, fading into the
//   page's paper far off;
// - the sea is the hero's water, at its opacity over the paper: swells rolling in, and
//   foam washing in and out where it meets the sand.
// Seen from eye level, as theboringblog.ai's meadow is. Only the girl and the water
// move: she breathes, shifts her weight, and now and then looks back at the lighthouse;
// the swells roll in and the foam washes. So the land is drawn once (and again on
// resize), with its depth, and each frame draws only her and the water; the print joins
// the two by depth.
//
// createShore(canvas, { tune }) builds the scene (in slices, letting the page breathe
// every ~30 ms, so building it never holds up scrolling) and resolves to its controls:
// the caller sizes it (resize), runs it while it's on screen (start/stop) or draws one
// frame (still), changes its settings (tune: any of SHORE_DEFAULTS; the ground is rebuilt
// when its shape changes) and frees the GPU (dispose). /dev/shore tunes it live.

import * as THREE from "three";
import { dotted, makeGirl, makeLights, materials, tuneLights } from "./boat";
import { seeded, smooth } from "./lighthouse";
import { GLOBE_DEFAULTS } from "./scene";
import { reloadKeepingScroll } from "@/lib/dev-reload";

const INK = "#1C1917";
const PAPER = "#FFFDF8";
const PAGE = "#FDFDFC"; // the page's own paper (warm-25), what far things fade into
const linear = (hex) => new THREE.Color(hex);

// --- the ground (metres; x across, y away, z up) ------------------------------------
// One low dune across the view, its crest about 80 m out: its skyline is the owner's red
// line (highest by the lighthouse, easing down to the right, dipping to the beach), set by
// direction (x over y), so it's the same line on screen. Its long face rises gently from
// our feet; behind it the ground drops away out of sight, to a flat on the left and, on
// the right, the dune comes down to a beach and the shoreline runs in toward us (from
// ~125 m out, three quarters across, to the frame's foot), the water beyond it. The
// headland the lighthouse stands on is far behind it.

/** Everything worth tuning (/dev/shore), metres unless it says otherwise; as the owner
 *  tuned it there (2026-10-28). */
export const SHORE_DEFAULTS = {
  // the dune: how far out its crest is, and how high it stands along the view (the
  // owner's red line: by the lighthouse, mid-way, three quarters across, the right edge)
  ridgeDistance: 83,
  crestLighthouse: 4.25,
  crestMiddle: 2.3,
  crestThreeQuarters: 2.04,
  crestRight: 2.3,
  faceCurve: 0.85, // how low and flat its face stays close to us (higher: flatter)
  ridgeWander: 2.9, // how much its crest wanders toward and away from us (×)
  hummocks: 1.85, // the small bumps over it all (×)
  // the shore: where the shoreline is across, 38 m out (the frame's foot) and 125 m out
  shoreNear: 4.6,
  shoreFar: 41,
  beachWidth: 25, // how far inland the dune comes down to the beach
  beachSlope: 0.065, // the beach's fall into the water (about 1 in 15)
  wetWidth: 10.1, // how far up the beach the sand is wet
  // the water
  waterOpacity: 0.8,
  waterColour: 0.45, // how much of its blue it keeps (0: grey)
  swellSpacing: 22,
  swellSpeed: 2.75,
  swellStrength: 0.55,
  glints: 0.29,
  foamWidth: 3.65,
  foamWash: 1.1, // how far the foam washes in and out
  foamSpeed: 0.9,
  foamLine: 0.7, // the line of foam coming in just beyond
  // the sand's markings
  contourSpacing: 0.32,
  contourStrength: 0.5,
  streaks: 0.4,
  dashes: 1, // (×)
  fogNear: 110,
  fogFar: 620,
  // the lighthouse: across, how far out, and its headland's height
  lighthouseX: -75,
  lighthouseDistance: 200,
  headland: 8,
  // the girl: where she stands, as a point in the frame (from the left, from the top),
  // on desktop and on phones, and how tall she looks against the lighthouse (its height,
  // ground to rod tip; the owner's reference had her at 0.19, and asked for 0.8 of that)
  girlX: 0.242,
  girlY: 0.686,
  girlPhoneX: 0.6,
  girlPhoneY: 0.74,
  girlSize: 0.15,
  // the camera: eye height
  eye: 3.55,
};

/** The ground's height at (x across, y away), for settings P. */
function heightWith(P) {
  const crest = [
    [-0.8, P.crestLighthouse + 0.25],
    [-0.34, P.crestLighthouse],
    [-0.02, P.crestMiddle],
    [0.23, P.crestThreeQuarters],
    [0.47, P.crestRight],
    [0.9, Math.max(0.1, P.crestRight - 0.1)],
  ];
  const crestHeight = (a) => {
    if (a <= crest[0][0]) return crest[0][1];
    for (let i = 1; i < crest.length; i++) {
      const [a1, h1] = crest[i];
      const [a0, h0] = crest[i - 1];
      if (a <= a1) return h0 + (h1 - h0) * smooth(a0, a1, a);
    }
    return crest[crest.length - 1][1];
  };
  const R = P.ridgeDistance;
  const shoreSlope = (P.shoreFar - P.shoreNear) / (125 - 38);
  return (x, y) => {
    const yc = R + P.ridgeWander * (2.5 * Math.sin(x / 19 + 0.6) + 1.2 * Math.sin(x / 7 + 1.3));
    const h = crestHeight(x / R) + 0.12 * Math.sin(x * 0.45 + 0.3) + 0.07 * Math.sin(x * 1.3 + 1.1);
    let z;
    if (y < yc) {
      // the long face toward us: low and flat close by, steepening up to the crest
      const t = Math.max(0, 1 - (yc - y) / (yc - 4));
      z = 0.4 + (h - 0.4) * t ** P.faceCurve;
    } else {
      // and behind, down out of sight to a flat
      z = 0.6 + (h - 0.6) * Math.max(0, 1 - (y - yc) / (h * 2.2 + 3)) ** 1.4;
    }
    // small hummocks over it all
    z += P.hummocks * (0.06 * Math.sin(x / 3.1 + y / 2.3) + 0.05 * Math.sin(x / 1.7 - y / 4.1));
    // on the right, down to the beach and under the water
    const xs = P.shoreNear + shoreSlope * (y - 38);
    const toWater = smooth(xs - P.beachWidth, xs - 2, x);
    z = z * (1 - toWater) + Math.max(-2, P.beachSlope * (xs - x)) * toWater;
    // the headland (only where it rises: its tail, a hair above 0 everywhere, would lift
    // the seabed)
    const r = ((x - P.lighthouseX) / 38) ** 2 + ((y - P.lighthouseDistance) / 34) ** 2;
    return r < 9 ? Math.max(z, P.headland * Math.exp(-r)) : z;
  };
}

/** Settings that change the ground's shape (a rebuild). */
const SHAPE = [
  "ridgeDistance",
  "crestLighthouse",
  "crestMiddle",
  "crestThreeQuarters",
  "crestRight",
  "faceCurve",
  "ridgeWander",
  "hummocks",
  "shoreNear",
  "shoreFar",
  "beachWidth",
  "beachSlope",
  "lighthouseX",
  "lighthouseDistance",
  "headland",
];

/** Blender's (x, y, z) as three.js's (x, z, -y). */
const at = (x, y, z) => new THREE.Vector3(x, z, -y);

// the two views, as the study's two cameras: tangent of the half-angle across, the
// lowest and highest tangent up/down to keep in frame, and the turn to the left
const RIGS = {
  wide: { tanH: 0.45, bottom: -0.0524, top: 0.1745, yaw: 0 },
  narrow: { tanH: 0.2866, bottom: -0.089, top: 0.229, yaw: (17 * Math.PI) / 180 },
};

/** Gives the page a turn when this slice of work has run ~30 ms. */
function pacer() {
  let since = performance.now();
  return async () => {
    if (performance.now() - since < 30) return;
    await new Promise((r) => setTimeout(r, 0));
    since = performance.now();
  };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ tune?: Partial<typeof SHORE_DEFAULTS> }} [options]
 */
export async function createShore(canvas, { tune: initial } = {}) {
  const breathe = pacer();
  let P = { ...SHORE_DEFAULTS, ...initial };
  let height = heightWith(P);
  const set = GLOBE_DEFAULTS;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 4, 0.5, 4000);
  camera.position.set(0, P.eye, 0);
  // the clay's light: from the upper left, a little in front, with the hero's fill
  const lights = makeLights(new THREE.Vector3(-0.6, 0.65, 0.45).normalize());
  scene.add(lights.hemi, lights.sun);
  tuneLights(lights, set);
  // the sand's sun: low on the left, a little beyond the dunes, so each slip face
  // falls into shade under a bright crest
  const SUN = new THREE.Vector3(-0.85, 0.4, -0.35).normalize();

  // --- the ground: a fan of rows out from the camera, finer close to it --------------
  const ND = 240;
  const NC = 720;
  const D0 = 6;
  const D1 = 760;
  const A0 = (-41 * Math.PI) / 180;
  const A1 = (37 * Math.PI) / 180;
  const depthAt = (i) => D0 * (D1 / D0) ** (i / (ND - 1));
  const positions = new Float32Array(ND * NC * 3);
  // (the heights, for the settings as they are; `pace` lets the page breathe as it goes)
  async function shape(pace) {
    for (let i = 0; i < ND; i++) {
      if (pace) await breathe();
      const y = depthAt(i);
      for (let j = 0; j < NC; j++) {
        const x = y * Math.tan(A0 + ((A1 - A0) * j) / (NC - 1));
        positions.set([x, height(x, y), -y], (i * NC + j) * 3);
      }
    }
  }
  await shape(true);
  const indices = [];
  for (let i = 0; i < ND - 1; i++)
    for (let j = 0; j < NC - 1; j++) {
      const a = i * NC + j;
      indices.push(a, a + 1, a + NC, a + 1, a + NC + 1, a + NC); // wound to face up
    }
  const groundGeo = new THREE.BufferGeometry();
  groundGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  groundGeo.setIndex(indices);
  groundGeo.computeVertexNormals();

  const noiseGlsl = /* glsl */ `
    float hash(vec2 p) {
      p = mod(p, 4096.0);
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float a = 0.5, s = 0.0;
      for (int i = 0; i < 4; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
      return s;
    }
    // the hero water's long streaks, along the wind (across the view)
    float streaks(vec2 g) {
      float st = fbm(vec2(g.x * 0.05, g.y * 0.6));
      return smoothstep(0.58, 0.72, st) * (0.6 + 0.4 * noise(vec2(g.x * 0.2, g.y * 0.05)));
    }
    // its Kingdom-style dashes: one device row tall, their length on the ground
    float dashes(float row, float gx, float density) {
      float rh = hash(vec2(row, 7.13));
      float len = 0.5 + rh * 1.6;
      float x = gx / len + rh * 31.0;
      float seg = floor(x);
      float sh = hash(vec2(row, seg));
      return step(fract(x), 0.2 + 0.45 * sh) * step(1.0 - density, sh);
    }
    float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    // the shoreline across, at depth y (as in heightWith)
    uniform vec2 uShore; // across at 38 m out, and its change per metre out
    #define SHORE_X(depth) (uShore.x + uShore.y * ((depth) - 38.0))
  `;
  const worldVertex = /* glsl */ `
    varying vec3 vWorld;
    varying vec3 vN;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w;
    }
  `;

  // the sand: written to the print's target at quarter alpha, its mark for "colour"
  const sandMat = new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: SUN },
      uShade: { value: linear("#BBAE9F") }, // a touch of the water's lavender in the shade
      uLit: { value: linear("#F7F2E9") },
      uStreak: { value: linear("#FFFDF7") },
      uWet: { value: linear("#B9AE9E") },
      uPage: { value: linear(PAGE) },
      uDotPx: { value: 1 },
      uGirl: { value: new THREE.Vector3() },
      uGirlH: { value: 1.6 },
      uShore: { value: new THREE.Vector2() },
      uWetWidth: { value: 4.5 },
      uContour: { value: new THREE.Vector2(0.32, 0.5) }, // spacing, strength
      uStreaks: { value: 0.4 },
      uDashes: { value: 1 },
      uFog: { value: new THREE.Vector2(110, 620) },
    },
    vertexShader: worldVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun;
      uniform vec3 uShade;
      uniform vec3 uLit;
      uniform vec3 uStreak;
      uniform vec3 uWet;
      uniform vec3 uPage;
      uniform float uDotPx;
      uniform vec3 uGirl;
      uniform float uGirlH;
      uniform float uWetWidth;
      uniform vec2 uContour;
      uniform float uStreaks;
      uniform float uDashes;
      uniform vec2 uFog;
      varying vec3 vWorld;
      varying vec3 vN;
      ${noiseGlsl}
      void main() {
        // under the water the sand isn't drawn, so the sea (drawn each frame) shows there
        if (vWorld.y < -0.02) discard;
        vec3 n = normalize(vN);
        // soft light across the dunes, as across the hero's swell
        float lit = clamp(dot(n, uSun) * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uShade, uLit, smoothstep(0.32, 0.78, lit));
        vec2 g = vec2(vWorld.x, -vWorld.z); // across, away
        col = mix(col, uStreak, streaks(g) * uStreaks);
        col = mix(col, uStreak, dashes(floor(gl_FragCoord.y / uDotPx), g.x, (0.04 + 0.1 * smoothstep(0.4, 0.9, lit)) * uDashes) * 0.75);
        // markings: fine contour lines following the dune's shape, a shade darker, one
        // pixel wide, drawn only where they're far enough apart to read
        float lev = vWorld.y / uContour.x;
        float fw = fwidth(lev);
        float near = 1.0 - clamp(abs(fract(lev + 0.5) - 0.5) / max(fw, 1e-4), 0.0, 1.0);
        col = mix(col, uShade * 0.9, near * (1.0 - smoothstep(0.12, 0.35, fw)) * smoothstep(0.5, 0.9, vWorld.y) * uContour.y);
        // wet and darker down the beach, toward the water
        float inland = SHORE_X(g.y) - g.x;
        col = mix(col, uWet, (1.0 - smoothstep(0.0, uWetWidth, inland)) * 0.75);
        // the girl's shadow, falling away to the right
        vec2 s = (vWorld.xz - uGirl.xz) / uGirlH;
        col *= 1.0 - 0.14 * exp(-(pow((s.x - 0.55) / 0.75, 2.0) + pow(s.y / 0.2, 2.0)));
        // far off, into the page's paper
        float d = length(vWorld - cameraPosition);
        col = mix(col, uPage, smoothstep(uFog.x, uFog.y, d) * 0.7);
        col = mix(col, vec3(luma(col)), 0.25);
        gl_FragColor = vec4(col, 0.25);
      }
    `,
  });
  const ground = new THREE.Mesh(groundGeo, sandMat);
  scene.add(ground);

  // the sea, beyond the shore on the right: the hero's water (drawn each frame, with the
  // girl: it moves)
  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uShore: { value: new THREE.Vector2() },
      uWater: { value: new THREE.Vector2(0.8, 0.65) }, // opacity, colour kept
      uSwell: { value: new THREE.Vector3(15, 1.4, 0.55) }, // spacing, speed, strength
      uGlints: { value: 0.16 },
      uFoamSet: { value: new THREE.Vector4(1.6, 1.1, 0.9, 0.7) }, // width, wash, speed, line
      uDeep: { value: linear("#8FAEDF") },
      uShallow: { value: linear("#CDE3F6") },
      uFoam: { value: linear("#FFFFFF") },
      uPage: { value: linear(PAGE) },
      uDotPx: { value: 1 },
    },
    vertexShader: worldVertex,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uWater;
      uniform vec3 uSwell;
      uniform float uGlints;
      uniform vec4 uFoamSet;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform vec3 uPage;
      uniform float uDotPx;
      varying vec3 vWorld;
      varying vec3 vN;
      ${noiseGlsl}
      void main() {
        vec2 g = vec2(vWorld.x, -vWorld.z);
        float off = g.x - SHORE_X(g.y); // metres out from the shoreline
        if (off < -1.0) discard; // only beyond the shore
        float d = length(vWorld - cameraPosition);
        // the swell's light, from a slow ripple of noise
        float shade = 0.5 + 0.5 * (fbm(g * vec2(0.02, 0.06) + vec2(uTime * 0.01, 0.0)) - 0.5) * 2.0;
        vec3 col = mix(uDeep, uShallow, smoothstep(0.25, 0.85, shade));
        col = mix(col, uFoam, streaks(g + vec2(uTime * 0.6, 0.0)) * 0.2);
        // swells rolling in toward us: lines across the view, lighter at their crests,
        // only near enough to stay apart
        float sw = sin((g.y + uTime * uSwell.y) * 6.2832 / uSwell.x + noise(g * vec2(0.05, 0.02)) * 4.0);
        col = mix(col, uFoam, smoothstep(0.88, 1.0, sw) * uSwell.z * (1.0 - smoothstep(70.0, 240.0, d)));
        col = mix(col, mix(uFoam, vec3(1.0), 0.5), dashes(floor(gl_FragCoord.y / uDotPx), g.x + uTime * 0.25, uGlints));
        col = mix(col, vec3(luma(col)), 1.0 - uWater.y);
        col = mix(uPage, col, uWater.x);
        // foam where it meets the sand: a lacy band washing in and out, and a line of it
        // coming in just beyond
        float wash = uFoamSet.x + uFoamSet.y * sin(uTime * uFoamSet.z + g.y * 0.07);
        float lace = noise(vec2(g.x * 1.4, g.y * 0.5) + vec2(0.0, uTime * 0.4));
        float foam = (1.0 - smoothstep(wash * 0.5, wash, off)) * smoothstep(0.25, 0.6, lace + 0.35 * (1.0 - off / wash));
        foam += (1.0 - smoothstep(0.0, 0.7, abs(off - wash * 1.4))) * smoothstep(0.5, 0.75, lace) * uFoamSet.w;
        col = mix(col, uFoam, clamp(foam, 0.0, 1.0) * (1.0 - smoothstep(120.0, 400.0, d)));
        col = mix(col, uPage, smoothstep(250.0, 1400.0, d));
        gl_FragColor = vec4(col, 0.25);
      }
    `,
  });
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2600, 2995).rotateX(-Math.PI / 2), seaMat);
  sea.position.set(1300, 0, -5 - 1497.5);

  // --- the lighthouse on its headland, at the study's proportions (~28 m) ------------
  const m = materials();
  const { clay, part } = m;
  const CLAY = "#ECE5D9"; // the tower's limewash, as the hero's clay
  const RED = "#A23B33";
  const IRON = "#3A3632";
  const light = new THREE.Group();
  scene.add(light);
  const cyl = (rTop, rBottom, h, y, color, segs = 48) => {
    const o = part(new THREE.CylinderGeometry(rTop, rBottom, h, segs), clay(color));
    o.position.y = y + h / 2;
    light.add(o);
    return o;
  };
  cyl(4.0, 4.3, 1.4, -0.4, "#B9B0A4", 8); // the stone plinth
  const TOWER = 20;
  const r = (y) => 3.1 - (y / TOWER) * (3.1 - 2.05);
  // the tower: limewash, one red band between 12.6 m and 15.8 m
  for (const [y0, y1, color] of [
    [0, 12.6, CLAY],
    [12.6, 15.8, RED],
    [15.8, TOWER, CLAY],
  ])
    cyl(r(y1), r(y0), y1 - y0, 1 + y0, color, 64);
  const top = 1 + TOWER;
  const box = (w, h, d, x, y, z, color, rot = 0) => {
    const o = part(new THREE.BoxGeometry(w, h, d), clay(color));
    o.position.set(x, y, z);
    o.rotation.y = rot;
    light.add(o);
  };
  box(1.1, 2.2, 0.6, 0, 2.1, r(1.1) + 0.05, IRON); // the door, toward us
  for (const [zz, a] of [
    [6.5, -0.25],
    [11.0, 0.35],
    [15.8, -0.1],
    [21.0 - 1, 0.3],
  ]) {
    const rr = r(zz) + 0.05;
    box(0.55, 0.95, 0.4, Math.sin(a) * rr, 1 + zz, Math.cos(a) * rr, IRON, a);
  }
  cyl(2.9, 2.9, 0.45, top, IRON, 48); // the gallery
  const rail = part(new THREE.TorusGeometry(2.8, 0.05, 6, 64).rotateX(Math.PI / 2), clay(IRON));
  rail.position.y = top + 1.45;
  light.add(rail);
  for (let k = 0; k < 28; k++) {
    const a = (2 * Math.PI * k) / 28;
    const post = part(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 4), clay(IRON));
    post.position.set(2.8 * Math.cos(a), top + 0.95, 2.8 * Math.sin(a));
    light.add(post);
  }
  cyl(1.75, 1.75, 0.9, top + 0.45, IRON, 32); // the lantern's iron base
  cyl(1.65, 1.65, 2.3, top + 1.35, "#FFFFFF", 32); // its glazing, catching the light
  for (let k = 0; k < 10; k++) {
    const a = (2 * Math.PI * k) / 10;
    const bar = part(new THREE.BoxGeometry(0.08, 2.3, 0.08), clay(IRON));
    bar.position.set(1.66 * Math.cos(a), top + 2.5, 1.66 * Math.sin(a));
    light.add(bar);
  }
  const cap = part(new THREE.ConeGeometry(2.05, 1.9, 48), clay(RED));
  cap.position.y = top + 3.65 + 0.95;
  light.add(cap);
  const ball = part(new THREE.SphereGeometry(0.3, 12, 8), clay(IRON));
  ball.position.y = top + 5.75;
  light.add(ball);
  const rod = part(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 4), clay(IRON));
  rod.position.y = top + 6.3;
  light.add(rod);

  // rocks: boulders on the headland's seaward side, and a few more along it
  const rockMat = new THREE.MeshLambertMaterial({ color: "#B3AA9E", flatShading: true });
  const boulders = []; // each with its place from the lighthouse, to follow it
  const rocks = (dx, dy, count, spread, size, seed) => {
    const rng = seeded(seed);
    for (let k = 0; k < count; k++) {
      const a = rng() * 2 * Math.PI;
      const rr = spread * Math.sqrt(rng());
      const ox = dx + rr * Math.cos(a);
      const oy = dy + rr * Math.sin(a) * 0.8;
      const s = size * (0.4 + rng());
      const g = new THREE.IcosahedronGeometry(s, 1);
      const p = g.attributes.position;
      for (let v = 0; v < p.count; v++) {
        const j = 1 + (rng() - 0.5) * 0.35;
        p.setXYZ(v, p.getX(v) * j, p.getY(v) * j, p.getZ(v) * j);
      }
      g.computeVertexNormals();
      const rock = new THREE.Mesh(g, rockMat);
      rock.scale.set(1 + rng() * 0.6, 0.55 + rng() * 0.4, 1 + rng() * 0.5);
      rock.rotation.set(rng(), rng() * 6, rng());
      boulders.push({ rock, ox, oy, s });
      scene.add(rock);
    }
  };
  rocks(0, -10, 26, 22, 2.6, 3);
  rocks(30, -30, 10, 16, 1.6, 5);
  /** The lighthouse and its rocks onto the headland, where the settings put it. */
  function placeLighthouse() {
    const hx = P.lighthouseX;
    const hy = P.lighthouseDistance;
    light.position.copy(at(hx, hy, height(hx, hy)));
    for (const b of boulders) b.rock.position.copy(at(hx + b.ox, hy + b.oy, height(hx + b.ox, hy + b.oy) - 0.35 * b.s));
  }
  placeLighthouse();


  // --- the girl, in the boat's dots, on a dune --------------------------------------
  // (in a scene of her own, drawn each frame; the rest is drawn once)
  const girlScene = new THREE.Scene();
  const girlLights = makeLights(new THREE.Vector3(-0.6, 0.65, 0.45).normalize());
  girlScene.add(girlLights.hemi, girlLights.sun);
  tuneLights(girlLights, set);
  const { girl, head } = makeGirl(dotted());
  let GIRL_S = 1; // set where she's placed (frame)
  girl.rotation.y = 0.9; // facing out toward the sea, on the right
  girlScene.add(girl, sea);

  // --- the print (the hero's): what's drawn, one texel per dot, then printed ----------
  const layer = () =>
    new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthTexture: new THREE.DepthTexture(1, 1),
    });
  const still = layer(); // everything but the girl
  const live = layer(); // the girl
  const printMat = new THREE.ShaderMaterial({
    uniforms: {
      tStill: { value: still.texture },
      tStillDepth: { value: still.depthTexture },
      tLive: { value: live.texture },
      tLiveDepth: { value: live.depthTexture },
      uSize: { value: new THREE.Vector2(1, 1) },
      uDotPx: { value: 1 },
      uInk: { value: linear(INK) },
      uPaper: { value: linear(PAPER) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tStill;
      uniform sampler2D tStillDepth;
      uniform sampler2D tLive;
      uniform sampler2D tLiveDepth;
      uniform vec2 uSize;
      uniform float uDotPx;
      uniform vec3 uInk;
      uniform vec3 uPaper;
      float bayer2(vec2 a) { a = mod(floor(a), 2.0); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
      #define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
      float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
      // the live layer (the girl, the sea) where the still one is empty or farther
      vec4 texel(vec2 uv) {
        vec4 g = texture2D(tLive, uv);
        vec4 s = texture2D(tStill, uv);
        if (g.a > 0.1 && (s.a < 0.1 || texture2D(tLiveDepth, uv).r < texture2D(tStillDepth, uv).r)) return g;
        return s;
      }
      void main() {
        vec2 cell = floor(gl_FragCoord.xy / uDotPx);
        vec2 uv = (cell + 0.5) / uSize;
        vec4 t = texel(uv);
        // what each texel is, by its alpha: nothing (the page), colour (sand, sea,
        // the dress), the girl (dots), or the lighthouse and rocks (smooth)
        if (t.a < 0.1) { gl_FragColor = vec4(0.0); return; }
        if (t.a < 0.6) {
          gl_FragColor = vec4(t.rgb, 1.0);
          #include <colorspace_fragment>
          return;
        }
        float tone = pow(max(luma(t.rgb), 0.0), 1.0 / 2.2);
        // clay: outlined in ink where it meets anything else
        float rim = 1.0;
        rim = min(rim, texel(uv + vec2(1.0 / uSize.x, 0.0)).a);
        rim = min(rim, texel(uv - vec2(1.0 / uSize.x, 0.0)).a);
        rim = min(rim, texel(uv + vec2(0.0, 1.0 / uSize.y)).a);
        rim = min(rim, texel(uv - vec2(0.0, 1.0 / uSize.y)).a);
        if (rim < 0.83) {
          gl_FragColor = vec4(uInk, 1.0);
          #include <colorspace_fragment>
          return;
        }
        // the hero's tone (curve 1, contrast 0.9, brightness 0.09)
        tone = (tone - 0.5) * 0.9 + 0.5 + 0.09;
        vec3 c = t.rgb;
        float hi = max(max(c.r, c.g), c.b);
        float sat = hi > 1e-4 ? (hi - min(min(c.r, c.g), c.b)) / hi : 0.0;
        vec3 ink = mix(uInk, c / max(hi, 1e-4) * 0.45, smoothstep(0.25, 0.5, sat));
        // the girl in dots; the lighthouse and rocks in an even tone between ink and paper
        vec3 printed = t.a < 0.95 ? (tone > bayer8(cell) ? uPaper : ink) : mix(ink, uPaper, clamp(tone, 0.0, 1.0));
        gl_FragColor = vec4(printed, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const printScene = new THREE.Scene();
  const printCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), printMat);
  quad.frustumCulled = false;
  printScene.add(quad);

  // --- framing ----------------------------------------------------------------------
  let rig = RIGS.wide;
  const ray = new THREE.Raycaster();
  function frame(w, h) {
    const aspect = w / h;
    rig = aspect < 2.6 ? RIGS.narrow : RIGS.wide;
    // as wide as the study's view at least, and tall enough to keep the lighthouse's top
    // in; the foot stays put
    const tanV = Math.max(rig.tanH / aspect, (rig.top - rig.bottom) / 2);
    const tanH = tanV * aspect;
    const n = camera.near;
    camera.rotation.set(0, rig.yaw, 0);
    camera.aspect = aspect;
    camera.projectionMatrix.makePerspective(-tanH * n, tanH * n, (rig.bottom + 2 * tanV) * n, rig.bottom * n, n, camera.far);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    const [u, v] = rig === RIGS.wide ? [P.girlX, P.girlY] : [P.girlPhoneX, P.girlPhoneY];
    // where the ground is under her point; if it's over the skyline (a wider band frames a
    // little less sky), the nearest ground straight below it
    for (let dv = 0; dv < 0.4; dv += 0.004) {
      ray.setFromCamera(new THREE.Vector2(u * 2 - 1, 1 - (v + dv) * 2), camera);
      const hit = ray.intersectObject(ground, false)[0];
      if (hit) {
        girl.position.copy(hit.point);
        break;
      }
    }
    // as tall as she looks against the lighthouse (28 m, ground to rod tip): her height in
    // metres follows from how far off she stands
    const lift = (p, dy) => new THREE.Vector3(p.x, p.y + dy, p.z).project(camera).y;
    const looks = (lift(light.position, 28) - lift(light.position, 0)) * P.girlSize;
    const metres = looks / (lift(girl.position, 1) - lift(girl.position, 0));
    GIRL_S = metres / 0.69;
    girl.scale.setScalar(GIRL_S);
    sandMat.uniforms.uGirl.value.copy(girl.position);
    sandMat.uniforms.uGirlH.value = metres;
    // the top of the sand and sea across the frame (from the left, from the top), for the
    // page: below it the band takes clicks, above it the posts behind it stay clickable
    skyline = [];
    for (let k = 0; k <= 32; k++) {
      const across = k / 32;
      const dir = new THREE.Vector3(across * 2 - 1, 0, 0.5).unproject(camera).sub(camera.position);
      const len = Math.hypot(dir.x, dir.z);
      let top = 1;
      for (let d = 4; d < 800; d *= 1.06) {
        const x = (dir.x / len) * d;
        const y = (-dir.z / len) * d;
        top = Math.min(top, (1 - at(x, y, Math.max(0, height(x, y))).project(camera).y) / 2);
      }
      skyline.push([across, Math.max(0, top)]);
    }
  }
  let skyline = [];

  /** The settings that don't change the ground's shape, into the shaders. */
  function apply() {
    const shore = new THREE.Vector2(P.shoreNear, (P.shoreFar - P.shoreNear) / (125 - 38));
    const su = sandMat.uniforms;
    su.uShore.value.copy(shore);
    su.uWetWidth.value = P.wetWidth;
    su.uContour.value.set(P.contourSpacing, P.contourStrength);
    su.uStreaks.value = P.streaks;
    su.uDashes.value = P.dashes;
    su.uFog.value.set(P.fogNear, P.fogFar);
    const wu = seaMat.uniforms;
    wu.uShore.value.copy(shore);
    wu.uWater.value.set(P.waterOpacity, P.waterColour);
    wu.uSwell.value.set(P.swellSpacing, P.swellSpeed, P.swellStrength);
    wu.uGlints.value = P.glints;
    wu.uFoamSet.value.set(P.foamWidth, P.foamWash, P.foamSpeed, P.foamLine);
    camera.position.y = P.eye;
  }
  apply();

  let t = 0;
  function step(dt) {
    t += dt;
    seaMat.uniforms.uTime.value = t;
    girl.scale.set(GIRL_S, GIRL_S * (1 + Math.sin(t * 2.1) * 0.012), GIRL_S);
    girl.rotation.z = Math.sin(t * 0.7) * 0.03;
    const look = Math.max(0, Math.sin(t * 0.33)) ** 3;
    head.rotation.y = look * 1.5 + Math.sin(t * 0.9) * 0.05; // back round at the lighthouse
    head.rotation.x = -look * 0.08;
  }

  function resize() {
    // whole device pixels, drawn one for one (as the island's canvas, lighthouse.js)
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    const box = (canvas.parentElement ?? canvas).getBoundingClientRect();
    const dw = Math.max(1, Math.floor(box.width * pr));
    const dh = Math.max(1, Math.floor(box.height * pr));
    renderer.setPixelRatio(pr);
    renderer.setSize((dw + 0.5) / pr, (dh + 0.5) / pr, false);
    canvas.style.width = `${dw / pr}px`;
    canvas.style.height = `${dh / pr}px`;
    frame(dw, dh);
    const dot = Math.max(1, Math.round(set.dotSize * pr));
    const tw = Math.ceil(dw / dot);
    const th = Math.ceil(dh / dot);
    still.setSize(tw, th);
    live.setSize(tw, th);
    stillDue = true;
    printMat.uniforms.uSize.value.set(tw, th);
    printMat.uniforms.uDotPx.value = dot;
    sandMat.uniforms.uDotPx.value = 1; // in the target, a row is a dot
    seaMat.uniforms.uDotPx.value = 1;
  }

  let stillDue = true;
  function render() {
    if (stillDue) {
      renderer.setRenderTarget(still);
      renderer.clear();
      renderer.render(scene, camera);
      stillDue = false;
    }
    renderer.setRenderTarget(live);
    renderer.clear();
    renderer.render(girlScene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(printScene, printCam);
  }

  // the girl at the hero's phone pace (30 a second): the rest is still
  const clock = new THREE.Clock(false);
  let raf = 0;
  let acc = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    acc += clock.getDelta();
    if (acc < 1 / 30) return;
    step(Math.min(acc, 0.1));
    acc = 0;
    render();
  }

  resize();
  return {
    resize() {
      resize();
      render();
    },
    /** The sand and sea's top edge, as [from the left, from the top] points (0 to 1). */
    skyline: () => skyline,
    /** New settings (any of SHORE_DEFAULTS): the ground is built again if its shape changed. */
    tune(next) {
      const before = P;
      P = { ...P, ...next };
      if (SHAPE.some((k) => P[k] !== before[k])) {
        height = heightWith(P);
        shape(false);
        groundGeo.attributes.position.needsUpdate = true;
        groundGeo.computeVertexNormals();
        groundGeo.computeBoundingSphere();
        groundGeo.computeBoundingBox();
        placeLighthouse();
      }
      apply();
      resize();
      render();
    },
    start() {
      if (raf) return;
      clock.start();
      raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      clock.stop();
    },
    /** One frame (for reduced motion): standing, looking out to sea. */
    still() {
      t = 0;
      step(0);
      render();
    },
    dispose() {
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const mat of [o.material].flat()) mat?.dispose();
      });
      girlScene.traverse((o) => {
        o.geometry?.dispose();
        for (const mat of [o.material].flat()) mat?.dispose();
      });
      still.dispose();
      live.dispose();
      quad.geometry.dispose();
      printMat.dispose();
      renderer.dispose();
    },
  };
}

// In development, an edit here reloads the page, where it was (lib/dev-reload.ts): the
// scene on screen was built by the old code. (A no-op in builds.)
import.meta.turbopackHot?.dispose(reloadKeepingScroll);
