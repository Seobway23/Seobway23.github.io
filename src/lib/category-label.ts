/** 카테고리 경로 조각의 표시 이름. 없는 조각은 폴더 이름을 그대로 쓴다. */
const SEGMENT_LABELS: Record<string, string> = {
  frontend: "Frontend",
  study: "Study",
  work: "Work",
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  "react-query": "React Query",
  threejs: "Three.js",
  css: "CSS",
  styling: "스타일링",
  performance: "성능",
  "data-fetching": "데이터 페칭",
  nextjs: "Next.js",
  gstack: "gstack",
  algorithm: "알고리즘",
  mechanics: "역학",
  basics: "기초",
  "earth-pressure": "토압",
  network: "네트워크",
  backend: "백엔드",
  infra: "인프라",
  electron: "Electron",
  engineering: "엔지니어링",
  architecture: "아키텍처",
  analysis: "분석",
  testing: "테스트",
  ai: "AI",
  roadmap: "로드맵",
};

export function segmentLabel(segment: string): string {
  return SEGMENT_LABELS[segment] || segment;
}

export type CategoryCrumb = { path: string; label: string };

/** "work/RAG" → [{path:"work",label:"Work"}, {path:"work/RAG",label:"RAG"}] */
export function categoryTrail(category: string): CategoryCrumb[] {
  const parts = String(category || "").replace(/\\/g, "/").split("/").filter(Boolean);
  return parts.map((seg, i) => ({
    path: parts.slice(0, i + 1).join("/"),
    label: segmentLabel(seg),
  }));
}

/** 배지용 짧은 표기: 최상위와 마지막 조각. "study/backend/django" → "Study › django" */
export function categoryBadgeLabel(category: string): string {
  const trail = categoryTrail(category);
  if (trail.length <= 1) return trail[0]?.label ?? "";
  return `${trail[0].label} › ${trail[trail.length - 1].label}`;
}
