// The blog covers' pictures of the girl (components/blog/cover-spots.tsx), drawn in
// the landing's own 3D pieces and print: her boat and her (home/globe-scene/boat.js),
// with the hero's eye-shaped sail and logo (boat-scene/scene.js), in the hero's dot
// print. Rendered once here, at 1280 × 720 (two device pixels a dot), and saved as
// PNGs by scripts/render-covers.mjs; the blog shows the PNGs.
//
// The print is the landing's (boat.js makePrint) with one change for the covers'
// grey paper: things are white with ink dots and an ink outline as on the landing,
// her dress in colour, and the ground (sea, grass) prints only its ink, in a softer
// grey, its light parts left clear so the cover's paper shows through.
//
// renderCover(canvas, name) draws one picture into the canvas and frees the GPU.

import * as THREE from "three";
import { makeBoat, makeGirl, makeLights, materials, tuneLights } from "@/components/home/globe-scene/boat";

const INK = "#1C1917"; // stone-900
const SOFT = "#A8A29E"; // stone-400: the ground's dots
const PAPER = "#FFFDF8";
const CRIMSON = "#C01048"; // the search button's red: her dress
const DOT = 2; // device pixels a dot
const W = 1280;
const H = 720;
/** The landing's boat light and print (GLOBE_DEFAULTS in globe-scene/scene.js). */
const SET = { keyLight: 1.15, fillLight: 2.95, underside: 0.24, toneCurve: 1.15, contrast: 1.55, brightness: 0.16, girl: 1.85 };
/** A little less fill than the landing's, so her boat's sides take more dots. */
const COVER_LIGHT = { ...SET, fillLight: 2.1, underside: 0.12 };
const LIGHT = new THREE.Vector3(-0.55, 0.75, 0.62).normalize();

/** Her materials, as the landing's, but the dress opaque: the print knows it by its
 *  colour (the landing's half-alpha mark came out pink here). */
function girlMaterials() {
  const m = materials();
  return { ...m, dress: new THREE.MeshBasicMaterial({ color: CRIMSON }) };
}

/** Ground (sea, grass): unlit, its vertex colours its tone (1 clear, lower more
 *  dots), written at alpha 0.375, the print's mark for "ground". */
const ground = () =>
  new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.375, blending: THREE.NoBlending });

