---
title: "프로토타입 — 없으면 위에 물어보는 상속"
slug: prototype
category: frontend/javascript
concept: prototype
tags: [javascript, 프로토타입, 상속, 객체]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-09
excerpt: >
  내가 만들지도 않은 toString·map 같은 메서드를 쓸 수 있는 이유. 객체가 다른 객체를 참조해 속성을 물려받는 구조다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain
    title: "Inheritance and the prototype chain — MDN Web Docs"
    checked: 2026-09-09
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf
    title: "Object.getPrototypeOf() — MDN Web Docs"
    checked: 2026-09-09
  - url: https://tc39.es/ecma262/#sec-objects
    title: "Objects — ECMAScript 사양"
    checked: 2026-09-09
---

## 만든 적 없는 메서드를 왜 쓸 수 있는가

빈 객체를 만들었을 뿐인데 메서드가 딸려 온다.

```js
const obj = {};
obj.toString();          // "[object Object]"   ← 만든 적 없다

const arr = [1, 2, 3];
arr.map((n) => n * 2);   // 이것도 만든 적 없다
```

`obj` 에는 아무것도 없다. 그런데 `toString` 을 찾아 준다. **자기한테 없으면 위에 물어보기
때문**이다.

---

## 프로토타입은 무엇인가

프로토타입은 **객체가 참조하는 다른 객체**이고, 자기한테 없는 속성을 여기서 찾는다.
모든 객체는 내부에 `[[Prototype]]` 이라는 숨은 링크를 하나 갖고 있다.

속성을 읽을 때 자바스크립트는 이렇게 움직인다.

1. 객체 자신에게 있나? 있으면 끝.
2. 없으면 `[[Prototype]]` 을 따라 올라가 거기서 찾는다.
3. 거기도 없으면 또 올라간다.
4. 끝(`null`)까지 갔는데 없으면 `undefined`.

이 사슬을 **프로토타입 체인**이라고 한다.

```seq
title: arr.map 을 찾아 위로 올라간다
speed: 1500
caption: 자기한테 없으면 프로토타입을 따라 위로. 끝은 항상 null 이다.

lane self  arr 자신
lane aproto Array.prototype
lane oproto Object.prototype
lane end   null
lane out   결과 #log

step arr.map 을 읽는다. arr 자신에는 0,1,2 와 length 뿐이다.
  push self 0,1,2,length
  mark self
step 없으니 [[Prototype]] 을 따라 Array.prototype 으로 올라간다.
  move self aproto map 찾는 중
step Array.prototype 에 map 이 있다. 여기서 멈춘다.
  log out map 발견 → 실행
step 만약 toString 이었다면 여기도 없어 한 칸 더 올라간다.
  move aproto oproto toString 찾는 중
step Object.prototype 에서 찾는다.
  log out toString 발견
step 여기에도 없었다면 null 에 닿고 undefined 를 돌려준다.
  move oproto end 못 찾음
  log out undefined
```

::: important
**함수의 `prototype` 속성과 객체의 `[[Prototype]]` 은 다른 것이다.**

- `Foo.prototype` — `new Foo()` 로 만든 객체들이 **참조하게 될** 객체
- `obj.__proto__` (= `Object.getPrototypeOf(obj)`) — 그 객체가 **지금 참조 중인** 객체

이름이 비슷해서 가장 많이 헷갈린다.
:::

---

## 어떻게 연결하는가

::: tabs
== Object.create
가장 직접적이다. "이 객체를 프로토타입으로 삼는 객체를 만들어라".

```js
const animal = {
  speak() { return `${this.name} 이(가) 소리를 낸다`; },
};

const dog = Object.create(animal);
dog.name = "바둑이";
dog.speak();     // "바둑이 이(가) 소리를 낸다"
```

`dog` 에는 `name` 뿐이지만 `speak` 는 `animal` 에서 찾아 쓴다.

== 생성자 함수
`new` 를 쓰면 만들어진 객체의 `[[Prototype]]` 이 `함수.prototype` 으로 연결된다.

```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} 이(가) 소리를 낸다`;
};

