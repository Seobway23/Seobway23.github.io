---
title: "얕은 복사와 깊은 복사"
coverImage: /post-thumbnails/shallow-deep-copy.svg
slug: shallow-deep-copy
category: frontend/javascript
concept: shallow-deep-copy
tags: [javascript, 얕은 복사, 깊은 복사, structuredClone, 참조 타입]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-28
excerpt: >
  스프레드로 복사한 객체의 중첩 속성을 수정하면 원본도 바뀐다. 얕은 복사는 최상위 속성만 새 객체로 복사하고, 깊은 복사는 중첩 객체까지 재귀적으로 새로 만든다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/Shallow_copy
    title: "Shallow copy — MDN Web Docs 용어 사전"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Glossary/Deep_copy
    title: "Deep copy — MDN Web Docs 용어 사전"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Web/API/Window/structuredClone
    title: "structuredClone() — MDN Web Docs"
    checked: 2026-09-28
---

## 문제 상황

스프레드(`...`)로 복사한 객체를 수정했는데 원본의 일부가 함께 바뀐다.

```js
const user = { name: "민수", address: { city: "서울" } };
const copy = { ...user };

copy.name = "영희";           // 원본은 그대로
copy.address.city = "부산";   // 원본도 바뀐다

user.name;          // "민수"
user.address.city;  // "부산"
```

최상위 속성 `name` 은 독립적으로 바뀌지만 중첩 객체 `address` 는 원본과 공유된다.
이것이 **얕은 복사(shallow copy)** 의 동작이다.

---

## 동작 원리

[참조 타입](/post/reference-type)에서 다룬 것처럼 객체를 담은 변수와 속성에는 객체의 참조가 저장된다.
`user` 의 메모리 구조는 다음과 같다.

```text
user ──▶ 객체 A { name: "민수", address: ──▶ 객체 B { city: "서울" } }
```

`user` 는 객체 A 를 참조하고, 객체 A 의 `address` 속성은 객체 B 의 참조를 값으로 가진다.
힙에는 객체가 두 개 할당되어 있다.

::: important
**얕은 복사**는 새 객체 A' 를 만들고 A 의 속성 값을 그대로 복사한다. `name` 에는 원시 값
`"민수"` 가, `address` 에는 객체 B 의 참조가 복사된다. 따라서 A' 와 A 는 같은 B 를 참조한다.

**깊은 복사(deep copy)** 는 중첩 객체까지 재귀적으로 새로 만든다. 복사본은 원본과 참조를 공유하지 않는다.
:::

```seq
title: 얕은 복사와 깊은 복사의 참조 구조
speed: 1600
caption: 얕은 복사는 중첩 객체의 참조를 복사하고, 깊은 복사는 중첩 객체를 새로 만든다.

lane orig  원본 user (객체 A)
lane copy  복사본 copy (객체 A')
lane inner 중첩 객체 B
lane inner2 새 중첩 객체 B'
lane out   결과 #log

step 객체 A 는 name 의 원시 값과 객체 B 의 참조를 속성으로 가진다.
  push orig name: "민수"
  push orig address → B
  push inner city: "서울"
step { ...user } 는 새 객체 A' 를 만들고 A 의 속성을 복사한다. name 은 원시 값이 복사된다.
  push copy name: "민수"
step address 속성에는 B 의 참조가 복사된다. B 는 새로 할당되지 않는다.
  push copy address → B
  mark inner
step copy.address.city = "부산" 은 객체 B 를 수정한다. user.address 도 B 를 참조하므로 같은 값이 읽힌다.
  clear inner
  push inner city: "부산"
  log out user.address.city → "부산"
step structuredClone 으로 깊은 복사를 했다면 B 도 새로 할당되어 A' 는 B' 를 참조한다.
  clear copy
  push copy name: "민수"
  push copy address → B'
  push inner2 city: "서울"
  log out 깊은 복사: 복사본을 수정해도 원본은 유지
```

두 방식의 차이는 새로 할당하는 객체의 깊이다.

| | 새로 할당하는 범위 | 대표 방법 |
|---|---|---|
| 얕은 복사 | 최상위 객체 1단계 | `{ ...obj }`, `[...arr]`, `Object.assign`, `arr.slice()`, `Array.from` |
| 깊은 복사 | 모든 중첩 객체 | `structuredClone(obj)` |

원시 값은 대입 시 값 자체가 복사되므로 공유 문제가 없다. 공유는 속성 값이 객체일 때만 생긴다.
중첩 객체가 없는 구조라면 얕은 복사와 깊은 복사의 결과는 같다.

