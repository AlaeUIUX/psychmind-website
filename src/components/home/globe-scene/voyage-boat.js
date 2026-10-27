// The girl's boat on her way down to the founders' letter (../voyage.tsx): the
// privacy globe's boat (boat.js), at its size and in its print and light, drawn
// alone on a small transparent canvas that rides along her route.
//
// The page tells her which way the route goes (steer) and she turns to it at
// once, round on her keel: right, bow toward you going down the page, left. A
// light spring smooths the turn. On top of that she rocks gently on a little
// swell, and leans a touch into turns and as she speeds up or slows.
//
// createVoyageBoat(canvas) draws into the canvas; the caller sizes it (resize),
// steers it, runs it while it's on screen (start/stop) or draws one frame (still),
// and frees the GPU (dispose).

import * as THREE from "three";
import { makeBoat, makeLights, makePrint, tuneLights } from "./boat";
import { GLOBE_DEFAULTS } from "./scene";

const LIGHT = new THREE.Vector3(-0.55, 0.75, 0.62).normalize();
const WATERLINE = 0.62; // where her waterline sits on the canvas, from the top

/** @param {HTMLCanvasElement} canvas */
export function createVoyageBoat(canvas) {
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
  print.tune(set);

  // view: seen from a little above, as on the globe; yaw: her heading about her
  // mast; then the hull, which rocks
  const view = new THREE.Group();
  view.rotation.x = set.tilt;
  scene.add(view);
  const yaw = new THREE.Group();
  view.add(yaw);
  const { hull, girl } = makeBoat();
  girl.scale.setScalar(set.girl);
  yaw.add(hull);

  // where she's told to go, and her springs
  const aim = { yaw: Math.PI / 2, speed: 0 };
  const ride = {
    yaw: Math.PI / 2,
    vyaw: 0,
    pitch: 0,
    vp: 0,
    roll: 0,
    vr: 0,
    y: 0,
    vy: 0,
  };
  let speed = 0;
  let t = 0;

  function step(dt) {
    t += dt;
    // rocking: soft and well damped (the globe's springs are livelier, on a swell she's always on)
    const k = 14;
    const c = 5.5;
    // her speed along the route, smoothed: changes in it are what tip her
    const before = speed;
    aim.speed *= Math.exp(-dt * 3); // told only while she moves: left alone, she slows
    speed += (aim.speed - speed) * Math.min(1, dt * 4);
    const accel = (speed - before) / Math.max(dt, 1e-3);
    // the swell under her, two long waves
    const swell = Math.sin(t * 1.7) * 0.04 + Math.sin(t * 2.9 + 1.3) * 0.02;
    const pitchTarget =
      Math.sin(t * 1.3) * 0.05 - Math.max(-0.1, Math.min(0.1, accel * 0.0006));
    const rollTarget =
      Math.sin(t * 1.9 + 0.7) * 0.04 +
      Math.max(-0.12, Math.min(0.12, ride.vyaw * 0.04));
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    const s = dt / n;
    for (let i = 0; i < n; i++) {
      ride.vyaw += (90 * (aim.yaw - ride.yaw) - 19 * ride.vyaw) * s; // her heading: quick, no overshoot
      ride.yaw += ride.vyaw * s;
      ride.vp += (k * (pitchTarget - ride.pitch) - c * ride.vp) * s;
      ride.pitch += ride.vp * s;
      ride.vr += (k * (rollTarget - ride.roll) - c * ride.vr) * s;
      ride.roll += ride.vr * s;
      ride.vy += (k * (swell - ride.y) - c * ride.vy) * s;
      ride.y += ride.vy * s;
    }
    yaw.rotation.y = ride.yaw;
    hull.rotation.set(ride.pitch, 0, ride.roll);
    hull.position.y = ride.y;
  }

  let H = 1;
  function resize() {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    H = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    // in CSS px, the waterline through the middle-ish
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h * WATERLINE;
    camera.bottom = -h * (1 - WATERLINE);
    camera.updateProjectionMatrix();
    view.scale.setScalar(set.size);
    print.resize(renderer, set.dotSize);
  }

  function render() {
    renderer.setRenderTarget(print.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(print.scene, print.camera);
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
    /** Where her waterline sits on the canvas, in CSS px from its top-left. */
    get anchor() {
      return { x: canvas.clientWidth / 2, y: H * WATERLINE };
    },
    resize() {
      resize();
      render();
    },
    /** heading: which way the route goes, as atan2(dx, dy) on the page (π/2 right,
     *  0 down the page, toward you, -π/2 left); speed: px a second along it. */
    steer(heading, px) {
      aim.yaw = heading;
      aim.speed = px;
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
    /** One frame, settled (for reduced motion). */
    still() {
      ride.yaw = aim.yaw;
      for (let i = 0; i < 90; i++) step(1 / 30);
      render();
    },
    dispose() {
      cancelAnimationFrame(raf);
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [o.material].flat()) m?.dispose();
      });
      print.dispose();
      renderer.dispose();
    },
  };
}
