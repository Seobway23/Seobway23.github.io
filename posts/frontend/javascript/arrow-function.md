---
title: "화살표 함수의 this 와 일반 함수와의 차이"
coverImage: /post-thumbnails/arrow-function.svg
slug: arrow-function
category: frontend/javascript
concept: arrow-function
tags: [javascript, arrow-function, this, arguments, 화살표 함수]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-10-15
excerpt: >
  화살표 함수는 자체 this 바인딩을 만들지 않는다. 그래서 this 를 정의된 위치의 바깥 함수에서 찾고, call·bind 로도 바꿀 수 없으며, new 로 호출할 수 없다.
glossary:
  env-record: "식별자와 값을 묶어 두는 사양상의 저장소. 함수가 호출될 때마다 함수 환경 레코드가 새로 만들어지고, this 값도 여기에 저장된다."
  internal-slot: "사양이 객체 내부 상태를 설명할 때 쓰는 필드. [[ThisMode]] 처럼 이중 대괄호로 적으며 코드에서 직접 읽을 수 없다."
  construct: "new 로 호출할 수 있는 함수만 갖는 내부 메서드. 화살표 함수와 메서드 축약형에는 없다."
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/Arrow_functions
    title: "화살표 함수 표현식 — MDN Web Docs"
    checked: 2026-10-15
  - url: https://tc39.es/ecma262/#sec-ordinaryfunctioncreate
    title: "OrdinaryFunctionCreate — ECMAScript 사양"
    checked: 2026-10-15
  - url: https://tc39.es/ecma262/#sec-getthisenvironment
    title: "GetThisEnvironment — ECMAScript 사양"
    checked: 2026-10-15
---

::: abstract
**화살표 함수**는 호출될 때 자기 `this` 바인딩을 만들지 않는 함수다. 그래서 `this` 를 정의된 위치의 바깥 함수에서 찾고, `call`·`apply`·`bind` 로 바꿀 수 없으며, `arguments` 와 `prototype` 이 없고 `new` 로 호출할 수 없다.
:::

## 1. 문제 상황

[this 바인딩 규칙](/post/this)에서 본 것처럼 일반 함수의 `this` 는 호출 방식으로 정해진다. 콜백으로 넘긴 일반 함수는 메서드 형태로 호출되지 않으므로 바깥 메서드의 `this` 를 쓸 수 없다.

```js
const counter = {
  count: 0,
  addAll(items) {
    items.forEach(function () {
      this.count++;          // this 는 counter 가 아니다
    });
    return this.count;
  },
};

counter.addAll([1, 2, 3]);   // 0
```

콜백을 화살표 함수로 바꾸면 결과가 3이 된다.

```js
items.forEach(() => {
  this.count++;              // addAll 의 this, 즉 counter
});
```

두 콜백은 문법만 다른 것이 아니라, 호출될 때 `this` 를 다루는 방식이 다르다.

---

## 2. 정의

### 2.1 정의

화살표 함수는 `(매개변수) => 본문` 형태의 함수 표현식이다. 일반 함수와 같은 함수 객체지만, 호출될 때 [[env-record|환경 레코드]]에 `this` 를 바인딩하지 않는다. 함수 안에서 `this` 를 읽으면 [스코프 체인](/post/scope)을 따라 바깥으로 올라가 `this` 를 가진 첫 환경에서 값을 읽는다.

일반 함수와의 차이는 다음과 같다.

| 항목 | 일반 함수 (`function`) | 화살표 함수 |
| --- | --- | --- |
| `this` | 호출 방식으로 결정 | 정의된 위치의 바깥 `this` |
| `call`·`apply`·`bind` 의 첫 인자 | `this` 가 된다 | 무시된다 |
| `arguments` | 있음 | 없음 (바깥 함수의 것을 읽는다) |
| `prototype` 프로퍼티 | 있음 | 없음 |
| `new` 호출 | 가능 | `TypeError: … is not a constructor` |

### 2.2 사양에서의 위치

ECMAScript 사양은 함수 객체를 만들 때 [[internal-slot|내부 슬롯]] `[[ThisMode]]` 를 정한다<a href="https://tc39.es/ecma262/#sec-ordinaryfunctioncreate" target="_blank"><sup>[2]</sup></a>. 화살표 함수는 `lexical`, 엄격 모드의 일반 함수는 `strict`, 그 외는 `global` 이다.

