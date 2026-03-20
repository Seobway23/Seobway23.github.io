---
title: React 18의 새로운 Concurrent Features 완벽 정리
slug: react-18-concurrent-features
category: react
tags: [React, JavaScript, Performance, Frontend]
author: seobway
readTime: 8
featured: true
createdAt: 2024-01-15
excerpt: React 18에서 도입된 Concurrent Features와 Suspense, useTransition 등의 새로운 기능들을 실제 예제와 함께 자세히 알아보겠습니다.
---

# React 18의 주요 변화점

React 18은 React의 새로운 **메이저 버전**으로, **Concurrent Features**를 중심으로 많은 변화를 가져왔습니다. 이번 글에서는 React 18의 주요 기능들을 실제 코드 예제와 함께 살펴보겠습니다.

## 1. Automatic Batching

React 18에서는 모든 업데이트가 **자동으로 배치**됩니다. 이는 성능 향상에 크게 기여합니다.

```javascript
// React 17에서는 배치되지 않았던 경우
setTimeout(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // React 18에서는 이제 배치됩니다!
}, 1000);

// Promise, setTimeout, 네이티브 이벤트 핸들러에서도 배치됩니다
fetch("/someapi").then(() => {
  setLoading(false);
  setError(null);
  // 배치됨!
});
```

## 2. useTransition과 startTransition

사용자 입력과 같은 **긴급한 업데이트**와 결과 렌더링과 같은 **비긴급 업데이트**를 구분할 수 있습니다.

```javascript
import { useTransition, useState } from "react";

function SearchBox() {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (term) => {
    // 긴급 업데이트
    setSearchTerm(term);

    // 비긴급 업데이트
    startTransition(() => {
      setResults(expensiveSearch(term));
    });
  };

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="검색어를 입력하세요"
      />
      {isPending && <div>검색 중...</div>}
      <SearchResults results={results} />
    </div>
  );
}
```

## 3. Suspense 개선

React 18에서는 **Suspense**가 더 많은 경우에 사용할 수 있게 되었습니다.

```javascript
import { Suspense } from "react";

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage />
    </Suspense>
  );
}
```

## 마무리

React 18의 **Concurrent Features**는 사용자 경험을 크게 개선시킵니다. 특히 **큰 애플리케이션**에서 성능 향상을 체감할 수 있을 것입니다.
