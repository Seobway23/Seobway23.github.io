/**
 * 댓글 개수 데이터 관리
 * 빌드 타임에 생성된 comments.json 파일에서 댓글 개수를 읽어옴
 */

interface CommentsData {
  [slug: string]: number;
}

let commentsCache: CommentsData | null = null;

/**
 * comments.json 파일에서 댓글 개수 데이터 가져오기
 */
export async function getCommentsData(): Promise<CommentsData> {
  // 캐시가 있으면 반환
  if (commentsCache) {
    return commentsCache;
  }

  try {
    const response = await fetch('/comments.json');
    if (!response.ok) {
      throw new Error('Failed to fetch comments data');
    }
    commentsCache = await response.json();
    return commentsCache || {};
  } catch (error) {
    console.warn('댓글 데이터를 가져올 수 없습니다. 기본값을 사용합니다.', error);
    return {};
  }
}

/**
 * 특정 게시글의 댓글 개수 가져오기
 */
export async function getPostComments(slug: string): Promise<number> {
  const comments = await getCommentsData();
  return comments[slug] || 0;
}

/**
 * 댓글 데이터 초기화 (캐시 클리어)
 */
export function clearCommentsCache(): void {
  commentsCache = null;
}

