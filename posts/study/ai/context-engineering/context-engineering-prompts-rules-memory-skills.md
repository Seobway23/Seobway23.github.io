---
title: "Context Engineering — 프롬프트, Rules, 메모리, Skill 시스템"
slug: context-engineering-prompts-rules-memory-skills
category: study/ai/context-engineering
tags: [context-engineering, prompt, rules, memory, skills, ai-workflow]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-16
excerpt: >
  Building 13 단계. AI에게 무엇을 만들지뿐 아니라 어떤 맥락, 규칙, 기억, 작업 절차를
  제공해야 하는지 Context Engineering 관점으로 정리한다.
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
