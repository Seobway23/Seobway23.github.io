---
title: "아키텍처 패턴 — 레이어, 컴포넌트 기반 설계, 클린 아키텍처"
slug: architecture-patterns-layered-component-clean
category: study/architecture/patterns
tags: [architecture, layered-architecture, component-design, clean-architecture]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 16 단계. 레이어 아키텍처, 컴포넌트 기반 설계,
  클린 아키텍처 원칙을 작은 웹 프로젝트 관점에서 정리한다.
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
