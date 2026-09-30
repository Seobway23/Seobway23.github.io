---
title: "태스크 큐와 setTimeout 실행 시점"
coverImage: /post-thumbnails/task-queue.svg
slug: task-queue
category: frontend/javascript
concept: task-queue
tags: [javascript, 태스크 큐, 매크로태스크, setTimeout, 이벤트 루프, 비동기]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-28
excerpt: >
  setTimeout(fn, 0) 이 즉시 실행되지 않는 이유. 타이머가 만료된 콜백과 DOM 이벤트 콜백은 태스크 큐에 추가되고, 이벤트 루프가 콜 스택이 비었을 때 하나씩 꺼내 실행한다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Execution_model
    title: "JavaScript execution model — MDN Web Docs"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Web/API/Window/setTimeout
    title: "Window: setTimeout() — MDN Web Docs"
    checked: 2026-09-28
  - url: https://html.spec.whatwg.org/multipage/webappapis.html#task-queue
    title: "Event loops — task queue (HTML Standard, WHATWG)"
    checked: 2026-09-28
---

## setTimeout 0ms 의 실행 시점

`setTimeout` 에 지연 시간 0 을 지정해도 콜백은 즉시 실행되지 않는다.

```js
setTimeout(() => console.log("타이머"), 0);

console.log("동기 1");
console.log("동기 2");

// 출력: 동기 1 → 동기 2 → 타이머
```

`setTimeout` 호출이 두 `console.log` 보다 앞에 있고 지연 시간이 0 이지만, 타이머 콜백은
마지막에 출력된다. `setTimeout` 의 지연 시간은 콜백의 실행 시각이 아니라, 콜백이
태스크 큐(task queue)에 추가되기까지의 최소 대기 시간이기 때문이다.

---

## 동작 원리

자바스크립트 엔진은 메인 스레드에서 한 번에 하나의 실행 컨텍스트만 처리한다. 현재 실행 중인
함수 호출은 [콜 스택](/post/call-stack)에 쌓여 있고, 콜 스택이 비기 전에는 다른 코드가
실행될 수 없다.

타이머 만료나 사용자 입력처럼 나중에 발생하는 작업의 콜백은 태스크 큐에서 대기한다.

::: important
**태스크 큐(task queue)**: 실행을 기다리는 태스크의 대기열. `setTimeout`·`setInterval` 의
만료된 콜백, 클릭·키 입력 같은 DOM 이벤트 콜백이 여기에 추가된다. 마이크로태스크 큐와
구분하기 위해 매크로태스크 큐라고도 부른다.
:::

`setTimeout(cb, 100)` 은 다음 세 단계를 거친다.

1. **등록**: `setTimeout` 은 `cb` 를 브라우저 타이머(Web API)에 등록하고 즉시 반환한다.
   자바스크립트 실행은 대기하지 않고 다음 줄로 진행한다.
2. **큐 추가**: 100ms 가 지나면 브라우저가 `cb` 를 실행할 태스크를 태스크 큐에 추가(enqueue)한다.
   이 시점에는 아직 실행되지 않는다.
3. **실행**: [이벤트 루프](/post/event-loop-interactive)는 콜 스택이 비어 있을 때 태스크 큐에서
   가장 오래된 태스크 하나를 꺼내 실행한다. 이때 `cb` 가 콜 스택에 올라간다.

따라서 지연 시간은 최소 대기 시간이다. 100ms 후 태스크 큐에 추가되더라도 콜 스택에서 다른
코드가 실행 중이면 그 작업이 끝날 때까지 실행이 지연된다.

```seq
title: 타이머 두 개의 등록, 큐 추가, 실행
speed: 1700
caption: 타이머가 만료되면 태스크 큐에 추가되고, 콜 스택이 비었을 때 하나씩 실행된다.

lane stack 콜 스택 #stack
lane timer 브라우저 타이머 #stack
lane queue 태스크 큐
lane out   콘솔 #log

step setTimeout(A, 100) 이 A 를 브라우저 타이머에 등록하고 즉시 반환한다.
  push stack setTimeout(A, 100)
  move stack timer A · 100ms
step setTimeout(B, 0) 도 B 를 타이머에 등록한다. 아직 실행된 콜백은 없다.
  push stack setTimeout(B, 0)
  move stack timer B · 0ms
step 동기 코드 console.log 가 실행된다. 콜 스택이 사용 중인 동안 태스크 큐는 처리되지 않는다.
  push stack console.log
  log out 동기
step 0ms 타이머가 만료되어 B 가 태스크 큐에 추가된다. 아직 실행 전이다.
  pop stack
  move timer queue B
step 콜 스택이 비었으므로 이벤트 루프가 태스크 큐에서 B 를 꺼내 실행한다.
  move queue stack B()
  log out B
step B 실행이 끝나 콜 스택에서 제거된다. 100ms 가 지나 A 도 태스크 큐에 추가된다.
  pop stack
  move timer queue A
step 콜 스택이 비어 있으므로 A 를 꺼내 실행한다.
  move queue stack A()
  log out A
```

### 태스크 단위 실행과 렌더링

