// The privacy promise's picture: the hero's boat and the girl on top of a planet
// of sea and islands.
//
// The sea is the hero's water (boat-scene/scene.js) wrapped round a ball: swells
// that run across it, shaded as the hero's are (the lit faces pale, the troughs
// deeper), with foam on the crests, glints, and the boat's wake. The swells shade
// the sea more than they lift it, so the planet stays round. The islands are made
// up (noise, drawn into a map of the planet) and ringed with surf: a white rim
// that laps at the coast and lines of foam rolling in to it, one after another.
//
// The planet is big and only its top is in the picture: its crown crosses the
// middle, where the boat sits, and the rest runs off the foot. She sits at twelve
// o'clock, always, riding the swell on springs (the hero's buoyancy), and the
// planet turns under her; a ring of open sea runs round it where she sails, so the
// islands pass by. A drag spins it.
//
// The boat is the hero's in its print, without its mast and sail: soft clay in
// 1-bit dots, the girl's dress the one thing in colour (the search button's red).
//
// Everything that sets the feel is in GLOBE_DEFAULTS, tuned live at /dev/globe.
//
// createGlobeScene(canvas, options) draws into the canvas; the caller sizes it
// (resize), runs it while it's on screen (start/stop), or shows one frame
// (still), changes its settings (tune), and frees the GPU (dispose).

import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { makeBoat, makeLights, makePrint, tuneLights } from "./boat";
import { reloadKeepingScroll } from "@/lib/dev-reload";

// The hero's water as it prints: a pale lavender grey (its colours, mostly given up)
const DEEP = "#AEB2C8";
const SHALLOW = "#D9DBE7";
const FOAM = "#F7F8FC";
const SKY = "#E7E9F2";
// The islands, in the page's warm greys (so the white surf stands out round them):
// lit on top, shaded on their slopes, darker where the surf wets them
const LAND = "#E7E5E4"; // stone-200
const LAND_SHADE = "#C9C5C2"; // between stone-300 and stone-400
const WET = "#A8A29E"; // stone-400

const LIGHT = new THREE.Vector3(-0.55, 0.75, 0.62).normalize();

/** The globe's feel: the boat's print, light, size and ride, then the planet, its
 *  islands, their surf and the waves. Tune them live at /dev/globe (local only),
 *  then carry the values over here. */
export const GLOBE_DEFAULTS = {
  // The boat's print (the hero's): CSS px per dot (rounded to whole device pixels,
  // or the pattern beats), and the tone spread across the dots
  dotSize: 1,
  toneCurve: 1.15,
  contrast: 1.55,
  brightness: 0.16,
  outline: 1, // her outline, in dots (0: none)
  dressColour: true, // the dress in colour pixels, or dotted like the rest of her
  // her clay lighting: a key light, a soft fill, and how light the fill is from below
  // (0: black, 1: as from above)
  keyLight: 1.15,
  fillLight: 2.95,
  underside: 0.24,
  size: 18, // css px per boat unit
  girl: 1.85, // the girl's size against the boat (larger than life, so she reads)
  // her ride: the springs pulling her onto the swell (the hero's buoyancy), and how
  // far she pitches and rolls with its slope
  buoyancy: 9,
  damping: 1.4,
  rocking: 0.35,

  // The planet: its radius against the picture's width (never more than the
  // picture's height), where her waterline crosses the picture (from the top), how
  // far her ring leans toward the viewer from the outline (radians), and how fast
  // the planet turns under her (radians a second)
  planetSize: 1.2,
  crown: 0.5,
  tilt: 0.66,
  spin: 0.025,
  // The islands: the waterline on the noise (lower, more land), how many fit round
  // the planet, how far their coasts wander, the open sea either side of her ring
  // (radians), and which islands (another number, another planet)
  landLevel: 0.635,
  islandScale: 3.7,
  coastWarp: 0.46,
  openSea: 0.2,
  landSeed: 13,
  // The surf: px between its lines, how far out they reach (px), how fast they roll
  // in, and the white rim's width at the coast (px)
  surfSpacing: 8.5,
  surfReach: 17,
  surfSpeed: 0.4,
  rim: 4.1,
  // The waves: how much of the swell's height the outline takes (the rest is only
  // shading) and how much of its slope the shading does; their length, steepness and
  // speed against the swell below; the sideways pinch; and the foam on the crests
  waveHeight: 0,
  waveShade: 0.8,
  waveLength: 1.55,
  steepness: 1.35,
  waveSpeed: 0,
  chop: 0.35,
  foam: 0.51,
};
/** The settings that redraw the islands' map. */
const LAND_KEYS = ["landLevel", "islandScale", "coastWarp", "openSea", "landSeed"];

