---
title: "불변성과 새 값으로 교체하기"
coverImage: /post-thumbnails/immutability.svg
slug: immutability
category: frontend/javascript
concept: immutability
tags: [javascript, immutability, Object.freeze, toSorted, react, 불변성]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-10-15
excerpt: >
  불변성은 만든 값을 고치지 않고, 바뀐 내용을 담은 새 값을 만들어 교체하는 원칙이다. 변경 여부를 참조 비교 한 번으로 알 수 있게 되고, 바뀌지 않은 부분은 이전 값과 공유한다.
glossary:
  reference-equality: "두 값이 같은 객체를 가리키는지 비교하는 것. 객체 내용은 보지 않으므로 비용이 일정하다. === 와 Object.is 가 객체에 대해 이렇게 비교한다."
  structural-sharing: "새 객체를 만들 때 바뀐 경로의 객체만 새로 만들고, 바뀌지 않은 하위 객체는 이전 객체의 참조를 그대로 쓰는 방식."
  data-property: "값을 직접 저장하는 프로퍼티. [[Value]], [[Writable]], [[Enumerable]], [[Configurable]] 속성을 가진다."
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
    title: "Object.freeze() — MDN Web Docs"
    checked: 2026-10-15
  - url: https://tc39.es/ecma262/#sec-setintegritylevel
    title: "SetIntegrityLevel — ECMAScript 사양"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
    title: "Array.prototype.toSorted() — MDN Web Docs"
    checked: 2026-10-15
  - url: https://react.dev/learn/updating-objects-in-state
    title: "Updating Objects in State — React"
    checked: 2026-10-15
---

::: abstract
**불변성**은 만든 값을 고치지 않고, 바뀐 내용을 담은 새 값을 만들어 교체하는 원칙이다. 이 원칙을 지키면 [[reference-equality|참조 비교]] 한 번으로 변경 여부를 알 수 있고, 바뀌지 않은 하위 객체는 이전 값과 공유한다.
:::

## 1. 문제 상황

할 일을 추가하는 버튼을 눌러도 화면이 바뀌지 않는다.

```jsx
const [todos, setTodos] = useState([]);

function add(text) {
  todos.push({ text });   // 기존 배열을 고친다
  setTodos(todos);        // 같은 배열을 다시 넘긴다
}
```

React 는 새 state 와 이전 state 를 `Object.is` 로 비교한다<a href="https://react.dev/learn/updating-objects-in-state" target="_blank"><sup>[4]</sup></a>. `push` 는 배열 내용을 바꾸지만 배열의 참조는 그대로이므로 `Object.is(todos, todos)` 는 `true` 다. React 는 바뀐 것이 없다고 판단하고 다시 렌더링하지 않는다.

```jsx
function add(text) {
  setTodos([...todos, { text }]);   // 새 배열을 만들어 교체한다
}
```

새 배열을 넘기면 참조가 달라져 렌더링이 일어난다.

---

## 2. 정의

### 2.1 정의

만든 뒤 내용이 바뀌지 않는 값을 불변 값이라 한다. 자바스크립트의 [원시 값](/post/primitive-type)은 언어 차원에서 불변이다. `str.toUpperCase()` 는 새 문자열을 반환하고 원래 문자열은 그대로다.

[참조 타입](/post/reference-type)인 객체와 배열은 가변이다. 그래서 객체에서 말하는 **불변성**은 언어가 보장하는 성질이 아니라 코드가 지키는 원칙이다. 객체를 고치는 대신 바뀐 내용을 담은 새 객체를 만들어 변수나 state 를 교체한다.

| 바꾸는 코드 (가변) | 새 값을 만드는 코드 (불변) |
| --- | --- |
| `arr.push(x)` | `[...arr, x]` |
| `arr.sort()`, `arr.reverse()` | `arr.toSorted()`, `arr.toReversed()` |
| `arr.splice(i, 1)` | `arr.toSpliced(i, 1)`, `arr.filter(…)` |
| `arr[i] = x` | `arr.with(i, x)` |
| `obj.name = x` | `{ ...obj, name: x }` |

`toSorted`, `toReversed`, `toSpliced`, `with` 는 ES2023 에 추가된 메서드다. 원본은 두고 새 배열을 반환한다<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted" target="_blank"><sup>[3]</sup></a>.

### 2.2 사양에서의 위치

