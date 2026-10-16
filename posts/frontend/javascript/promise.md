---
title: "Promise 의 상태와 then 체인"
coverImage: /post-thumbnails/promise.svg
slug: promise
category: frontend/javascript
concept: promise
tags: [javascript, promise, then, catch, microtask, 비동기, 프로미스]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-10-16
excerpt: >
  Promise 는 pending 에서 fulfilled 나 rejected 로 한 번만 바뀌는 객체다. then 은 콜백을 반응 목록에 등록하고 새 Promise 를 반환하며, 콜백은 Promise 가 settled 된 뒤 마이크로태스크로 실행된다.
glossary:
  settled: "Promise 가 fulfilled 나 rejected 중 하나로 정해진 상태. 한 번 정해지면 바뀌지 않는다."
  reaction: "then 이나 catch 로 등록한 콜백 기록. Promise 가 settled 되면 마이크로태스크로 실행된다."
  thenable: "then 메서드를 가진 객체. Promise 는 thenable 을 받으면 그 then 을 호출해 결과를 따른다."
  unhandled-rejection: "거부된 Promise 에 거부 처리 콜백이 붙지 않은 상태. 브라우저와 Node 는 이를 경고나 오류로 알린다."
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise
    title: "Promise — MDN Web Docs"
    checked: 2026-10-16
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Using_promises
    title: "Using promises — MDN Web Docs"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#sec-promise-objects
    title: "Promise Objects — ECMAScript 사양"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#sec-performpromisethen
    title: "PerformPromiseThen — ECMAScript 사양"
    checked: 2026-10-16
  - url: https://tc39.es/ecma262/#sec-promise-resolve-functions
    title: "Promise Resolve Functions — ECMAScript 사양"
    checked: 2026-10-16
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
    title: "Promise.all() — MDN Web Docs"
    checked: 2026-10-16
---

::: abstract
**Promise** 는 아직 끝나지 않은 작업의 결과를 담는 객체다. 상태는 `pending` 에서 `fulfilled` 나 `rejected` 로 **한 번만** 바뀐다. `then` 은 콜백을 등록하고 **새 Promise** 를 반환하므로 체인으로 이어지고, 콜백은 항상 [마이크로태스크](/post/microtask)로 실행된다. 체인 중간에서 던진 오류는 다음 `catch` 까지 건너뛴다.
:::

## 1. 문제 상황

다음 코드의 출력 순서를 예측해 본다.

```js
const p = new Promise((resolve, reject) => {
  console.log("executor");
  resolve(1);
  resolve(2);
  reject(new Error("x"));
});
console.log("after new");
p.then((v) => console.log("then", v));
console.log("sync end");

// executor → after new → sync end → then 1
```

세 가지가 직관과 다르다.

- `executor` 는 `then` 보다 늦게 실행될 것 같지만 생성자 안에서 바로 실행된다.
- `resolve(1)` 로 이미 값이 있는데도 `then` 콜백은 `sync end` 뒤에 실행된다.
- `resolve(2)` 와 `reject` 는 오류 없이 무시된다.

이 세 가지는 Promise 가 상태를 가진 객체이고, 콜백 실행을 마이크로태스크로 미룬다는 것으로 설명된다.

---

## 2. 정의

### 2.1 정의

Promise 는 비동기 작업의 최종 결과(값 또는 실패 이유)를 나타내는 객체다<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank"><sup>[1]</sup></a>. 상태는 셋 중 하나다.

| 상태 | 의미 | 결과 |
| --- | --- | --- |
| `pending` | 아직 결과가 없다 | 없음 |
| `fulfilled` | 성공했다 | 값 |
| `rejected` | 실패했다 | 이유(보통 `Error`) |

`fulfilled` 와 `rejected` 를 합쳐 [[settled]] 라고 부른다. settled 가 된 Promise 의 상태와 결과는 다시 바뀌지 않는다.

### 2.2 사양에서의 위치

ECMAScript 사양은 Promise 객체에 내부 슬롯을 둔다<a href="https://tc39.es/ecma262/#sec-promise-objects" target="_blank"><sup>[3]</sup></a>.

- `[[PromiseState]]`: `pending`, `fulfilled`, `rejected` 중 하나.
- `[[PromiseResult]]`: 이행 값 또는 거부 이유.
- `[[PromiseFulfillReactions]]`, `[[PromiseRejectReactions]]`: pending 동안 `then` 으로 등록된 [[reaction|반응]] 목록.

`new Promise(executor)` 는 resolve 함수와 reject 함수를 한 쌍 만들어 executor 에 넘긴다. 두 함수는 `[[AlreadyResolved]]` 기록을 공유하므로 둘 중 처음 호출된 것만 효과가 있다<a href="https://tc39.es/ecma262/#sec-promise-resolve-functions" target="_blank"><sup>[5]</sup></a>. 1장에서 `resolve(2)` 와 `reject` 가 무시된 이유다.

