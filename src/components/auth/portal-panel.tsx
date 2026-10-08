"use client";

import { cn } from "cn";
import {
  BadgeCheckIcon,
  BellIcon,
  KeyRoundIcon,
  MailIcon,
  MapPinIcon,
  MonitorIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { providerPhoto } from "@/lib/photos";
import { useAuthPanel } from "./auth-context";

// The right half of every auth screen: a quiet sheet of gray paper with live
// product scenes on it, instead of a stock photo. It stays mounted while people move between auth pages and
// cross-fades to a scene that matches the step — product cards on log in, a
// role preview while choosing, the provider's own profile card filling in as
// they type, a matching scene for patients, an inbox while they verify.
// Ambient layer: paper grain, faint rules and a breathing ring (a calm
// 8-second cycle).
// TODO(client): scene captions are new copy.

type SceneKey = "login" | "role" | "provider" | "patient" | "inbox" | "key";

function sceneFor(path: string): SceneKey {
  if (path.startsWith("/signup/provider")) return "provider";
  if (path.startsWith("/signup/patient")) return "patient";
  if (path.startsWith("/signup")) return "role";
  if (path.startsWith("/verify-email")) return "inbox";
  if (path.startsWith("/forgot-password") || path.startsWith("/reset-password")) return "key";
  return "login";
}

const captions: Record<SceneKey, { title: string; body: string }> = {
  login: { title: "Pick up right where you left off.", body: "Your profile, requests and progress — all in one place." },
  role: { title: "One home for both sides of care.", body: "People looking for support, and the providers who offer it." },
  provider: { title: "This is you on PsychMind.", body: "Your profile takes shape as you type. Verified by hand before it goes live." },
  patient: { title: "Someone who fits is out there.", body: "Search by what you're going through, how you'd like to meet, and more." },
  inbox: { title: "One last step.", body: "Confirming your email keeps your account — and the people you talk to — safe." },
  key: { title: "Let's get you back in.", body: "Reset links work once and expire after 30 minutes." },
};

/** White product card floating on the dark canvas; drifts with the pointer. */
function FloatCard({ children, depth = 1, className, style }: { children: ReactNode; depth?: number; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("absolute rounded-xl bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_18px_40px_-16px_rgb(0_0_0/0.22)] ring-1 ring-black/[0.06]", className)}
      style={{
        transform: `translate3d(calc(var(--mx, 0) * ${depth * 10}px), calc(var(--my, 0) * ${depth * 10}px), 0)`,
        transition: "transform 600ms var(--ease-out-soft)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ who, size = 32, className }: { who: "sara" | "shatiria" | "monica"; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={providerPhoto(who, size * 2, 1)} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} />
  );
}

function Chip({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "ink" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[11px] font-medium",
        tone === "ink" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700",
      )}
    >
      {children}
    </span>
  );
}

function LoginScene() {
  return (
    <>
      <FloatCard depth={1.4} className="top-[14%] left-[10%] w-[300px] p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <BellIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-[13px] font-semibold">New session request</span>
            <span className="truncate text-[12px] text-neutral-600">Individual · Online · this week</span>
          </div>
          <span className="ml-auto font-mono text-[11px] text-neutral-500">2m</span>
        </div>
      </FloatCard>
      <FloatCard depth={0.8} className="top-[34%] right-[8%] w-[250px] p-4">
        <p className="text-[12px] text-neutral-600">Profile views</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-[26px] font-semibold tracking-tight">312</span>
          <span className="text-[12px] font-medium text-emerald-600">↑ 24%</span>
        </p>
        <svg viewBox="0 0 200 48" className="mt-2 h-12 w-full" aria-hidden>
          <path d="M0 40 C 20 38, 30 30, 50 32 S 80 20, 100 24 S 140 10, 160 14 S 190 6, 200 4" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
          <path d="M0 40 C 20 38, 30 30, 50 32 S 80 20, 100 24 S 140 10, 160 14 S 190 6, 200 4 V48 H0Z" fill="url(#g)" opacity="0.18" />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2563eb" />
              <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </FloatCard>
      <FloatCard depth={1.1} className="top-[58%] left-[16%] flex w-[270px] items-center gap-3 p-3.5">
        <Avatar who="sara" size={36} />
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold">Sara Oliisi</span>
          <span className="flex items-center gap-1 text-[12px] text-emerald-700">
            <BadgeCheckIcon className="size-3.5" /> License verified
          </span>
        </div>
      </FloatCard>
    </>
  );
}

