/**
 * ```chart 펜스 → 빌드 시 인라인 SVG.
 *
 * 왜 빌드 시 SVG인가: 런타임 차트 라이브러리 없이 프리렌더 HTML 에 그림이 들어가고,
 * 인라인이라 색을 CSS 변수(.pc-*)로 받아 다크/라이트 테마를 그대로 따른다.
 *
 * 값은 본문에 숫자로 적지 않고 public/ 아래 원시 데이터 파일을 가리킨다.
 * 부록에 링크한 파일과 그림의 숫자가 어긋날 수 없게 하려는 것이다.
 * 경로에 없는 값을 가리키면 빌드를 멈춘다(조용히 0 을 그리지 않는다).
 *
 * 공통 필드
 *   type     bar | multiples | dumbbell | heatmap
 *   caption  그림 설명 (그림 번호는 generate-posts-data.js 가 붙인다)
 *   source   "/post-assets/.../file.json"  (public/ 기준)
 *   path 템플릿의 {panel} {bar} {step} {row} {col} 은 각 항목의 key 로 바뀐다.
 *
 * 형식별 필드 — posts/README.md 「차트」 절 참고.
 */

import fs from "node:fs";
import path from "node:path";

const W = 720;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 지표값은 항상 같은 자릿수로 쓴다. 0 · 1 을 "0" · "1" 로 쓰면 0.033 과 나란히 놓였을 때 다른 종류의 값처럼 읽힌다.
const fmt = (v, d = 3) => Number(v).toFixed(d);

