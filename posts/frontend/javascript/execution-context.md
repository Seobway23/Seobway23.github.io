---
title: "실행 컨텍스트의 구성과 생성 과정"
coverImage: /post-thumbnails/execution-context.svg
slug: execution-context
category: frontend/javascript
concept: execution-context
tags: [javascript, 실행컨텍스트, 스코프체인]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-09
excerpt: >
  콜 스택에 push 되는 단위인 실행 컨텍스트의 구성 요소(환경 레코드, 외부 환경 참조, this 바인딩)와 생성 단계·실행 단계를 정리한다.
sources:
  - url: https://tc39.es/ecma262/#sec-execution-contexts
    title: "Executable Code and Execution Contexts — ECMAScript 사양"
    checked: 2026-09-09
  - url: https://tc39.es/ecma262/#sec-environment-records
    title: "Environment Records — ECMAScript 사양"
    checked: 2026-09-09
  - url: https://developer.mozilla.org/ko/docs/Glossary/Call_stack
    title: "Call stack — MDN Web Docs 용어 사전"
    checked: 2026-09-09
---

## 문제 상황

[콜 스택](/post/call-stack)에는 함수 객체가 아니라 함수 호출마다 생성되는
**실행 컨텍스트(Execution Context)** 가 push 된다.

같은 함수를 두 번 호출하면 실행 컨텍스트도 두 개 생성된다. 따라서 호출마다 지역 변수가 분리된다.

```js
function greet(name) {
  const message = `안녕, ${name}`;
  return message;
}

greet("A");   // message = "안녕, A"   (첫 번째 호출의 환경)
greet("B");   // message = "안녕, B"   (두 번째 호출의 환경)
```

---

## 구성 요소

실행 컨텍스트는 코드 실행에 필요한 상태를 담는 명세상의 구조이며, 주요 구성 요소는 다음과 같다.

| 구성 요소 | 역할 |
|---|---|
| 환경 레코드(Environment Record) | 해당 호출의 매개변수, 지역 변수, 함수 선언의 식별자 바인딩을 저장 |
| 외부 환경 참조(`[[OuterEnv]]`) | 현재 환경에 없는 식별자를 검색할 상위 환경. 이 연결이 [스코프 체인](/post/scope)이다 |
| this 바인딩 | 해당 호출에서 `this` 가 가리키는 값 |

외부 환경 참조는 함수를 호출한 위치가 아니라 **함수가 정의된 위치**의 환경을 가리킨다.
이것이 렉시컬 스코프이며, 식별자가 어느 선언에 연결되는지는 코드 구조만으로 결정된다.

```seq
title: 실행 컨텍스트 생성과 식별자 검색
speed: 1500
caption: 콜 스택의 각 항목이 하나의 실행 컨텍스트다.

lane global 전역 컨텍스트
lane outer  outer() 컨텍스트
lane inner  inner() 컨텍스트
lane out    결과 #log

step 스크립트 실행이 시작되면 전역 실행 컨텍스트가 생성된다.
  push global 전역 변수 · this
step outer() 를 호출하면 해당 호출의 실행 컨텍스트가 생성된다.
  push outer 지역변수 · outer→전역
step outer 안에서 inner() 를 호출한다. inner 의 실행 컨텍스트가 생성된다.
  push inner 지역변수 · outer→outer컨텍스트
step inner 에서 식별자를 검색한다. inner 의 환경 레코드에는 해당 바인딩이 없다.
  mark inner
step 외부 환경 참조를 따라 outer 의 환경 레코드를 검색하고, 바인딩을 찾는다.
  mark outer
  log out outer 의 지역변수를 사용
step inner 가 반환되면 해당 실행 컨텍스트는 콜 스택에서 제거된다.
  pop inner
```

---

## 생성 단계와 실행 단계

실행 컨텍스트는 생성 단계에서 선언을 먼저 처리한 뒤 실행 단계에서 코드를 순서대로 평가한다.

