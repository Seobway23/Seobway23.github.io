---
title: "클로저와 렉시컬 환경"
coverImage: /post-thumbnails/closure.svg
slug: closure
category: frontend/javascript
concept: closure
tags: [javascript, 클로저, 스코프]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-07
excerpt: >
  함수 실행이 끝난 뒤에도 내부 변수가 유지되는 이유. 함수가 정의된 렉시컬 환경에 대한 참조를 유지하기 때문이며, 카운터·모듈 패턴·이벤트 핸들러가 이 구조를 사용한다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Closures
    title: "Closures — MDN Web Docs"
    checked: 2026-09-07
  - url: https://developer.mozilla.org/ko/docs/Glossary/Scope
    title: "Scope — MDN Web Docs 용어 사전"
    checked: 2026-09-07
  - url: https://tc39.es/ecma262/#sec-environment-records
    title: "Environment Records — ECMAScript 사양"
    checked: 2026-09-07
---

## 문제 상황

일반적으로 함수가 반환되면 그 함수의 지역 변수는 더 이상 접근할 수 없다. 다음 코드는 예외다.

```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const next = makeCounter();
console.log(next()); // 1
console.log(next()); // 2   (makeCounter 는 이미 반환됨)
```

`makeCounter()` 는 첫 호출에서 반환됐지만 `count` 는 유지되고, 호출할 때마다 값이 증가한다.

---

## 동작 원리

[스코프](/post/scope)에서 다룬 것처럼 함수의 바깥 스코프는 호출 위치가 아니라 정의 위치로 결정된다.
함수 객체는 생성될 때 자신이 정의된 렉시컬 환경(Lexical Environment)에 대한 참조를
내부 슬롯 `[[Environment]]` 에 저장한다.

::: important
**클로저**는 함수와 그 함수가 정의된 렉시컬 환경의 조합이다.
함수를 다른 변수에 할당하거나 인자로 전달해도 이 참조는 함께 유지된다.
:::

`makeCounter` 의 실행 컨텍스트는 반환과 함께 콜 스택에서 제거된다. 그러나 반환된 화살표 함수가
`makeCounter` 호출 시 생성된 환경 레코드(`count` 가 저장된 곳)를 참조하고 있으므로, 이 환경 레코드는
가비지 컬렉션 대상이 되지 않는다. 가비지 컬렉터는 도달 가능한 참조가 없는 객체만 회수한다.

```seq
title: makeCounter 반환 후 count 가 유지되는 과정
speed: 1600
caption: 반환된 함수가 환경 레코드를 참조하는 동안 해당 환경은 회수되지 않는다.

lane stack   콜 스택 #stack
lane env     makeCounter 환경 레코드
lane outside 바깥 변수 next
lane out     출력 #log

step makeCounter() 를 호출한다. 실행 컨텍스트가 콜 스택에 push 된다.
  push stack makeCounter()
step 호출과 함께 count = 0 을 저장하는 환경 레코드가 생성된다.
  push env count = 0
step 화살표 함수를 생성해 반환한다. 이 함수의 [[Environment]] 는 위 환경 레코드를 가리킨다.
  move stack outside () => ++count
step makeCounter 의 실행 컨텍스트는 콜 스택에서 제거되지만, 환경 레코드는 참조가 남아 유지된다.
  mark env
step next() 를 호출하면 [[Environment]] 를 통해 같은 count 에 접근한다.
  log out 1
step 다시 호출하면 같은 count 가 증가한다.
  log out 2
```

환경 레코드는 호출마다 새로 생성된다.

```js
const a = makeCounter();
const b = makeCounter();
a(); a();   // 1, 2
b();        // 1   (a 와 독립)
```

`makeCounter` 를 호출할 때마다 별도의 환경 레코드가 만들어지므로 `a` 와 `b` 는 서로 다른 `count` 를 참조한다.

---

## 사용 사례

