---
title: "TDZ(Temporal Dead Zone)"
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
  외부 스코프에 같은 이름의 변수가 있어도 ReferenceError 가 발생하는 이유. let·const 는 스코프 진입 시 환경 레코드에 등록되지만, 선언문이 실행되기 전까지는 초기화되지 않은 상태로 남는다.
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

## 문제 상황

외부 스코프에 `x` 가 선언되어 있고, 블록 안에서 `x` 를 읽는다. 스코프 체인을 따라
외부 `x` 가 참조될 것으로 예상하지만 실제로는 `ReferenceError` 가 발생한다.

```js
let x = "바깥";

{
  console.log(x);   // ReferenceError: Cannot access 'x' before initialization
  let x = "안쪽";
}
```

블록 안의 `let x = "안쪽"` 을 지우면 `"바깥"` 이 출력된다. 뒤에 있는 선언문이 앞쪽 코드의
이름 해석에 영향을 준다는 뜻이고, 이 현상을 설명하는 개념이 TDZ 다.

---

## 동작 원리

[호이스팅](/post/hoisting)에서 다룬 것처럼, 스코프에 진입하면 코드를 실행하기 전에
해당 스코프의 선언이 환경 레코드(Environment Record)에 먼저 등록된다. 이 단계는 `var` 와
`let` 이 동일하다.

차이는 등록 시점의 초기값이다.

| 선언 | 등록 시점의 상태 | 선언문 이전에 접근하면 |
|---|---|---|
| `var` | `undefined` 로 초기화 | `undefined` |
| `let` · `const` · `class` | 초기화되지 않음(uninitialized) | `ReferenceError` |

::: important
**TDZ(Temporal Dead Zone, 일시적 사각지대)**: `let`·`const`·`class` 바인딩이 환경 레코드에
등록된 시점부터 선언문이 실행되어 초기화되는 시점까지의 구간. 이 구간에서는 바인딩이
존재하지만 초기화되지 않았으므로 읽기와 쓰기 모두 `ReferenceError` 를 발생시킨다.
:::

앞의 예제는 다음 순서로 실행된다.

1. 블록에 진입하면서 블록 스코프의 환경 레코드에 `x` 가 초기화되지 않은 상태로 등록된다.
2. `console.log(x)` 에서 식별자 `x` 를 해석한다. 가장 가까운 블록 스코프에서 바인딩이
   발견되므로 외부 스코프는 탐색하지 않는다.
3. 발견된 바인딩이 초기화 전 상태이므로 `ReferenceError` 가 발생한다.

즉 외부 `x` 가 보이지 않는 것이 아니라, 블록 스코프의 `x` 바인딩이 먼저 해석되어
외부 스코프까지 탐색이 진행되지 않는다.

```seq
title: 블록 진입부터 let x 초기화까지
speed: 1600
caption: 바인딩은 블록 진입 시점에 생성되고, 값은 선언문이 실행될 때 초기화된다.

lane outer 외부 스코프
lane inner 블록 스코프
lane out   실행 #log

step 외부 스코프에 x = "바깥" 이 초기화되어 있다.
  push outer x = "바깥"
step 블록에 진입하면 블록 스코프에 x 바인딩이 초기화되지 않은 상태로 등록된다.
  push inner x (uninitialized · TDZ)
  mark inner
step console.log(x) 는 가장 가까운 블록 스코프에서 x 바인딩을 찾는다. 외부 스코프는 탐색하지 않는다.
  log out x 를 블록 스코프에서 해석
step 해석된 바인딩이 TDZ 상태이므로 ReferenceError 가 발생한다.
  log out ReferenceError
step 에러가 없었다면 let x = "안쪽" 이 실행되는 시점에 바인딩이 초기화되고 TDZ 가 끝난다.
  clear inner
  push inner x = "안쪽"
```

### Temporal 이라는 이름

TDZ 는 소스 코드상의 위치가 아니라 실행 시점을 기준으로 판정된다. 이름에 Temporal(시간)이
들어가는 이유다.

```js
function show() {
  console.log(msg);    // 소스상으로는 선언보다 앞에 위치
}

let msg = "안녕";
show();                // "안녕" (에러 없음)
```