객체를 실제로 바꿀 수 없게 만드는 기능은 `Object.freeze` 다. 사양에서 `Object.freeze(O)` 는 `SetIntegrityLevel(O, frozen)` 을 호출한다<a href="https://tc39.es/ecma262/#sec-setintegritylevel" target="_blank"><sup>[2]</sup></a>.

1. `O` 에 `[[PreventExtensions]]` 를 호출해 새 프로퍼티를 추가할 수 없게 한다.
2. `O` 의 **자기 프로퍼티** 각각의 `[[Configurable]]` 을 `false` 로 바꾸고, [[data-property|데이터 프로퍼티]]면 `[[Writable]]` 도 `false` 로 바꾼다.

대상이 자기 프로퍼티뿐이므로 프로퍼티 값이 객체이면 그 객체는 얼지 않는다. 쓰기 불가 프로퍼티에 대입하면 `[[Set]]` 이 `false` 를 반환하고, 엄격 모드에서는 `TypeError` 가 난다. 비엄격 모드에서는 대입이 조용히 무시된다.

`const` 는 다른 성질이다. `const` 는 변수에 다른 값을 다시 대입하는 것을 막을 뿐, 변수가 가리키는 객체의 내용은 바꿀 수 있다.

---

## 3. 동작 원리

### 3.1 참조 비교로 변경을 감지한다

모든 변경이 새 객체를 만든다면 「참조가 같다」는 「내용이 같다」와 같은 뜻이 된다. 객체 내용을 하나씩 비교하지 않고 `prev !== next` 한 번으로 변경 여부를 알 수 있다. React 의 state 비교, `React.memo`, `useMemo` 의 의존성 비교가 이 성질에 기대고 있다.

반대로 객체를 직접 고치면 내용이 바뀌어도 참조는 같다. 참조 비교는 「바뀌지 않았다」고 답하고, 그 결과는 틀린다.

### 3.2 바뀐 경로만 새로 만든다

새 객체를 만든다고 전체를 [깊은 복사](/post/shallow-deep-copy)하지 않는다. 바뀐 값까지 이어지는 경로의 객체만 새로 만들고, 나머지는 이전 객체를 그대로 참조한다. 이것을 [[structural-sharing|구조적 공유]]라 한다.

```js
const state = {
  user: { name: "a", address: { city: "서울" } },
  posts: [{ id: 1 }],
};

const next = { ...state, user: { ...state.user, name: "b" } };
```

![구조적 공유](/post-assets/frontend/javascript/structural-sharing.svg "user.name 을 바꾸면 state 와 user 두 객체만 새로 만든다. address 와 posts 는 이전 객체를 그대로 참조하므로 === 비교가 true 다.")

```seq
title: user.name 을 바꾼 새 state 만들기
speed: 1700
caption: 경로에 있는 객체(state, user)만 새로 만들고, 나머지는 참조를 복사한다.

lane prev 이전 state
lane next 새 state
lane cmp  비교 결과 #log

step 이전 state 는 user, user.address, posts 세 하위 객체를 참조한다.
  push prev state
  push prev user
  push prev address
  push prev posts
step { ...state } 로 새 최상위 객체를 만든다. posts 는 참조만 복사된다.
  push next state (새 객체)
  push next posts (같은 참조)
  log cmp next.posts === state.posts → true
step 바꿀 값이 있는 user 는 { ...state.user, name: "b" } 로 새로 만든다.
  push next user (새 객체, name = b)
  log cmp next.user === state.user → false
step user 안의 address 는 바뀌지 않았으므로 참조를 복사한다.
  push next address (같은 참조)
  log cmp next.user.address === state.user.address → true
```

---

## 4. 예제

### 4.1 기본

같은 변경을 두 방식으로 하고 참조 비교 결과를 본다. `Object.freeze` 가 얕게 적용되는 것과 `sort` 와 `toSorted` 의 차이도 확인한다.

