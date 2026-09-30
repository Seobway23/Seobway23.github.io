---
title: "이벤트 루프 동작 과정"
coverImage: /post-thumbnails/event-loop-interactive.svg
slug: event-loop-interactive
category: frontend/javascript
concept: event-loop
tags: [javascript, event-loop, 비동기]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-07
excerpt: >
  콜 스택, 마이크로태스크 큐, 태스크 큐가 처리되는 순서를 단계별 애니메이션과 실행 가능한 예제로 정리한다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Event_loop
    title: "Event loop — MDN Web Docs"
    checked: 2026-09-07
  - url: https://html.spec.whatwg.org/multipage/webappapis.html#event-loops
    title: "Event loops — HTML Standard (WHATWG)"
    checked: 2026-09-07
---

자바스크립트 코드는 메인 스레드의 단일 콜 스택에서 실행된다. 타이머와 네트워크 요청이 실행 중인 코드를
막지 않는 것은 이 작업들을 브라우저(Web API)가 처리하고, 완료된 콜백을 큐에 넣은 뒤
**이벤트 루프(event loop)** 가 콜 스택이 비었을 때 꺼내 실행하기 때문이다.

아래 애니메이션은 `▶` 로 재생하거나, 영역을 클릭한 뒤 `→` 키로 한 단계씩 진행할 수 있다.

```seq
preset: event-loop
```

---

## 처리 순서를 결정하는 세 가지 규칙

::: tabs
== 콜 스택
함수 호출은 스택에 push 되고 반환 시 pop 된다. 이벤트 루프는 콜 스택이 비어 있을 때만
큐의 작업을 가져온다.

따라서 오래 걸리는 동기 코드가 있으면 그동안 모든 타이머 콜백이 지연된다.

== 마이크로태스크 큐
`Promise.then` 콜백, `queueMicrotask`, `await` 이후의 코드가 이 큐에 들어간다.

콜 스택이 비면 마이크로태스크 큐가 완전히 빌 때까지 연속으로 실행한다. 이 과정 중간에 태스크 큐의
작업은 실행되지 않는다.

== 태스크 큐
`setTimeout`, `setInterval`, DOM 이벤트 콜백이 이 큐에 들어간다.

이벤트 루프는 한 번에 태스크 하나만 실행한다. 태스크 하나가 끝나면 마이크로태스크 큐를 모두 비운 뒤
다음 태스크로 넘어간다.
:::

::: notice
`setTimeout(fn, 0)` 은 즉시 실행이 아니라 다음 태스크로 예약하는 것이다. 마이크로태스크가 남아 있으면
그것이 먼저 실행된다.
:::

::: split
== 동작
`async` 함수의 `await` 는 Promise 기반으로 동작한다.

- `await` 에 도달하면 함수 실행이 일시 중단되고 제어가 호출자에게 돌아간다.
- 나머지 코드는 대기 중인 Promise 가 이행된 뒤 마이크로태스크로 재개된다.
- 따라서 `await` 이후 코드는 같은 시점에 예약된 `setTimeout(…, 0)` 콜백보다 먼저 실행된다.

== 코드
```js
async function run() {
  console.log("1");
  await null;        // 여기서 실행 중단, 호출자로 복귀
  console.log("3");  // 마이크로태스크로 재개
}

run();
console.log("2");
```
:::

---

## 예제

아래 코드의 출력 순서를 확인한다. 값을 수정해 다시 실행할 수 있다(`Ctrl+Enter`).

```playground
#! js title=order.js height=180
console.log("1 동기");

setTimeout(() => console.log("4 타이머"), 0);

Promise.resolve().then(() => console.log("3 마이크로태스크"));

console.log("2 동기");
```

다음 예제는 600ms 동안 동기 루프로 메인 스레드를 점유한다. 그동안 0ms 로 예약한 타이머 콜백이
실행되지 못하는 것을 확인할 수 있다.

```playground
#! react title=BlockingLoop.jsx height=260
import { useState } from "react";

export default function App() {
  const [log, setLog] = useState([]);
  const add = (m) => setLog((prev) => [...prev, m]);

  const run = () => {
    setLog([]);
    add("시작");
    setTimeout(() => add("타이머 콜백 (0ms 로 예약)"), 0);
    const until = Date.now() + 600;
    while (Date.now() < until) {} // 600ms 동안 콜 스택 점유
    add("동기 루프 종료, 콜 스택이 비워짐");
  };

  return (
    <div>
      <button onClick={run}>600ms 블로킹 후 타이머 확인</button>
      <ul>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}
```

---

## 정리

::: grid
== 콜 스택 우선
큐의 작업은 콜 스택이 빈 뒤에 실행된다. 동기 코드가 길면 비동기 콜백도 지연된다.

== 마이크로태스크 우선
태스크 하나를 실행한 뒤, 다음 태스크 전에 마이크로태스크 큐를 모두 비운다.

== 태스크 단위 실행
태스크는 한 번에 하나씩 실행되며, 태스크 사이에 렌더링 기회가 생긴다.
:::

- [ ] 콜 스택이 비어야 큐의 작업이 실행된다는 것을 설명할 수 있다
- [ ] `Promise.then` 과 `setTimeout(…, 0)` 의 실행 순서를 예측할 수 있다
- [ ] 마이크로태스크가 계속 추가되면 렌더링이 멈추는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Event_loop" target="_blank">[1] Event loop — MDN Web Docs</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/webappapis.html#event-loops" target="_blank">[2] Event loops — HTML Standard (WHATWG)</a></li>
</ol>

---

## 관련 글

- [태스크 큐와 setTimeout 실행 시점 →](/post/task-queue) (다음 글)
- [React Query 개요 →](/post/react-query-overview)
