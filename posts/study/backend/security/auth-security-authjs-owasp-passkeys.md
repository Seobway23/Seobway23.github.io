---
title: "인증 & 보안 — Auth.js, OWASP, 패스키 기초"
slug: auth-security-authjs-owasp-passkeys
category: study/backend/security
tags: [auth, security, authjs, owasp, passkeys, webauthn]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-10-auth-security.svg
createdAt: 2026-04-16
excerpt: >
  Building 10 단계. 인증과 인가의 차이, Auth.js의 역할, OWASP Top 10,
  패스키/WebAuthn의 기본 방향을 정리한다.
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

## 인증과 인가는 다르다

인증(Authentication)은 "누구인가"를 확인하는 일이고, 인가(Authorization)는 "무엇을 할 수 있는가"를 판단하는 일이다.

로그인은 인증이고, 관리자 페이지 접근 권한 확인은 인가다.

::: warning
로그인만 구현했다고 보안이 끝나는 것이 아니다. 인증 이후에는 세션, 권한, CSRF, XSS, 토큰 보관, 비밀번호 정책까지 함께 봐야 한다.
:::

---

## Auth.js

Auth.js는 JavaScript/TypeScript 앱에서 인증을 구현하기 위한 오픈소스 인증 라이브러리다.<a href="https://authjs.dev/getting-started" target="_blank"><sup>[1]</sup></a>

주요 관심사:

- OAuth provider 로그인
- 세션 관리
- adapter를 통한 DB 연동
- framework별 통합

Auth.js를 쓸 때도 "라이브러리가 알아서 다 해준다"가 아니라, 세션 전략과 provider 설정을 이해해야 한다.

---

## OWASP Top 10

OWASP Top 10은 웹 애플리케이션에서 자주 발생하는 주요 보안 위험을 정리한 표준 참고 자료다.<a href="https://owasp.org/www-project-top-ten/" target="_blank"><sup>[2]</sup></a>

입문 단계에서는 최소한 다음 키워드를 익힌다.

- Broken Access Control
- Cryptographic Failures
- Injection
- Security Misconfiguration
- Identification and Authentication Failures

---

## 패스키와 WebAuthn

패스키는 비밀번호 없는 로그인 경험을 만들기 위한 방향이다. WebAuthn은 공개키 기반 인증을 웹에서 가능하게 하는 표준이다.<a href="https://www.w3.org/TR/webauthn-3/" target="_blank"><sup>[3]</sup></a>

사용자는 생체 인증이나 기기 PIN으로 로그인하지만, 서버에는 비밀번호가 아니라 공개키 기반 검증 흐름이 남는다.

---

## 조금 더 깊게 보기

### 인증은 로그인 화면보다 넓다

인증을 로그인 폼 구현으로만 보면 위험하다. 실제 인증은 사용자가 누구인지 확인하고, 세션을 유지하고, 토큰을 안전하게 다루고, 로그아웃과 만료를 처리하는 전체 흐름이다. 여기에 인가가 붙으면 "누가 무엇을 할 수 있는가"까지 봐야 한다.

### 보안은 기능이 아니라 기본 조건이다

OWASP Top 10은 보안 체크리스트의 출발점이다. 특히 Broken Access Control은 실무에서 자주 터진다. UI에서 버튼을 숨겼다고 권한 검사가 끝나는 것이 아니다. 서버 API에서도 반드시 권한을 확인해야 한다.

### 패스키가 의미하는 변화

패스키는 비밀번호를 더 복잡하게 만드는 방향이 아니라, 비밀번호 자체를 줄이는 방향이다. 사용자는 생체 인증이나 기기 잠금으로 인증하고, 서버는 공개키 기반 검증을 한다. 피싱과 재사용 비밀번호 문제를 줄일 수 있다는 점에서 중요하다.

### 실무 체크포인트

로그인 성공보다 실패 케이스를 더 꼼꼼히 본다. 잘못된 비밀번호, 만료된 세션, 권한 없는 접근, 탈퇴한 사용자, provider 연결 실패, CSRF와 redirect URL 검증을 확인한다. 인증은 happy path보다 edge case가 훨씬 중요하다.

---

## 실전 적용 시나리오

관리자 페이지를 만든다고 생각해보자. 로그인 여부만 확인하면 부족하다. 사용자가 관리자 권한을 갖고 있는지 서버에서 확인해야 하고, API마다 권한 검사가 있어야 한다. 프론트에서 메뉴를 숨기는 것은 UX일 뿐 보안 경계가 아니다.

Auth.js를 쓰면 provider 로그인과 세션 처리는 편해진다. 하지만 callback에서 어떤 정보를 세션에 넣을지, DB adapter를 어떻게 쓸지, role을 어디서 검증할지 결정해야 한다. 보안 라이브러리는 기반을 제공하지만 정책은 제품이 정해야 한다.

### 보안 체크리스트

로그인 실패 메시지는 과도한 정보를 주지 않는다. redirect URL은 검증한다. 세션 만료를 처리한다. 권한 없는 요청은 `403`으로 막는다. 민감 API는 서버에서 다시 권한을 확인한다. 패스키를 도입할 때는 복구 흐름과 기기 분실 시나리오도 같이 설계한다.

## 참고

<ol>
<li><a href="https://authjs.dev/getting-started" target="_blank">[1] Auth.js Docs — Getting Started</a></li>
<li><a href="https://owasp.org/www-project-top-ten/" target="_blank">[2] OWASP Top 10</a></li>
<li><a href="https://www.w3.org/TR/webauthn-3/" target="_blank">[3] W3C — Web Authentication: An API for accessing Public Key Credentials</a></li>
<li><a href="https://passkeys.dev/docs/" target="_blank">[4] passkeys.dev — Passkeys Developer Docs</a></li>
</ol>

---

## 관련 글

- [DRF 인증 →](/post/drf-authentication)
- [HTTP 메서드와 상태 코드 기초 →](/post/http-methods-and-status-codes)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
