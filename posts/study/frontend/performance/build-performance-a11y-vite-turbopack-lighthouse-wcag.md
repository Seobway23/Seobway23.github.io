---
title: "빌드 · 성능 · a11y — Vite, Turbopack, 렌더링 전략, Lighthouse, WCAG"
slug: build-performance-a11y-vite-turbopack-lighthouse-wcag
category: study/frontend/performance
tags: [vite, turbopack, ssr, csr, ssg, lighthouse, accessibility, wcag, aria]
author: Seobway
readTime: 13
featured: false
createdAt: 2026-04-16
excerpt: >
  Building 14 단계. 번들러, 렌더링 전략, 성능 측정, 접근성을 한 흐름으로 묶어
  프론트엔드 기능을 사용자에게 빠르고 접근 가능하게 전달하는 법을 정리한다.
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
