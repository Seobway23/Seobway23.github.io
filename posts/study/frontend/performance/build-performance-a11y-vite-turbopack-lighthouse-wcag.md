---
title: "빌드 · 성능 · a11y — Vite, Turbopack, 렌더링 전략, Lighthouse, WCAG"
slug: build-performance-a11y-vite-turbopack-lighthouse-wcag
category: study/frontend/performance
tags: [vite, turbopack, ssr, csr, ssg, lighthouse, accessibility, wcag, aria]
author: Seobway
readTime: 13
featured: false
coverImage: /roadmap-thumbnails/step-14-build-performance.svg
createdAt: 2026-04-16
excerpt: >
  Building 14 단계. 번들러, 렌더링 전략, 성능 측정, 접근성을 한 흐름으로 묶어
  프론트엔드 기능을 사용자에게 빠르고 접근 가능하게 전달하는 법을 정리한다.
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

## 기능은 사용자에게 도착해야 완성이다

프론트엔드 기능은 코드가 작성됐다고 끝나지 않는다.

- 빌드되어야 하고
- 빠르게 로드되어야 하고
- 검색/공유/초기 렌더링 전략이 맞아야 하고
- 접근성이 있어야 한다

---

## Vite와 Turbopack

Vite는 개발 서버와 빌드 경험을 빠르게 만드는 프론트엔드 툴링이다.<a href="https://vite.dev/guide/" target="_blank"><sup>[1]</sup></a>

Turbopack은 Vercel이 만드는 Rust 기반 번들러로, Next.js와 함께 사용되는 흐름이 강하다.<a href="https://nextjs.org/docs/architecture/turbopack" target="_blank"><sup>[2]</sup></a>

초반에는 "무엇이 더 빠른가"보다 번들러가 다음을 담당한다는 점을 먼저 이해하면 된다.

- 모듈 그래프 분석
- 개발 서버
- 코드 변환
- 번들 생성

---

## CSR, SSR, SSG

렌더링 전략은 HTML을 언제 어디서 만들 것인가의 문제다.

- CSR: 브라우저에서 렌더링
- SSR: 요청 시 서버에서 렌더링
- SSG: 빌드 시 정적 HTML 생성

Next.js 문서는 렌더링과 데이터 페칭 전략을 프레임워크 차원에서 설명한다.<a href="https://nextjs.org/docs/app/building-your-application/rendering" target="_blank"><sup>[3]</sup></a>

---

## Lighthouse와 접근성

Lighthouse는 성능, 접근성, SEO, Best Practices를 측정하는 도구다.<a href="https://developer.chrome.com/docs/lighthouse/overview" target="_blank"><sup>[4]</sup></a>

접근성은 WCAG와 WAI-ARIA를 기준으로 학습하는 것이 좋다.<a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank"><sup>[5]</sup></a>

::: tip
성능과 접근성은 마지막에 "점수 맞추기"로 붙이는 작업이 아니다. 라우팅, 이미지, 폼, 버튼, 색 대비를 만들 때부터 같이 봐야 한다.
:::

---

## 조금 더 깊게 보기

### 성능은 사용자 경험이다

성능은 숫자 게임이 아니다. 사용자가 기다리는 시간, 버튼을 눌렀을 때 반응하는 느낌, 화면이 흔들리지 않는 안정감이 전부 성능이다. Lighthouse 점수는 출발점이지 최종 목표가 아니다.

### 빌드 도구를 이해해야 하는 이유

Vite나 Turbopack은 개발 경험을 빠르게 해준다. 하지만 번들러가 어떤 모듈을 묶고, 어떤 코드를 분리하고, 어떤 asset을 최적화하는지 모르면 성능 문제를 해결하기 어렵다. 번들 크기, code splitting, lazy loading은 기능이 커질수록 중요해진다.

### 렌더링 전략은 제품 요구사항과 연결된다

관리자 페이지는 CSR로도 충분할 수 있다. 마케팅 페이지는 SSG가 좋을 수 있다. 로그인 후 개인화된 대시보드는 SSR이나 client fetching을 섞어야 할 수 있다. 중요한 것은 기술 이름이 아니라 사용자에게 언제 어떤 HTML과 데이터를 보여줄지다.

### a11y를 나중에 붙이면 비싸다

접근성은 마지막에 aria 속성 몇 개 추가하는 작업이 아니다. 버튼을 button으로 만들고, label을 연결하고, 키보드 이동을 보장하고, 색 대비를 맞추는 기본 설계다. 초반부터 지키면 비용이 작고, 나중에 고치면 구조를 갈아엎게 된다.

---

## 실전 적용 시나리오

블로그 상세 페이지가 느리다고 가정하자. 먼저 Lighthouse로 LCP, CLS, INP를 확인한다. 이미지가 크면 적절한 크기와 lazy loading을 적용한다. 번들이 크면 route-level code splitting을 본다. 초기 HTML이 중요하면 SSR/SSG 전략을 검토한다.

접근성도 같은 흐름으로 본다. 제목 계층이 올바른지, 버튼이 키보드로 이동 가능한지, input에 label이 있는지, 색 대비가 충분한지 확인한다. 성능과 접근성은 별도 작업이 아니라 사용자 경험의 두 축이다.

### 개발자 체크리스트

새 페이지를 만들 때는 번들 크기, 이미지 크기, loading/error/empty 상태, 키보드 이동, aria가 필요한 컴포넌트를 함께 확인한다. 배포 직전에 점수만 맞추는 것보다 개발 중에 계속 작게 확인하는 편이 훨씬 싸다.

## 참고

<ol>
<li><a href="https://vite.dev/guide/" target="_blank">[1] Vite Docs — Getting Started</a></li>
<li><a href="https://nextjs.org/docs/architecture/turbopack" target="_blank">[2] Next.js Docs — Turbopack</a></li>
<li><a href="https://nextjs.org/docs/app/building-your-application/rendering" target="_blank">[3] Next.js Docs — Rendering</a></li>
<li><a href="https://developer.chrome.com/docs/lighthouse/overview" target="_blank">[4] Chrome for Developers — Lighthouse overview</a></li>
<li><a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank">[5] W3C WAI — WCAG</a></li>
<li><a href="https://www.w3.org/WAI/standards-guidelines/aria/" target="_blank">[6] W3C WAI — WAI-ARIA</a></li>
</ol>

---

## 관련 글

- [UI & 스타일링 기초 →](/post/modern-css-tailwind-shadcn)
- [React 단방향 데이터 흐름 →](/post/react-component-data-flow)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
