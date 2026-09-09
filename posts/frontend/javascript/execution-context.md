---
title: "실행 컨텍스트 — 함수가 실행될 때 만들어지는 환경"
slug: execution-context
category: frontend/javascript
concept: execution-context
tags: [javascript, 실행컨텍스트, 스코프체인]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-09
excerpt: >
  콜 스택에 쌓이는 것의 정체. 변수·this·바깥 스코프로 가는 길이 여기에 담긴다.
sources:
  - url: https://tc39.es/ecma262/#sec-execution-contexts
    title: "Executable Code and Execution Contexts — ECMAScript 사양"
    checked: 2026-09-09
  - url: https://tc39.es/ecma262/#sec-environment-records
    title: "Environment Records — ECMAScript 사양"
    checked: 2026-09-09
  - url: https://developer.mozilla.org/ko/docs/Glossary/Call_stack
    title: "Call stack — MDN Web Docs 용어 사전"
    checked: 2026-09-09
---

## 콜 스택에 쌓이는 것은 정확히 무엇인가

[콜 스택](/post/call-stack)에 "함수가 쌓인다"고 했지만, 쌓이는 것은 함수 자체가 아니다.
쌓이는 것은 **그 호출을 실행하는 데 필요한 환경 한 벌**이고, 이것을 실행 컨텍스트라 부른다.

같은 함수를 두 번 호출하면 환경도 두 벌 생긴다. 그래서 각 호출의 지역 변수가 섞이지 않는다.

```js
function greet(name) {
  const message = `안녕, ${name}`;
  return message;
}

greet("A");   // message = "안녕, A"   ← 이 호출만의 환경
greet("B");   // message = "안녕, B"   ← 별개의 환경
```

---

## 실행 컨텍스트는 무엇을 담는가

실행 컨텍스트는 **함수가 실행될 때 만들어지는 환경**이고, 세 가지를 담는다.

| 담기는 것 | 하는 일 |
|---|---|
| **환경 레코드**(Environment Record) | 이 호출의 매개변수·지역 변수·함수 선언을 담는 장부 |
| **바깥 환경 참조**(outer) | 여기 없는 이름을 찾으러 갈 다음 장소. 이게 이어지면 [스코프 체인](/post/scope) |
| **this 바인딩** | 이 호출에서 `this` 가 가리킬 값 |

핵심은 **`outer` 가 "호출한 곳"이 아니라 "함수가 정의된 곳"을 가리킨다**는 것이다.
그래서 자바스크립트가 렉시컬 스코프를 따르고, 코드를 읽는 것만으로 어떤 변수가 쓰일지
확정할 수 있다.

```seq
title: 컨텍스트가 만들어지고 이름을 찾는 과정
speed: 1500
caption: 스택에 쌓이는 한 칸이 곧 실행 컨텍스트 한 벌이다.

lane global 전역 컨텍스트
lane outer  outer() 컨텍스트
lane inner  inner() 컨텍스트
lane out    결과 #log

step 스크립트가 시작되면 전역 실행 컨텍스트부터 만들어진다.
  push global 전역 변수 · this
step outer() 를 호출하면 그 호출만의 컨텍스트가 새로 생긴다.
  push outer 지역변수 · outer→전역
step outer 안에서 inner() 를 호출한다. 또 한 벌이 생긴다.
  push inner 지역변수 · outer→outer컨텍스트
step inner 안에서 이름을 찾는다. 자기 환경 레코드에 없다.
  mark inner
step outer 참조를 따라 바깥으로 나간다. outer 컨텍스트에서 찾았다.
  move inner outer 이름 찾는 중
  log out outer 의 지역변수를 사용
step inner 가 반환되면 그 컨텍스트는 스택에서 사라진다.
  pop inner
```

---

## 만들어질 때 두 단계를 거친다

컨텍스트가 만들어지는 순간과 코드가 한 줄씩 도는 순간은 다르다.

::: split
== 1. 생성 단계
스코프 안의 선언을 먼저 훑어 환경 레코드에 등록한다.
`this` 도 이때 정해진다.

- `var` → 등록 + `undefined`
- `let`·`const` → 등록만, 값 없음 → **TDZ**
- 함수 선언 → 몸통까지 통째로

== 2. 실행 단계
코드를 위에서부터 한 줄씩 실행하며 값을 채운다.

`let x = 1` 줄에 도달해야 비로소 `x` 를 쓸 수 있다.
그 전에 읽으면 `ReferenceError`.
:::

[호이스팅](/post/hoisting)이 "선언이 위로 올라간 것처럼 보이는 현상"인 이유가 이것이다.
올라가는 게 아니라 **생성 단계에서 먼저 등록**되는 것이다.

---

## 직접 확인

같은 함수를 두 번 불러 환경이 따로인지, `outer` 가 정의된 위치를 따르는지 확인해라.

```playground
#! js title=context.js height=240
const where = "전역";

function show() {
  console.log("show 가 보는 where:", where);
}

function run() {
  const where = "run 안";      // show 와 무관하다
  show();
  console.log("run 이 보는 where:", where);
}

run();

// 호출마다 환경이 따로 생긴다
function counter() {
  let n = 0;
  return () => ++n;
}
const a = counter();
const b = counter();
console.log("a:", a(), a());   // 1 2
console.log("b:", b());        // 1  ← a 와 별개의 환경
```

`show` 는 `run` 이 불렀는데도 `run` 의 `where` 를 보지 못한다. `outer` 가 **정의된 위치**인
전역을 가리키기 때문이다.

---

## 흔한 실수

::: warning
**`outer` 를 "호출한 곳"으로 오해하는 것**

호출한 곳을 따라간다면 위 예제에서 `"run 안"` 이 찍혀야 한다. 그렇지 않다.
이름을 찾는 길은 **코드를 쓴 위치**로 정해지고, 실행 시점에 바뀌지 않는다.
:::

::: caution
**컨텍스트가 사라지면 지역 변수도 사라진다고 믿는 것**

보통은 맞다. 하지만 안쪽 함수가 그 환경을 붙잡고 있으면 컨텍스트가 스택에서 빠진 뒤에도
환경은 살아남는다. 위 `counter` 예제가 그렇고, 이것이 [클로저](/post/closure)다.
:::

---

## 한 줄 정리

실행 컨텍스트는 **함수 호출마다 만들어지는 환경 한 벌**이고, 환경 레코드 · 바깥 환경 참조 ·
`this` 를 담는다. 콜 스택에 쌓이는 것이 바로 이것이며, `outer` 는 호출한 곳이 아니라
**정의된 곳**을 가리킨다.

- [ ] 콜 스택에 쌓이는 것이 무엇인지 한 문장으로 말할 수 있다
- [ ] 생성 단계와 실행 단계가 나뉘는 이유를 안다
- [ ] `outer` 가 정의 위치를 따르는 것을 예제로 보일 수 있다

## 참고

<ol>
<li><a href="https://tc39.es/ecma262/#sec-execution-contexts" target="_blank">[1] Executable Code and Execution Contexts — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-environment-records" target="_blank">[2] Environment Records — ECMAScript 사양</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Call_stack" target="_blank">[3] Call stack — MDN Web Docs 용어 사전</a></li>
</ol>

---

## 관련 글

- [스코프 — 변수가 어디까지 보이는가 →](/post/scope) — 이 글의 선행
- [콜 스택 — 지금 실행 중인 함수를 쌓아 두는 곳 →](/post/call-stack) — 이 글의 선행
- [클로저 — 함수가 붙잡고 있는 변수 →](/post/closure) — 컨텍스트가 사라져도 환경이 남는 경우
