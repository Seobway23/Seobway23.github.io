---
title: "관측 & 보안 — Sentry, PostHog, OpenTelemetry, npm audit"
slug: observability-security-sentry-posthog-otel-npm-audit
category: study/engineering/observability-security
tags: [observability, sentry, posthog, opentelemetry, npm-audit, security]
author: Seobway
readTime: 13
featured: false
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 17 단계. 에러 추적, 사용자 분석, 로그/메트릭/트레이스,
  공급망 보안을 운영 관점에서 정리한다.
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
