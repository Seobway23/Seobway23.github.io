---
title: "호이스팅 — 선언은 먼저 올라간다"
slug: hoisting
category: frontend/javascript
concept: hoisting
tags: [javascript, 호이스팅, TDZ]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-07
excerpt: >
  선언하기 전에 쓴 변수가 왜 어떤 때는 undefined 고 어떤 때는 에러인지, 그 차이를 만드는 규칙.
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/Hoisting
    title: "Hoisting — MDN Web Docs 용어 사전"
    checked: 2026-09-07
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let
    title: "let — Temporal dead zone (MDN Web Docs)"
    checked: 2026-09-07
  - url: https://tc39.es/ecma262/#sec-let-and-const-declarations
    title: "let and const Declarations — ECMAScript 사양"
    checked: 2026-09-07
---

## 왜 이게 필요한가

똑같이 "선언 전에 쓴" 코드인데 결과가 셋 다 다르다.

```js
console.log(a);   // undefined      — 에러가 아니다?
var a = 1;

console.log(b);   // ReferenceError — 이건 에러다
let b = 1;

hello();          // "안녕"          — 아예 잘 돈다?
function hello() { console.log("안녕"); }
```

셋을 구분하지 못하면 "왜 여기선 되고 저기선 안 되지"를 평생 겪는다.

---

## 어떻게 동작하는가

자바스크립트는 코드를 위에서부터 한 줄씩 실행하기 **전에**, 스코프를 한 번 훑어
그 안의 선언을 미리 등록한다. 이 등록 단계 때문에 "선언이 위로 끌어올려진 것처럼"
보이는 것이 호이스팅이다.

::: important
**끌어올려지는 것은 "선언"이지 "할당"이 아니다.** `var a = 1` 은
`var a`(선언)와 `a = 1`(할당) 두 개다. 올라가는 건 앞쪽뿐이다.
:::

핵심은 **선언마다 등록되는 초기값이 다르다**는 것이다.

::: grid
== `var`
등록되면서 곧바로 `undefined` 가 들어간다. 그래서 읽어도 에러가 아니다.

== `let` · `const`
등록은 되지만 **값이 없는 상태**로 남는다. 이 구간을 읽으면 에러다.

== `function` 선언
함수 몸통까지 통째로 등록된다. 그래서 위에서 바로 호출된다.
:::

`let` · `const` 가 등록은 됐지만 아직 쓸 수 없는 그 구간을
**TDZ(Temporal Dead Zone, 일시적 사각지대)** 라고 한다.

```seq
title: 스코프에 들어가서 코드가 끝날 때까지
speed: 1600
caption: 등록은 함께 일어나지만, 들어가는 값이 다르다.

lane reg    등록 단계
lane var    var a
lane let    let b
lane fn     function hello
lane out    실행 결과 #log

step 스코프에 들어가면 먼저 선언부터 훑어 등록한다.
  push reg 선언 수집
step var 는 등록되면서 undefined 가 들어간다.
  move reg var undefined
step let 은 등록되지만 값이 없다 — 여기부터 TDZ 다.
  push let TDZ (값 없음)
step 함수 선언은 몸통까지 통째로 등록된다.
  push fn 몸통 전체
step 이제 한 줄씩 실행한다. a 를 읽으면 undefined 가 나온다.
  log out console.log(a) → undefined
step b 를 읽으면 TDZ 라서 ReferenceError 다.
  log out console.log(b) → ReferenceError
step hello() 는 몸통이 이미 있으니 그냥 실행된다.
  log out hello() → "안녕"
step let b = 1 줄에 도달하는 순간 TDZ 가 끝난다.
  move let out b = 1 (이제 사용 가능)
```

TDZ 는 실수를 **빨리** 드러내려고 일부러 만든 장치다. `var` 였다면
`undefined` 가 조용히 흘러다니다 한참 뒤 엉뚱한 곳에서 터진다.

---

## 직접 확인

주석을 하나씩 풀어 가며 어디서 에러가 나는지 확인해라.

```playground
#! js title=hoisting.js height=220
console.log("var  :", typeof a);   // undefined — 에러가 아니다
var a = 1;

hello();                            // 몸통까지 올라가 있어 잘 돈다
function hello() { console.log("fn   : 안녕"); }

// 아래 두 줄의 주석을 풀면 TDZ 에 걸린다
// console.log("let  :", b);
// let b = 1;

// 함수 "표현식" 은 변수 규칙을 따른다 — 이것도 풀어 봐라
// bye();
// var bye = function () { console.log("bye"); };
```

마지막 것이 특히 헷갈린다. `var bye = function(){}` 은 **함수 선언이 아니라 변수 선언**이다.
등록될 때 `undefined` 가 들어가 있으므로 `bye()` 는 `TypeError: bye is not a function` 이다.

---

## 흔한 실수

::: warning
**호이스팅을 "코드가 실제로 위로 옮겨진다"로 이해하는 것**

옮겨지지 않는다. 실행 전에 **등록**될 뿐이다. 이 차이가 중요한 이유는
`let` 의 TDZ 를 설명할 수 있느냐로 갈린다. 옮겨진다고 믿으면
"`let` 도 올라갔는데 왜 에러지?"에서 막힌다.
:::

::: tip
호이스팅에 기대지 마라. **선언을 쓰는 자리 바로 위에 둔다.**
`let`·`const` 만 쓰면 TDZ 가 대신 잔소리를 해 준다.
:::

---

## 한 줄 정리

실행 전에 선언이 등록되고, **등록될 때 들어가는 값이 `var`·`let`·`function` 마다 다르다.**
`let`·`const` 는 값 없이 등록되며, 그 구간이 TDZ 다.

- [ ] `var` 는 `undefined`, `let` 은 에러인 이유를 말할 수 있다
- [ ] 함수 선언과 함수 표현식의 차이를 안다
- [ ] TDZ 가 왜 도움이 되는지 설명할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Hoisting" target="_blank">[1] Hoisting — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let" target="_blank">[2] let — Temporal dead zone (MDN Web Docs)</a></li>
<li><a href="https://tc39.es/ecma262/#sec-let-and-const-declarations" target="_blank">[3] let and const Declarations — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [스코프 — 변수가 어디까지 보이는가 →](/post/scope) — 이 글의 선행
- [클로저 — 함수가 붙잡고 있는 변수 →](/post/closure) — 스코프와 호이스팅이 만나는 곳
