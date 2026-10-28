// The provider band's picture (../lighthouse-island.tsx): a little island with a
// lighthouse, and the girl standing on it, in the globe's soft clay and print
// (boat.js, printed smooth here), seen from a little above. The light turns, as a real one does: its
// two beams sweep round, shortening as they swing toward you and away, and the
// lantern brightens as a beam passes the front. The girl idles: she breathes,
// shifts her weight, and now and then looks round at the light and back.
//
// createLighthouse(canvas) draws into the canvas; the caller sizes it (resize),
// runs it while it's on screen (start/stop) or draws one frame (still), and frees
// the GPU (dispose).

import * as THREE from "three";
import {
  dotted,
  makeGirl,
  makeLights,
  makePrint,
  materials,
  tuneLights,
} from "./boat";
import { GLOBE_DEFAULTS } from "./scene";
import { reloadKeepingScroll } from "@/lib/dev-reload";

const LIGHT = new THREE.Vector3(-0.55, 0.75, 0.62).normalize();
// Printed smooth, not dotted: the tower and the island are wide mid-greys, which dots
// print as a fine checkerboard, and a fine checkerboard flickers on laptop screens as
// the page scrolls (larger dots still did). The same tone as an even grey keeps the
// print's look (its curve, its ink outline) without the shimmer, like the water.
const DOT = 1;
export const STONE = "#9C958F"; // the island: a warm grey between stone-300 and stone-400, so it prints in tone
const BAND = "#A8A29E"; // stone-400, the tower's bands
const MOSS = "#8A847E"; // the island's grass, a shade under the stone
const IRON = "#78716C"; // stone-500: the door, the railing, the lantern's frames
const GLASS = "#57534E"; // stone-600, the windows
const SEA = "#D9DBE7"; // the globe's lit water, near the shore
const DEEP = "#C3C6D8"; // and a little deeper further out

// Smooth noise (sums of sines, so it's the same every time) for the stone's lumps and
// its mottling, and a seeded random for where the rocks and the grass go.
export const wave3 = (x, y, z) =>
  0.5 * Math.sin(1.7 * x + 2.3 * z + 0.6) * Math.sin(1.9 * z - 1.1 * x + 3 * y) +
  0.3 * Math.sin(3.9 * x - 4.1 * z + 1.3) * Math.sin(4.3 * z + 2.7 * y + 0.4) +
  0.2 * Math.sin(8.3 * x + 7.9 * z + 2.1) * Math.sin(8.9 * z - 6.1 * y + 1.7);
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Shade a geometry per vertex (a grey multiplier from its position). */
export function tint(geometry, shade) {
  const pos = geometry.attributes.position;
  const colours = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const v = shade(pos.getX(i), pos.getY(i), pos.getZ(i));
    colours.set([v, v, v], i * 3);
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  return geometry;
}
export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// stone that takes its shading per vertex, and stone cut in facets (the rocks)
export const weathered = (color) => new THREE.MeshLambertMaterial({ color, vertexColors: true });
export const faceted = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

/** The lighthouse, its foot at the origin, about 4.8 units tall: a tapering tower in
 *  weathered bands on a stone plinth, its door and windows, the gallery and railing,
 *  the lantern room and cap. `beams` (layer 2, drawn over the print) turn in the
 *  lantern; `lantern` brightens as one passes the front. Shared by the provider band's
 *  island (createLighthouse) and the blog's shore (shore.js). */
