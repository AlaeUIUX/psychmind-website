// Saves the blog covers' pictures of the girl (src/app/dev/cover-studio) as PNGs in
// public/images/blog/covers, read straight off the studio's canvases. Run it while
// the dev server is up:
//
//   node scripts/render-covers.mjs            (http://localhost:3001)
//   node scripts/render-covers.mjs http://localhost:3100
//
// The pictures are ink, a softer grey, white and her red on a clear ground, so
// they're saved as palette PNGs (small, and nothing a lossy format would smear).

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3001";
const out = path.join(process.cwd(), "public/images/blog/covers");
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(`${base}/dev/cover-studio`, { waitUntil: "networkidle" });
await page.waitForFunction(() => [...document.querySelectorAll("canvas[data-cover]")].every((c) => c.dataset.ready));

const covers = await page.$$eval("canvas[data-cover]", (canvases) =>
  canvases.map((c) => ({ name: c.dataset.cover, url: c.toDataURL("image/png") })),
);
for (const { name, url } of covers) {
  const png = Buffer.from(url.split(",")[1], "base64");
  const file = path.join(out, `${name}.png`);
  await writeFile(file, await sharp(png).png({ palette: true, colours: 32, dither: 0 }).toBuffer());
  console.log("saved", path.relative(process.cwd(), file));
}
await browser.close();
