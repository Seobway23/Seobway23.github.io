---
title: "스코프와 스코프 체인"
coverImage: /post-thumbnails/scope.svg
slug: scope
category: frontend/javascript
concept: scope
tags: [javascript, 스코프, 변수]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-07
excerpt: >
  식별자에 접근할 수 있는 범위를 정하는 규칙. 전역·함수·블록 스코프의 경계와, 식별자를 안쪽에서 바깥쪽으로 탐색하는 스코프 체인을 정리한다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/Scope
    title: "Scope — MDN Web Docs 용어 사전"
    checked: 2026-09-07
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let
    title: "let — MDN Web Docs"
    checked: 2026-09-07
  - url: https://tc39.es/ecma262/#sec-execution-contexts
    title: "Executable Code and Execution Contexts — ECMAScript 사양"
    checked: 2026-09-07
---

## 문제 상황

아래 코드는 마지막 줄에서 `ReferenceError` 가 발생한다.

```js
function outer() {
  const secret = "숨김";
  console.log(secret); // "숨김"
}

outer();
console.log(secret); // ReferenceError: secret is not defined
```

`secret` 은 `outer` 의 함수 스코프에 선언되었기 때문에 함수 바깥에서는 접근할 수 없다.
식별자에 접근할 수 있는 코드의 범위를 **스코프(scope)** 라고 한다.

---

## 동작 원리

엔진은 식별자를 만나면 현재 스코프부터 탐색하고, 없으면 바깥 스코프로 한 단계씩 이동하며 찾는다.
찾으면 탐색을 멈추고, 전역 스코프까지 없으면 `ReferenceError` 를 던진다.

스코프의 경계는 세 가지다.

::: tabs
== 전역 스코프
파일 최상위에 선언한 식별자. 모든 코드에서 접근할 수 있다.

```js
const app = "blog";     // 어디서든 접근 가능
```

어느 코드에서든 읽고 쓸 수 있으므로 이름 충돌과 의도치 않은 수정이 생기기 쉽다.
전역 선언은 최소한으로 둔다.

== 함수 스코프
`function` 본문. `var` 는 함수 스코프만 경계로 인정한다.

```js
function f() {
  var x = 1;
  if (true) {
    var x = 2;          // 같은 x (블록을 경계로 보지 않는다)
  }
  console.log(x);       // 2
}
```

== 블록 스코프
`{ }` 로 감싼 블록. `let` · `const` · `class` 는 블록을 경계로 인정한다.

```js
function f() {
  let x = 1;
  if (true) {
    let x = 2;          // 다른 x
  }
  console.log(x);       // 1
}
```

`var` 대신 `let` · `const` 를 쓰는 주된 이유다.
:::

아래는 블록 안에서 참조한 식별자를 바깥 스코프로 이동하며 찾는 과정이다.

```seq
title: 스코프 체인을 따라 식별자를 탐색하는 과정
speed: 1500
caption: 현재 스코프에 없으면 바깥 스코프로 이동한다. 전역에도 없으면 ReferenceError.

lane block  블록 스코프
lane func   함수 스코프
lane global 전역 스코프
lane result 결과 #log

step 블록 스코프에서 msg 를 찾는다. 선언이 없다.
  push block msg 탐색
step 바깥의 함수 스코프로 이동한다. 여기에 선언이 있다.
  move block func msg 발견
  log result msg 를 함수 스코프에서 찾음
step 함수 스코프에도 없었다면 전역 스코프까지 이동한다.
  push global msg 탐색
step 전역 스코프에도 없으면 ReferenceError 가 발생한다.
  move global result ReferenceError
```

이 연결 구조를 **스코프 체인(scope chain)** 이라고 한다. 스코프 체인은 함수를 호출한 위치가 아니라
함수를 정의한 위치로 결정된다.

```js
const name = "전역";

function print() {
  console.log(name);   // 항상 "전역"
}

function run() {
  const name = "안쪽";
  print();             // "전역" 출력
}

run();
```

`print` 의 바깥 스코프는 `print` 가 정의된 전역 스코프다. `run` 안에서 호출해도 `run` 의 `name` 은
탐색 대상이 아니다. 이 규칙을 **렉시컬 스코프(lexical scope)** 라고 하며, 소스 코드만 보고
어떤 식별자가 참조될지 결정할 수 있다.

---

## 예제

블록·함수·전역 스코프에 같은 이름을 선언했을 때 각 위치에서 어떤 값이 참조되는지 확인한다.
값을 바꿔 다시 실행할 수 있다(`Ctrl+Enter`).

```playground
#! js title=scope.js height=200
const where = "전역";

function outer() {
  const where = "함수";

  if (true) {
    const where = "블록";
    console.log("1:", where);
  }

  console.log("2:", where);
}

outer();
console.log("3:", where);

// 블록 안의 const 를 var 로 바꾸면 2번 결과가 달라진다
```

---

## 자주 하는 실수

::: warning
**반복문에서 `var` 사용**

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3, 3, 3
```

`var` 는 블록 스코프를 만들지 않으므로 `i` 는 함수(또는 전역) 스코프에 하나만 존재한다.
타이머 콜백이 실행될 때 `i` 는 이미 3이다. `let` 을 쓰면 반복마다 새 바인딩이 생성되어
`0, 1, 2` 가 출력된다.
:::

::: tip
변수는 사용하는 위치에서 가장 가까운 블록에 선언한다. 스코프가 넓을수록 값을 수정할 수 있는
코드가 많아져 변경 지점을 추적하기 어렵다.
:::

---

## 정리

스코프는 식별자에 접근할 수 있는 범위이고, 엔진은 안쪽 스코프에서 바깥쪽 스코프 방향으로만
식별자를 탐색한다. 스코프 체인은 코드가 정의된 위치로 결정된다.

- [ ] `var` 와 `let` 의 경계 차이를 말할 수 있다
- [ ] 위 반복문이 `3, 3, 3` 인 이유를 설명할 수 있다
- [ ] 함수를 어디서 호출하든 결과가 같은 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Scope" target="_blank">[1] Scope — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/let" target="_blank">[2] let — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-execution-contexts" target="_blank">[3] Executable Code and Execution Contexts — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [호이스팅과 선언 초기화 방식 →](/post/hoisting) (스코프 안에서 선언이 처리되는 순서)
