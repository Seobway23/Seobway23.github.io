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

/**
 * recent-comments.json 파일에서 최신 댓글 데이터 가져오기
 */
export async function getRecentComments(): Promise<RecentComment[]> {
  // 캐시가 있으면 반환
  if (recentCommentsCache) {
    return recentCommentsCache;
  }

  try {
    const response = await fetch("/recent-comments.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    recentCommentsCache = Array.isArray(data) ? data : [];
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
