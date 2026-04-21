---
title: "TypeScript 타입 시스템 기초 — any를 줄이고 의도를 남기는 법"
slug: typescript-type-system-basics
category: study/frontend/typescript
tags: [typescript, type-system, any, unknown, union, narrowing]
author: Seobway
readTime: 10
featured: false
coverImage: /roadmap-thumbnails/step-01-browser-client.svg
createdAt: 2026-04-16
excerpt: >
  TypeScript를 문법 모음이 아니라 의도를 코드에 남기는 도구로 이해한다.
  기초 단계에서 가장 먼저 익혀야 할 타입, 유니온, 좁히기 개념을 정리한다.
---

## 이 시리즈 구성

| 포스트 | 내용 |
|---|---|
| [로드맵 인덱스 →](/post/ai-webdev-roadmap-foundation) | 01~19 전체 학습 경로 |
| [01-1. JS 이벤트 루프와 비동기 →](/post/js-event-loop-and-async) | 콜스택, 큐, 마이크로태스크 |
| [01-2. setTimeout vs Promise →](/post/settimeout-vs-promise) | 비동기 실행 순서 예측 |
| [01-3. React 단방향 데이터 흐름 →](/post/react-component-data-flow) | props/state, state 끌어올리기 |
| [01-4. controlled vs uncontrolled →](/post/react-controlled-vs-uncontrolled) | React 폼 설계 |
| [01-5. TypeScript 타입 시스템 기초 →](/post/typescript-type-system-basics) | any, unknown, union, narrowing |

---

## TypeScript를 왜 초반에 넣는가

TypeScript는 나중에 붙이는 장식이 아니다.

기초 단계에서 TypeScript를 같이 익히면, 값이 어떤 형태인지 머릿속으로만 기억하지 않고 코드에 남길 수 있다. 그 결과 컴포넌트 props, API 응답, 함수 인자에서 실수가 줄어든다.

---

## 타입은 값의 의도다

```ts
function formatPrice(price: number) {
  return `${price.toLocaleString()}원`
}
```

여기서 `price: number`는 단순 문법이 아니라 "이 함수는 숫자를 기대한다"는 의도다.

JavaScript에서는 문자열이 들어와도 런타임에야 알 수 있지만, TypeScript는 그 전에 알려 줄 수 있다.

---

## 기초 단계에서 먼저 익힐 4가지

### 1. 기본 타입

```ts
let title: string = 'Hello'
let count: number = 3
let isOpen: boolean = false
```

### 2. 객체 타입

```ts
const user: { id: number; name: string } = {
  id: 1,
  name: 'Seobway',
}
```

### 3. 유니온 타입

```ts
let status: 'idle' | 'loading' | 'success' | 'error' = 'idle'
```

가능한 값을 좁혀 두면 상태를 훨씬 안전하게 다룰 수 있다.

### 4. 좁히기(narrowing)

```ts
function printValue(value: string | number) {
  if (typeof value === 'string') {
    console.log(value.toUpperCase())
  } else {
    console.log(value.toFixed(2))
  }
}
```

유니온 타입을 썼다면, 실제 분기에서 타입을 좁혀 가며 사용해야 한다.

---

## any는 왜 조심해야 하는가

`any`를 쓰면 일단 편해 보인다.

```ts
function logValue(value: any) {
  console.log(value.trim())
}
```

하지만 `any`는 TypeScript의 도움을 사실상 포기하는 선택에 가깝다. 그래서 기초 단계에서는 `any` 대신 `unknown`을 먼저 떠올리는 습관이 좋다.

```ts
function logValue(value: unknown) {
  if (typeof value === 'string') {
    console.log(value.trim())
  }
}
```

`unknown`은 "아직 모른다"이고, `any`는 "검사를 포기한다"에 가깝다.

::: warning
입문 단계에서 `any`가 많아지면, 타입 시스템이 실제로 어떤 실수를 막아 주는지 체감하기가 어려워진다. 초반에는 조금 불편하더라도 타입을 좁히는 습관을 먼저 들이는 편이 좋다.
:::

---

## React에서 TypeScript가 특히 좋은 이유

React에서는 props 구조가 자주 바뀌고, 상태도 여러 형태를 가진다.

```tsx
type PostCardProps = {
  title: string
  readTime: number
  featured?: boolean
}

function PostCard({ title, readTime, featured = false }: PostCardProps) {
  return <div>{title} · {readTime}분 · {featured ? '추천' : '일반'}</div>
}
```

이렇게 적어 두면 컴포넌트 사용법 자체가 더 분명해진다.

---

## 기초 단계에서는 여기까지면 충분하다

처음부터 복잡한 제네릭, 조건부 타입, 고급 유틸리티 타입까지 들어갈 필요는 없다.

먼저 다음을 편하게 읽을 수 있으면 좋다.

- 함수 인자의 타입
- 객체와 배열 타입
- 유니온 타입
- `unknown`과 타입 좁히기
- React props 타입 선언

::: tip
TypeScript 초반 목표는 "어려운 문법 많이 알기"가 아니라 **자주 쓰는 데이터 모양을 안전하게 표현하기**다.
:::

---

## 마치며

TypeScript는 자바스크립트를 대체하는 언어가 아니라, 자바스크립트 코드에 **설명서와 가드레일**을 더해 주는 도구에 가깝다.

그래서 기초 단계에서는 복잡한 기술보다, `any`를 줄이고 의도를 드러내는 기본 타입 감각부터 먼저 익히는 것이 좋다.

## 조금 더 깊게 보기

### TypeScript는 개발자의 두 번째 기억이다

프로젝트가 작을 때는 데이터 모양을 머리로 기억할 수 있다. 하지만 API 응답이 늘고 props가 많아지면 기억은 금방 틀린다. TypeScript는 이 기억을 코드에 남기는 도구다.

### any가 위험한 진짜 이유

`any`는 에러를 없애는 것이 아니라 경고등을 떼어내는 것에 가깝다. 특히 API 응답을 `any`로 받으면 백엔드 변경이 프론트에서 조용히 터질 수 있다.

### unknown을 배우면 타입 감각이 좋아진다

`unknown`은 아직 모르는 값이니 확인한 뒤 쓰라고 요구한다. 이 과정에서 `typeof`, `Array.isArray`, discriminated union 같은 좁히기 패턴을 자연스럽게 배우게 된다.

---

## 참고

<ol>
<li><a href="https://www.typescriptlang.org/docs/handbook/2/everyday-types.html" target="_blank">[1] TypeScript Handbook — Everyday Types</a></li>
<li><a href="https://www.typescriptlang.org/docs/handbook/2/narrowing.html" target="_blank">[2] TypeScript Handbook — Narrowing</a></li>
</ol>

---

## 관련 글

- [React 단방향 데이터 흐름 →](/post/react-component-data-flow)
- [controlled vs uncontrolled 컴포넌트 →](/post/react-controlled-vs-uncontrolled)
- [Node.js · Bun · Deno 런타임 비교 →](/post/js-runtime-node-bun-deno)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
