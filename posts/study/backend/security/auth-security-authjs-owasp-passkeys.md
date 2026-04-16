---
title: "인증 & 보안 — Auth.js, OWASP, 패스키 기초"
slug: auth-security-authjs-owasp-passkeys
category: study/backend/security
tags: [auth, security, authjs, owasp, passkeys, webauthn]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Building 10 단계. 인증과 인가의 차이, Auth.js의 역할, OWASP Top 10,
  패스키/WebAuthn의 기본 방향을 정리한다.
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