function RoleScene() {
  const { role } = useAuthPanel();
  return (
    <>
      <FloatCard
        depth={1.2}
        className={cn("top-[16%] left-[8%] w-[290px] p-4 transition-[opacity,scale,filter] duration-500", role === "provider" ? "scale-95 opacity-45 blur-[1px]" : "z-10 scale-100 opacity-100")}
      >
        <p className="flex items-center gap-2 text-[12px] font-medium text-neutral-600">
          <SearchIcon className="size-3.5" /> Looking for a provider
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Avatar who="shatiria" size={40} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold">Shatiria Johnson</span>
            <div className="flex gap-1">
              <Chip>Anxiety</Chip>
              <Chip>Online</Chip>
            </div>
          </div>
        </div>
        <div className="mt-3 flex h-8 items-center justify-center rounded-md bg-neutral-900 text-[12px] font-medium text-white">Request a session</div>
      </FloatCard>
      <FloatCard
        depth={0.9}
        className={cn("top-[44%] right-[7%] w-[290px] p-4 transition-[opacity,scale,filter] duration-500", role === "patient" ? "scale-95 opacity-45 blur-[1px]" : "z-10 scale-100 opacity-100")}
      >
        <p className="flex items-center gap-2 text-[12px] font-medium text-neutral-600">
          <BadgeCheckIcon className="size-3.5" /> Mental health provider
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Views", "312"],
            ["Saves", "41"],
            ["Requests", "24"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-neutral-50 p-2">
              <p className="text-[10.5px] text-neutral-500">{k}</p>
              <p className="text-[16px] font-semibold tracking-tight">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Live in search
        </p>
      </FloatCard>
    </>
  );
}

function ProviderScene() {
  const { draft } = useAuthPanel();
  const fullName = [draft.firstName, draft.lastName].filter(Boolean).join(" ");
  const name = draft.displayAsBusiness && draft.businessName ? draft.businessName : fullName;
  const initials = (name || "You").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <FloatCard depth={0.8} className="top-1/2 left-1/2 w-[340px] overflow-hidden" style={{ translate: "-50% -58%" }}>
      <div className="relative h-20 bg-teal-700">
        <div className="absolute inset-0 bg-[url('/images/how-it-works/profile-banner.png')] bg-cover opacity-60 mix-blend-luminosity grayscale" />
      </div>
      <div className="px-5 pb-5">
        <div className="relative -mt-9 flex items-end justify-between">
          <span className="flex size-[72px] items-center justify-center rounded-2xl border-4 border-white bg-neutral-100 text-[20px] font-semibold text-neutral-700 shadow-md">
            {initials}
          </span>
          <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
            <SparklesIcon className="size-3" /> Verified after review
          </span>
        </div>
        <p className={cn("mt-3 text-[18px] font-semibold tracking-tight transition-colors", name ? "text-neutral-900" : "text-neutral-300")}>
          {name || "Your name"}
          {name && <span className="ml-0.5 inline-block h-[18px] w-px translate-y-[3px] animate-caret bg-neutral-900" />}
        </p>
        {draft.displayAsBusiness && draft.businessName && fullName && <p className="text-[12px] text-neutral-500">{fullName}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["w-20", "w-16", "w-24"].map((w) => (
            <span key={w} className={cn("h-6 animate-pulse rounded-md bg-neutral-100", w)} />
          ))}
        </div>
        <div className="mt-4 space-y-1.5">
          <span className="block h-2 w-full rounded bg-neutral-100" />
          <span className="block h-2 w-5/6 rounded bg-neutral-100" />
          <span className="block h-2 w-2/3 rounded bg-neutral-100" />
        </div>
      </div>
    </FloatCard>
  );
}

function PatientScene() {
  return (
    <>
      <FloatCard depth={1.3} className="top-[14%] left-[10%] flex items-center gap-2 p-2.5 pr-3">
        <SearchIcon className="ml-1 size-4 text-neutral-500" />
        <span className="text-[13px] text-neutral-700">I need help with anxiety</span>
        <Chip tone="ink">
          <MonitorIcon className="size-3" /> Online
        </Chip>
      </FloatCard>
      {(
        [
          ["monica", "Monica Rios", "Couples · Spanish", "top-[32%] left-[18%]", 1],
          ["shatiria", "Shatiria Johnson", "Anxiety · CBT", "top-[46%] left-[26%]", 0.8],
          ["sara", "Sara Oliisi", "Trauma · EMDR", "top-[60%] left-[34%]", 0.6],
        ] as const
      ).map(([who, name, tags, pos, depth], i) => (
        <FloatCard key={who} depth={depth} className={cn("flex w-[280px] items-center gap-3 p-3", pos)} style={{ animation: `ui-enter 700ms var(--ease-out-soft) ${200 + i * 140}ms both` }}>
          <Avatar who={who} size={40} />
          <div className="flex min-w-0 flex-col">
            <span className="text-[13px] font-semibold">{name}</span>
            <span className="text-[12px] text-neutral-600">{tags}</span>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[11px] text-neutral-500">
            <MapPinIcon className="size-3" /> TX
          </span>
        </FloatCard>
      ))}
    </>
  );
}

