#!/usr/bin/env node
/**
 * 글 썸네일 SVG 생성기 — 살아 있는 표지를 만든다.
 *
 * 왜 SVG인가: 표지는 사진이 아니라 "그 글이 무슨 코드를 다루는가"다.
 * 본문 첫 코드 블록을 그대로 배경에 깔면, 같은 템플릿이어도 글마다 다른 그림이 나온다.
 * 래스터 이미지와 달리 용량이 몇 KB고, 어떤 해상도에서도 뭉개지지 않는다.
 *
 * 움직임에 대하여 — 두 층으로 나눠 둔다.
 *   1) CSS @keyframes: `<img src="...svg">` 안에서도 **돈다**. 기본 상태에서 은은하게 숨 쉰다.
 *   2) `svg:hover` 규칙: 이미지로 쓰면 무시되지만, DOM에 **인라인**하거나 `<object>`로
 *      넣으면 마우스를 올렸을 때 글로우가 확 열리고 반짝임이 빨라진다.
 *   같은 파일 하나로 두 경우를 모두 감당한다. 접근성을 위해 prefers-reduced-motion 을 존중한다.
 *
 * 사용법
 *   node scripts/generate-thumbnail.mjs posts/frontend/javascript/primitive-type.md
 *   node scripts/generate-thumbnail.mjs posts/frontend/javascript            # 폴더 통째로
 *   node scripts/generate-thumbnail.mjs --title "원시 타입" --slug primitive-type \
 *        --category frontend/javascript --subtitle "값이 복사된다" --out public/post-thumbnails/x.svg
 *
 * 옵션
 *   --out <path>      출력 경로 (기본 public/post-thumbnails/<slug>.svg)
 *   --subtitle <s>    가운데 제목 아래 한 줄 (기본: excerpt 첫 문장)
 *   --kicker <s>      제목 위 라벨 (기본: 카테고리)
 *   --code <s>        배경 코드 (기본: 본문 첫 코드 펜스). \n 으로 줄바꿈
 *   --write-frontmatter   생성 후 md 의 coverImage 를 이 파일로 채운다
 *   --dry             파일 쓰지 않고 경로만 출력
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/* ────────────────────────────────────────────────────────────────
   1. 팔레트 — src/lib/category-color.ts 와 같은 규칙을 쓴다.
      사이트 카드의 --glow-c 와 썸네일 색이 어긋나면 둘 다 장식으로 보인다.
   ──────────────────────────────────────────────────────────────── */

const TOP_LEVEL_HUES = {
  frontend: "#38bdf8", // sky
  study: "#a78bfa", // violet
  work: "#34d399", // emerald
};
const FALLBACK_HUE = "#94a3b8";

/** 하위 주제별 상징색 — 배지와 두 번째 글로우에 쓴다. */
const TOPIC_ACCENTS = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  react: "#61dafb",
  "react-query": "#ff4154",
  threejs: "#ffffff",
  styling: "#38bdf8",
  performance: "#fbbf24",
  mechanics: "#f472b6",
  network: "#34d399",
  database: "#38bdf8",
};

/** 배지에 박을 짧은 글자 — 없으면 카테고리 앞 두 글자 */
const TOPIC_MARKS = {
  javascript: "JS",
  typescript: "TS",
  react: "⚛",
  "react-query": "RQ",
  threejs: "3D",
  styling: "CSS",
  performance: "⚡",
  mechanics: "∑",
  network: "NET",
  database: "DB",
};

function hexToHsl(hex) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

