---
title: "요구사항 분석 — Spec, 유저 스토리, 기술 선택 트레이드오프"
slug: requirements-spec-user-story-tradeoff
category: study/architecture/requirements
tags: [requirements, spec, user-story, tradeoff, product]
author: Seobway
readTime: 11
featured: false
createdAt: 2026-04-16
excerpt: >
  Building 11 단계. 요구사항을 기능 목록으로만 보지 않고, Spec, 유저 스토리,
  이슈 설계, 기술 선택의 트레이드오프로 분해하는 법을 정리한다.
---

## 요구사항은 "만들 것 목록"이 아니다

좋은 요구사항은 무엇을 만들지뿐 아니라 왜 만들고, 어떤 제약 안에서 만들지까지 담는다.

최소한 다음이 보여야 한다.

- 사용자 문제
- 성공 기준
- 범위와 제외 범위
- 엣지 케이스
- 기술 선택 이유

---

## Spec은 합의 문서다

Spec은 구현 전에 팀이 같은 그림을 보게 하는 문서다.

```markdown
## 문제
사용자가 결제 실패 이유를 알 수 없다.

## 목표
실패 원인을 화면에 노출하고 재시도 경로를 제공한다.

## 비목표
결제 수단 추가 기능은 이번 범위에 포함하지 않는다.
```

Atlassian은 사용자 스토리를 "사용자 관점에서 표현한 작은 요구사항"으로 설명한다.<a href="https://www.atlassian.com/agile/project-management/user-stories" target="_blank"><sup>[1]</sup></a>

---

## 유저 스토리와 이슈 설계

유저 스토리는 보통 이렇게 쓴다.

```text
As a 사용자,
I want to 목표,
so that 이유.
```

이슈는 구현 가능한 단위로 더 쪼갠다.

- UI 변경
- API 변경
- DB 변경
- 테스트
- 문서

---

## 기술 선택은 트레이드오프다

기술 선택은 "최신이라서"가 아니라 비용과 이익의 균형이다. Thoughtworks Technology Radar처럼 기술을 평가하고 채택 단계를 나누는 방식도 참고할 수 있다.<a href="https://www.thoughtworks.com/radar" target="_blank"><sup>[2]</sup></a>

::: tip
좋은 Spec은 구현을 늦추는 문서가 아니라, **잘못 만드는 시간을 줄여 주는 문서**다.
:::

---

## 참고

<ol>
<li><a href="https://www.atlassian.com/agile/project-management/user-stories" target="_blank">[1] Atlassian Agile Coach — User Stories</a></li>
<li><a href="https://www.thoughtworks.com/radar" target="_blank">[2] Thoughtworks Technology Radar</a></li>
<li><a href="https://www.scrum.org/resources/blog/what-product-backlog-refinement" target="_blank">[3] Scrum.org — Product Backlog Refinement</a></li>
</ol>

---

## 관련 글

- [API 설계 →](/post/api-design-rest-openapi-rpc-server-actions)
- [AI 웹개발자 로드맵 — Foundation 01~19 →](/post/ai-webdev-roadmap-foundation)