function InboxScene() {
  return (
    <FloatCard depth={0.8} className="top-1/2 left-1/2 w-[360px] overflow-hidden" style={{ translate: "-50% -58%" }}>
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 text-[12px] font-medium text-neutral-600">
        <MailIcon className="size-3.5" /> Inbox
      </div>
      {[
        ["PsychMind", "Confirm your email", "now", true],
        ["Calendar", "Weekly summary", "9:41", false],
        ["Newsletter", "October reads", "Tue", false],
      ].map(([from, subject, time, fresh]) => (
        <div key={String(subject)} className={cn("flex items-center gap-3 px-4 py-3", fresh && "bg-blue-50/60")}>
          <span className={cn("size-2 shrink-0 rounded-full", fresh ? "bg-blue-600" : "bg-transparent")} />
          <div className="flex min-w-0 flex-col">
            <span className={cn("text-[13px]", fresh ? "font-semibold text-neutral-900" : "text-neutral-600")}>{from}</span>
            <span className="truncate text-[12px] text-neutral-500">{subject}</span>
          </div>
          <span className="ml-auto font-mono text-[11px] text-neutral-400">{time}</span>
        </div>
      ))}
    </FloatCard>
  );
}

function KeyScene() {
  return (
    <FloatCard depth={0.8} className="top-1/2 left-1/2 flex w-[300px] flex-col items-center gap-3 p-6 text-center" style={{ translate: "-50% -58%" }}>
      <span className="flex size-12 items-center justify-center rounded-full bg-neutral-900 text-white">
        <KeyRoundIcon className="size-5" />
      </span>
      <p className="text-[14px] font-semibold">Set a new password</p>
      <div className="flex w-full gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full", i < 3 ? "bg-emerald-500" : "bg-neutral-200")} />
        ))}
      </div>
      <p className="text-[12px] text-neutral-500">Strong password</p>
    </FloatCard>
  );
}

const scenes: Record<SceneKey, () => ReactNode> = {
  login: LoginScene,
  role: RoleScene,
  provider: ProviderScene,
  patient: PatientScene,
  inbox: InboxScene,
  key: KeyScene,
};

export function PortalPanel() {
  const pathname = usePathname();
  const active = sceneFor(pathname);
  const root = useRef<HTMLDivElement>(null);

  // Pointer parallax for the floating cards (skipped for reduced motion).
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
        el.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="paper-gray h-full overflow-hidden rounded-2xl ring-1 ring-black/[0.04] ring-inset">
      <div className="pointer-events-none absolute top-[42%] left-1/2 size-[520px] -translate-1/2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="portal-ring absolute inset-0 rounded-full border border-neutral-400/30" style={{ animationDelay: `${i * 2.6}s` }} />
        ))}
      </div>

      {/* Scenes */}
      {(Object.keys(scenes) as SceneKey[]).map((key) => {
        const Scene = scenes[key];
        const on = key === active;
        return (
          <div
            key={key}
            className={cn(
              "absolute inset-0 transition-[opacity,transform,filter] duration-700 ease-out-soft",
              on ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0 blur-sm",
            )}
          >
            {on && <Scene />}
          </div>
        );
      })}

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-0 p-8 lg:p-10">
        {(Object.keys(captions) as SceneKey[]).map((key) => (
          <div
            key={key}
            className={cn(
              "absolute inset-x-8 bottom-8 transition-[opacity,transform] duration-700 ease-out-soft lg:inset-x-10 lg:bottom-10",
              key === active ? "opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <p className="max-w-[420px] text-[22px] leading-7 font-semibold tracking-[-0.02em] text-neutral-900">{captions[key].title}</p>
            <p className="mt-2 max-w-[400px] text-[14px] leading-5 text-neutral-600">{captions[key].body}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