function makeResolver(publicDir) {
  const cache = new Map();
  const load = (src) => {
    if (!cache.has(src)) {
      const file = path.join(publicDir, src.replace(/^\//, ""));
      if (!fs.existsSync(file)) throw new Error(`chart source 없음: ${src}`);
      cache.set(src, JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")));
    }
    return cache.get(src);
  };
  return (src, p, vars = {}) => {
    const filled = p.replace(/\{(\w+)\}/g, (_, k) => {
      if (!(k in vars)) throw new Error(`chart path 변수 없음: {${k}} in ${p}`);
      return vars[k];
    });
    let cur = load(src);
    for (const seg of filled.split(".")) {
      if (cur == null || !(seg in Object(cur))) throw new Error(`chart 값 없음: ${src} → ${filled}`);
      cur = cur[seg];
    }
    return cur;
  };
}

function svgOpen(h, label) {
  return `<svg class="post-chart__svg" viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">`;
}

function legend(items, y) {
  let x = 0;
  let out = "";
  for (const it of items) {
    const shape =
      it.style === "off"
        ? `<rect x="${x}" y="${y - 9}" width="11" height="11" rx="2" class="pc-off"/>`
        : `<rect x="${x}" y="${y - 9}" width="11" height="11" rx="2" class="${it.cls}"/>`;
    out += shape + `<text x="${x + 16}" y="${y}" class="pc-legend">${esc(it.label)}</text>`;
    x += 16 + it.label.length * 11 + 22;
  }
  return out;
}

/* ── bar: 패널마다 가로 막대 ─────────────────────────────────────── */
function renderBar(spec, get) {
  const panels = spec.panels;
  const bars = spec.bars;
  const gap = 28;
  const pw = (W - gap * (panels.length - 1)) / panels.length;
  const row = 30;
  const top = 26;
  const h = top + bars.length * row + 8;
  const labelW = 78;
  const valueW = 46;
  const max = spec.max ?? 1;
  let body = "";
  panels.forEach((pn, i) => {
    const x0 = i * (pw + gap);
    const plotX = x0 + labelW;
    const plotW = pw - labelW - valueW;
    body += `<text x="${x0}" y="14" class="pc-title">${esc(pn.label)}</text>`;
    for (const g of [0.5, 1]) {
      const gx = plotX + (plotW * g) / max;
      body += `<line x1="${gx}" x2="${gx}" y1="${top - 4}" y2="${top + bars.length * row - 6}" class="pc-grid"/>`;
    }
    body += `<line x1="${plotX}" x2="${plotX}" y1="${top - 4}" y2="${top + bars.length * row - 6}" class="pc-axis"/>`;
    bars.forEach((b, j) => {
      const v = Number(get(spec.source, spec.value, { panel: pn.key, bar: b.key }));
      const y = top + j * row;
      const bw = Math.max(2, (plotW * v) / max);
      const cls = b.style === "base" ? "pc-base" : "pc-on";
      body += `<text x="${x0}" y="${y + 13}" class="pc-label">${esc(b.label)}</text>`;
      body += `<rect x="${plotX}" y="${y}" width="${bw}" height="18" rx="3" class="${cls}"><title>${esc(`${pn.label} · ${b.label}: ${fmt(v)}`)}</title></rect>`;
      body += `<text x="${plotX + bw + 6}" y="${y + 13}" class="pc-value">${fmt(v)}</text>`;
    });
  });
  return svgOpen(h, spec.caption) + body + "</svg>";
}

/* ── multiples: 패널마다 세로 막대(단계별) ──────────────────────── */
function renderMultiples(spec, get) {
  const panels = spec.panels;
  const steps = spec.steps;
  const cols = spec.columns ?? 3;
  const rows = Math.ceil(panels.length / cols);
  const gapX = 26;
  const gapY = 22;
  const legendH = 26;
  const pw = (W - gapX * (cols - 1)) / cols;
  const ph = 150;
  const plotTop = 34;
  const plotH = 88;
  const max = spec.max ?? 1;
  const h = legendH + rows * ph + (rows - 1) * gapY;
  const leg = [];
  const seen = new Set();
  for (const s of steps) {
    const key = s.style || "on";
    if (s.legend && !seen.has(key)) {
      seen.add(key);
      leg.push({ label: s.legend, style: key, cls: key === "base" ? "pc-base" : "pc-on" });
    }
  }
  let body = legend(leg, 14);
  const tickW = 24; // 왼쪽 눈금 칸. 오른쪽에 두면 1.0 근처 막대 값과 겹친다
  panels.forEach((pn, i) => {
    const cx = (i % cols) * (pw + gapX);
    const cy = legendH + Math.floor(i / cols) * (ph + gapY);
    const baseY = cy + plotTop + plotH;
    const px = cx + tickW;
    const pwPlot = pw - tickW;
    body += `<text x="${cx}" y="${cy + 16}" class="pc-title">${esc(pn.label)}</text>`;
    for (const g of [0.5, 1]) {
      const gy = baseY - (plotH * g) / max;
      body += `<line x1="${px}" x2="${cx + pw}" y1="${gy}" y2="${gy}" class="pc-grid"/>`;
      body += `<text x="${px - 5}" y="${gy + 4}" class="pc-tick" text-anchor="end">${g.toFixed(1)}</text>`;
    }
    body += `<line x1="${px}" x2="${cx + pw}" y1="${baseY}" y2="${baseY}" class="pc-axis"/>`;
    const slot = pwPlot / steps.length;
    const bw = Math.min(30, slot * 0.62);
    steps.forEach((s, j) => {
      const v = Number(get(spec.source, spec.value, { panel: pn.key, step: s.key }));
      const bh = Math.max(1.5, (plotH * v) / max);
      const bx = px + slot * j + (slot - bw) / 2;
      const cls = s.style === "base" ? "pc-base" : s.style === "off" ? "pc-off" : "pc-on";
      body += `<rect x="${bx}" y="${baseY - bh}" width="${bw}" height="${bh}" rx="2.5" class="${cls}"><title>${esc(`${pn.label} · ${s.label}: ${fmt(v)}`)}</title></rect>`;
      body += `<text x="${bx + bw / 2}" y="${baseY - bh - 4}" class="pc-value pc-value--sm" text-anchor="middle">${fmt(v, 2)}</text>`;
      body += `<text x="${bx + bw / 2}" y="${baseY + 14}" class="pc-tick" text-anchor="middle">${esc(s.label)}</text>`;
    });
  });
  return svgOpen(h, spec.caption) + body + "</svg>";
}

/* ── dumbbell: 행마다 전 → 후 ───────────────────────────────────── */
function renderDumbbell(spec, get) {
  const rows = spec.rows;
  const labelW = 120;
  const rightW = 120;
  const row = 32;
  const top = 34;
  const plotX = labelW;
  const plotW = W - labelW - rightW;
  const h = top + rows.length * row + 26;
  const max = spec.max ?? 1;
  const X = (v) => plotX + (plotW * v) / max;
  let body = legend(
    [
      { label: spec.from.label, cls: "pc-base" },
      { label: spec.to.label, cls: "pc-on" },
    ],
    14,
  );
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    body += `<line x1="${X(t)}" x2="${X(t)}" y1="${top - 8}" y2="${top + rows.length * row - 10}" class="${t === 0 ? "pc-axis" : "pc-grid"}"/>`;
    body += `<text x="${X(t)}" y="${top + rows.length * row + 8}" class="pc-tick" text-anchor="middle">${t.toFixed(2)}</text>`;
  }
  rows.forEach((r, i) => {
    const a = Number(get(spec.from.source, spec.from.path, { row: r.key }));
    const b = Number(get(spec.to.source, spec.to.path, { row: r.key }));
    const y = top + i * row;
    body += `<text x="0" y="${y + 4}" class="pc-label">${esc(r.label)}</text>`;
    if (Math.abs(a - b) > 1e-9) {
      body += `<line x1="${X(a)}" x2="${X(b)}" y1="${y}" y2="${y}" class="pc-link"/>`;
      body += `<circle cx="${X(a)}" cy="${y}" r="6" class="pc-base"><title>${esc(`${r.label} ${spec.from.label}: ${fmt(a)}`)}</title></circle>`;
    }
    body += `<circle cx="${X(b)}" cy="${y}" r="6" class="pc-on"><title>${esc(`${r.label} ${spec.to.label}: ${fmt(b)}`)}</title></circle>`;
    const txt = Math.abs(a - b) > 1e-9 ? `${fmt(a)} → ${fmt(b)}` : `${fmt(b)} (변화 없음)`;
    body += `<text x="${X(Math.max(a, b)) + 12}" y="${y + 4}" class="pc-value">${esc(txt)}</text>`;
  });
  return svgOpen(h, spec.caption) + body + "</svg>";
}

/* ── heatmap: 행(질의) × 열(단계), 칸 = 순위 ─────────────────────── */
function renderHeatmap(spec, get) {
  const cols = spec.columns;
  const labels = get(spec.source, spec.rowLabels.path);
  const rowsAll = (Array.isArray(labels) ? labels : []).filter((q) =>
    Object.entries(spec.rowLabels.filter || {}).every(([k, v]) => q[k] === v),
  );
  const names = rowsAll.map((q) => q[spec.rowLabels.field]);
  const cellsByCol = cols.map((c) => get(spec.source, spec.cell, { col: c.key }));
  cellsByCol.forEach((arr, j) => {
    if (!Array.isArray(arr) || arr.length !== names.length)
      throw new Error(`chart heatmap 열 길이 불일치: ${cols[j].key} (${arr?.length} vs ${names.length})`);
  });
  const labelW = 360;
  const cw = (W - labelW) / cols.length;
  const rh = 22;
  const top = 50;
  const h = top + names.length * rh + 4;
  const bucket = (r) => (r === 0 ? "pc-h0" : r === 1 ? "pc-h1" : r <= 3 ? "pc-h2" : "pc-h3");
  let body = legend(
    [
      { label: "1위", cls: "pc-h1" },
      { label: "2~3위", cls: "pc-h2" },
      { label: "4~20위", cls: "pc-h3" },
      { label: "20위 밖", cls: "pc-h0" },
    ],
    14,
  );
  cols.forEach((c, j) => {
    body += `<text x="${labelW + cw * j + cw / 2}" y="${top - 8}" class="pc-title" text-anchor="middle">${esc(c.label)}</text>`;
  });
  const maxChars = spec.rowLabels.maxChars ?? 26;
  names.forEach((n, i) => {
    const y = top + i * rh;
    const short = n.length > maxChars ? n.slice(0, maxChars - 1) + "…" : n;
    body += `<text x="0" y="${y + 15}" class="pc-label"><title>${esc(n)}</title>${esc(`${i + 1}. ${short}`)}</text>`;
    cols.forEach((c, j) => {
      const r = Number(cellsByCol[j][i]);
      const x = labelW + cw * j;
      body += `<rect x="${x + 2}" y="${y + 1}" width="${cw - 4}" height="${rh - 3}" rx="3" class="${bucket(r)}"><title>${esc(`${i + 1}. ${n} · ${c.label}: ${r === 0 ? "20위 밖" : r + "위"}`)}</title></rect>`;
      body += `<text x="${x + cw / 2}" y="${y + 15}" class="pc-cell ${r === 1 ? "pc-cell--strong" : r === 0 ? "pc-cell--miss" : ""}" text-anchor="middle">${r === 0 ? "밖" : r}</text>`;
    });
  });
  return svgOpen(h, spec.caption) + body + "</svg>";
}

const RENDERERS = { bar: renderBar, multiples: renderMultiples, dumbbell: renderDumbbell, heatmap: renderHeatmap };

/** 펜스 본문(JSON) → <figure> HTML. 그림 번호 자리는 비워 둔다. */
export function renderChartFigure(jsonText, { publicDir, file }) {
  let spec;
  try {
    spec = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`chart JSON 파싱 실패 (${file}): ${e.message}`);
  }
  const fn = RENDERERS[spec.type];
  if (!fn) throw new Error(`chart type 모름: ${spec.type} (${file})`);
  const get = makeResolver(publicDir);
  const svg = fn(spec, get);
  const src = spec.source ? ` <span class="post-figure__src">데이터: <a href="${esc(spec.source)}" target="_blank">${esc(path.basename(spec.source))}</a></span>` : "";
  return `<figure class="post-figure post-chart">${svg}<figcaption><span class="post-figure__no"></span> ${esc(spec.caption || "")}${src}</figcaption></figure>`;
}

/**
 * 마크다운의 ```chart 펜스를 자리표시자로 바꾸고 렌더한 HTML 을 모은다.
 * marked 가 자리표시자를 <p>로 감싸므로 injectChartsIntoHtml 이 그 <p> 째로 바꾼다.
 */
export function processChartBlocks(md, opts) {
  const slots = [];
  const out = md.replace(/^```chart[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/gm, (_m, body) => {
    const id = `@@POSTCHART${slots.length}@@`;
    slots.push({ id, html: renderChartFigure(body, opts) });
    return `\n\n${id}\n\n`;
  });
  return { markdown: out, slots };
}

export function injectChartsIntoHtml(html, slots) {
  let h = html;
  for (const { id, html: fig } of slots) {
    h = h.replace(new RegExp(`<p>\\s*${id}\\s*</p>`), fig).split(id).join(fig);
  }
  return h;
}

/**
 * 그림 번호: 본문 순서대로 「그림 N.」. 이미지 figure 와 차트 figure 가 같은 번호열을 쓴다.
 * marked 가 인라인 이미지 figure 를 <p> 로 감싼 것도 여기서 풀어낸다.
 */
export function numberFigures(html) {
  let h = html.replace(/<p>\s*(<figure class="post-figure[\s\S]*?<\/figure>)\s*<\/p>/g, "$1");
  let n = 0;
  h = h.replace(/<span class="post-figure__no"><\/span>/g, () => `<span class="post-figure__no">그림 ${++n}.</span>`);
  return h;
}
