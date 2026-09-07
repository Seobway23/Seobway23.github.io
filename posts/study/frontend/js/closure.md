---
title: "클로저 — 함수가 붙잡고 있는 변수"
slug: closure
category: study/frontend/js
concept: closure
tags: [javascript, 클로저, 스코프]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-07
excerpt: >
  함수가 끝났는데도 그 안의 변수가 살아 있는 이유. 카운터·모듈·이벤트 핸들러가 전부 이것으로 돈다.
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

## 왜 이게 필요한가

함수가 끝나면 그 안의 변수는 사라진다. 그런데 이건 안 사라진다.

```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const next = makeCounter();
console.log(next()); // 1
console.log(next()); // 2   ← makeCounter 는 이미 끝났는데?
```

`makeCounter()` 는 첫 줄에서 끝났다. 그런데 `count` 는 계속 살아서 값을 기억한다.
**왜 안 사라지는가**가 이 글의 전부다.

---

## 어떻게 동작하는가

[스코프](/post/scope)에서 봤듯 함수는 자기가 **쓰여 있는 자리**의 바깥을 본다.
그 "바깥"은 함수가 만들어질 때 정해져서, 함수와 함께 붙어 다닌다.

::: important
**클로저 = 함수 + 그 함수가 태어난 스코프.**
함수를 어디로 넘기든 이 한 쌍이 같이 움직인다.
:::

그래서 `makeCounter` 의 실행은 끝나도, 돌려준 화살표 함수가 `count` 를 붙잡고 있는 한
`count` 를 담은 상자는 버려지지 않는다. 자바스크립트 엔진은 **아무도 참조하지 않는 것만**
정리하기 때문이다.

```seq
title: makeCounter 가 끝나도 count 가 남는 이유
speed: 1600
caption: 반환된 함수가 스코프를 붙잡고 있으면 그 스코프는 버려지지 않는다.

lane stack   콜 스택 #stack
lane env     makeCounter 스코프
lane outside 바깥 변수 next
lane out     출력 #log

step makeCounter() 를 호출한다. 콜 스택에 올라간다.
  push stack makeCounter()
step 그 안에서 count = 0 을 담을 스코프가 만들어진다.
  push env count = 0
step 화살표 함수를 만들어 돌려준다. 이 함수는 위 스코프를 붙잡은 채로 나간다.
  move stack outside () => ++count
step makeCounter 는 끝나 콜 스택에서 사라진다. 그런데 스코프는 남는다.
  mark env
step next() 를 부르면 붙잡아 둔 count 를 그대로 쓴다.
  log out 1
step 다시 부르면 같은 count 가 이어서 증가한다.
  log out 2
```

여기서 헷갈리기 쉬운 것 하나. **한 번 호출 = 한 개의 상자**다.

```js
const a = makeCounter();
const b = makeCounter();
a(); a();   // 1, 2
b();        // 1   ← a 와 무관하다
```

`makeCounter` 를 부를 때마다 새 스코프가 만들어지므로 `a` 와 `b` 는 서로 다른 `count` 를 본다.

---

## 어디에 쓰이는가

이름을 몰랐을 뿐, 이미 계속 쓰고 있었다.

::: tabs
== 상태 숨기기
바깥에서 못 건드리는 값을 만든다. 클래스의 `private` 를 문법 없이 흉내 낸다.

```js
function makeAccount(initial) {
  let balance = initial;              // 바깥에서 접근 불가
  return {
    deposit: (v) => (balance += v),
    get: () => balance,
  };
}

const acc = makeAccount(1000);
acc.deposit(500);
acc.get();        // 1500
acc.balance;      // undefined — 직접 못 만진다
```

== 설정을 고정한 함수 만들기
같은 함수를 설정만 바꿔 여러 개 찍어낸다.

```js
function makeTag(tag) {
  return (text) => `<${tag}>${text}</${tag}>`;
}

const b = makeTag("b");
const i = makeTag("i");
b("굵게");   // "<b>굵게</b>"
```

== 리액트 훅
`useState` 가 돌려주는 `setCount` 가 어떤 컴포넌트의 상태를 가리키는지 아는 것도
같은 원리다. 훅은 클로저 위에 지어져 있다.

```js
const [count, setCount] = useState(0);
// setCount 는 "이 컴포넌트의 이 상태" 를 붙잡고 있다
```
:::

---

## 직접 확인

`makeCounter` 를 두 번 부르면 카운터가 몇 개인지 눈으로 확인해라.

```playground
#! react title=Counter.jsx height=260
import { useState } from "react";

function makeCounter() {
  let count = 0;              // 이 상자는 호출마다 새로 생긴다
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

`a` 를 아무리 눌러도 `b` 는 1부터 시작한다. 상자가 따로이기 때문이다.

---

## 흔한 실수

::: warning
**반복문에서 하나의 변수를 공유하는 것**

```js
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
fns.map((f) => f());   // [3, 3, 3]
```

세 함수가 **같은** `i` 를 붙잡고 있다. [`var` 는 블록을 인정하지 않아](/post/scope)
`i` 가 하나뿐이기 때문이다. `let` 으로 바꾸면 반복마다 새 `i` 가 생겨 `[0, 1, 2]` 가 된다.
:::

::: caution
**필요 이상으로 크게 붙잡는 것**

클로저가 붙잡은 스코프는 버려지지 않는다. 큰 데이터를 참조한 채 오래 사는 함수를
어딘가에 등록해 두면 그만큼 메모리가 계속 물린다. 이벤트 리스너를 제거하지 않는
코드가 대표적이다.
:::

---

## 한 줄 정리

클로저는 **함수와 그 함수가 태어난 스코프의 한 쌍**이다.
그 쌍이 살아 있는 한 안의 변수도 살아 있고, 호출마다 새 쌍이 생긴다.

- [ ] `makeCounter` 를 두 번 부르면 왜 카운터가 둘인지 설명할 수 있다
- [ ] `var` 반복문이 `[3,3,3]` 인 이유를 클로저로 설명할 수 있다
- [ ] 클로저가 메모리를 붙잡는다는 뜻을 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Closures" target="_blank">[1] Closures — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Scope" target="_blank">[2] Scope — MDN Web Docs 용어 사전</a></li>
<li><a href="https://tc39.es/ecma262/#sec-environment-records" target="_blank">[3] Environment Records — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [스코프 — 변수가 어디까지 보이는가 →](/post/scope) — 이 글의 선행
- [호이스팅 — 선언은 먼저 올라간다 →](/post/hoisting) — 이 글의 선행
- [이벤트 루프, 눈으로 따라가기 →](/post/event-loop-interactive) — 비동기 콜백도 클로저로 값을 붙잡는다
