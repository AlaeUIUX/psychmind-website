import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { LocalTime } from "@/components/app/local-time";
import { Badge } from "@/components/ui/badge";
import journal from "../../../../drizzle/meta/_journal.json";
import { ProgressBar, ProgressBoard } from "./progress-board";
import { REVIEWED, TRACKER, groupProgress } from "./tracker";

export const metadata: Metadata = { title: "Progress — PsychMind", robots: { index: false } };
export const dynamic = "force-dynamic";

// The owner's build tracker: what's built and what's left per contract
// milestone, from ./tracker.ts, plus live facts about this checkout (branch,
// uncommitted work, migrations, tests). Never available in production.

function git(...args: string[]) {
  try {
    return execFileSync("git", args, { encoding: "utf8", timeout: 3000, stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function countFiles(dir: string, suffix: string) {
  try {
    return readdirSync(path.join(process.cwd(), dir)).filter((f) => f.endsWith(suffix)).length;
  } catch {
    return 0;
  }
}

function repoFacts() {
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const [subject, date] = (git("log", "-1", "--format=%s%x1f%cI") ?? "").split("\x1f");
  const changed = (git("status", "--porcelain") ?? "").split("\n").filter(Boolean).map((line) => line.slice(3));
  const ahead = Number(git("rev-list", "--count", "origin/main..HEAD") ?? NaN);
  return {
    branch,
    commit: subject ? { subject, date } : null,
    changed,
    ahead: Number.isNaN(ahead) ? null : ahead,
    migrations: journal.entries.length,
    unitTests: countFiles("tests/unit", ".test.ts"),
    e2eTests: countFiles("tests/e2e", ".spec.ts"),
  };
}

export default function DevProgressPage() {
  if (process.env.VERCEL_ENV === "production") notFound();

  const repo = repoFacts();
  const milestones = TRACKER.filter((g) => g.amount);
  const all = TRACKER.flatMap((g) => g.items);
  const built = groupProgress(milestones.flatMap((g) => g.items));
  const open = all.filter((i) => i.status !== "done");
  const openBuild = milestones.flatMap((g) => g.items).filter((i) => i.status !== "done" && i.owner === "build");
  const tiles = [
    { label: "Contract scope built", value: `${built.percent}%`, hint: `${built.done} of ${built.total} items done` },
    { label: "Left to build", value: openBuild.length, hint: `${openBuild.filter((i) => i.status === "doing").length} in progress` },
    { label: "Waiting on the client", value: open.filter((i) => i.owner === "client").length, hint: "Decisions, copy, payment" },
    { label: "Accounts to set up", value: open.filter((i) => i.owner === "accounts").length, hint: "Hosting, email, Stripe, Google" },
  ];

  return (
    <div className="app-ui min-h-svh bg-warm-50 text-warm-900">
      <main className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-4 py-10 sm:py-14">
        <header className="flex flex-col gap-2">
          <p className="type-ui-label text-text-tertiary">
            Local only · reviewed <LocalTime value={`${REVIEWED}T12:00:00Z`} />
          </p>
          <h1 className="type-ui-headline text-text-primary">Progress</h1>
          <p className="type-ui-body max-w-[60ch] text-text-tertiary">
            What&apos;s built and what&apos;s left, by contract milestone. The list lives in{" "}
            <code className="type-ui-mono text-text-secondary">src/app/dev/progress/tracker.ts</code>; the checkout facts are read
            live.
          </p>
        </header>

        <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.label} className="flex flex-col gap-1.5 rounded-card border border-warm-200 bg-white p-4 sm:p-5">
              <p className="type-ui-label text-text-tertiary">{tile.label}</p>
              <p className="type-ui-figure text-text-primary">{tile.value}</p>
              <p className="type-ui-caption text-text-placeholder">{tile.hint}</p>
            </div>
          ))}
        </section>

        <section aria-labelledby="milestones-title" className="flex flex-col gap-3">
          <h2 id="milestones-title" className="type-ui-heading text-text-primary">
            Milestones
          </h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((group) => {
              const p = groupProgress(group.items);
              const state = p.percent === 100 ? "Built" : p.done + p.doing === 0 ? "Not started" : "In progress";
              return (
                <li key={group.id}>
                  <a
                    href={`#${group.id}`}
                    className="flex h-full flex-col gap-3 rounded-card border border-warm-200 bg-white p-4 transition-colors hover:border-warm-300 hover:bg-warm-100/60 focus-visible:ring-4 focus-visible:ring-ring/12 focus-visible:outline-none sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="type-ui-caption text-text-tertiary">{group.label}</span>
                      <Badge variant={state === "Built" ? "success" : state === "Not started" ? "neutral" : "info"}>{state}</Badge>
                    </div>
                    <p className="type-ui-heading flex-1 text-text-primary">{group.title}</p>
                    <div className="flex flex-col gap-1.5">
                      <ProgressBar value={p.percent} label={`${group.label} progress`} />
                      <p className="flex justify-between gap-2 type-ui-caption text-text-tertiary tabular-nums">
                        <span>
                          {p.percent}% · {p.done} of {p.total} done
                        </span>
                        <span>${group.amount?.toLocaleString("en-US")}</span>
                      </p>
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>

        <ProgressBoard groups={TRACKER} />

        <section aria-labelledby="checkout-title" className="flex flex-col gap-3">
          <h2 id="checkout-title" className="type-ui-heading text-text-primary">
            This checkout
          </h2>
          <dl className="flex flex-col divide-y divide-warm-200 overflow-hidden rounded-card border border-warm-200 bg-white">
            <Fact label="Branch">
              <span className="type-ui-mono text-text-primary">{repo.branch ?? "Not a git checkout"}</span>
              {repo.ahead !== null && (
                <Badge variant={repo.ahead ? "warning" : "success"}>
                  {repo.ahead ? `${repo.ahead} commit${repo.ahead === 1 ? "" : "s"} not on main` : "Matches origin/main"}
                </Badge>
              )}
            </Fact>
            {repo.commit && (
              <Fact label="Last commit">
                <span className="text-text-primary">{repo.commit.subject}</span>
                <LocalTime value={repo.commit.date} style="datetime" className="text-text-placeholder" />
              </Fact>
            )}
            <Fact label="Uncommitted">
              {repo.changed.length ? (
                <details className="w-full">
                  <summary className="cursor-pointer text-text-primary">
                    {repo.changed.length} changed file{repo.changed.length === 1 ? "" : "s"}
                  </summary>
                  <ul className="mt-2 flex flex-col gap-0.5">
                    {repo.changed.map((file) => (
                      <li key={file} className="type-ui-mono break-all text-text-tertiary">
                        {file}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <span className="text-text-tertiary">Nothing, the tree is clean</span>
              )}
            </Fact>
            <Fact label="Database">
              <span className="text-text-primary">{repo.migrations} migrations</span>
              <span className="text-text-placeholder">in drizzle/</span>
            </Fact>
            <Fact label="Tests">
              <span className="text-text-primary">
                {repo.unitTests} unit files · {repo.e2eTests} end-to-end specs
              </span>
              <span className="type-ui-mono text-text-placeholder">npm test · npm run test:e2e</span>
            </Fact>
          </dl>
        </section>
      </main>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-6 sm:px-5">
      <dt className="type-ui-label w-28 shrink-0 text-text-tertiary">{label}</dt>
      <dd className="type-ui-small flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1">{children}</dd>
    </div>
  );
}
