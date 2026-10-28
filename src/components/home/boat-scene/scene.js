// The boat at sea under the home hero, in place of the old painting.
//
// Ported from the three.js sandbox in animation/sandbox/boat (tune it there, with
// its panel, then carry the settings over). A paper boat with the PsychMind eye on
// its sail sails one heading forever; towers and whales come to meet it, and the
// weather passes in daytime spells: mist, a rain squall, mist, then sunshine. The
// boat, towers and girl are soft clay printed in 1-bit dots; the water stays in
// colour pixels, with the scene mirrored in it like Kingdom Two Crowns.
//
// The same wave function runs on the GPU (to draw the water) and on the CPU (so
// the boat can ride the surface on springs).
//
// createBoatScene(canvas, options) draws into the canvas; the caller sizes it
// (resize), runs it while it's on screen (start/stop) and frees the GPU (dispose).
// The hero passes no options. The footer takes its own camera, a sky that holds
// one spell (no rain), a start further along the voyage, and an edge that only
// dissolves along the top (see the options below).

import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { reloadKeepingScroll } from "@/lib/dev-reload";

// --- Settings (as tuned in the sandbox's panel) -----------------------------------------

const DEFAULTS = {
  wavelength: 1.0, // scales every wave's length
  waveSpeed: 0.55,
  desaturate: 0.94, // how much colour the water gives up
  boatSpeed: 2.0,
  buoyancy: 9.0, // spring stiffness pulling the boat onto the surface
  damping: 3.2,
  showRoute: false,
  lineWidth: 1.6, // ink line width, in pixels
  wobble: 1.0, // how much the lines boil, like a hand-drawn animation
  fogNear: 82,
  fogFar: 150,
  style: "dither", // "dither": soft clay shading printed in 1-bit dots; "line art": paper and ink
  palette: "mono", // "mono": ink on paper only; "colour ink": coloured things print in their own ink
  dotSize: 1, // screen pixels per dot (rounded to whole device pixels, so the dots never beat)
  waterPrint: "colour", // the water in the dither style: "colour" pixels (like Kingdom Two Crowns) or "dots"
  reflections: 0.7, // how strongly the scene mirrors in the water
  waterDeep: "#92ABDD", // the troughs and the far water
  waterShallow: "#CCE7F5", // the lit faces of the swell
  waterUnder: "#7263BB", // what shows through from below
  weatherTint: 0.65, // how much each weather spell recolours the water (0: your colours always)
  toneCurve: 1, // the scene is mostly pale; this spreads its light tones across the dots
  contrast: 0.9,
  brightness: 0.09,
  boatX: 0.36, // where the boat sits in the band, from the left (inside the cloud bank)
  boatY: 0.45, // and from the top: high enough to be seen above the fold
};

// Long, gentle swells, mostly from one direction.
const WAVES = [
  [1.0, 0.3, 0.2, 16.0],
  [0.8, 0.6, 0.16, 10.0],
  [1.0, -0.2, 0.12, 6.5],
  [0.5, 0.9, 0.07, 4.2],
];
const WIND = new THREE.Vector2(1.0, 0.3).normalize();

// Weather spells. Each sets the sky, the water, the light and the wind.
const WEATHER = {
  mist: {
    skyTop: "#F6F3EA", skyBottom: "#B9D3EE", fog: "#DCE8F4",
    deep: "#8FAEDF", shallow: "#CDE3F6", foam: "#FFFFFF", under: "#6F86C4", cloud: "#FFFFFF", whale: "#5C76B0",
    light: 2.2, sun: 1.2, waves: 0.22, streaks: 0.35, reflection: 0.1, rain: 0, opacity: 0.62, wind: 0.8, sparkle: 0.55,
  },
  squall: {
    skyTop: "#CBD4DD", skyBottom: "#8E9FB0", fog: "#AEB9C4",
    deep: "#7F97A6", shallow: "#AFC3CC", foam: "#F4F7FA", under: "#5E7483", cloud: "#E6ECF1", whale: "#5F7888",
    light: 1.45, sun: 0.55, waves: 0.5, streaks: 0.08, reflection: 0.35, rain: 1, opacity: 0.7, wind: 1.5, sparkle: 0.2,
  },
  sunny: {
    skyTop: "#FBF7EC", skyBottom: "#AFD3F2", fog: "#E1ECF7",
    deep: "#86B1E4", shallow: "#D0E8F8", foam: "#FFFFFF", under: "#6A8FC8", cloud: "#FFFFFF", whale: "#557BB5",
    light: 2.4, sun: 1.4, waves: 0.18, streaks: 0.4, reflection: 0.12, rain: 0, opacity: 0.62, wind: 0.7, sparkle: 0.75,
  },
};
// Where on the journey each spell holds; between two keys it blends. It ends where
// it starts, so going round again is seamless. All of it is daytime.
const WEATHER_KEYS = [
  [0.0, "mist"],
  [0.17, "mist"],
  [0.24, "squall"],
  [0.36, "squall"],
  [0.44, "mist"],
  [0.56, "mist"],
  [0.64, "sunny"],
  [0.86, "sunny"],
  [0.94, "mist"],
  [1.0, "mist"],
];

const INK = "#1C1917";
const PAPER = "#FFFDF8";
const CRIMSON = "#C01048";
const GLOW = "#FFD58E";

/**
 * Draw the voyage into `canvas`. Call resize() once it has a size, then start().
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   view?: { polar: number, azimuth: number, zoom: number },
 *   weather?: "mist" | "sunny",
 *   startAt?: number,
 *   edge?: "cloud" | "top" | "none",
 *   boatX?: number,
 *   boatY?: number,
 *   maxPixelRatio?: number,
 * }} [options]
 *   view: the camera's direction (degrees: polar from straight down, azimuth about
 *   the vertical) and zoom, framed to the canvas's height instead of the hero's
 *   fixed scale. weather: hold one spell for good. startAt: where on the voyage
 *   to begin (0..1). edge: "cloud", the hero's ring of cloud, "top", cloud
 *   along the top only, or "none", the scene to the canvas's edges. boatX, boatY:
 *   where the boat sits in the frame.
 *   maxPixelRatio: the drawing resolution's cap (2 by default).
 */
