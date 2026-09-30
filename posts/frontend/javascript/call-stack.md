---
title: "콜 스택과 함수 호출 순서"
coverImage: /post-thumbnails/call-stack.svg
slug: call-stack
category: frontend/javascript
concept: call-stack
tags: [javascript, 콜스택, 실행]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-09
excerpt: >
  자바스크립트 엔진이 현재 실행 중인 함수와 반환 위치를 관리하는 자료구조. 에러 메시지의 스택 트레이스는 이 콜 스택을 출력한 것이다.
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

## 문제 상황

`c()` 가 반환되면 `b()` 의 다음 줄로, `b()` 가 반환되면 `a()` 의 다음 줄로 실행이 돌아가야 한다.
엔진은 이 반환 위치를 **콜 스택(call stack)** 으로 관리한다.

```js
function a() { b(); console.log("a 끝"); }
function b() { c(); console.log("b 끝"); }
function c() { console.log("c 실행"); }

a();
// c 실행
// b 끝
// a 끝     (호출 순서의 역순으로 종료)
```

호출은 `a → b → c` 순서로 일어나고, 종료는 `c → b → a` 순서로 일어난다.

---

## 동작 원리

콜 스택은 실행 중인 함수 호출을 저장하는 후입선출(LIFO) 자료구조다.
함수를 호출하면 해당 호출의 [실행 컨텍스트](/post/execution-context)가 스택에 push 되고,
함수가 반환되면 pop 된다.

스택 최상단의 컨텍스트가 현재 실행 중인 함수다. 자바스크립트 엔진은 하나의 스레드에서
하나의 콜 스택으로 코드를 실행하므로, 한 시점에 실행되는 함수는 하나다.

```seq
title: a() → b() → c() 호출과 반환
speed: 1300
caption: 마지막에 push 된 호출이 가장 먼저 pop 된다.

lane stack 콜 스택 #stack
lane out   콘솔 #log

step a() 를 호출한다. 스택 맨 아래에 push 된다.
  push stack a()
step a 안에서 b() 를 호출한다. a 위에 push 된다.
  push stack b()
step b 안에서 c() 를 호출한다. 최상단은 c 이고, 현재 실행 중인 함수다.
  push stack c()
step c 가 출력 후 반환한다. 최상단에서 pop 된다.
  log out c 실행
  pop stack
step 최상단이 다시 b 가 된다. b 가 나머지 코드를 실행하고 반환한다.
  log out b 끝
  pop stack
step a 도 나머지 코드를 실행하고 반환한다. 스택이 비었다.
  log out a 끝
  pop stack
step 스택이 비면 이벤트 루프가 대기 중인 작업을 확인한다.
  mark stack
```

::: important
비동기 콜백은 콜 스택이 비어 있을 때만 실행된다. `setTimeout` 의 지연이 0ms 여도
콜 스택에 실행 중인 코드가 남아 있으면 콜백은 대기한다. 자세한 흐름은
[이벤트 루프](/post/event-loop-interactive)에서 다룬다.
:::

---

## 스택 트레이스

에러 발생 시 출력되는 스택 트레이스는 에러가 발생한 시점의 콜 스택을 최상단부터 나열한 것이다.

```
Uncaught TypeError: Cannot read properties of undefined
    at c (app.js:9)      (에러 발생 위치)
    at b (app.js:5)      (c 를 호출한 위치)
    at a (app.js:1)      (b 를 호출한 위치)
```

위에서 아래 순서로 에러 발생 지점과 그 호출자가 나온다. 디버깅할 때는 첫 줄부터 확인하고,
라이브러리 내부 프레임은 건너뛰어 직접 작성한 코드의 프레임을 찾는다.

---

## 예제

콜 스택의 크기는 제한되어 있다. 종료 조건이 없는 재귀를 실행하면 한계에 도달한다.

```playground
#! js title=stack-depth.js height=200
function depth(n = 1) {
  return depth(n + 1);   // 반환하지 않으므로 호출이 계속 push 된다
}

try {
  depth();
} catch (e) {
  console.log(e.constructor.name + ":", e.message);
}

// 최대 호출 깊이 측정
let count = 0;
function measure() {
  count++;
  measure();
}
try { measure(); } catch { console.log("최대 깊이 약", count);
}
```

최대 깊이는 엔진, 브라우저, 프레임 크기에 따라 달라진다.

---

## 자주 하는 실수

::: warning
**재귀의 종료 조건 누락**

```js
function factorial(n) {
  return n * factorial(n - 1);   // 종료 조건이 없다
}
```

`RangeError: Maximum call stack size exceeded` 가 발생한다. 콜 스택이 최대 크기를 넘었다는 뜻이다.

```js
function factorial(n) {
  if (n <= 1) return 1;          // 이 지점부터 반환(pop)이 시작된다
  return n * factorial(n - 1);
}
```
:::

::: caution
**긴 동기 작업과 화면 멈춤**

콜 스택이 하나이므로 긴 반복문이 실행되는 동안에는 이벤트 처리와 렌더링이 진행되지 않는다.
메인 스레드가 블로킹된 상태다.
:::

---

## 정리

콜 스택은 실행 중인 함수 호출을 저장하는 후입선출 구조이고, 자바스크립트 엔진의 메인 스레드에는
하나만 존재한다. 따라서 한 시점에 하나의 함수만 실행되며, 비동기 콜백은 스택이 빈 뒤에 실행된다.

- [ ] `a 끝` 이 `c 실행` 보다 나중에 출력되는 이유를 설명할 수 있다
- [ ] 스택 트레이스를 위에서 아래로 읽는 방법을 안다
- [ ] `Maximum call stack size exceeded` 의 의미를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Call_stack" target="_blank">[1] Call stack — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Errors/Too_much_recursion" target="_blank">[2] RangeError: Maximum call stack size exceeded — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-execution-contexts" target="_blank">[3] Executable Code and Execution Contexts — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [실행 컨텍스트의 구성과 생성 과정 →](/post/execution-context) (스택에 쌓이는 단위)
- [이벤트 루프 동작 과정 →](/post/event-loop-interactive) (스택이 빈 뒤의 처리)
