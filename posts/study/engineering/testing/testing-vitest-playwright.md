---
title: "테스트 기초 — 테스트 사고법, Vitest, Playwright"
slug: testing-vitest-playwright
category: study/engineering/testing
tags: [testing, vitest, playwright, unit-test, e2e]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Building 12 단계. 테스트를 작성하는 사고법, 단위 테스트와 E2E 테스트의 차이,
  Vitest와 Playwright를 어떤 역할로 쓰면 좋은지 정리한다.
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
