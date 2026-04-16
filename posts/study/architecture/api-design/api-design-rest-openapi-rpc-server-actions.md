---
title: "API 설계 — REST 원칙, OpenAPI, Server Actions, RPC"
slug: api-design-rest-openapi-rpc-server-actions
category: study/architecture/api-design
tags: [api-design, rest, openapi, rpc, server-actions]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Building 09 단계. REST 리소스 설계, OpenAPI 명세, Server Actions와 RPC의 차이를
  비교하며 API를 설계하는 기본 기준을 정리한다.
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
