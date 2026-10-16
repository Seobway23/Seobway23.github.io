---
title: "async/await 와 실행 재개 시점"
coverImage: /post-thumbnails/async-await.svg
slug: async-await
category: frontend/javascript
concept: async-await
tags: [javascript, async, await, promise, microtask, 비동기]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-10-16
excerpt: >
  async 함수는 항상 Promise 를 반환하고, 본문은 첫 await 까지 동기로 실행된다. await 는 함수 실행을 멈추고 호출한 쪽에 제어를 돌려주며, 기다린 Promise 가 settled 되면 나머지 본문이 마이크로태스크로 재개된다.
glossary:
  suspend: "함수 실행을 중간에 멈추고 실행 컨텍스트를 콜 스택에서 내려 두는 것. 나중에 같은 위치부터 다시 실행할 수 있다."
  top-level-await: "모듈 최상위에서 async 함수 없이 await 를 쓰는 기능. 그 모듈을 import 하는 모듈은 await 가 끝날 때까지 실행을 기다린다."
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function
    title: "async function — MDN Web Docs"
    checked: 2026-10-16
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/await
    title: "await — MDN Web Docs"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#sec-async-function-definitions
    title: "Async Function Definitions — ECMAScript 사양"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#await
    title: "Await — ECMAScript 사양"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#sec-asyncblockstart
    title: "AsyncBlockStart — ECMAScript 사양"
    checked: 2026-10-16
---

::: abstract
**async 함수**는 항상 [Promise](/post/promise)를 반환한다. 본문은 첫 `await` 까지 호출과 같은 흐름에서 동기로 실행되고, `await` 에서 [[suspend|멈춘]] 뒤 호출한 쪽에 pending Promise 를 돌려준다. 기다린 값이 준비되면 나머지 본문이 [마이크로태스크](/post/microtask)로 재개된다. `return` 값은 반환한 Promise 의 이행 값이 되고, 던진 예외는 거부 이유가 된다.
:::

## 1. 문제 상황

Promise 체인으로 쓴 코드를 `async/await` 로 바꾸면 위에서 아래로 읽힌다.

```js
// then 체인
function loadUser(id) {
  return fetch(`/api/users/${id}`)
    .then((r) => r.json())
    .then((user) => fetch(`/api/posts?user=${user.id}`))
    .then((r) => r.json());
}

// async/await
async function loadUser(id) {
  const user = await (await fetch(`/api/users/${id}`)).json();
  return (await fetch(`/api/posts?user=${user.id}`)).json();
}
```

그런데 동기 코드처럼 보여도 동기 코드는 아니다. 다음 코드의 출력 순서는 줄 순서와 다르다.

```js
async function f() {
  console.log("f start");
  await undefined;
  console.log("f after await");
}

Promise.resolve().then(() => console.log("then 1")).then(() => console.log("then 2"));
f();
console.log("sync");

// f start → sync → then 1 → f after await → then 2
```

`f after await` 는 이미 준비된 값(`undefined`)을 기다렸는데도 `sync` 와 `then 1` 뒤에 실행된다.

---

## 2. 정의

### 2.1 정의

`async function` 선언은 호출할 때마다 새 Promise 를 반환하는 함수를 만든다<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function" target="_blank"><sup>[1]</sup></a>.

| 본문이 끝나는 방식 | 반환된 Promise |
| --- | --- |
| `return v` | `v` 로 fulfilled (`v` 가 Promise 면 그 결과를 따름) |
| 끝까지 실행 | `undefined` 로 fulfilled |
| 예외를 던짐 | 그 예외로 rejected |

`await expr` 는 `expr` 의 값을 Promise 로 바꾼 뒤, 그 Promise 가 settled 될 때까지 함수 실행을 멈춘다<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/await" target="_blank"><sup>[2]</sup></a>. 이행되면 그 값이 `await` 식의 결과가 되고, 거부되면 그 자리에서 예외가 던져진다. 그래서 `try/catch` 로 거부를 잡을 수 있다.

### 2.2 사양에서의 위치

- async 함수를 호출하면 사양은 새 PromiseCapability 를 만들고 `AsyncBlockStart` 로 본문 실행을 시작한다<a href="https://tc39.es/ecma262/#sec-asyncblockstart" target="_blank"><sup>[5]</sup></a>. 본문이 return 하면 그 Promise 를 resolve 하고, 예외가 나면 reject 한다.
- `Await(value)` 는 `PromiseResolve` 로 값을 Promise 로 만들고 `PerformPromiseThen` 으로 재개용 반응을 등록한다. 그다음 현재 실행 컨텍스트를 실행 컨텍스트 스택에서 제거하고 호출한 쪽으로 돌아간다<a href="https://tc39.es/ecma262/#await" target="_blank"><sup>[4]</sup></a>.
- 등록된 반응은 Promise 의 다른 반응과 같은 Job 이다. 그래서 재개는 마이크로태스크로 일어나고, 값이 이미 준비되어 있어도 현재 동기 코드가 끝난 뒤에 실행된다.

