---
title: "AI 개발 프로세스 — 작업 분할, Spec, TDD Workflow, Hook 설계"
slug: ai-development-process-spec-tdd-hooks
category: study/ai/process
tags: [ai-workflow, spec, tdd, hooks, development-process]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 18 단계. AI와 함께 개발할 때 작업을 어떻게 쪼개고,
  Spec과 테스트, Hook으로 검증 루프를 만드는지 정리한다.
---

## AI에게 큰 덩어리를 던지면 품질이 흔들린다

AI 개발 프로세스의 핵심은 "한 번에 다 시키기"가 아니다.

작업을 작게 쪼개고, 기대 결과를 명확히 하고, 테스트와 훅으로 검증하는 루프를 만드는 것이다.

---

## 작업 분할과 Spec

큰 작업은 다음처럼 나눈다.

- 사용자 흐름
- API 변경
- DB 변경
- UI 변경
- 테스트
- 문서

Spec은 AI에게 줄 작업 계약서다. GitHub Issues나 Jira 이슈처럼 추적 가능한 단위로 만드는 것이 좋다.

---

## TDD Workflow

TDD는 실패하는 테스트를 먼저 쓰고, 통과하는 최소 구현을 만든 뒤, 리팩토링하는 흐름이다. Kent Beck의 TDD 원칙은 여전히 테스트 주도 개발의 기준점으로 많이 인용된다.<a href="https://martinfowler.com/bliki/TestDrivenDevelopment.html" target="_blank"><sup>[1]</sup></a>

AI와 함께할 때는 다음 흐름이 좋다.

1. 기대 동작을 테스트로 쓴다
2. AI에게 테스트를 통과하게 한다
3. 구현을 리뷰한다
4. 리팩토링한다

---

## Hook 설계

Hook은 특정 시점에 검증이나 자동화를 실행하는 장치다.

- pre-commit: lint, format
- pre-push: test
- CI: build, test, audit
- agent hook: 작업 전후 체크리스트

::: tip
AI 개발 프로세스에서 Hook은 "AI를 믿지 못해서"가 아니라, **반복 검증을 자동화해서 더 빠르게 맡기기 위한 장치**다.
:::

---

## 참고

<ol>
<li><a href="https://martinfowler.com/bliki/TestDrivenDevelopment.html" target="_blank">[1] Martin Fowler — TestDrivenDevelopment</a></li>
<li><a href="https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues" target="_blank">[2] GitHub Docs — About issues</a></li>
<li><a href="https://typicode.github.io/husky/" target="_blank">[3] Husky Docs</a></li>
<li><a href="https://docs.github.com/en/actions" target="_blank">[4] GitHub Docs — GitHub Actions</a></li>
</ol>

---

## 관련 글

- [Context Engineering →](/post/context-engineering-prompts-rules-memory-skills)
- [테스트 기초 →](/post/testing-vitest-playwright)
- [AI 코드 검증 →](/post/ai-code-verification-review-quality-security-performance-ux)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
