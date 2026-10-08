#!/usr/bin/env node
// Deterministic frame-by-frame renderer for a motion-design HTML page.
//
// The page must expose:
//   window.FILM = { width, height, fps, duration }   // duration in seconds
//   window.seek(t)                                    // draw the frame at time t (seconds), pure function of t
//
// Usage:
//   node render.mjs film.html out.mp4 [--from 0] [--to <s>] [--crf 16] [--audio track.wav] [--blur 4]
//     --blur N renders N sub-frames per frame (180-degree shutter) and averages them: real motion blur, N times slower.
//   node render.mjs film.html out/stills --stills 0.5,2,4.25      (PNG per timestamp)
//   node render.mjs film.html out/sheet.png --sheet 12            (contact sheet: 12 evenly spaced frames)
//
// Requires Playwright (Chromium) and ffmpeg on PATH.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const id of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try { return require(id); } catch {}
  }
  try {
    const root = require("node:child_process").execSync("npm root -g").toString().trim();
    return require(`${root}/playwright`);
  } catch {}
  console.error("Playwright not found. Install with: npm i -D playwright");
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2 || args.includes("--help")) {
  console.log("usage: node render.mjs <film.html> <out> [--from s] [--to s] [--crf n] [--audio file] [--blur n] [--stills t,t,..] [--sheet n]");
  process.exit(args.includes("--help") ? 0 : 1);
}
const [input, output] = args;
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const probe = await browser.newPage();
await probe.goto(pathToFileURL(resolve(input)).href);
const film = await probe.evaluate(() => window.FILM);
await probe.close();
if (!film || typeof film.duration !== "number") {
  console.error("Page must define window.FILM = { width, height, fps, duration } and window.seek(t).");
  process.exit(1);
}

const page = await browser.newPage({ viewport: { width: film.width, height: film.height }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(input)).href);
await page.evaluate(() => document.fonts.ready);

async function frameAt(t) {
  await page.evaluate((time) => window.seek(time), t);
  // Two rAFs so layout and paint have settled for this state.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.screenshot({ type: "png" });
}

function ffmpeg(ffArgs, stdin = true) {
  const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...ffArgs], {
    stdio: [stdin ? "pipe" : "ignore", "inherit", "inherit"],
  });
  const done = new Promise((res, rej) => p.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  return { p, done };
}

const stills = opt("stills");
const sheet = opt("sheet");

if (stills) {
  mkdirSync(output, { recursive: true });
  for (const s of stills.split(",").map(Number)) {
    const name = `${output}/t${s.toFixed(2)}.png`;
    writeFileSync(name, await frameAt(s));
    console.log(name);
  }
} else if (sheet) {
  const n = Number(sheet);
  const cols = Math.min(4, n);
  const rows = Math.ceil(n / cols);
  mkdirSync(dirname(resolve(output)), { recursive: true });
  const { p, done } = ffmpeg([
    "-f", "image2pipe", "-framerate", "1", "-i", "-",
    "-vf", `scale=480:-1,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='%{n}':x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=6:color=0x202020`,
    "-frames:v", "1", output,
  ]);
  for (let i = 0; i < n; i++) {
    const t = (film.duration * (i + 0.5)) / n;
    p.stdin.write(await frameAt(t));
  }
  p.stdin.end();
  await done;
  console.log(`${output}  (${n} frames, labels are sheet index; frame i is at t=${film.duration}*(i+0.5)/${n})`);
} else {
  const from = Number(opt("from", 0));
  const to = Number(opt("to", film.duration));
  const crf = opt("crf", "16");
  const audio = opt("audio");
  const blur = Math.max(1, Number(opt("blur", 1)));   // sub-frames per frame, 180-degree shutter
  const total = Math.round((to - from) * film.fps);
  mkdirSync(dirname(resolve(output)), { recursive: true });
  const ffArgs = ["-f", "image2pipe", "-framerate", String(film.fps * blur), "-i", "-"];
  if (audio) ffArgs.push("-ss", String(from), "-i", audio, "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest");
  if (blur > 1) ffArgs.push("-vf", `tmix=frames=${blur},select='eq(mod(n\\,${blur})\\,${blur - 1})',setpts=N/(${film.fps}*TB)`, "-r", String(film.fps));
  ffArgs.push(
    "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-pix_fmt", "yuv420p",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    "-movflags", "+faststart", output,
  );
  const { p, done } = ffmpeg(ffArgs);
  const started = Date.now();
  for (let f = 0; f < total; f++) {
    for (let k = 0; k < blur; k++) {
      const shutter = blur > 1 ? (k / (blur - 1) - 0.5) * (0.5 / film.fps) : 0;
      const buf = await frameAt(Math.max(0, from + f / film.fps + shutter));
      if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once("drain", r));
    }
    if (f % film.fps === 0) process.stdout.write(`\rframe ${f}/${total}`);
  }
  p.stdin.end();
  await done;
  console.log(`\rwrote ${output}: ${total} frames @ ${film.fps} fps in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

await browser.close();