---

## 3. 동작 원리

### 3.1 await 에서 함수가 나뉜다

![async 함수가 await 에서 나뉘는 방식](/post-assets/frontend/javascript/async-await-split.svg "load() 호출은 첫 await 까지 동기로 실행되고 pending Promise 를 반환한다. 호출한 쪽은 다음 줄을 실행하고, 기다리던 값이 준비되면 load 의 나머지가 마이크로태스크로 재개된다.")

1장 두 번째 코드가 실행되는 과정을 단계별로 본다.

```seq
title: async 함수 f 와 then 체인의 실행 순서
speed: 1700
caption: await 는 값이 준비되어 있어도 함수를 멈추고 재개를 마이크로태스크 큐에 넣는다. 그래서 먼저 큐에 들어간 then 1 이 먼저 실행된다.

lane stack 콜 스택 #stack
lane micro 마이크로태스크 큐
lane out   콘솔 #log

step 스크립트가 실행된다. Promise.resolve().then(…) 은 이미 이행된 Promise 라 then 1 이 바로 큐에 들어간다. then 2 는 then 1 이 끝나야 들어간다.
  push stack 스크립트
  push micro then 1
step f() 를 호출한다. 본문이 동기로 실행되어 f start 를 출력한다.
  push stack f()
  log out f start
step await undefined 를 만난다. f 는 멈추고 재개용 반응이 큐에 들어간다. f() 는 pending Promise 를 반환한다.
  push micro f 재개
  pop stack
step 호출한 쪽이 다음 줄을 실행한다.
  log out sync
step 스크립트가 끝나 콜 스택이 비면 체크포인트가 시작된다. then 1 을 실행하고, 그 결과로 then 2 가 큐에 들어간다.
  pop stack
  move micro stack then 1
  log out then 1
  push micro then 2
  pop stack
step f 가 await 다음 줄부터 재개된다. 본문이 끝나 f 가 반환한 Promise 가 이행된다.
  move micro stack f 재개
  log out f after await
  pop stack
step 마지막으로 then 2 가 실행된다.
  move micro stack then 2
  log out then 2
  pop stack
```

### 3.2 await 는 기다리는 동안 스레드를 막지 않는다

`await` 는 함수 하나를 멈출 뿐 자바스크립트 실행 전체를 멈추지 않는다. 함수가 멈춘 동안 콜 스택은 비어 있고, 이벤트 루프는 다른 태스크(클릭 처리, 타이머, 렌더링)를 계속 실행한다. 이 점이 동기 대기(`while` 로 시간이 지나기를 기다리는 코드)와 다르다.

반대로 이 성질 때문에 `await` 앞뒤에서 공유 상태가 바뀔 수 있다.

```js
let latest = null;

async function search(q) {
  const res = await fetch(`/search?q=${q}`);
  latest = await res.json();   // 늦게 도착한 이전 검색 결과가 덮어쓸 수 있다
}
```

`search("a")` 와 `search("ab")` 를 연달아 호출하면 응답 도착 순서에 따라 `latest` 가 `"a"` 의 결과로 끝날 수 있다. 요청마다 번호를 붙여 마지막 요청의 결과만 반영하거나, `AbortController` 로 이전 요청을 취소한다.

### 3.3 순차 실행과 동시 실행

`await` 를 줄마다 쓰면 앞 작업이 끝나야 다음 작업이 시작된다. 서로 독립적인 작업은 먼저 모두 시작하고 한 번에 기다린다.

| 코드 | 시작 시점 | 100ms 작업 두 개의 소요 시간 (Node 22) |
| --- | --- | --- |
| `const a = await wait(100); const b = await wait(100);` | b 는 a 가 끝난 뒤 | 약 200ms |
| `const [a, b] = await Promise.all([wait(100), wait(100)]);` | 둘 다 즉시 | 약 100ms |

---

## 4. 예제

### 4.1 기본

1장의 순서, 순차와 동시 실행의 시간, 거부를 `try/catch` 로 잡는 것을 한 번에 확인한다. 실행 전에 출력 순서를 예측해 본다.

```playground
#! js title=async-await.js height=300
const wait = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

async function f() {
  console.log("f start");
  await undefined;
  console.log("f after await");
}
Promise.resolve().then(() => console.log("then 1")).then(() => console.log("then 2"));
f();
console.log("sync");

async function timing() {
  let t0 = Date.now();
  await wait(100); await wait(100);
  console.log("순차:", Date.now() - t0, "ms");

  t0 = Date.now();
  await Promise.all([wait(100), wait(100)]);
  console.log("동시:", Date.now() - t0, "ms");

  try {
    await Promise.reject(new Error("404"));
  } catch (e) {
    console.log("caught:", e.message);
  }
}
timing();
```