```playground
#! js title=immutability.js height=320
"use strict";

// 1. 직접 고치기와 새 값 만들기
const prev = { count: 1 };
const mutated = prev;
mutated.count = 2;
console.log("직접 고침, prev !== mutated →", prev !== mutated, "(변경을 감지하지 못한다)");

const prev2 = { count: 1 };
const next2 = { ...prev2, count: 2 };
console.log("새 객체,   prev2 !== next2 →", prev2 !== next2, "/ prev2.count =", prev2.count);

// 2. Object.freeze 는 자기 프로퍼티에만 적용된다
const frozen = Object.freeze({ n: 1, inner: { m: 1 } });
try { frozen.n = 2; } catch (e) { console.log("frozen.n = 2   →", e.constructor.name); }
frozen.inner.m = 2;
console.log("frozen.inner.m →", frozen.inner.m, "/ isFrozen(inner) =", Object.isFrozen(frozen.inner));

// 3. 원본을 바꾸는 메서드와 바꾸지 않는 메서드
const scores = [3, 1, 2];
const copy = scores.toSorted();
console.log("toSorted       →", copy, "원본", scores);
const same = scores.sort();
console.log("sort           →", same, "원본", scores, "같은 배열?", same === scores);
```

`frozen.n = 2` 는 `TypeError` 가 나지만 `frozen.inner.m` 은 2 로 바뀐다. `sort` 는 원본을 정렬하고 같은 배열을 반환한다.

### 4.2 실무 패턴

React 에서 이전 state 를 바탕으로 새 state 를 만들 때는 업데이터 함수에서 새 객체를 반환한다.

```jsx
setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
```

`map` 은 항상 새 배열을 반환하고, 바뀐 항목만 새 객체로 만든다. 바뀌지 않은 항목은 이전 객체 그대로이므로, `React.memo` 로 감싼 항목 컴포넌트는 다른 props 도 같다면 다시 렌더링되지 않는다.

---

## 5. 자주 하는 실수

::: warning
**const 로 선언하면 바뀌지 않는다고 생각한다**

```js
const user = { name: "a" };
user.name = "b";   // 가능하다
user = {};         // TypeError: Assignment to constant variable.
```

`const` 가 막는 것은 변수의 재대입이다. 객체 내용은 그대로 바꿀 수 있다.
:::

::: caution
**스프레드 한 번으로 중첩 객체까지 새로 만들었다고 생각한다**

```js
const next = { ...state };
next.user.name = "b";   // state.user.name 도 "b" 가 된다
```

스프레드는 [얕은 복사](/post/shallow-deep-copy)다. `next.user` 와 `state.user` 는 같은 객체다. 바꿀 값까지의 경로에 있는 객체를 모두 스프레드로 새로 만든다(3.2절).
:::

::: caution
**인자로 받은 배열을 sort 한다**

```js
function Ranking({ scores }) {
  const sorted = scores.sort((a, b) => b - a);   // props 원본이 정렬된다
}
```

`sort`, `reverse`, `splice` 는 원본을 바꾼다. 부모가 가진 배열이 바뀌므로 다른 곳의 표시 순서까지 달라진다. `toSorted` 나 `[...scores].sort()` 를 쓴다.
:::

---

## 6. 정리

불변성은 값을 고치지 않고 새 값을 만들어 교체하는 원칙이다. 원시 값은 언어가 불변을 보장하고, 객체는 코드가 이 원칙을 지킨다. 바뀐 경로의 객체만 새로 만들면 나머지는 공유되고, 변경 여부는 참조 비교 한 번으로 알 수 있다.

- [ ] 1장의 `push` 후 `setTodos(todos)` 가 렌더링을 일으키지 않는 이유를 설명할 수 있다
- [ ] `const` 와 `Object.freeze` 가 각각 무엇을 막는지 구분할 수 있다
- [ ] `Object.freeze` 가 중첩 객체를 얼리지 않는 이유를 사양 기준으로 말할 수 있다
- [ ] 중첩된 값 하나를 바꿀 때 새로 만들어야 하는 객체를 고를 수 있다
- [ ] 원본을 바꾸는 배열 메서드와 바꾸지 않는 메서드를 구분할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze" target="_blank">[1] Object.freeze() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-setintegritylevel" target="_blank">[2] SetIntegrityLevel — ECMAScript 사양</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted" target="_blank">[3] Array.prototype.toSorted() — MDN Web Docs</a></li>
<li><a href="https://react.dev/learn/updating-objects-in-state" target="_blank">[4] Updating Objects in State — React</a></li>
</ol>

---

## 관련 글

- [얕은 복사와 깊은 복사 →](/post/shallow-deep-copy) (선행 개념)
- [참조 타입과 참조 복사 →](/post/reference-type)
- [고차 함수와 콜백 →](/post/higher-order-function) (원본을 두고 새 배열을 반환하는 map, filter)
- [순수 함수와 부수 효과 →](/post/pure-function) (다음 개념, 바깥을 바꾸지 않는 함수)
