---
title: "this — 어디서 만들었나가 아니라 어떻게 불렀나"
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
  같은 함수인데 어떤 때는 객체를, 어떤 때는 undefined 를 가리키는 this. 함수를 부르는 모양 네 가지만 보면 값이 정해진다.
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

## 같은 함수인데 this 가 바뀐다

함수는 하나다. 부르는 모양만 바꿨다. 그런데 결과가 다르다.

```js
const user = {
  name: "민수",
  hello() { return `안녕, ${this.name}`; },
};

user.hello();            // "안녕, 민수"

const fn = user.hello;   // 같은 함수를 변수에 옮겨 담았을 뿐
fn();                    // TypeError: Cannot read properties of undefined
```

`fn` 과 `user.hello` 는 **완전히 같은 함수**다(`fn === user.hello` 는 `true`).
달라진 건 부른 모양뿐이다. `this` 는 그 모양을 보고 정해진다.

---

## 어떻게 동작하는가

[실행 컨텍스트](/post/execution-context)에서 컨텍스트가 담는 것 세 가지를 봤다.
환경 레코드, 바깥 환경 참조, 그리고 **this**. 셋 중 둘은 **코드를 쓴 위치**로 정해지는데,
`this` 만 다르다.

::: important
**스코프(바깥 환경)는 "어디서 만들었나"로 정해진다.**
**`this` 는 "어떻게 불렀나"로 정해진다.** 함수를 호출하는 **그 순간**, 호출 모양을 보고
그 호출의 컨텍스트에 `this` 값을 넣는다.
:::

그러니 `this` 를 알고 싶으면 함수 정의를 볼 게 아니라 **호출하는 줄**을 봐야 한다.
호출 모양은 네 가지뿐이다.

::: tabs
== 1. 점 찍고 부르기
`객체.메서드()` — **점 앞의 객체**가 `this` 다.

```js
user.hello();          // this = user
a.b.c.hello();         // this = a.b.c  (바로 앞 하나만 본다)
```

함수가 어느 객체 **안에 적혀 있는지**는 상관없다. 호출할 때 점 앞에 뭐가 있느냐만 본다.

== 2. 그냥 부르기
`함수()` — 점 앞에 아무것도 없다. `this` 는 **`undefined`** 다.

```js
const fn = user.hello;
fn();                  // this = undefined  → this.name 에서 TypeError
```

엄격 모드(모듈·`class` 안은 자동으로 엄격 모드)의 규칙이다. 옛날식 비엄격 스크립트에서는
`undefined` 대신 전역 객체(`window`)가 들어가는데, 이게 더 위험하다 — 에러 없이
`window.name` 을 읽고 지나간다.

== 3. 직접 지정하기
`call` · `apply` · `bind` — 원하는 값을 `this` 로 **못박는다.**

```js
function hello() { return `안녕, ${this.name}`; }

hello.call({ name: "영희" });         // 지금 바로 부르면서 this 지정
hello.apply({ name: "영희" }, []);    // call 과 같고 인자만 배열로
const bound = hello.bind({ name: "철수" });
bound();                              // 나중에 몇 번을 불러도 this = 철수
```

`bind` 는 **this 가 고정된 새 함수**를 돌려준다. 한 번 묶으면 점을 찍어 불러도 안 바뀐다.

== 4. new 로 부르기
`new 함수()` — 방금 **새로 만든 빈 객체**가 `this` 다.

```js
function User(name) {
  this.name = name;    // this = 새 객체
}
const u = new User("민수");
u.name;                // "민수"
```

`class` 의 `constructor` 도 같다. 새 객체를 만들고, 그걸 `this` 로 넣고, 끝나면 돌려준다.
:::

여러 개가 겹치면 **`new` > `bind`·`call`·`apply` > 점 찍고 부르기 > 그냥 부르기** 순으로 이긴다.

```seq
title: 같은 함수를 세 가지 모양으로 부른다
speed: 1700
caption: 함수는 그대로다. 부르는 줄이 바뀌면 this 가 바뀐다.

lane call  호출하는 줄
lane stack 콜 스택 #stack
lane out   this 값 #log

step user.hello() — 점 앞에 user 가 있다.
  push call user.hello()
step 호출하는 순간 컨텍스트가 만들어지고 this 에 user 가 들어간다.
  move call stack hello (this = user)
  log out user.hello() → this = user
step 함수가 끝나면 컨텍스트가 빠진다. this 도 같이 사라진다.
  pop stack
step fn() — 같은 함수지만 점 앞이 비어 있다.
  push call fn()
step 이번 호출의 컨텍스트에는 this 로 undefined 가 들어간다.
  move call stack hello (this = undefined)
  log out fn() → this = undefined
step 끝나서 빠지고, fn.call(user) — 이번엔 호출하면서 this 를 직접 넣는다.
  pop stack
  push call fn.call(user)
step 같은 함수인데 이번 컨텍스트의 this 는 user 다.
  move call stack hello (this = user)
  log out fn.call(user) → this = user
```

