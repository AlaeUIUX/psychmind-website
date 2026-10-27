"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, Volume2Icon, VolumeXIcon } from "@/components/ui/hugeicons";
import { getLenis } from "@/components/motion/smooth-scroll";
import { MOTION_OK } from "@/lib/gsap";
import type { createBoatScene } from "./boat-scene/scene";
import { StorySubtitle } from "./story-subtitle";

// The band under the hero, after sort.to's showcase: a pause between the search
// and the rest of the page. A boat sails across it (boat-scene/scene.js), close
// under the search so it's in view on arrival, inside an ellipse whose cloudy rim
// dissolves into the page. The scene loads after the page, runs only while the
// band is on screen, and holds a still frame for reduced motion. Without WebGL the
// old painting stands in, faded at the edges the same way.
//
// Hovering shows a play button that trails the cursor; touch screens get a round
// one in the middle instead. The story zooms in on the boat while a narrator's
// lines play as subtitles (story-subtitle.tsx): the visitor's own questions (once
// the questions band's), a squall at the last of them, then the sky clears as
// PsychMind shows the way, and the view eases back out. With reduced motion the
// lines play over the still frame. Rain-and-piano music plays under it
// (self-hosted, loaded only on play), with a mute button while it runs.

// "Watching the rain" by konstantinpazuzustudio, trimmed to the story with fades.
// TODO(client): confirm the track's licence covers use on the site.
const MUSIC = "/audio/story-rain-piano.mp3";
const MUSIC_VOLUME = 0.42;

// The music plays through a Web Audio gain node: iOS ignores an audio element's
// volume, and gain fades run on the audio clock, so they finish in a background tab
// too (requestAnimationFrame stops there). Without Web Audio it falls back to
// element volume.
type Music = { el: HTMLAudioElement; gain: GainNode | null; ctx: AudioContext | null; fade: number; after: number };

function createMusic(): Music {
  const el = new Audio(MUSIC);
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  try {
    ctx = new AudioContext();
    gain = ctx.createGain();
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
  } catch {
    ctx = null;
    gain = null;
  }
  return { el, gain, ctx, fade: 0, after: 0 };
}

/** Ease the music to `to` over `seconds`, then call `done`. A new fade replaces one under way. */
function fadeMusic(m: Music, to: number, seconds: number, done?: () => void) {
  window.clearInterval(m.fade);
  window.clearTimeout(m.after);
  if (m.gain && m.ctx) {
    const g = m.gain.gain;
    const now = m.ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + seconds);
  } else {
    const from = m.el.volume;
    const start = performance.now();
    m.fade = window.setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / (seconds * 1000));
      m.el.volume = from + (to - from) * k;
      if (k === 1) window.clearInterval(m.fade);
    }, 40);
  }
  if (done) m.after = window.setTimeout(done, seconds * 1000);
}

function silence(m: Music) {
  window.clearInterval(m.fade);
  window.clearTimeout(m.after);
  if (m.gain && m.ctx) m.gain.gain.setValueAtTime(0, m.ctx.currentTime);
  else m.el.volume = 0;
}

type Scene = ReturnType<typeof createBoatScene>;
type Beat = {
  /** seconds from the start */
  at: number;
  line: string | null;
  zoom?: number;
  weather?: string | null;
};

// TODO(client): approve the narration. All of it is draft copy; the four questions
// come from the old questions band, whose wording was never approved either.
const STORY: Beat[] = [
  { at: 0, line: "You might be wondering, just like the girl in the boat…", zoom: 1.45 },
  { at: 4.5, line: "Where do I even start?" },
  { at: 8, line: "Who can I actually trust?" },
  { at: 11.5, line: "Will they understand me?" },
  { at: 15, line: "What will this cost?" },
  { at: 18.5, line: "You might even ask: how long will this journey take?", weather: "squall" },
  { at: 24.5, line: "But fear not.", weather: "sunny" },
  { at: 28, line: "PsychMind will help you find the way." },
  { at: 33, line: null, zoom: 1, weather: null },
];
const STORY_END = 35;

