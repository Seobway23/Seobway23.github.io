/**
 * 개념 그래프 읽기 + 진도 저장.
 *
 * 데이터는 빌드가 만든다 (scripts/build-concept-graph.mjs → public/concept-graph.json).
 * 여기서는 읽기와, 브라우저에만 남는 "읽음" 표시만 다룬다.
 */

import { publicUrl } from "@/lib/public-path";

export interface ConceptNode {
  id: string;
  label: string;
  domain: string;
  summary: string;
  prereq: string[];
  next: string[];
  level: number | null;
  track: string | null;
  /** 카테고리별 지도 필터용. 글이 있으면 그 글의 category, 없으면 domain 기본값 */
  category: string;
  written: boolean;
  post: string | null;
  postTitle: string | null;
  readTime: number | null;
  excerpt: string | null;
  chain: string[];
}

export interface ConceptTrack {
  label: string;
  summary: string;
  order: string[];
  written: number;
  total: number;
}

export interface ConceptGraph {
  generatedAt: string;
  nodes: ConceptNode[];
  levels: string[][];
  tracks: Record<string, ConceptTrack>;
  stats: { concepts: number; written: number; depth: number; tracks: number };
}

let cache: ConceptGraph | null = null;

export async function getConceptGraph(): Promise<ConceptGraph> {
  if (cache) return cache;
  const res = await fetch(publicUrl("concept-graph.json"));
  if (!res.ok) throw new Error("concept-graph.json 을 불러오지 못했다");
  cache = (await res.json()) as ConceptGraph;
  return cache;
}

/* ── 진도 (브라우저에만 남는다) ─────────────────────────────── */

const READ_KEY = "concept-read";

/** 읽은 개념 id 집합. localStorage 를 못 쓰는 환경에서도 빈 집합으로 동작한다. */
export function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.filter((x) => typeof x === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function setRead(conceptId: string, read: boolean): Set<string> {
  const set = getReadSet();
  if (read) set.add(conceptId);
  else set.delete(conceptId);
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // 저장 못 해도 이번 세션에는 반영된다
  }
  window.dispatchEvent(new CustomEvent("concept-read-change"));
  return set;
}

/** 선행을 하나라도 안 읽었으면 잠긴 것으로 본다(막지는 않고 흐리게 표시만). */
export function isLocked(node: ConceptNode, read: Set<string>): boolean {
  if (node.prereq.length === 0) return false;
  return !node.prereq.every((p) => read.has(p));
}

export const DOMAIN_COLORS: Record<string, string> = {
  javascript: "#f0b429",
  typescript: "#3b82f6",
  react: "#22d3ee",
  css: "#ec4899",
  build: "#a78bfa",
  perf: "#f97316",
  a11y: "#34d399",
  test: "#94a3b8",
};

export function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || "#94a3b8";
}
