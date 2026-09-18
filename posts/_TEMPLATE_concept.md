---
title: "개념 이름 — 한 줄로 말하면 이것"
slug: concept-slug
category: frontend/javascript
concept: concept-id          # data/concepts.yml 의 id. 선행 관계는 거기서 관리한다
tags: [javascript]
author: Seobway
readTime: 6                  # 5~8분이 기준. 넘으면 개념을 더 쪼갠다
featured: false
createdAt: 2026-01-01
excerpt: >
  검색 결과에 그대로 나갈 한 문장. 개념을 아직 모르는 사람이 읽고 "아 그거" 하게.
sources:                     # 필수. 1차 공식 문서만. npm run verify:sources 가 검사한다
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/...
    title: "제목 — MDN Web Docs"
    checked: 2026-01-01
---

<!--
  글 한 개 = 개념 한 개 = 5~8분.
  아래 5단 흐름을 지킨다. 이 순서가 바텀업 학습의 뼈대다.
      왜 필요한가 → 어떻게 동작하는가 → 직접 확인 → 흔한 실수 → 한 줄 정리
  지우고 쓰기 시작해라.
-->

## 왜 이게 필요한가

개념 이름을 꺼내기 **전에** 문제부터 보여준다. 이 개념을 모르면 어떤 코드가
예상과 다르게 도는지 3~5줄로.

```js
// 예상과 다르게 도는 최소 코드
```

---

## 어떻게 동작하는가

정확한 정의 한 문장. 그 뒤에 비유가 아니라 **메커니즘**을 설명한다.

```seq
title: 무엇이 어디로 가는가
lane a  상자 A
lane b  상자 B

step 첫 장면 설명.
  push a 값
step 다음 장면 설명.
  move a b 값
```

---

## 직접 확인

읽는 사람이 예측하고 실행해서 맞는지 확인하게 한다.

```playground
#! js title=check.js height=180
console.log("여기를 고쳐 가며 돌려 봐라");
```

---

## 흔한 실수

::: warning
가장 자주 틀리는 것 하나. "이렇게 하면 안 된다"가 아니라 **왜 그렇게 되는지**.
:::

---

## 한 줄 정리

- [ ] 이 개념을 한 문장으로 설명할 수 있다
- [ ] 위 코드의 출력을 예측할 수 있다

## 참고

<!-- frontmatter sources 를 그대로 옮겨 적는다. (Phase 1 에서 자동 생성으로 바뀐다) -->

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/..." target="_blank">[1] 제목 — MDN Web Docs</a></li>
</ol>

---

## 관련 글

<!-- 선행/후행은 concepts.yml 에서 자동으로 붙는다(Phase 1).
     그 외에 손으로 잇고 싶은 글만 여기에 적는다. -->

- [선행 글 제목 →](/post/prev-slug)