function hashUnit(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

function categoryColor(category) {
  const [top, second] = String(category || "").replace(/\\/g, "/").split("/");
  const base = TOP_LEVEL_HUES[top];
  if (!base) return FALLBACK_HUE;
  if (!second) return base;
  const [h, s, l] = hexToHsl(base);
  const shift = (hashUnit(second) - 0.5) * 24;
  const nextL = Math.min(78, Math.max(46, l + shift));
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(nextL)}%)`;
}

/** 슬러그마다 늘 같은 난수 — 글로우 위치·별 배치가 글의 지문이 된다. */
function seededRandom(seed) {
  let a = 0;
  for (let i = 0; i < seed.length; i++) a = (a * 31 + seed.charCodeAt(i)) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ────────────────────────────────────────────────────────────────
   2. 텍스트 — SVG 에는 자동 줄바꿈이 없다. 폭을 재서 직접 끊는다.
   ──────────────────────────────────────────────────────────────── */

/** 글자 하나가 차지하는 폭(em). 한글은 정사각, 라틴 소문자는 절반쯤. */
function charWidth(ch) {
  const code = ch.codePointAt(0);
  if (ch === " ") return 0.3;
  if (code >= 0x1100 && code <= 0x11ff) return 1.0; // 한글 자모
  if (code >= 0x3000 && code <= 0x9fff) return 1.0; // CJK
  if (code >= 0xac00 && code <= 0xd7a3) return 1.0; // 한글 음절
  if (code >= 0xff00 && code <= 0xffef) return 1.0; // 전각
  if (/[A-Z]/.test(ch)) return 0.66;
  if (/[a-z]/.test(ch)) return 0.54;
  if (/[0-9]/.test(ch)) return 0.58;
  if (/[.,:;!'`|iltj]/.test(ch)) return 0.3;
  if (/[—–…]/.test(ch)) return 0.9;
  return 0.5;
}

function measure(text, fontSize) {
  let w = 0;
  for (const ch of text) w += charWidth(ch);
  return w * fontSize;
}

/** 공백 기준 그리디 줄바꿈. 한 덩어리가 넘치면 글자 단위로 쪼갠다. */
function wrapText(text, fontSize, maxWidth, maxLines) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";

  const pushCur = () => {
    if (cur) lines.push(cur);
    cur = "";
  };

  for (const word of words) {
    const probe = cur ? `${cur} ${word}` : word;
    if (measure(probe, fontSize) <= maxWidth) {
      cur = probe;
      continue;
    }
    pushCur();
    if (measure(word, fontSize) <= maxWidth) {
      cur = word;
      continue;
    }
    // 한 단어가 줄보다 길다 — 글자 단위로 자른다
    let chunk = "";
    for (const ch of word) {
      if (measure(chunk + ch, fontSize) > maxWidth) {
        lines.push(chunk);
        chunk = ch;
      } else chunk += ch;
    }
    cur = chunk;
  }
  pushCur();

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+\S*$/, "")}…`;
    return kept;
  }
  return lines;
}

/**
 * 줄 수는 그대로 두고 폭만 좁혀 가며 가장 고른 배치를 찾는다.
 * 그리디로만 끊으면 마지막 줄에 "것들" 두 글자만 남는 꼴이 나온다.
 */
function balancedWrap(text, fontSize, maxWidth, maxLines) {
  const base = wrapText(text, fontSize, maxWidth, maxLines);
  if (base.length < 2) return base;

  let best = base;
  let bestSpread = Infinity;
  for (let w = maxWidth; w > maxWidth * 0.55; w -= 12) {
    const cand = wrapText(text, fontSize, w, maxLines);
    if (cand.length !== base.length) continue;
    const widths = cand.map((l) => measure(l, fontSize));
    const spread = Math.max(...widths) - Math.min(...widths);
    if (spread < bestSpread) {
      bestSpread = spread;
      best = cand;
    }
  }
  return best;
}

const XML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);

/* ────────────────────────────────────────────────────────────────
   3. 코드 토큰 색칠 — 배경에 깔 코드에 최소한의 문법 색을 준다.
      정확한 파서가 아니다. 멀리서 "코드처럼 보이는가"만 맞으면 된다.
   ──────────────────────────────────────────────────────────────── */

const KEYWORDS = new RegExp(
  "\\b(const|let|var|function|return|if|else|for|while|class|new|typeof|" +
    "instanceof|await|async|import|export|from|default|null|undefined|true|false|this)\\b"
);

function tokenizeLine(line) {
  const out = [];
  let rest = line;
  const patterns = [
    [/^\/\/.*$/, "c-comment"],
    [/^(["'`])(?:\\.|(?!\1)[^\\])*\1/, "c-string"],
    [/^\b\d+(\.\d+)?\b/, "c-number"],
    [/^[A-Za-z_$][\w$]*/, null], // 키워드 판정은 아래에서
    [/^[{}()[\];,.]/, "c-punct"],
    [/^[=+\-*/<>!&|?:]+/, "c-op"],
    [/^\s+/, "c-plain"],
    [/^./, "c-plain"],
  ];

  while (rest.length) {
    let matched = false;
    for (const [re, cls] of patterns) {
      const m = rest.match(re);
      if (!m) continue;
      const text = m[0];
      let klass = cls;
      if (klass === null) klass = KEYWORDS.test(text) ? "c-key" : "c-ident";
      out.push({ text, klass });
      rest = rest.slice(text.length);
      matched = true;
      break;
    }
    if (!matched) {
      out.push({ text: rest, klass: "c-plain" });
      break;
    }
  }
  return out;
}

