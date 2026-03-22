/**
 * 최신 댓글 데이터 관리
 * 빌드 타임에 생성된 recent-comments.json 파일에서 최신 댓글을 읽어옴
 */

export interface RecentComment {
  slug: string;
  postTitle: string;
  author: string;
  content: string;
  date: string;
  url: string;
}

let recentCommentsCache: RecentComment[] | null = null;

/** posts.json 로드 결과 — ok가 false면 필터 생략(폴백), true면 slug 집합으로 필터 */
async function loadValidPostSlugs(): Promise<{
  ok: boolean;
  slugs: Set<string>;
}> {
  try {
    const res = await fetch("/posts.json");
    if (!res.ok) return { ok: false, slugs: new Set() };
    const posts: { slug?: string }[] = await res.json();
    const slugs = new Set(
      posts.map((p) => p.slug).filter((s): s is string => Boolean(s))
    );
    return { ok: true, slugs };
  } catch {
    return { ok: false, slugs: new Set() };
  }
}

/**
 * recent-comments.json 파일에서 최신 댓글 데이터 가져오기
 * (posts.json에 없는 slug는 제외 — 글 삭제 후 fetch를 안 돌렸거나 JSON이 낡았을 때 대비)
 */
export async function getRecentComments(): Promise<RecentComment[]> {
  if (recentCommentsCache) {
    return recentCommentsCache;
  }

  try {
    const [{ ok: postsOk, slugs: validSlugs }, recentRes] = await Promise.all([
      loadValidPostSlugs(),
      fetch("/recent-comments.json"),
    ]);

    if (!recentRes.ok) {
      throw new Error(`HTTP ${recentRes.status}: ${recentRes.statusText}`);
    }

    const data = await recentRes.json();
    const raw: RecentComment[] = Array.isArray(data) ? data : [];
    recentCommentsCache =
      postsOk ? raw.filter((c) => validSlugs.has(c.slug)) : raw;
    return recentCommentsCache;
  } catch (error) {
    console.warn(
      "최신 댓글 데이터를 가져올 수 없습니다. 빈 배열을 반환합니다.",
      error
    );
    return [];
  }
}

/**
 * 최신 댓글 데이터 초기화 (캐시 클리어)
 */
export function clearRecentCommentsCache(): void {
  recentCommentsCache = null;
}
