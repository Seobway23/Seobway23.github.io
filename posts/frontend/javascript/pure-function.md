---
title: "순수 함수와 부수 효과"
coverImage: /post-thumbnails/pure-function.svg
slug: pure-function
category: frontend/javascript
concept: pure-function
tags: [javascript, pure-function, side-effect, react, strict-mode, 순수함수, 부수효과]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-10-16
excerpt: >
  순수 함수는 같은 인자면 항상 같은 값을 반환하고, 바깥에서 관찰할 수 있는 변경을 남기지 않는다. React 는 컴포넌트가 순수하다고 가정하고, Strict Mode 는 개발 중에 컴포넌트를 두 번 호출해 이 가정이 깨진 곳을 드러낸다.
glossary:
  side-effect: "함수가 반환값 말고 바깥에 남기는 변경이나 바깥에서 읽어 오는 것. 변수 수정, DOM 변경, 네트워크 요청, 로그 출력 등."
  referential-transparency: "함수 호출을 그 결과값으로 바꿔 써도 프로그램 동작이 같은 성질. 순수 함수 호출은 이 성질을 가진다."
  strict-mode: "React 의 개발용 검사 모드. 컴포넌트 함수를 두 번 호출하는 등의 방법으로 순수하지 않은 코드를 찾는다. 배포 빌드에서는 동작하지 않는다."
sources:
  - url: https://react.dev/learn/keeping-components-pure
    title: "Keeping Components Pure — React"
    checked: 2026-10-16
  - url: https://react.dev/reference/react/StrictMode
    title: "<StrictMode> — React"
    checked: 2026-10-16
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    title: "Array.prototype.sort() — MDN Web Docs"
    checked: 2026-10-16
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted
    title: "Array.prototype.toSorted() — MDN Web Docs"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#sec-array.prototype.sort
    title: "Array.prototype.sort — ECMAScript 사양"
    checked: 2026-10-16
---

::: abstract
**순수 함수**는 두 조건을 만족한다. (1) 같은 인자면 항상 같은 값을 반환한다. (2) 바깥에서 관찰할 수 있는 변경, 즉 [[side-effect|부수 효과]]가 없다. 순수 함수는 호출 횟수와 순서에 결과가 영향을 받지 않아서 테스트, 캐싱, 재실행이 안전하다. React 는 컴포넌트가 순수하다고 가정하고 렌더링을 몇 번이든 다시 호출한다.
:::

## 1. 문제 상황

정렬된 목록을 화면에 보여 주는 함수다. 호출할 때마다 원래 배열의 순서가 바뀐다.

```js
const scores = [3, 1, 2];

function sortedView(list) {
  return list.sort();
}

const view = sortedView(scores);
console.log(scores);          // [1, 2, 3]  원본이 바뀌었다
console.log(view === scores); // true       같은 배열이다
```

`sortedView` 는 매번 같은 결과를 반환하지만, 호출만 해도 `scores` 가 바뀐다. 다른 곳에서 `scores` 를 입력 순서대로 쓰고 있었다면 그쪽이 깨진다. 반대로 바깥을 바꾸지 않아도 결과가 매번 다른 함수도 있다.

```js
let count = 0;
const label = (x) => { count++; return x + count; };

label(1); // 2
label(1); // 3
label(1); // 4
```

두 함수 모두 「인자만 보고는 무슨 일이 일어날지 알 수 없다」는 같은 문제를 가진다.

---

## 2. 정의

### 2.1 정의

함수가 다음 두 조건을 모두 만족하면 순수 함수라고 한다.

1. **결정성**: 같은 인자로 호출하면 항상 같은 값을 반환한다. 바깥 변수, 현재 시각, 난수, 네트워크 응답처럼 인자 밖에서 바뀌는 값을 읽지 않는다.
2. **부수 효과 없음**: 호출 전에 있던 객체나 변수를 바꾸지 않는다. DOM 변경, 요청 전송, 로그 출력도 하지 않는다.

React 문서는 이를 「자기 일만 한다(호출 전에 있던 객체나 변수를 바꾸지 않는다)」와 「같은 입력, 같은 출력」으로 설명한다<a href="https://react.dev/learn/keeping-components-pure" target="_blank"><sup>[1]</sup></a>. 순수 함수 호출은 그 결과값으로 바꿔 써도 동작이 같다. 이 성질을 [[referential-transparency|참조 투명성]]이라고 한다.

함수 안에서 새로 만든 변수나 객체를 바꾸는 것은 부수 효과가 아니다. 바깥에서 관찰할 수 없기 때문이다.

```js
function total(items) {
  let sum = 0;                    // 지역 변수 변경은 괜찮다
  for (const it of items) sum += it.price;
  return sum;
}
```

### 2.2 사양에서의 위치

