import type { Post } from "@shared/schema";

/** 카테고리별 기본(언스플래시) 이미지 — coverImage 없을 때만 사용 */
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  // ── Frontend ──────────────────────────────────────────────────────────────
  react:
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  typescript:
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  css: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  performance:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  nextjs:
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Study (general) ───────────────────────────────────────────────────────
  study:
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Backend ───────────────────────────────────────────────────────────────
  backend:
    "https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/backend":
    "https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Django ────────────────────────────────────────────────────────────────
  django:
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/backend/django":
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  python:
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── AI (에이전트·LLM 도구) ─────────────────────────────────────────────────
  ai:
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/ai":
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/ai/gstack":
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Infra ─────────────────────────────────────────────────────────────────
  infra:
    "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/infra":
    "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  devops:
    "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Docker ────────────────────────────────────────────────────────────────
  docker:
    "https://images.unsplash.com/photo-1605745341112-85968b19335b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/infra/docker":
    "https://images.unsplash.com/photo-1605745341112-85968b19335b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Celery ────────────────────────────────────────────────────────────────
  celery:
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/infra/celery":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Network ───────────────────────────────────────────────────────────────
  network:
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/network":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Network / MAC (Layer 2 / MAC Address) ────────────────────────────────
  mac:
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/network/mac":
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",

  // ── Microservices ─────────────────────────────────────────────────────────
  micro:
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  microservices:
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/network/micro":
    "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
};

export function normalizeCoverImageSrc(
  src: string | null | undefined
): string | null {
  if (src == null || typeof src !== "string") return null;
  const s = src.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return `/${s.replace(/^\.\//, "")}`;
}

/** 목록 카드 · 포스트 상단 히어로에 쓸 최종 이미지 URL */
export function getPostCoverImageUrl(
  post: Pick<Post, "coverImage" | "category">
): string {
  const fromFront = normalizeCoverImageSrc(post.coverImage ?? undefined);
  if (fromFront) return fromFront;

  const cat = post.category || "";
  return (
    CATEGORY_FALLBACK_IMAGES[cat] ??
    CATEGORY_FALLBACK_IMAGES[cat.split("/").pop() ?? ""] ??
    CATEGORY_FALLBACK_IMAGES.react
  );
}