/** 코드 한 줄 → <tspan> 들. 모노스페이스라 글자폭을 0.6em 고정으로 잡는다. */
function renderCodeLine(line, x, y, fontSize) {
  const spans = tokenizeLine(line)
    .map((t) => `<tspan class="${t.klass}" xml:space="preserve">${esc(t.text)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" class="code" font-size="${fontSize}">${spans}</text>`;
}

/* ────────────────────────────────────────────────────────────────
   4. 그림 — 1200×630 (OG 카드 규격)
   ──────────────────────────────────────────────────────────────── */

const W = 1200;
const H = 630;

/**
 * 이름을 글마다 갈라 놓는다.
 *
 * SVG 를 `<img>` 로 쓸 때는 각 파일이 제 문서라 이름이 겹쳐도 상관없다.
 * 그러나 목록 카드는 이 SVG 들을 **한 문서에 여러 장 인라인**한다 — 그 순간
 * `id="ga"` 도 `.title` 도 `@keyframes spin` 도 전부 전역이 된다.
 * 열 번째 카드가 첫 번째 카드의 그라데이션을 쓰고, 강조색이 옆 글 것으로 바뀐다.
 * 그래서 다 짜 놓고 마지막에 한 번, 이름이란 이름에는 글의 지문을 붙인다.
 */
function namespaceSvg(svg, uid) {
  const cssMatch = svg.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (!cssMatch) return svg;
  let css = cssMatch[1];

  // 1) @keyframes 이름 — animation 단축 속성 안에서도 쓰이니 통째로 치환
  const kfNames = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  for (const name of kfNames) {
    css = css.replace(new RegExp(`\\b${name}\\b`, "g"), `${uid}-${name}`);
  }

  // 2) 클래스 — 긴 이름부터 바꿔야 .code 가 .code-main 을 깨지 않는다
  const classNames = [...new Set([...css.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1]))].sort(
    (a, b) => b.length - a.length
  );
  for (const name of classNames) {
    css = css.replace(new RegExp(`\\.${name}\\b`, "g"), `.${uid}-${name}`);
  }

  // 3) 호버는 루트 하나를 짚는다
  css = css.replace(/\bsvg:hover\b/g, `#${uid}:hover`);

  let body = svg.replace(/<!\[CDATA\[[\s\S]*?\]\]>/, `<![CDATA[${css}]]>`);

  // 4) 마크업 쪽 class 속성
  body = body.replace(/class="([^"]+)"/g, (_, list) => {
    const mapped = list
      .split(/\s+/)
      .filter(Boolean)
      .map((c) => (classNames.includes(c) ? `${uid}-${c}` : c))
      .join(" ");
    return `class="${mapped}"`;
  });

  // 5) id 와 그 참조들
  const ids = [...new Set([...body.matchAll(/\bid="([\w-]+)"/g)].map((m) => m[1]))];
  for (const id of ids) {
    body = body
      .replace(new RegExp(`\\bid="${id}"`, "g"), `id="${uid}-${id}"`)
      .replace(new RegExp(`url\\(#${id}\\)`, "g"), `url(#${uid}-${id})`);
  }
  body = body.replace(/aria-labelledby="([^"]+)"/, (_, list) =>
    `aria-labelledby="${list.split(/\s+/).map((t) => `${uid}-${t}`).join(" ")}"`
  );

  // 6) 루트에 손잡이를 단다 — 위 :hover 규칙이 짚을 곳
  return body.replace(/^<svg /, `<svg id="${uid}" `);
}