---

## 예제

`===` 는 두 피연산자가 같은 객체를 참조하는지 비교한다. 단계별로 비교하면 어느 깊이까지 새 객체가 만들어졌는지 확인할 수 있다.

```playground
#! js title=copy-depth.js height=300
const user = {
  name: "민수",
  address: { city: "서울" },
  tags: ["a", "b"],
};

const shallow = { ...user };
const deep = structuredClone(user);

console.log("최상위 객체가 같은가");
console.log("  shallow:", shallow === user);                 // false
console.log("  deep   :", deep === user);                    // false

console.log("중첩 객체 address 가 같은가");
console.log("  shallow:", shallow.address === user.address); // true (공유)
console.log("  deep   :", deep.address === user.address);    // false

shallow.address.city = "부산";
shallow.tags.push("c");
console.log("얕은 복사본 수정 후 원본:", user.address.city, user.tags);

deep.address.city = "대구";
console.log("깊은 복사본 수정 후 원본:", user.address.city);  // "대구" 가 아님
```

`shallow === user` 는 `false` 이고 `shallow.address === user.address` 는 `true` 다.
최상위 객체는 새로 할당되었고 중첩 객체는 원본과 같은 객체다.

---

## 자주 하는 실수

::: warning
**React 상태에서 중첩 객체를 1단계만 복사하는 것**

```js
// address.city 만 변경하려는 코드
const next = { ...state };
next.address.city = "부산";   // state.address 를 직접 수정
setState(next);
```

`next` 는 새 객체지만 `next.address` 는 `state.address` 와 같은 객체다.
이전 상태 객체가 함께 수정되므로 이전 값과 비교하는 로직이 올바르게 동작하지 않는다.
변경하는 속성까지의 경로에 있는 객체를 모두 새로 만든다.

```js
setState({ ...state, address: { ...state.address, city: "부산" } });
```

변경하지 않는 나머지 중첩 객체는 기존 참조를 그대로 공유해도 된다.
:::

::: caution
**`JSON.parse(JSON.stringify(obj))` 로 깊은 복사하는 것**

JSON 으로 직렬화할 수 없는 값은 누락되거나 다른 값으로 변환된다.

```js
const src = { when: new Date(), fn() {}, nothing: undefined, n: NaN };
JSON.parse(JSON.stringify(src));
// { when: "2026-09-28T...", n: null }
// Date 는 문자열로, fn·nothing 은 누락, NaN 은 null 로 변환
```

`Map`·`Set` 은 빈 객체가 되고, 순환 참조가 있으면 `TypeError` 가 발생한다.
`structuredClone` 은 `Date`·`Map`·`Set`·순환 참조를 올바르게 복사한다.
:::

::: notice
**`structuredClone` 이 복사하지 못하는 값**

- 함수가 포함되어 있으면 `DataCloneError` 가 발생한다.
- 클래스 인스턴스는 자체 속성만 복사되고 [프로토타입](/post/prototype) 연결은 유지되지 않는다.
  복사본은 일반 `Object` 가 되어 클래스 메서드를 호출할 수 없다.
- DOM 노드는 복사할 수 없다.

structured clone 알고리즘은 직렬화 가능한 데이터를 복사하는 용도다.
:::

---

## 정리

얕은 복사는 최상위 객체만 새로 할당하고 중첩 객체는 참조를 복사해 원본과 공유한다.
깊은 복사는 중첩 객체까지 모두 새로 할당한다. 중첩 객체가 없으면 두 결과는 같다.

- [ ] `{ ...obj }` 로 복사한 뒤 중첩된 값을 고치면 왜 원본이 바뀌는지 설명할 수 있다
- [ ] `shallow.address === user.address` 가 `true` 인 이유를 안다
- [ ] 중첩 상태를 바꿀 때 어느 단계의 객체를 새로 만들어야 하는지 안다
- [ ] `JSON` 복사 대신 `structuredClone` 을 쓰는 이유와 그 한계를 말할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Shallow_copy" target="_blank">[1] Shallow copy — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Deep_copy" target="_blank">[2] Deep copy — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/API/Window/structuredClone" target="_blank">[3] structuredClone() — MDN Web Docs</a></li>
</ol>

---

## 관련 글

- [참조 타입과 참조 복사 →](/post/reference-type) (선행 개념)
- [원시 타입과 값 복사 →](/post/primitive-type)
- [프로토타입과 프로토타입 체인 →](/post/prototype) (`structuredClone` 이 유지하지 않는 연결)
