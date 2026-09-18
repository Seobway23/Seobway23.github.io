---
title: "이벤트 루프, 눈으로 따라가기"
slug: event-loop-interactive
category: frontend/javascript
concept: event-loop
tags: [javascript, event-loop, 비동기]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-07
excerpt: >
  콜 스택·마이크로태스크 큐·태스크 큐가 어떤 순서로 비워지는지 재생 버튼을 눌러 확인한다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Event_loop
    title: "Event loop — MDN Web Docs"
    checked: 2026-09-07
  - url: https://html.spec.whatwg.org/multipage/webappapis.html#event-loops
    title: "Event loops — HTML Standard (WHATWG)"
    checked: 2026-09-07
---

자바스크립트는 한 번에 하나만 실행한다. 그런데도 타이머와 네트워크 요청이 화면을 멈추지 않는다. 그 사이를 메우는 게 **이벤트 루프**다.

말로 읽으면 헷갈린다. 아래를 직접 돌려 봐라. `▶` 를 누르거나, 상자를 클릭한 뒤 `→` 키를 눌러 한 단계씩 넘길 수 있다.

```seq
preset: event-loop
```

---

## 순서를 만드는 규칙 세 가지

::: tabs
== 콜 스택
함수를 호출하면 스택에 쌓이고, 반환하면 빠진다. **스택이 비어야만** 이벤트 루프가 큐를 들여다본다.

그래서 무거운 동기 루프 하나가 타이머 전부를 밀어버린다.

== 마이크로태스크 큐
`Promise.then`, `queueMicrotask`, `await` 뒤의 코드가 여기 들어간다.

스택이 비면 **큐가 완전히 빌 때까지** 연달아 실행한다. 중간에 태스크 큐로 넘어가지 않는다.

== 태스크 큐
`setTimeout`, `setInterval`, DOM 이벤트 콜백이 여기 들어간다.

마이크로태스크를 전부 비운 **뒤에**, 한 번에 **하나만** 꺼낸다. 그리고 다시 마이크로태스크부터 확인한다.
:::

::: notice
`setTimeout(fn, 0)` 은 "지금 당장"이 아니라 "가능한 가장 빠른 다음 태스크"다. 마이크로태스크가 남아 있으면 그것들이 먼저다.
:::

::: split
== 무슨 일이 일어나는가
`await` 는 문법 설탕이다. 오른쪽 코드는 아래와 같이 읽어야 한다.

- `await` 를 만나면 함수가 **거기서 멈추고 반환**한다.
- 나머지 몸통은 `.then` 콜백이 되어 **마이크로태스크 큐**로 간다.
- 그래서 `await` 뒤 줄은 `setTimeout(…, 0)` 보다 항상 먼저 실행된다.

== 코드
```js
async function run() {
  console.log("1");
  await null;        // ← 여기서 반환
  console.log("3");  // ← 마이크로태스크로 예약
}

run();
console.log("2");
```
:::

---

## 직접 고쳐 보기

아래 코드의 출력 순서를 먼저 예측하고, 실행해서 맞는지 확인해라. 값을 바꿔 가며 다시 돌려도 된다 (`Ctrl+Enter`).

```playground
#! js title=order.js height=180
console.log("1 동기");

setTimeout(() => console.log("4 타이머"), 0);

Promise.resolve().then(() => console.log("3 마이크로태스크"));

console.log("2 동기");
```

버튼을 눌러 무거운 동기 루프를 돌려 보면, 그 동안 타이머가 밀리는 걸 눈으로 볼 수 있다.

```playground
#! react title=BlockingLoop.jsx height=260
import { useState } from "react";

export default function App() {
  const [log, setLog] = useState([]);
  const add = (m) => setLog((prev) => [...prev, m]);

  const run = () => {
    setLog([]);
    add("시작");
    setTimeout(() => add("타이머 콜백 (0ms 로 예약했다)"), 0);
    const until = Date.now() + 600;
    while (Date.now() < until) {} // 동기로 600ms 점거
    add("동기 루프 끝 — 이제야 스택이 빈다");
  };

  return (
    <div>
      <button onClick={run}>600ms 막고 타이머 보기</button>
      <ul>{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
    </div>
  );
}
```

---

## 정리

::: grid
== 스택이 먼저다
큐는 스택이 빈 뒤에야 열린다. 동기 코드가 길면 비동기도 늦는다.

== 마이크로 > 매크로
마이크로태스크 큐를 다 비운 다음에 태스크 큐를 하나 꺼낸다.

== 하나씩
태스크는 한 번에 하나. 그 사이마다 렌더 기회가 생긴다.
:::

- [ ] 스택이 비어야 큐를 본다는 걸 설명할 수 있다
- [ ] `Promise.then` 과 `setTimeout(…, 0)` 의 순서를 예측할 수 있다
- [ ] 마이크로태스크가 무한히 쌓이면 왜 화면이 멈추는지 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Event_loop" target="_blank">[1] Event loop — MDN Web Docs</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/webappapis.html#event-loops" target="_blank">[2] Event loops — HTML Standard (WHATWG)</a></li>
</ol>

---

## 관련 글

- [React Query 개요 →](/post/react-query-overview)
