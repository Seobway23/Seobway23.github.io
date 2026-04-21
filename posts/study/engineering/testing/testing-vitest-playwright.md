---
title: "테스트 기초 — 테스트 사고법, Vitest, Playwright"
slug: testing-vitest-playwright
category: study/engineering/testing
tags: [testing, vitest, playwright, unit-test, e2e]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-12-testing.svg
createdAt: 2026-04-16
excerpt: >
  Building 12 단계. 테스트를 작성하는 사고법, 단위 테스트와 E2E 테스트의 차이,
  Vitest와 Playwright를 어떤 역할로 쓰면 좋은지 정리한다.
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

## 테스트는 "버그가 없다는 증명"이 아니다

테스트는 변경해도 핵심 동작이 유지되는지 확인하는 안전망이다.

기초 단계에서는 다음을 구분하면 충분하다.

- 단위 테스트: 작은 함수나 컴포넌트 동작 검증
- 통합 테스트: 여러 모듈의 연결 검증
- E2E 테스트: 실제 사용자 흐름 검증

---

## Vitest — 단위 테스트

Vitest는 Vite 생태계와 잘 맞는 빠른 테스트 프레임워크다.<a href="https://vitest.dev/guide/" target="_blank"><sup>[1]</sup></a>

```ts
import { expect, test } from 'vitest'

test('adds numbers', () => {
  expect(1 + 2).toBe(3)
})
```

함수, 훅, 유틸 로직처럼 빠르게 검증해야 하는 코드에 적합하다.

---

## Playwright — E2E 테스트

Playwright는 실제 브라우저를 띄워 사용자 흐름을 테스트하는 도구다.<a href="https://playwright.dev/docs/intro" target="_blank"><sup>[2]</sup></a>

```ts
test('login flow', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('user@example.com')
  await page.getByRole('button', { name: 'Login' }).click()
})
```

로그인, 결제, 게시글 작성처럼 비즈니스 흐름을 검증하기 좋다.

---

## 무엇을 먼저 테스트할까

처음부터 모든 것을 테스트하려고 하면 지친다.

우선순위는 다음이 좋다.

1. 돈, 권한, 데이터 삭제처럼 위험한 흐름
2. 자주 깨지는 핵심 로직
3. 복잡한 조건문
4. 사용자의 주요 happy path

::: tip
좋은 테스트는 구현 세부사항보다 **사용자에게 보장해야 할 동작**을 검증한다.
:::

---

## 조금 더 깊게 보기

### 테스트는 개발 속도를 늦추지 않는다

초반에는 테스트가 느리게 느껴진다. 하지만 프로젝트가 커질수록 테스트는 변경 속도를 지켜준다. 테스트가 없으면 작은 수정도 수동 확인에 의존하고, 결국 개발자는 코드를 고치는 일을 두려워하게 된다.

### 단위 테스트와 E2E의 균형

Vitest 같은 단위 테스트는 빠르고 정확하다. 함수, 유틸, 비즈니스 규칙을 검증하기 좋다. Playwright 같은 E2E 테스트는 느리지만 사용자 흐름을 실제 브라우저에서 확인한다. 모든 것을 E2E로 검증하면 느리고, 모든 것을 단위 테스트로만 검증하면 연결 문제가 빠진다.

### 무엇을 테스트하지 않을까

테스트는 모든 줄을 덮는 것이 목표가 아니다. 구현 세부사항, 단순 스타일, 라이브러리 자체 동작은 과하게 테스트하지 않는다. 대신 돈, 권한, 데이터 손실, 핵심 사용자 흐름처럼 깨지면 큰 문제가 되는 곳을 우선한다.

### 좋은 테스트 문장

좋은 테스트 이름은 요구사항처럼 읽힌다. `it('shows validation error when email is invalid')`처럼 조건과 기대 결과가 드러나야 한다. 테스트 코드는 두 번째 문서다. 나중에 온 개발자가 테스트만 읽어도 기능의 의도를 이해할 수 있어야 한다.

---

## 실전 적용 시나리오

게시글 작성 기능을 테스트한다고 하자. 제목 검증 함수는 Vitest로 단위 테스트한다. 작성 폼에서 빈 제목을 입력했을 때 에러가 보이는지는 컴포넌트 테스트로 본다. 실제 로그인 후 게시글을 작성하고 상세 페이지로 이동하는 흐름은 Playwright로 검증한다.

이렇게 층을 나누면 빠른 테스트와 느린 테스트의 균형이 맞는다. 모든 것을 E2E로 테스트하면 느리고 불안정하다. 모든 것을 단위 테스트로만 보면 실제 사용자 흐름이 깨져도 모를 수 있다.

### 좋은 테스트 데이터

테스트 데이터는 현실적인 edge case를 포함해야 한다. 빈 문자열, 너무 긴 제목, 권한 없는 사용자, 네트워크 실패, 중복 요청 같은 케이스가 중요하다. 테스트는 happy path만 확인하는 장식이 아니라 실패를 안전하게 다루는 연습이다.

## 참고

<ol>
<li><a href="https://vitest.dev/guide/" target="_blank">[1] Vitest Docs — Guide</a></li>
<li><a href="https://playwright.dev/docs/intro" target="_blank">[2] Playwright Docs — Getting started</a></li>
<li><a href="https://testing-library.com/docs/" target="_blank">[3] Testing Library Docs</a></li>
<li><a href="https://martinfowler.com/articles/practical-test-pyramid.html" target="_blank">[4] Martin Fowler — The Practical Test Pyramid</a></li>
</ol>

---

## 관련 글

- [코드 품질 기초 →](/post/code-quality-eslint-prettier-biome)
- [Git & 릴리즈 기초 →](/post/git-branching-conventional-commits-husky)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
