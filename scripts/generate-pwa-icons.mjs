/**
 * PWA 아이콘 생성기
 *
 * public/favicon.svg 와 동일한 "TB" 모노그램을 512/192 PNG 로 굽는다.
 * 글리프는 폰트 대신 path 로 그린다 — 렌더 환경(폰트 유무)에 상관없이 결과가 같아야 하기 때문.
 *
 * 실행: node scripts/generate-pwa-icons.mjs
 * 산출: public/pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png, apple-touch-icon.png
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "..", "public");

const BRAND_FROM = "#6366f1";
const BRAND_TO = "#8b5cf6";

/**
 * "TB" 모노그램 path. 128x128 좌표계 기준, 원점은 좌상단.
 * T: 가로바 + 세로 기둥 / B: 세로 기둥 + 위·아래 볼(bowl)
 */
const MONOGRAM = `
<g fill="#ffffff">
  <!-- T -->
  <path d="M8 20 H62 V34 H46 V108 H24 V34 H8 Z"/>
  <!-- B -->
  <path d="M70 20 H100 a26 26 0 0 1 0 52 h-8 v-14 h8 a12 12 0 0 0 0-24 H92 v74 H70 Z"/>
  <path d="M92 58 h12 a25 25 0 0 1 0 50 H70 v-14 h34 a11 11 0 0 0 0-22 H92 Z"/>
</g>`;

/** @param {{size:number, pad:number, radius:number}} opts */
function buildSvg({ size, pad, radius }) {
  // pad: 아이콘 변 길이 대비 여백 비율(0~0.5). maskable 은 안전영역(중앙 80%) 안에 글리프가 들어가야 한다.
  const inner = size * (1 - pad * 2);
  const scale = inner / 128;
  const offset = size * pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND_FROM}"/>
      <stop offset="1" stop-color="${BRAND_TO}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${MONOGRAM}</g>
</svg>`;
}

/** @type {{file:string, size:number, pad:number, radius:number}[]} */
const TARGETS = [
  // 일반 아이콘: 모서리 둥근 타일, 글리프 여백 18%
  { file: "pwa-192x192.png", size: 192, pad: 0.18, radius: 192 * 0.2 },
  { file: "pwa-512x512.png", size: 512, pad: 0.18, radius: 512 * 0.2 },
  // maskable: 배경 꽉 채우고(둥글림 0) 글리프는 중앙 안전영역 안으로
  { file: "pwa-maskable-512x512.png", size: 512, pad: 0.26, radius: 0 },
  // iOS 홈화면: 시스템이 알아서 마스킹하므로 각지게 + 여백 넉넉히
  { file: "apple-touch-icon.png", size: 180, pad: 0.2, radius: 0 },
];

for (const t of TARGETS) {
  const svg = buildSvg(t);
  const out = path.join(publicDir, t.file);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
  console.log(`generated ${t.file} (${t.size}x${t.size})`);
}