`then` 은 내부적으로 `PerformPromiseThen` 을 수행한다<a href="https://tc39.es/ecma262/#sec-performpromisethen" target="_blank"><sup>[4]</sup></a>. Promise 가 pending 이면 반응을 목록에 추가하고, 이미 settled 면 반응을 바로 Job 으로 만들어 마이크로태스크 큐에 넣는다. 어느 경우든 콜백이 `then` 호출 중에 실행되지는 않는다.

---

## 3. 동작 원리

### 3.1 상태 전이와 반응 목록

![Promise 의 상태와 반응 목록](/post-assets/frontend/javascript/promise-states.svg "pending 동안 등록한 반응은 목록에 모인다. 처음 호출된 resolve 또는 reject 가 상태를 정하고, 모아 둔 반응을 등록 순서대로 마이크로태스크 큐에 넣는다.")

pending 인 Promise 에 `then` 을 두 번 붙인 뒤 resolve 하는 과정을 단계별로 본다.

```seq
title: pending Promise 에 반응 두 개를 등록하고 resolve 하기
speed: 1700
caption: resolve 는 콜백을 직접 호출하지 않는다. 반응을 마이크로태스크 큐로 옮길 뿐이고, 실행은 콜 스택이 빈 뒤에 일어난다.

lane stack 콜 스택 #stack
lane react 반응 목록
lane micro 마이크로태스크 큐
lane out   콘솔 #log

step new Promise 로 pending 상태의 p 를 만든다. resolve 함수는 바깥 변수에 꺼내 둔다.
  push stack 스크립트
step p.then(r1), p.then(r2) 를 호출한다. p 가 pending 이라 반응 목록에 쌓인다.
  push react r1
  push react r2
step 동기 코드가 registered 를 출력한다.
  log out registered
step resolve("ok") 를 호출한다. 상태가 fulfilled 로 바뀌고 반응 두 개가 등록 순서대로 마이크로태스크 큐로 옮겨진다.
  move react micro r1("ok")
  move react micro r2("ok")
step resolve 가 반환되고 동기 코드가 after resolve 를 출력한다. 콜백은 아직 실행되지 않았다.
  log out after resolve
step 스크립트가 끝나 콜 스택이 비면 체크포인트에서 r1, r2 가 차례로 실행된다.
  pop stack
  move micro stack r1("ok")
  log out r1 ok
  pop stack
  move micro stack r2("ok")
  log out r2 ok
  pop stack
```

### 3.2 then 은 새 Promise 를 반환한다

`p.then(f)` 의 반환값은 `p` 가 아니라 새 Promise 다(Node 22 에서 `p === p.then(f)` 는 `false`). 새 Promise 의 결과는 `f` 가 끝나는 방식으로 정해진다.

| 콜백 `f` 의 끝 | then 이 반환한 Promise |
| --- | --- |
| 값 `v` 를 반환 | `v` 로 fulfilled |
| 아무것도 반환하지 않음 | `undefined` 로 fulfilled |
| Promise 나 [[thenable]] 을 반환 | 그 결과를 따른다 |
| 예외를 던짐 | 그 예외로 rejected |

`then` 의 두 번째 인자나 `catch` 가 없는 단계는 거부를 그대로 다음 Promise 로 넘긴다. 그래서 거부는 체인을 따라 내려가다 처음 만나는 `catch` 에서 처리된다.

```js
Promise.resolve(1)
  .then((v) => { console.log("a", v); return v + 1; })
  .then((v) => { console.log("b", v); })          // return 없음
  .then((v) => { console.log("c", v); throw new Error("boom"); })
  .then(() => console.log("skipped"))             // 거부라서 건너뜀
  .catch((e) => { console.log("catch", e.message); return "recovered"; })
  .then((v) => console.log("d", v));

// a 1 → b 2 → c undefined → catch boom → d recovered
```

`catch` 가 값을 반환하면 그 단계의 Promise 는 fulfilled 가 되어 체인이 다시 이어진다.

### 3.3 여러 Promise 를 묶는 정적 메서드

| 메서드 | 이행 조건 | 거부 조건 |
| --- | --- | --- |
| `Promise.all` | 모두 이행, 입력 순서대로 값 배열 | 하나라도 거부되면 즉시 그 이유로 |
| `Promise.allSettled` | 모두 settled, `{ status, value \| reason }` 배열 | 거부되지 않음 |
| `Promise.race` | 가장 먼저 settled 된 것이 이행이면 | 가장 먼저 settled 된 것이 거부면 |
| `Promise.any` | 하나라도 이행되면 그 값 | 모두 거부되면 `AggregateError` |

`Promise.all` 은 입력이 끝나는 순서와 상관없이 결과 배열을 입력 순서로 채운다<a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise/all" target="_blank"><sup>[6]</sup></a>. 30ms, 60ms 짜리 두 작업을 넘기면 약 60ms 뒤에 `["a", "b"]` 로 이행된다.

---

## 4. 예제

### 4.1 기본

같은 Promise 에 체인 두 개를 붙인 경우의 순서다. 각 체인의 두 번째 콜백은 첫 번째 콜백이 끝나야 큐에 들어가므로 두 체인이 번갈아 실행된다. 실행 전에 순서를 예측해 본다.

