---
title: "개념 이름을 명사형으로"
slug: concept-slug
category: frontend/javascript
concept: concept-id          # data/concepts.yml 의 id. 선행 관계는 거기서 관리한다
tags: [javascript]
author: Seobway
readTime: 6                  # 5~8분이 기준. 넘으면 개념을 더 쪼갠다
featured: false
createdAt: 2026-01-01
coverImage: /post-thumbnails/concept-slug.svg   # scripts/generate-thumbnail.mjs --write-frontmatter
excerpt: >
  검색 결과에 그대로 나갈 한두 문장. 정의와 그 결과로 생기는 동작.
glossary:                    # 선행 지식이 없는 독자가 모를 용어. 본문 첫 등장에 [[id|표시어]]
  termId: "정의 한두 문장."
sources:                     # 필수. 1차 공식 문서(ECMAScript 사양, MDN, HTML 표준)만
  - url: https://tc39.es/ecma262/#sec-...
    title: "절 이름 — ECMAScript 사양"
    checked: 2026-01-01
---

<!--
  단일 개념 글 = 교과서 한 절.
    요약 → 1. 문제 상황 → 2. 정의 → 3. 동작 원리 → 4. 예제 → 5. 자주 하는 실수 → 6. 정리
  H2 는 번호 붙은 장, H3 는 절(2.1). `---` 는 H2 사이에만.
  정의는 사양(ECMAScript 절 이름과 링크)에 근거한다. 비유 대신 사양 용어를 쓴다.
  지우고 쓰기 시작한다.
-->

::: abstract
정의 한 문장. 그 정의 때문에 생기는 동작 한 문장.
:::

## 1. 문제 상황

개념 이름을 꺼내기 전에, 이 개념을 모르면 예상과 다르게 동작하는 최소 코드.

```js
// 예상과 다르게 동작하는 최소 코드
```

---

## 2. 정의

### 2.1 정의

한 문장 정의. 굵게는 정의되는 용어에만.

### 2.2 사양에서의 위치

ECMAScript 사양의 어느 절, 어떤 내부 슬롯·추상 연산이 이 동작을 정하는지.

---

## 3. 동작 원리

### 3.1 첫 단계

```seq
title: 무엇이 어디로 가는가
lane a  콜 스택
lane b  환경 레코드

step 첫 장면 설명.
  push a 값
```

### 3.2 다음 단계

---

## 4. 예제

### 4.1 기본

```playground
#! js title=check.js height=180
console.log("출력을 예측한 뒤 실행한다");
```

### 4.2 실무 패턴

라이브러리·프레임워크에서 이 개념이 쓰이는 곳.

---

## 5. 자주 하는 실수

::: warning
틀리는 코드와, 사양 기준으로 왜 그렇게 동작하는지.
:::

---

## 6. 정리

- [ ] 개념을 한 문장으로 설명할 수 있다
- [ ] 1장 코드의 출력을 예측할 수 있다

## 참고

<ol>
<li><a href="https://tc39.es/ecma262/#sec-..." target="_blank">[1] 절 이름 — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [선행 개념 →](/post/prev-slug)
- [다음 개념 →](/post/next-slug)
