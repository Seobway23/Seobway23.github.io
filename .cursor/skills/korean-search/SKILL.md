---
name: korean-search
description: 한글 초성/자모 검색 엔진 및 검색 다이얼로그 기능 확장. 검색 로직 수정, 자동완성 개선, 검색 히스토리 관리, Cmd+K 다이얼로그 수정을 요청할 때 사용.
---

# 한글 검색 시스템 스킬

## 검색 아키텍처

```
사용자 입력
    ↓
SearchDialog (src/components/search-dialog.tsx)
    ↓
searchPosts() (src/lib/posts.ts)
    ↓
koreanSearch() (src/lib/korean-search.ts)  ← 핵심 엔진
    +
searchAutocomplete() (src/lib/search-autocomplete.ts)
    +
SearchHistory (src/lib/search-history.ts)
```

## 검색 점수 시스템

`src/lib/korean-search.ts`:
| 매칭 유형 | 점수 |
|-----------|------|
| 정확 일치 | 100 |
| 시작 일치 | 90 |
| 포함 | 70 |
| 초성 검색 (`ㄹㅇㅌ` → `리액트`) | 50 |
| 자모 분리 검색 | 40 |

## 검색 필드별 가중치

`src/lib/posts.ts`의 `searchPosts()`:
```typescript
const weights = {
  title: 3.0,      // 제목 (최고 우선순위)
  tags: 2.5,       // 태그
  excerpt: 1.5,    // 요약
  content: 1.0,    // 본문
};
```

## 새 검색 필드 추가

`searchPosts()` 함수에서 가중치 추가:
```typescript
// content 외 새 필드 추가 예시
const newFieldScore = koreanSearch(post.newField || '', query);
score += newFieldScore * 1.2; // 가중치 설정
```

## 검색 결과 타입

SearchDialog에서 3가지 결과 타입 표시:
```typescript
type SearchSuggestion =
  | { type: 'post'; post: Post }        // 게시글
  | { type: 'tag'; tag: string }        // 태그 제안
  | { type: 'category'; cat: string }  // 카테고리 제안
```

## 검색 히스토리

`src/lib/search-history.ts` - localStorage 기반:
```typescript
import { addSearchHistory, getSearchHistory, clearSearchHistory } from '@/lib/search-history';

// 검색 실행 시
addSearchHistory(query);

// 표시 시
const history = getSearchHistory(); // 최대 10개
```

## URL 검색 파라미터

```
/?search=키워드      → 텍스트 검색
/?tag=React          → 태그 필터
/?category=frontend  → 카테고리 필터
/?sort=popular       → 정렬 (popular|latest|oldest)
```

## 자동완성 캐시 설정

`src/lib/search-autocomplete.ts` 결과는 TanStack Query로 캐싱:
- staleTime: 30초
- queryKey: `['search-autocomplete', query]`
