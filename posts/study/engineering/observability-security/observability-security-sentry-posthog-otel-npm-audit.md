---
title: "관측 & 보안 — Sentry, PostHog, OpenTelemetry, npm audit"
slug: observability-security-sentry-posthog-otel-npm-audit
category: study/engineering/observability-security
tags: [observability, sentry, posthog, opentelemetry, npm-audit, security]
author: Seobway
readTime: 13
featured: false
coverImage: /roadmap-thumbnails/step-17-observability.svg
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 17 단계. 에러 추적, 사용자 분석, 로그/메트릭/트레이스,
  공급망 보안을 운영 관점에서 정리한다.
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

## 운영은 문제가 난 뒤 시작하면 늦다

배포 후에는 사용자가 실제로 무엇을 겪는지 알아야 한다.

- 어디서 에러가 나는가
- 어떤 기능을 쓰는가
- 응답이 느린 구간은 어디인가
- 의존성에 보안 취약점은 없는가

---

## Sentry — 에러 추적

Sentry는 애플리케이션 에러와 성능 문제를 추적하는 도구다.<a href="https://docs.sentry.io/" target="_blank"><sup>[1]</sup></a>

프론트엔드에서는 stack trace, release, source map, user context가 중요하다.

---

## PostHog — 사용자 분석

PostHog는 제품 분석, 이벤트 추적, feature flag, session replay 등을 제공한다.<a href="https://posthog.com/docs" target="_blank"><sup>[2]</sup></a>

어떤 버튼이 눌렸는지보다 중요한 것은 "사용자가 목표 행동까지 도달했는가"다.

---

## 로그, 메트릭, 트레이스

OpenTelemetry는 관측 데이터를 수집하고 내보내기 위한 표준 프레임워크다.<a href="https://opentelemetry.io/docs/" target="_blank"><sup>[3]</sup></a>

- 로그: 무슨 일이 있었는가
- 메트릭: 수치가 어떻게 변하는가
- 트레이스: 요청이 어디를 지나갔는가

---

## npm audit과 공급망 보안

`npm audit`은 의존성 취약점을 검사한다.<a href="https://docs.npmjs.com/cli/v10/commands/npm-audit" target="_blank"><sup>[4]</sup></a>

::: warning
공급망 보안은 `npm audit fix`만 누르면 끝나는 문제가 아니다. lockfile, maintainer 신뢰도, postinstall script, CI secrets까지 함께 봐야 한다.
:::

---

## 조금 더 깊게 보기

### 관측성은 사용자의 현실을 보는 창이다

개발자는 로컬과 테스트 환경에서 제품을 본다. 사용자는 느린 네트워크, 오래된 브라우저, 예측 못 한 입력, 실제 결제와 권한 상태에서 제품을 쓴다. 관측성은 이 현실을 확인하는 장치다.

### Sentry와 PostHog의 역할 차이

Sentry는 "무엇이 깨졌는가"에 강하다. 에러, stack trace, release, 사용자 영향 범위를 본다. PostHog는 "사용자가 어떻게 행동하는가"에 강하다. 이벤트, funnel, retention, feature flag를 본다. 둘은 경쟁이 아니라 다른 질문에 답한다.

### 로그·메트릭·트레이스의 차이

로그는 사건의 기록이다. 메트릭은 시스템의 숫자 변화다. 트레이스는 하나의 요청이 여러 서비스를 지나가는 경로다. 작은 앱에서는 로그만으로도 충분할 수 있지만, 시스템이 커질수록 세 가지를 구분해야 원인을 빨리 찾는다.

### 공급망 보안의 현실

npm 패키지는 빠른 개발을 가능하게 하지만, 동시에 외부 코드를 내 제품에 들여오는 일이다. `npm audit`은 시작점일 뿐이다. lockfile 관리, 의존성 업데이트 정책, maintainer 신뢰도, postinstall script, CI secret 노출까지 같이 봐야 한다.

---

## 실전 적용 시나리오

작은 서비스라도 최소 관측 루프는 만들 수 있다. 프론트엔드에는 Sentry를 붙여 release와 sourcemap을 연결한다. 중요한 버튼 클릭과 가입/결제/글 작성 같은 전환 이벤트는 PostHog로 남긴다. API 서버가 있다면 요청 ID를 로그에 남기고, 에러 응답에도 같은 ID를 포함한다. 이렇게 하면 사용자가 "안 돼요"라고 말했을 때, 어느 release에서 어떤 화면과 API가 실패했는지 따라갈 수 있다.

보안 쪽에서는 매주 의존성 업데이트 시간을 따로 잡는 것이 좋다. 취약점이 떴을 때 즉시 `audit fix --force`를 누르면 major version 변경으로 더 큰 문제가 생길 수 있다. 먼저 취약점의 영향 범위, 실제 사용 여부, 패치 버전, breaking change를 확인한다. 운영에서 중요한 것은 빠른 반응과 안전한 변경 사이의 균형이다.

## 참고

<ol>
<li><a href="https://docs.sentry.io/" target="_blank">[1] Sentry Docs</a></li>
<li><a href="https://posthog.com/docs" target="_blank">[2] PostHog Docs</a></li>
<li><a href="https://opentelemetry.io/docs/" target="_blank">[3] OpenTelemetry Docs</a></li>
<li><a href="https://docs.npmjs.com/cli/v10/commands/npm-audit" target="_blank">[4] npm Docs — npm audit</a></li>
<li><a href="https://owasp.org/www-project-software-component-verification-standard/" target="_blank">[5] OWASP — Software Component Verification Standard</a></li>
</ol>

---

## 관련 글

- [배포 & 운영 기초 →](/post/deployment-vercel-railway-github-actions)
- [인증 & 보안 →](/post/auth-security-authjs-owasp-passkeys)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
