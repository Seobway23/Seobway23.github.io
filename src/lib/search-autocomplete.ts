/**
 * 검색 자동완성 및 연관검색어 로직
 */

import type { Post } from "@shared/schema";
import { getAllPosts } from "./posts";
import { matchesKoreanSearch, calculateSearchScore } from "./korean-search";

export interface SearchSuggestion {
  type: "post" | "tag" | "category";
  title: string;
  subtitle?: string;
  value: string;
  score: number;
  slug?: string; // 게시글인 경우 slug
}

/**
 * 모든 태그 추출
 */
async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag.toLowerCase()));
  });
  return Array.from(tagSet);
}

/**
 * 모든 카테고리 추출
 */
async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categorySet = new Set<string>();
  posts.forEach((post) => {
    if (post.category) {
      categorySet.add(post.category);
    }
  });
  return Array.from(categorySet);
}

/**
 * 검색 자동완성 제안 생성
 * @param query 검색어
 * @param limit 최대 결과 수
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 10
): Promise<SearchSuggestion[]> {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const suggestions: SearchSuggestion[] = [];

  // 1. 게시글 검색 (제목, 내용 모두 검색)
  const posts = await getAllPosts();
  posts.forEach((post) => {
    let score = 0;
    let matched = false;
    let matchType = ""; // "title" | "content" | "both"

    // 제목 검색
    if (matchesKoreanSearch(post.title, normalizedQuery)) {
      score += calculateSearchScore(post.title, normalizedQuery) * 3;
      matched = true;
      matchType = "title";
    }

    // 내용 검색
    if (matchesKoreanSearch(post.content, normalizedQuery)) {
      const contentScore = calculateSearchScore(post.content, normalizedQuery);
      score += contentScore;
      matched = true;
      if (matchType) {
        matchType = "both";
      } else {
        matchType = "content";
      }
    }

    // 요약 검색
    if (matchesKoreanSearch(post.excerpt, normalizedQuery)) {
      score += calculateSearchScore(post.excerpt, normalizedQuery) * 2;
      matched = true;
    }

    if (matched) {
      // 내용에서 매칭된 경우, 매칭된 부분의 일부를 subtitle로 표시
      let subtitle = post.excerpt;
      if (matchType === "content" || matchType === "both") {
        // 내용에서 검색어 주변 텍스트 추출
        const contentLower = post.content.toLowerCase();
        const queryIndex = contentLower.indexOf(normalizedQuery);
        if (queryIndex !== -1) {
          const start = Math.max(0, queryIndex - 50);
          const end = Math.min(
            post.content.length,
            queryIndex + normalizedQuery.length + 50
          );
          const snippet = post.content.substring(start, end);
          subtitle = `...${snippet}...`;
        }
      }

      suggestions.push({
        type: "post",
        title: post.title,
        subtitle: subtitle,
        value: post.title,
        slug: post.slug, // slug 추가
        score: score + 100, // 게시글에 가중치
      });
    }
  });

  // 2. 태그 검색
  const tags = await getAllTags();
  tags.forEach((tag) => {
    if (matchesKoreanSearch(tag, normalizedQuery)) {
      const score = calculateSearchScore(tag, normalizedQuery);
      suggestions.push({
        type: "tag",
        title: `태그: ${tag}`,
        value: `tag:${tag}`,
        score: score + 80, // 태그에 가중치
      });
    }
  });

  // 3. 카테고리 검색
  const categories = await getAllCategories();
  categories.forEach((category) => {
    const categoryLabel = category.split(/[/\\]/).pop() || category;
    if (
      matchesKoreanSearch(categoryLabel, normalizedQuery) ||
      matchesKoreanSearch(category, normalizedQuery)
    ) {
      const score = Math.max(
        calculateSearchScore(categoryLabel, normalizedQuery),
        calculateSearchScore(category, normalizedQuery)
      );
      suggestions.push({
        type: "category",
        title: `카테고리: ${categoryLabel}`,
        value: category,
        score: score + 60, // 카테고리에 가중치
      });
    }
  });

  // 점수 순으로 정렬하고 limit만큼 반환
  return suggestions.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 연관검색어 생성 (유사한 검색어 제안)
 */
export async function getRelatedSearchTerms(
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const relatedTerms = new Set<string>();
  const posts = await getAllPosts();

  // 게시글 제목에서 유사한 단어 추출
  posts.forEach((post) => {
    const title = post.title.toLowerCase();
    if (title.includes(normalizedQuery)) {
      // 검색어 주변 단어 추출
      const words = title.split(/\s+/);
      words.forEach((word) => {
        if (
          word.length > 1 &&
          word !== normalizedQuery &&
          word.includes(normalizedQuery)
        ) {
          relatedTerms.add(word);
        }
      });
    }
  });

  // 태그에서 유사한 단어 추출
  const tags = await getAllTags();
  tags.forEach((tag) => {
    if (tag.includes(normalizedQuery) && tag !== normalizedQuery) {
      relatedTerms.add(tag);
    }
  });

  return Array.from(relatedTerms).slice(0, limit);
}

/**
 * 인기 검색어 (조회수 기반)
 */
export async function getPopularSearchTerms(
  limit: number = 5
): Promise<string[]> {
  const posts = await getAllPosts();

  // 조회수 기반 인기 게시글의 제목에서 키워드 추출
  const sortedPosts = [...posts].sort((a, b) => b.views - a.views);
  const keywords = new Set<string>();

  sortedPosts.slice(0, 10).forEach((post) => {
    const words = post.title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 1);
    words.forEach((word) => keywords.add(word));
  });

  return Array.from(keywords).slice(0, limit);
}
