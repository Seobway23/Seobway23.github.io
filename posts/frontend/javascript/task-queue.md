---
title: "태스크 큐 — setTimeout 콜백이 줄 서는 곳"
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
  setTimeout(fn, 0) 이 0ms 뒤에 돌지 않는 이유. 타이머가 끝난 콜백과 클릭 이벤트는 태스크 큐에 줄을 서고, 콜 스택이 빌 때 하나씩 꺼내진다.
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

## 0ms 라고 했는데 왜 나중에 도나

`setTimeout` 에 0 을 줬다. "0ms 뒤에 실행" 이니 바로 돌 것 같다.

```js
setTimeout(() => console.log("타이머"), 0);

console.log("동기 1");
console.log("동기 2");

// 출력: 동기 1 → 동기 2 → 타이머
```

아래 두 줄보다 **위에** 적었고 **0ms** 인데도 맨 마지막이다.
`setTimeout` 의 숫자는 "이만큼 뒤에 실행" 이 아니라 **"이만큼 뒤에 줄을 세워라"** 이기 때문이다.
그 줄이 **태스크 큐**다.

---

## 어떻게 동작하는가

자바스크립트는 한 번에 하나만 실행한다. 지금 실행 중인 것은 [콜 스택](/post/call-stack)에
쌓여 있다. 콜 스택이 일하는 중에는 **아무도 끼어들 수 없다.**

그러면 "1초 뒤에 이거 해 줘" 나 "클릭되면 이거 해 줘" 는 어디서 기다리나?

::: important
**태스크 큐(task queue)** — 지금 당장은 못 돌지만 **차례가 오면 실행할 콜백**이 줄 서는 곳.
`setTimeout`·`setInterval` 이 끝난 콜백, 클릭·키보드 같은 DOM 이벤트 콜백이 여기 들어간다.
"매크로태스크 큐" 라고도 부른다.
:::

`setTimeout(cb, 100)` 한 줄은 세 구간을 지난다.

1. **맡긴다** — `setTimeout` 은 `cb` 를 **브라우저의 타이머**에 맡기고 곧바로 끝난다.
   자바스크립트는 기다리지 않고 다음 줄로 간다.
2. **줄 선다** — 100ms 가 지나면 브라우저가 `cb` 를 **태스크 큐에 넣는다.** 아직 실행이 아니다.
3. **꺼내 실행한다** — [이벤트 루프](/post/event-loop-interactive)가 콜 스택이 **비었을 때**
   큐 맨 앞에서 **하나를** 꺼내 콜 스택에 올린다. 그때 비로소 실행된다.

그래서 숫자는 **최소 대기 시간**이다. 100ms 가 지나 줄을 섰어도 콜 스택이 바쁘면 계속 기다린다.

```seq
title: 타이머 두 개가 줄 서고 꺼내지는 과정
speed: 1700
caption: 시간이 지나면 줄을 서고, 콜 스택이 비어야 하나씩 꺼내진다.

lane stack 콜 스택 #stack
lane timer 브라우저 타이머 #stack
lane queue 태스크 큐
lane out   콘솔 #log

step setTimeout(A, 100) — A 를 브라우저 타이머에 맡기고 setTimeout 은 바로 끝난다.
  push stack setTimeout(A, 100)
  move stack timer A · 100ms
step setTimeout(B, 0) — B 도 맡긴다. 아직 아무것도 실행되지 않았다.
  push stack setTimeout(B, 0)
  move stack timer B · 0ms
step 동기 코드 console.log 가 먼저 돈다. 콜 스택이 쓰이는 동안 큐는 기다린다.
  push stack console.log
  log out 동기
step 0ms 가 지난 B 가 태스크 큐에 줄을 선다. 줄을 섰을 뿐 아직 실행 전이다.
  pop stack
  move timer queue B
step 콜 스택이 비었다. 이벤트 루프가 큐 맨 앞의 B 하나를 꺼내 올린다.
  move queue stack B()
  log out B
step B 가 끝나 빠진다. 100ms 가 지나 A 도 줄을 선다.
  pop stack
  move timer queue A
step 스택이 비어 있으니 A 를 꺼내 실행한다.
  move queue stack A()
  log out A
```

### 한 번에 하나씩 꺼낸다

이벤트 루프는 태스크를 **한 번에 하나만** 꺼낸다. 하나를 끝까지 돌리고, 콜 스택이 빈 뒤에야
다음 것을 본다. 태스크와 태스크 **사이**에 브라우저는 화면을 다시 그릴 기회를 얻는다.

그래서 태스크 하나가 오래 걸리면 그동안 **다음 태스크도, 화면 갱신도 전부 멈춘다.**
버튼을 눌러도 반응이 없는 "먹통" 이 이것이다.