ECMAScript 사양에는 「순수 함수」라는 분류가 없다. 대신 각 내장 메서드가 무엇을 바꾸는지 알고리즘으로 적혀 있다. `Array.prototype.sort` 는 `this` 배열의 요소를 정렬된 순서로 다시 쓰고 그 배열을 반환한다<a href="https://tc39.es/ecma262/#sec-array.prototype.sort" target="_blank"><sup>[5]</sup></a>. ES2023 에 추가된 `toSorted` 는 새 배열을 만들어 반환하고 원본은 그대로 둔다<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted" target="_blank"><sup>[4]</sup></a>.

| 원본을 바꾸는 메서드 | 새 배열을 반환하는 메서드 |
| --- | --- |
| `sort` | `toSorted` |
| `reverse` | `toReversed` |
| `splice` | `toSpliced` |
| `arr[i] = v` | `with(i, v)` |
| `push`, `pop`, `shift`, `unshift` | `concat`, `slice`, 전개 구문 |

순수 함수를 쓰려면 오른쪽 열을 쓰거나, 왼쪽을 쓰기 전에 복사본을 만든다. [불변성](/post/immutability) 글의 「새 값으로 교체하기」가 이 선택이다.

---

## 3. 동작 원리

### 3.1 함수가 닿는 범위

![순수 함수와 순수하지 않은 함수의 경계](/post-assets/frontend/javascript/pure-function-boundary.svg "순수 함수는 인자에서 반환값으로만 흐른다. 순수하지 않은 함수는 바깥 변수, 인자로 받은 객체, 시각, 네트워크, DOM 을 읽거나 바꾼다.")

순수 함수의 결과는 인자로만 정해진다. 그래서 다음이 성립한다.

- **테스트**: 인자와 기대값만 있으면 된다. 전역 상태를 준비하거나 정리할 필요가 없다.
- **캐싱**: 같은 인자의 결과를 저장해 두고 다시 써도 된다. React 의 `useMemo` 가 이 전제를 쓴다.
- **재실행**: 몇 번을 호출해도 바깥이 그대로라 결과가 같다.

### 3.2 React 는 컴포넌트를 여러 번 호출한다

React 는 컴포넌트 함수가 순수하다고 가정한다. 같은 props, state, context 면 같은 JSX 를 반환해야 하고, 렌더링 중에 바깥을 바꾸면 안 된다<a href="https://react.dev/learn/keeping-components-pure" target="_blank"><sup>[1]</sup></a>. [[strict-mode|Strict Mode]] 는 개발 중에 컴포넌트 함수를 두 번 호출해서 이 가정이 깨진 곳을 드러낸다<a href="https://react.dev/reference/react/StrictMode" target="_blank"><sup>[2]</sup></a>.

React 문서의 예다. 렌더링 중에 바깥 변수 `guest` 를 1 늘리는 `Cup` 컴포넌트를 세 번 그린다.

```jsx
let guest = 0;

function Cup() {
  guest = guest + 1;                     // 렌더링 중 바깥 변수 변경
  return <h2>Tea cup for guest #{guest}</h2>;
}

export default function TeaSet() {
  return (<><Cup /><Cup /><Cup /></>);
}
```

Strict Mode 에서 이 화면은 #1, #2, #3 이 아니라 #2, #4, #6 을 보여 준다<a href="https://react.dev/learn/keeping-components-pure" target="_blank"><sup>[1]</sup></a>.

```seq
title: Strict Mode 에서 순수하지 않은 Cup 을 세 번 렌더링하기
speed: 1600
caption: Cup 하나를 그릴 때마다 함수가 두 번 호출되어 guest 가 2씩 늘어난다. 화면에는 #2, #4, #6 이 나온다.

lane stack 콜 스택 #stack
lane guest guest 변수
lane out   화면 #log

step 첫 번째 Cup 을 렌더링한다. Strict Mode 가 함수를 한 번 호출한다.
  push stack Cup() 1회차
  push guest guest = 1
step 같은 Cup 을 한 번 더 호출한다. 바깥 변수가 이미 바뀌어 있어 결과가 달라진다.
  pop stack
  push stack Cup() 2회차
  push guest guest = 2
  log out Tea cup for guest #2
step 두 번째 Cup 도 두 번 호출된다.
  pop stack
  push stack Cup() ×2
  push guest guest = 4
  log out Tea cup for guest #4
step 세 번째도 같다. 순수한 컴포넌트였다면 #1, #2, #3 이 나왔을 것이다.
  pop stack
  push stack Cup() ×2
  push guest guest = 6
  log out Tea cup for guest #6
  pop stack
```

`guest` 변수를 지우고 번호를 props 로 받으면 몇 번을 호출해도 결과가 같다.

```jsx
function Cup({ guest }) {
  return <h2>Tea cup for guest #{guest}</h2>;
}
```

### 3.3 부수 효과는 어디에 두나

프로그램은 결국 화면을 바꾸고 요청을 보내야 한다. 부수 효과를 없애는 것이 아니라, 결과를 계산하는 순수한 부분과 바깥을 바꾸는 부분을 나눈다. React 에서는 렌더링(컴포넌트 함수 본문)을 순수하게 두고, 부수 효과는 이벤트 핸들러에 둔다. 이벤트 핸들러로 해결할 수 없을 때 `useEffect` 를 쓴다<a href="https://react.dev/learn/keeping-components-pure" target="_blank"><sup>[1]</sup></a>.

