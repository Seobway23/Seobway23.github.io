---
title: "고차 함수와 콜백"
coverImage: /post-thumbnails/higher-order-function.svg
slug: higher-order-function
category: frontend/javascript
concept: higher-order-function
tags: [javascript, higher-order-function, callback, map, reduce, 고차 함수]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-10-15
excerpt: >
  함수를 인자로 받거나 함수를 반환하는 함수가 고차 함수다. 자바스크립트 함수는 값이라서 가능하다. map 이 콜백을 어떤 인자로 호출하는지, 반환된 함수가 클로저로 상태를 유지하는 방식을 정리한다.
glossary:
  first-class: "값으로 다룰 수 있다는 뜻. 변수에 대입하고, 인자로 넘기고, 반환할 수 있다."
  callback: "다른 함수에 인자로 넘겨서, 그 함수가 필요한 시점에 호출하게 하는 함수."
  call-slot: "함수 객체만 갖는 내부 메서드 [[Call]]. 이것이 있어야 () 로 호출할 수 있다."
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/First-class_Function
    title: "일급 함수 — MDN Web Docs 용어 사전"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/map
    title: "Array.prototype.map() — MDN Web Docs"
    checked: 2026-10-15
  - url: https://tc39.es/ecma262/#sec-array.prototype.map
    title: "Array.prototype.map — ECMAScript 사양"
    checked: 2026-10-15
  - url: https://tc39.es/ecma262/#sec-array.prototype.reduce
    title: "Array.prototype.reduce — ECMAScript 사양"
    checked: 2026-10-15
---

::: abstract
**고차 함수**는 함수를 인자로 받거나 함수를 반환하는 함수다. 자바스크립트에서 함수는 객체이므로 다른 값처럼 넘기고 반환할 수 있다. 반복 구조는 고차 함수가 갖고, 반복마다 달라지는 부분만 함수로 넘긴다.
:::

## 1. 문제 상황

세 반복문은 한 줄만 다르다.

```js
const adults = [];
for (const u of users) if (u.age >= 20) adults.push(u);

const names = [];
for (const u of users) names.push(u.name);

let total = 0;
for (const u of users) total += u.age;
```

배열을 돌며 새 결과를 만드는 구조는 같고, 「무엇을 남길지」「무엇으로 바꿀지」「어떻게 합칠지」만 다르다. 달라지는 부분을 함수로 받으면 반복 구조는 한 번만 쓰면 된다.

```js
const adults = users.filter((u) => u.age >= 20);
const names  = users.map((u) => u.name);
const total  = users.reduce((sum, u) => sum + u.age, 0);
```

`filter`, `map`, `reduce` 가 고차 함수이고, 넘긴 화살표 함수가 [[callback|콜백]]이다.

---

## 2. 정의

### 2.1 정의

함수를 인자로 받거나 함수를 반환하는 함수를 **고차 함수**라 한다. 자바스크립트 함수는 [[first-class|일급]] 값이므로 변수에 대입하고, 인자로 넘기고, 반환할 수 있다<a href="https://developer.mozilla.org/ko/docs/Glossary/First-class_Function" target="_blank"><sup>[1]</sup></a>.

| 형태 | 예 | 하는 일 |
| --- | --- | --- |
| 함수를 받는다 | `map`, `filter`, `reduce`, `addEventListener`, `setTimeout` | 정해진 시점에 받은 함수를 호출한다 |
| 함수를 반환한다 | `bind`, `once`, `debounce`, `pipe` | 인자를 기억한 새 함수를 만든다 |

### 2.2 사양에서의 위치

사양에서 함수는 [[call-slot|[[Call]]]] 내부 메서드를 가진 객체다. `IsCallable` 은 값에 `[[Call]]` 이 있는지 검사한다.

`Array.prototype.map` 의 알고리즘은 다음 순서다<a href="https://tc39.es/ecma262/#sec-array.prototype.map" target="_blank"><sup>[3]</sup></a>.

1. `IsCallable(callbackfn)` 이 `false` 면 `TypeError` 를 던진다.
2. 길이가 같은 새 배열 `A` 를 만든다.
3. 인덱스 `k` 마다 `Call(callbackfn, thisArg, « kValue, k, O »)` 로 콜백을 호출하고, 반환값을 `A[k]` 에 넣는다.
4. `A` 를 반환한다.