// The swells, in the planet's own frame: a direction (each runs from one side of
// the planet to the other, along it), a wavenumber (per radius), a steepness and
// a speed. Long, gentle, mostly from one side, as in the hero; short against so
// big a planet, so its outline stays round. The settings scale them.
const WAVES = [
  [new THREE.Vector3(1, 0.25, 0.3).normalize(), 22, 0.26, 2.2],
  [new THREE.Vector3(0.7, -0.5, 0.6).normalize(), 34, 0.22, 2.7],
  [new THREE.Vector3(-0.3, 0.6, 1).normalize(), 47, 0.16, 3.2],
  [new THREE.Vector3(0.2, 1, -0.4).normalize(), 66, 0.1, 3.8],
];

// The same swell on the CPU, so the boat can ride it: height and slope at p (a unit vector).
function swell(waves, p, time, slope) {
  let h = 0;
  slope.set(0, 0, 0);
  for (const [d, k, steep, w] of waves) {
    const dp = d.dot(p);
    const env = Math.sqrt(Math.max(0, 1 - dp * dp)); // calm where the swell starts and ends (no bullseyes)
    const a = (steep / k) * env;
    const ph = k * dp - w * time;
    h += a * Math.sin(ph);
    slope.addScaledVector(d, a * k * Math.cos(ph));
  }
  // the slope along the surface: the gradient less its outward part
  slope.addScaledVector(p, -slope.dot(p));
  return h;
}

const WAVES_GLSL = /* glsl */ `
  uniform vec3 uDir[4];
  uniform vec3 uWave[4]; // wavenumber, steepness, speed
  uniform float uChop;
  // height, the slope along the surface (in slope) and the sideways pinch (in pinch)
  float swell(vec3 p, float time, out vec3 slope, out vec3 pinch) {
    float h = 0.0;
    slope = vec3(0.0);
    pinch = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      vec3 d = uDir[i];
      float dp = dot(d, p);
      float a = uWave[i].y / uWave[i].x * sqrt(max(0.0, 1.0 - dp * dp));
      float ph = uWave[i].x * dp - uWave[i].z * time;
      h += a * sin(ph);
      slope += d * a * uWave[i].x * cos(ph);
      pinch += (d - dp * p) * a * cos(ph) * uChop;
    }
    slope -= dot(slope, p) * p;
    return h;
  }
`;

const NOISE_GLSL = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x), mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x), mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`;

// The land's map: longitude round the planet's axis (the boat's ring is its equator)
// and latitude from it. It holds how far above the waterline each point is.
const LAND_GLSL = /* glsl */ `
  uniform sampler2D uLand;
  vec2 landUv(vec3 p) {
    return vec2(atan(p.x, p.z) / 6.2831853 + 0.5, asin(clamp(p.y, -1.0, 1.0)) / 3.1415927 + 0.5);
  }