export function createBoatScene(canvas, options = {}) {
  const params = {
    ...DEFAULTS,
    ...(options.boatX !== undefined && { boatX: options.boatX }),
    ...(options.boatY !== undefined && { boatY: options.boatY }),
  };
  const RATIO_CAP = options.maxPixelRatio ?? 2;

  // --- Renderer, scene, camera ----------------------------------------------------------

  // No antialiasing: everything is drawn into small targets and printed in whole pixels.
  // See-through, so the page shows past the cloud bank around the scene.
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 1); // the targets clear opaque, as in the sandbox (the water's alpha mark needs it)
  // Phones get a lighter build: fewer pixels, a coarser water grid and 24 frames a
  // second. None of it shows at that size. (The grid is fixed at creation; the rest
  // follows the band's width.)
  const isSmall = () => canvas.clientWidth < 768;
  const SMALL = isSmall();
  // The drawing resolution: the screen's pixel ratio divided by a whole number, at
  // most 2× (1.5× on phones). Each canvas pixel then covers a whole number of screen
  // pixels; a flat 1.5 cap put 1.33 under each on 2× phones, and the dots banded.
  const pixelRatio = () => {
    const dpr = window.devicePixelRatio || 1;
    return dpr / Math.ceil(dpr / (isSmall() ? Math.min(1.5, RATIO_CAP) : RATIO_CAP));
  };
  renderer.setPixelRatio(pixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, params.fogNear, params.fogFar);

  const VIEW = 17; // world units visible vertically at zoom 1
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  const CAM_DIST = 90;
  // The view and zoom copied from the sandbox as it was framed by hand.
  const view = options.view ?? { polar: 63.2, azimuth: -62.2, zoom: 0.54 };
  const camDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(view.polar), THREE.MathUtils.degToRad(view.azimuth));
  // The hero keeps the sandbox window's scale (1150px tall when it was framed) in
  // any band; a view of its own is framed to the canvas instead, to the sandbox's
  // 2.5:1 frame. A narrower canvas (a phone) pulls back only part of the way, so
  // it crops the sides a little rather than shrinking the boat to fit them.
  const FRAMED_HEIGHT = options.view ? 0 : 1150;
  const FRAMED_ASPECT = 2.5;
  let baseZoom = view.zoom;
  let storyZoom = 1; // the story zooms in from the framed view, and back out
  camera.position.copy(camDir).multiplyScalar(CAM_DIST);
  camera.lookAt(0, 0, 0);

  // --- Dither print --------------------------------------------------------------------------------
  // The scene is rendered small, one texel per dot, then printed with an 8×8 ordered
  // (Bayer) threshold: every dot is either ink or paper, and the tone lives in how
  // many of them are ink, like the halftone character in the reference. A dot is a
  // whole number of device pixels, or the pattern beats into bands on scaled displays.
  // The water marks itself with zero alpha, so it can print as colour pixels instead.

  const ditherTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const ditherMat = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: ditherTarget.texture },
      uSize: { value: new THREE.Vector2(1, 1) },
      uInk: { value: new THREE.Color(INK) },
      uPaper: { value: new THREE.Color(PAPER) },
      uColourInk: { value: 0 },
      uCurve: { value: 1 },
      uContrast: { value: 1 },
      uBrightness: { value: 0 },
      uDotPx: { value: 1 },
      uWaterColour: { value: 1 },
      uTime: { value: 0 },
      uEdgeTop: { value: options.edge === "top" ? 1 : options.edge === "none" ? 2 : 0 },
    },
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tScene;
      uniform vec2 uSize;
      uniform vec3 uInk;
      uniform vec3 uPaper;
      uniform float uColourInk;
      uniform float uCurve;
      uniform float uContrast;
      uniform float uBrightness;
      uniform float uDotPx;
      uniform float uWaterColour;
      uniform float uTime;
      uniform float uEdgeTop;
      // mod first: a.y * a.y on a whole-screen row number runs out of float precision
      float bayer2(vec2 a) { a = mod(floor(a), 2.0); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
      #define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
      // sin-free, and wrapped, so it holds up tens of thousands of units out to sea
      // (a sin() hash goes flat there: GPUs lose sin's precision on large arguments)
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

      // The scene sits in an ellipse whose rim is a bank of cloud: round puffs that
      // drift slowly, dissolving into the page in the same dots as the print.
      float cloudMask(vec2 cell) {
        if (uEdgeTop > 1.5) return 1.0; // no rim: the scene runs to the canvas's edges (the contact page's panel)
        vec2 p = ((cell + 0.5) / uSize - 0.5) * 2.0; // -1..1 across the band
        if (uEdgeTop > 0.5) {
          // the footer's band runs to the page's sides and foot: only its top
          // dissolves, the same puffs drifting along a level line
          float y = p.y * 0.5 + 0.5; // 0 at the foot, 1 at the top
          if (y < 0.4) return 1.0;
          vec2 q = vec2(p.x * uSize.x / uSize.y, p.y);
          float puffs = fbm(q * 1.7 + vec2(uTime * 0.02, -uTime * 0.008));
          float curls = fbm(q * 4.5 - vec2(uTime * 0.035, 0.0));
          float d = y + (puffs - 0.5) * 0.34 + (curls - 0.5) * 0.12;
          return 1.0 - smoothstep(0.62, 0.92, d);
        }
        float r = length(p);
        if (r < 0.27) return 1.0; // the noise can't reach this far in
        if (r > 1.25) return 0.0; // or this far out
        vec2 q = vec2(p.x * uSize.x / uSize.y, p.y); // square, so the puffs come out round
        float puffs = fbm(q * 1.7 + vec2(uTime * 0.02, -uTime * 0.008));
        float curls = fbm(q * 4.5 - vec2(uTime * 0.035, 0.0));
        float d = r + (puffs - 0.5) * 0.5 + (curls - 0.5) * 0.16;
        return 1.0 - smoothstep(0.6, 0.92, d);
      }

      void main() {
        vec2 cell = floor(gl_FragCoord.xy / uDotPx);
        // past the cloud bank this dot is page, not scene (the canvas is see-through)
        if (cloudMask(cell) <= bayer8(cell + 3.0)) {
          gl_FragColor = vec4(0.0);
          return;
        }
        vec4 texel = texture2D(tScene, (cell + 0.5) / uSize);
        vec3 c = texel.rgb;
        if (uWaterColour > 0.5 && texel.a < 0.5) {
          gl_FragColor = vec4(c, 1.0); // water: a colour pixel
          #include <colorspace_fragment>
          return;
        }
        float tone = pow(max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0), uCurve / 2.2);
        tone = (tone - 0.5) * uContrast + 0.5 + uBrightness;
        // coloured things can print in their own ink (like the teal globe in the reference)
        float hi = max(max(c.r, c.g), c.b);
        float sat = hi > 1e-4 ? (hi - min(min(c.r, c.g), c.b)) / hi : 0.0;
        vec3 ink = mix(uInk, c / max(hi, 1e-4) * 0.45, smoothstep(0.08, 0.35, sat) * uColourInk);
        gl_FragColor = vec4(tone > bayer8(cell) ? uPaper : ink, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const printScene = new THREE.Scene();
  const printCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const printQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ditherMat);
  printQuad.frustumCulled = false;
  printScene.add(printQuad);
  const dithering = () => params.style === "dither";
  // the scene upside down, for the water to mirror (drawn every frame, see renderReflection)
  const DOT_BUDGET = 2.4e6; // most dots a pass draws; a 1440-wide band at 125% is 1.5 million
  let reflDue = true; // the mirror image is redrawn every other frame, and straight after a resize
  const reflTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  // pixel height of whatever the scene is drawn into (for things sized in pixels)
  const drawHeight = () => (dithering() ? ditherTarget.height : renderer.domElement.height);

  const lineMaterials = [];
  function resize() {
    const W = Math.max(1, canvas.clientWidth);
    const H = Math.max(1, canvas.clientHeight);
    const a = W / H;
    baseZoom = FRAMED_HEIGHT
      ? (view.zoom * FRAMED_HEIGHT) / H // same world per pixel as when it was framed
      : view.zoom * Math.sqrt(Math.min(1, a / FRAMED_ASPECT));
    camera.zoom = baseZoom * storyZoom;
    camera.left = (-VIEW * a) / 2;
    camera.right = (VIEW * a) / 2;
    camera.top = VIEW / 2;
    camera.bottom = -VIEW / 2;
    // Shift the frame so the boat (the orbit target, at the middle of the full view)
    // lands at boatX, boatY on screen. The offset scales with zoom, so it holds there.
    camera.setViewOffset(W, H, W * (0.5 - params.boatX), H * (0.5 - params.boatY), W, H);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio()); // browser zoom changes it
    renderer.setSize(W, H, false);
    const cw = renderer.domElement.width; // device pixels
    const ch = renderer.domElement.height;
    const dotPx = Math.max(1, Math.round(params.dotSize * renderer.getPixelRatio()), Math.ceil(Math.sqrt((cw * ch) / DOT_BUDGET)));
    const dw = Math.ceil(cw / dotPx);
    const dh = Math.ceil(ch / dotPx);
    ditherTarget.setSize(dw, dh);
    reflDue = true;
    ditherMat.uniforms.uSize.value.set(dw, dh);
    ditherMat.uniforms.uDotPx.value = dotPx;
    for (const m of lineMaterials) {
      if (dithering()) m.resolution.set(dw, dh);
      else m.resolution.set(W, H);
    }
    const u = waterMat.uniforms;
    if (dithering()) {
      reflTarget.setSize(Math.ceil(dw / 2), Math.ceil(dh / 2)); // half size: it sways, so nobody can tell
      u.uRes.value.set(dw, dh);
      u.uDotPx.value = 1; // one fragment is one dot
    } else {
      reflTarget.setSize(Math.ceil(cw / 2), Math.ceil(ch / 2));
      u.uRes.value.set(cw, ch);
      u.uDotPx.value = Math.max(1, Math.round(2 * renderer.getPixelRatio()));
    }
  }

  // Sky: a vertical gradient behind everything, redrawn as the weather turns.
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 2;
  skyCanvas.height = 256;
  const skyTexture = new THREE.CanvasTexture(skyCanvas);
  skyTexture.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTexture;

  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 2.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(30, 50, 20);
  scene.add(sun);
  scene.add(sun.target);
  const SUN_DIR = new THREE.Vector3(30, 50, 20).normalize();

  // --- Underwater fade, shared by every fill ------------------------------------------------
  // Below the surface, colours sink into the water's own colour with depth.

  const under = {
    uUnderColor: { value: new THREE.Color() },
    uWaterLevel: { value: -0.05 },
    uUnderDepth: { value: 4.0 },
  };

  function submerge(material) {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, under);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorldU;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWorldU = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWorldU;\nuniform vec3 uUnderColor;\nuniform float uWaterLevel;\nuniform float uUnderDepth;")
        .replace(
          "#include <tonemapping_fragment>",
          `{
            float below = uWaterLevel - vWorldU.y;
            float sink = below > 0.0 ? 0.3 + 0.68 * smoothstep(0.0, 1.0, below / uUnderDepth) : 0.0;
            gl_FragColor.rgb = mix(gl_FragColor.rgb, uUnderColor, sink);
          }
          #include <tonemapping_fragment>`,
        );
    };
    return material;
  }

  // --- Line art ---------------------------------------------------------------------------------
  // Each drawn shape is a paper fill with two kinds of ink: a silhouette (a slightly
  // fattened copy of the shape, drawn inside out in ink) and its creases (the
  // edges where faces fold). The crease lines overshoot a little at the ends and
  // get redrawn a few times a second with a small jitter, so they boil like a
  // hand-drawn animation.

  const paperRamp = (() => {
    const data = new Uint8Array([228, 255]);
    const t = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  })();
  // Every paper fill is a toon material for the line art; the dither style swaps in
  // a smooth clay twin of each (see "Style" below).
  const toonMats = [];
  function toon(opts) {
    const m = new THREE.MeshToonMaterial({ gradientMap: paperRamp, ...opts });
    toonMats.push(m);
    return submerge(m);
  }
  const fill = (color = PAPER) => toon({ color });
  const solid = (color) => submerge(new THREE.MeshBasicMaterial({ color, fog: true }));
  const PAPER_FILL = fill();

  const outline = { uOutline: { value: 0.03 } };
  const outlineMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, fog: true });
  outlineMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, outline);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uOutline;")
      .replace("#include <begin_vertex>", "vec3 transformed = position + normalize(normal) * uOutline;");
  };

  function inkMaterial(extra = {}, widthFactor = 1) {
    const m = new LineMaterial({ color: INK, linewidth: params.lineWidth * widthFactor, fog: true, ...extra });
    m.resolution.set(1, 1); // set by resize()
    m.userData.widthFactor = widthFactor;
    lineMaterials.push(m);
    return m;
  }
  const INK_LINE = inkMaterial();

  const sketchy = []; // { geo, base } crease lines that boil
  const inkOnly = []; // outlines and creases: drawn in the line art, gone in the dither print

  // Stretch each segment a touch past its ends, the way a pen overshoots a corner.
  function overshoot(pos, amount = 0.06) {
    const out = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 6) {
      const dx = pos[i + 3] - pos[i];
      const dy = pos[i + 4] - pos[i + 1];
      const dz = pos[i + 5] - pos[i + 2];
      const len = Math.hypot(dx, dy, dz) || 1;
      const e = Math.min(amount, len * 0.12) / len;
      out[i] = pos[i] - dx * e;
      out[i + 1] = pos[i + 1] - dy * e;
      out[i + 2] = pos[i + 2] - dz * e;
      out[i + 3] = pos[i + 3] + dx * e;
      out[i + 4] = pos[i + 4] + dy * e;
      out[i + 5] = pos[i + 5] + dz * e;
    }
    return out;
  }

  function creases(geometry, parent, crease = 30) {
    const edges = new THREE.EdgesGeometry(geometry, crease);
    const base = overshoot(edges.attributes.position.array);
    if (!base.length) return null;
    const geo = new LineSegmentsGeometry();
    geo.setPositions(base.slice()); // a copy: setPositions keeps the array it is given, and the wobble rewrites it
    const lines = new LineSegments2(geo, INK_LINE);
    parent.add(lines);
    sketchy.push({ geo, base, jitter: 0.016 });
    inkOnly.push(lines);
    return lines;
  }

  // Draw a mesh as line art: paper fill, ink silhouette, ink creases.
  function drawn(geometry, { material = PAPER_FILL, crease = 30, silhouette = true } = {}) {
    const mesh = new THREE.Mesh(geometry, material);
    creases(geometry, mesh, crease);
    if (silhouette) {
      const g = mergeVertices(geometry.clone().deleteAttribute("normal").deleteAttribute("uv"));
      g.computeVertexNormals();
      const shell = new THREE.Mesh(g, outlineMat);
      mesh.add(shell);
      inkOnly.push(shell);
    }
    return mesh;
  }

  function redrawLines(t) {
    // a new "drawing" every eighth of a second, the same one for the same moment
    const frame = Math.floor(t * 8);
    let seed = frame * 9301 + 49297;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) - 0.5;
    for (const s of sketchy) {
      const arr = s.geo.attributes.instanceStart.data.array;
      const j = s.jitter * params.wobble;
      for (let i = 0; i < arr.length; i++) arr[i] = s.base[i] + rnd() * j;
      s.geo.attributes.instanceStart.data.needsUpdate = true;
    }
  }

  // A polyline that can be rewritten in place every frame (sail edge, birds).
  function liveLine(points, material = INK_LINE) {
    const geo = new LineGeometry();
    geo.setPositions(points.flat());
    const line = new Line2(geo, material);
    line.frustumCulled = false;
    return line;
  }
  function rewriteLine(line, points) {
    const arr = line.geometry.attributes.instanceStart.data.array;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      arr.set([a[0], a[1], a[2], b[0], b[1], b[2]], i * 6);
    }
    line.geometry.attributes.instanceStart.data.needsUpdate = true;
  }

  // --- Waves (shared by the GPU and the CPU) --------------------------------------------------

  const waveUniform = WAVES.map(() => new THREE.Vector4());
  let heightScale = 1;
  let waveHeight = 0.22; // set by the weather

  // per-wave constants for heightAt(), worked out once per moment (see prepWaves)
  const waveK = new Float64Array(WAVES.length * 6);
  let waveKTime = NaN;

  function updateWaves() {
    heightScale = 0;
    WAVES.forEach(([dx, dz, steep, len], i) => {
      const d = new THREE.Vector2(dx, dz).normalize();
      waveUniform[i].set(d.x, d.y, steep * waveHeight, len * params.wavelength);
      heightScale += (steep * waveHeight) / ((2 * Math.PI) / (len * params.wavelength));
    });
    heightScale = Math.max(heightScale, 0.001);
    waveKTime = NaN;
  }
  updateWaves();

  const CHOP = 0.35; // a little sideways pinch keeps the swell from looking like a sine sheet

  // Per wave, for the moment t: direction × k, phase, height, and the sideways pinch.
  // The boat and the spray ask for heights hundreds of times a frame, so this is
  // worked out once per moment and nothing is allocated per call.
  function prepWaves(t) {
    if (t === waveKTime) return;
    waveKTime = t;
    waveUniform.forEach((w, i) => {
      const k = (2 * Math.PI) / w.w;
      const a = w.z / k;
      waveK[i * 6] = w.x * k;
      waveK[i * 6 + 1] = w.y * k;
      waveK[i * 6 + 2] = k * Math.sqrt(9.8 / k) * params.waveSpeed * t;
      waveK[i * 6 + 3] = a;
      waveK[i * 6 + 4] = w.x * a * CHOP;
      waveK[i * 6 + 5] = w.y * a * CHOP;
    });
  }

  // Water height at a world (x, z): undo the sideways shift by fixed-point iteration.
  function heightAt(x, z, t) {
    prepWaves(t);
    let px = x;
    let pz = z;
    for (let it = 0; it < 3; it++) {
      let dx = 0;
      let dz = 0;
      for (let i = 0; i < waveK.length; i += 6) {
        const c = Math.cos(waveK[i] * px + waveK[i + 1] * pz - waveK[i + 2]);
        dx += waveK[i + 4] * c;
        dz += waveK[i + 5] * c;
      }
      px = x - dx;
      pz = z - dz;
    }
    let dy = 0;
    for (let i = 0; i < waveK.length; i += 6) dy += waveK[i + 3] * Math.sin(waveK[i] * px + waveK[i + 1] * pz - waveK[i + 2]);
    return dy;
  }

  // The same displacement on the GPU, for the foam that rides the water (wake, rings).
  const WAVE_GLSL = /* glsl */ `
    uniform vec4 uWaves[4];
    uniform float uSpeed;
    uniform float uChop;
    uniform float uWaveTime;
    vec3 waveDisp(vec2 p) {
      vec3 d = vec3(0.0);
      for (int i = 0; i < 4; i++) {
        vec4 w = uWaves[i];
        float k = 6.2831853 / w.w;
        float f = k * (dot(w.xy, p) - sqrt(9.8 / k) * uSpeed * uWaveTime);
        float a = w.z / k;
        d += vec3(w.x * a * cos(f) * uChop, a * sin(f), w.y * a * cos(f) * uChop);
      }
      return d;
    }
  `;

  // --- Water: smooth and painted ---------------------------------------------------------------

  const WATER_SIZE = 150;
  const WATER_SEG = SMALL ? 100 : 200; // a quarter of the triangles on phones
  const waterGeo = new THREE.PlaneGeometry(WATER_SIZE, WATER_SIZE, WATER_SEG, WATER_SEG);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    // colour blends as usual, but the water zeroes the alpha it covers: the dither print reads that as "water"
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.ZeroFactor,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        uTime: { value: 0 },
        uWaves: { value: waveUniform },
        uSpeed: { value: params.waveSpeed },
        uChop: { value: CHOP },
        uHeightScale: { value: 1 },
        uDeep: { value: new THREE.Color() },
        uShallow: { value: new THREE.Color() },
        uFoam: { value: new THREE.Color() },
        uSkyTop: { value: new THREE.Color() },
        uSkyBottom: { value: new THREE.Color() },
        uCloud: { value: new THREE.Color() },
        uSunDir: { value: SUN_DIR.clone() },
        uPrint: { value: 0 }, // 1 in the dither style: the swell's light and shade get pushed apart
        uViewDir: { value: new THREE.Vector3() },
        uWind: { value: WIND.clone() },
        uStreaks: { value: 0 },
        uReflect: { value: 0 },
        uRain: { value: 0 },
        uOpacity: { value: 0.62 },
        uDesat: { value: params.desaturate },
        uReflTex: { value: null }, // set below: mergeUniforms can't clone a render target's texture
        uRes: { value: new THREE.Vector2(1, 1) }, // size of what the water is drawn into
        uDotPx: { value: 1 }, // pixels per row of the sway and the glints
        uMirror: { value: params.reflections },
        uSparkle: { value: 0 },
        uCamRight: { value: new THREE.Vector2(1, 0) }, // screen right and up, laid on the water
        uCamFwd: { value: new THREE.Vector2(0, 1) },
        uRowWorld: { value: 0.05 }, // how much water one row of pixels covers, front to back
      },
    ]),
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec4 uWaves[4];
      uniform float uSpeed;
      uniform float uChop;
      varying vec3 vN;
      varying vec2 vBase;
      varying float vH;
      #include <fog_pars_vertex>
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vec2 p = world.xz;
        vec3 disp = vec3(0.0);
        vec3 tx = vec3(1.0, 0.0, 0.0);
        vec3 tz = vec3(0.0, 0.0, 1.0);
        for (int i = 0; i < 4; i++) {
          vec4 w = uWaves[i];
          float k = 6.2831853 / w.w;
          float c = sqrt(9.8 / k) * uSpeed;
          float f = k * (dot(w.xy, p) - c * uTime);
          float a = w.z / k;
          float s = w.z;
          disp += vec3(w.x * a * cos(f) * uChop, a * sin(f), w.y * a * cos(f) * uChop);
          tx += vec3(-w.x * w.x * s * sin(f) * uChop, w.x * s * cos(f), -w.x * w.y * s * sin(f) * uChop);
          tz += vec3(-w.x * w.y * s * sin(f) * uChop, w.y * s * cos(f), -w.y * w.y * s * sin(f) * uChop);
        }
        world.xyz += disp;
        vN = normalize(cross(tz, tx)); // the analytic normal: smooth, no facets
        vBase = p;
        vH = disp.y;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uHeightScale;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uFoam;
      uniform vec3 uSkyTop;
      uniform vec3 uSkyBottom;
      uniform vec3 uCloud;
      uniform vec3 uSunDir;
      uniform float uPrint;
      uniform vec3 uViewDir;
      uniform vec2 uWind;
      uniform float uStreaks;
      uniform float uReflect;
      uniform float uRain;
      uniform float uOpacity;
      uniform float uDesat;
      uniform sampler2D uReflTex;
      uniform vec2 uRes;
      uniform float uDotPx;
      uniform float uMirror;
      uniform float uSparkle;
      uniform vec2 uCamRight;
      uniform vec2 uCamFwd;
      uniform float uRowWorld;
      varying vec3 vN;
      varying vec2 vBase;
      varying float vH;
      #include <fog_pars_fragment>

      // sin-free, and wrapped, so it holds up tens of thousands of units out to sea
      // (a sin() hash goes flat there: GPUs lose sin's precision on large arguments)
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
      vec2 windSpace(vec2 p) { return vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x))); }

      float rings(vec2 p, float t) {
        float cellSize = 2.4;
        vec2 cell = floor(p / cellSize);
        float acc = 0.0;
        for (int i = -1; i <= 1; i++)
          for (int j = -1; j <= 1; j++) {
            vec2 c = cell + vec2(float(i), float(j));
            float h = hash(c);
            float cycle = t * 0.55 + h * 7.0;
            float ph = fract(cycle);
            vec2 jitter = vec2(hash(c + floor(cycle) * 1.7), hash(c + 3.1 + floor(cycle) * 2.3));
            float d = length(p - (c + jitter) * cellSize);
            float r = ph * 0.9;
            float ring = smoothstep(0.045, 0.0, abs(d - r)) + 0.6 * smoothstep(0.035, 0.0, abs(d - r * 0.55));
            acc += ring * (1.0 - ph) * step(0.6, hash(c + floor(cycle)));
          }
        return acc;
      }

      // Kingdom-style glints: short dashes one pixel row tall, lying along the screen's
      // horizontal but pinned to the water, so they don't slide as the camera follows.
      float sparkle(vec2 p, float density) {
        float row = floor(dot(p, uCamFwd) / uRowWorld);
        float rh = hash(vec2(row, 7.13));
        float len = 0.5 + rh * 1.6; // dash spacing along the row, in world units
        float x = dot(p, uCamRight) / len + rh * 31.0 + uTime * (0.08 + rh * 0.25) * (rh > 0.5 ? 1.0 : -1.0);
        float seg = floor(x);
        float sh = hash(vec2(row, seg));
        float blink = hash(vec2(row * 1.31 + seg, floor(uTime * 1.6 + sh * 5.0)));
        return step(fract(x), 0.2 + 0.45 * sh) * step(1.0 - density, sh) * step(0.3, blink);
      }

      void main() {
        vec3 n = normalize(vN);
        vec3 V = normalize(uViewDir);
        // soft light across the swell, from the lee side of a wave to its face
        float lit = clamp(dot(n, normalize(vec3(-uWind.x, 0.9, -uWind.y))) * 0.5 + 0.5, 0.0, 1.0);
        float h = clamp(vH / uHeightScale * 0.5 + 0.5, 0.0, 1.0);
        float shade = mix(lit, h, 0.35);
        vec3 col = mix(uDeep, uShallow, smoothstep(0.25, 0.85, shade));
        // printed in dots the pastel swell would read as one flat grey, so its tone spreads
        col *= mix(1.0, 0.62 + 0.7 * smoothstep(0.15, 0.9, shade), uPrint);

        // long light streaks drifting along the wind
        vec2 w = windSpace(vBase);
        float st = fbm(vec2(w.x * 0.05 - uTime * 0.03, w.y * 0.6));
        st = smoothstep(0.58, 0.72, st) * (0.6 + 0.4 * noise(vec2(w.x * 0.2, w.y * 0.05)));
        col = mix(col, uFoam, st * uStreaks * 0.5);

        // the sky in the swell
        vec3 R = reflect(-V, n);
        vec3 refl = mix(uSkyBottom, uSkyTop, clamp(R.y, 0.0, 1.0));
        vec2 cp = windSpace(vBase * 0.06 + R.xz * 1.6);
        refl = mix(refl, uCloud, smoothstep(0.5, 0.75, fbm(vec2(cp.x * 0.8, cp.y * 2.6))));
        float fres = pow(1.0 - max(dot(n, V), 0.0), 2.0);
        col = mix(col, refl, uReflect * (0.55 + 0.45 * fres));

        // the scene upside down in the water: each pixel row sways sideways a little, and the swell bends it
        float row = floor(gl_FragCoord.y / uDotPx);
        float sway = sin(row * 0.55 + uTime * 2.3) + 0.6 * sin(row * 1.7 - uTime * 3.1 + hash(vec2(row, 0.0)) * 6.0);
        vec2 ruv = gl_FragCoord.xy / uRes + vec2(sway * 1.1 + n.x * 14.0, n.z * 5.0) * uDotPx / uRes;
        vec4 mirror = texture2D(uReflTex, ruv);
        float mirrored = mirror.a * uMirror;
        col = mix(col, mix(mirror.rgb * 0.9, uDeep, 0.2), mirrored); // a mirror image is a touch darker and takes the water's colour

        // glints, thicker on the lit faces of the swell
        col = mix(col, mix(uFoam, vec3(1.0), 0.5), sparkle(vBase, uSparkle * 0.3 * (0.15 + 0.85 * smoothstep(0.45, 0.85, lit))));

        // faint far-off rings (real splashes come from the drops); skipped when dry, it's 9 cells a pixel
        if (uRain > 0.01) col = mix(col, uFoam, clamp(rings(vBase, uTime), 0.0, 1.0) * uRain * 0.3);

        // give up some colour, so the paper and ink lead
        col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uDesat);

        gl_FragColor = vec4(col, mix(uOpacity, 1.0, mirrored * 0.85)); // a reflection hides what's beneath
        #include <fog_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  waterMat.uniforms.uReflTex.value = reflTarget.texture; // merging the uniforms cloned the texture; point back at the real one
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.renderOrder = 2;
  scene.add(water);

  // The bottom of the sea: nothing down there but the water's own colour.
  const seabedMat = new THREE.MeshBasicMaterial({ color: 0x000000, fog: true });
  const seabed = new THREE.Mesh(new THREE.PlaneGeometry(WATER_SIZE * 1.2, WATER_SIZE * 1.2), seabedMat);
  seabed.rotation.x = -Math.PI / 2;
  seabed.position.y = -9;
  scene.add(seabed);

  // --- The course: one heading forever, with the odd swerve (its dashed line shows with "show route") -----
  // The boat always sails the way it points in the framed view (up and to the right on
  // screen). Now and then it swerves off the line and comes back to it; the props come
  // to meet it along the way.

  const HEADING = 1.185; // radians about y: the heading the boat had in the hand-framed view
  const COURSE_DIR = new THREE.Vector3(Math.sin(HEADING), 0, Math.cos(HEADING));
  const COURSE_SIDE = new THREE.Vector3(COURSE_DIR.z, 0, -COURSE_DIR.x);
  const JOURNEY_LEN = 168; // distance for one full turn of the weather (the old loop's length)
  const SWERVE_EVERY = 40; // the course comes in stretches; some of them hold a swerve

  const hash1 = (n) => {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  // Sideways offset at distance s: out and back again within one stretch, so it always
  // returns to the line (and to the heading).
  function swerve(s) {
    const k = Math.floor(s / SWERVE_EVERY);
    if (k <= 0 || hash1(k) < 0.65) return 0; // about one stretch in three
    const f = (s - k * SWERVE_EVERY) / SWERVE_EVERY;
    const amp = (hash1(k + 0.5) < 0.5 ? -1 : 1) * (1.2 + 1.4 * hash1(k + 0.25));
    return (amp * (1 - Math.cos(2 * Math.PI * f))) / 2;
  }
  function coursePoint(s, out) {
    return out.copy(COURSE_DIR).multiplyScalar(s).addScaledVector(COURSE_SIDE, swerve(s));
  }
  function courseHeading(s) {
    const slope = (swerve(s + 0.05) - swerve(s - 0.05)) / 0.1;
    return HEADING + Math.atan(slope); // stepping toward COURSE_SIDE (the boat's left) raises the heading
  }

  const routeMat = inkMaterial({ dashed: true, dashSize: 0.35, gapSize: 0.3, transparent: true, opacity: 0.45 }, 0.9);
  const ROUTE_PTS = 320; // drawn from a little behind the boat to well ahead, every half unit
  const routeLine = liveLine(new Array(ROUTE_PTS).fill([0, 0, 0]), routeMat);
  routeLine.renderOrder = 4;
  routeLine.visible = params.showRoute;
  scene.add(routeLine);
  const routePts = Array.from({ length: ROUTE_PTS }, () => [0, 0.32, 0]);
  const routeP = new THREE.Vector3();
  function updateRouteLine(s) {
    const s0 = Math.floor(s) - 30;
    for (let i = 0; i < ROUTE_PTS; i++) {
      coursePoint(s0 + i * 0.5, routeP);
      routePts[i][0] = routeP.x;
      routePts[i][2] = routeP.z;
    }
    rewriteLine(routeLine, routePts);
    routeLine.computeLineDistances();
  }

  // --- The boat ---------------------------------------------------------------------------------

  const boat = new THREE.Group();
  scene.add(boat);
  const hull = new THREE.Group(); // tilts and bobs; the boat group only moves and turns
  boat.add(hull);

  {
    // Hull: a pointed outline seen from above, extruded upward. Bow toward +Z.
    const s = new THREE.Shape();
    s.moveTo(-0.62, 1.45);
    s.lineTo(0.62, 1.45);
    s.lineTo(0.72, -0.2);
    s.lineTo(0.38, -1.15);
    s.lineTo(0, -1.65);
    s.lineTo(-0.38, -1.15);
    s.lineTo(-0.72, -0.2);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.55, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); // shape y → -z, extrusion → +y
    g.translate(0, -0.28, 0);
    hull.add(drawn(g));

    // planks: a few ink lines along the hull side
    const planks = [];
    for (const y of [-0.08, 0.1]) {
      const pts = [
        [-0.62, y, -1.46],
        [-0.72, y, 0.2],
        [-0.38, y, 1.16],
        [0, y, 1.66],
        [0.38, y, 1.16],
        [0.72, y, 0.2],
        [0.62, y, -1.46],
      ];
      for (let i = 0; i < pts.length - 1; i++) planks.push(...pts[i], ...pts[i + 1]);
    }
    const plankGeo = new LineSegmentsGeometry();
    const plankBase = overshoot(new Float32Array(planks), 0.02);
    plankGeo.setPositions(plankBase.slice());
    const plankLines = new LineSegments2(plankGeo, INK_LINE);
    hull.add(plankLines);
    inkOnly.push(plankLines);
    sketchy.push({ geo: plankGeo, base: plankBase, jitter: 0.012 });

    const cabin = drawn(new THREE.BoxGeometry(0.95, 0.55, 0.62));
    cabin.position.set(0, 0.52, -0.95);
    hull.add(cabin);
    const roof = drawn(new THREE.BoxGeometry(1.05, 0.08, 0.72));
    roof.position.set(0, 0.83, -0.95);
    hull.add(roof);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.2), solid(GLOW));
    win.position.set(0.48, 0.55, -0.95);
    win.rotation.y = Math.PI / 2;
    hull.add(win);
    for (const [x, z, sz] of [
      [0.32, 0.55, 0.32],
      [-0.3, 0.75, 0.26],
      [0.25, 0.9, 0.22],
    ]) {
      const crate = drawn(new THREE.BoxGeometry(sz, sz, sz));
      crate.position.set(x, 0.25 + sz / 2, z);
      crate.rotation.y = x * 1.3;
      hull.add(crate);
    }

    const pole = drawn(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), { crease: 70 });
    pole.position.set(-0.45, 0.7, -1.35);
    hull.add(pole);
    const lantern = drawn(new THREE.BoxGeometry(0.14, 0.16, 0.14), { material: solid(GLOW) });
    lantern.position.set(-0.45, 1.18, -1.35);
    hull.add(lantern);
  }

  // Mast and the eye-shaped sail. The sail is a grid so it can billow in the wind.
  const mast = drawn(new THREE.CylinderGeometry(0.045, 0.055, 3.1, 8), { crease: 70 });
  mast.position.set(0, 1.75, 0.15);
  hull.add(mast);

  const sailPivot = new THREE.Group();
  sailPivot.position.set(0, 0.55, 0.15);
  hull.add(sailPivot);
  const SAIL_H = 2.5;
  const SAIL_W = 0.95; // half width at the widest
  const SU = 18;
  const SV = 12;
  const sailGeo = new THREE.BufferGeometry();
  {
    const pos = new Float32Array((SU + 1) * (SV + 1) * 3);
    const idx = [];
    for (let i = 0; i < SU; i++)
      for (let j = 0; j < SV; j++) {
        const a = i * (SV + 1) + j;
        const b = a + SV + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    sailGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sailGeo.setIndex(idx);
  }
  const sailMat = toon({ color: PAPER, side: THREE.DoubleSide, emissive: new THREE.Color(PAPER).multiplyScalar(0.2) });
  const sail = new THREE.Mesh(sailGeo, sailMat);
  sailPivot.add(sail);
  // the sail's ink: its edge, and a seam down the middle
  const sailEdge = liveLine(new Array(2 * (SU + 1) + 1).fill([0, 0, 0]));
  const sailSeam = liveLine(new Array(SU + 1).fill([0, 0, 0]));
  sailPivot.add(sailEdge, sailSeam);
  inkOnly.push(sailEdge, sailSeam);

  // The PsychMind logo on the sail: an ink disc with its off-centre eye, on both
  // faces. Each part is bent onto the sail's surface every frame (see updateSail),
  // standing just off it; flat discs had the rippling sail pass through them.
  const LOGO_R = 0.42;
  const logoParts = [
    [LOGO_R, 0, 0, 40, INK, 0.03], // front disc
    [LOGO_R * 0.45, LOGO_R * 0.25, LOGO_R * 0.25, 32, PAPER, 0.045], // front eye
    [LOGO_R, 0, 0, 40, INK, -0.03], // back disc
    [LOGO_R * 0.45, -LOGO_R * 0.25, LOGO_R * 0.25, 32, PAPER, -0.045], // back eye, mirrored so it reads the same way
  ].map(([r, x, y, seg, color, off]) => {
    const geo = new THREE.CircleGeometry(r, seg).translate(x, y + SAIL_H * 0.5, 0);
    const mat = solid(color);
    mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geo, mat);
    sailPivot.add(mesh);
    return { geo, base: geo.attributes.position.array.slice(), off };
  });

  let windNow = 0.8; // set by the weather
  function sailBillow(u, v, wind) {
    return wind * (1 - v * v) * Math.sin(Math.PI * u) * 0.35;
  }

  const sailZ = (u, v, wind, t) => sailBillow(u, v, wind) + Math.sin(t * (1.6 + windNow) + u * 4) * 0.015 * windNow;
  const sailPoint = (u, v, wind, t) => [v * SAIL_W * Math.pow(Math.sin(Math.PI * u), 0.85), u * SAIL_H, sailZ(u, v, wind, t)];

  function updateSail(t) {
    const wind = windNow * (0.9 + 0.3 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 3.1));
    const pos = sailGeo.attributes.position.array;
    let k = 0;
    for (let i = 0; i <= SU; i++)
      for (let j = 0; j <= SV; j++) {
        const p = sailPoint(i / SU, (j / SV) * 2 - 1, wind, t);
        pos[k++] = p[0];
        pos[k++] = p[1];
        pos[k++] = p[2];
      }
    sailGeo.attributes.position.needsUpdate = true;
    sailGeo.computeVertexNormals();
    if (!dithering()) {
      // the sail's ink (the dither print has none)
      const edge = [];
      for (let i = 0; i <= SU; i++) edge.push(sailPoint(i / SU, -1, wind, t));
      for (let i = SU; i >= 0; i--) edge.push(sailPoint(i / SU, 1, wind, t));
      edge.push(edge[0]);
      rewriteLine(sailEdge, edge);
      const seam = [];
      for (let i = 0; i <= SU; i++) seam.push(sailPoint(i / SU, 0, wind, t));
      rewriteLine(sailSeam, seam);
    }
    for (const part of logoParts) {
      const pos = part.geo.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const u = part.base[i + 1] / SAIL_H;
        const v = part.base[i] / (SAIL_W * Math.pow(Math.sin(Math.PI * u), 0.85));
        pos[i + 2] = sailZ(u, v, wind, t) + part.off;
      }
      part.geo.attributes.position.needsUpdate = true;
    }
    // Rigged fore-and-aft, like the trailer: the sail runs along the boat, so its eye faces the side.
    sailPivot.rotation.y = Math.PI / 2 + Math.sin(t * 0.35) * 0.18;
  }

  // Bunting: two ink lines from the masthead, hung with little paper flags.
  {
    const top = new THREE.Vector3(0, 3.25, 0.15);
    for (const end of [new THREE.Vector3(0, 0.35, 1.55), new THREE.Vector3(0, 1.0, -1.35)]) {
      const n = 7;
      const string = [];
      for (let i = 0; i <= n + 1; i++) {
        const p = top.clone().lerp(end, i / (n + 1));
        p.y -= Math.sin((Math.PI * i) / (n + 1)) * 0.18;
        string.push([p.x, p.y, p.z]);
        if (i > 0 && i <= n) {
          const flag = drawn(new THREE.ConeGeometry(0.05, 0.13, 3), { material: i % 2 ? solid(CRIMSON) : PAPER_FILL, crease: 20 });
          flag.position.set(p.x, p.y - 0.07, p.z);
          flag.rotation.x = Math.PI;
          hull.add(flag);
        }
      }
      hull.add(liveLine(string));
    }
    const pennant = drawn(new THREE.ConeGeometry(0.06, 0.4, 3), { material: solid(CRIMSON), crease: 20 });
    pennant.position.set(0, 3.32, -0.05);
    pennant.rotation.x = -Math.PI / 2;
    hull.add(pennant);
  }

  // The girl, standing at the bow looking ahead. Her dress is the one thing on the
  // boat printed in colour, the search button's red (brand-primary), so she's the
  // one you remember. Unlit and unfogged, so it's that exact red. Its blending
  // writes the colour as is and zero alpha, the print's mark for "colour, not dots"
  // (as on the water; see the print shader). Opacity alone can't do it: three.js
  // forces alpha to 1 on materials that aren't transparent.
  const DRESS = new THREE.MeshBasicMaterial({
    color: CRIMSON,
    fog: false,
    transparent: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.ZeroFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.ZeroFactor,
  });
  const girl = new THREE.Group();
  girl.position.set(0, 0.25, 0.95);
  hull.add(girl);
  {
    const legs = drawn(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8), { crease: 70 });
    legs.position.y = 0.08;
    const body = drawn(new THREE.ConeGeometry(0.15, 0.34, 10), { material: dithering() ? DRESS : fill(CRIMSON), crease: 70 });
    body.position.y = 0.32;
    const head = drawn(new THREE.SphereGeometry(0.11, 14, 10), { crease: 80 });
    head.position.y = 0.56;
    const hair = drawn(new THREE.SphereGeometry(0.115, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), { material: solid(INK), crease: 80 });
    hair.position.set(0, 0.575, -0.02);
    hair.rotation.x = -0.5;
    const bun = drawn(new THREE.SphereGeometry(0.05, 10, 8), { material: solid(INK), crease: 80 });
    bun.position.set(0, 0.64, -0.13);
    girl.add(legs, body, head, hair, bun);
  }

  // --- Water effects: the wake, spray and ripples (part of the water, so painted, not inked) ----------
  // They share the water's own noise, so the foam breaks up the way real foam does.

  const FX_NOISE = /* glsl */ `
    // sin-free, and wrapped, so it holds up tens of thousands of units out to sea
      // (a sin() hash goes flat there: GPUs lose sin's precision on large arguments)
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
  `;
  const foamColor = () => waterMat.uniforms.uFoam.value; // shared, so the weather tints it

  // The wake: a ribbon laid from the bow, a little wider every step behind the boat
  // (the ~19° V of a real wake). Ragged foam crests run along both arms, the water
  // churned behind the stern is a turbulent band, and lace fills between; all of
  // it breaks up and fades as it ages.
  const WAKE_N = 150; // samples along the trail
  const WAKE_COLS = 9; // across it
  const WAKE_STEP = 0.15; // distance between samples
  const STERN_AGE = 2.8 / (WAKE_N * WAKE_STEP); // where the stern sits along the trail
  const wakeTrail = [];
  const wakeGeo = new THREE.BufferGeometry();
  {
    const n = WAKE_N * WAKE_COLS;
    wakeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    wakeGeo.setAttribute("aSide", new THREE.BufferAttribute(new Float32Array(n), 1));
    wakeGeo.setAttribute("aAge", new THREE.BufferAttribute(new Float32Array(n), 1));
    const idx = [];
    for (let i = 0; i < WAKE_N - 1; i++)
      for (let j = 0; j < WAKE_COLS - 1; j++) {
        const a = i * WAKE_COLS + j;
        const b = a + WAKE_COLS;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    wakeGeo.setIndex(idx);
  }
  const wakeMat = new THREE.ShaderMaterial({
    transparent: true,
    // keep the alpha beneath, so foam on the water still counts as water in the dither print
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uOpacity: { value: 1 }, uSternAge: { value: STERN_AGE } }]),
    vertexShader: /* glsl */ `
      attribute float aSide;
      attribute float aAge;
      varying float vSide;
      varying float vAge;
      varying vec2 vXZ;
      ${WAVE_GLSL}
      #include <fog_pars_vertex>
      void main() {
        vSide = aSide;
        vAge = aAge;
        vXZ = position.xz;
        vec3 p = position + waveDisp(position.xz); // ride the swell like the water's own vertices
        p.y += 0.03;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFoam;
      uniform float uTime;
      uniform float uOpacity;
      uniform float uSternAge;
      varying float vSide;
      varying float vAge;
      varying vec2 vXZ;
      #include <fog_pars_fragment>
      ${FX_NOISE}
      void main() {
        float a = vAge;
        float s = abs(vSide);
        vec2 p = vXZ;
        float n1 = fbm(p * 2.2 + vec2(uTime * 0.12, 0.0));
        float n2 = noise(p * 8.0 - uTime * 0.35);
        // the two arms: a ragged crest at the outer edge
        float arm = smoothstep(0.6, 0.9, s) * (1.0 - smoothstep(0.95, 1.0, s));
        arm *= smoothstep(0.38 + a * 0.4, 0.72, n1 + n2 * 0.22);
        // churned water behind the stern
        float centre = (1.0 - smoothstep(0.0, 0.3 + a * 0.3, s)) * smoothstep(uSternAge, uSternAge + 0.05, a);
        centre *= smoothstep(0.32 + a * 0.5, 0.78, n1 * 0.75 + n2 * 0.45);
        // lace between, sparse and fine
        float lace = smoothstep(0.7 + a * 0.2, 0.95, fbm(p * 4.5 + 3.0) * 0.8 + n2 * 0.25) * 0.55;
        float foam = clamp(max(max(arm, centre), lace), 0.0, 1.0);
        float fade = pow(1.0 - a, 1.5) * smoothstep(0.0, 0.04, a);
        gl_FragColor = vec4(uFoam, foam * fade * uOpacity * 0.9);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  wakeMat.uniforms.uFoam = { value: foamColor() };
  const wake = new THREE.Mesh(wakeGeo, wakeMat);
  wake.renderOrder = 3;
  wake.frustumCulled = false;
  scene.add(wake);

  function updateWake(t) {
    const bow = new THREE.Vector3(0, 0, 1.4).applyMatrix4(boat.matrixWorld);
    if (wakeTrail[0] && Math.hypot(bow.x - wakeTrail[0].x, bow.z - wakeTrail[0].z) > 3) wakeTrail.length = 0; // jumped along the loop
    const last = wakeTrail[0];
    if (!last || Math.hypot(bow.x - last.x, bow.z - last.z) > WAKE_STEP) {
      wakeTrail.unshift({ x: bow.x, z: bow.z, px: Math.cos(boat.rotation.y), pz: -Math.sin(boat.rotation.y) });
      if (wakeTrail.length > WAKE_N) wakeTrail.pop();
    }
    const pos = wakeGeo.attributes.position.array;
    const side = wakeGeo.attributes.aSide.array;
    const age = wakeGeo.attributes.aAge.array;
    for (let i = 0; i < WAKE_N; i++) {
      const have = i < wakeTrail.length;
      const s = wakeTrail[Math.min(i, wakeTrail.length - 1)] || { x: bow.x, z: bow.z, px: 1, pz: 0 };
      const a = i / (WAKE_N - 1);
      const half = 0.55 + a * 3.8; // hull-wide at the bow, spreading behind
      for (let j = 0; j < WAKE_COLS; j++) {
        const sd = (j / (WAKE_COLS - 1)) * 2 - 1;
        const x = s.x + s.px * sd * half;
        const z = s.z + s.pz * sd * half;
        const k = i * WAKE_COLS + j;
        pos[k * 3] = x;
        pos[k * 3 + 1] = 0; // lifted onto the swell in the shader
        pos[k * 3 + 2] = z;
        side[k] = sd;
        age[k] = have ? a : 1;
      }
    }
    wakeGeo.attributes.position.needsUpdate = true;
    wakeGeo.attributes.aSide.needsUpdate = true;
    wakeGeo.attributes.aAge.needsUpdate = true;
    wakeMat.uniforms.uTime.value = t;
    wakeMat.uniforms.uOpacity.value = Math.min(1, params.boatSpeed / 1.2);
  }

  // Spray: droplets thrown off the bow, falling back under gravity, plus the
  // crowns that raindrops kick up. Soft round points, sized in world units.
  const SPRAY_N = 600;
  const spray = Array.from({ length: SPRAY_N }, () => ({ life: 0 }));
  const sprayGeo = new THREE.BufferGeometry();
  sprayGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPRAY_N * 3), 3));
  sprayGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(SPRAY_N), 1));
  sprayGeo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(SPRAY_N), 1));
  const sprayMat = new THREE.ShaderMaterial({
    transparent: true,
    // keep the alpha beneath, so foam on the water still counts as water in the dither print
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    depthWrite: false,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uScale: { value: 40 } }]),
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aAlpha;
      uniform float uScale;
      varying float vAlpha;
      #include <fog_pars_vertex>
      void main() {
        vAlpha = aAlpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = max(1.5, aSize * uScale);
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFoam;
      varying float vAlpha;
      #include <fog_pars_fragment>
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.18, d) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uFoam, a);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  sprayMat.uniforms.uFoam = { value: foamColor() };
  const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
  sprayPoints.frustumCulled = false;
  sprayPoints.renderOrder = 6;
  scene.add(sprayPoints);
  let sprayCursor = 0;

  // Takes the next slot round the pool: when it's busy, the oldest droplet gives way.
  // (Searching a full pool for a free slot, on every droplet, is what made squalls slow.)
  function emitSpray(x, y, z, vx, vy, vz, size, life) {
    const p = spray[sprayCursor];
    sprayCursor = (sprayCursor + 1) % SPRAY_N;
    p.x = x;
    p.y = y;
    p.z = z;
    p.vx = vx;
    p.vy = vy;
    p.vz = vz;
    p.size = size;
    p.life = life;
    p.maxLife = life;
  }

  // Ripples: flat rings that spread and fade where spray and rain land.
  const RING_N = 200;
  const rings = Array.from({ length: RING_N }, () => ({ age: 1 }));
  const ringGeo = new THREE.PlaneGeometry(1, 1);
  ringGeo.rotateX(-Math.PI / 2);
  const ringAge = new THREE.InstancedBufferAttribute(new Float32Array(RING_N).fill(1), 1);
  ringGeo.setAttribute("aRingAge", ringAge);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true,
    // keep the alpha beneath, so foam on the water still counts as water in the dither print
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    depthWrite: false,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: /* glsl */ `
      attribute float aRingAge;
      varying float vAge;
      varying vec2 vUv;
      ${WAVE_GLSL}
      #include <fog_pars_vertex>
      void main() {
        vAge = aRingAge;
        vUv = uv;
        vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
        world.xyz += waveDisp(world.xz);
        world.y += 0.025;
        vec4 mvPosition = viewMatrix * world;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFoam;
      varying float vAge;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        if (vAge >= 1.0) discard;
        float d = length(vUv - 0.5) * 2.0;
        float r = sqrt(vAge); // fast at first, then slowing as it spreads
        float w = 0.05 + 0.05 * vAge;
        float ring = smoothstep(w, 0.0, abs(d - r)) + 0.5 * smoothstep(w * 0.8, 0.0, abs(d - r * 0.62));
        float a = ring * pow(1.0 - vAge, 1.5);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uFoam, a);
        #include <fog_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  ringMat.uniforms.uFoam = { value: foamColor() };
  const ringMesh = new THREE.InstancedMesh(ringGeo, ringMat, RING_N);
  ringMesh.frustumCulled = false;
  ringMesh.renderOrder = 4;
  scene.add(ringMesh);

  // the foam on the water shares the water's wave uniforms
  for (const m of [wakeMat, ringMat]) {
    m.uniforms.uWaves = waterMat.uniforms.uWaves;
    m.uniforms.uSpeed = waterMat.uniforms.uSpeed;
    m.uniforms.uChop = waterMat.uniforms.uChop;
    m.uniforms.uWaveTime = waterMat.uniforms.uTime;
  }
  let ringCursor = 0;
  const ringMatrix = new THREE.Matrix4();

  function emitRing(x, z, radius, duration) {
    const r = rings[ringCursor];
    r.x = x;
    r.z = z;
    r.radius = radius;
    r.duration = duration;
    r.age = 0;
    ringCursor = (ringCursor + 1) % RING_N;
  }

  const local = new THREE.Vector3();
  const vel = new THREE.Vector3();
  let sprayDebt = 0;

  // Spray from the bow, heavier when the bow slaps down into a swell.
  function emitBowSpray(dt) {
    const speed = params.boatSpeed;
    const slap = Math.max(0, state.vp) * 6; // the bow dropping
    // heavier when it slaps, up to a ceiling: a squall's swell would otherwise throw hundreds a second
    sprayDebt += dt * speed * (14 + Math.min(slap, 2.5) * 34);
    const yaw = boat.rotation.y;
    while (sprayDebt >= 1) {
      sprayDebt -= 1;
      const sideSign = Math.random() < 0.5 ? -1 : 1;
      local.set(sideSign * (0.25 + Math.random() * 0.35), -0.05, 1.0 + Math.random() * 0.5).applyMatrix4(hull.matrixWorld);
      vel.set(sideSign * (0.6 + Math.random() * 1.2), 0.9 + Math.random() * 1.4 + slap * 0.3, -0.3 - Math.random() * 0.6).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      vel.x += Math.sin(yaw) * speed * 0.35;
      vel.z += Math.cos(yaw) * speed * 0.35;
      emitSpray(local.x, local.y, local.z, vel.x, vel.y, vel.z, 0.06 + Math.random() * 0.07, 0.6 + Math.random() * 0.6);
    }
    if (slap > 1.2 && Math.random() < dt * 6) {
      local.set(0, 0, 1.3).applyMatrix4(hull.matrixWorld);
      emitRing(local.x, local.z, 1.4 + Math.random() * 0.6, 1.4);
    }
  }

  function stepParticles(dt, t) {
    emitBowSpray(dt);
    const pos = sprayGeo.attributes.position.array;
    const size = sprayGeo.attributes.aSize.array;
    const alpha = sprayGeo.attributes.aAlpha.array;
    spray.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 7.5 * dt;
        p.vx *= 1 - 0.6 * dt; // air drag
        p.vz *= 1 - 0.6 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        if (p.vy < 0 && p.y < heightAt(p.x, p.z, t)) {
          if (p.size > 0.09 && Math.random() < 0.35) emitRing(p.x, p.z, 0.25 + p.size * 4, 0.8);
          p.life = 0;
        }
      }
      pos[i * 3] = p.x || 0;
      pos[i * 3 + 1] = p.life > 0 ? p.y : -50;
      pos[i * 3 + 2] = p.z || 0;
      size[i] = p.size || 0;
      alpha[i] = p.life > 0 ? Math.min(1, (p.life / p.maxLife) * 2.5) * 0.9 : 0;
    });
    sprayGeo.attributes.position.needsUpdate = true;
    sprayGeo.attributes.aSize.needsUpdate = true;
    sprayGeo.attributes.aAlpha.needsUpdate = true;

    rings.forEach((r, i) => {
      if (r.age < 1) r.age = Math.min(1, r.age + dt / r.duration);
      ringAge.array[i] = r.age;
      if (r.age < 1) {
        ringMatrix.makeScale(r.radius * 2, 1, r.radius * 2).setPosition(r.x, 0, r.z); // lifted in the shader
        ringMesh.setMatrixAt(i, ringMatrix);
      }
    });
    ringAge.needsUpdate = true;
    ringMesh.instanceMatrix.needsUpdate = true;

    // points are sized in world units: convert to device pixels at the current zoom
    sprayMat.uniforms.uScale.value = drawHeight() / ((camera.top - camera.bottom) / camera.zoom);
  }

  // --- Landmarks along the course -------------------------------------------------------------------
  // A small pool of each, leapfrogging: once one falls behind the boat it is moved to
  // its next place ahead. Every place is fixed by the distance along the course, so
  // scrubbing back and forth finds the same towers in the same spots.

  const LAND_BEHIND = 40; // how far behind the boat a prop lingers before it moves ahead
  // slot j of a pool of n holds the props numbered j, j + n, j + 2n…; the one shown is the first not yet left behind
  function poolIndex(j, n, spacing, s) {
    return j + n * Math.max(0, Math.ceil((s - LAND_BEHIND - j * spacing) / (n * spacing)));
  }
  const landP = new THREE.Vector3();

  // Towers on rocks, each with its own build: [height, scale]
  const TOWERS = [
    [5, 1.0],
    [3.5, 0.9],
    [6.5, 1.2],
    [4.0, 1.0],
    [5.5, 1.3],
    [3.0, 0.8],
    [6.0, 1.1],
    [4.5, 0.9],
    [7.0, 1.4],
  ];
  const TOWER_SPACING = 17;
  const towers = [];
  for (const [h, s] of TOWERS) {
    const g = new THREE.Group();
    const rock = drawn(new THREE.CylinderGeometry(1.5, 1.9, 1.6, 7), { crease: 40 });
    rock.position.y = -0.4;
    const body = drawn(new THREE.BoxGeometry(1.1, h, 1.1));
    body.position.y = 0.4 + h / 2;
    const cap = drawn(new THREE.ConeGeometry(0.95, 1.3, 4));
    cap.position.y = 0.4 + h + 0.65;
    cap.rotation.y = Math.PI / 4;
    const win = drawn(new THREE.BoxGeometry(0.26, 0.4, 0.02), { material: solid(GLOW) });
    win.position.set(0, 0.4 + h * 0.7, 0.56);
    const flagPole = liveLine([
      [0, 0.4 + h + 1.25, 0],
      [0, 0.4 + h + 1.9, 0],
    ]);
    const flag = drawn(new THREE.ConeGeometry(0.08, 0.36, 3), { material: solid(CRIMSON), crease: 20 });
    flag.position.set(0.18, 0.4 + h + 1.75, 0);
    flag.rotation.z = -Math.PI / 2;
    g.add(rock, body, cap, win, flagPole, flag);
    g.scale.setScalar(s);
    g.userData.index = -1;
    scene.add(g);
    towers.push(g);
  }

  function placeTowers(s) {
    towers.forEach((g, j) => {
      const i = poolIndex(j, towers.length, TOWER_SPACING, s);
      if (g.userData.index === i) return;
      g.userData.index = i;
      // off to one side, clear of the boat even mid-swerve
      const side = hash1(i * 3.1) < 0.5 ? -1 : 1;
      const along = i * TOWER_SPACING + (hash1(i * 5.7) - 0.5) * 8;
      landP.copy(COURSE_DIR).multiplyScalar(along).addScaledVector(COURSE_SIDE, side * (6.5 + hash1(i * 2.3) * 13));
      g.position.set(landP.x, 0, landP.z);
      g.rotation.y = hash1(i * 7.9) * Math.PI;
    });
  }

  // Whales and a school of fish: shapes in the water, so painted, not inked.
  const whaleMat = new THREE.MeshBasicMaterial({ color: "#4FA8AA", fog: true });
  // Each whale swims a slow circle around a spot near the course: [radius, speed]
  const WHALES = [
    [6, 0.08],
    [8, -0.06],
    [7, 0.07],
    [6, -0.09],
  ];
  const WHALE_SPACING = 38;
  const whales = WHALES.map(([r, sp]) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), whaleMat);
    body.scale.set(1.1, 0.45, 3.2);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.3, 3), whaleMat);
    tail.rotation.set(Math.PI / 2, 0, 0);
    tail.scale.set(1.4, 1, 0.5);
    tail.position.z = -3.3;
    g.add(body, tail);
    g.userData = { x: 0, z: 0, r, sp, phase: Math.random() * 6.28, index: -1 };
    scene.add(g);
    return g;
  });

  function placeWhales(s) {
    whales.forEach((g, j) => {
      const i = poolIndex(j, whales.length, WHALE_SPACING, s);
      const u = g.userData;
      if (u.index === i) return;
      u.index = i;
      const side = hash1(i * 4.3 + 1) < 0.5 ? -1 : 1;
      landP.copy(COURSE_DIR).multiplyScalar(i * WHALE_SPACING + 12).addScaledVector(COURSE_SIDE, side * (3 + hash1(i * 6.1) * 9));
      u.x = landP.x;
      u.z = landP.z;
    });
  }

  const fishGeo = new THREE.SphereGeometry(0.16, 8, 6);
  fishGeo.scale(0.55, 0.3, 1.2);
  const school = new THREE.Group();
  scene.add(school);
  const fish = [];
  for (let i = 0; i < 22; i++) {
    const f = new THREE.Mesh(fishGeo, whaleMat);
    f.userData = { ox: (Math.random() - 0.5) * 6, oz: (Math.random() - 0.5) * 8, oy: -0.6 - Math.random() * 0.4, phase: Math.random() * 6.28 };
    school.add(f);
    fish.push(f);
  }

  // Birds: little ink doodles, two curves that flap.
  const birds = [];
  let birdsHere = 1; // 1: the flock is about the boat; 0: it has flown off out of the rain
  for (let i = 0; i < 7; i++) {
    const b = liveLine(new Array(5).fill([0, 0, 0]));
    b.userData = { r: 3 + Math.random() * 4, h: 3.5 + Math.random() * 3, speed: (0.3 + Math.random() * 0.3) * (i % 2 ? -1 : 1), phase: Math.random() * 6.28, flap: 6 + Math.random() * 3, lag: (i / 6) * 0.5 };
    scene.add(b);
    birds.push(b);
  }

  // Rain: short slanted strokes falling around the boat, only in the wet spells.
  const RAIN_N = 320;
  const rainMat = inkMaterial({ color: "#F2F6FB", transparent: true, opacity: 0, depthWrite: false }, 0.75);
  const rainGeo = new LineSegmentsGeometry();
  rainGeo.setPositions(new Float32Array(RAIN_N * 6));
  const rain = new LineSegments2(rainGeo, rainMat);
  rain.frustumCulled = false;
  rain.renderOrder = 5;
  scene.add(rain);
  const drops = Array.from({ length: RAIN_N }, () => ({ x: (Math.random() - 0.5) * 40, y: Math.random() * 14, z: (Math.random() - 0.5) * 40, len: 0.35 + Math.random() * 0.35, speed: 9 + Math.random() * 4 }));

  // --- Weather along the loop -----------------------------------------------------------------------------

  const mixed = {};
  const COLOR_KEYS = ["skyTop", "skyBottom", "fog", "deep", "shallow", "foam", "under", "cloud", "whale"];
  const VALUE_KEYS = ["light", "sun", "waves", "streaks", "reflection", "rain", "opacity", "wind", "sparkle"];
  for (const k of COLOR_KEYS) mixed[k] = new THREE.Color();

  // each spell's colours as THREE colours, parsed once
  const SPELLS = {};
  for (const [name, spell] of Object.entries(WEATHER)) {
    SPELLS[name] = { ...spell };
    for (const k of COLOR_KEYS) SPELLS[name][k] = new THREE.Color(spell[k]);
  }
  const WATER_DEEP = new THREE.Color(params.waterDeep);
  const WATER_SHALLOW = new THREE.Color(params.waterShallow);
  const WATER_UNDER = new THREE.Color(params.waterUnder);

  function weatherAt(u) {
    let i = 0;
    while (i < WEATHER_KEYS.length - 2 && u > WEATHER_KEYS[i + 1][0]) i++;
    const [u0, a] = WEATHER_KEYS[i];
    const [u1, b] = WEATHER_KEYS[i + 1];
    const t = THREE.MathUtils.smoothstep(u, u0, u1);
    const A = SPELLS[a];
    const B = SPELLS[b];
    for (const k of COLOR_KEYS) mixed[k].copy(A[k]).lerp(B[k], t);
    for (const k of VALUE_KEYS) mixed[k] = A[k] + (B[k] - A[k]) * t;
    return mixed;
  }

  let skyDrawn = "";
  function applyWeather(w) {
    const top = w.skyTop.getHexString();
    const bottom = w.skyBottom.getHexString();
    if (top + bottom !== skyDrawn) {
      skyDrawn = top + bottom;
      const ctx = skyCanvas.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, skyCanvas.height);
      grad.addColorStop(0, "#" + top);
      grad.addColorStop(1, "#" + bottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, skyCanvas.width, skyCanvas.height);
      skyTexture.needsUpdate = true;
    }
    scene.fog.color.copy(w.fog);
    const u = waterMat.uniforms;
    // the water is your colours, nudged by the spell as much as "weather tint" allows
    u.uDeep.value.copy(WATER_DEEP).lerp(w.deep, params.weatherTint);
    u.uShallow.value.copy(WATER_SHALLOW).lerp(w.shallow, params.weatherTint);
    u.uFoam.value.copy(w.foam);
    u.uSkyTop.value.copy(w.skyTop);
    u.uSkyBottom.value.copy(w.skyBottom);
    u.uCloud.value.copy(w.cloud);
    u.uStreaks.value = w.streaks;
    u.uReflect.value = w.reflection;
    u.uRain.value = w.rain;
    u.uOpacity.value = w.opacity;
    under.uUnderColor.value.copy(WATER_UNDER).lerp(w.under, params.weatherTint);
    seabedMat.color.copy(under.uUnderColor.value);
    whaleMat.color.copy(w.whale);
    if (dithering()) {
      // clay lighting: a strong key and a darker underside, so forms read as tone
      hemi.intensity = w.light * 0.4;
      sun.intensity = w.sun * 2.8;
    } else {
      hemi.intensity = w.light;
      sun.intensity = w.sun;
    }
    rainMat.opacity = w.rain * 0.7;
    rain.visible = w.rain > 0.01;
    windNow = w.wind;
    if (Math.abs(w.waves - waveHeight) > 0.002) {
      waveHeight = w.waves;
      updateWaves();
    }
  }

  // --- Boat on its course ---------------------------------------------------------------------------

  // s: distance sailed; u: how far through the weather's journey that is (0..1, then round again)
  const state = { s: 0, u: 0, y: 0, vy: 0, pitch: 0, vp: 0, roll: 0, vr: 0 };
  const PROBES = {
    bow: new THREE.Vector3(0, 0, 1.3),
    stern: new THREE.Vector3(0, 0, -1.3),
    port: new THREE.Vector3(-0.65, 0, 0),
    star: new THREE.Vector3(0.65, 0, 0),
  };
  const tmp = new THREE.Vector3();

  function probeHeight(local, t) {
    tmp.copy(local).applyAxisAngle(THREE.Object3D.DEFAULT_UP, boat.rotation.y).add(boat.position);
    return heightAt(tmp.x, tmp.z, t);
  }

  function placeOnCourse(s) {
    coursePoint(s, tmp);
    boat.position.set(tmp.x, 0, tmp.z);
    boat.rotation.y = courseHeading(s);
    state.u = (s / JOURNEY_LEN) % 1;
    placeTowers(s);
    placeWhales(s);
  }
  state.s = (options.startAt ?? 0) * JOURNEY_LEN;
  placeOnCourse(state.s);

  function stepBoat(dt, t) {
    state.s += params.boatSpeed * dt;
    placeOnCourse(state.s);

    const hb = probeHeight(PROBES.bow, t);
    const hs = probeHeight(PROBES.stern, t);
    const hp = probeHeight(PROBES.port, t);
    const hr = probeHeight(PROBES.star, t);
    const targetY = (hb + hs + hp + hr) / 4;
    const targetPitch = -Math.atan2(hb - hs, 2.6); // bow up when the bow sits higher
    // lean into the turns a little, and heel with the wind
    const turn = courseHeading(state.s + 0.7) - boat.rotation.y;
    const targetRoll = Math.atan2(hr - hp, 1.3) + 0.035 * windNow - THREE.MathUtils.clamp(Math.atan2(Math.sin(turn), Math.cos(turn)) * 2.5, -0.12, 0.12);

    // Damped springs, so the hull lags the swell and rocks a little after it.
    const k = params.buoyancy;
    const c = params.damping;
    state.vy += (k * (targetY - state.y) - c * state.vy) * dt;
    state.y += state.vy * dt;
    state.vp += (k * 1.4 * (targetPitch - state.pitch) - c * state.vp) * dt;
    state.pitch += state.vp * dt;
    state.vr += (k * 1.1 * (targetRoll - state.roll) - c * 0.8 * state.vr) * dt;
    state.roll += state.vr * dt;
    hull.position.y = state.y;
    hull.rotation.set(state.pitch, 0, state.roll);

  }

  function stepWorld(dt, t, w) {
    for (const wh of whales) {
      const u = wh.userData;
      const a = t * u.sp + u.phase;
      wh.position.set(u.x + Math.cos(a) * u.r, -1.3 + Math.sin(t * 0.4 + u.phase) * 0.3, u.z + Math.sin(a) * u.r);
      wh.rotation.y = -a + (u.sp > 0 ? 0 : Math.PI);
    }
    // the school keeps pace beside the boat, a little ahead
    tmp.set(Math.sin(boat.rotation.y), 0, Math.cos(boat.rotation.y));
    school.position.copy(boat.position).addScaledVector(tmp, 6).add(new THREE.Vector3(tmp.z, 0, -tmp.x).multiplyScalar(-3.5));
    school.rotation.y = boat.rotation.y;
    for (const f of fish) {
      const u = f.userData;
      f.position.set(u.ox + Math.sin(t * 0.8 + u.phase) * 0.3, u.oy, u.oz + Math.cos(t * 0.6 + u.phase) * 0.3);
      f.rotation.y = Math.sin(t * 6 + u.phase) * 0.25;
    }
    // The flock leaves at the first drop of rain and drifts back once it stops: each
    // bird a little after the last, flying in from far off and high up.
    birdsHere = ease(birdsHere, w.rain < 0.02 ? 1 : 0, dt, 1.6);
    for (const b of birds) {
      const u = b.userData;
      const a = t * u.speed + u.phase;
      const here = THREE.MathUtils.smoothstep(birdsHere * 1.5 - u.lag, 0, 1);
      b.visible = here > 0.01;
      const r = u.r + (1 - here) * 26;
      b.position.set(boat.position.x + Math.cos(a) * r, u.h + (1 - here) * 7 + Math.sin(t * 0.7 + u.phase) * 0.3, boat.position.z + Math.sin(a) * r);
      b.quaternion.copy(camera.quaternion); // doodles face the page
      const f = Math.sin(t * u.flap + u.phase) * 0.12;
      rewriteLine(b, [
        [-0.34, f, 0],
        [-0.17, 0.09 + f * 0.4, 0],
        [0, 0, 0],
        [0.17, 0.09 + f * 0.4, 0],
        [0.34, f, 0],
      ]);
    }
    if (rain.visible) {
      const arr = rainGeo.attributes.instanceStart.data.array;
      const slant = 0.22 * w.wind;
      drops.forEach((d, i) => {
        d.y -= d.speed * dt;
        if (d.y < 0) {
          const lx = boat.position.x + d.x;
          const lz = boat.position.z + d.z;
          if (Math.abs(d.x) < 13 && Math.abs(d.z) < 13 && Math.random() < 0.3 * w.rain) {
            emitRing(lx, lz, 0.3 + Math.random() * 0.3, 0.8);
            for (let c = 0; c < 2; c++) {
              const a = Math.random() * Math.PI * 2;
              emitSpray(lx, heightAt(lx, lz, t), lz, Math.cos(a) * 0.5, 0.9 + Math.random() * 0.6, Math.sin(a) * 0.5, 0.045, 0.35);
            }
          }
          d.y += 14;
        }
        const x = boat.position.x + d.x;
        const z = boat.position.z + d.z;
        const o = i * 6;
        arr[o] = x;
        arr[o + 1] = d.y;
        arr[o + 2] = z;
        arr[o + 3] = x + WIND.x * slant;
        arr[o + 4] = d.y + d.len;
        arr[o + 5] = z + WIND.y * slant;
      });
      rainGeo.attributes.instanceStart.data.needsUpdate = true;
    }
  }

  // --- Style ----------------------------------------------------------------------------------------------
  // Line art: toon paper with ink outlines. Dither: the same shapes in smooth clay,
  // lit from one side, no outlines, printed in dots.

  const clayOf = new Map();
  for (const m of toonMats) {
    clayOf.set(m, submerge(new THREE.MeshLambertMaterial({ color: m.color, side: m.side, emissive: m.emissive })));
  }
  const toonOf = new Map([...clayOf].map(([t, c]) => [c, t]));

  function applyStyle() {
    const dither = dithering();
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const swap = dither ? clayOf.get(o.material) : toonOf.get(o.material);
      if (swap) o.material = swap;
    });
    for (const o of inkOnly) o.visible = !dither;
    // in dots the pastel swell needs its tone spread; as colour pixels it keeps its own
    waterMat.uniforms.uPrint.value = dither && params.waterPrint === "dots" ? 1 : 0;
    ditherMat.uniforms.uWaterColour.value = params.waterPrint === "colour" ? 1 : 0;
    // the water's "zero the alpha" mark is only for the print; on screen it would punch holes in the canvas
    waterMat.blendSrcAlpha = dither ? THREE.ZeroFactor : THREE.OneFactor;
    waterMat.blendDstAlpha = dither ? THREE.ZeroFactor : THREE.OneMinusSrcAlphaFactor;
    hemi.groundColor.set(dither ? 0x303030 : 0xffffff);
    resize();
  }

  function applyPalette() {
    ditherMat.uniforms.uColourInk.value = params.palette === "colour ink" ? 1 : 0;
  }

  applyStyle(); // also sizes everything
  applyPalette();

  // --- Reflection ------------------------------------------------------------------------------------------
  // The world is flipped upside down about the water line and drawn from the same
  // camera: what lands at a pixel is exactly what that bit of flat water would mirror.
  // Only what stands above the water is kept; the water and its effects are left out.

  // After the flip, keep y below the water line. The plane stays on the renderer all
  // the time and is moved out of the way between reflections: switching between one
  // clipping plane and none makes three.js re-resolve every material's shader.
  const MIRROR_LINE = 0.02;
  const mirrorClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e9);
  renderer.clippingPlanes = [mirrorClip];
  const notMirrored = [water, seabed, wake, sprayPoints, ringMesh, rain, routeLine, school, ...whales];
  const clearWas = new THREE.Color();

  function renderReflection() {
    const shown = notMirrored.map((o) => o.visible);
    for (const o of notMirrored) o.visible = false;
    const level = under.uWaterLevel.value;
    under.uWaterLevel.value = -1e4; // the flipped world is all "below" the line; don't sink it
    const bg = scene.background;
    scene.background = null;
    renderer.getClearColor(clearWas);
    const alphaWas = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0); // empty sky stays see-through, so the water keeps its own
    scene.scale.y = -1;
    mirrorClip.constant = MIRROR_LINE;
    renderer.setRenderTarget(reflTarget);
    renderer.clear();
    renderer.render(scene, camera);
    mirrorClip.constant = 1e9; // clips nothing
    renderer.setRenderTarget(null);
    scene.scale.y = 1;
    scene.updateMatrixWorld();
    renderer.setClearColor(clearWas, alphaWas);
    scene.background = bg;
    under.uWaterLevel.value = level;
    notMirrored.forEach((o, i) => (o.visible = shown[i]));
  }

  const camRight3 = new THREE.Vector3();
  const camFwd3 = new THREE.Vector3();

  // --- Story ------------------------------------------------------------------------------------------------
  // The caller can take the helm for a while: zoom in on the boat and call up a
  // spell of weather. Both ease in and out. When the story lets the weather go, the
  // journey's own weather carries on from the spell it ended on, so nothing jumps.

  let storyZoomTo = 1;
  let storyHold = 0; // how much the called spell overrides the journey's weather
  let storyHoldTo = 0;
  let storySpell = "mist";
  let weatherShift = 0;
  const told = {}; // the story's weather, easing toward storySpell
  for (const k of COLOR_KEYS) told[k] = new THREE.Color();
  const ease = (from, to, dt, tau) => to + (from - to) * Math.exp(-dt / tau);
  // a held spell (the footer's) never turns, so no rain ever falls there
  const held = options.weather && SPELLS[options.weather];
  const journeyWeather = () => {
    if (!held) return weatherAt((((state.u + weatherShift) % 1) + 1) % 1);
    for (const k of COLOR_KEYS) mixed[k].copy(held[k]);
    for (const k of VALUE_KEYS) mixed[k] = held[k];
    return mixed;
  };

  function stepStory(dt, w) {
    storyZoom = ease(storyZoom, storyZoomTo, dt, 1.4);
    storyHold = ease(storyHold, storyHoldTo, dt, 1.2);
    const spell = SPELLS[storySpell];
    const k = 1 - Math.exp(-dt / 1.8);
    for (const c of COLOR_KEYS) told[c].lerp(spell[c], k);
    for (const v of VALUE_KEYS) told[v] += (spell[v] - told[v]) * k;
    if (storyHold < 0.001) return;
    for (const c of COLOR_KEYS) w[c].lerp(told[c], storyHold);
    for (const v of VALUE_KEYS) w[v] += (told[v] - w[v]) * storyHold;
  }

  // where on the journey a spell is at its fullest
  function spellCentre(name) {
    for (let i = 0; i < WEATHER_KEYS.length - 1; i++)
      if (WEATHER_KEYS[i][1] === name && WEATHER_KEYS[i + 1][1] === name) return (WEATHER_KEYS[i][0] + WEATHER_KEYS[i + 1][0]) / 2;
    return 0;
  }

  /**
   * zoom: 1 is the framed view, more is closer. weather: a spell's name to call it
   * up, null to hand the weather back to the journey, or leave it out to keep it.
   * @param {{ zoom?: number, weather?: string | null }} [opts]
   */
  function direct({ zoom, weather } = {}) {
    if (zoom !== undefined) storyZoomTo = zoom;
    if (weather === undefined) return;
    if (weather === null) {
      if (storyHoldTo === 0) return;
      weatherShift = spellCentre(storySpell) - state.u; // the journey picks up where the story left it
      storyHoldTo = 0;
      return;
    }
    if (storyHoldTo === 0) {
      // start the story's weather from what the sky is doing now
      const now = journeyWeather();
      for (const c of COLOR_KEYS) told[c].copy(now[c]);
      for (const v of VALUE_KEYS) told[v] = now[v];
    }
    storySpell = weather;
    storyHoldTo = 1;
  }

  // --- Loop -------------------------------------------------------------------------------------------------

  const clock = new THREE.Clock();
  let t = 0;
  const keyDir = new THREE.Vector3();
  const keyRight = new THREE.Vector3();
  const UP_KEY = new THREE.Vector3(0, 0.45, 0);
  const camTarget = new THREE.Vector3();

  function frame(dt, draw = true) {
    const w = journeyWeather();
    stepStory(dt, w);
    applyWeather(w);
    if (camera.zoom !== baseZoom * storyZoom) {
      camera.zoom = baseZoom * storyZoom;
      camera.updateProjectionMatrix();
    }
    if (dt > 0) {
      t += dt;
      stepBoat(dt, t);
      stepWorld(dt, t, w);
      stepParticles(dt, t);
    }
    boat.updateMatrixWorld();
    updateSail(t);
    updateWake(t);
    if (!dithering()) redrawLines(t); // creases are line art only

    // The sea is a fixed-size sheet that follows the boat, snapped to its grid so the waves don't swim.
    const cell = WATER_SIZE / WATER_SEG;
    water.position.set(Math.round(boat.position.x / cell) * cell, 0, Math.round(boat.position.z / cell) * cell);
    seabed.position.set(boat.position.x, -9, boat.position.z);
    const u = waterMat.uniforms;
    u.uTime.value = t;
    u.uSpeed.value = params.waveSpeed;
    u.uHeightScale.value = heightScale;
    u.uDesat.value = params.desaturate;
    u.uMirror.value = params.reflections;
    u.uSparkle.value = w.sparkle;
    camera.getWorldDirection(u.uViewDir.value).negate();
    scene.fog.near = params.fogNear;
    scene.fog.far = params.fogFar;
    routeLine.visible = params.showRoute;
    if (params.showRoute) updateRouteLine(state.s);

    // Ink keeps the same width on screen at any zoom.
    const worldPerPixel = (camera.top - camera.bottom) / camera.zoom / Math.max(1, canvas.clientHeight);
    outline.uOutline.value = worldPerPixel * params.lineWidth * 1.3;
    for (const m of lineMaterials) m.linewidth = params.lineWidth * m.userData.widthFactor;

    // Locked on: the camera rides with the boat, so it stays at the same spot on screen.
    camTarget.copy(boat.position).y += 1.2;
    camera.position.copy(camTarget).addScaledVector(camDir, CAM_DIST);
    camera.lookAt(camTarget);
    if (dithering()) {
      // a studio key over the viewer's left shoulder, like the reference: lit faces
      // toward the camera, shading rolling off to the right and underneath
      keyDir.copy(camera.position).sub(camTarget).normalize().multiplyScalar(0.7);
      keyDir.addScaledVector(keyRight.setFromMatrixColumn(camera.matrixWorld, 0), -0.65).add(UP_KEY).normalize();
      sun.position.copy(boat.position).addScaledVector(keyDir, 60);
    } else {
      sun.position.copy(boat.position).add(new THREE.Vector3(30, 50, 20));
    }
    sun.target.position.copy(boat.position);
    camera.updateMatrixWorld();
    // lay the screen's right and up on the water, for the glints
    camRight3.setFromMatrixColumn(camera.matrixWorld, 0);
    camera.getWorldDirection(camFwd3);
    u.uCamRight.value.set(camRight3.x, camRight3.z).normalize();
    u.uCamFwd.value.set(camFwd3.x, camFwd3.z).normalize();
    const rows = dithering() ? ditherTarget.height : renderer.domElement.height / u.uDotPx.value;
    u.uRowWorld.value = (camera.top - camera.bottom) / camera.zoom / rows / Math.max(Math.abs(camFwd3.y), 0.2);
    if (!draw) return;
    // The mirror image only changes as fast as the boat moves, and the water sways it
    // every frame anyway, so it's redrawn on every other frame.
    if (params.reflections > 0 && reflDue) renderReflection();
    reflDue = !reflDue;
    if (dithering()) {
      ditherMat.uniforms.uCurve.value = params.toneCurve;
      ditherMat.uniforms.uContrast.value = params.contrast;
      ditherMat.uniforms.uBrightness.value = params.brightness;
      ditherMat.uniforms.uTime.value = t;
      renderer.setRenderTarget(ditherTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(printScene, printCamera);
    } else {
      renderer.render(scene, camera);
    }
  }

  // 30 frames a second: plenty for pixel art, and it leaves the page room to scroll.
  let raf = 0;
  let owed = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    const FRAME = isSmall() ? 1 / 24 : 1 / 30;
    owed += clock.getDelta();
    if (owed < FRAME - 0.004) return;
    frame(Math.min(owed, 1 / 20));
    owed = Math.min(Math.max(owed - FRAME, 0), FRAME); // keep the remainder, so the rate holds on any refresh rate
  }

  return {
    /** Fit the canvas. Draws straight away: resizing clears it, and an empty frame flashes. */
    resize() {
      resize();
      frame(0);
    },
    direct,
    /** Sail. Safe to call while already sailing. */
    start() {
      if (raf) return;
      clock.getDelta(); // don't count the time spent stopped
      owed = 0;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    /** One still frame, a few seconds into the voyage (for reduced motion). */
    still() {
      for (let k = 0; k < 150; k++) frame(1 / 30, false);
      reflDue = true;
      frame(0);
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [o.material].flat()) m?.dispose();
      });
      for (const m of [...clayOf.values(), ditherMat]) m.dispose();
      for (const t of [ditherTarget, reflTarget]) t.dispose();
      skyTexture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

// In development, an edit here reloads the page, where it was (lib/dev-reload.ts): the
// scene on screen was built by the old code. (A no-op in builds.)
import.meta.turbopackHot?.dispose(reloadKeepingScroll);