function makeCoverPrint() {
  const target = new THREE.WebGLRenderTarget(W / DOT, H / DOT, {
    type: THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: target.texture },
      uSize: { value: new THREE.Vector2(W / DOT, H / DOT) },
      uDotPx: { value: DOT },
      uInk: { value: new THREE.Color(INK) },
      uSoft: { value: new THREE.Color(SOFT) },
      uPaper: { value: new THREE.Color(PAPER) },
      uDress: { value: new THREE.Color(CRIMSON) },
      uCurve: { value: SET.toneCurve },
      uContrast: { value: SET.contrast },
      uBrightness: { value: SET.brightness },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform vec2 uSize;
      uniform float uDotPx;
      uniform vec3 uInk;
      uniform vec3 uSoft;
      uniform vec3 uPaper;
      uniform vec3 uDress;
      uniform float uCurve;
      uniform float uContrast;
      uniform float uBrightness;
      float bayer2(vec2 a) { a = mod(floor(a), 2.0); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
      #define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
      bool solid(vec2 at) { return texture2D(tScene, at).a >= 0.45; }
      void main() {
        vec2 cell = floor(gl_FragCoord.xy / uDotPx);
        vec2 at = (cell + 0.5) / uSize;
        vec4 texel = texture2D(tScene, at);
        if (texel.a < 0.25) discard;
        float tone = pow(max(dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0), uCurve / 2.2);
        tone = (tone - 0.5) * uContrast + 0.5 + uBrightness;
        bool ink = tone <= bayer8(cell);
        if (texel.a < 0.45) {
          // the ground: its ink only, softer, as many dots as its tone is dark; its
          // light is the cover's paper
          if (texel.r / texel.a >= bayer8(cell)) discard; // (written premultiplied by its mark)
          gl_FragColor = vec4(uSoft, 1.0);
        } else {
          vec2 dx = vec2(1.0 / uSize.x, 0.0);
          vec2 dy = vec2(0.0, 1.0 / uSize.y);
          if (!solid(at + dx) || !solid(at - dx) || !solid(at + dy) || !solid(at - dy)) {
            gl_FragColor = vec4(uInk, 1.0); // the outline, a dot wide
          } else if (texel.r > 0.25 && texel.g < 0.06 && texel.b < 0.2) {
            gl_FragColor = vec4(uDress, 1.0); // the dress, in colour
          } else {
            gl_FragColor = vec4(ink ? uInk : uPaper, 1.0);
          }
        }
        #include <colorspace_fragment>
      }
    `,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  return { target, scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), material };
}

/** A grid in x/z, its height and its brightness (1 white, lower more dots) from
 *  functions of x and z; it fades to white toward its edges. */
function terrain(width, depth, height, shade, fade) {
  const geo = new THREE.PlaneGeometry(width, depth, 220, 160);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, height(x, z));
    const edge = fade(x, z);
    const c = 1 - (1 - shade(x, z)) * edge;
    colors.set([c, c, c], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The hero's mast and eye-shaped sail with the PsychMind logo, still, on `hull`. */
function addSail(hull) {
  const m = materials();
  const mast = m.part(new THREE.CylinderGeometry(0.045, 0.055, 3.1, 8));
  mast.position.set(0, 1.75, 0.15);
  hull.add(mast);
  const pivot = new THREE.Group();
  pivot.position.set(0, 0.55, 0.15);
  pivot.rotation.y = Math.PI / 2 + 0.12;
  hull.add(pivot);
  const SAIL_H = 2.5;
  const SAIL_W = 0.95;
  const SU = 18;
  const SV = 12;
  const z = (u, v) => 0.8 * (1 - v * v) * Math.sin(Math.PI * u) * 0.35;
  const point = (u, v) => [v * SAIL_W * Math.pow(Math.sin(Math.PI * u), 0.85), u * SAIL_H, z(u, v)];
  const pos = [];
  const idx = [];
  for (let i = 0; i <= SU; i++) for (let j = 0; j <= SV; j++) pos.push(...point(i / SU, (j / SV) * 2 - 1));
  for (let i = 0; i < SU; i++)
    for (let j = 0; j < SV; j++) {
      const a = i * (SV + 1) + j;
      const b = a + SV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const sail = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: PAPER, side: THREE.DoubleSide }));
  pivot.add(sail);
  const LOGO_R = 0.42;
  for (const [r, x, y, color, off] of [
    [LOGO_R, 0, 0, INK, 0.03],
    [LOGO_R * 0.45, LOGO_R * 0.25, LOGO_R * 0.25, PAPER, 0.045],
    [LOGO_R, 0, 0, INK, -0.03],
    [LOGO_R * 0.45, -LOGO_R * 0.25, LOGO_R * 0.25, PAPER, -0.045],
  ]) {
    const disc = new THREE.CircleGeometry(r, 40).translate(x, y + SAIL_H * 0.5, 0);
    const p = disc.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getY(i) / SAIL_H;
      const v = p.getX(i) / (SAIL_W * Math.pow(Math.sin(Math.PI * u), 0.85));
      p.setZ(i, z(u, v) + off);
    }
    pivot.add(new THREE.Mesh(disc, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })));
  }
}

/** Her boat under sail on a quiet swell, heading off to the right. */
function boat(scene) {
  const { hull, girl: landingGirl } = makeBoat();
  hull.remove(landingGirl);
  const { girl } = makeGirl(girlMaterials());
  girl.position.copy(landingGirl.position);
  girl.scale.setScalar(SET.girl);
  hull.add(girl);
  addSail(hull);
  hull.rotation.y = Math.PI / 2 + 0.55;
  hull.rotation.z = 0.04;
  scene.add(hull);
  // the sea: faint streaks along the swell, a little deeper under her
  const sea = new THREE.Mesh(
    terrain(
      40,
      30,
      (x, z) => Math.sin(x * 1.1 + z * 0.5) * 0.05 + Math.sin(z * 1.9 - x * 0.6) * 0.035,
      (x, z) =>
        0.95 -
        0.16 * Math.max(0, Math.sin(z * 3.4 + Math.sin(x * 0.6) * 1.6)) ** 6 -
        0.22 * Math.exp(-((x - 0.8) ** 2 * 0.35 + (z + 0.2) ** 2 * 1.4)),
      (x, z) => 1 - smoothstep(3.5, 10, Math.hypot(x * 0.7, z * 1.5)),
    ),
    ground(),
  );
  sea.position.y = -0.02;
  scene.add(sea);
  const camera = new THREE.PerspectiveCamera(24, W / H, 0.1, 100);
  camera.position.set(0.54, 4.03, 13.6);
  camera.lookAt(0.3, 1.0, 0);
  return camera;
}

/** Where a path splits in two, and her standing there, seen from behind. */
function twoRoads(scene) {
  // the paths: one coming in, then two curving away, left and right
  const left = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(-1.2, 0, -3), new THREE.Vector3(-4.6, 0, -9), new THREE.Vector3(-6.5, 0, -16)]);
  const right = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(1.4, 0, -3.2), new THREE.Vector3(3.6, 0, -9.5), new THREE.Vector3(7.5, 0, -16)]);
  const points = [left, right].flatMap((curve) => curve.getSpacedPoints(80));
  /** How far (x, z) is from a path, in world units. */
  const near = (x, z) => {
    let d = z > 0.4 ? Math.abs(x) : Infinity; // the way in
    for (const p of points) d = Math.min(d, Math.hypot(x - p.x, z - p.z));
    return d;
  };
  const height = (x, z) => Math.sin(x * 0.35) * 0.25 + Math.cos(z * 0.3 + x * 0.2) * 0.2;
  // the land is built centred on z = -4 (local z + 4 is the world's)
  const OFF = -4;
  const geo = terrain(
    44,
    40,
    (x, z) => height(x, z + OFF),
    (x, z) => {
      const path = smoothstep(0.42, 0.7, near(x, z + OFF)); // 0 on a path, 1 on the grass
      return 1 - path * (0.13 + 0.04 * Math.sin(x * 2.3 + z * 1.7));
    },
    (x, z) => (1 - smoothstep(3, 13, Math.hypot(x * 0.8, z + OFF + 3))) * smoothstep(-1, 3, -(z + OFF) + 4),
  );
  geo.translate(0, 0, OFF);
  scene.add(new THREE.Mesh(geo, ground()));
  const { girl } = makeGirl(girlMaterials());
  girl.scale.setScalar(SET.girl);
  girl.rotation.y = Math.PI; // facing away, toward the two ways
  girl.position.set(0, height(0, 0.9), 0.9);
  scene.add(girl);
  const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  camera.position.set(0.24, 4.87, 11.5);
  camera.lookAt(0, -0.7, -0.4);
  return camera;
}

/** Her, standing quietly, a small rain cloud of her own over her head. */
function rainCloud(scene) {
  const m = materials();
  const land = new THREE.Mesh(
    terrain(
      24,
      18,
      () => 0,
      (x, z) => 0.93 - 0.3 * Math.exp(-(x * x * 1.6 + (z + 0.15) ** 2 * 3.2)) - 0.05 * Math.max(0, Math.sin(z * 3 + x * 0.4)) ** 4,
      (x, z) => 1 - smoothstep(1.5, 6, Math.hypot(x * 0.8, z * 1.4)),
    ),
    ground(),
  );
  scene.add(land);
  const { girl } = makeGirl(girlMaterials());
  girl.scale.setScalar(SET.girl);
  girl.rotation.y = -0.35;
  scene.add(girl);
  // the cloud: soft clay puffs, flat underneath, and its rain, falling only on her
  const cloud = new THREE.Group();
  for (const [x, y, z, r] of [
    [-0.42, 0, 0, 0.3],
    [-0.1, 0.12, 0.05, 0.38],
    [0.28, 0.06, 0, 0.32],
    [0.55, -0.04, -0.02, 0.22],
    [0.05, 0.02, -0.18, 0.3],
  ]) {
    const puff = m.part(new THREE.SphereGeometry(r, 24, 16));
    puff.position.set(x, y, z);
    puff.scale.y = 0.82;
    cloud.add(puff);
  }
  cloud.position.set(0.05, 2.05, 0);
  scene.add(cloud);
  const rain = m.solid(INK);
  for (const [x, z, y, len] of [
    [-0.4, 0.05, 1.55, 0.18],
    [-0.15, 0.12, 1.42, 0.2],
    [0.12, 0.08, 1.6, 0.16],
    [0.36, 0.02, 1.47, 0.18],
    [-0.28, 0.1, 1.15, 0.14],
    [0.25, 0.1, 1.2, 0.16],
  ]) {
    const drop = m.part(new THREE.CylinderGeometry(0.012, 0.012, len, 4), rain);
    drop.position.set(x, y, z);
    drop.rotation.z = 0.12;
    scene.add(drop);
  }
  const camera = new THREE.PerspectiveCamera(24, W / H, 0.1, 100);
  camera.position.set(0.25, 2.04, 8.6);
  camera.lookAt(0.05, 0.85, 0);
  return camera;
}

export const COVER_SCENES = { boat, "two-roads": twoRoads, "rain-cloud": rainCloud };

/** Draws `name` into `canvas` (1280 × 720) and frees the GPU; the pixels stay. */
export function renderCover(canvas, name) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  const scene = new THREE.Scene();
  const lights = makeLights(LIGHT);
  tuneLights(lights, COVER_LIGHT);
  scene.add(lights.hemi, lights.sun);
  const camera = COVER_SCENES[name](scene);
  const print = makeCoverPrint();
  renderer.setRenderTarget(print.target);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.clear();
  renderer.render(print.scene, print.camera);
  scene.traverse((o) => {
    o.geometry?.dispose();
    for (const m of [o.material].flat()) m?.dispose();
  });
  print.target.dispose();
  print.material.dispose();
  renderer.dispose();
}