export function makeTower(m = materials()) {
  const { clay, solid, part } = m;
  const tower = new THREE.Group();
  const H = 3.6;
  const BANDS = 4;
  const r = (y) => 0.72 - (y / H) * 0.27; // the radius at height y
  // weathering: grime rising from the foot, and faint streaks run down from the gallery
  const grime = (y0) => (x, y, z) => {
    const at = y0 + y + (H / BANDS) / 2;
    const streak = Math.max(0, Math.sin(Math.atan2(z, x) * 9 + 0.7)) ** 4;
    return (0.84 + 0.16 * smooth(0, 1.3, at)) * (1 - 0.05 * streak * smooth(H * 0.3, H, at));
  };
  for (let i = 0; i < BANDS; i++) {
    const y0 = (i / BANDS) * H;
    const y1 = ((i + 1) / BANDS) * H;
    const g = tint(new THREE.CylinderGeometry(r(y1), r(y0), y1 - y0, 32, 6), grime(y0));
    const seg = part(g, weathered(i % 2 ? BAND : "#FFFDF8"));
    seg.position.y = (y0 + y1) / 2;
    tower.add(seg);
  }
  // a stone plinth it stands on, a door with a step, and a window or two up the tower
  const plinth = part(new THREE.CylinderGeometry(0.84, 0.9, 0.22, 32), faceted(STONE));
  plinth.position.y = 0.02;
  const door = part(new THREE.BoxGeometry(0.26, 0.44, 0.08), clay(IRON));
  door.position.set(0, 0.34, r(0.34) - 0.02);
  const doorstep = part(new THREE.BoxGeometry(0.4, 0.06, 0.22), faceted(STONE));
  doorstep.position.set(0, 0.1, r(0.1) + 0.12);
  tower.add(plinth, doorstep);
  for (const [y, a] of [[1.5, 0.35], [2.55, -0.75], [3.1, 0.9]]) {
    const win = part(new THREE.BoxGeometry(0.13, 0.22, 0.06), clay(GLASS));
    win.position.set(Math.sin(a) * (r(y) - 0.015), y, Math.cos(a) * (r(y) - 0.015));
    win.rotation.y = a;
    tower.add(win);
  }
  const gallery = part(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 32));
  gallery.position.y = H + 0.05;
  // its railing: a rail on posts all round
  const rail = part(new THREE.TorusGeometry(0.6, 0.014, 6, 48).rotateX(Math.PI / 2), clay(IRON));
  rail.position.y = H + 0.3;
  tower.add(rail);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const post = part(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 4), clay(IRON));
    post.position.set(Math.cos(a) * 0.6, H + 0.2, Math.sin(a) * 0.6);
    tower.add(post);
  }
  const lantern = part(
    new THREE.CylinderGeometry(0.34, 0.34, 0.5, 16),
    solid("#F4F4F2"),
  );
  lantern.position.y = H + 0.35;
  // the lantern's glazing bars
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const bar = part(new THREE.BoxGeometry(0.025, 0.5, 0.025), clay(IRON));
    bar.position.set(Math.cos(a) * 0.345, H + 0.35, Math.sin(a) * 0.345);
    tower.add(bar);
  }
  const cap = part(new THREE.ConeGeometry(0.46, 0.42, 24));
  cap.position.y = H + 0.81;
  const finial = part(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 6));
  finial.position.y = H + 1.12;
  tower.add(door, gallery, lantern, cap, finial);

  // the light: one long beam each way through the lantern, turning. It's light, not
  // a thing, so it's drawn over the print (layer 2) in white, fading from the lantern
  // outward; it fades in inside the lantern too, so where the two halves meet never shows.
  const beams = new THREE.Group();
  beams.position.y = H + 0.35;
  tower.add(beams);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color("#FFFFFF") } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying float vAlong;
      void main() {
        vAlong = uv.y; // 1 at the lantern, 0 at the far end
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vAlong;
      void main() {
        // brightest just outside the lantern, nothing at its middle, fading outward
        float alpha = pow(vAlong, 1.4) * smoothstep(1.0, 0.9, vAlong) * 0.55;
        gl_FragColor = vec4(uColor, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  for (const side of [1, -1]) {
    const g = new THREE.ConeGeometry(0.7, 4.2, 32, 1, true);
    g.translate(0, -2.1, 0); // the cone's tip at the lantern's middle
    g.rotateZ((side * Math.PI) / 2);
    const beam = new THREE.Mesh(g, beamMat);
    beam.layers.set(2);
    beams.add(beam);
  }
  return { tower, lantern, beams, H };
}

/** @param {HTMLCanvasElement} canvas */
export function createLighthouse(canvas) {
  const set = GLOBE_DEFAULTS;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 500);
  const lights = makeLights(LIGHT);
  scene.add(lights.hemi, lights.sun);
  tuneLights(lights, set);
  const print = makePrint();
  print.tune({ ...set, smooth: true });

  const m = materials();
  const { clay, part } = m;

  // the view: from a little above and to one side
  const view = new THREE.Group();
  view.rotation.set(0.42, -0.55, 0);
  scene.add(view);

  // The island: a low dome whose shore wanders (three waves round it, none quite
  // in step), its top lumpy like worn rock, darker and damp where the sea washes it,
  // mottled, with patches of grass on top, and rocks along its edge.
  const R = 3.4;
  const shore = (a) =>
    R *
    (1 +
      0.08 * Math.sin(3 * a + 0.4) +
      0.05 * Math.sin(5 * a + 1.7) +
      0.03 * Math.sin(9 * a + 2.2));
  const TOP = 1.05;
  const islandGeo = new THREE.SphereGeometry(
    1,
    128,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2,
  );
  {
    const pos = islandGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const k = shore(a);
      const bump = 1 + 0.07 * Math.sin(4 * a + y * 5) * y;
      // worn rock: lumps that grow from nothing at the waterline (so the shore stays
      // where the sea's foam is) to a few hundredths up top
      const lump = wave3(x * 3, y * 3, z * 3) * 0.09 * Math.min(1, y * 3);
      pos.setXYZ(i, x * k, y * TOP * bump + lump, z * k);
    }
    islandGeo.computeVertexNormals();
  }
  tint(islandGeo, (x, y, z) => {
    const h = y / TOP; // 0 at the waterline, 1 at the top
    const damp = 1 - 0.24 * (1 - smooth(0, 0.2, h)); // wet stone at the edge
    const mottle = 0.94 + 0.1 * wave3(x * 1.6, 0.3, z * 1.6) + 0.05 * wave3(x * 5, y, z * 5);
    const grass = smooth(0.15, 0.4, wave3(x * 0.9 + 2, 1, z * 0.9 - 1)) * smooth(0.45, 0.7, h);
    return damp * mottle * (1 - 0.13 * grass) * (1 + 0.05 * h);
  });
  const island = part(islandGeo, weathered(STONE));
  view.add(island);
  const ground = (x, z) => {
    const k = shore(Math.atan2(z, x));
    return TOP * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / (k * k)));
  };
  // rocks: some along the shore, a few out in the shallows, a couple up top
  const rng = seeded(7);
  const rocks = [
    [0.5, 0.32, 0], [0.75, 0.16, 0], [2.3, 0.24, 0], [2.55, 0.12, 0],
    [5.6, 0.2, 0], [5.35, 0.11, 0], [4.1, 0.16, 0], [3.4, 0.14, 0],
    [1.3, 0.13, 0.45], [3.9, 0.1, 0.5], [5.9, 0.09, 0.4],
  ];
  for (const [a, size, out] of rocks) {
    const g = new THREE.DodecahedronGeometry(size, 0);
    g.scale(1 + rng() * 0.4, 0.6 + rng() * 0.3, 1 + rng() * 0.3);
    const rock = part(g, faceted(STONE));
    const d = shore(a) - size * 0.4 + out;
    rock.position.set(Math.cos(a) * d, size * 0.2, Math.sin(a) * d);
    rock.rotation.set(rng() * 3, rng() * 6, rng() * 3);
    view.add(rock);
  }
  for (const [x, z, size] of [[1.9, -0.6, 0.14], [-1.6, 1.1, 0.11]]) {
    const rock = part(new THREE.DodecahedronGeometry(size, 0).scale(1.3, 0.6, 1), faceted(STONE));
    rock.position.set(x, ground(x, z) + size * 0.15, z);
    rock.rotation.y = rng() * 6;
    view.add(rock);
  }
  // tufts of grass: little bunches of blades, leaning every way
  const blade = new THREE.ConeGeometry(0.025, 1, 4).translate(0, 0.5, 0);
  const grassMat = clay(MOSS);
  for (const [x, z] of [[1.6, 0.3], [-0.4, 1.5], [0.2, -1.6], [-1.9, -0.4], [2.2, 1.0], [-1.2, 0.6], [0.6, 2.2]]) {
    const tuft = new THREE.Group();
    tuft.position.set(x, ground(x, z) - 0.02, z);
    for (let i = 0; i < 7; i++) {
      const b = part(blade, grassMat);
      b.scale.set(1, 0.12 + rng() * 0.14, 1);
      b.position.set((rng() - 0.5) * 0.14, 0, (rng() - 0.5) * 0.14);
      b.rotation.set((rng() - 0.5) * 0.9, 0, (rng() - 0.5) * 0.9);
      tuft.add(b);
    }
    view.add(tuft);
  }

  // The sea, half again as wide as before, isn't printed: it's drawn straight to the
  // canvas under the print (layer 3), in the globe's lavender, fading out into the
  // band's grey at its edge (no outline). Swells roll in toward the shore from no one
  // side (their strength drifts round the island, so a wave comes now from the left,
  // now from the right), break in foam along the shore, and fleck the water as they go.
  const SEA_R = 6.45;
  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSea: { value: new THREE.Color(SEA) },
      uDeep: { value: new THREE.Color(DEEP) },
      uFoam: { value: new THREE.Color("#FFFFFF") },
      uR: { value: R },
      uSeaR: { value: SEA_R },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vXZ = position.xz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSea;
      uniform vec3 uDeep;
      uniform vec3 uFoam;
      uniform float uR;
      uniform float uSeaR;
      varying vec2 vXZ;
      float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      void main() {
        float r = length(vXZ);
        float a = atan(vXZ.y, vXZ.x);
        float shore = uR * (1.0 + 0.08 * sin(3.0 * a + 0.4) + 0.05 * sin(5.0 * a + 1.7) + 0.03 * sin(9.0 * a + 2.2));
        float d = r - shore; // out to sea from the shore
        // deeper further out, then gone into the grey at the edge
        vec3 col = mix(uSea, uDeep, smoothstep(0.0, uSeaR - uR, d) * 0.5);
        float alpha = 1.0 - smoothstep(uSeaR * 0.62, uSeaR, r);
        // swells rolling in: their strength drifts round the island
        float side = 0.5 + 0.5 * sin(a * 1.0 - uTime * 0.23) * sin(a * 2.0 + uTime * 0.17 + 1.3);
        float wobble = noise(vec2(a * 3.0, uTime * 0.2)) * 0.8;
        float swell = sin(d * 4.2 + uTime * 1.6 + wobble * 3.0);
        float crest = smoothstep(0.82, 1.0, swell) * side * (1.0 - smoothstep(0.0, 2.2, d));
        // foam breaking along the shore, its edge washing in and out unevenly
        float wash = 0.22 + 0.14 * sin(uTime * 1.3 + a * 3.0 + wobble * 4.0);
        float surf = 1.0 - smoothstep(wash * 0.5, wash, d);
        // flecks where the swells break up
        float fleck = step(0.86, noise(vXZ * 6.0 + vec2(uTime * 0.3, -uTime * 0.2))) * (1.0 - smoothstep(0.0, 1.6, d)) * 0.5;
        col = mix(col, uFoam, clamp(crest * 0.7 + surf * 0.85 + fleck, 0.0, 1.0));
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(SEA_R, 96).rotateX(-Math.PI / 2),
    seaMat,
  );
  sea.layers.set(3);
  view.add(sea);

  const { tower, lantern, beams } = makeTower(m);
  tower.position.set(-0.5, ground(-0.5, -0.3) - 0.05, -0.3);
  view.add(tower);

  // the girl, standing on the island a little in front of the tower: the one thing
  // printed in the globe's dots, so she stands out from the smooth stone
  const { girl, head } = makeGirl(dotted());
  const gx = 0.9;
  const gz = 0.9;
  const GIRL = 2.3;
  girl.scale.setScalar(GIRL);
  girl.position.set(gx, ground(gx, gz) - 0.02, gz);
  girl.rotation.y = 0.35;
  view.add(girl);

  let t = 0;
  function step(dt) {
    t += dt;
    // the light turns at a lighthouse's pace (about a turn every eight seconds)
    beams.rotation.y = t * 0.78;
    // the lantern brightens as a beam passes the front
    const front = Math.abs(
      Math.cos(beams.rotation.y - view.rotation.y - Math.PI / 2),
    );
    lantern.material.color
      .set("#E7E5E4")
      .lerp(new THREE.Color("#FFFFFF"), front);
    seaMat.uniforms.uTime.value = t;
    // the girl idles: breathing, a slow shift of weight, and now and then a look
    // round at the light (eased in and out), then back
    girl.scale.set(GIRL, GIRL * (1 + Math.sin(t * 2.1) * 0.012), GIRL);
    girl.rotation.z = Math.sin(t * 0.7) * 0.035;
    const look = Math.max(0, Math.sin(t * 0.35)) ** 3;
    head.rotation.y = -look * 1.1 + Math.sin(t * 0.9) * 0.05;
    head.rotation.x = -look * 0.15;
  }

  function resize() {
    // A whole number of device pixels, drawn one for one: the box the canvas fills is
    // rarely that (453 CSS px is 566.25 at 1.25×), and drawn pixel for pixel a canvas a
    // fraction off repeats a column of dots somewhere, a column that moves as the page
    // scrolls, so the dotted tower and island ripple. So the canvas is cut to the whole
    // pixels inside its box and sized to match.
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    const box = (canvas.parentElement ?? canvas).getBoundingClientRect();
    const dw = Math.max(1, Math.floor(box.width * pr));
    const dh = Math.max(1, Math.floor(box.height * pr));
    const w = dw / pr;
    const h = dh / pr;
    renderer.setPixelRatio(pr);
    renderer.setSize((dw + 0.5) / pr, (dh + 0.5) / pr, false); // canvas.width = floor(that × pr) = dw
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h * 0.74;
    camera.bottom = -h * 0.26;
    camera.updateProjectionMatrix();
    // the scene about as wide as the canvas
    view.scale.setScalar(Math.min(w / 13, h / 8.2));
    print.resize(renderer, DOT);
  }

  function render() {
    renderer.setRenderTarget(print.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    camera.layers.set(3);
    renderer.render(scene, camera);
    renderer.render(print.scene, print.camera);
    // and the light over it
    camera.layers.set(2);
    renderer.render(scene, camera);
    camera.layers.set(0);
  }

  const clock = new THREE.Clock(false);
  let raf = 0;
  function loop() {
    raf = requestAnimationFrame(loop);
    step(Math.min(clock.getDelta(), 0.1));
    render();
  }

  resize();
  return {
    resize() {
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
    /** One frame (for reduced motion): a beam across the front, the girl at rest. */
    still() {
      t = 2;
      step(0);
      render();
    },
    dispose() {
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const mat of [o.material].flat()) mat?.dispose();
      });
      print.dispose();
      renderer.dispose();
    },
  };
}

// In development, an edit here reloads the page, where it was (lib/dev-reload.ts): the
// scene on screen was built by the old code. (A no-op in builds.)
import.meta.turbopackHot?.dispose(reloadKeepingScroll);
