/**
 * 조회수 데이터 관리
 * 빌드 타임에 생성된 views.json 파일에서 조회수를 읽어옴
 */

interface ViewsData {
  [slug: string]: number;
}

let viewsCache: ViewsData | null = null;

/**
 * views.json 파일에서 조회수 데이터 가져오기
 */
export async function getViewsData(): Promise<ViewsData> {
  // 캐시가 있으면 반환
  if (viewsCache) {
    return viewsCache;
  }

  try {
    const response = await fetch("/views.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    viewsCache = data;
    return viewsCache || {};
  } catch (error) {
    return {};
  }
}

/**
 * 특정 게시글의 조회수 가져오기
 */
export async function getPostViews(slug: string): Promise<number> {
  const views = await getViewsData();
  return views[slug] || 0;
}

/**
 * 조회수 데이터 초기화 (캐시 클리어)
 */
export function clearViewsCache(): void {
  viewsCache = null;
}
