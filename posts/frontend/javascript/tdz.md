---
title: "TDZ — 등록은 됐지만 아직 쓸 수 없는 구간"
coverImage: /post-thumbnails/tdz.svg
slug: tdz
category: frontend/javascript
concept: tdz
tags: [javascript, TDZ, let, const, 호이스팅]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-28
excerpt: >
  바깥에 분명히 있는 변수를 읽었는데 ReferenceError 가 나는 이유. let·const 는 스코프에 들어가는 순간 등록되지만 선언문을 지나기 전까지는 손댈 수 없다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let
    title: "let — Temporal dead zone (MDN Web Docs)"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Errors/Cant_access_lexical_declaration_before_init
    title: "ReferenceError: can't access lexical declaration before initialization — MDN Web Docs"
    checked: 2026-09-28
  - url: https://tc39.es/ecma262/#sec-let-and-const-declarations
    title: "let and const Declarations — ECMAScript 사양"
    checked: 2026-09-28
---

## 바깥 변수가 있는데 왜 에러인가

바깥에 `x` 가 있다. 블록 안에서 `x` 를 읽는다. 스코프 체인을 따라 바깥 `x` 를
찾을 것 같은데, 에러가 난다.

```js
let x = "바깥";

{
  console.log(x);   // ReferenceError: Cannot access 'x' before initialization
  let x = "안쪽";
}
```

`let x = "안쪽"` 줄을 지우면 `"바깥"` 이 잘 나온다. **아래에 있는 줄 하나가 위의 줄을
망가뜨린다.** 이게 TDZ 다.

---

## 어떻게 동작하는가

[호이스팅](/post/hoisting)에서 본 규칙을 다시 꺼낸다. 스코프에 들어가면 코드를 실행하기
**전에** 그 스코프의 선언을 먼저 등록한다. 여기까지는 `var` 든 `let` 이든 같다.

다른 건 **등록할 때 넣어 두는 값**이다.

| | 등록 시점에 들어가는 것 | 선언 전에 읽으면 |
|---|---|---|
| `var` | `undefined` | `undefined` |
| `let` · `const` · `class` | **아무것도 없음** (초기화 안 됨) | `ReferenceError` |

::: important
**TDZ(Temporal Dead Zone, 일시적 사각지대)** — `let`·`const` 가 **등록된 순간부터
선언문이 실행되는 순간까지**의 구간. 이 구간에서는 이름은 있는데 값이 없어서 읽기도
쓰기도 금지된다.
:::

그래서 맨 위 예제가 이렇게 풀린다.

1. 블록에 들어간다. 블록 안의 `let x` 를 **먼저 등록**한다(값 없음).
2. `console.log(x)` — 이름을 찾는다. 블록 안에 `x` 가 **이미 등록돼 있다.** 바깥까지 갈 필요가 없다.
3. 찾은 `x` 는 아직 값이 없다 → TDZ → 에러.

바깥 `x` 를 못 본 게 아니라, **안쪽 `x` 가 먼저 잡혀서** 바깥까지 안 간 것이다.

```seq
title: 블록에 들어가서 let x 줄을 지날 때까지
speed: 1600
caption: 이름은 블록에 들어가자마자 생긴다. 값은 선언문에 닿아야 생긴다.

lane outer 바깥 스코프
lane inner 블록 스코프
lane out   실행 #log

step 바깥에 x = "바깥" 이 있다.
  push outer x = "바깥"
step 블록에 들어가자마자 안쪽 let x 를 등록한다. 이름만 있고 값은 없다.
  push inner x (값 없음 · TDZ)
  mark inner
step console.log(x) — 가장 가까운 블록 스코프에서 x 를 찾는다. 있다. 바깥까지 가지 않는다.
  log out x 를 블록에서 찾음
step 찾은 x 가 TDZ 라서 읽을 수 없다.
  log out ReferenceError
step (에러가 없었다면) let x = "안쪽" 줄에 닿는 순간 값이 들어가고 TDZ 가 끝난다.
  clear inner
  push inner x = "안쪽"
```

### "시간" 사각지대인 이유

TDZ 는 **코드 위치가 아니라 실행 순서**로 정해진다. 이름에 Temporal(시간)이 붙은 이유다.

```js
function show() {
  console.log(msg);    // 코드상으로는 선언보다 위에 있다
}

let msg = "안녕";
show();                // "안녕" — 에러가 아니다
```

