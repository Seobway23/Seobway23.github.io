---
title: "마이크로태스크 큐와 실행 시점"
coverImage: /post-thumbnails/microtask.svg
slug: microtask
category: frontend/javascript
concept: microtask
tags: [javascript, microtask, promise, queueMicrotask, event-loop, 마이크로태스크]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-10-15
excerpt: >
  Promise.then 콜백과 queueMicrotask 는 태스크 큐가 아니라 마이크로태스크 큐에 들어간다. 이벤트 루프는 태스크 하나가 끝날 때마다 마이크로태스크 큐를 완전히 비운 뒤에 렌더링과 다음 태스크로 넘어간다.
glossary:
  microtask-checkpoint: "HTML 표준의 처리 단계. 마이크로태스크 큐가 빌 때까지 가장 오래된 마이크로태스크를 하나씩 꺼내 실행한다."
  job: "ECMAScript 사양이 「나중에 실행할 작업」을 부르는 이름. 언제 실행할지는 브라우저 같은 호스트가 정한다."
  mutation-observer: "DOM 변경을 감지해 콜백을 호출하는 브라우저 API. 콜백은 마이크로태스크로 실행된다."
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/API/HTML_DOM_API/Microtask_guide
    title: "JavaScript의 queueMicrotask()와 함께 마이크로태스크 사용하기 — MDN Web Docs"
    checked: 2026-10-15
  - url: https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint
    title: "Perform a microtask checkpoint — HTML Standard (WHATWG)"
    checked: 2026-10-15
  - url: https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model
    title: "Event loop processing model — HTML Standard (WHATWG)"
    checked: 2026-10-15
  - url: https://tc39.es/ecma262/#sec-hostenqueuepromisejob
    title: "HostEnqueuePromiseJob — ECMAScript 사양"
    checked: 2026-10-15
---

::: abstract
**마이크로태스크**는 현재 실행 중인 코드가 끝나 콜 스택이 비면, 다음 태스크보다 먼저 실행되는 작업이다. 이벤트 루프는 태스크 하나를 실행한 뒤 마이크로태스크 큐를 **완전히 비우고** 나서 렌더링과 다음 태스크로 넘어간다. 그래서 마이크로태스크가 마이크로태스크를 계속 추가하면 화면이 멈춘다.
:::

## 1. 문제 상황

세 콜백은 모두 「지금 말고 나중에」 실행된다. 그런데 순서가 등록 순서와 다르다.

```js
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => {
  console.log("then");
  queueMicrotask(() => console.log("nested"));
});
queueMicrotask(() => console.log("queueMicrotask"));
console.log("sync");

// sync → then → queueMicrotask → nested → timeout
```

`setTimeout` 을 가장 먼저 등록했고 지연도 0 인데 마지막에 실행된다. `nested` 는 `then` 콜백이 실행되는 도중에 등록했는데도 `timeout` 보다 먼저 실행된다. [태스크 큐](/post/task-queue)만으로는 이 순서를 설명할 수 없다.

---

## 2. 정의

### 2.1 정의

HTML 표준에서 이벤트 루프는 태스크 큐와 별도로 **마이크로태스크 큐**를 하나 갖는다<a href="https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint" target="_blank"><sup>[2]</sup></a>. 마이크로태스크는 [[microtask-checkpoint|마이크로태스크 체크포인트]]에서 실행된다. 체크포인트는 큐가 빌 때까지 가장 오래된 항목을 하나씩 꺼내 실행하므로, 실행 중에 새로 추가된 마이크로태스크도 같은 체크포인트에서 실행된다.

마이크로태스크 큐에 들어가는 작업은 다음과 같다.

| 작업 | 큐 |
| --- | --- |
| `Promise.prototype.then`·`catch`·`finally` 콜백 | 마이크로태스크 |
| `await` 다음 코드 | 마이크로태스크 |
| `queueMicrotask(fn)` | 마이크로태스크 |
| [[mutation-observer|`MutationObserver`]] 콜백 | 마이크로태스크 |
| `setTimeout`·`setInterval` 콜백, DOM 이벤트, 네트워크 응답 처리 | 태스크 |

### 2.2 사양에서의 위치

두 표준이 역할을 나눈다.

- ECMAScript 사양은 Promise 가 이행되면 등록된 콜백을 [[job|Job]] 으로 만들어 `HostEnqueuePromiseJob` 에 넘긴다<a href="https://tc39.es/ecma262/#sec-hostenqueuepromisejob" target="_blank"><sup>[4]</sup></a>. 언제 실행할지는 정하지 않는다.
- HTML 표준은 이 Job 을 마이크로태스크 큐에 넣고, 이벤트 루프 처리 모델에서 실행 시점을 정한다<a href="https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model" target="_blank"><sup>[3]</sup></a>.

HTML 표준이 체크포인트를 수행하는 시점은 두 곳이다.

