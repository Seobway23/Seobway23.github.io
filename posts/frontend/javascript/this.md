---
title: "this 바인딩 규칙"
coverImage: /post-thumbnails/this.svg
slug: this
category: frontend/javascript
concept: this
tags: [javascript, this, bind, call, apply, 실행 컨텍스트]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-28
excerpt: >
  같은 함수에서 this 가 객체를 가리키기도 하고 undefined 가 되기도 하는 이유. this 는 함수 정의가 아니라 호출 방식에 따라 결정되며, 호출 방식은 네 가지로 구분된다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/this
    title: "this — MDN Web Docs"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    title: "Function.prototype.bind() — MDN Web Docs"
    checked: 2026-09-28
  - url: https://tc39.es/ecma262/#sec-ordinarycallbindthis
    title: "OrdinaryCallBindThis — ECMAScript 사양"
    checked: 2026-09-28
---

## 문제 상황

같은 함수를 호출 방식만 바꿔 실행하면 결과가 달라진다.

```js
const user = {
  name: "민수",
  hello() { return `안녕, ${this.name}`; },
};

user.hello();            // "안녕, 민수"

const fn = user.hello;   // 같은 함수의 참조를 변수에 할당
fn();                    // TypeError: Cannot read properties of undefined
```

`fn` 과 `user.hello` 는 동일한 함수 객체다(`fn === user.hello` 는 `true`).
달라진 것은 호출 방식이며, `this` 는 호출 방식에 따라 결정된다.

---

## 동작 원리

[실행 컨텍스트](/post/execution-context)는 환경 레코드, 외부 환경 참조, `this` 바인딩을 가진다.
이 중 외부 환경 참조는 함수가 정의된 위치(렉시컬 스코프)로 결정되지만, `this` 는 그렇지 않다.

::: important
스코프는 함수가 정의된 위치로 결정된다. **`this` 는 함수가 호출되는 방식으로 결정된다.**
함수가 호출될 때 새 실행 컨텍스트가 생성되고, 호출 형태에 따라 그 컨텍스트의 `this` 값이 바인딩된다.
:::

따라서 `this` 의 값은 함수 정의가 아니라 호출 지점의 코드를 보고 판단한다.
호출 방식은 다음 네 가지다.

::: tabs
== 1. 메서드 호출
`객체.메서드()` 형태로 호출하면 멤버 접근 연산자 앞의 객체가 `this` 가 된다.

```js
user.hello();          // this = user
a.b.c.hello();         // this = a.b.c  (바로 앞의 객체)
```

함수가 어느 객체 리터럴 안에서 정의되었는지는 영향을 주지 않는다. 호출 시점에 어떤 객체를
통해 접근했는지가 기준이다.

== 2. 일반 함수 호출
`함수()` 형태로 호출하면 기준 객체가 없으므로 `this` 는 `undefined` 다.

```js
const fn = user.hello;
fn();                  // this = undefined, this.name 에서 TypeError
```

이는 엄격 모드(strict mode)의 규칙이다. 모듈과 `class` 본문은 자동으로 엄격 모드로 실행된다.
비엄격 모드 스크립트에서는 `undefined` 대신 전역 객체(`window`)가 바인딩되므로, 에러 없이
`window.name` 을 읽게 되어 문제를 발견하기 어렵다.

== 3. 명시적 바인딩
`call` · `apply` · `bind` 로 `this` 값을 직접 지정한다.

```js
function hello() { return `안녕, ${this.name}`; }

hello.call({ name: "영희" });         // 즉시 호출하며 this 지정
hello.apply({ name: "영희" }, []);    // call 과 같고 인자를 배열로 전달
const bound = hello.bind({ name: "철수" });
bound();                              // 이후 호출에서도 this = 철수
```

`bind` 는 `this` 가 고정된 새 함수(bound function)를 반환한다. 이 함수는 메서드 형태로
호출해도 `this` 가 바뀌지 않는다.

== 4. 생성자 호출
`new 함수()` 형태로 호출하면 새로 생성된 객체가 `this` 가 된다.

```js
function User(name) {
  this.name = name;    // this = 새로 생성된 객체
}
const u = new User("민수");
u.name;                // "민수"
```

`class` 의 `constructor` 도 같은 방식이다. 새 객체를 생성해 `this` 에 바인딩하고, 실행이
끝나면 그 객체를 반환한다.
:::

여러 규칙이 겹치면 우선순위는 **`new` > `bind`·`call`·`apply` > 메서드 호출 > 일반 함수 호출** 이다.

```seq
title: 같은 함수의 세 가지 호출 방식
speed: 1700
caption: 함수는 동일하고, 호출 방식에 따라 실행 컨텍스트의 this 가 달라진다.

lane call  호출 코드
lane stack 콜 스택 #stack
lane out   this 값 #log

step user.hello() 는 user 를 통해 메서드로 호출한다.
  push call user.hello()
step 호출 시 실행 컨텍스트가 생성되고 this 에 user 가 바인딩된다.
  move call stack hello (this = user)
  log out user.hello() → this = user
step 함수 실행이 끝나면 실행 컨텍스트가 콜 스택에서 제거된다.
  pop stack
step fn() 은 같은 함수를 기준 객체 없이 호출한다.
  push call fn()
step 이 호출의 실행 컨텍스트에는 this 로 undefined 가 바인딩된다.
  move call stack hello (this = undefined)
  log out fn() → this = undefined
step 실행이 끝나 제거된다. 이어서 fn.call(user) 로 this 를 명시적으로 지정해 호출한다.
  pop stack
  push call fn.call(user)
step 같은 함수지만 이 호출의 this 는 user 다.
  move call stack hello (this = user)
  log out fn.call(user) → this = user
```

