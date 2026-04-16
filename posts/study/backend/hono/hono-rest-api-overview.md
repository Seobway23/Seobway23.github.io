---
title: "Hono로 REST API 시작하기 — 가벼운 서버 프레임워크가 주는 감각"
slug: hono-rest-api-overview
category: study/backend/hono
tags: [hono, rest-api, backend, nodejs, bun, deno, web-framework]
author: Seobway
readTime: 10
featured: false
createdAt: 2026-04-16
excerpt: >
  Hono를 왜 로드맵 초반에 배우면 좋은지 설명하고, 가벼운 라우팅과 JSON 응답 예제로
  REST API의 최소 골격을 익힌다.
---

## 왜 Hono를 초반 실습 프레임워크로 고르는가

서버를 처음 배울 때는 프레임워크가 너무 무거우면 핵심이 흐려진다.

지금 단계에서 중요한 것은:

- 요청을 받는다
- 라우트를 분기한다
- JSON을 응답한다
- 상태 코드를 돌려준다

Hono는 이 최소 골격을 보기 좋게 보여 준다.<a href="https://hono.dev/docs/getting-started/basic" target="_blank"><sup>[1]</sup></a>

---

## 가장 작은 예제

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/posts', (c) => {
  return c.json([
    { id: 1, title: '첫 글' },
    { id: 2, title: '둘째 글' },
  ])
})

app.get('/posts/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, title: '단건 조회 예제' })
})

app.post('/posts', async (c) => {
  const body = await c.req.json()
  return c.json({ message: '생성 완료', body }, 201)
})

export default app
```

여기서 바로 보이는 것이 서버의 기본 구조다.

- `app.get()` → 조회 라우트
- `app.post()` → 생성 라우트
- `c.req` → 요청 읽기
- `c.json()` → JSON 응답

---

## Hono가 좋은 이유

### 1. 라우팅이 눈에 잘 들어온다

```ts
app.get('/users', ...)
app.get('/users/:id', ...)
app.post('/users', ...)
app.patch('/users/:id', ...)
app.delete('/users/:id', ...)
```

REST 감각을 익히기에 좋다.

### 2. 여러 런타임과 잘 연결된다

Hono는 Node.js, Bun, Deno, Cloudflare Workers 같은 여러 환경에서 사용할 수 있다. 그래서 "런타임이 바뀌어도 서버의 핵심 구조는 비슷하다"는 점을 배우기 좋다.

### 3. 초반에 필요한 만큼만 보인다

무거운 설정 파일보다, 요청과 응답 자체에 집중하기 쉽다.

---

## HTTP 기초와 함께 봐야 한다

Hono를 먼저 외우기보다, [HTTP 메서드와 상태 코드 기초 →](/post/http-methods-and-status-codes)와 함께 보는 편이 좋다.

예를 들어:

- 조회는 `GET`
- 생성은 `POST`
- 수정은 `PATCH`
- 삭제는 `DELETE`

이 의미를 알고 Hono 라우트를 보면, 프레임워크 문법이 아니라 **HTTP 약속을 코드로 옮긴 것**처럼 읽힌다.

---

## 초반 실습 아이디어

처음에는 DB까지 붙이지 말고 메모리 배열로만 시작해도 충분하다.

```ts
const posts = [
  { id: 1, title: '첫 글' },
  { id: 2, title: '둘째 글' },
]
```

이 상태로 다음을 연습하면 된다.

- 목록 조회
- 단건 조회
- 생성
- 없는 ID 요청 시 `404`

::: tip
입문 단계에서는 "프레임워크를 얼마나 깊게 아느냐"보다 **HTTP 요청과 응답을 스스로 설계할 수 있느냐**가 더 중요하다. Hono는 그 연습에 잘 맞는다.
:::

---

## 마치며

Hono는 초반에 서버의 본질을 보기 좋게 해 주는 도구다.

요청, 라우트, 상태 코드, JSON 응답이라는 최소 단위를 선명하게 보여 주기 때문에, 백엔드 기초를 잡는 단계에서 좋은 연습장이 된다.

## 참고

<ol>
<li><a href="https://hono.dev/docs/getting-started/basic" target="_blank">[1] Hono Docs — Getting Started</a></li>
<li><a href="https://hono.dev/docs/api/routing" target="_blank">[2] Hono Docs — Routing</a></li>
</ol>

---

## 관련 글

- [HTTP 메서드와 상태 코드 기초 →](/post/http-methods-and-status-codes)
- [Node.js · Bun · Deno 런타임 비교 →](/post/js-runtime-node-bun-deno)
- [DRF 개요 — Serializer, ViewSet, Router 큰 그림 →](/post/drf-overview)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