---

## 직접 확인

`whoAmI` 는 자기 `this` 가 누군지 말하는 함수다. 호출 모양만 바꿔 가며 불러 본다.

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

const taken = a.whoAmI;                            // 꺼내 담으면
console.log("taken()             →", taken());     // a 를 잃는다

console.log("whoAmI.call(b)      →", whoAmI.call(b));

const fixed = whoAmI.bind(a);
b.fixed = fixed;
console.log("b.fixed() (bind a)  →", b.fixed());   // bind 가 점보다 이긴다

// 화살표 함수는 자기 this 가 없다 — 바깥 this 를 그대로 쓴다
const c = {
  label: "c",
  later() {
    return [1].map(() => this.label)[0];
  },
};
console.log("화살표 안의 this    →", c.later());
```

`a.whoAmI()` 와 `b.whoAmI()` 는 **같은 함수**를 부른다. 함수가 `a` 안에 먼저 적혔다는
사실은 아무 의미가 없다.

---

## 흔한 실수

::: warning
**메서드를 콜백으로 넘기면 `this` 가 사라진다**

```js
class Timer {
  seconds = 0;
  tick() { this.seconds++; }
  start() {
    setInterval(this.tick, 1000);   // tick 만 떼어서 넘겼다
  }
}
```

`setInterval` 에 넘어가는 건 **함수 하나**다. 나중에 타이머가 그 함수를 부를 때
`timer.tick()` 처럼 점을 찍어 주지 않는다. 맨 위 `fn()` 과 같은 상황이다.
(브라우저 타이머는 `this` 자리에 `window` 를 넣어 부르므로, 에러도 없이
`window.seconds` 가 `NaN` 이 된다. 조용히 틀리는 쪽이라 더 찾기 어렵다.)

고치는 방법은 둘이다.

```js
setInterval(() => this.tick(), 1000);   // 화살표로 감싸 점 찍고 부른다
setInterval(this.tick.bind(this), 1000); // this 를 묶어서 넘긴다
```

이벤트 핸들러(`addEventListener`)·`arr.map(obj.method)` 도 전부 같은 이유다.
:::

::: caution
**객체 리터럴 안의 화살표 함수**

```js
const user = {
  name: "민수",
  hello: () => `안녕, ${this.name}`,   // this 는 user 가 아니다
};
```

화살표 함수는 **자기 `this` 를 만들지 않고** 만들어진 곳 바깥의 `this` 를 그대로 쓴다.
객체 리터럴 `{ }` 는 스코프가 아니므로 바깥은 파일 최상위다. 거기서 `this` 는
모듈이면 `undefined`, 옛 스크립트면 `window` 다. 어느 쪽이든 `user` 는 아니다.
메서드는 `hello() { }` 로 쓴다.
:::

::: note
**`this` 는 "그 함수가 들어 있는 객체"가 아니다.** 함수는 어느 객체에도 속하지 않는다.
객체는 함수의 주소를 들고 있을 뿐이고([참조 타입](/post/reference-type)), 같은 함수를
여러 객체가 들고 있을 수 있다. 그래서 "누가 들고 있나"가 아니라 "누가 불렀나"를 본다.
:::

---

## 한 줄 정리

`this` 는 함수를 **정의할 때가 아니라 호출할 때**, 호출하는 모양을 보고 정해진다.
점 앞의 객체 · `undefined` · `call`/`bind` 로 넣은 값 · `new` 가 만든 새 객체 — 네 가지 중 하나다.

- [ ] `user.hello()` 는 되고 `const fn = user.hello; fn()` 은 안 되는 이유를 설명할 수 있다
- [ ] 스코프와 `this` 가 정해지는 기준이 어떻게 다른지 말할 수 있다
- [ ] 메서드를 콜백으로 넘길 때 `this` 를 지키는 방법 두 가지를 안다
- [ ] 객체 리터럴 메서드를 화살표 함수로 쓰면 안 되는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/this" target="_blank">[1] this — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/bind" target="_blank">[2] Function.prototype.bind() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-ordinarycallbindthis" target="_blank">[3] OrdinaryCallBindThis — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [실행 컨텍스트 — 함수가 실행될 때 만들어지는 환경 →](/post/execution-context) — 이 글의 선행
- [스코프 — 변수가 어디까지 보이는가 →](/post/scope) — "어디서 만들었나" 로 정해지는 쪽
- [프로토타입 — 없으면 위에 물어보는 상속 →](/post/prototype) — 물려받은 메서드 안의 `this` 도 호출한 객체다