/** 슬러그 → CSS 식별자로 쓸 수 있는 접두어 */
function uidFor(slug) {
  const clean = String(slug || "thumb")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `tb-${clean || "thumb"}`;
}

function buildSvg({ title, subtitle, kicker, category, slug, codeLines, accent, topicColor, mark }) {
  const rand = seededRandom(slug || title);

  // 제목 길이에 따라 급을 낮춘다 — 세 줄까지만 허용하고 그 아래는 줄인다.
  const rawLen = [...String(title)].length;
  const titleSize = rawLen <= 14 ? 74 : rawLen <= 24 ? 62 : rawLen <= 36 ? 54 : 46;
  const titleLines = balancedWrap(title, titleSize, 940, 3);
  const lineGap = Math.round(titleSize * 1.28);

  // 가운데 블록 전체를 세로 중앙에 맞춘다(칩 + 제목 + 구분선 + 부제).
  const blockH = 44 + titleLines.length * lineGap + (subtitle ? 96 : 40);
  const blockTop = Math.round((H - blockH) / 2);
  const chipY = blockTop;
  const titleTop = chipY + 100;
  const dividerY = titleTop + (titleLines.length - 1) * lineGap + 56;
  const subtitleY = dividerY + 54;

  const chipText = (kicker || category || "").toUpperCase();
  const chipW = Math.max(160, Math.round(measure(chipText, 19) + 74));
  const chipX = Math.round((W - chipW) / 2);

  // 글로우 두 개 — 위치는 슬러그가 정한다. 같은 글은 늘 같은 자리.
  const gA = { x: 140 + rand() * 300, y: 90 + rand() * 180, r: 300 + rand() * 120 };
  const gB = { x: 780 + rand() * 300, y: 380 + rand() * 180, r: 320 + rand() * 120 };

  // 반짝임 — 가운데 텍스트 위를 피해 가장자리에 흩는다.
  const sparks = Array.from({ length: 16 }, (_, i) => {
    const edge = rand();
    const x = edge < 0.5 ? 60 + rand() * 260 : W - 320 + rand() * 260;
    const y = 50 + rand() * (H - 100);
    return {
      x: Math.round(x),
      y: Math.round(y),
      r: 1.4 + rand() * 2.6,
      delay: (rand() * 6).toFixed(2),
      dur: (3.2 + rand() * 3.4).toFixed(2),
      i,
    };
  });

  // 코드는 두 덩이로 흩어 놓는다 — 왼쪽 위에 본문, 오른쪽 아래에 그 메아리.
  // 한 덩이만 두면 반쪽이 비고, 가운데를 덮으면 제목이 죽는다.
  const shown = codeLines.slice(0, 9);
  const codeFont = 21;
  const codeX = 64;
  const codeTop = 104;
  const codeBody = shown
    .map((line, i) => renderCodeLine(line, codeX, codeTop + i * (codeFont * 1.72), codeFont))
    .join("\n      ");

  const echoFont = 17;
  const echoX = 690;
  const echoTop = 356;
  const echoBody = shown
    .slice(0, 4)
    .map((line, i) => renderCodeLine(line, echoX, echoTop + i * (echoFont * 1.8), echoFont))
    .join("\n      ");

  const lastLine = shown[shown.length - 1] || "";
  const caretY = codeTop + Math.max(0, shown.length - 1) * (codeFont * 1.72);
  const caretX = codeX + lastLine.length * (codeFont * 0.6);

  const sparkEls = sparks
    .map(
      (s) =>
        `<circle class="spark" cx="${s.x}" cy="${s.y}" r="${s.r.toFixed(2)}" ` +
        `style="animation-delay:${s.delay}s;animation-duration:${s.dur}s"/>`
    )
    .join("\n    ");

  const titleEls = titleLines
    .map(
      (line, i) =>
        `<text class="title" x="${W / 2}" y="${titleTop + i * lineGap}" ` +
        `text-anchor="middle" font-size="${titleSize}">${esc(line)}</text>`
    )
    .join("\n      ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
     role="img" aria-labelledby="t d" preserveAspectRatio="xMidYMid slice">
  <title id="t">${esc(title)}</title>
  <desc id="d">${esc(category)} — ${esc(subtitle || title)}</desc>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060d18"/>
      <stop offset="52%" stop-color="#0d1526"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <radialGradient id="ga" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="gb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${topicColor}" stop-opacity="0.40"/>
      <stop offset="100%" stop-color="${topicColor}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.09"/>
      <stop offset="55%" stop-color="${topicColor}" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${accent}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0 L0 0 0 44" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="1"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#050b14" stop-opacity="0.94"/>
      <stop offset="62%" stop-color="#050b14" stop-opacity="0.80"/>
      <stop offset="100%" stop-color="#050b14" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="tshadow" x="-20%" y="-40%" width="140%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="#020617" flood-opacity="0.9"/>
    </filter>
    <clipPath id="frame"><rect x="0" y="0" width="${W}" height="${H}" rx="0"/></clipPath>
  </defs>

  <style><![CDATA[
    /* 기본 상태에서도 숨을 쉰다 — img 태그로 넣어도 여기까지는 돈다. */
    .glow-a { animation: driftA 17s ease-in-out infinite alternate; transform-origin: center; }
    .glow-b { animation: driftB 21s ease-in-out infinite alternate; transform-origin: center; }
    @keyframes driftA {
      from { transform: translate(0,0) scale(1);      opacity: .85; }
      to   { transform: translate(46px,-30px) scale(1.12); opacity: 1; }
    }
    @keyframes driftB {
      from { transform: translate(0,0) scale(1.06);   opacity: .7; }
      to   { transform: translate(-54px,26px) scale(.94); opacity: 1; }
    }

    .spark { fill: #ffffff; opacity: 0; animation-name: twinkle;
             animation-iteration-count: infinite; animation-timing-function: ease-in-out; }
    @keyframes twinkle {
      0%, 100% { opacity: 0;   transform: scale(.6); }
      45%      { opacity: .85; transform: scale(1.25); }
      70%      { opacity: .25; transform: scale(.9); }
    }

    .sheen-band { animation: sweep 9s cubic-bezier(.5,0,.3,1) infinite; }
    @keyframes sweep {
      0%, 62% { transform: translateX(-${W * 1.1}px); }
      100%    { transform: translateX(${W * 1.1}px); }
    }

    .caret { animation: blink 1.1s steps(1) infinite; }
    @keyframes blink { 0%,49% { opacity: .85 } 50%,100% { opacity: 0 } }

    /* 가운데 어둠은 숨만 쉰다 — 밝아지면 제목이 코드에 먹힌다. */
    .halo { animation: breathe 9s ease-in-out infinite; transform-origin: center; }
    @keyframes breathe {
      0%,100% { transform: scale(1);    opacity: .96; }
      50%     { transform: scale(1.05); opacity: 1; }
    }

    .bracket { stroke: ${accent}; stroke-opacity: .5; stroke-width: 3; fill: none;
               stroke-linecap: round; animation: pulseEdge 5.5s ease-in-out infinite; }
    @keyframes pulseEdge { 0%,100% { stroke-opacity: .28 } 50% { stroke-opacity: .72 } }

    .badge-ring { animation: spin 26s linear infinite; transform-origin: 96px 534px; }
    @keyframes spin { to { transform: rotate(360deg) } }

    /* 글자 */
    .title  { font-family: "Pretendard Variable", Pretendard, "Noto Sans KR",
              "Apple SD Gothic Neo", "Malgun Gothic", Inter, "Segoe UI", sans-serif;
              font-weight: 800; fill: #f8fafc; letter-spacing: -0.5px;
              filter: url(#tshadow); transition: fill .35s ease; }
    .sub    { font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo",
              "Malgun Gothic", Inter, sans-serif; font-weight: 500; fill: #a8b6cc; }
    .chip-t { font-family: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
              font-weight: 700; fill: ${accent}; letter-spacing: 2.6px; }
    .mark   { font-family: "JetBrains Mono", Consolas, monospace; font-weight: 800; }
    .foot   { font-family: "JetBrains Mono", Consolas, monospace; font-weight: 600;
              fill: #64748b; letter-spacing: 1.4px; }

    /* 배경 코드 */
    .code     { font-family: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
                opacity: .30; transition: opacity .4s ease; }
    .c-key    { fill: ${topicColor}; }
    .c-string { fill: #86efac; }
    .c-number { fill: #fbbf24; }
    .c-comment{ fill: #64748b; font-style: italic; }
    .c-ident  { fill: #cbd5e1; }
    .c-punct  { fill: #94a3b8; }
    .c-op     { fill: ${accent}; }
    .c-plain  { fill: #cbd5e1; }

    /* 인라인 SVG 나 object 태그로 넣었을 때만 살아나는 층.
       이미지로 쓰면 그냥 무시된다 — 그래서 위쪽 기본 애니메이션을 따로 둔 것이다. */
    svg:hover .glow-a,
    svg:hover .glow-b     { animation-duration: 6s; }
    svg:hover .code       { opacity: .62; }
    svg:hover .spark      { animation-duration: 1.4s !important; }
    svg:hover .sheen-band { animation-duration: 2.6s; }
    svg:hover .title      { fill: #ffffff; }
    svg:hover .bracket    { animation-duration: 1.6s; stroke-width: 4; }
    svg:hover .badge      { transform: translateY(-5px); }
    .badge { transition: transform .35s cubic-bezier(.34,1.56,.64,1); }

    @media (prefers-reduced-motion: reduce) {
      .glow-a, .glow-b, .spark, .sheen-band, .caret, .halo, .badge-ring, .bracket {
        animation: none !important;
      }
      .spark { opacity: .5; }
    }
  ]]></style>

  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <rect width="${W}" height="${H}" fill="url(#grid)"/>

    <circle class="glow-a" cx="${Math.round(gA.x)}" cy="${Math.round(gA.y)}" r="${Math.round(gA.r)}" fill="url(#ga)"/>
    <circle class="glow-b" cx="${Math.round(gB.x)}" cy="${Math.round(gB.y)}" r="${Math.round(gB.r)}" fill="url(#gb)"/>

    <!-- 이 글이 실제로 다루는 코드. 표지가 글마다 달라지는 이유. -->
    <g class="code-main">
      ${codeBody}
      <rect class="caret" x="${Math.round(caretX) + 4}" y="${Math.round(caretY) - codeFont + 4}"
            width="10" height="${codeFont + 4}" fill="${topicColor}" opacity=".8"/>
    </g>
    <g class="code-echo" opacity="0.55">
      ${echoBody}
    </g>

    ${sparkEls}

    <!-- 가운데를 어둡게 눌러 제목이 코드 위에서 읽히게 한다.
         판을 덮지 않는 이유 — 그 글의 코드가 표지의 내용이기 때문이다. -->
    <ellipse class="halo" cx="${W / 2}" cy="${H / 2}" rx="560" ry="252" fill="url(#vignette)"/>

    <g class="sheen-band">
      <rect x="0" y="0" width="${Math.round(W * 0.45)}" height="${H}" fill="url(#sheen)"/>
    </g>

    <!-- 카테고리 칩 -->
    <g>
      <rect x="${chipX}" y="${chipY}" width="${chipW}" height="42" rx="21"
            fill="${accent}" fill-opacity="0.13" stroke="${accent}" stroke-opacity="0.55"/>
      <text class="chip-t" x="${W / 2}" y="${chipY + 28}" text-anchor="middle" font-size="19">${esc(chipText)}</text>
    </g>

    ${titleEls}

    <rect x="${W / 2 - 130}" y="${dividerY}" width="260" height="2" rx="1" fill="url(#rule)"/>
    ${
      subtitle
        ? `<text class="sub" x="${W / 2}" y="${subtitleY}" text-anchor="middle" font-size="25">${esc(
            wrapText(subtitle, 25, 860, 1)[0] || ""
          )}</text>`
        : ""
    }

    <!-- 왼쪽 아래 배지 -->
    <g class="badge">
      <circle class="badge-ring" cx="96" cy="534" r="44" fill="none"
              stroke="${topicColor}" stroke-opacity="0.45" stroke-width="2"
              stroke-dasharray="10 14" stroke-linecap="round"/>
      <rect x="66" y="504" width="60" height="60" rx="16"
            fill="${topicColor}" fill-opacity="0.92"/>
      <text class="mark" x="96" y="546" text-anchor="middle" font-size="26"
            fill="#0b1220">${esc(mark)}</text>
    </g>

    <text class="foot" x="${W - 72}" y="${540}" text-anchor="end" font-size="17">${esc(
    String(category || "").toUpperCase()
  )}</text>
    <text class="foot" x="${W - 72}" y="${566}" text-anchor="end" font-size="15"
          opacity=".7">MODERNDEVBLOG</text>

    <!-- 네 귀퉁이 꺾쇠 — "펼쳐 놓은 노트" 를 만든다 -->
    <path class="bracket" d="M34 92 L34 34 L92 34"/>
    <path class="bracket" d="M${W - 92} 34 L${W - 34} 34 L${W - 34} 92"/>
    <path class="bracket" d="M34 ${H - 92} L34 ${H - 34} L92 ${H - 34}"/>
    <path class="bracket" d="M${W - 92} ${H - 34} L${W - 34} ${H - 34} L${W - 34} ${H - 92}"/>

    <rect x="0" y="0" width="${W}" height="${H}" fill="none"
          stroke="${accent}" stroke-opacity="0.22" stroke-width="3"/>
  </g>
</svg>
`;

  return namespaceSvg(svg, uidFor(slug || title));
}

/* ────────────────────────────────────────────────────────────────
   5. 글에서 재료 뽑기
   ──────────────────────────────────────────────────────────────── */

/** 일부 글은 BOM 으로 시작한다. 그대로 두면 `^---` 가 안 맞아 제목이 통째로 날아간다. */
const stripBom = (s) => String(s).replace(/^﻿/, "");

/** frontmatter 를 최소한으로 읽는다 — 이 스크립트가 필요한 다섯 칸만. */
function readFrontmatter(rawInput) {
  const raw = stripBom(rawInput);
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const body = m[1];
  const out = {};
  const scalar = (key) => {
    const re = new RegExp(`^${key}:[ \\t]*(.+)$`, "m");
    const hit = body.match(re);
    if (!hit) return undefined;
    return hit[1].trim().replace(/^["']|["']$/g, "");
  };
  for (const k of ["title", "slug", "category", "excerpt", "coverImage"]) {
    const v = scalar(k);
    if (v && v !== ">" && v !== "|") out[k] = v;
  }
  // excerpt 가 블록 스칼라(`excerpt: >`)인 경우 다음 들여쓴 줄들을 잇는다
  if (!out.excerpt) {
    const block = body.match(/^excerpt:[ \t]*[>|][-+]?\r?\n((?:[ \t]+.*\r?\n?)+)/m);
    if (block) out.excerpt = block[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join(" ");
  }
  return out;
}

/** 본문 첫 코드 펜스 — 표지에 깔 코드. 없으면 빈 배열. */
function firstCodeBlock(rawInput) {
  const body = stripBom(rawInput).replace(/^---[\s\S]*?\r?\n---/, "");
  const m = body.match(/```(js|javascript|ts|typescript|jsx|tsx)?\r?\n([\s\S]*?)```/);
  if (!m) return [];
  return m[2]
    .split(/\r?\n/)
    .filter((l) => l.trim().length)
    .slice(0, 9)
    .map((l) => (l.length > 48 ? `${l.slice(0, 47)}…` : l));
}

/** 카테고리 마지막 칸 = 주제 */
const topicOf = (category) =>
  String(category || "").replace(/\\/g, "/").split("/").filter(Boolean).pop() || "";

function planFromPost(file, overrides) {
  const raw = fs.readFileSync(file, "utf8");
  const fm = readFrontmatter(raw);
  const category = overrides.category || fm.category || "";
  const topic = topicOf(category);
  const title = overrides.title || fm.title || path.basename(file, ".md");
  const slug = overrides.slug || fm.slug || path.basename(file, ".md");
  const subtitle =
    overrides.subtitle ??
    (fm.excerpt ? fm.excerpt.split(/(?<=[.。])\s|\. /)[0].replace(/\s+$/, "") : "");

  const codeLines = overrides.code
    ? overrides.code.split("\\n")
    : firstCodeBlock(raw);

  return {
    file,
    title,
    slug,
    category,
    subtitle,
    kicker: overrides.kicker || category,
    codeLines: codeLines.length ? codeLines : defaultCode(topic),
    accent: categoryColor(category),
    topicColor: TOPIC_ACCENTS[topic] || categoryColor(category),
    mark: TOPIC_MARKS[topic] || topic.slice(0, 2).toUpperCase() || "··",
  };
}

/** 코드 블록이 없는 글에도 뭔가는 깔아 준다. */
function defaultCode(topic) {
  return [
    `// ${topic || "note"}`,
    "const understand = (topic) => {",
    "  const notes = read(topic);",
    "  return notes.map(explain);",
    "};",
  ];
}

/* ────────────────────────────────────────────────────────────────
   6. CLI
   ──────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const opts = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const noValue = ["dry", "write-frontmatter"];
      if (noValue.includes(key)) opts[key] = true;
      else opts[key] = argv[++i];
    } else positional.push(a);
  }
  return { opts, positional };
}

function collectMarkdown(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  const out = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const p = path.join(target, entry.name);
    if (entry.isDirectory()) out.push(...collectMarkdown(p));
    else if (entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

function setFrontmatterCover(file, coverPath) {
  const raw = fs.readFileSync(file, "utf8");
  if (/^coverImage:/m.test(raw)) {
    fs.writeFileSync(file, raw.replace(/^coverImage:.*$/m, `coverImage: ${coverPath}`), "utf8");
  } else {
    fs.writeFileSync(
      file,
      raw.replace(/^(title:.*)$/m, `$1\ncoverImage: ${coverPath}`),
      "utf8"
    );
  }
}

function main() {
  const { opts, positional } = parseArgs(process.argv.slice(2));
  const outDirDefault = path.join("public", "post-thumbnails");

  /** 글 없이 제목만으로 만드는 길 */
  if (!positional.length) {
    if (!opts.title) {
      console.error(
        "사용법: node scripts/generate-thumbnail.mjs <post.md | 폴더>\n" +
          "       node scripts/generate-thumbnail.mjs --title \"제목\" --slug s --category frontend/javascript"
      );
      process.exit(1);
    }
    const topic = topicOf(opts.category);
    const slug = opts.slug || "thumbnail";
    const plan = {
      title: opts.title,
      slug,
      category: opts.category || "",
      subtitle: opts.subtitle || "",
      kicker: opts.kicker || opts.category || "",
      codeLines: opts.code ? opts.code.split("\\n") : defaultCode(topic),
      accent: categoryColor(opts.category),
      topicColor: TOPIC_ACCENTS[topic] || categoryColor(opts.category),
      mark: TOPIC_MARKS[topic] || topic.slice(0, 2).toUpperCase() || "··",
    };
    const out = opts.out || path.join(outDirDefault, `${slug}.svg`);
    emit(plan, out, opts);
    return;
  }

  const files = positional.flatMap(collectMarkdown);
  for (const file of files) {
    const plan = planFromPost(file, opts);
    const out = opts.out || path.join(outDirDefault, `${plan.slug}.svg`);
    emit(plan, out, opts);
    if (opts["write-frontmatter"] && !opts.dry) {
      const webPath = `/${path.relative("public", out).replace(/\\/g, "/")}`;
      setFrontmatterCover(file, webPath);
      console.log(`   ↳ ${file} coverImage: ${webPath}`);
    }
  }
}

function emit(plan, out, opts) {
  const svg = buildSvg(plan);
  if (opts.dry) {
    console.log(`(dry) ${out}  ${(Buffer.byteLength(svg) / 1024).toFixed(1)}KB`);
    return;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg, "utf8");
  console.log(`✓ ${out}  ${(Buffer.byteLength(svg) / 1024).toFixed(1)}KB  — ${plan.title}`);
}

main();
