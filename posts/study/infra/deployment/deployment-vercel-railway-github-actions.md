---
title: "배포 & 운영 기초 — Vercel, Railway, GitHub Actions"
slug: deployment-vercel-railway-github-actions
category: study/infra/deployment
tags: [deployment, vercel, railway, github-actions, ci-cd]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-15-deployment.svg
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 15 단계. 클라우드 배포와 CI/CD의 기본 흐름을
  Vercel, Railway, GitHub Actions 기준으로 정리한다.
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

## 배포는 업로드가 아니라 반복 가능한 절차다

배포는 "내 컴퓨터에서 되던 앱을 서버에 올리는 것"에서 끝나지 않는다.

운영 가능한 배포는 다음을 포함한다.

- 빌드
- 테스트
- 환경 변수
- 배포
- 롤백
- 로그 확인

---

## Vercel

Vercel은 프론트엔드와 Next.js 배포 경험이 강한 플랫폼이다.<a href="https://vercel.com/docs" target="_blank"><sup>[1]</sup></a>

GitHub 저장소와 연결하면 브랜치/PR 단위 preview deployment를 만들기 쉽다.

---

## Railway

Railway는 웹 서버, DB, 백그라운드 워커 같은 앱 구성 요소를 빠르게 배포하기 좋은 플랫폼이다.<a href="https://docs.railway.com/" target="_blank"><sup>[2]</sup></a>

작은 백엔드 API나 데이터베이스가 필요한 프로젝트에서 시작하기 좋다.

---

## GitHub Actions

GitHub Actions는 GitHub 이벤트에 따라 워크플로를 실행하는 CI/CD 도구다.<a href="https://docs.github.com/en/actions" target="_blank"><sup>[3]</sup></a>

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

::: warning
배포 자동화에서는 secrets 관리가 매우 중요하다. 토큰과 API 키는 코드에 커밋하지 않고 GitHub Secrets나 플랫폼 환경 변수로 관리해야 한다.
:::

---

## 조금 더 깊게 보기

### 배포는 개발의 끝이 아니라 운영의 시작이다

로컬에서 잘 돌아가는 앱은 아직 제품이 아니다. 사용자가 접근할 수 있는 주소에 올라가고, 환경 변수가 설정되고, 빌드가 재현 가능하고, 문제가 생겼을 때 로그를 볼 수 있어야 한다. 배포는 파일 업로드가 아니라 운영 가능한 상태를 만드는 절차다.

### Vercel과 Railway를 나누는 관점

Vercel은 프론트엔드와 Next.js 중심의 preview deployment 경험이 강하다. Railway는 서버, 워커, DB 같은 구성요소를 빠르게 묶어 올리기 좋다. 어느 플랫폼이 더 좋다기보다, 정적/프론트 중심인지, 백엔드 프로세스와 DB가 함께 필요한지에 따라 선택이 달라진다.

### CI/CD의 실제 가치

GitHub Actions는 단순 자동 배포 도구가 아니다. 사람이 매번 까먹을 수 있는 검증을 자동화한다. lint, test, build, audit를 PR마다 실행하면 merge 전에 기본 품질을 확인할 수 있다.

### 운영 체크리스트

배포 전에는 환경 변수, secret, build command, health check, rollback 방법을 확인한다. 배포 후에는 로그, 에러 추적, 주요 화면 접근, API 응답을 확인한다. 좋은 배포는 빠른 배포가 아니라 되돌릴 수 있는 배포다.

---

## 실전 적용 시나리오

프론트엔드 앱은 Vercel에 올리고, Hono API와 Postgres는 Railway 또는 별도 플랫폼에 올리는 구조를 생각해볼 수 있다. GitHub Actions는 PR마다 lint, test, build를 실행한다. main에 merge되면 배포가 일어나고, 배포 후에는 health check URL을 호출한다.

환경 변수는 로컬 `.env`, GitHub Secrets, Vercel/Railway 환경 변수로 나뉜다. 이 값들이 서로 어긋나면 "로컬에서는 되는데 배포에서는 안 됨" 문제가 생긴다. 그래서 배포 문서에는 필수 환경 변수 목록과 예시 값, 민감 정보 여부를 반드시 적어둔다.

### 운영자가 보는 체크리스트

배포 전에는 빌드 성공, migration 여부, secret 설정, rollback 방법을 확인한다. 배포 후에는 주요 페이지 접근, API 응답, Sentry 에러, 로그 급증 여부를 본다. 배포는 버튼 한 번이 아니라 이 체크리스트까지 포함한 절차다.

## 참고

<ol>
<li><a href="https://vercel.com/docs" target="_blank">[1] Vercel Docs</a></li>
<li><a href="https://docs.railway.com/" target="_blank">[2] Railway Docs</a></li>
<li><a href="https://docs.github.com/en/actions" target="_blank">[3] GitHub Docs — GitHub Actions</a></li>
<li><a href="https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions" target="_blank">[4] GitHub Docs — Using secrets in GitHub Actions</a></li>
</ol>

---

## 관련 글

- [Git & 릴리즈 기초 →](/post/git-branching-conventional-commits-husky)
- [빌드 · 성능 · a11y →](/post/build-performance-a11y-vite-turbopack-lighthouse-wcag)
- [GitLab CI/CD 가이드 →](/post/gitlab-cicd-guide)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
