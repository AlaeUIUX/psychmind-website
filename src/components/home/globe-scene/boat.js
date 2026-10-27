// The girl's boat in its print, shared by the privacy globe (scene.js) and the
// miniature that sails down to the founders' letter (../voyage-boat.js): the
// hero's boat without its mast and sail, in soft clay, and the hero's dot print.
//
// The boat is drawn into a target one texel per dot, then printed as the hero's
// is: every dot ink or paper by an 8×8 ordered (Bayer) threshold, the tone in how
// many are ink. The dress writes half alpha, the print's mark for "colour".

import * as THREE from "three";

const INK = "#1C1917"; // stone-900, the page's ink
const PAPER = "#FFFDF8";
const CRIMSON = "#C01048";
const GLOW = "#FFD58E";

/** The boat: `hull` rides the water (pitch, roll, heave), `girl` stands at its bow.
 *  Bow toward +z, up +y, one unit about a fifth of its length. */
export function makeBoat() {
  const clay = (color) => new THREE.MeshLambertMaterial({ color });
  const solid = (color) => new THREE.MeshBasicMaterial({ color });
  const PAPER_FILL = clay(PAPER);
  const DRESS = new THREE.MeshBasicMaterial({
    color: CRIMSON,
    transparent: true,
    opacity: 0.5,
    blending: THREE.NoBlending,
  });
  const part = (geometry, material = PAPER_FILL) =>
    new THREE.Mesh(geometry, material);

  const hull = new THREE.Group();
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
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.55,
      bevelEnabled: false,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.28, 0);
    hull.add(part(g));

    const cabin = part(new THREE.BoxGeometry(0.95, 0.55, 0.62));
    cabin.position.set(0, 0.52, -0.95);
    const roof = part(new THREE.BoxGeometry(1.05, 0.08, 0.72));
    roof.position.set(0, 0.83, -0.95);
    const win = part(new THREE.PlaneGeometry(0.22, 0.2), solid(GLOW));
    win.position.set(0.48, 0.55, -0.95);
    win.rotation.y = Math.PI / 2;
    hull.add(cabin, roof, win);
    // the cargo (whatever it is)
    for (const [x, z, sz] of [
      [0.32, 0.55, 0.32],
      [-0.3, 0.75, 0.26],
      [0.25, 0.9, 0.22],
    ]) {
      const crate = part(new THREE.BoxGeometry(sz, sz, sz));
      crate.position.set(x, 0.25 + sz / 2, z);
      crate.rotation.y = x * 1.3;
      hull.add(crate);
    }
    const pole = part(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6));
    pole.position.set(-0.45, 0.7, -1.35);
    const lantern = part(new THREE.BoxGeometry(0.14, 0.16, 0.14), solid(GLOW));
    lantern.position.set(-0.45, 1.18, -1.35);
    hull.add(pole, lantern);
  }

  // The girl at the bow, looking ahead (her size is a setting).
  const girl = new THREE.Group();
  girl.position.set(0, 0.25, 0.95);
  hull.add(girl);
  {
    const legs = part(new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8));
    legs.position.y = 0.08;
    const body = part(new THREE.ConeGeometry(0.15, 0.34, 10), DRESS);
    body.position.y = 0.32;
    const head = part(new THREE.SphereGeometry(0.11, 14, 10));
    head.position.y = 0.56;
    const hair = part(
      new THREE.SphereGeometry(
        0.115,
        14,
        10,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.62,
      ),
      solid(INK),
    );
    hair.position.set(0, 0.575, -0.02);
    hair.rotation.x = -0.5;
    const bun = part(new THREE.SphereGeometry(0.05, 10, 8), solid(INK));
    bun.position.set(0, 0.64, -0.13);
    girl.add(legs, body, head, hair, bun);
  }
  return { hull, girl };
}

/** The boat's clay lighting: a key light from the upper left and a hemisphere fill.
 *  `light` is the key's direction. Tune with `tuneLights`. */
