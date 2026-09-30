---
title: "프로토타입과 프로토타입 체인"
coverImage: /post-thumbnails/prototype.svg
slug: prototype
category: frontend/javascript
concept: prototype
tags: [javascript, 프로토타입, 상속, 객체]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-09
excerpt: >
  직접 정의하지 않은 toString·map 을 호출할 수 있는 이유. 객체는 [[Prototype]] 링크로 다른 객체를 참조하고, 속성 조회 시 이 링크를 따라 탐색한다.
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

## 문제 상황

빈 객체와 배열 리터럴에서 직접 정의하지 않은 메서드를 호출할 수 있다.

```js
const obj = {};
obj.toString();          // "[object Object]" (정의한 적 없음)

const arr = [1, 2, 3];
arr.map((n) => n * 2);   // map 도 정의한 적 없음
```

`obj` 에는 자체 속성이 하나도 없지만 `toString` 호출이 성공한다. 속성 조회가 객체 자신에서
끝나지 않고, 연결된 다른 객체까지 이어지기 때문이다.

---

## 프로토타입과 속성 조회

모든 객체는 내부 슬롯 `[[Prototype]]` 을 가진다. 이 슬롯은 다른 객체 또는 `null` 을 가리키며,
여기서 가리키는 객체를 그 객체의 프로토타입(Prototype)이라고 한다.

속성을 읽을 때 엔진은 다음 순서로 탐색한다.

1. 객체의 자체 속성(own property)에서 찾는다. 있으면 그 값을 반환한다.
2. 없으면 `[[Prototype]]` 이 가리키는 객체에서 찾는다.
3. 그 객체에도 없으면 다시 그 객체의 `[[Prototype]]` 으로 이동한다.
4. `[[Prototype]]` 이 `null` 인 객체까지 탐색해도 없으면 `undefined` 를 반환한다.

이렇게 `[[Prototype]]` 링크로 이어진 객체의 연결을 프로토타입 체인(Prototype Chain)이라고 한다.

```seq
title: arr.map 조회 시 프로토타입 체인 탐색
speed: 1500
caption: 자체 속성에 없으면 [[Prototype]] 링크를 따라 탐색하고, 체인의 끝은 null 이다.

lane self  arr 자체 속성
lane aproto Array.prototype
lane oproto Object.prototype
lane end   null
lane out   결과 #log

step arr.map 을 조회한다. arr 의 자체 속성은 인덱스 0, 1, 2 와 length 다.
  push self 0,1,2,length
  mark self
step 자체 속성에 map 이 없으므로 [[Prototype]] 이 가리키는 Array.prototype 을 탐색한다.
  move self aproto map 탐색
step Array.prototype 에 map 이 있으므로 탐색을 멈추고 반환한다.
  log out map 발견, 호출
step hasOwnProperty 를 조회했다면 Array.prototype 에서도 찾지 못해 다음 링크로 이동한다.
  move aproto oproto hasOwnProperty 탐색
step Object.prototype 에서 hasOwnProperty 를 찾는다.
  log out hasOwnProperty 발견
step Object.prototype 에도 없다면 [[Prototype]] 이 null 이므로 탐색을 끝내고 undefined 를 반환한다.
  move oproto end 찾지 못함
  log out undefined
```

::: important
함수의 `prototype` 속성과 객체의 `[[Prototype]]` 슬롯은 별개다.

- `Foo.prototype`: `new Foo()` 로 생성될 인스턴스의 `[[Prototype]]` 에 할당될 객체
- `Object.getPrototypeOf(obj)` (또는 `obj.__proto__`): `obj` 의 `[[Prototype]]` 이 현재 가리키는 객체

`new Foo()` 로 만든 인스턴스 `obj` 에 대해 `Object.getPrototypeOf(obj) === Foo.prototype` 이 성립한다.
:::

---

## 프로토타입 연결 방법

::: tabs
== Object.create
인자로 받은 객체를 `[[Prototype]]` 으로 하는 새 객체를 생성한다.