```playground
#! js title=promise-chain.js height=240
const p = Promise.resolve();

p.then(() => console.log("A1")).then(() => console.log("A2"));
p.then(() => console.log("B1")).then(() => console.log("B2"));

new Promise((resolve) => {
  console.log("executor");
  resolve("first");
  resolve("second");
}).then((v) => console.log("value:", v));

console.log("sync");
```

Node 22 에서 실행한 결과는 `executor → sync → A1 → B1 → value: first → A2 → B2` 다. `A1`, `B1`, `value: first` 는 스크립트가 끝날 때 이미 큐에 있었다. `A2`, `B2` 는 각각 `A1`, `B1` 이 끝난 뒤에 큐에 들어간다.

### 4.2 실무 패턴

독립적인 요청 여러 개는 동시에 시작하고 `Promise.all` 로 기다린다. 일부가 실패해도 나머지 결과를 써야 하면 `Promise.allSettled` 를 쓴다.

```js
const [user, posts] = await Promise.all([
  fetch("/api/user").then((r) => r.json()),
  fetch("/api/posts").then((r) => r.json()),
]);

const results = await Promise.allSettled(urls.map((u) => fetch(u)));
const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
```

콜백 기반 API 를 Promise 로 바꿀 때는 `new Promise` 로 한 번만 감싼다.

```js
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

---

## 5. 자주 하는 실수

::: warning
**then 콜백에서 return 을 빠뜨린다**

```js
fetchUser()
  .then((user) => { fetchPosts(user.id); })   // return 없음
  .then((posts) => render(posts));            // posts 는 undefined
```

중괄호를 쓴 화살표 함수는 `return` 이 없으면 `undefined` 를 반환한다. 다음 `then` 은 `fetchPosts` 를 기다리지 않고 바로 `undefined` 를 받는다. 기다릴 Promise 는 반드시 반환한다.
:::

::: caution
**try/catch 로 Promise 의 거부를 잡으려 한다**

```js
try {
  Promise.reject(new Error("late"));
} catch (e) {
  console.log("caught");   // 실행되지 않는다
}
```

거부는 `try` 블록이 끝난 뒤에 처리된다. Node 22 에서는 `catch` 대신 `unhandledRejection` 이벤트가 발생했다. 거부는 `.catch` 를 붙이거나 [async 함수 안에서 await](/post/async-await) 해야 `try/catch` 로 잡힌다. 처리되지 않은 거부는 [[unhandled-rejection]] 으로 보고된다.
:::

::: caution
**이미 Promise 를 반환하는 함수를 new Promise 로 다시 감싼다**

```js
// 불필요하고, fetch 의 거부가 바깥으로 전달되지 않는다
const load = () => new Promise((resolve) => {
  fetch(url).then((r) => resolve(r.json()));
});

const load2 = () => fetch(url).then((r) => r.json());
```

첫 번째 코드는 `fetch` 가 거부되면 `resolve` 도 `reject` 도 호출되지 않아 Promise 가 영원히 pending 으로 남는다. 이미 Promise 가 있으면 `then` 의 반환값을 그대로 쓴다.
:::

::: note
`Promise.all` 이 거부돼도 나머지 작업은 취소되지 않는다. Promise 에는 취소 기능이 없어서, 요청을 멈추려면 `AbortController` 같은 별도 수단이 필요하다.
:::

---

## 6. 정리

Promise 는 상태를 한 번만 정하는 객체이고, `then` 은 반응을 등록하고 새 Promise 를 돌려준다. 콜백은 settled 이후 마이크로태스크로 실행되며, 체인의 각 단계는 앞 콜백이 반환하거나 던진 것으로 결과가 정해진다.

- [ ] executor 가 언제 실행되는지 안다
- [ ] resolve 를 두 번 호출하면 어떻게 되는지 사양의 슬롯으로 설명할 수 있다
- [ ] then 콜백이 반환하는 값과 던진 예외가 다음 단계에 어떻게 전달되는지 안다
- [ ] 같은 Promise 에 붙인 두 체인의 실행 순서를 큐로 설명할 수 있다
- [ ] all, allSettled, race, any 중 상황에 맞는 것을 고를 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank">[1] Promise — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Using_promises" target="_blank">[2] Using promises — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-promise-objects" target="_blank">[3] Promise Objects — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-performpromisethen" target="_blank">[4] PerformPromiseThen — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-promise-resolve-functions" target="_blank">[5] Promise Resolve Functions — ECMAScript 사양</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise/all" target="_blank">[6] Promise.all() — MDN Web Docs</a></li>
</ol>

---

## 관련 글

- [마이크로태스크 큐와 실행 시점 →](/post/microtask) (선행 개념)
- [async/await 와 실행 재개 시점 →](/post/async-await) (다음 개념, Promise 를 순서대로 쓰는 문법)
- [setTimeout과 Promise의 실행 순서 →](/post/settimeout-vs-promise) (출력 순서 예측 연습)
