import type { Post } from "@shared/schema";

/** 카테고리별 기본(언스플래시) 이미지 — coverImage 없을 때만 사용 */
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  react:
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  typescript:
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  css: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  performance:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  nextjs:
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  "study/infra":
    "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  infra:
    "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  devops:
    "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
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
