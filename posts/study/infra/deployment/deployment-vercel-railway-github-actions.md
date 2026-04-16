---
title: "배포 & 운영 기초 — Vercel, Railway, GitHub Actions"
slug: deployment-vercel-railway-github-actions
category: study/infra/deployment
tags: [deployment, vercel, railway, github-actions, ci-cd]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Operating & Growing 15 단계. 클라우드 배포와 CI/CD의 기본 흐름을
  Vercel, Railway, GitHub Actions 기준으로 정리한다.
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