이벤트 루프는 한 번의 반복에서 태스크를 하나만 실행한다. 태스크가 끝나 콜 스택이 비면
마이크로태스크를 처리하고, 이후 브라우저가 필요에 따라 렌더링을 수행한 뒤 다음 태스크로 넘어간다.

실행 시간이 긴 태스크가 있으면 그동안 다음 태스크와 렌더링이 모두 지연된다.
메인 스레드가 블로킹되어 클릭에 반응하지 않는 현상이 이 때문에 발생한다.

::: note
HTML 명세에서 태스크 큐는 하나가 아니다. 태스크 소스(타이머, 사용자 입력, 네트워크 등)별로
여러 큐가 있고, 브라우저가 매 반복마다 어느 큐에서 태스크를 꺼낼지 선택한다. 예를 들어 사용자
입력을 우선 처리할 수 있다. 같은 큐 안에서는 추가된 순서가 유지되므로, 실행 순서를 예측할 때는
하나의 큐로 보아도 대부분 맞는다.
:::

---

## 예제

첫 번째 코드는 타이머 콜백의 실행 순서를, 두 번째 코드는 0ms 타이머가 실제로 대기한 시간을
측정한다.

```playground
#! js title=task-queue.js height=300
// 실험 1: 실행 순서
setTimeout(() => console.log("C (100ms)"), 100);
setTimeout(() => console.log("A (0ms, 먼저 등록)"), 0);
setTimeout(() => console.log("B (0ms, 나중 등록)"), 0);
console.log("동기 코드");

// 실험 2: 0ms 타이머의 실제 대기 시간
const start = performance.now();
setTimeout(() => {
  const waited = Math.round(performance.now() - start);
  console.log(`0ms 타이머가 실제로 기다린 시간: ${waited}ms`);
}, 0);

// 콜 스택을 300ms 동안 점유한다. 이 동안 태스크 큐는 처리되지 않는다
const until = Date.now() + 300;
while (Date.now() < until) {}
console.log("동기 루프 끝 (300ms 점거)");
```

지연 시간이 같은 A 와 B 는 등록된 순서대로 실행된다. 0ms 타이머는 동기 루프가 콜 스택을
점유한 약 300ms 동안 실행되지 못한다.

---

## 자주 하는 실수

::: warning
**`setTimeout(fn, 1000)` 이 정확히 1초 후 실행된다는 가정**

1000 은 태스크 큐에 추가되기까지의 최소 시간이다. 추가된 뒤에도 앞선 태스크가 끝나고 콜 스택이
비어야 실행된다. 메인 스레드에 무거운 작업이 있으면 실제 실행은 1초보다 늦어진다. 정확한
경과 시간이 필요하면 `Date.now()` 나 `performance.now()` 로 측정해 보정한다.

또한 `setTimeout` 을 콜백 안에서 반복 호출해 중첩 단계가 5 를 넘으면, 브라우저는 지연 시간을
최소 4ms 로 올린다.
:::

::: caution
**`setTimeout(fn, 0)` 을 즉시 실행 용도로 사용**

`setTimeout(fn, 0)` 은 현재 실행 중인 코드와 이미 큐에 있는 태스크가 끝난 뒤에 실행된다.
또한 `Promise.then` 콜백이 들어가는 마이크로태스크 큐는 태스크 큐보다 먼저 처리된다.
두 큐가 섞인 경우의 순서는 [setTimeout과 Promise의 실행 순서](/post/settimeout-vs-promise)에서 다룬다.
:::

::: tip
무거운 작업은 여러 태스크로 나누면 렌더링이 지연되지 않는다. 10만 개 항목을 한 번에 처리하지
않고 1000 개씩 처리한 뒤 `setTimeout(다음 묶음, 0)` 으로 나머지를 다음 태스크로 넘기면,
태스크 사이마다 브라우저가 렌더링과 입력 처리를 수행할 수 있다.
:::

---

## 정리

`setTimeout` 콜백과 DOM 이벤트 콜백은 즉시 실행되지 않고 태스크 큐에 추가된다. 이벤트 루프는
콜 스택이 비었을 때 태스크 큐에서 가장 오래된 태스크를 하나씩 꺼내 실행한다. 따라서 타이머의
지연 시간은 정확한 실행 시각이 아니라 최소 대기 시간이다.

- [ ] `setTimeout(fn, 0)` 이 뒤따르는 동기 코드보다 늦게 실행되는 이유를 설명할 수 있다
- [ ] 타이머 콜백이 등록, 큐 추가, 실행의 세 단계를 거치는 것을 안다
- [ ] 긴 동기 작업이 입력 처리와 렌더링을 지연시키는 이유를 설명할 수 있다
- [ ] 지연 시간이 같은 타이머 두 개의 실행 순서를 예측할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Execution_model" target="_blank">[1] JavaScript execution model — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/API/Window/setTimeout" target="_blank">[2] Window: setTimeout() — MDN Web Docs</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/webappapis.html#task-queue" target="_blank">[3] Event loops — task queue (HTML Standard, WHATWG)</a></li>
</ol>

---

## 관련 글

- [이벤트 루프 동작 과정 →](/post/event-loop-interactive) (선행 개념)
- [콜 스택과 함수 호출 순서 →](/post/call-stack)
- [setTimeout과 Promise의 실행 순서 →](/post/settimeout-vs-promise)
