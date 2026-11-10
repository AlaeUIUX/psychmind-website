import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COVER_ART, isCoverArt } from "@/components/blog/cover-spots";
import { getAllPosts } from "@/lib/blog";

// The blog's covers are one set (components/blog/post-cover.tsx): every post names a
// picture that exists, the girl's pictures have been saved (scripts/render-covers.mjs),
// and the CMS offers exactly the pictures there are.

describe("blog covers", () => {
  const posts = getAllPosts();

  it("every post picks a picture that exists", () => {
    for (const post of posts) expect(isCoverArt(post.cover), `${post.slug}: cover "${post.cover}"`).toBe(true);
  });

  it("the girl's pictures are saved", () => {
    for (const name of ["boat", "two-roads", "rain-cloud"]) {
      expect(existsSync(path.join(process.cwd(), `public/images/blog/covers/${name}.png`)), name).toBe(true);
    }
  });

  it("the CMS lists the same pictures", () => {
    const config = readFileSync(path.join(process.cwd(), "public/cms/config.yml"), "utf-8");
    const offered = [...config.matchAll(/value: "([a-z-]+)" \}/g)].map((m) => m[1]).filter((v) => v !== "team" && v !== "provider");
    expect(offered.sort()).toEqual(Object.keys(COVER_ART).sort());
  });
});