`show` 안의 `console.log(msg)` 는 글자로는 `let msg` 보다 위에 있다. 하지만 **실행되는 시점**은
`let msg = "안녕"` 을 지난 뒤다. 그때는 TDZ 가 이미 끝났으니 문제없다.
`show()` 를 `let msg` 위로 올리면 그때 에러가 난다.

---

## 직접 확인

각 줄이 에러인지 아닌지 먼저 예측해 봐라. `try` 로 감싸 두었으니 에러가 나도 끝까지 돈다.

```playground
#! js title=tdz.js height=320
function check(label, fn) {
  try {
    console.log(label, "→", fn());
  } catch (e) {
    console.log(label, "→", e.name);
  }
}

// 1. 선언된 적 없는 이름의 typeof 는 에러가 아니다
check("typeof 없는이름", () => typeof neverDeclared);

// 2. TDZ 안에서는 typeof 도 에러다
check("TDZ 안 typeof", () => {
  const t = typeof later;
  let later = 1;
  return t;
});

// 3. 위치는 위지만 실행은 선언 뒤 → 괜찮다
check("나중에 호출", () => {
  const read = () => value;
  let value = 42;
  return read();
});

// 4. 자기 자신으로 초기화 → 오른쪽을 계산할 때 아직 TDZ
check("let n = n + 1", () => {
  let n = n + 1;
  return n;
});

// 5. class 도 TDZ 가 있다
check("class 선언 전 new", () => {
  const u = new User();
  class User {}
  return u;
});
```

2번이 특히 의외다. `typeof` 는 "없는 변수여도 에러 없이 `"undefined"`" 로 알려져 있는데,
TDZ 안의 변수는 **없는 게 아니라 있는데 못 쓰는 것**이라 `typeof` 도 막힌다.

---

## 흔한 실수

::: warning
**"`let` 은 호이스팅이 안 된다" 고 이해하는 것**

호이스팅이 안 됐다면 맨 위 예제는 바깥 `x` 를 찾아 `"바깥"` 을 찍었어야 한다.
에러가 난다는 것 자체가 **안쪽 `x` 가 이미 등록돼 있다는 증거**다.
정확히는 "등록은 되지만 **초기화되지 않는다**" 이다.
:::

::: caution
**함수 기본값 매개변수의 순서**

```js
function range(start = end - 10, end = 100) {}   // 앞이 뒤를 참조
range();   // ReferenceError — start 를 계산할 때 end 는 아직 TDZ
```

매개변수도 왼쪽부터 차례로 초기화된다. 뒤쪽 매개변수를 앞에서 쓰면 TDZ 에 걸린다.
순서를 바꾸면(`end` 를 먼저) 해결된다.
:::

::: tip
TDZ 는 귀찮은 규칙이 아니라 **안전장치**다. `var` 였다면 맨 위 예제는 에러 없이
`undefined` 를 찍고 지나갔을 것이고, 그 `undefined` 는 한참 뒤 엉뚱한 곳에서 터진다.
선언을 쓰는 자리 **바로 위**에 두면 TDZ 에 걸릴 일 자체가 없다.
:::

---

## 한 줄 정리

`let`·`const`·`class` 는 스코프에 들어가는 순간 **이름만 등록되고 값은 비어 있다.**
선언문이 실행될 때까지 그 이름을 건드리면 `ReferenceError` 다. 기준은 코드 위치가 아니라
**실행 순서**다.

- [ ] 바깥에 같은 이름이 있는데도 에러가 나는 이유를 설명할 수 있다
- [ ] "`let` 은 호이스팅되지 않는다" 가 왜 틀린 말인지 안다
- [ ] 선언보다 위에 적힌 코드가 에러 없이 도는 경우를 예로 들 수 있다
- [ ] TDZ 안에서 `typeof` 가 에러인 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let" target="_blank">[1] let — Temporal dead zone (MDN Web Docs)</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Errors/Cant_access_lexical_declaration_before_init" target="_blank">[2] ReferenceError: can't access lexical declaration before initialization — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-let-and-const-declarations" target="_blank">[3] let and const Declarations — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [호이스팅 — 선언은 먼저 올라간다 →](/post/hoisting) — 이 글의 선행
- [스코프 — 변수가 어디까지 보이는가 →](/post/scope) — 이름을 가장 가까운 스코프부터 찾는 규칙
- [클로저 — 함수가 붙잡고 있는 변수 →](/post/closure)
