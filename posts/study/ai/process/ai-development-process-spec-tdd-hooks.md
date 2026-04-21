---
title: "AI 개발 프로세스 — 작업 분할, Spec, TDD Workflow, Hook 설계"
slug: ai-development-process-spec-tdd-hooks
category: study/ai/process
tags: [ai-workflow, spec, tdd, hooks, development-process]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-18-ai-process.svg
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 18 단계. AI와 함께 개발할 때 작업을 어떻게 쪼개고,
  Spec과 테스트, Hook으로 검증 루프를 만드는지 정리한다.
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

## 조금 더 깊게 보기

### AI에게 일을 맡기는 방식도 설계해야 한다

AI는 큰 요구사항을 한 번에 던지면 그럴듯한 결과를 만들 수 있다. 하지만 복잡한 제품에서는 그럴듯함보다 검증 가능성이 중요하다. 작업을 잘게 쪼개고, 각 단계마다 입력과 출력, 검증 기준을 정해야 한다.

### Spec이 AI 작업 품질을 결정한다

Spec이 모호하면 AI는 빈칸을 추측으로 채운다. 때로는 이 추측이 맞지만, 때로는 제품 방향과 다르게 간다. 문제, 목표, 비목표, 제약, 완료 조건을 적어주면 AI는 훨씬 안정적으로 움직인다.

### TDD와 AI의 궁합

테스트가 먼저 있으면 AI에게 "이 테스트를 통과하게 구현하라"고 맡길 수 있다. 그러면 결과 검증이 감상이 아니라 실행 가능한 기준이 된다. AI가 만든 코드가 마음에 드는지보다, 요구한 동작을 만족하는지가 먼저다.

### Hook은 신뢰를 자동화한다

AI에게 더 많은 일을 맡길수록 자동 검증이 중요해진다. pre-commit, pre-push, CI, 브라우저 QA, 보안 스캔 같은 hook은 AI 결과를 반복적으로 확인하는 안전장치다.

---

## 실전 적용 시나리오

AI에게 "회원가입 만들어줘"라고 시키면 결과가 흔들릴 수 있다. 대신 작업을 이렇게 나눈다. 첫째, 요구사항 Spec을 작성한다. 둘째, validation과 API 계약을 정의한다. 셋째, 실패하는 테스트를 만든다. 넷째, AI에게 테스트를 통과하는 최소 구현을 맡긴다. 다섯째, 사람이 diff를 검토한다.

이 흐름의 장점은 AI가 추측할 여지를 줄인다는 점이다. AI는 구현 속도가 빠르지만, 제품 의도와 운영 제약을 자동으로 알지는 못한다. Spec과 테스트는 그 의도를 실행 가능한 형태로 고정한다.

### Hook 설계 예시

pre-commit에서는 format과 빠른 lint를 돌린다. pre-push에서는 unit test를 돌린다. CI에서는 build, e2e, audit를 돌린다. AI agent 작업 후에는 "테스트 실행 여부, 변경 파일 목록, 남은 리스크"를 요약하게 한다. 이렇게 하면 AI 작업도 팀의 품질 루프 안으로 들어온다.

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