export function makeLights(light) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000);
  const sun = new THREE.DirectionalLight(0xffffff);
  sun.position.copy(light);
  return { hemi, sun };
}

export function tuneLights({ hemi, sun }, set) {
  sun.intensity = set.keyLight;
  hemi.intensity = set.fillLight;
  hemi.groundColor.setRGB(
    set.underside,
    set.underside,
    set.underside,
    THREE.SRGBColorSpace,
  );
}

/** The print: render the boat into `target`, then draw `scene` with `camera` over the
 *  canvas. `resize` fits it to the canvas, `tune` takes the print settings. */
export function makePrint() {
  const linear = (hex) => new THREE.Color(hex);
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
  });
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tBoat: { value: target.texture },
      uSize: { value: new THREE.Vector2(1, 1) },
      uDotPx: { value: 1 },
      uInk: { value: linear(INK) },
      uPaper: { value: linear(PAPER) },
      uCurve: { value: 1 },
      uContrast: { value: 1 },
      uBrightness: { value: 0 },
      uOutline: { value: 1 },
      uDressColour: { value: 1 },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tBoat;
      uniform vec2 uSize;
      uniform float uDotPx;
      uniform vec3 uInk;
      uniform vec3 uPaper;
      uniform float uCurve;
      uniform float uContrast;
      uniform float uBrightness;
      uniform float uOutline;
      uniform float uDressColour;
      float bayer2(vec2 a) { a = mod(floor(a), 2.0); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
      #define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
      #define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
      void main() {
        vec2 cell = floor(gl_FragCoord.xy / uDotPx);
        vec2 at = (cell + 0.5) / uSize;
        vec4 texel = texture2D(tBoat, at);
        if (texel.a < 0.25) discard; // not the boat
        // her outline, uOutline dots of ink wide, so her paper holds against the page's grey
        float rim = 1.0;
        for (int i = 1; i <= 3; i++) {
          if (float(i) > uOutline) break;
          vec2 dx = vec2(float(i) / uSize.x, 0.0);
          vec2 dy = vec2(0.0, float(i) / uSize.y);
          rim = min(rim, min(min(texture2D(tBoat, at + dx).a, texture2D(tBoat, at - dx).a), min(texture2D(tBoat, at + dy).a, texture2D(tBoat, at - dy).a)));
        }
        if (rim < 0.25) {
          gl_FragColor = vec4(uInk, 1.0);
        } else if (texel.a < 0.75 && uDressColour > 0.5) {
          gl_FragColor = vec4(texel.rgb, 1.0); // the dress: a colour pixel
        } else {
          // the hero's tone: its curve, contrast and brightness
          float tone = pow(max(dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722)), 0.0), uCurve / 2.2);
          tone = (tone - 0.5) * uContrast + 0.5 + uBrightness;
          gl_FragColor = vec4(tone > bayer8(cell) ? uPaper : uInk, 1.0);
        }
        #include <colorspace_fragment>
      }
    `,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    target,
    scene,
    camera,
    /** Fit to the canvas: a dot is `dotSize` CSS px, in whole device pixels (or the pattern beats). */
    resize(renderer, dotSize) {
      const dot = Math.max(1, Math.round(dotSize * renderer.getPixelRatio()));
      const dw = Math.ceil(renderer.domElement.width / dot);
      const dh = Math.ceil(renderer.domElement.height / dot);
      target.setSize(dw, dh);
      material.uniforms.uSize.value.set(dw, dh);
      material.uniforms.uDotPx.value = dot;
    },
    tune(set) {
      const u = material.uniforms;
      u.uCurve.value = set.toneCurve;
      u.uContrast.value = set.contrast;
      u.uBrightness.value = set.brightness;
      u.uOutline.value = set.outline;
      u.uDressColour.value = set.dressColour ? 1 : 0;
    },
    dispose() {
      target.dispose();
      quad.geometry.dispose();
      material.dispose();
    },
  };
}