---

## 4. 예제

### 4.1 기본

`sort` 와 `toSorted`, 바깥 카운터를 쓰는 함수와 인자만 쓰는 함수를 비교한다. 실행 전에 각 줄의 출력을 예측해 본다.

```playground
#! js title=pure-vs-impure.js height=260
const a = [3, 1, 2];
const sortedA = a.sort();
console.log("sort:", a, a === sortedA);

const b = [3, 1, 2];
const sortedB = b.toSorted();
console.log("toSorted:", b, sortedB, b === sortedB);

let count = 0;
const impure = (x) => { count++; return x + count; };
console.log("impure:", impure(1), impure(1), impure(1));

const pure = (x, c) => x + c;
console.log("pure:", pure(1, 1), pure(1, 1), pure(1, 1));
```

Node 22 에서 실행한 결과는 다음과 같다.

```text
sort: [ 1, 2, 3 ] true
toSorted: [ 3, 1, 2 ] [ 1, 2, 3 ] false
impure: 2 3 4
pure: 2 2 2
```

### 4.2 실무 패턴

장바구니에 상품을 담는 함수를 순수 계산과 부수 효과로 나눈다.

```js
// 순수: 새 장바구니를 계산만 한다
function addItem(cart, item) {
  return { ...cart, items: [...cart.items, item] };
}

function totalPrice(cart) {
  return cart.items.reduce((sum, it) => sum + it.price, 0);
}

// 부수 효과: 이벤트 핸들러에서 상태를 바꾸고 저장한다
function onAdd(item) {
  setCart((prev) => addItem(prev, item));
  localStorage.setItem("lastAdded", item.id);
}
```

`addItem` 과 `totalPrice` 는 인자와 기대값만으로 테스트할 수 있다. 저장 방식이 바뀌어도 `onAdd` 만 고치면 된다.

---

## 5. 자주 하는 실수

::: warning
**props 로 받은 배열을 렌더링 중에 정렬한다**

```jsx
function List({ items }) {
  items.sort((a, b) => a.order - b.order);   // 부모의 배열이 바뀐다
  return <ul>{items.map((it) => <li key={it.id}>{it.name}</li>)}</ul>;
}
```

`sort` 는 원본을 바꾸므로 부모 컴포넌트의 state 배열이 직접 바뀐다. React 는 배열 참조가 같아서 변경을 감지하지 못한다. `items.toSorted(...)` 나 `[...items].sort(...)` 로 새 배열을 만든다.
:::

::: caution
**렌더링 중에 현재 시각이나 난수를 읽는다**

```jsx
function Greeting() {
  const id = Math.random();          // 렌더링마다 다른 값
  return <p data-id={id}>{new Date().toLocaleTimeString()}</p>;
}
```

같은 props 로 렌더링해도 결과가 매번 다르다. 서버 렌더링 결과와 브라우저의 결과가 달라 hydration 오류가 나기도 한다. 고정 id 가 필요하면 `useId`, 시각은 state 나 effect 에서 갱신한다.
:::

::: note
`console.log` 도 엄밀히는 부수 효과다. 개발 중 디버깅 로그는 결과에 영향을 주지 않아 문제가 되지 않지만, Strict Mode 에서는 로그가 두 번 찍힐 수 있다.
:::

---

## 6. 정리

순수 함수는 같은 인자면 같은 값을 반환하고 바깥을 바꾸지 않는다. 그래서 몇 번을 호출해도 안전하고, React 는 이 전제로 컴포넌트를 다시 호출한다. 부수 효과는 없애는 것이 아니라 이벤트 핸들러나 effect 처럼 정해진 곳으로 모은다.

- [ ] 순수 함수의 두 조건을 말할 수 있다
- [ ] 지역 변수를 바꾸는 것이 부수 효과가 아닌 이유를 안다
- [ ] sort 와 toSorted 의 차이를 원본 기준으로 설명할 수 있다
- [ ] Strict Mode 에서 Cup 이 #2, #4, #6 을 출력하는 이유를 안다
- [ ] 부수 효과를 렌더링 밖 어디에 두는지 안다

## 참고

<ol>
<li><a href="https://react.dev/learn/keeping-components-pure" target="_blank">[1] Keeping Components Pure — React</a></li>
<li><a href="https://react.dev/reference/react/StrictMode" target="_blank">[2] &lt;StrictMode&gt; — React</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/sort" target="_blank">[3] Array.prototype.sort() — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted" target="_blank">[4] Array.prototype.toSorted() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-array.prototype.sort" target="_blank">[5] Array.prototype.sort — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [불변성과 새 값으로 교체하기 →](/post/immutability) (선행 개념)
- [고차 함수와 콜백 →](/post/higher-order-function) (map, filter, reduce 에 넘기는 콜백도 순수하게 쓴다)
- [얕은 복사와 깊은 복사 →](/post/shallow-deep-copy) (원본을 두고 복사본을 바꾸는 방법)