const dog = new Animal("바둑이");
Object.getPrototypeOf(dog) === Animal.prototype;   // true
```

`speak` 를 `this` 마다 만들지 않고 **한 벌만** 두는 것이 요점이다.

== class
문법만 다르고 하는 일은 위와 같다. 자바스크립트에는 클래스 기반 상속이 따로 없다.

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} 이(가) 소리를 낸다`; }
}

const dog = new Animal("바둑이");
Object.getPrototypeOf(dog) === Animal.prototype;   // true
```

메서드는 인스턴스가 아니라 `Animal.prototype` 에 올라간다.
:::

---

## 직접 확인

체인을 끝까지 따라가 보면 구조가 한눈에 보인다.

```playground
#! js title=prototype-chain.js height=280
function walk(label, value) {
  const chain = [];
  let cur = Object.getPrototypeOf(value);
  while (cur) {
    chain.push(cur.constructor ? cur.constructor.name : "(익명)");
    cur = Object.getPrototypeOf(cur);
  }
  console.log(label, "→", chain.join(" → "), "→ null");
}

walk("[1,2,3]  ", [1, 2, 3]);
walk("{}       ", {});
walk("'문자열' ", "문자열");
walk("function ", function () {});

// 자기 것인지 물려받은 것인지 구분
const dog = Object.create({ speak() {} });
dog.name = "바둑이";
console.log("name 은 자기 것?", Object.hasOwn(dog, "name"));
console.log("speak 은 자기 것?", Object.hasOwn(dog, "speak"));
console.log("speak 을 쓸 수는 있나?", typeof dog.speak);
```

`speak` 은 자기 것이 아닌데도 쓸 수 있다. 이것이 프로토타입 상속이다.

---

## 흔한 실수

::: warning
**`for...in` 이 물려받은 속성까지 도는 것**

```js
const base = { shared: 1 };
const obj = Object.create(base);
obj.own = 2;

for (const k in obj) console.log(k);   // own, shared  ← shared 도 나온다
Object.keys(obj);                       // ["own"]      ← 자기 것만
```

자기 속성만 원하면 `Object.keys` · `Object.entries` 를 쓰거나
`Object.hasOwn(obj, k)` 으로 거른다.
:::

::: caution
**프로토타입에 객체를 두면 모두가 공유한다**

```js
function Cart() {}
Cart.prototype.items = [];        // 위험

const a = new Cart();
const b = new Cart();
a.items.push("사과");
b.items;    // ["사과"]  ← b 것도 아니다
```

배열은 [참조 타입](/post/reference-type)이라 **하나를 모두가 가리킨다.**
인스턴스마다 따로 필요한 값은 `constructor` 안에서 `this.items = []` 로 만든다.
메서드처럼 공유해도 되는 것만 프로토타입에 둔다.
:::

::: danger
**내장 프로토타입을 고치지 마라**

```js
Array.prototype.last = function () { return this[this.length - 1]; };
```

편해 보이지만 `for...in` 에 잡히고, 나중에 표준에 같은 이름이 생기면 충돌한다.
필요하면 일반 함수를 만들어 쓴다.
:::

---

## 한 줄 정리

프로토타입은 **객체가 참조하는 다른 객체**이고, 자기한테 없는 속성은 이 링크를 따라
위로 올라가며 찾는다. `class` 도 이 구조 위의 문법이고, 메서드를 한 벌만 두어
인스턴스가 공유하게 하는 것이 목적이다.

- [ ] `obj.toString()` 이 동작하는 이유를 체인으로 설명할 수 있다
- [ ] `Foo.prototype` 과 `obj.__proto__` 의 차이를 말할 수 있다
- [ ] 프로토타입에 배열을 두면 안 되는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain" target="_blank">[1] Inheritance and the prototype chain — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf" target="_blank">[2] Object.getPrototypeOf() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-objects" target="_blank">[3] Objects — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [참조 타입 — 주소가 복사되는 것들 →](/post/reference-type) — 이 글의 선행
- [실행 컨텍스트 — 함수가 실행될 때 만들어지는 환경 →](/post/execution-context)