`show` 내부의 `console.log(msg)` 는 소스상 `let msg` 보다 앞에 있지만, 실제로 실행되는 시점은
`let msg = "안녕"` 이 실행된 이후다. 이때 `msg` 는 이미 초기화되어 있으므로 정상 동작한다.
`show()` 호출을 `let msg` 앞으로 옮기면 `ReferenceError` 가 발생한다.

---

## 예제

아래 코드는 각 경우를 `try` 로 감싸 에러가 발생해도 끝까지 실행된다. 실행하면 각 줄의
결과를 확인할 수 있다.

```playground
#! js title=tdz.js height=320
function check(label, fn) {
  try {
    console.log(label, "→", fn());
  } catch (e) {
    console.log(label, "→", e.name);
  }
}

// 1. 선언되지 않은 식별자에 대한 typeof 는 에러가 아니다
check("typeof 없는이름", () => typeof neverDeclared);

// 2. TDZ 구간에서는 typeof 도 ReferenceError
check("TDZ 안 typeof", () => {
  const t = typeof later;
  let later = 1;
  return t;
});

// 3. 소스상 위치는 앞이지만 실행 시점은 초기화 이후
check("나중에 호출", () => {
  const read = () => value;
  let value = 42;
  return read();
});

// 4. 초기화식의 우변을 평가하는 시점에 n 은 아직 TDZ
check("let n = n + 1", () => {
  let n = n + 1;
  return n;
});

// 5. class 선언도 TDZ 가 적용된다
check("class 선언 전 new", () => {
  const u = new User();
  class User {}
  return u;
});
```

2번의 경우, `typeof` 는 선언되지 않은 식별자에 대해 `"undefined"` 를 반환하지만 TDZ 구간의
바인딩은 존재하는 상태이므로 `typeof` 역시 `ReferenceError` 를 발생시킨다.

---

## 자주 하는 실수

::: warning
**"`let` 은 호이스팅되지 않는다"는 이해**

`let` 이 호이스팅되지 않는다면 첫 번째 예제는 외부 `x` 를 참조해 `"바깥"` 을 출력해야 한다.
`ReferenceError` 가 발생한다는 것은 블록 스코프에 `x` 바인딩이 이미 등록되어 있다는 뜻이다.
정확한 표현은 "등록은 되지만 초기화되지 않는다"이다.
:::

::: caution
**기본값 매개변수의 참조 순서**

```js
function range(start = end - 10, end = 100) {}   // 앞 매개변수가 뒤 매개변수를 참조
range();   // ReferenceError: start 평가 시점에 end 는 TDZ
```

매개변수는 왼쪽부터 순서대로 초기화된다. 뒤쪽 매개변수를 앞쪽 기본값에서 참조하면 TDZ 에
해당한다. `end` 를 앞에 두면 해결된다.
:::

::: tip
`var` 였다면 첫 번째 예제는 에러 없이 `undefined` 를 출력하고, 그 값이 이후 로직에 전달되어
원인과 거리가 먼 위치에서 문제가 드러난다. TDZ 는 초기화 전 접근을 그 자리에서 런타임 에러로
드러낸다. 선언을 사용 위치보다 앞에 두면 TDZ 에 걸리지 않는다.
:::

---

## 정리

`let`·`const`·`class` 는 스코프 진입 시 바인딩이 등록되지만 초기화되지 않는다.
선언문이 실행되기 전에 해당 바인딩에 접근하면 `ReferenceError` 가 발생하며, 판정 기준은
소스상 위치가 아니라 실행 시점이다.

- [ ] 외부 스코프에 같은 이름이 있어도 에러가 발생하는 이유를 설명할 수 있다
- [ ] "`let` 은 호이스팅되지 않는다"가 부정확한 이유를 안다
- [ ] 선언보다 앞에 작성된 코드가 정상 동작하는 경우를 예로 들 수 있다
- [ ] TDZ 구간에서 `typeof` 가 에러를 발생시키는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let" target="_blank">[1] let — Temporal dead zone (MDN Web Docs)</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Errors/Cant_access_lexical_declaration_before_init" target="_blank">[2] ReferenceError: can't access lexical declaration before initialization — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-let-and-const-declarations" target="_blank">[3] let and const Declarations — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [호이스팅과 선언 초기화 방식 →](/post/hoisting) (선행 개념)
- [스코프와 스코프 체인 →](/post/scope)
- [클로저와 렉시컬 환경 →](/post/closure)
