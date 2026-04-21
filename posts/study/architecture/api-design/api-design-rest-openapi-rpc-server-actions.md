---
title: "API 설계 — REST 원칙, OpenAPI, Server Actions, RPC"
slug: api-design-rest-openapi-rpc-server-actions
category: study/architecture/api-design
tags: [api-design, rest, openapi, rpc, server-actions]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-09-api-design.svg
createdAt: 2026-04-16
excerpt: >
  Building 09 단계. REST 리소스 설계, OpenAPI 명세, Server Actions와 RPC의 차이를
  비교하며 API를 설계하는 기본 기준을 정리한다.
---

## 이 시리즈 구성

| 단계 | 포스트 | 내용 |
|---|---|---|
| 08 | [상태 & 데이터 페칭 →](/post/state-data-fetching-tanstack-zustand-server-actions) | TanStack Query, Zustand, Server Actions |
| 09 | [API 설계 →](/post/api-design-rest-openapi-rpc-server-actions) | REST 원칙, OpenAPI, RPC |
| 10 | [인증 & 보안 →](/post/auth-security-authjs-owasp-passkeys) | Auth.js, OWASP, 패스키 |
| 11 | [요구사항 분석 →](/post/requirements-spec-user-story-tradeoff) | Spec, 유저 스토리, 기술 선택 |
| 12 | [테스트 →](/post/testing-vitest-playwright) | 테스트 사고법, Vitest, Playwright |
| 13 | [Context Engineering →](/post/context-engineering-prompts-rules-memory-skills) | 프롬프트, Rules, 메모리, Skill |
| 14 | [빌드 · 성능 · a11y →](/post/build-performance-a11y-vite-turbopack-lighthouse-wcag) | Vite, Turbopack, Lighthouse, WCAG |

---

## API 설계는 URL 짓기가 아니다

API 설계는 클라이언트와 서버가 어떤 계약으로 대화할지 정하는 일이다.

좋은 API는 다음 질문에 답한다.

- 어떤 리소스를 다루는가
- 어떤 메서드로 어떤 의도를 표현하는가
- 요청/응답 스키마는 무엇인가
- 에러는 어떤 형식으로 내려오는가

---

## REST 설계 원칙

REST는 리소스를 중심으로 HTTP 메서드를 사용해 상태를 주고받는 스타일이다. Fielding의 논문에서 REST 아키텍처 스타일이 정리됐다.<a href="https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm" target="_blank"><sup>[1]</sup></a>

```http
GET /posts
POST /posts
GET /posts/123
PATCH /posts/123
DELETE /posts/123
```

REST에서 중요한 것은 URL에 동사를 넣기보다, 리소스와 메서드 조합으로 의도를 표현하는 것이다.

---

## OpenAPI — API 계약을 문서로 고정한다

OpenAPI는 HTTP API를 기계가 읽을 수 있는 형태로 설명하는 명세다.<a href="https://spec.openapis.org/oas/latest.html" target="_blank"><sup>[2]</sup></a>

OpenAPI가 있으면 다음이 가능해진다.

- API 문서 자동 생성
- 클라이언트 타입 생성
- mock server
- 요청/응답 검증

::: tip
API 명세는 "문서화"를 넘어 프론트와 백엔드 사이의 **계약 파일**로 보는 편이 좋다.
:::

---

## Server Actions와 RPC

Server Actions/Functions는 UI에서 서버 함수를 직접 호출하는 경험을 제공한다.<a href="https://react.dev/reference/rsc/server-functions" target="_blank"><sup>[3]</sup></a>

RPC는 원격 함수를 로컬 함수처럼 호출하는 방식이다. tRPC는 TypeScript 기반 end-to-end type safety를 강조하는 대표 사례다.<a href="https://trpc.io/docs" target="_blank"><sup>[4]</sup></a>

REST는 공개 API와 리소스 모델에 강하고, RPC/Server Actions는 앱 내부 mutation 흐름에 편할 수 있다.

---

## 조금 더 깊게 보기

### API는 제품의 계약이다

API는 백엔드 내부 함수가 아니다. 프론트엔드, 모바일, 외부 파트너, 문서, 테스트가 함께 의존하는 계약이다. 한 번 배포된 API는 사용자가 생기면 마음대로 바꾸기 어렵다. 그래서 API 설계는 구현보다 먼저 생각해야 한다.

### REST와 RPC를 나누는 기준

REST는 리소스 중심이다. 게시글, 사용자, 주문 같은 명사를 HTTP 메서드와 조합한다. RPC는 행위 중심이다. `createPost`, `sendInvite`, `checkout`처럼 함수를 호출하는 느낌에 가깝다. 공개 API와 장기 유지보수에는 REST가 강하고, 앱 내부 타입 안전한 호출에는 RPC가 편할 수 있다.

### OpenAPI의 실무 가치

OpenAPI는 문서 도구가 아니라 계약 파일이다. 프론트엔드는 타입과 클라이언트를 생성할 수 있고, 백엔드는 요청/응답이 명세와 맞는지 검증할 수 있다. QA는 명세를 보고 테스트 케이스를 만들 수 있다.

### 설계 질문

새 API를 만들 때는 URL보다 먼저 질문한다. 이 API의 리소스는 무엇인가? 성공 상태 코드는 무엇인가? 실패 응답 형식은 통일되어 있는가? 페이지네이션과 정렬은 어떻게 표현하는가? 이 질문에 답하면 API가 훨씬 안정된다.

---

## 실전 적용 시나리오

게시글 API를 설계한다고 가정하자. 먼저 리소스를 `posts`로 정한다. 목록은 `GET /posts`, 단건은 `GET /posts/{id}`, 생성은 `POST /posts`, 수정은 `PATCH /posts/{id}`, 삭제는 `DELETE /posts/{id}`로 둔다. 그다음 요청과 응답 스키마를 OpenAPI로 정의한다.

여기서 중요한 것은 성공 케이스만 문서화하지 않는 것이다. 없는 게시글은 `404`, 권한 없는 수정은 `403`, validation 실패는 `400` 또는 `422`처럼 팀 기준을 정한다. 에러 응답 형식도 `{ code, message, details }`처럼 통일하면 프론트엔드 처리가 쉬워진다.

### 설계가 좋아지는 순간

좋은 API 설계는 클라이언트 코드를 단순하게 만든다. 페이지네이션, 정렬, 필터, 에러 형식이 일관되면 프론트엔드는 매 화면마다 예외 처리를 새로 만들지 않아도 된다. API 설계의 품질은 백엔드 내부보다 클라이언트 사용성에서 더 잘 드러난다.

## 참고

<ol>
<li><a href="https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm" target="_blank">[1] Roy Fielding — REST Architectural Style</a></li>
<li><a href="https://spec.openapis.org/oas/latest.html" target="_blank">[2] OpenAPI Specification</a></li>
<li><a href="https://react.dev/reference/rsc/server-functions" target="_blank">[3] React Docs — Server Functions</a></li>
<li><a href="https://trpc.io/docs" target="_blank">[4] tRPC Docs</a></li>
</ol>

---

## 관련 글

- [HTTP 메서드와 상태 코드 기초 →](/post/http-methods-and-status-codes)
- [Hono로 REST API 시작하기 →](/post/hono-rest-api-overview)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