콜백은 요소 하나만 받는 것이 아니라 **요소, 인덱스, 원본 배열** 세 개를 받는다. 5장의 `parseInt` 실수가 여기서 나온다.

---

## 3. 동작 원리

### 3.1 함수를 받는 고차 함수

`map` 은 반복과 결과 배열 생성을 맡고, 요소를 바꾸는 규칙만 콜백에서 받는다.

![map 이 콜백을 호출하는 방식](/post-assets/frontend/javascript/hof-map-call.svg "map 은 인덱스마다 콜백을 (요소, 인덱스, 원본 배열) 세 인자로 호출하고, 반환값을 같은 인덱스의 새 배열 칸에 넣는다. 원본 배열은 바뀌지 않는다.")

`reduce` 는 콜백의 반환값을 다음 호출의 첫 인자(누적값)로 넘긴다. 초깃값이 없으면 첫 요소를 누적값으로 쓰고 두 번째 요소부터 호출한다. 그래서 빈 배열에 초깃값 없이 호출하면 쓸 값이 없어 `TypeError` 가 난다<a href="https://tc39.es/ecma262/#sec-array.prototype.reduce" target="_blank"><sup>[4]</sup></a>.

### 3.2 함수를 반환하는 고차 함수

반환된 함수는 [클로저](/post/closure)로 고차 함수의 지역 변수를 계속 참조한다. 아래 `once` 는 받은 함수를 한 번만 실행하는 새 함수를 만든다.

```js
function once(fn) {
  let done = false;
  let result;
  return (...args) => {
    if (!done) {
      done = true;
      result = fn(...args);
    }
    return result;
  };
}

const init = once(() => console.log("초기화"));
init();   // "초기화"
init();   // 출력 없음
```

```seq
title: once(fn) 가 반환한 함수가 done 을 유지하는 과정
speed: 1700
caption: once 가 끝나도 반환된 함수가 once 의 환경 레코드를 참조하므로 done 이 유지된다.

lane stack 콜 스택 #stack
lane env   once 의 환경 레코드
lane out   콘솔 #log

step once(fn) 을 호출한다. 환경 레코드에 fn, done = false, result 가 만들어진다.
  push stack once(fn)
  push env done = false
step 화살표 함수를 만들어 반환한다. 이 함수는 once 의 환경 레코드를 참조한다. once 는 콜 스택에서 제거된다.
  pop stack
step init() 첫 호출. done 이 false 이므로 true 로 바꾸고 fn 을 실행한다.
  push stack init()
  pop env
  push env done = true
  log out 초기화
step 실행이 끝나 init 이 제거된다. 환경 레코드는 init 이 참조하므로 남아 있다.
  pop stack
step init() 두 번째 호출. done 이 true 이므로 fn 을 실행하지 않고 저장된 result 를 반환한다.
  push stack init()
  mark env
step 출력 없이 끝난다.
  pop stack
```

---

## 4. 예제

### 4.1 기본

`map` 을 직접 구현하고, 함수를 반환하는 `once`, `pipe` 를 실행해 본다. `pipe` 는 함수 목록을 받아 왼쪽부터 차례로 적용하는 함수를 반환한다.

```playground
#! js title=hof.js height=320
function myMap(arr, callback) {
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = callback(arr[i], i, arr);   // 요소, 인덱스, 원본 배열
  }
  return out;
}
console.log("myMap        →", myMap([1, 2, 3], (x) => x * 10));
console.log("인자 확인    →", myMap(["a", "b"], (v, i, a) => `${v}:${i}/${a.length}`));

function once(fn) {
  let done = false, result;
  return (...args) => (done ? result : ((done = true), (result = fn(...args))));
}
let calls = 0;
const init = once(() => ++calls);
init(); init(); init();
console.log("once 호출 횟수 →", calls);

const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const addThenDouble = pipe((x) => x + 1, (x) => x * 2);
console.log("pipe(+1, ×2)(3) →", addThenDouble(3));

const users = [{ name: "a", age: 17 }, { name: "b", age: 25 }, { name: "c", age: 31 }];
console.log("20세 이상 이름 →", users.filter((u) => u.age >= 20).map((u) => u.name));
console.log("나이 합계      →", users.reduce((s, u) => s + u.age, 0));
```

