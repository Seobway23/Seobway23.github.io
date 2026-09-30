---
title: "호이스팅과 선언 초기화 방식"
coverImage: /post-thumbnails/hoisting.svg
slug: hoisting
category: frontend/javascript
concept: hoisting
tags: [javascript, 호이스팅, TDZ]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-07
excerpt: >
  선언보다 앞에서 변수를 읽을 때 var 는 undefined, let 은 ReferenceError, 함수 선언은 정상 호출되는 이유를 선언별 초기화 방식으로 정리한다.
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

## 문제 상황

아래 세 코드는 모두 선언보다 앞에서 식별자를 참조하지만 결과가 각각 다르다.

```js
console.log(a);   // undefined
var a = 1;

console.log(b);   // ReferenceError
let b = 1;

hello();          // "안녕"
function hello() { console.log("안녕"); }
```

`var` 는 값 없이 읽히고, `let` 은 에러가 나고, 함수 선언은 정상 호출된다.
이 차이는 선언 종류마다 초기화 시점이 다르기 때문에 생긴다.

---

## 동작 원리

자바스크립트 엔진은 함수나 블록을 실행하기 전에 생성 단계를 거친다. 이 단계에서
스코프 안의 선언을 모두 찾아 환경 레코드(Environment Record)에 식별자를 등록한다.
코드를 한 줄씩 실행하는 것은 그다음이다. 선언이 코드 맨 위로 옮겨진 것처럼 보이는
이 현상을 호이스팅(Hoisting)이라고 부른다.

::: important
생성 단계에서 등록되는 것은 선언이고, 할당은 실행 단계에서 해당 줄에 도달할 때 일어난다.
`var a = 1` 은 선언 `var a` 와 할당 `a = 1` 로 나뉘며, 생성 단계에서 처리되는 것은 선언뿐이다.
:::

선언 종류마다 등록할 때 넣는 초기값이 다르다.

::: grid
== `var`
등록과 동시에 `undefined` 로 초기화된다. 선언 전에 읽어도 에러 없이 `undefined` 가 나온다.

== `let` · `const`
식별자는 등록되지만 초기화되지 않은 상태로 남는다. 이 상태에서 접근하면 `ReferenceError` 가 발생한다.

== `function` 선언
함수 객체 전체가 생성되어 식별자에 바인딩된다. 선언보다 앞에서 호출할 수 있다.
:::

`let` · `const` 가 등록된 시점부터 선언문이 실행되기 전까지의 구간을
TDZ(Temporal Dead Zone)라고 한다. 세부 규칙은 [TDZ(Temporal Dead Zone)](/post/tdz)에서 다룬다.

```seq
title: 생성 단계와 실행 단계의 식별자 상태
speed: 1600
caption: 세 선언 모두 생성 단계에서 등록되지만 초기값이 다르다.

lane reg    생성 단계
lane var    var a
lane let    let b
lane fn     function hello
lane out    실행 결과 #log

step 스코프에 진입하면 선언을 먼저 수집해 환경 레코드에 등록한다.
  push reg 선언 수집
step var a 는 등록과 동시에 undefined 로 초기화된다.
  move reg var undefined
step let b 는 등록되지만 초기화되지 않는다. 이 시점부터 TDZ 이다.
  push let TDZ (초기화 전)
step 함수 선언은 함수 객체까지 생성되어 바인딩된다.
  push fn 함수 객체
step 실행 단계에서 a 를 읽으면 undefined 가 반환된다.
  log out console.log(a) → undefined
step b 는 초기화 전이므로 ReferenceError 가 발생한다.
  log out console.log(b) → ReferenceError
step hello 는 이미 함수 객체가 바인딩되어 있어 정상 호출된다.
  log out hello() → "안녕"
step let b = 1 이 실행되면 b 가 초기화되고 TDZ 가 끝난다.
  move let out b = 1 (접근 가능)
```

`var` 는 선언 전 접근이 `undefined` 로 조용히 통과하기 때문에, 잘못된 참조가 실행 후반에
다른 형태의 버그로 나타난다. `let` · `const` 의 TDZ 는 초기화 전 접근을 즉시 런타임 에러로
드러낸다.

---

## 예제

주석 처리된 줄을 하나씩 해제하면 각 경우의 에러를 확인할 수 있다.

```playground
#! js title=hoisting.js height=220
console.log("var  :", typeof a);   // undefined (에러 아님)
var a = 1;

hello();                            // 함수 객체가 이미 바인딩되어 있음
function hello() { console.log("fn   : 안녕"); }

// 아래 두 줄을 해제하면 TDZ 에서 ReferenceError
// console.log("let  :", b);
// let b = 1;

// 함수 표현식은 변수 선언 규칙을 따른다
// bye();
// var bye = function () { console.log("bye"); };
```

`var bye = function(){}` 은 함수 선언이 아니라 변수 선언이다. 생성 단계에서 `bye` 는
`undefined` 로 초기화되므로 `bye()` 는 `TypeError: bye is not a function` 이 된다.

---

## 자주 하는 실수

::: warning
호이스팅을 코드가 실제로 위로 이동하는 것으로 이해하는 경우

소스 코드는 이동하지 않는다. 생성 단계에서 식별자가 환경 레코드에 먼저 등록될 뿐이다.
이동 모델로 이해하면 `let` 도 호이스팅되는데 왜 에러가 나는지 설명할 수 없다.
`let` 은 등록은 되지만 초기화되지 않는다는 점이 차이다.
:::

::: tip
호이스팅에 의존하는 코드는 읽기 어렵다. 선언은 사용하는 위치보다 앞에 두고,
`var` 대신 `let` · `const` 를 쓰면 초기화 전 접근이 에러로 바로 드러난다.
:::

---

## 정리

실행 전에 생성 단계에서 선언이 등록되며, 등록 시 초기값이 `var` 는 `undefined`,
`let` · `const` 는 초기화 안 됨, 함수 선언은 함수 객체로 서로 다르다.
`let` · `const` 가 초기화되기 전까지의 구간이 TDZ 다.

- [ ] `var` 는 `undefined`, `let` 은 에러인 이유를 말할 수 있다
- [ ] 함수 선언과 함수 표현식의 차이를 안다
- [ ] TDZ 가 초기화 전 접근을 에러로 만드는 이유를 설명할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Hoisting" target="_blank">[1] Hoisting — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let" target="_blank">[2] let — Temporal dead zone (MDN Web Docs)</a></li>
<li><a href="https://tc39.es/ecma262/#sec-let-and-const-declarations" target="_blank">[3] let and const Declarations — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [스코프와 스코프 체인 →](/post/scope) (선행 개념)
- [클로저와 렉시컬 환경 →](/post/closure)
- [TDZ(Temporal Dead Zone) →](/post/tdz) (다음 글)
