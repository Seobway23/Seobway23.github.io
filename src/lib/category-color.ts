/**
 * 카테고리 색 — 장식이 아니라 정보다.
 *
 * 규칙은 하나뿐이다: **최상위 카테고리가 색상(hue)을 정하고, 하위는 그 색의
 * 명도만 달리한다.** 카테고리가 12개인데 색을 12개 주면 아무것도 구분되지 않는다.
 * 최상위 3개만 외우면 되고, 하위는 "같은 계열"로 읽히면 충분하다.
 *
 * 이 색이 쓰이는 곳(전부 같은 값을 본다):
 *   - 왼쪽 사이드바 카테고리 행의 점
 *   - 글 카드의 커서 하이라이트(--glow-c)와 카테고리 배지
 *   - (개념 지도는 도메인 색을 따로 쓴다 — 개념은 카테고리보다 잘게 나뉜다)
 *
 * 테두리 그라데이션 띠는 여기서 정하지 않는다. 그건 사용자가 고른 프리셋
 * (--gradient-start/end)이고 사이트 전체가 공유한다.
 * 정리하면 — 띠 = 사이트의 정체성, --glow-c = 그 카드가 속한 곳.
 */

/** 최상위 카테고리 → 기준 색. 서로 충분히 떨어진 색상만 고른다. */
const TOP_LEVEL_HUES: Record<string, string> = {
  frontend: "#38bdf8", // sky
  study: "#a78bfa", // violet
  work: "#34d399", // emerald
};

const FALLBACK = "#94a3b8"; // slate — 분류되지 않은 것

/* ── 색 변환 (외부 의존성 없이) ─────────────────────────────── */

function hexToHsl(hex: string): [number, number, number] {
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
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

/** 문자열 → 0..1. 같은 하위 카테고리는 늘 같은 명도를 받는다. */
function hashUnit(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

/**
 * 카테고리 경로 → 색.
 *
 * 최상위가 색상을 정하고, 두 번째 칸이 명도를 ±12% 안에서 흔든다.
 * "같은 계열이되 조금 다르다"가 목표다. 더 벌리면 다른 카테고리로 읽힌다.
 */
export function categoryColor(category: string | undefined | null): string {
  const path = String(category || "").replace(/\\/g, "/");
  const [top, second] = path.split("/");
  const base = TOP_LEVEL_HUES[top];
  if (!base) return FALLBACK;
  if (!second) return base;

  const [h, s, l] = hexToHsl(base);
  const shift = (hashUnit(second) - 0.5) * 24; // -12 ~ +12
  const nextL = Math.min(78, Math.max(46, l + shift));
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(nextL)}%)`;
}

/** 최상위 카테고리 색만 필요할 때(사이드바 상위 행 등) */
export function topCategoryColor(category: string | undefined | null): string {
  const top = String(category || "").replace(/\\/g, "/").split("/")[0];
  return TOP_LEVEL_HUES[top] || FALLBACK;
}

export const CATEGORY_TOP_LEVELS = Object.keys(TOP_LEVEL_HUES);