출력은 `[10, 20, 30]`, `["a:0/2", "b:1/2"]`, `1`, `8`, `["b", "c"]`, `73` 이다.

### 4.2 실무 패턴

입력 이벤트마다 검색 요청을 보내지 않으려면, 마지막 호출 뒤 일정 시간이 지나야 실행되는 함수를 만든다. 타이머 ID 를 클로저에 두고 호출할 때마다 이전 타이머를 취소한다.

```js
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

input.addEventListener("input", debounce((e) => search(e.target.value), 300));
```

`debounce` 는 함수를 받아 함수를 반환하고, `addEventListener` 는 그 결과를 콜백으로 받는다. 두 고차 함수가 겹쳐 있다. React 의 `items.map((item) => <li key={item.id}>…</li>)` 도 같은 `map` 이다.

---

## 5. 자주 하는 실수

::: warning
**인자를 여러 개 받는 함수를 그대로 넘긴다**

```js
["1", "2", "3"].map(parseInt);   // [1, NaN, NaN]
["1", "2", "3"].map(Number);     // [1, 2, 3]
```

`map` 은 콜백을 `(요소, 인덱스, 배열)` 로 호출한다. `parseInt` 의 두 번째 매개변수는 진법이므로 실제 호출은 `parseInt("1", 0)`, `parseInt("2", 1)`, `parseInt("3", 2)` 다. 0 은 10진법으로 처리되고, 1진법은 없으며, 2진법에 `3` 이라는 숫자는 없다. 인자를 하나만 쓰는 함수(`Number`)를 넘기거나 `(s) => parseInt(s, 10)` 으로 감싼다.
:::

::: caution
**빈 배열에 초깃값 없이 reduce 를 호출한다**

```js
[].reduce((a, b) => a + b);      // TypeError: Reduce of empty array with no initial value
[].reduce((a, b) => a + b, 0);   // 0
```

필터 결과처럼 비어 있을 수 있는 배열에는 항상 초깃값을 넘긴다.
:::

::: caution
**메서드를 콜백으로 넘긴다**

`arr.map(obj.format)` 은 함수 참조만 넘기므로 `format` 안의 `this` 가 `obj` 가 아니다. [this 바인딩 규칙](/post/this)에서 본 것과 같은 원인이다. `arr.map((x) => obj.format(x))` 처럼 화살표 함수로 감싸 메서드 형태로 호출한다.
:::

---

## 6. 정리

고차 함수는 함수를 인자로 받거나 반환하는 함수다. 받는 쪽은 반복과 호출 시점을 맡고, 넘긴 콜백이 반복마다 달라지는 규칙을 맡는다. 반환하는 쪽은 클로저로 인자와 상태를 기억한 새 함수를 만든다.

- [ ] 1장의 반복문 세 개를 `filter`, `map`, `reduce` 로 바꿀 수 있다
- [ ] `map` 이 콜백에 넘기는 인자 세 개를 말할 수 있다
- [ ] `["1", "2", "3"].map(parseInt)` 의 결과를 설명할 수 있다
- [ ] `once` 가 반환한 함수가 `done` 을 기억하는 이유를 클로저로 설명할 수 있다
- [ ] `reduce` 에 초깃값을 넘겨야 하는 경우를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/First-class_Function" target="_blank">[1] 일급 함수 — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array/map" target="_blank">[2] Array.prototype.map() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-array.prototype.map" target="_blank">[3] Array.prototype.map — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-array.prototype.reduce" target="_blank">[4] Array.prototype.reduce — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [클로저와 렉시컬 환경 →](/post/closure) (선행 개념)
- [화살표 함수의 this 와 일반 함수와의 차이 →](/post/arrow-function) (콜백에 주로 쓰는 문법)
- [불변성과 새 값으로 교체하기 →](/post/immutability) (map, filter 가 원본을 바꾸지 않는 이유)