- 호출 시 함수 환경 레코드를 만들 때 `[[ThisMode]]` 가 `lexical` 이면 그 환경은 `this` 바인딩을 갖지 않는다.
- `this` 를 평가하는 `GetThisEnvironment` 는 현재 환경부터 바깥으로 올라가며 `this` 바인딩을 가진 첫 환경을 찾는다<a href="https://tc39.es/ecma262/#sec-getthisenvironment" target="_blank"><sup>[3]</sup></a>. 화살표 함수의 환경은 건너뛰어진다.
- `OrdinaryCallBindThis` 는 `[[ThisMode]]` 가 `lexical` 이면 아무것도 바인딩하지 않고 끝난다. `call` 의 첫 인자가 쓰일 곳이 없다.
- 화살표 함수를 만드는 과정에서는 `MakeConstructor` 를 호출하지 않는다. 그래서 [[construct|[[Construct]]]] 와 `prototype` 이 없다.

---

## 3. 동작 원리

### 3.1 this 를 찾는 경로

1장의 화살표 콜백이 `this.count` 를 읽는 과정이다. `forEach` 가 콜백을 세 번 호출하지만, 콜백 환경에는 `this` 가 없으므로 매번 `addAll` 의 환경에서 `this` 를 읽는다.

![화살표 함수의 this 탐색 경로](/post-assets/frontend/javascript/arrow-this-lookup.svg "일반 함수 콜백은 호출될 때 자기 환경에 this 를 만든다(forEach 가 thisArg 없이 호출하면 undefined). 화살표 콜백의 환경에는 this 가 없어 바깥 addAll 환경의 this 를 읽는다.")

```seq
title: counter.addAll([1, 2, 3]) 에서 화살표 콜백의 this
speed: 1700
caption: 화살표 함수의 환경은 this 바인딩이 없어서, this 를 읽을 때 바깥 함수 환경까지 올라간다.

lane stack 콜 스택 #stack
lane env   환경 레코드
lane out   this.count #log

step counter.addAll(...) 을 메서드로 호출한다. addAll 의 환경에 this = counter 가 바인딩된다.
  push stack addAll
  push env addAll 환경 · this = counter
step forEach 가 첫 번째 요소로 화살표 콜백을 호출한다. 콜백 환경에는 this 바인딩이 만들어지지 않는다.
  push stack forEach
  push stack 화살표 콜백 (1)
  push env 콜백 환경 · this 없음
step this.count 를 평가한다. 콜백 환경에 this 가 없어 바깥 addAll 환경의 this(counter)를 읽는다.
  mark env
  log out count = 1
step 콜백이 끝나면 환경과 실행 컨텍스트가 함께 제거된다. 두 번째, 세 번째 호출도 같은 경로로 this 를 읽는다.
  pop stack
  pop env
  log out count = 2
  log out count = 3
step forEach 와 addAll 이 끝나고 3 이 반환된다.
  pop stack
  pop stack
  pop env
```

### 3.2 call·bind 로 바꿀 수 없는 이유

`call` 은 함수의 `[[Call]]` 을 실행하면서 첫 인자를 `this` 후보로 넘긴다. 화살표 함수는 `OrdinaryCallBindThis` 단계에서 바인딩을 하지 않으므로 그 값이 버려진다. `bind` 로 만든 함수도 결국 같은 경로로 호출하므로 결과가 같다.

```js
function outer() {
  const f = () => this.label;
  return f.call({ label: "call 인자" });
}

outer.call({ label: "outer 의 this" });   // "outer 의 this"
```

`arguments` 도 같은 방식이다. 사양은 `[[ThisMode]]` 가 `lexical` 인 함수에 `arguments` 객체를 만들지 않는다. 화살표 함수 안의 `arguments` 는 바깥 일반 함수의 `arguments` 를 가리킨다. 화살표 함수에서 인자 전체가 필요하면 나머지 매개변수 `(...args) =>` 를 쓴다.

---

## 4. 예제

### 4.1 기본

같은 객체에서 일반 함수 콜백, 화살표 콜백, `call` 로 `this` 를 바꾼 화살표 함수를 비교한다. 실행 전에 각 줄의 출력을 예측해 본다.

```playground
#! js title=arrow.js height=300
"use strict";

const counter = {
  count: 0,
  withFunction(items) {
    items.forEach(function () {
      // 이 함수의 this 는 forEach 가 넘긴 thisArg(없으면 undefined)
      if (this) this.count++;
    });
    return this.count;
  },
  withArrow(items) {
    items.forEach(() => { this.count++; });   // withArrow 의 this
    return this.count;
  },
};

console.log("일반 함수 콜백 →", counter.withFunction([1, 2, 3]));
console.log("화살표 콜백    →", counter.withArrow([1, 2, 3]));

function outer() {
  const f = () => this.label;
  return f.call({ label: "call 인자" });
}
console.log("arrow.call(…)  →", outer.call({ label: "outer 의 this" }));

const arrow = () => {};
console.log("prototype 있음? →", "prototype" in arrow);
try {
  new arrow();
} catch (e) {
  console.log("new arrow()    →", e.constructor.name, e.message);
}
```