::: note
**줄은 사실 여러 개다.** 명세상 태스크 큐는 하나가 아니라 여러 줄(타이머, 사용자 입력,
네트워크 등)이고, 브라우저가 매번 어느 줄에서 꺼낼지 고른다. 사용자 입력을 먼저
처리하는 식이다. 다만 **같은 줄 안에서는 들어온 순서**를 지킨다. 처음 이해할 때는
"하나의 줄" 로 생각해도 결과 예측은 거의 틀리지 않는다.
:::

---

## 직접 확인

먼저 출력 순서를 예측해 보고 돌려라. 두 번째 실험은 0ms 타이머가 **실제로는 몇 ms 뒤에**
도는지 잰다.

```playground
#! js title=task-queue.js height=300
// 실험 1 — 순서
setTimeout(() => console.log("C (100ms)"), 100);
setTimeout(() => console.log("A (0ms, 먼저 등록)"), 0);
setTimeout(() => console.log("B (0ms, 나중 등록)"), 0);
console.log("동기 코드");

// 실험 2 — 0ms 인데 얼마나 기다리나
const start = performance.now();
setTimeout(() => {
  const waited = Math.round(performance.now() - start);
  console.log(`0ms 타이머가 실제로 기다린 시간: ${waited}ms`);
}, 0);

// 콜 스택을 300ms 동안 붙잡는다 — 이 동안 큐는 한 줄도 줄지 않는다
const until = Date.now() + 300;
while (Date.now() < until) {}
console.log("동기 루프 끝 (300ms 점거)");
```

같은 0ms 인 A 와 B 는 **등록한 순서대로** 나온다. 줄이니까. 그리고 0ms 타이머는
300ms 가량 기다린다. 그동안 콜 스택이 비지 않았기 때문이다.

---

## 흔한 실수

::: warning
**`setTimeout(fn, 1000)` 을 "정확히 1초 뒤" 로 믿는 것**

1000 은 **줄을 서기까지의 최소 시간**이다. 그 뒤에 앞선 태스크가 끝나고 콜 스택이 비기를
또 기다린다. 무거운 작업이 있으면 1초가 1.5초가 된다. 정확한 시각이 중요하면
`Date.now()` 나 `performance.now()` 로 실제 경과 시간을 재서 보정한다.

또 `setTimeout` 을 안에서 계속 다시 거는 식으로 5번 넘게 중첩하면, 브라우저는
0 을 줘도 **최소 4ms** 로 올려 버린다.
:::

::: caution
**`setTimeout(fn, 0)` 을 "지금 당장" 으로 쓰는 것**

"지금 코드 다 끝나고, 줄 선 것들 다음에" 다. 게다가 태스크 큐보다 **먼저 비워지는 줄**이
하나 더 있다. `Promise.then` 콜백이 들어가는 마이크로태스크 큐다. 둘이 섞였을 때의 순서는
[setTimeout vs Promise](/post/settimeout-vs-promise)에서 연습한다.
:::

::: tip
**무거운 일을 잘게 쪼개 줄 세우면 화면이 안 멈춘다.** 10만 개를 한 번에 처리하지 말고
1000 개씩 처리한 뒤 `setTimeout(다음 묶음, 0)` 으로 나머지를 다시 줄 세운다.
태스크와 태스크 사이마다 브라우저가 화면을 그리고 클릭을 처리할 틈이 생긴다.
:::

---

## 한 줄 정리

`setTimeout`·DOM 이벤트의 콜백은 바로 실행되지 않고 **태스크 큐에 줄을 선다.**
이벤트 루프는 콜 스택이 비었을 때 **맨 앞 하나씩** 꺼내 실행한다. 그래서 타이머 숫자는
"정확한 시각" 이 아니라 **"최소 대기 시간"** 이다.

- [ ] `setTimeout(fn, 0)` 이 아래 동기 코드보다 늦게 도는 이유를 설명할 수 있다
- [ ] 타이머가 "맡긴다 → 줄 선다 → 꺼내 실행한다" 세 구간을 거치는 것을 안다
- [ ] 긴 동기 작업이 클릭·화면 갱신까지 막는 이유를 말할 수 있다
- [ ] 같은 지연의 타이머 둘이 어떤 순서로 도는지 예측할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Execution_model" target="_blank">[1] JavaScript execution model — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/API/Window/setTimeout" target="_blank">[2] Window: setTimeout() — MDN Web Docs</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/webappapis.html#task-queue" target="_blank">[3] Event loops — task queue (HTML Standard, WHATWG)</a></li>
</ol>

---

## 관련 글

- [이벤트 루프, 눈으로 따라가기 →](/post/event-loop-interactive) — 이 글의 선행
- [콜 스택 — 지금 실행 중인 함수를 쌓아 두는 곳 →](/post/call-stack) — 비어야 큐가 열린다
- [setTimeout vs Promise — 실행 순서를 예측하는 가장 중요한 연습 →](/post/settimeout-vs-promise) — 마이크로태스크와 섞였을 때