---

## 예제

`whoAmI` 는 자신의 `this` 를 반환하는 함수다. 호출 방식만 바꿔 실행한 결과를 비교할 수 있다.

```playground
#! js title=this.js height=320
function whoAmI() {
  "use strict";
  return this === undefined ? "undefined" : this.label;
}

const a = { label: "a", whoAmI };
const b = { label: "b", whoAmI };

console.log("a.whoAmI()          →", a.whoAmI());
console.log("b.whoAmI()          →", b.whoAmI());   // 같은 함수, 다른 this
console.log("whoAmI()            →", whoAmI());

const taken = a.whoAmI;                            // 참조만 변수에 할당
console.log("taken()             →", taken());     // 기준 객체 없이 호출

console.log("whoAmI.call(b)      →", whoAmI.call(b));

const fixed = whoAmI.bind(a);
b.fixed = fixed;
console.log("b.fixed() (bind a)  →", b.fixed());   // bind 가 메서드 호출보다 우선

// 화살표 함수는 자체 this 가 없고 외부 스코프의 this 를 사용한다
const c = {
  label: "c",
  later() {
    return [1].map(() => this.label)[0];
  },
};
console.log("화살표 안의 this    →", c.later());
```

`a.whoAmI()` 와 `b.whoAmI()` 는 같은 함수 객체를 호출한다. 어느 객체 리터럴에서 먼저
참조했는지는 `this` 에 영향을 주지 않는다.

---

## 자주 하는 실수

::: warning
**메서드를 콜백으로 전달할 때 this 바인딩 손실**

```js
class Timer {
  seconds = 0;
  tick() { this.seconds++; }
  start() {
    setInterval(this.tick, 1000);   // 함수 참조만 전달
  }
}
```

`setInterval` 에 전달되는 것은 함수 참조뿐이다. 타이머가 콜백을 실행할 때 `timer.tick()` 과 같은
메서드 호출 형태가 아니므로 `this` 는 `timer` 가 아니다. 브라우저 타이머는 콜백의 `this` 로
`window` 를 전달하므로, 에러 없이 `window.seconds` 가 `NaN` 이 된다.

해결 방법은 두 가지다.

```js
setInterval(() => this.tick(), 1000);   // 화살표 함수로 감싸 메서드 형태로 호출
setInterval(this.tick.bind(this), 1000); // this 를 바인딩한 함수를 전달
```

`addEventListener` 의 핸들러, `arr.map(obj.method)` 도 같은 원인으로 `this` 를 잃는다.
:::

::: caution
**객체 리터럴 안의 화살표 함수**

```js
const user = {
  name: "민수",
  hello: () => `안녕, ${this.name}`,   // this 는 user 가 아니다
};
```

화살표 함수는 자체 `this` 바인딩을 만들지 않고 정의된 위치의 외부 스코프 `this` 를 사용한다.
객체 리터럴은 스코프를 만들지 않으므로 외부 스코프는 파일 최상위다. 그곳의 `this` 는 모듈이면
`undefined`, 비엄격 스크립트면 `window` 다. 메서드는 `hello() { }` 형태로 정의한다.
:::

::: note
`this` 는 함수를 프로퍼티로 가진 객체를 뜻하지 않는다. 객체는 함수 객체의 참조를 프로퍼티로
보관할 뿐이고([참조 타입](/post/reference-type)), 같은 함수를 여러 객체가 참조할 수 있다.
따라서 `this` 는 어떤 객체가 함수를 보관하는지가 아니라 어떤 방식으로 호출되었는지로 결정된다.
:::

---

## 정리

`this` 는 함수 정의 시점이 아니라 호출 시점에 호출 방식에 따라 바인딩된다. 메서드 호출의 기준
객체, 일반 함수 호출의 `undefined`, `call`·`apply`·`bind` 로 지정한 값, `new` 로 생성된 객체
중 하나가 된다.

- [ ] `user.hello()` 는 동작하고 `const fn = user.hello; fn()` 은 실패하는 이유를 설명할 수 있다
- [ ] 스코프와 `this` 가 결정되는 기준의 차이를 설명할 수 있다
- [ ] 메서드를 콜백으로 전달할 때 `this` 를 유지하는 두 가지 방법을 안다
- [ ] 객체 리터럴의 메서드를 화살표 함수로 정의하면 안 되는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/this" target="_blank">[1] this — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/bind" target="_blank">[2] Function.prototype.bind() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-ordinarycallbindthis" target="_blank">[3] OrdinaryCallBindThis — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [실행 컨텍스트의 구성과 생성 과정 →](/post/execution-context) (선행 개념)
- [스코프와 스코프 체인 →](/post/scope)
- [프로토타입과 프로토타입 체인 →](/post/prototype)
