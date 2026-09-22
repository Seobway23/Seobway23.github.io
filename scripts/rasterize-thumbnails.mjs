#!/usr/bin/env node
/**
 * 표지 SVG → OG용 PNG.
 *
 * 왜 두 벌인가: 사이트 안에서는 SVG 가 맞다. 가볍고, 어떤 배율에서도 또렷하고,
 * 문서에 들여오면 호버까지 산다. 그러나 **공유 카드(og:image)는 SVG 를 그리지 않는다** —
 * 카카오톡·트위터·페이스북·슬랙 어디도. 링크를 붙였을 때 표지가 안 뜨면
 * 그 표지는 없는 것과 같다. 그래서 같은 그림을 PNG 로 한 장 더 굽는다.
 *
 * 굽는 일은 크롬이 한다(브라우저가 그리는 그대로가 정답이므로). 크롬이 없는
 * 환경도 있으니 빌드에 끼우지 않는다 — 로컬에서 돌리고 결과를 저장소에 커밋한다.
 *
 * 결과는 `public/post-thumbnails/<slug>.jpg` — prerender 가 og:image 에 이 파일을 쓴다.
 *
 * 사용법
 *   node scripts/rasterize-thumbnails.mjs                 # public/post-thumbnails 전부
 *   node scripts/rasterize-thumbnails.mjs primitive-type  # 슬러그 골라서
 *   CHROME_PATH="/path/to/chrome" node scripts/rasterize-thumbnails.mjs
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import process from "node:process";

const DIR = path.join("public", "post-thumbnails");
const WIDTH = 1200;
const HEIGHT = 630;

/** 크롬을 찾는다. 환경변수가 1순위 — 설치 위치는 기계마다 다르다. */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      /* 접근 불가 경로는 넘긴다 */
    }
  }
  return null;
}

function rasterize(chrome, svgPath, pngPath) {
  // 크롬은 --screenshot 결과를 임시 프로필과 함께 남긴다. 프로필을 매번 새로 주지 않으면
  // 이미 떠 있는 크롬 창에 붙어 버려 아무 파일도 안 나온다.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "thumbshot-"));
  try {
    execFileSync(
      chrome,
      [
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--user-data-dir=${profile}`,
        `--window-size=${WIDTH},${HEIGHT}`,
        `--screenshot=${path.resolve(pngPath)}`,
        `file://${path.resolve(svgPath).replace(/\\/g, "/")}`,
      ],
      { stdio: "ignore", timeout: 60_000 }
    );
  } finally {
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

async function main() {
  const chrome = findChrome();
  if (!chrome) {
    console.error(
      "크롬을 못 찾았다. CHROME_PATH 로 경로를 알려 주거나 크롬을 설치한다.\n" +
        "  CHROME_PATH=\"/path/to/chrome\" node scripts/rasterize-thumbnails.mjs"
    );
    process.exit(1);
  }

  if (!fs.existsSync(DIR)) {
    console.error(`${DIR} 이 없다. 먼저 npm run thumb 으로 SVG 를 만든다.`);
    process.exit(1);
  }

  const only = new Set(process.argv.slice(2));
  const targets = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".svg"))
    .filter((f) => only.size === 0 || only.has(path.basename(f, ".svg")));

  if (!targets.length) {
    console.error("대상 SVG 가 없다.");
    process.exit(1);
  }

  let ok = 0;
  for (const file of targets) {
    const base = path.basename(file, ".svg");
    const svgPath = path.join(DIR, file);
    const pngPath = path.join(DIR, `${base}.png`);
    rasterize(chrome, svgPath, pngPath);

    if (!fs.existsSync(pngPath)) {
      console.error(`✗ ${pngPath} — 크롬이 파일을 남기지 않았다`);
      continue;
    }

    const rawKb = fs.statSync(pngPath).size / 1024;
    const finalPath = await shrink(pngPath, path.join(DIR, `${base}.jpg`));
    const kb = (fs.statSync(finalPath).size / 1024).toFixed(0);
    console.log(`✓ ${finalPath}  ${kb}KB  (원본 PNG ${rawKb.toFixed(0)}KB)`);
    ok += 1;
  }

  console.log(`\n${ok}/${targets.length} 장. og:image 가 이 파일을 쓴다.`);
}

/**
 * 크롬이 뱉는 PNG 는 장당 500KB 쯤 된다. 글 하나에 그만한 파일을 저장소에 쌓을 이유가 없고,
 * 공유 카드를 여는 사람은 모바일 데이터로 그걸 받는다. 표지는 그라데이션과 노이즈가
 * 대부분이라 JPEG 이 훨씬 유리하다 — 같은 그림이 1/5 로 줄고 눈으로는 구분되지 않는다.
 *
 * sharp 가 없는 환경이면 PNG 를 그대로 둔다. 커지긴 해도 카드는 뜬다.
 */
async function shrink(pngPath, jpgPath) {
  let sharp;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    return pngPath;
  }

  await sharp(pngPath)
    .flatten({ background: "#060d18" }) // 투명은 없지만, 있더라도 표지 바탕색으로 깔린다
    .jpeg({ quality: 86, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(jpgPath);

  fs.rmSync(pngPath, { force: true });
  return jpgPath;
}

await main();
