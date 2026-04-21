---
title: "요구사항 분석 — Spec, 유저 스토리, 기술 선택 트레이드오프"
slug: requirements-spec-user-story-tradeoff
category: study/architecture/requirements
tags: [requirements, spec, user-story, tradeoff, product]
author: Seobway
readTime: 11
featured: false
coverImage: /roadmap-thumbnails/step-11-requirements.svg
createdAt: 2026-04-16
excerpt: >
  Building 11 단계. 요구사항을 기능 목록으로만 보지 않고, Spec, 유저 스토리,
  이슈 설계, 기술 선택의 트레이드오프로 분해하는 법을 정리한다.
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

## 요구사항은 "만들 것 목록"이 아니다

좋은 요구사항은 무엇을 만들지뿐 아니라 왜 만들고, 어떤 제약 안에서 만들지까지 담는다.

최소한 다음이 보여야 한다.

- 사용자 문제
- 성공 기준
- 범위와 제외 범위
- 엣지 케이스
- 기술 선택 이유

---

## Spec은 합의 문서다

Spec은 구현 전에 팀이 같은 그림을 보게 하는 문서다.

```markdown
## 문제
사용자가 결제 실패 이유를 알 수 없다.

## 목표
실패 원인을 화면에 노출하고 재시도 경로를 제공한다.

## 비목표
결제 수단 추가 기능은 이번 범위에 포함하지 않는다.
```

Atlassian은 사용자 스토리를 "사용자 관점에서 표현한 작은 요구사항"으로 설명한다.<a href="https://www.atlassian.com/agile/project-management/user-stories" target="_blank"><sup>[1]</sup></a>

---

## 유저 스토리와 이슈 설계

유저 스토리는 보통 이렇게 쓴다.

```text
As a 사용자,
I want to 목표,
so that 이유.
```

이슈는 구현 가능한 단위로 더 쪼갠다.

- UI 변경
- API 변경
- DB 변경
- 테스트
- 문서

---

## 기술 선택은 트레이드오프다

기술 선택은 "최신이라서"가 아니라 비용과 이익의 균형이다. Thoughtworks Technology Radar처럼 기술을 평가하고 채택 단계를 나누는 방식도 참고할 수 있다.<a href="https://www.thoughtworks.com/radar" target="_blank"><sup>[2]</sup></a>

::: tip
좋은 Spec은 구현을 늦추는 문서가 아니라, **잘못 만드는 시간을 줄여 주는 문서**다.
:::

---

## 조금 더 깊게 보기

### 요구사항은 코딩 전에 버그를 잡는 도구다

요구사항 분석을 대충 하면 구현은 빨라 보이지만, 나중에 "이게 의도한 게 아닌데"라는 말이 나온다. 좋은 Spec은 구현 전에 오해를 줄이고, 작업 범위를 명확히 하며, 테스트 기준을 제공한다.

### 비개발자와 개발자를 연결하는 언어

유저 스토리는 비개발자가 이해하기 쉬운 문제 언어이고, Spec은 개발자가 구현 가능한 구조로 바꾼 문서다. 둘 사이를 잘 연결해야 한다. "사용자가 결제 실패 이유를 알고 싶다"는 스토리가 "에러 코드별 메시지, 재시도 버튼, 로그 수집"으로 쪼개지는 식이다.

### 기술 선택은 취향이 아니라 비용 계산이다

새 기술을 고를 때는 생산성만 보지 않는다. 팀의 숙련도, 운영 난이도, 문서 품질, 생태계, 롤백 가능성, 장기 유지보수 비용을 함께 본다. 트레이드오프를 문서로 남기면 나중에 선택의 이유를 추적할 수 있다.

### 좋은 이슈의 조건

좋은 이슈는 작고 검증 가능하다. 완료 조건이 있어야 하고, 비목표가 있어야 하며, 필요한 디자인/API/DB 변경이 드러나야 한다. AI에게 맡길 작업도 이 정도로 쪼개야 결과 품질이 안정된다.

---

## 실전 적용 시나리오

"댓글 기능을 만든다"는 요구사항은 너무 크고 모호하다. 이것을 Spec으로 바꾸면 더 선명해진다. 사용자는 게시글 상세에서 댓글을 작성할 수 있다. 작성자는 자신의 댓글을 삭제할 수 있다. 비로그인 사용자는 작성 폼 대신 로그인 안내를 본다. 욕설 필터와 대댓글은 이번 범위에서 제외한다.

이렇게 쓰면 개발자는 API, UI, DB, 권한, 테스트를 나눌 수 있다. 디자이너는 빈 상태와 에러 상태를 볼 수 있고, PM은 이번 범위와 다음 범위를 구분할 수 있다.

### 기술 선택 기록

예를 들어 댓글 실시간 업데이트를 WebSocket으로 할지 polling으로 할지 고민한다면, 사용자 규모, 구현 비용, 서버 운영 난이도, UX 기대치를 적는다. 지금은 polling으로 시작하고, 동시성이 커지면 WebSocket으로 옮긴다는 식의 결정 기록이 있으면 나중에 팀이 같은 논의를 반복하지 않는다.

## 참고

<ol>
<li><a href="https://www.atlassian.com/agile/project-management/user-stories" target="_blank">[1] Atlassian Agile Coach — User Stories</a></li>
<li><a href="https://www.thoughtworks.com/radar" target="_blank">[2] Thoughtworks Technology Radar</a></li>
<li><a href="https://www.scrum.org/resources/blog/what-product-backlog-refinement" target="_blank">[3] Scrum.org — Product Backlog Refinement</a></li>
</ol>

---

## 관련 글

- [API 설계 →](/post/api-design-rest-openapi-rpc-server-actions)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