1. 이벤트 루프가 태스크 하나를 실행한 직후.
2. 스크립트나 콜백 실행이 끝나 자바스크립트 실행 컨텍스트 스택이 비었을 때(「clean up after running script」 단계).

---

## 3. 동작 원리

### 3.1 이벤트 루프 한 번의 반복

[이벤트 루프](/post/event-loop-interactive)는 한 번 반복할 때 태스크를 하나만 실행하고, 이어서 마이크로태스크 체크포인트를 수행한다. 렌더링은 그 뒤에 일어날 수 있다.

![이벤트 루프 한 번의 반복](/post-assets/frontend/javascript/microtask-checkpoint.svg "태스크는 반복마다 하나만 실행된다. 마이크로태스크는 체크포인트에서 큐가 빌 때까지 모두 실행되고, 렌더링은 그 뒤에 일어날 수 있다.")

스크립트 파일을 처음 실행하는 것도 태스크 하나다. 그래서 1장의 순서는 「동기 코드(첫 태스크) → 마이크로태스크 전부 → 다음 태스크(`timeout`)」가 된다.

### 3.2 체크포인트는 큐가 빌 때까지 돈다

1장 코드에서 각 콜백이 어느 큐에 들어가고 언제 꺼내지는지 단계별로 본다.

```seq
title: 1장 코드의 큐 상태
speed: 1600
caption: 체크포인트 중에 추가된 nested 도 같은 체크포인트에서 실행된다. timeout 은 마이크로태스크 큐가 빈 다음 태스크로 실행된다.

lane stack 콜 스택 #stack
lane micro 마이크로태스크 큐
lane task  태스크 큐
lane out   콘솔 #log

step 스크립트 실행(첫 태스크). setTimeout 의 콜백은 0ms 뒤 태스크 큐에 들어간다.
  push stack 스크립트
  push task timeout 콜백
step Promise.resolve().then(…) 은 이미 이행된 Promise 라서 콜백이 바로 마이크로태스크 큐에 들어간다.
  push micro then 콜백
step queueMicrotask 도 마이크로태스크 큐에 추가한다.
  push micro queueMicrotask 콜백
step 동기 코드 console.log 가 실행된다.
  log out sync
step 스크립트가 끝나 콜 스택이 비었다. 체크포인트가 시작되어 가장 오래된 then 콜백을 실행한다.
  pop stack
  move micro stack then 콜백
  log out then
step then 콜백이 queueMicrotask 로 nested 를 추가하고 끝난다. 큐에는 2개가 남았다.
  push micro nested 콜백
  pop stack
step 큐가 비지 않았으므로 체크포인트가 계속된다. queueMicrotask 콜백을 실행한다.
  move micro stack queueMicrotask 콜백
  log out queueMicrotask
  pop stack
step 방금 추가된 nested 도 같은 체크포인트에서 실행된다.
  move micro stack nested 콜백
  log out nested
  pop stack
step 마이크로태스크 큐가 비었다. 다음 반복에서 태스크 큐의 timeout 을 실행한다.
  move task stack timeout 콜백
  log out timeout
  pop stack
```

### 3.3 콜백이 끝날 때마다 체크포인트가 온다

체크포인트는 태스크 단위만이 아니라 콜백이 끝나 실행 컨텍스트 스택이 빌 때도 수행된다. 버튼에 리스너 두 개가 있고, 각 리스너가 마이크로태스크를 하나씩 추가하는 경우다.

```js
button.addEventListener("click", () => { log("L1"); queueMicrotask(() => log("M1")); });
button.addEventListener("click", () => { log("L2"); queueMicrotask(() => log("M2")); });
```

| 클릭 방식 | 출력 | 이유 |
| --- | --- | --- |
| 사용자가 직접 클릭 | L1 → M1 → L2 → M2 | 리스너 하나가 끝날 때마다 스택이 비어 체크포인트가 온다 |
| 코드에서 `button.click()` | L1 → L2 → M1 → M2 | `click()` 을 호출한 코드가 스택에 남아 있어 리스너 사이에 체크포인트가 오지 않는다 |

4.1절의 두 번째 예제에서 두 경우를 직접 비교할 수 있다.

---

## 4. 예제

### 4.1 기본

첫 번째 예제는 1장 코드에 `async` 함수를 더한 것이다. `async` 함수 본문은 첫 `await` 까지 동기로 실행되고, `await` 다음 코드는 마이크로태스크로 이어진다. 실행 전에 출력 순서를 예측해 본다.

```playground
#! js title=microtask-order.js height=260
setTimeout(() => console.log("timeout"), 0);

Promise.resolve().then(() => {
  console.log("then");
  queueMicrotask(() => console.log("nested"));
});

queueMicrotask(() => console.log("queueMicrotask"));

(async () => {
  console.log("async 본문");
  await null;
  console.log("await 다음");
})();

console.log("sync");
```

Node 22 에서 실행한 결과는 `async 본문 → sync → then → queueMicrotask → await 다음 → nested → timeout` 이다. `await 다음` 은 `then` 과 `queueMicrotask` 보다 늦게 큐에 들어갔지만 `nested` 보다는 먼저 들어갔다.

