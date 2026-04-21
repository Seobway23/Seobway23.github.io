---
title: "아키텍처 패턴 — 레이어, 컴포넌트 기반 설계, 클린 아키텍처"
slug: architecture-patterns-layered-component-clean
category: study/architecture/patterns
tags: [architecture, layered-architecture, component-design, clean-architecture]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-16-architecture.svg
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 16 단계. 레이어 아키텍처, 컴포넌트 기반 설계,
  클린 아키텍처 원칙을 작은 웹 프로젝트 관점에서 정리한다.
---

## 이 시리즈 구성

| 단계 | 포스트 | 내용 |
|---|---|---|
| 15 | [배포 & 운영 →](/post/deployment-vercel-railway-github-actions) | Vercel, Railway, GitHub Actions |
| 16 | [아키텍처 패턴 →](/post/architecture-patterns-layered-component-clean) | 레이어, 컴포넌트 기반 설계, 클린 아키텍처 |
| 17 | [관측 & 보안 →](/post/observability-security-sentry-posthog-otel-npm-audit) | Sentry, PostHog, OpenTelemetry, npm audit |
| 18 | [AI 개발 프로세스 →](/post/ai-development-process-spec-tdd-hooks) | 작업 분할, Spec, TDD Workflow, Hook 설계 |
| 19 | [AI 코드 검증 →](/post/ai-code-verification-review-quality-security-performance-ux) | 품질, 보안, 성능, UX 검증 |

---

## 아키텍처는 폴더 이름이 아니다

아키텍처는 코드가 어떤 방향으로 의존하고, 어떤 변경을 어디에 가두는지 정하는 일이다.

좋은 아키텍처는 변경 비용을 낮춘다.

---

## 레이어 아키텍처

레이어 아키텍처는 관심사를 층으로 나누는 방식이다. Microsoft의 아키텍처 가이드도 계층화된 앱에서 presentation, business, data access 같은 분리를 설명한다.<a href="https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier" target="_blank"><sup>[1]</sup></a>

예:

- UI layer
- application/service layer
- domain layer
- infrastructure/data layer

---

## 컴포넌트 기반 설계

프론트엔드에서는 UI를 작은 컴포넌트로 나누고 조합한다. React 문서도 UI를 컴포넌트 트리로 나누어 사고하는 방식을 강조한다.<a href="https://react.dev/learn/thinking-in-react" target="_blank"><sup>[2]</sup></a>

컴포넌트 설계의 핵심:

- 단일 책임
- 명확한 props
- 내부 상태 최소화
- 재사용보다 먼저 이해 가능성

---

## 클린 아키텍처 원칙

클린 아키텍처의 핵심은 의존성 방향이다. 바깥쪽 구현 세부사항이 안쪽 정책을 침범하지 않게 한다.<a href="https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html" target="_blank"><sup>[3]</sup></a>

::: notice
작은 프로젝트에서 클린 아키텍처를 과하게 적용할 필요는 없다. 하지만 **비즈니스 규칙이 프레임워크와 DB에 끌려다니지 않게 한다**는 방향은 중요하다.
:::

---

## 조금 더 깊게 보기

### 아키텍처는 변경의 방향을 정한다

아키텍처가 필요한 이유는 멋진 폴더 구조를 만들기 위해서가 아니다. 요구사항이 바뀔 때 어떤 코드가 영향을 받고, 어떤 코드는 그대로 남을지 결정하기 위해서다. 좋은 아키텍처는 변경의 파장을 작게 만든다.

### 레이어를 나누는 이유

UI, application, domain, infrastructure를 나누는 이유는 각 층의 관심사가 다르기 때문이다. UI는 보여주고, application은 유스케이스를 조율하고, domain은 핵심 규칙을 담고, infrastructure는 DB나 외부 API를 다룬다. 이 구분이 없으면 DB 변경이 UI까지 번지고, 화면 요구사항이 비즈니스 규칙을 흔든다.

### 컴포넌트 기반 설계와 클린 아키텍처의 연결

프론트엔드 컴포넌트도 아키텍처의 일부다. 버튼 하나는 단순 UI지만, 페이지 컴포넌트는 데이터 페칭, 상태, 권한, 라우팅이 섞이기 쉽다. 클린 아키텍처 관점은 이런 혼합을 줄이고, UI와 비즈니스 규칙을 분리하게 도와준다.

### 과설계를 피하는 법

작은 프로젝트에 레이어를 과하게 나누면 오히려 이해가 어려워진다. 처음에는 feature 단위로 묶고, 반복되는 규칙이 보일 때 분리한다. 아키텍처는 예측이 아니라 관찰을 바탕으로 진화해야 한다.

---

## 실전 적용 시나리오

예를 들어 게시글 작성 기능을 만든다고 하자. UI 컴포넌트는 제목과 본문을 입력받고, application layer는 "게시글 작성" 유스케이스를 실행한다. domain 규칙은 제목이 비어 있으면 안 되고, 작성자는 존재해야 한다는 정책을 담는다. infrastructure layer는 실제 DB insert를 담당한다.

이렇게 나누면 UI가 바뀌어도 게시글 작성 규칙은 유지된다. DB가 Drizzle에서 Prisma로 바뀌어도 domain 규칙은 그대로 남는다. 이것이 아키텍처의 가치다. 반대로 페이지 컴포넌트 하나에 폼 검증, 권한 검사, DB 호출, 토스트까지 모두 넣으면 처음에는 빠르지만 다음 변경부터 비용이 커진다.

### 판단 기준

분리할지 말지 고민될 때는 변경 이유가 다른지 본다. 화면 때문에 바뀌는 코드와 비즈니스 규칙 때문에 바뀌는 코드는 떨어뜨리는 편이 좋다. 같은 이유로 바뀌는 코드는 너무 일찍 나누지 않아도 된다.

## 참고

<ol>
<li><a href="https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier" target="_blank">[1] Microsoft Learn — N-tier architecture style</a></li>
<li><a href="https://react.dev/learn/thinking-in-react" target="_blank">[2] React Docs — Thinking in React</a></li>
<li><a href="https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html" target="_blank">[3] The Clean Code Blog — The Clean Architecture</a></li>
<li><a href="https://martinfowler.com/eaaCatalog/" target="_blank">[4] Martin Fowler — Patterns of Enterprise Application Architecture Catalog</a></li>
</ol>

---

## 관련 글

- [React 단방향 데이터 흐름 →](/post/react-component-data-flow)
- [API 설계 →](/post/api-design-rest-openapi-rpc-server-actions)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