결과는 `0`, `3`, `"outer 의 this"`, `false`, `TypeError` 순서다. Node 22 에서 실행하면 같은 값이 나온다.

### 4.2 실무 패턴

클래스 필드에 화살표 함수를 대입하면, 메서드를 떼어 내 콜백으로 넘겨도 `this` 가 유지된다. React 클래스 컴포넌트의 이벤트 핸들러가 이 형태를 썼다.

```js
class Timer {
  seconds = 0;
  tick = () => { this.seconds++; };   // 인스턴스마다 새 함수, this 는 인스턴스
  start() {
    setInterval(this.tick, 1000);     // 떼어 내도 this 가 유지된다
  }
}
```

클래스 필드 초기화 코드는 생성자 안에서 실행되므로, 화살표 함수의 바깥 `this` 는 만들어지는 인스턴스다. 대신 이 함수는 `prototype` 에 한 번 정의되는 메서드와 달리 인스턴스마다 하나씩 만들어진다(`new Timer().tick === new Timer().tick` 은 `false`).

---

## 5. 자주 하는 실수

::: warning
**객체 메서드를 화살표 함수로 정의한다**

```js
const user = {
  name: "민수",
  hello: () => `안녕, ${this.name}`,
};
```

객체 리터럴은 스코프를 만들지 않으므로 화살표 함수의 바깥은 파일 최상위다. 모듈 최상위의 `this` 는 `undefined` 라서 `this.name` 에서 `TypeError` 가 난다. 메서드는 `hello() { … }` 로 정의한다. 같은 이유로 `prototype` 에 화살표 함수를 넣어도 인스턴스를 `this` 로 받지 못한다.
:::

::: caution
**객체를 반환하려고 중괄호를 바로 쓴다**

```js
const make = () => { a: 1 };     // undefined
const make2 = () => ({ a: 1 });  // { a: 1 }
```

화살표 뒤의 `{` 는 함수 본문 블록으로 해석된다. 첫 번째 코드에서 `a:` 는 레이블, `1` 은 식 문장이고 `return` 이 없으므로 `undefined` 를 반환한다. 객체 리터럴은 괄호로 감싼다.
:::

::: caution
**DOM 이벤트 핸들러에서 this 로 요소를 읽는다**

`addEventListener` 는 일반 함수 핸들러를 호출할 때 `this` 를 이벤트가 걸린 요소로 지정한다. 화살표 함수는 이 값을 받지 못하므로, 화살표 핸들러에서는 `event.currentTarget` 을 쓴다.
:::

---

## 6. 정리

화살표 함수는 `[[ThisMode]]` 가 `lexical` 인 함수다. 호출될 때 `this` 와 `arguments` 를 만들지 않으므로 둘 다 바깥 함수에서 읽고, `call`·`bind` 의 첫 인자는 무시된다. `[[Construct]]` 가 없어 `new` 로 호출할 수 없다.

- [ ] 1장 코드에서 일반 함수 콜백이 `0` 을 반환하는 이유를 설명할 수 있다
- [ ] 화살표 함수의 `this` 가 어느 환경에서 읽히는지 말할 수 있다
- [ ] `call` 로 화살표 함수의 `this` 를 바꿀 수 없는 이유를 안다
- [ ] 객체 메서드와 DOM 핸들러에 화살표 함수를 쓰면 안 되는 경우를 안다
- [ ] 화살표 함수에서 객체 리터럴을 반환하는 문법을 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/Arrow_functions" target="_blank">[1] 화살표 함수 표현식 — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-ordinaryfunctioncreate" target="_blank">[2] OrdinaryFunctionCreate — ECMAScript 사양</a></li>
<li><a href="https://tc39.es/ecma262/#sec-getthisenvironment" target="_blank">[3] GetThisEnvironment — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [this 바인딩 규칙 →](/post/this) (선행 개념)
- [실행 컨텍스트의 구성과 생성 과정 →](/post/execution-context)
- [고차 함수와 콜백 →](/post/higher-order-function) (화살표 함수를 콜백으로 넘기는 함수)