```js
const animal = {
  speak() { return `${this.name} 이(가) 소리를 낸다`; },
};

const dog = Object.create(animal);
dog.name = "바둑이";
dog.speak();     // "바둑이 이(가) 소리를 낸다"
```

`dog` 의 자체 속성은 `name` 뿐이고, `speak` 는 프로토타입인 `animal` 에서 조회된다.

== 생성자 함수
`new` 로 호출하면 새 객체의 `[[Prototype]]` 이 `생성자.prototype` 으로 설정된다.

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

`speak` 는 인스턴스마다 생성되지 않고 `Animal.prototype` 에 한 번만 정의되어 모든 인스턴스가 공유한다.

== class
`class` 는 생성자 함수와 프로토타입 설정을 선언적으로 작성하는 문법이다. 내부 동작은 생성자 함수와 같다.

```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} 이(가) 소리를 낸다`; }
}

const dog = new Animal("바둑이");
Object.getPrototypeOf(dog) === Animal.prototype;   // true
```

클래스 본문에 정의한 메서드는 인스턴스가 아니라 `Animal.prototype` 에 정의된다.
:::

---

## 예제

값마다 프로토타입 체인을 끝까지 출력하고, 자체 속성과 상속된 속성을 구분한다.

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

// 자체 속성과 상속된 속성 구분
const dog = Object.create({ speak() {} });
dog.name = "바둑이";
console.log("name 은 자체 속성?", Object.hasOwn(dog, "name"));
console.log("speak 은 자체 속성?", Object.hasOwn(dog, "speak"));
console.log("speak 호출 가능?", typeof dog.speak);
```

`speak` 는 자체 속성이 아니지만 프로토타입 체인을 통해 조회되어 호출할 수 있다.

---

## 자주 하는 실수

::: warning
`for...in` 은 상속된 열거 가능 속성까지 순회한다

```js
const base = { shared: 1 };
const obj = Object.create(base);
obj.own = 2;

for (const k in obj) console.log(k);   // own, shared
Object.keys(obj);                       // ["own"]
```

자체 속성만 필요하면 `Object.keys` · `Object.entries` 를 쓰거나 `Object.hasOwn(obj, k)` 로 거른다.
:::

::: caution
프로토타입에 참조 타입 값을 두면 모든 인스턴스가 같은 객체를 공유한다

```js
function Cart() {}
Cart.prototype.items = [];

const a = new Cart();
const b = new Cart();
a.items.push("사과");
b.items;    // ["사과"]
```

`a.items` 와 `b.items` 는 모두 `Cart.prototype.items` 라는 같은 배열을 참조한다([참조 타입](/post/reference-type)).
인스턴스별 상태는 생성자 안에서 `this.items = []` 로 자체 속성으로 만들고,
프로토타입에는 메서드처럼 공유해도 되는 값만 둔다.
:::

::: danger
내장 프로토타입 확장 금지

```js
Array.prototype.last = function () { return this[this.length - 1]; };
```

대입으로 추가한 속성은 열거 가능하므로 `for...in` 에 노출되고, 이후 표준에 같은 이름의 메서드가
추가되면 동작이 충돌한다. 필요한 기능은 별도 유틸 함수로 작성한다.
:::

---

## 정리

모든 객체는 `[[Prototype]]` 으로 다른 객체를 참조하며, 자체 속성에 없는 속성은 이 링크를 따라
`null` 에 도달할 때까지 탐색한다. `class` 도 같은 구조를 사용하는 문법이며, 메서드를 프로토타입에
한 번만 정의해 인스턴스들이 공유하게 한다.

- [ ] `obj.toString()` 이 동작하는 이유를 프로토타입 체인으로 설명할 수 있다
- [ ] `Foo.prototype` 과 `Object.getPrototypeOf(obj)` 의 차이를 말할 수 있다
- [ ] 프로토타입에 배열을 두면 안 되는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain" target="_blank">[1] Inheritance and the prototype chain — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf" target="_blank">[2] Object.getPrototypeOf() — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-objects" target="_blank">[3] Objects — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [참조 타입과 참조 복사 →](/post/reference-type) (선행 개념)
- [실행 컨텍스트의 구성과 생성 과정 →](/post/execution-context)