두 번째 예제는 3.3절의 표를 브라우저에서 확인한다. 「직접 클릭」 버튼을 마우스로 누른 결과와 「click() 호출」 버튼의 결과를 비교한다.

```playground
#! html title=listener-checkpoint.html height=260
<button id="target">직접 클릭</button>
<button id="programmatic">click() 호출</button>
<pre id="out"></pre>
<script>
  const out = document.getElementById("out");
  const target = document.getElementById("target");
  const lines = [];
  const log = (s) => { lines.push(s); out.textContent = lines.join(" → "); };

  target.addEventListener("click", () => { log("L1"); queueMicrotask(() => log("M1")); });
  target.addEventListener("click", () => { log("L2"); queueMicrotask(() => log("M2")); });

  document.getElementById("programmatic").addEventListener("click", (e) => {
    e.stopPropagation();
    lines.length = 0;
    target.click();
  });
  target.addEventListener("pointerdown", () => { lines.length = 0; });
</script>
```

### 4.2 실무 패턴

같은 태스크 안에서 여러 번 일어난 변경을 모아 한 번만 처리할 때 마이크로태스크를 쓴다. 현재 코드가 끝난 직후, 렌더링 전에 실행되므로 중간 상태가 화면에 그려지지 않는다.

```js
let pending = false;
const changed = new Set();

function markChanged(key) {
  changed.add(key);
  if (pending) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    flush([...changed]);   // 이번 태스크에서 바뀐 키를 한 번에 처리
    changed.clear();
  });
}

markChanged("a");
markChanged("b");   // flush 는 한 번만, ["a", "b"] 로 호출된다
```

UI 프레임워크가 상태 변경을 모아 한 번에 렌더링하는 것도 이 방식이다.

---

## 5. 자주 하는 실수

::: warning
**마이크로태스크 안에서 마이크로태스크를 계속 추가한다**

```js
function loop() {
  queueMicrotask(loop);   // 체크포인트가 끝나지 않는다
}
loop();
```

체크포인트는 큐가 빌 때까지 돈다. 계속 추가하면 이벤트 루프가 다음 단계로 넘어가지 못해 렌더링, 클릭 처리, 타이머가 모두 멈춘다. `setTimeout` 으로 같은 코드를 쓰면 반복마다 태스크가 하나씩이라 사이사이 렌더링이 일어난다. 긴 작업을 나눌 때는 태스크(`setTimeout`)를 쓴다.
:::

::: caution
**`await` 다음 코드가 곧바로 이어서 실행된다고 생각한다**

`await` 는 값이 이미 준비되어 있어도 함수 실행을 멈추고, 나머지를 마이크로태스크로 넘긴다. 4.1절에서 `await null` 다음 줄이 `sync` 보다 늦게 실행되는 이유다. `await` 앞뒤로 공유 변수를 읽으면, 그 사이에 다른 마이크로태스크가 값을 바꿨을 수 있다.
:::

::: note
`new Promise(executor)` 의 `executor` 는 마이크로태스크가 아니다. 생성자 안에서 바로 실행된다. 마이크로태스크가 되는 것은 `then` 에 넘긴 콜백이다.
:::

---

## 6. 정리

마이크로태스크는 콜 스택이 비는 즉시, 다음 태스크와 렌더링보다 먼저 실행된다. 이벤트 루프는 태스크 하나마다 체크포인트를 수행하고, 체크포인트는 실행 중 추가된 것까지 큐가 빌 때까지 실행한다.

- [ ] 1장 코드의 출력 순서를 큐 이름으로 설명할 수 있다
- [ ] 마이크로태스크 큐에 들어가는 작업 네 가지를 말할 수 있다
- [ ] 체크포인트 중에 추가된 마이크로태스크가 언제 실행되는지 안다
- [ ] 사용자 클릭과 `click()` 호출에서 리스너 사이 실행 순서가 다른 이유를 안다
- [ ] 마이크로태스크로 긴 작업을 나누면 화면이 멈추는 이유를 설명할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/API/HTML_DOM_API/Microtask_guide" target="_blank">[1] JavaScript의 queueMicrotask()와 함께 마이크로태스크 사용하기 — MDN Web Docs</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint" target="_blank">[2] Perform a microtask checkpoint — HTML Standard (WHATWG)</a></li>
<li><a href="https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model" target="_blank">[3] Event loop processing model — HTML Standard (WHATWG)</a></li>
<li><a href="https://tc39.es/ecma262/#sec-hostenqueuepromisejob" target="_blank">[4] HostEnqueuePromiseJob — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [이벤트 루프 동작 과정 →](/post/event-loop-interactive) (선행 개념)
- [태스크 큐와 setTimeout 실행 시점 →](/post/task-queue) (선행 개념)
- [setTimeout과 Promise의 실행 순서 →](/post/settimeout-vs-promise) (출력 순서 예측 연습)
