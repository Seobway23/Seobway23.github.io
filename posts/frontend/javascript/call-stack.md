---
title: "콜 스택 — 지금 실행 중인 함수를 쌓아 두는 곳"
slug: call-stack
category: frontend/javascript
concept: call-stack
tags: [javascript, 콜스택, 실행]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-09
excerpt: >
  자바스크립트가 "지금 어디를 실행 중인지" 기억하는 방법. 에러 메시지의 스택 트레이스가 바로 이것이다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/Call_stack
    title: "Call stack — MDN Web Docs 용어 사전"
    checked: 2026-09-09
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Errors/Too_much_recursion
    title: "RangeError: Maximum call stack size exceeded — MDN Web Docs"
    checked: 2026-09-09
  - url: https://tc39.es/ecma262/#sec-execution-contexts
    title: "Executable Code and Execution Contexts — ECMAScript 사양"
    checked: 2026-09-09
---

## 함수가 끝난 뒤 어디로 돌아가는지 누가 기억하는가

`c()` 가 끝나면 `b()` 로, `b()` 가 끝나면 `a()` 로 돌아가야 한다. 이 "돌아갈 자리"를
기억하는 것이 **콜 스택**이다.

```js
function a() { b(); console.log("a 끝"); }
function b() { c(); console.log("b 끝"); }
function c() { console.log("c 실행"); }

a();
// c 실행
// b 끝
// a 끝     ← 들어간 순서의 반대로 끝난다
```

들어간 순서와 끝나는 순서가 반대다. 이게 스택의 성질이다.

---

## 콜 스택은 어떻게 동작하는가

콜 스택은 **실행 중인 함수 호출을 쌓아 두는 후입선출(LIFO) 자료구조**다.
함수를 호출하면 위에 쌓이고(push), 반환하면 위에서 빠진다(pop).

가장 위에 있는 것이 **지금 실행 중인 함수**다. 자바스크립트는 스레드가 하나라
콜 스택도 하나뿐이고, 따라서 한 번에 한 함수만 실행한다.

```seq
title: a() → b() → c() 가 쌓였다 빠지는 과정
speed: 1300
caption: 마지막에 들어간 것이 가장 먼저 나온다.

lane stack 콜 스택 #stack
lane out   콘솔 #log

step a() 를 호출한다. 스택 맨 아래에 쌓인다.
  push stack a()
step a 안에서 b() 를 호출한다. a 위에 쌓인다.
  push stack b()
step b 안에서 c() 를 호출한다. 맨 위가 c 다 — 지금 실행 중인 함수.
  push stack c()
step c 가 출력하고 반환한다. 맨 위에서 빠진다.
  log out c 실행
  pop stack
step 이제 맨 위는 다시 b 다. b 가 남은 줄을 실행하고 반환한다.
  log out b 끝
  pop stack
step a 도 남은 줄을 실행하고 반환한다. 스택이 비었다.
  log out a 끝
  pop stack
step 스택이 비면 자바스크립트는 다음 할 일을 찾는다.
  mark stack
```

::: important
**스택이 비어야 비동기 작업이 시작된다.** `setTimeout` 이 0ms 여도 콜 스택에 뭔가
쌓여 있는 동안에는 실행되지 않는다. 이것이 [이벤트 루프](/post/event-loop-interactive)의
출발점이다.
:::

---

## 에러 메시지의 스택 트레이스가 곧 콜 스택이다

에러가 났을 때 보이는 그 목록은 **에러가 난 순간의 콜 스택을 위에서부터 찍은 것**이다.

```
Uncaught TypeError: Cannot read properties of undefined
    at c (app.js:9)      ← 여기서 터졌다
    at b (app.js:5)      ← c 를 부른 곳
    at a (app.js:1)      ← b 를 부른 곳
```

위에서 아래로 읽으면 **터진 지점 → 그것을 부른 곳** 순서다. 원인을 찾을 때는
맨 위부터 보고, 내 코드가 아닌 라이브러리 프레임은 건너뛴다.

---

## 직접 확인

스택은 무한하지 않다. 끝나지 않는 재귀를 넣으면 한계를 눈으로 볼 수 있다.

```playground
#! js title=stack-depth.js height=200
function depth(n = 1) {
  return depth(n + 1);   // 반환하지 않으니 계속 쌓인다
}

try {
  depth();
} catch (e) {
  console.log(e.constructor.name + ":", e.message);
}

// 얼마나 깊이 쌓이는지 세어 보자
let count = 0;
function measure() {
  count++;
  measure();
}
try { measure(); } catch { console.log("최대 깊이 약", count);
}
```

깊이는 브라우저와 상황에 따라 다르다. 값 자체보다 **스택에 한계가 있다**는 사실이 중요하다.

---

## 흔한 실수

::: warning
**재귀의 종료 조건을 빠뜨리는 것**

```js
function factorial(n) {
  return n * factorial(n - 1);   // 멈추지 않는다
}
```

`RangeError: Maximum call stack size exceeded` 가 난다. 스택이 한계까지 찼다는 뜻이다.
종료 조건을 넣어야 한다.

```js
function factorial(n) {
  if (n <= 1) return 1;          // 여기서 pop 이 시작된다
  return n * factorial(n - 1);
}
```
:::

::: caution
**긴 동기 작업이 화면을 멈추는 이유**

콜 스택이 하나라서, 무거운 반복문이 도는 동안에는 클릭도 렌더링도 처리되지 않는다.
스택이 비어야 브라우저가 다음 일을 할 수 있다.
:::

---

## 한 줄 정리

콜 스택은 **실행 중인 함수 호출을 쌓아 두는 후입선출 구조**이고, 자바스크립트에는
하나뿐이다. 그래서 한 번에 한 함수만 실행되고, 스택이 비어야 비동기 작업이 시작된다.

- [ ] 왜 `a 끝` 이 `c 실행` 보다 나중에 찍히는지 설명할 수 있다
- [ ] 스택 트레이스를 위에서 아래로 읽는 법을 안다
- [ ] `Maximum call stack size exceeded` 가 무슨 뜻인지 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Call_stack" target="_blank">[1] Call stack — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Errors/Too_much_recursion" target="_blank">[2] RangeError: Maximum call stack size exceeded — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-execution-contexts" target="_blank">[3] Executable Code and Execution Contexts — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [실행 컨텍스트 — 함수가 실행될 때 만들어지는 환경 →](/post/execution-context) — 스택에 쌓이는 것의 정체
- [이벤트 루프, 눈으로 따라가기 →](/post/event-loop-interactive) — 스택이 빈 뒤에 일어나는 일
