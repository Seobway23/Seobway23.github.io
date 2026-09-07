---
title: "스코프 — 변수가 어디까지 보이는가"
slug: scope
category: study/frontend/js
concept: scope
tags: [javascript, 스코프, 변수]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-07
excerpt: >
  같은 이름의 변수가 왜 어떤 곳에서는 보이고 어떤 곳에서는 안 보이는지, 그 경계를 정하는 규칙.
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

## 왜 이게 필요한가

아래 코드는 마지막 줄에서 터진다. 왜 그런지 설명할 수 있어야 나머지 전부가 풀린다.

```js
function outer() {
  const secret = "숨김";
  console.log(secret); // "숨김"
}

outer();
console.log(secret); // ReferenceError: secret is not defined
```

`secret` 은 분명 만들어졌는데 밖에서는 없는 취급이다. **변수는 아무 데서나 보이지 않는다.**
어디까지 보이는지를 정하는 경계가 스코프다.

---

## 어떻게 동작하는가

스코프는 **이름을 찾는 범위**다. 자바스크립트는 변수를 만나면 안쪽부터 바깥쪽으로
차례차례 뒤진다. 찾으면 멈추고, 끝까지 못 찾으면 `ReferenceError`.

경계는 세 종류다.

::: tabs
== 전역 스코프
어디에서도 보인다. 파일 맨 바깥에 선언한 것.

```js
const app = "blog";     // 어디서든 보인다
```

전역은 **누구나 덮어쓸 수 있다**는 뜻이기도 하다. 그래서 적을수록 좋다.

== 함수 스코프
`function` 몸통 안. `var` 는 오직 이 경계만 인정한다.

```js
function f() {
  var x = 1;
  if (true) {
    var x = 2;          // 같은 x 다. 블록을 무시한다
  }
  console.log(x);       // 2
}
```

== 블록 스코프
`{ }` 안. `let` · `const` 는 이 경계를 지킨다.

```js
function f() {
  let x = 1;
  if (true) {
    let x = 2;          // 다른 x 다
  }
  console.log(x);       // 1
}
```

`var` 대신 `let` · `const` 를 쓰는 가장 큰 이유가 이것이다.
:::

찾는 순서를 그림으로 보면 이렇다. 안쪽 상자에서 시작해 바깥으로 나간다.

```seq
title: 이름을 찾아 바깥으로 나간다
speed: 1500
caption: 안쪽 스코프에서 못 찾으면 한 칸 바깥으로. 전역에서도 없으면 ReferenceError.

lane block  블록 { }
lane func   함수 몸통
lane global 전역
lane result 결과 #log

step 블록 안에서 `msg` 를 찾는다. 여기에는 없다.
  push block msg 찾는 중
step 한 칸 바깥, 함수 몸통에서 다시 찾는다. 여기 있다.
  move block func msg 발견!
  log result msg 를 함수 스코프에서 찾음
step 만약 함수에도 없었다면 전역까지 올라간다.
  push global msg 찾는 중
step 전역에도 없으면 그때 ReferenceError 가 난다.
  move global result ReferenceError
```

이 사슬을 **스코프 체인**이라고 부른다. 그리고 중요한 것 하나 — 이 사슬은
**함수를 어디서 호출했느냐가 아니라 어디에 썼느냐**로 정해진다.

```js
const name = "전역";

function print() {
  console.log(name);   // 항상 "전역"
}

function run() {
  const name = "안쪽";
  print();             // "안쪽" 이 아니라 "전역" 이 찍힌다
}

run();
```

`print` 는 자기가 **쓰여 있는 자리**의 바깥을 본다. `run` 이 부른 것과 무관하다.
이 규칙을 렉시컬 스코프라고 한다. 코드를 읽는 것만으로 어떤 변수가 쓰일지 확정할 수 있다는 뜻이라,
디버깅이 훨씬 쉬워진다.

---

## 직접 확인

출력 순서를 먼저 예측하고 실행해라. 값을 바꿔 가며 다시 돌려도 된다 (`Ctrl+Enter`).

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

// var 로 바꿔 보면 2번이 어떻게 달라지는지 확인해라
```

---

## 흔한 실수

::: warning
**반복문 안의 `var`**

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// 3, 3, 3
```

`var` 는 블록을 인정하지 않아 `i` 가 **하나뿐**이다. 타이머가 실행될 때는 이미 3이 되어 있다.
`let` 으로 바꾸면 반복마다 새 `i` 가 생겨 `0, 1, 2` 가 나온다.
:::

::: tip
스코프는 **좁을수록 좋다.** 변수를 쓰는 곳에서 가장 가까운 블록에 선언해라.
넓은 스코프는 "누가 언제 바꿨는지 모르는 값"을 만든다.
:::

---

## 한 줄 정리

스코프는 **이름을 찾는 범위**이고, 안쪽에서 바깥쪽으로 한 방향으로만 찾는다.
그 사슬은 코드가 쓰인 자리로 정해진다.

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

- [호이스팅 — 선언은 먼저 올라간다 →](/post/hoisting) — 스코프 안에서 선언이 처리되는 순서