::: split
== 1. 생성 단계
스코프 안의 선언을 환경 레코드에 등록한다.
함수 호출이라면 [`this`](/post/this) 바인딩도 이때 결정된다.

- `var`: 바인딩 생성 후 `undefined` 로 초기화
- `let`·`const`: 바인딩만 생성, 초기화하지 않음 (TDZ)
- 함수 선언: 바인딩 생성 후 함수 객체로 초기화

== 2. 실행 단계
코드를 위에서부터 평가하며 바인딩에 값을 할당한다.

`let x = 1` 문이 평가된 뒤에야 `x` 에 접근할 수 있다.
그 전에 접근하면 `ReferenceError` 가 발생한다.
:::

[호이스팅](/post/hoisting)은 이 생성 단계의 결과다. 코드가 이동하는 것이 아니라,
실행 전에 선언이 환경 레코드에 먼저 등록된다.

---

## 예제

같은 함수를 두 번 호출했을 때 환경이 분리되는지, 외부 환경 참조가 정의 위치를 따르는지 확인한다.

```playground
#! js title=context.js height=240
const where = "전역";

function show() {
  console.log("show 가 보는 where:", where);
}

function run() {
  const where = "run 안";      // show 의 스코프 체인과 무관하다
  show();
  console.log("run 이 보는 where:", where);
}

run();

// 호출마다 별도의 환경 레코드가 생성된다
function counter() {
  let n = 0;
  return () => ++n;
}
const a = counter();
const b = counter();
console.log("a:", a(), a());   // 1 2
console.log("b:", b());        // 1  (a 와 다른 환경)
```

`show` 는 `run` 안에서 호출되지만 `run` 의 `where` 에 접근하지 않는다. `show` 의 외부 환경 참조가
정의 위치인 전역 환경을 가리키기 때문이다.

---

## 자주 하는 실수

::: warning
**외부 환경 참조를 호출 위치로 이해**

호출 위치를 따른다면 위 예제에서 `show` 는 `"run 안"` 을 출력해야 한다. 실제 출력은 `"전역"` 이다.
식별자 검색 경로는 코드를 작성한 위치로 결정되며 실행 중에 바뀌지 않는다.
:::

::: caution
**실행 컨텍스트 제거와 지역 변수 소멸을 동일시**

일반적으로 함수가 반환되면 환경 레코드도 회수 대상이 된다. 그러나 내부 함수가 그 환경 레코드를
참조하고 있으면, 실행 컨텍스트가 콜 스택에서 제거된 뒤에도 환경 레코드는 유지된다.
위 `counter` 예제가 이 경우이며, 이를 [클로저](/post/closure)라고 한다.
:::

---

## 정리

실행 컨텍스트는 함수 호출마다 생성되며 환경 레코드, 외부 환경 참조, this 바인딩을 포함한다.
콜 스택에 push 되는 단위가 이것이고, 외부 환경 참조는 호출 위치가 아니라 정의 위치를 가리킨다.

- [ ] 콜 스택에 push 되는 단위가 무엇인지 설명할 수 있다
- [ ] 생성 단계와 실행 단계에서 각각 일어나는 일을 안다
- [ ] 외부 환경 참조가 정의 위치를 따른다는 것을 예제로 보일 수 있다

## 참고

<ol>
<li><a href="https://tc39.es/ecma262/#sec-execution-contexts" target="_blank">[1] Executable Code and Execution Contexts — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-environment-records" target="_blank">[2] Environment Records — ECMAScript 사양</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Call_stack" target="_blank">[3] Call stack — MDN Web Docs 용어 사전</a></li>
</ol>

---

## 관련 글

- [스코프와 스코프 체인 →](/post/scope) (선행 개념)
- [콜 스택과 함수 호출 순서 →](/post/call-stack) (선행 개념)
- [this 바인딩 규칙 →](/post/this) (다음 글)
- [클로저와 렉시컬 환경 →](/post/closure) (실행 컨텍스트 제거 후에도 환경이 유지되는 경우)