Node 22 에서 실행하면 `f start → sync → then 1 → f after await → then 2` 가 먼저 출력되고, 이어서 `순차: 약 200 ms`, `동시: 약 100 ms`, `caught: 404` 가 출력된다. 시간은 실행할 때마다 몇 ms 씩 다르다.

### 4.2 실무 패턴

목록의 각 항목에 비동기 작업을 할 때, 순서가 필요하면 `for...of` 안에서 `await` 하고, 순서가 필요 없으면 `map` 으로 모두 시작한 뒤 `Promise.all` 로 기다린다.

```js
// 순서대로, 하나씩 (앞 결과가 다음 요청에 필요할 때)
for (const id of ids) {
  await save(id);
}

// 동시에 (서로 독립적일 때)
const users = await Promise.all(ids.map((id) => fetchUser(id)));
```

오류 처리는 호출한 쪽에서 한 번 하거나, 함수 안에서 `try/catch` 로 감싸 기본값을 반환한다.

```js
async function loadConfig() {
  try {
    const res = await fetch("/config.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(e);
    return DEFAULT_CONFIG;
  }
}
```

---

## 5. 자주 하는 실수

::: warning
**forEach 에 async 콜백을 넘기고 기다렸다고 생각한다**

```js
[1, 2, 3].forEach(async (n) => {
  await wait(10);
  console.log(n);
});
console.log("forEach done");

// forEach done → 1 → 2 → 3
```

`forEach` 는 콜백이 반환한 Promise 를 버린다. 콜백 세 개가 각자 시작만 하고 `forEach` 는 바로 끝난다. 순서대로 기다리려면 `for...of`, 동시에 기다리려면 `Promise.all(arr.map(...))` 을 쓴다.
:::

::: caution
**try 안에서 await 없이 Promise 를 return 한다**

```js
async function load() {
  try {
    return failing();          // await 가 없다
  } catch {
    return "fallback";         // 실행되지 않는다
  }
}
```

`return failing()` 은 거부될 Promise 를 그대로 반환하고 함수를 끝낸다. 거부는 `try` 를 벗어난 뒤에 일어나서 `catch` 가 실행되지 않고, 호출한 쪽이 거부를 받는다. `return await failing()` 으로 쓰면 거부가 `try` 안에서 예외로 바뀌어 `catch` 가 실행된다. Node 22 에서 두 코드를 실행해 확인한 동작이다.
:::

::: caution
**async 함수를 호출하고 await 하지 않는다**

```js
async function onSubmit() {
  saveDraft();               // 반환된 Promise 를 무시
  navigate("/done");         // 저장이 끝나기 전에 이동한다
}
```

`saveDraft()` 가 거부되면 처리되지 않은 거부가 된다. 기다려야 하면 `await`, 의도적으로 기다리지 않을 때도 `.catch` 로 오류를 처리한다.
:::

::: note
ES 모듈 최상위에서는 async 함수 없이 `await` 를 쓸 수 있다([[top-level-await|최상위 await]]). 이 블로그의 playground 도 모듈로 실행되므로 최상위 await 가 동작한다. 일반 스크립트(`<script>` 에 `type="module"` 이 없는 경우)에서는 문법 오류다.
:::

---

## 6. 정리

async 함수는 Promise 를 반환하고, `await` 에서 멈췄다가 마이크로태스크로 재개된다. 동기 코드처럼 읽히지만 `await` 마다 다른 코드가 끼어들 수 있고, 독립적인 작업은 `Promise.all` 로 동시에 시작해야 시간이 줄어든다.

- [ ] async 함수의 반환값이 무엇인지, return 과 throw 가 어떻게 바뀌는지 안다
- [ ] 첫 await 전까지의 코드가 언제 실행되는지 안다
- [ ] 이미 준비된 값을 await 해도 다음 줄이 늦게 실행되는 이유를 설명할 수 있다
- [ ] 순차 await 와 Promise.all 의 시간 차이를 안다
- [ ] forEach 와 async 콜백, return 과 return await 의 차이를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function" target="_blank">[1] async function — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/await" target="_blank">[2] await — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-async-function-definitions" target="_blank">[3] Async Function Definitions — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#await" target="_blank">[4] Await — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-asyncblockstart" target="_blank">[5] AsyncBlockStart — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [Promise 의 상태와 then 체인 →](/post/promise) (선행 개념)
- [마이크로태스크 큐와 실행 시점 →](/post/microtask) (await 다음 코드가 들어가는 큐)
- [setTimeout과 Promise의 실행 순서 →](/post/settimeout-vs-promise) (출력 순서 예측 연습)
