/**
 * 검색 히스토리 관리
 */

const SEARCH_HISTORY_KEY = "blog-search-history";
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

/**
 * 검색 히스토리 가져오기
 */
export function getSearchHistory(): SearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      const history = JSON.parse(stored) as SearchHistoryItem[];
      return history.sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch (error) {
    console.warn("검색 히스토리를 불러올 수 없습니다.", error);
  }

  return [];
}

/**
 * 검색 히스토리에 추가
 */
export function addToSearchHistory(query: string, resultCount?: number): void {
  if (typeof window === "undefined" || !query.trim()) return;

  const history = getSearchHistory();

  // 중복 제거 (같은 쿼리가 있으면 제거)
  const filteredHistory = history.filter((item) => item.query !== query.trim());

  // 새 항목 추가
  const newItem: SearchHistoryItem = {
    query: query.trim(),
    timestamp: Date.now(),
    resultCount,
  };

  // 최신 항목을 맨 앞에 추가하고 최대 개수 제한
  const updatedHistory = [newItem, ...filteredHistory].slice(
    0,
    MAX_HISTORY_ITEMS
  );

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.warn("검색 히스토리를 저장할 수 없습니다.", error);
  }
}

/**
 * 검색 히스토리에서 항목 제거
 */
export function removeFromSearchHistory(query: string): void {
  if (typeof window === "undefined") return;

  const history = getSearchHistory();
  const filteredHistory = history.filter((item) => item.query !== query);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.warn("검색 히스토리를 저장할 수 없습니다.", error);
  }
}

/**
 * 검색 히스토리 전체 삭제
 */
export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.warn("검색 히스토리를 삭제할 수 없습니다.", error);
  }
}