export function Showcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const movingRef = useRef(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [muted, setMuted] = useState(false);
  const musicRef = useRef<Music | null>(null);
  const muteRef = useRef<HTMLButtonElement>(null);
  const playPillRef = useRef<HTMLButtonElement>(null);
  const playRoundRef = useRef<HTMLButtonElement>(null);
  const byKeyboard = useRef(false);

  // Start inside the click itself: browsers only let sound start from a gesture.
  const startStory = (e: MouseEvent<HTMLButtonElement>) => {
    if (playing) return;
    byKeyboard.current = e.detail === 0; // Enter or Space: keep the keyboard's place (see below)
    const music = musicRef.current ?? createMusic();
    musicRef.current = music;
    silence(music); // a fade-out from the last story (and its pause) must not reach this one
    music.el.muted = muted;
    music.el.currentTime = 0;
    music.ctx?.resume().catch(() => {});
    music.el
      .play()
      .then(() => fadeMusic(music, MUSIC_VOLUME, 1.2))
      .catch(() => {}); // no sound is fine: the story keeps time without it
    setPlaying(true);

    // Bring the boat and the subtitles (from about 45% to 88% down the band) into
    // view: the middle of the band on a tall screen; on a short one, that stretch
    // centred in the room below the site header (the same 96px the page's anchors
    // leave). The band starts high on the page, so on arrival they're cut off.
    const band = sectionRef.current;
    if (band) {
      const vh = window.innerHeight;
      const h = band.offsetHeight;
      const HEADER = 96;
      const offset = vh >= h ? -(vh - h) / 2 : 0.665 * h - (vh + HEADER) / 2;
      const top = band.getBoundingClientRect().top + window.scrollY + offset;
      if (Math.abs(top - window.scrollY) > 24) {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(top, { duration: 1.4 });
        else window.scrollTo({ top, behavior: movingRef.current ? "smooth" : "auto" });
      }
    }
  };
  const toggleMute = () => {
    if (musicRef.current) musicRef.current.el.muted = !muted;
    setMuted(!muted);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    import("./boat-scene/scene")
      .then(({ createBoatScene }) => {
        if (disposed) return;
        const scene = createBoatScene(canvas);
        sceneRef.current = scene;
        const moving = window.matchMedia(MOTION_OK);
        movingRef.current = moving.matches;
        let onScreen = false;
        let stilled = false;

        const play = () => {
          if (onScreen && moving.matches) scene.start();
          else scene.stop();
        };
        const resize = () => {
          scene.resize(); // redraws at once, so resizing never shows an empty band
          if (!moving.matches && !stilled) {
            scene.still(); // once: settling again on every resize would change the picture
            stilled = true;
          }
        };

        const sizer = new ResizeObserver(resize);
        sizer.observe(canvas);
        const watcher = new IntersectionObserver((entries) => {
          onScreen = entries[entries.length - 1].isIntersecting; // the latest, if several queued up
          play();
        });
        watcher.observe(canvas);
        const onMotionChange = () => {
          movingRef.current = moving.matches;
          // turned off mid-story: settle the still frame on the voyage, not the story's zoom and squall
          if (!moving.matches) scene.direct({ zoom: 1, weather: null });
          stilled = false;
          resize();
          play();
        };
        moving.addEventListener("change", onMotionChange);
        // A new pixel ratio (browser zoom, or the window moving to another screen)
        // doesn't always resize the canvas, so it's watched on its own.
        let ratio: MediaQueryList | null = null;
        const onRatio = () => {
          resize();
          watchRatio();
        };
        const watchRatio = () => {
          ratio?.removeEventListener("change", onRatio);
          ratio = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
          ratio.addEventListener("change", onRatio);
        };
        watchRatio();
        resize(); // draw the first frame before the canvas fades in
        setReady(true);

        cleanup = () => {
          sizer.disconnect();
          watcher.disconnect();
          moving.removeEventListener("change", onMotionChange);
          ratio?.removeEventListener("change", onRatio);
          sceneRef.current = null;
          scene.dispose();
        };
      })
      .catch(() => {
        // no WebGL (or the chunk failed to load): fall back to the painting
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Run the story: each beat's line, and (with motion) its zoom and weather. It keeps
  // time with the music while the music plays, so the two can't drift apart (timers
  // slow right down in a background tab; the audio doesn't), and by the wall clock
  // when there's no sound. It never lags the wall clock by more than two seconds,
  // so a stalled download can't hold it up.
  useEffect(() => {
    if (!playing) return;
    const music = musicRef.current;
    const started = performance.now();
    let clock = 0;
    let next = 0;
    const tick = () => {
      const wall = (performance.now() - started) / 1000;
      const heard = music && !music.el.paused ? Math.max(music.el.currentTime, wall - 2) : wall;
      clock = Math.max(clock, heard);
      while (next < STORY.length && STORY[next].at <= clock) {
        const b = STORY[next];
        setBeat(next);
        if (movingRef.current) sceneRef.current?.direct({ zoom: b.zoom, weather: b.weather });
        next++;
      }
      if (clock >= STORY_END) {
        setPlaying(false);
        setBeat(-1);
      }
    };
    tick();
    const timer = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(timer);
      sceneRef.current?.direct({ zoom: 1, weather: null }); // cut short: ease back to the voyage
      if (music) fadeMusic(music, 0, 1.5, () => music.el.pause());
    };
  }, [playing]);

  // Leaving the page mid-story: stop the music outright.
  useEffect(
    () => () => {
      const music = musicRef.current;
      if (!music) return;
      silence(music);
      music.el.pause();
      music.ctx?.close().catch(() => {});
    },
    [],
  );

  const line = beat >= 0 ? STORY[beat].line : null;

  // The play button trails the pointer across the band, a step behind it, and
  // drifts back to the middle when the pointer leaves. It moves by transform (no
  // layout), eased each frame toward the pointer; a CSS transition restarts on every
  // pointer move and never catches up.
  const followRef = useRef<HTMLDivElement>(null);
  const trail = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, last: 0 });
  const chase = (now: number) => {
    const s = trail.current;
    const el = followRef.current;
    const dt = Math.min(0.05, (now - (s.last || now)) / 1000);
    s.last = now;
    const k = movingRef.current ? 1 - Math.exp(-dt / 0.07) : 1; // ~70 ms behind
    s.x += (s.tx - s.x) * k;
    s.y += (s.ty - s.y) * k;
    if (el) el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    const settled = Math.abs(s.tx - s.x) < 0.3 && Math.abs(s.ty - s.y) < 0.3;
    s.raf = settled ? 0 : requestAnimationFrame(chase);
    if (settled) s.last = 0;
  };
  const aim = (tx: number, ty: number) => {
    const s = trail.current;
    s.tx = tx;
    s.ty = ty;
    if (!s.raf) s.raf = requestAnimationFrame(chase);
  };
  const follow = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    // offset from the middle, kept clear of the faded rim where it would float on bare page
    const dx = e.clientX - box.left - box.width / 2;
    const dy = e.clientY - box.top - box.height / 2;
    aim(Math.max(-0.32, Math.min(0.32, dx / box.width)) * box.width, Math.max(-0.32, Math.min(0.32, dy / box.height)) * box.height);
  };
  const recentre = () => aim(0, 0);
  useEffect(() => () => cancelAnimationFrame(trail.current.raf), []);

  // Keep the keyboard's place. Play disappears while the story runs and Mute appears,
  // so a story started from the keyboard moves focus to Mute, and back to Play when
  // it ends (unless focus has gone elsewhere meanwhile).
  useEffect(() => {
    if (playing) {
      const s = trail.current; // Play comes back centred, so its trail restarts there
      s.x = s.y = s.tx = s.ty = 0;
    }
    if (!byKeyboard.current) return;
    if (playing) {
      muteRef.current?.focus();
    } else {
      const play = [playPillRef.current, playRoundRef.current].find((b) => b && b.offsetParent !== null);
      if (document.activeElement === document.body) play?.focus();
      byKeyboard.current = false;
    }
  }, [playing]);

  return (
    <section
      ref={sectionRef}
      onPointerMove={follow}
      onPointerLeave={recentre}
      className="group relative mt-6 h-[600px] w-full bg-cover bg-center sm:h-[680px]"
      style={
        failed
          ? {
              backgroundImage: "url(/images/home/showcase-painting.jpg)",
              maskImage: "radial-gradient(ellipse closest-side, black 60%, transparent)",
            }
          : undefined
      }
    >
      {!failed && (
        <canvas
          ref={canvasRef}
          aria-hidden
          // fades in once the scene has drawn, instead of popping onto the page
          className={`pointer-events-none block size-full transition-opacity duration-1000 ease-out motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {ready && !playing && (
        <div
          ref={followRef}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 will-change-transform"
        >
          {/* with a mouse: the labelled pill, shown on hover */}
          <Button
            variant="primary"
            size="md"
            ref={playPillRef}
            onClick={startStory}
            className="pointer-events-auto opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:hidden"
          >
            <PlayIcon />
            {/* TODO(client): new microcopy */}
            Play the story
          </Button>
          {/* on touch screens (no hover): a round play button in the middle, styled like the mute button */}
          <Button
            variant="secondary"
            size="icon"
            ref={playRoundRef}
            onClick={startStory}
            aria-label="Play the story"
            className="pointer-events-auto hidden animate-in fade-in-0 duration-1000 [@media(hover:none)]:inline-flex"
          >
            <PlayIcon />
          </Button>
        </div>
      )}

      {playing && (
        // positioned by a wrapper: Button keeps its own \`relative\`
        <div className="absolute top-[16%] right-[14%] animate-in fade-in-0 duration-500">
          <Button
            variant="secondary"
            size="icon-sm"
            ref={muteRef}
            onClick={toggleMute}
            aria-pressed={muted} // one label, pressed or not: "Unmute, pressed" reads backwards
            aria-label="Mute the music" /* TODO(client): new microcopy */
          >
            {muted ? <VolumeXIcon /> : <Volume2Icon />}
          </Button>
        </div>
      )}

      <StorySubtitle line={line} />
    </section>
  );
}