::: tabs
== 상태 은닉
외부에서 직접 접근할 수 없는 변수를 만든다. 클래스의 private 필드(`#`)와 비슷한 효과를 낸다.

```js
function makeAccount(initial) {
  let balance = initial;              // 외부에서 직접 접근 불가
  return {
    deposit: (v) => (balance += v),
    get: () => balance,
  };
}

const acc = makeAccount(1000);
acc.deposit(500);
acc.get();        // 1500
acc.balance;      // undefined (반환 객체의 속성이 아님)
```

== 부분 적용
인자 일부를 고정한 함수를 생성한다.

```js
function makeTag(tag) {
  return (text) => `<${tag}>${text}</${tag}>`;
}

const b = makeTag("b");
const i = makeTag("i");
b("굵게");   // "<b>굵게</b>"
```

== React 훅
`useState` 가 반환하는 `setCount` 와 이벤트 핸들러가 특정 렌더 시점의 값을 참조하는 것도
클로저로 동작한다.

```js
const [count, setCount] = useState(0);
// 이 렌더에서 만든 핸들러는 이 렌더의 count 값을 참조한다
```
:::

---

## 예제

`makeCounter` 를 두 번 호출해 생성된 두 카운터가 독립적으로 동작하는지 확인한다.

```playground
#! react title=Counter.jsx height=260
import { useState } from "react";

function makeCounter() {
  let count = 0;              // 호출마다 새 환경 레코드에 생성된다
  return () => ++count;
}

const a = makeCounter();
const b = makeCounter();

export default function App() {
  const [log, setLog] = useState([]);
  const push = (m) => setLog((prev) => [...prev, m]);

  return (
    <div>
      <button onClick={() => push(`a() → ${a()}`)}>a 증가</button>{" "}
      <button onClick={() => push(`b() → ${b()}`)}>b 증가</button>{" "}
      <button onClick={() => setLog([])}>지우기</button>
      <ul>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}
```

`a` 를 여러 번 호출해도 `b` 는 1부터 시작한다. 두 함수가 서로 다른 환경 레코드를 참조하기 때문이다.

---

## 자주 하는 실수

::: warning
**반복문에서 하나의 변수를 공유**

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
fns.map((f) => f());   // [3, 3, 3]
```

세 함수가 같은 `i` 를 참조한다. [`var` 는 함수 스코프](/post/scope)라서 반복마다 새 바인딩이
생기지 않는다. `let` 을 쓰면 반복마다 새 바인딩이 생성되어 `[0, 1, 2]` 가 된다.
:::

::: caution
**불필요한 메모리 유지**

클로저가 참조하는 환경 레코드는 함수가 살아 있는 동안 회수되지 않는다. 큰 데이터를 참조하는 함수를
이벤트 리스너 등으로 등록한 뒤 해제하지 않으면 해당 데이터도 계속 메모리에 남는다.
:::

---

## 정리

클로저는 함수와 그 함수가 정의된 렉시컬 환경의 조합이다. 함수가 환경 레코드를 참조하는 동안
그 안의 변수는 유지되며, 외부 함수를 호출할 때마다 새 환경 레코드가 생성된다.

- [ ] `makeCounter` 를 두 번 호출하면 카운터가 두 개인 이유를 설명할 수 있다
- [ ] `var` 반복문 결과가 `[3,3,3]` 인 이유를 클로저로 설명할 수 있다
- [ ] 클로저가 메모리 회수를 막는 경우를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Closures" target="_blank">[1] Closures — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Scope" target="_blank">[2] Scope — MDN Web Docs 용어 사전</a></li>
<li><a href="https://tc39.es/ecma262/#sec-environment-records" target="_blank">[3] Environment Records — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [스코프와 스코프 체인 →](/post/scope) (선행 개념)
- [호이스팅과 선언 초기화 방식 →](/post/hoisting) (선행 개념)
- [이벤트 루프 동작 과정 →](/post/event-loop-interactive) (비동기 콜백도 클로저로 값을 참조한다)