`;

/**
 * Draw the planet into `canvas`. Call resize() once it has a size, then start()
 * (or still()).
 * @param {HTMLCanvasElement} canvas
 * @param {{ maxPixelRatio?: number, tune?: Partial<typeof GLOBE_DEFAULTS> }} [options]
 *   maxPixelRatio: the drawing resolution's cap. tune: settings over GLOBE_DEFAULTS.
 */
export function createGlobeScene(canvas, options = {}) {
  const RATIO_CAP = options.maxPixelRatio ?? 2;
  const set = { ...GLOBE_DEFAULTS, ...options.tune };
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, RATIO_CAP);
  const SMALL = canvas.clientWidth < 640;

  const scene = new THREE.Scene();
  // In CSS pixels: the planet is scaled to its radius in px, so sizes are set in px.
  // Layer 0 is the planet, drawn straight to the canvas; layer 1 the boat, printed in dots.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);
  camera.position.set(0, 0, 2000);

  // the boat's clay lighting (set in applySettings), so her forms read as tone in the
  // print (the sea and the land shade themselves)
  const lights = makeLights(LIGHT);
  const { hemi, sun } = lights;
  hemi.layers.set(1);
  sun.layers.set(1);
  scene.add(hemi, sun);

  // root: at the planet's centre, scaled to its radius; tilt: the boat's ring leans
  // toward the viewer a little (its top is twelve o'clock); spin: the planet, turning
  // on the ring's axis (local y), so its surface runs under the boat.
  const root = new THREE.Group();
  scene.add(root);
  const tilt = new THREE.Group(); // leant in applySettings; its local -z is the ring's top
  root.add(tilt);
  const spin = new THREE.Group();
  tilt.add(spin);

  const linear = (hex) => new THREE.Color(hex);
  // the swells as the settings scale them (see applySettings), for the GPU and the boat alike
  const waves = WAVES.map(([d]) => [d, 1, 0, 0]);
  const shared = {
    uTime: { value: 0 },
    uDir: { value: WAVES.map(([d]) => d) },
    uWave: { value: WAVES.map(() => new THREE.Vector3()) },
    uChop: { value: 0 },
    uLift: { value: 0 },
    uShade: { value: 0 },
    uLight: { value: LIGHT },
  };

  // --- The islands' map ------------------------------------------------------------------------------
  // First the land's height above the waterline (noise). Then how far each point of
  // sea is from the nearest land, by a jump flood: every texel keeps the nearest land
  // texel it has heard of, asking neighbours ever closer in, so the surf's lines can
  // run at even distances round each coast. The map holds both: height, distance.
  // It's drawn once; again only when the islands' settings change.

  const printCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = (material) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    mesh.frustumCulled = false;
    return mesh;
  };
  const LAND_W = SMALL ? 1024 : 2048;
  const mapTarget = (filter) =>
    new THREE.WebGLRenderTarget(LAND_W, LAND_W / 2, {
      type: THREE.HalfFloatType, // whole texel numbers up to 2048 are exact in it
      wrapS: THREE.RepeatWrapping,
      minFilter: filter,
      magFilter: filter,
      depthBuffer: false,
    });
  const landTarget = mapTarget(THREE.LinearFilter);
  const MAP_GLSL = /* glsl */ `
    uniform vec2 uSize; // the map, in texels
    // a texel's centre, as a point on the planet
    vec3 dirOf(vec2 texel) {
      float lon = ((texel.x + 0.5) / uSize.x - 0.5) * 6.2831853;
      float lat = ((texel.y + 0.5) / uSize.y - 0.5) * 3.1415927;
      return vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon));
    }
  `;
  const mapSize = { value: new THREE.Vector2(LAND_W, LAND_W / 2) };
  const landShape = {
    uLevel: { value: 0 },
    uScale: { value: 1 },
    uWarp: { value: 0 },
    uShore: { value: new THREE.Vector2() },
    uSeed: { value: new THREE.Vector3() },
  };

  // The map's working targets and passes.
  function mapWork() {
    const pass = (fragmentShader, uniforms = {}) =>
      quad(
        new THREE.ShaderMaterial({
          uniforms: { uSize: mapSize, ...uniforms },
          vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
          fragmentShader,
        }),
      );
    const height = mapTarget(THREE.NearestFilter);
    const seeds = [mapTarget(THREE.NearestFilter), mapTarget(THREE.NearestFilter)];
    const step = { uSeeds: { value: null }, uStep: { value: 1 } };
    const finish = { uHeight: { value: height.texture }, uSeeds: { value: null } };
    return {
      height,
      seeds,
      step,
      finish,
      targets: [height, ...seeds],
      // the land's height: made-up islands, noise warped a little so the coasts
      // wander, thinning out toward the open sea round the boat's ring (so its coasts
      // still follow the noise rather than the ring)
      shape: pass(
        /* glsl */ `
          ${MAP_GLSL}
          ${NOISE_GLSL}
          uniform float uLevel;
          uniform float uScale;
          uniform float uWarp;
          uniform vec2 uShore;
          uniform vec3 uSeed;
          float fbm(vec3 p) {
            float a = 0.5, s = 0.0;
            for (int i = 0; i < 3; i++) { s += a * noise3(p); p *= 2.03; a *= 0.5; }
            return s;
          }
          void main() {
            vec3 p = dirOf(floor(gl_FragCoord.xy));
            vec3 q = p + uWarp * (vec3(fbm(p * 2.0 + 7.0 + uSeed), fbm(p * 2.0 + 11.0 + uSeed), fbm(p * 2.0 + 3.0 + uSeed)) - 0.5);
            float f = fbm(q * uScale + vec3(2.1, 5.3, 1.7) + uSeed);
            float coast = uLevel + 0.5 * (1.0 - smoothstep(uShore.x, uShore.y, abs(p.y)));
            gl_FragColor = vec4(f - coast, 0.0, 0.0, 1.0);
          }
        `,
        landShape,
      ),
      // the flood's seeds: the land's texels (their own texel numbers), the rest none yet
      plant: pass(
        /* glsl */ `
          uniform sampler2D uHeight;
          void main() {
            vec2 me = floor(gl_FragCoord.xy);
            gl_FragColor = texelFetch(uHeight, ivec2(me), 0).r > 0.0 ? vec4(me, 1.0, 1.0) : vec4(0.0);
          }
        `,
        { uHeight: { value: height.texture } },
      ),
      flood: pass(
        /* glsl */ `
          ${MAP_GLSL}
          uniform sampler2D uSeeds;
          uniform float uStep;
          void main() {
            vec2 me = floor(gl_FragCoord.xy);
            vec3 p = dirOf(me);
            vec4 best = vec4(0.0);
            float bestD = 1e9;
            for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                vec2 q = me + vec2(float(i), float(j)) * uStep;
                if (q.y < 0.0 || q.y >= uSize.y) continue;
                q.x = mod(q.x, uSize.x); // round the planet
                vec4 s = texelFetch(uSeeds, ivec2(q), 0);
                if (s.z < 0.5) continue;
                float d = distance(p, dirOf(s.xy));
                if (d < bestD) { bestD = d; best = s; }
              }
            }
            gl_FragColor = best;
          }
        `,
        step,
      ),
      // the map: height, and radians to the nearest land (an arc, from the chord); far out to sea, "far"
      done: pass(
        /* glsl */ `
          ${MAP_GLSL}
          uniform sampler2D uHeight;
          uniform sampler2D uSeeds;
          void main() {
            vec2 me = floor(gl_FragCoord.xy);
            float h = texelFetch(uHeight, ivec2(me), 0).r;
            vec4 s = texelFetch(uSeeds, ivec2(me), 0);
            float d = h > 0.0 ? 0.0 : s.z > 0.5 ? 2.0 * asin(0.5 * distance(dirOf(me), dirOf(s.xy))) : 1.0;
            gl_FragColor = vec4(h, d, 0.0, 1.0);
          }
        `,
        finish,
      ),
    };
  }
  function freeWork(w) {
    for (const t of w.targets) t.dispose();
    for (const m of [w.shape, w.plant, w.flood, w.done]) {
      m.geometry.dispose();
      m.material.dispose();
    }
  }
  let work = null; // kept once the islands are being tuned, so a slider doesn't reallocate them
  function drawLand(keep) {
    const w = work ?? mapWork();
    const u = landShape;
    u.uLevel.value = set.landLevel;
    u.uScale.value = set.islandScale;
    u.uWarp.value = set.coastWarp;
    u.uShore.value.set(Math.sin(set.openSea), Math.sin(Math.min(set.openSea + 0.3, Math.PI / 2)));
    u.uSeed.value.set(1.73, 3.17, 2.31).multiplyScalar(set.landSeed);
    const run = (mesh, target) => {
      renderer.setRenderTarget(target);
      renderer.render(mesh, printCamera);
    };
    run(w.shape, w.height);
    let [a, b] = w.seeds;
    run(w.plant, a);
    // the surf reaches a few dozen px out, so the flood need only reach a little past that
    for (const k of [64, 32, 16, 8, 4, 2, 1, 1]) {
      w.step.uSeeds.value = a.texture;
      w.step.uStep.value = k;
      run(w.flood, b);
      [a, b] = [b, a];
    }
    w.finish.uSeeds.value = a.texture;
    run(w.done, landTarget);
    renderer.setRenderTarget(null);
    if (keep) work = w;
    else freeWork(w);
  }
  drawLand(false);

  // --- The sea and the islands --------------------------------------------------------------------

  const ball = (detail) => mergeVertices(new THREE.IcosahedronGeometry(1, detail).deleteAttribute("normal").deleteAttribute("uv"));
  const boatAt = new THREE.Vector3(); // the boat, from the centre (unit), and her heading and beam, in the picture's frame
  const boatFwd = new THREE.Vector3();
  const boatSide = new THREE.Vector3();
  const planetTurn = new THREE.Matrix3(); // the planet's frame to the picture's (set each frame)
  const SEA_VERTEX = /* glsl */ `
    uniform float uTime;
    uniform float uLift;
    uniform float uShade;
    ${WAVES_GLSL}
    ${LAND_GLSL}
    varying vec3 vN;
    varying vec3 vP;
    varying vec3 vLocal;
    varying float vH;
    void main() {
      vec3 p = normalize(position);
      // calm on the land
      float sea = 1.0 - smoothstep(-0.02, 0.01, texture2D(uLand, landUv(p)).r);
      vec3 slope, pinch;
      float h = swell(p, uTime, slope, pinch) * sea;
      vH = h;
      vLocal = p;
      vN = normalize(mat3(modelMatrix) * normalize(p - slope * sea * uShade));
      vP = normalize(mat3(modelMatrix) * p);
      vec3 lifted = p * (1.0 + h * uLift) + pinch * sea * uLift;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(lifted, 1.0);
    }
  `;
  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uHeight: { value: 1 },
      uFoamAmount: { value: 0 },
      uSurf: { value: new THREE.Vector4() },
      uDeep: { value: linear(DEEP) },
      uShallow: { value: linear(SHALLOW) },
      uFoam: { value: linear(FOAM) },
      uSky: { value: linear(SKY) },
      uLandLit: { value: linear(LAND) },
      uLandShade: { value: linear(LAND_SHADE) },
      uWet: { value: linear(WET) },
      uBoat: { value: boatAt },
      uFwd: { value: boatFwd },
      uSide: { value: boatSide },
      uLand: { value: landTarget.texture },
      uLandTexel: { value: new THREE.Vector2(1 / LAND_W, 2 / LAND_W) },
      uPlanet: { value: planetTurn },
      uRadiusPx: { value: 1 },
    },
    vertexShader: SEA_VERTEX,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uHeight;
      uniform float uFoamAmount;
      uniform vec4 uSurf; // px between the lines, their reach (px), their speed, the rim's width (px)
      uniform vec3 uLight;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform vec3 uSky;
      uniform vec3 uLandLit;
      uniform vec3 uLandShade;
      uniform vec3 uWet;
      uniform vec3 uBoat;
      uniform vec3 uFwd;
      uniform vec3 uSide;
      uniform vec2 uLandTexel;
      uniform mat3 uPlanet;
      uniform float uRadiusPx;
      varying vec3 vN;
      varying vec3 vP;
      varying vec3 vLocal;
      varying float vH;
      ${NOISE_GLSL}
      ${LAND_GLSL}
      void main() {
        vec3 p = normalize(vLocal);
        vec3 n = normalize(vN);

        // The map: the land's height, its slope (for the coast's edge and the islands'
        // relief), and how far out to sea this is from the nearest land.
        vec2 uv = landUv(p);
        vec4 map = texture2D(uLand, uv);
        float s = map.r;
        float cosLat = max(sqrt(1.0 - p.y * p.y), 0.05);
        vec2 du = vec2(uLandTexel.x, 0.0);
        vec2 dv = vec2(0.0, uLandTexel.y);
        vec2 grad = vec2(
          (texture2D(uLand, uv + du).r - texture2D(uLand, uv - du).r) / (2.0 * uLandTexel.x * 6.2831853 * cosLat),
          (texture2D(uLand, uv + dv).r - texture2D(uLand, uv - dv).r) / (2.0 * uLandTexel.y * 3.1415927));
        // px from the coast (out to sea positive): across it, the height over its slope,
        // smooth and exact at the edge; further out, the flood's distance
        float coast = -s / max(length(grad), 1e-3) * uRadiusPx;
        float aa = max(fwidth(coast), 1e-3);
        float offshore = map.g * uRadiusPx;

        // the sea, in the hero's shading: soft light across the swell, and the crests paler
        float lit = clamp(dot(n, uLight) * 0.5 + 0.5, 0.0, 1.0);
        float h = clamp(vH / uHeight * 0.5 + 0.5, 0.0, 1.0);
        float shade = mix(lit, h, 0.35);
        vec3 sea = mix(uDeep, uShallow, smoothstep(0.25, 0.85, shade));
        // foam breaking up along the crests
        float foam = smoothstep(0.75, 0.95, h) * smoothstep(0.45, 0.7, noise3(vLocal * 38.0 + vec3(0.0, uTime * 0.4, 0.0)));
        sea = mix(sea, uFoam, foam * uFoamAmount);
        // the boat's wake: a churned line behind her, and its two arms spreading out
        vec3 d = vP - uBoat;
        float back = -dot(d, uFwd);
        if (back > 0.0) {
          float across = abs(dot(d, uSide));
          float churn = noise3(vLocal * 60.0 + vec3(uTime * 0.6));
          float trail = smoothstep(0.02 + back * 0.08, 0.0, across);
          float arms = smoothstep(0.012 + back * 0.03, 0.0, abs(across - back * 0.36));
          float wake = (trail * 0.8 + arms * 0.6) * exp(-back * 5.5) * smoothstep(0.35, 0.6, churn + 0.2);
          sea = mix(sea, uFoam, clamp(wake, 0.0, 1.0));
        }
        // glints on the lit faces, blinking
        float glint = step(0.955, noise3(vLocal * vec3(70.0, 160.0, 160.0) + vec3(floor(uTime * 1.2) * 7.0))) * smoothstep(0.72, 0.9, lit);
        sea = mix(sea, vec3(1.0), glint * 0.7);

        // The surf: the shallows paler toward the coast, lines of foam rolling in to it
        // (brighter as they near it, then gone into the rim), and the rim, lapping.
        if (s < 0.0 && offshore < uSurf.y + 14.0) {
          sea = mix(sea, uFoam, 0.45 * exp(-offshore / 10.0));
          float phase = offshore / uSurf.x + uTime * uSurf.z;
          float line = 1.0 - smoothstep(0.09, 0.09 + fwidth(phase), abs(fract(phase + 0.5) - 0.5));
          float broken = 0.6 + 0.4 * smoothstep(0.3, 0.6, noise3(p * 46.0 + vec3(0.0, 0.0, uTime * 0.08)));
          line *= (1.0 - smoothstep(uSurf.y * 0.2, uSurf.y, offshore)) * smoothstep(uSurf.w + 0.6, uSurf.w + 4.6, offshore) * broken;
          sea = mix(sea, uFoam, line * 0.95);
          float lap = uSurf.w + 0.9 * sin(uTime * 1.4 + noise3(p * 18.0) * 6.2831853);
          sea = mix(sea, uFoam, 1.0 - smoothstep(lap - aa * 0.5, lap + aa * 0.5, coast));
        }

        // The islands: pale, shaded by their slopes (the map's slope as a bump), and
        // darker along the coast where the surf wets them.
        vec3 east = vec3(p.z, 0.0, -p.x) / cosLat;
        vec3 north = vec3(-p.y * p.x / cosLat, cosLat, -p.y * p.z / cosLat);
        vec3 bump = normalize(uPlanet * normalize(p - 0.12 * (east * grad.x + north * grad.y)));
        float litLand = clamp(dot(bump, uLight) * 0.5 + 0.5, 0.0, 1.0);
        vec3 land = mix(uLandShade, uLandLit, smoothstep(0.35, 0.8, litLand));
        land = mix(land, uWet, 0.8 * (1.0 - smoothstep(0.6, 2.2, -coast)));
        vec3 col = mix(sea, land, 1.0 - smoothstep(-aa * 0.5, aa * 0.5, coast));

        // the sky in the water, toward the outline
        float fres = pow(1.0 - max(n.z, 0.0), 2.0);
        col = mix(col, uSky, 0.4 * fres);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const seaGeometry = ball(SMALL ? 40 : 64);
  spin.add(new THREE.Mesh(seaGeometry, seaMat));
  // and the same surface in the boat's pass, depth only, so her hull sits in the water
  const seaDepth = new THREE.Mesh(
    seaGeometry,
    new THREE.ShaderMaterial({ uniforms: seaMat.uniforms, vertexShader: SEA_VERTEX, fragmentShader: "void main() { gl_FragColor = vec4(0.0); }", colorWrite: false }),
  );
  seaDepth.layers.set(1);
  seaDepth.renderOrder = -1; // first, or the boat's colour behind it would already be down
  spin.add(seaDepth);

  // --- The boat: the hero's in its print, without its mast and sail ------------------------------------

  // drawn into its dots, then printed over the picture (boat.js)
  const print = makePrint();
  const boat = new THREE.Group(); // sized to the planet (see resize)
  tilt.add(boat);
  const { hull, girl } = makeBoat(); // the hull rides the swell; the boat group only sits at twelve o'clock
  boat.add(hull);
  boat.traverse((o) => o.layers.set(1));

  // She sits at the ring's top (twelve o'clock), heading right: in the tilt's frame her
  // up is -z, her heading +x, her beam (up × heading) -y.
  const UP = new THREE.Vector3(0, 0, -1);
  const FWD = new THREE.Vector3(1, 0, 0);
  const SIDE = new THREE.Vector3().crossVectors(UP, FWD);
  boat.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(SIDE, UP, FWD));

  // --- Riding the swell ---------------------------------------------------------------------------------

  // Damped springs pull her onto the water's height and slope (the hero's buoyancy),
  // so she lags the swell and rocks a little after it.
  const ride = { y: 0, vy: 0, pitch: 0, vp: 0, roll: 0, vr: 0 };
  const here = new THREE.Vector3();
  const fwdHere = new THREE.Vector3();
  const sideHere = new THREE.Vector3();
  const slope = new THREE.Vector3();
  const Y = new THREE.Vector3(0, 1, 0);
  let t = 0;
  let fling = 0; // a drag's spin, dying away
  let dragging = false;

  function float(dt) {
    // where she is on the turning planet, in its own frame
    const a = -spin.rotation.y;
    here.copy(UP).applyAxisAngle(Y, a);
    fwdHere.copy(FWD).applyAxisAngle(Y, a);
    sideHere.copy(SIDE).applyAxisAngle(Y, a);
    const h = swell(waves, here, t, slope) * set.waveHeight;
    const pitch = -Math.atan(slope.dot(fwdHere) * set.rocking);
    const roll = Math.atan(slope.dot(sideHere) * set.rocking);
    const k = set.buoyancy;
    const c = set.damping;
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const s = dt / steps;
    for (let i = 0; i < steps; i++) {
      ride.vy += (k * (h - ride.y) - c * ride.vy) * s;
      ride.y += ride.vy * s;
      ride.vp += (k * (pitch - ride.pitch) - c * ride.vp) * s;
      ride.pitch += ride.vp * s;
      ride.vr += (k * (roll - ride.roll) - c * ride.vr) * s;
      ride.roll += ride.vr * s;
    }
    boat.position.copy(UP).multiplyScalar(1 + ride.y);
    hull.rotation.set(ride.pitch, 0, ride.roll);
  }

  function step(dt) {
    t += dt;
    if (!dragging) {
      spin.rotation.y += (set.spin + fling) * dt;
      fling *= Math.exp(-dt * 1.6);
    }
    float(dt);
  }

  // --- Framing ------------------------------------------------------------------------------------------

  let radius = 1;
  function resize() {
    const W = Math.max(1, canvas.clientWidth);
    const H = Math.max(1, canvas.clientHeight);
    const pr = pixelRatio();
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H, false);
    camera.left = -W / 2;
    camera.right = W / 2;
    camera.top = H / 2;
    camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
    // A planet wider than the picture, its crown where the boat sits (her waterline
    // across the picture at `crown`), the rest of it running off the foot.
    radius = Math.min(set.planetSize * W, H);
    root.scale.setScalar(radius);
    root.position.set(0, H / 2 - set.crown * H - Math.cos(set.tilt) * radius, 0);
    boat.scale.setScalar(set.size / radius);
    seaMat.uniforms.uRadiusPx.value = radius;
    print.resize(renderer, set.dotSize);
  }

  // The settings everything else takes straight away (the framing and the dots are
  // set in resize, the ride and the spin read as she sails, the islands drawn in drawLand).
  function applySettings() {
    print.tune(set);
    tuneLights(lights, set);
    girl.scale.setScalar(set.girl);
    // the ring's lean, and her place in the picture for the wake (the tilt only leans about x)
    tilt.rotation.x = Math.PI / 2 + set.tilt;
    const q = new THREE.Quaternion().setFromEuler(tilt.rotation);
    boatAt.copy(UP).applyQuaternion(q);
    boatFwd.copy(FWD).applyQuaternion(q);
    boatSide.copy(SIDE).applyQuaternion(q);
    // the swells, scaled
    WAVES.forEach(([, k, steep, w], i) => {
      waves[i][1] = k / set.waveLength;
      waves[i][2] = steep * set.steepness;
      waves[i][3] = w * set.waveSpeed;
      shared.uWave.value[i].set(waves[i][1], waves[i][2], waves[i][3]);
    });
    shared.uChop.value = set.chop;
    shared.uLift.value = set.waveHeight;
    shared.uShade.value = set.waveShade;
    const s = seaMat.uniforms;
    s.uHeight.value = Math.max(1e-4, waves.reduce((sum, [, k, steep]) => sum + steep / k, 0)); // the tallest the sea can stand
    s.uFoamAmount.value = set.foam;
    s.uSurf.value.set(set.surfSpacing, set.surfReach, set.surfSpeed, set.rim);
  }
  applySettings();

  function render() {
    shared.uTime.value = t;
    scene.updateMatrixWorld();
    planetTurn.setFromMatrix4(spin.matrixWorld);
    // the boat, into her dots
    camera.layers.set(1);
    renderer.setRenderTarget(print.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    // the planet, then the boat printed over it
    camera.layers.set(0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.render(print.scene, print.camera);
  }

  // --- Drag to spin -------------------------------------------------------------------------------------

  let lastX = 0;
  let lastT = 0;
  let onDemand = false; // stopped (off screen or still): draw only when dragged
  const onDown = (e) => {
    dragging = true;
    lastX = e.clientX;
    lastT = performance.now();
    fling = 0;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const now = performance.now();
    const da = -(e.clientX - lastX) / radius;
    spin.rotation.y += da;
    const dt = Math.max(1, now - lastT) / 1000;
    fling = 0.7 * fling + 0.3 * Math.max(-4, Math.min(4, da / dt - set.spin));
    lastX = e.clientX;
    lastT = now;
    if (onDemand) {
      float(0);
      render();
    }
  };
  const onUp = () => {
    dragging = false;
    if (onDemand) fling = 0;
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  // --- The loop -----------------------------------------------------------------------------------------

  const clock = new THREE.Clock(false);
  let raf = 0;
  let owed = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    owed += Math.min(clock.getDelta(), 0.1);
    const frame = SMALL ? 1 / 30 : 1 / 60; // 30 frames a second on phones
    if (owed < frame) return;
    step(owed);
    owed = 0;
    render();
  }

  return {
    /** Fit the canvas. Draws straight away: resizing clears it. */
    resize() {
      resize();
      render();
    },
    /** Turn and ride. Safe to call while already running. */
    start() {
      onDemand = false;
      if (raf) return;
      clock.start();
      owed = 0;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      clock.stop();
      onDemand = true;
    },
    /** Change the settings (see GLOBE_DEFAULTS) as she sails. */
    tune(next) {
      const islands = LAND_KEYS.some((k) => k in next && next[k] !== set[k]);
      Object.assign(set, next);
      if (islands) drawLand(true);
      applySettings();
      resize();
      render();
    },
    /** One still frame, a few seconds in, the boat settled on the swell (for reduced motion). */
    still() {
      this.stop();
      for (let k = 0; k < 120; k++) step(1 / 30);
      render();
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      print.dispose();
      scene.traverse((o) => {
          o.geometry?.dispose();
          for (const m of [o.material].flat()) m?.dispose();
        });
      if (work) freeWork(work);
      landTarget.dispose();
      renderer.dispose();
    },
  };
}

// In development, an edit here reloads the page, where it was (lib/dev-reload.ts): the
// scene on screen was built by the old code. (A no-op in builds.)
import.meta.turbopackHot?.dispose(reloadKeepingScroll);
