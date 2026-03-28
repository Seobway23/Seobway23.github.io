---
title: "TanStack Query(React Query) 완전 정복 — 서버 상태 관리의 표준"
slug: react-query-overview
category: study/frontend/react-query
tags: [react-query, tanstack-query, server-state, react, frontend, async, cache]
author: Seobway
readTime: 10
featured: true
createdAt: 2026-03-28
excerpt: >
  Redux로 서버 데이터를 관리하다 지쳤는가? TanStack Query(React Query v5)가
  서버 상태와 클라이언트 상태를 구분하고 캐싱·백그라운드 동기화·에러 처리를
  자동화하는 방식을 설명한다.
---

## 왜 React Query인가

React로 데이터를 fetching하는 고전적인 방법:

```tsx
function TodoList() {
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);
  // ...
}
```

이것만으로는 처리되지 않는 것들:
- 컴포넌트가 다시 마운트될 때 재요청?
- 탭을 다시 활성화할 때 갱신?
- 네트워크 재연결 시 갱신?
- 여러 컴포넌트에서 같은 데이터를 요청할 때 중복 제거?
- 캐시 무효화와 재검증?
- 에러 시 자동 재시도?

이 모든 것이 **TanStack Query**가 해결하는 문제다.<a href="https://tanstack.com/query/latest/docs/framework/react/overview" target="_blank"><sup>[1]</sup></a>

---

## 서버 상태 vs 클라이언트 상태

React Query의 핵심 통찰은 상태를 두 종류로 구분하는 것이다.<a href="https://tkdodo.eu/blog/react-query-as-a-state-manager" target="_blank"><sup>[2]</sup></a>

```mermaid
%% desc: 서버 상태와 클라이언트 상태의 근본적 차이
flowchart LR
  subgraph CLIENT["클라이언트 상태"]
    C1["모달 열림/닫힘"]
    C2["다크모드 설정"]
    C3["폼 입력값"]
    C4["선택된 탭"]
  end

  subgraph SERVER["서버 상태"]
    S1["API 응답 데이터"]
    S2["사용자 프로필"]
    S3["상품 목록"]
    S4["댓글 데이터"]
  end

  CLIENT --> CL["내 앱이 소유\n동기적\n항상 최신"]
  SERVER --> SL["서버가 소유\n비동기적\n언제든 stale"]
```

| 차원 | 클라이언트 상태 | 서버 상태 |
|---|---|---|
| 소유권 | 내 앱 | 원격 서버 |
| 지속성 | 메모리 | DB / API |
| 동기화 | 불필요 | 지속적 동기화 필요 |
| Staleness | 항상 최신 | 즉시 outdated 가능 |
| 비동기 | 거의 없음 | 항상 |

서버 상태 관리를 Redux로 하면:
- Action creators, reducers, selectors, middleware(thunk/saga) 전부 직접 작성
- 캐시 무효화 없음, 백그라운드 갱신 없음, stale 추적 없음
- React Query 10줄이 Redux 수백 줄을 대체한다

> **TkDodo**: React Query is not a cache — it's a **synchronization tool**. 서버가 진짜 데이터 소유자이고, React Query는 UI를 그것과 동기화한다.

---

## Stale-While-Revalidate 전략

React Query는 HTTP의 `stale-while-revalidate` 캐싱 원칙을 채택한다.

```mermaid
%% desc: Stale-While-Revalidate — 캐시된 데이터를 즉시 보여주고 백그라운드에서 재검증
sequenceDiagram
  participant U as 사용자
  participant C as React Query Cache
  participant S as 서버

  U->>C: 컴포넌트 마운트
  C-->>U: ① 캐시 데이터 즉시 반환 (spinner 없음)
  C->>S: ② 백그라운드에서 재검증 요청
  S-->>C: ③ 새 데이터 수신
  C-->>U: ④ 변경됐으면 조용히 UI 업데이트
  Note over U,S: 변경 없으면 UI 업데이트 없음 (structural sharing)
```

1. **캐시 데이터 즉시 반환** — spinner 없음, 빠른 UI
2. **백그라운드에서 재검증** — 네트워크 요청 진행
3. **변경 시 조용히 업데이트** — loading 상태 없이

> **핵심**: stale 데이터가 데이터 없음보다 낫다. 데이터 없음 = loading spinner = 느린 UX.

---

## 설치

```bash
npm install @tanstack/react-query
# DevTools (개발 환경)
npm install @tanstack/react-query-devtools
```

---

## 빠른 시작

```tsx
// main.tsx — QueryClient는 반드시 컴포넌트 밖에서 생성
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,    // 1분 전역 기본값
      retry: 3,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

```tsx
// components/TodoList.tsx
import { useQuery } from '@tanstack/react-query'

function TodoList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json()),
  })

  if (isLoading) return <Spinner />
  if (isError) return <Alert message={error.message} />

  return (
    <ul>
      {data.map(todo => <li key={todo.id}>{todo.title}</li>)}
    </ul>
  )
}
```

이게 전부다. 자동으로 처리되는 것들:
- ✅ 로딩/에러/성공 상태 관리
- ✅ 에러 시 자동 재시도 (3회)
- ✅ 윈도우 포커스 복귀 시 백그라운드 갱신
- ✅ 동일 키 중복 요청 자동 dedup
- ✅ 5분간 캐시 유지 (gcTime 기본값)

---

## Redux/Zustand와의 역할 분담

React Query를 도입한 뒤 남은 진짜 클라이언트 상태는 매우 작다.

```mermaid
%% desc: React Query 도입 전후 상태 관리 구조 변화
flowchart TD
  subgraph BEFORE["React Query 도입 전"]
    R1["Redux Store\n서버 데이터 + 클라이언트 상태\n전부 섞임"]
  end

  subgraph AFTER["React Query 도입 후"]
    RQ["TanStack Query\nAPI 데이터·캐시·동기화"]
    ZU["Zustand / useState\n모달·다크모드·폼 상태"]
  end
```

서버 상태 → React Query
진짜 클라이언트 상태 (UI 토글, 모달, 폼) → Zustand 또는 `useState`

---

## 포스트 구성

| 포스트 | 내용 |
|---|---|
| [QueryClient · Query Keys · useQuery 심층](/post/react-query-queries) | QueryClient 설정, 쿼리 키 팩토리, useQuery 전체 옵션, status vs fetchStatus |
| [useMutation · Optimistic Updates](/post/react-query-mutations) | mutation 라이프사이클, 두 레벨 콜백, 낙관적 업데이트 |
| [캐시 · 무효화 · Prefetch](/post/react-query-cache) | staleTime vs gcTime, invalidateQueries, setQueryData, 백그라운드 트리거 |
| [고급 패턴 · v5 마이그레이션](/post/react-query-advanced) | Infinite Query, 병렬 쿼리, Suspense, Custom Hooks, v4→v5 변경점 |

---

## 참고

<a href="https://tanstack.com/query/latest/docs/framework/react/overview" target="_blank">[1] TanStack Query v5 Overview — 공식 문서</a>

<a href="https://tkdodo.eu/blog/react-query-as-a-state-manager" target="_blank">[2] React Query as a State Manager — TkDodo</a>

<a href="https://tkdodo.eu/blog/practical-react-query" target="_blank">[3] Practical React Query — TkDodo</a>

---

## 관련 글

- [QueryClient · Query Keys · useQuery 심층 →](/post/react-query-queries)
- [useMutation · Optimistic Updates →](/post/react-query-mutations)
- [캐시 · 무효화 · Prefetch →](/post/react-query-cache)
- [고급 패턴 · v5 마이그레이션 →](/post/react-query-advanced)
