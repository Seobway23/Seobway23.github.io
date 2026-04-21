---
title: "Context Engineering — 프롬프트, Rules, 메모리, Skill 시스템"
slug: context-engineering-prompts-rules-memory-skills
category: study/ai/context-engineering
tags: [context-engineering, prompt, rules, memory, skills, ai-workflow]
author: Seobway
readTime: 12
featured: false
coverImage: /roadmap-thumbnails/step-13-context.svg
createdAt: 2026-04-16
excerpt: >
  Building 13 단계. AI에게 무엇을 만들지뿐 아니라 어떤 맥락, 규칙, 기억, 작업 절차를
  제공해야 하는지 Context Engineering 관점으로 정리한다.
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

## 프롬프트보다 맥락이 중요하다

AI 개발에서 좋은 결과는 한 줄 명령보다 **좋은 작업 환경**에서 나온다.

Context Engineering은 모델에게 필요한 정보를 적절한 형태로 제공하는 일이다.

- 목표
- 코드베이스 구조
- 규칙 파일
- 예시
- 금지사항
- 검증 방법
- 장기 기억

---

## 프롬프트 디자인

OpenAI의 프롬프트 엔지니어링 가이드는 명확한 지시, 참고 텍스트 제공, 복잡한 일을 나누기 같은 원칙을 강조한다.<a href="https://platform.openai.com/docs/guides/prompt-engineering" target="_blank"><sup>[1]</sup></a>

좋은 프롬프트는 다음을 포함한다.

- 역할
- 목표
- 입력 자료
- 출력 형식
- 제약조건
- 검증 기준

---

## Rules 파일

Rules 파일은 프로젝트의 반복 규칙을 AI가 계속 참고하게 하는 장치다.

예를 들어 이 블로그는 `CLAUDE.md`, `AGENTS.md`, `.cursor/skills/blog-post-writing/SKILL.md` 같은 문서가 포스트 작성 규칙 역할을 한다.

::: notice
AI에게 매번 길게 설명하는 규칙은 파일로 빼는 편이 좋다. 그래야 작업마다 같은 기준을 반복 적용할 수 있다.
:::

---

## 메모리와 Skill

메모리는 장기적으로 유지할 사실이고, Skill은 특정 작업을 잘 수행하기 위한 절차다.

Claude Code 문서도 프로젝트 메모리와 설정, slash command 등 반복 작업을 구조화하는 기능을 다룬다.<a href="https://docs.anthropic.com/en/docs/claude-code/memory" target="_blank"><sup>[2]</sup></a>

---

## 조금 더 깊게 보기

### Context Engineering은 AI 시대의 설계 역량이다

프롬프트 한 줄을 잘 쓰는 것보다 중요한 것은 AI가 일할 수 있는 환경을 설계하는 것이다. 어떤 파일을 읽어야 하는지, 어떤 규칙을 따라야 하는지, 어떤 결과물을 내야 하는지, 무엇을 검증해야 하는지를 구조화해야 한다.

### Rules 파일의 가치

매번 반복해서 말하는 규칙은 프롬프트에 쓰지 말고 Rules 파일에 둔다. 포맷, 금지 패턴, 테스트 명령, 배포 규칙, 글쓰기 규칙처럼 반복되는 지식은 프로젝트 문서로 고정해야 한다. 그러면 AI는 매 작업에서 같은 기준을 적용할 수 있다.

### 메모리와 Skill의 차이

메모리는 오래 유지해야 하는 사실이다. Skill은 특정 작업을 수행하는 절차다. 예를 들어 "이 프로젝트는 posts 수정 후 generate:posts를 실행한다"는 메모리에 가깝고, "블로그 글을 작성할 때 frontmatter, 참고, 관련 글을 점검한다"는 Skill에 가깝다.

### 실무 인사이트

AI 결과가 흔들리는 이유는 모델이 나빠서만이 아니다. 컨텍스트가 부족하거나, 지시가 모호하거나, 검증 기준이 없어서 흔들리는 경우가 많다. 좋은 Context Engineering은 AI를 더 똑똑하게 만드는 것이 아니라, 실수할 여지를 줄이는 일이다.

---

## 실전 적용 시나리오

블로그 포스트를 AI에게 맡긴다고 하자. 단순히 "React 글 써줘"라고 하면 톤, 참고 형식, frontmatter, 관련 글 링크가 흔들린다. 대신 Rules 파일에 포스트 규칙을 두고, Skill에는 작성 절차를 둔다. AI는 먼저 기존 글을 읽고, 그 다음 초안을 쓰고, 마지막에 `npm run generate:posts`를 실행한다.

이것이 Context Engineering이다. AI에게 더 많은 말을 하는 것이 아니라, 필요한 맥락을 적절한 위치에 배치하는 것이다.

### 컨텍스트 품질 체크

좋은 컨텍스트는 최신이고, 구체적이고, 검증 가능하다. 오래된 규칙, 서로 충돌하는 문서, 너무 긴 배경 설명은 오히려 성능을 떨어뜨린다. AI에게 주는 문서도 코드처럼 리팩토링이 필요하다.

## 참고

<ol>
<li><a href="https://platform.openai.com/docs/guides/prompt-engineering" target="_blank">[1] OpenAI Docs — Prompt engineering</a></li>
<li><a href="https://docs.anthropic.com/en/docs/claude-code/memory" target="_blank">[2] Anthropic Docs — Claude Code memory</a></li>
<li><a href="https://docs.cursor.com/context/rules" target="_blank">[3] Cursor Docs — Rules</a></li>
<li><a href="https://modelcontextprotocol.io/introduction" target="_blank">[4] Model Context Protocol — Introduction</a></li>
</ol>

---

## 관련 글

- [AI 코딩 도구 기초 →](/post/ai-coding-tools-cursor-copilot-claude-code-mcp)
- [Claude Code 하네스 유출이 말해 주는 것 →](/post/claude-code-harness-leak-architecture)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
