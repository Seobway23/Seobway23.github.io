---
title: "참조 타입 — 주소가 복사되는 것들"
slug: reference-type
category: frontend/javascript
concept: reference-type
tags: [javascript, 타입, 참조타입, 객체]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-09
excerpt: >
  객체·배열·함수는 변수에 값이 아니라 주소가 담긴다. 복사해도 같은 것을 가리켜서 한쪽을 고치면 둘 다 바뀐다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Data_structures
    title: "JavaScript data types and data structures — MDN Web Docs"
    checked: 2026-09-09
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object
    title: "Object — MDN Web Docs"
    checked: 2026-09-09
  - url: https://tc39.es/ecma262/#sec-object-type
    title: "The Object Type — ECMAScript 사양"
    checked: 2026-09-09
---

## 복사한 객체를 고쳤는데 왜 원본까지 바뀌는가

[원시 타입](/post/primitive-type)은 값이 복사되어 서로 독립적이었다. 객체는 다르다.

```js
const original = { name: "서브웨이" };
const copy = original;

copy.name = "바뀜";
console.log(original.name);   // "바뀜"   ← 원본까지 바뀐다
```

복사한 것은 **객체가 아니라 객체를 가리키는 주소**이기 때문이다.

---

## 참조 타입은 무엇인가

참조 타입은 **변수에 값이 아니라 메모리 주소(참조)가 저장되는 타입**이다.
[원시 타입 7가지](/post/primitive-type)가 아닌 것은 전부 참조 타입이다.

- 객체 `{}`
- 배열 `[]`
- 함수 `function () {}`
- 그 밖에 `Date` · `Map` · `Set` · `RegExp` 등

변수에 담기는 것은 실제 데이터가 아니라 **"그 데이터가 어디 있는지"** 다.
그래서 두 변수에 같은 주소가 들어가면 둘은 **같은 하나**를 본다.

```seq
title: 참조 타입은 주소가 복사된다
speed: 1500
caption: 상자는 둘이지만 가리키는 것은 하나다.

lane a    변수 original
lane b    변수 copy
lane heap 실제 객체가 있는 곳
lane out  결과 #log

step const original = { name: "서브웨이" } — 객체가 어딘가에 만들어진다.
  push heap { name: "서브웨이" }
step original 에는 객체가 아니라 그 객체의 주소가 담긴다.
  push a 주소 → 객체
step const copy = original — 복사되는 것은 주소다. 객체는 그대로 하나다.
  push b 주소 → 객체 (같은 곳)
step copy.name 을 고치면 주소를 따라가 그 하나뿐인 객체를 고친다.
  move b heap name 수정
step original 로 읽어도 같은 객체라 바뀐 값이 보인다.
  log out original.name === "바뀜"
```

::: important
`const` 로 선언해도 **속성은 바꿀 수 있다.** `const` 가 막는 것은 "변수에 담긴 주소를
다른 주소로 바꾸는 것"이지, "그 주소에 있는 객체의 내용을 고치는 것"이 아니다.

```js
const obj = { n: 1 };
obj.n = 2;          // 된다 — 객체 내용을 고침
obj = { n: 3 };     // TypeError — 주소를 바꾸려 함
```
:::

---

## 비교도 주소로 한다

`===` 는 참조 타입에서 **내용이 같은지가 아니라 같은 객체인지**를 본다.

```js
{ a: 1 } === { a: 1 }    // false — 내용은 같지만 서로 다른 객체
[1, 2] === [1, 2]        // false

const x = { a: 1 };
const y = x;
x === y                  // true — 같은 주소
```

내용을 비교하려면 직접 비교하거나 `JSON.stringify` 같은 우회를 써야 한다
(중첩·순서·함수 때문에 완전하지는 않다).

---

## 직접 확인

같은 객체를 가리키는지, 따로인지 눈으로 확인해라.

```playground
#! js title=reference.js height=260
const original = { name: "서브웨이", tags: ["js"] };

const alias = original;              // 주소 복사 — 같은 객체
const shallow = { ...original };     // 얕은 복사 — 겉만 새 객체

alias.name = "별칭이 바꿈";
console.log("1:", original.name);    // 바뀐다

shallow.name = "복사본이 바꿈";
console.log("2:", original.name);    // 안 바뀐다

// 그런데 중첩된 배열은 여전히 공유된다
shallow.tags.push("ts");
console.log("3:", original.tags);    // 같이 바뀐다!

console.log("같은 객체?", original === alias, original === shallow);
```

3번이 핵심이다. `{ ...original }` 은 **최상위 속성만** 새로 만들고, 그 안의 배열은
주소만 복사한다. 이것이 얕은 복사와 깊은 복사가 갈리는 지점이다.

---

## 흔한 실수

::: warning
**함수 인자로 객체를 넘기고 원본이 안 바뀔 거라 믿는 것**

```js
function reset(config) {
  config.retry = 0;      // 호출한 쪽의 객체가 바뀐다
}

const config = { retry: 3 };
reset(config);
console.log(config.retry);   // 0
```

인자로 넘어가는 것도 주소다. 원본을 지키려면 함수 안에서 복사본을 만들거나,
바꾼 값을 **반환**해서 호출한 쪽이 교체하게 한다.
:::

::: caution
**배열을 `===` 로 비교하는 것**

```js
[1, 2, 3] === [1, 2, 3]    // false
```

React 의 의존성 배열이나 `useMemo` 가 매번 다시 도는 이유가 대개 이것이다.
매 렌더마다 새 객체·새 배열이 만들어지면 주소가 달라 "바뀐 것"으로 취급된다.
:::

---

## 한 줄 정리

참조 타입은 **변수에 주소가 저장되는 타입**(객체·배열·함수)이다. 대입·인자 전달은
주소를 복사하므로 여러 변수가 같은 하나를 가리키고, `===` 도 내용이 아니라 주소를 비교한다.

- [ ] `const` 객체의 속성을 바꿀 수 있는 이유를 설명할 수 있다
- [ ] `{a:1} === {a:1}` 이 `false` 인 이유를 안다
- [ ] 스프레드로 복사해도 중첩된 값이 공유되는 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Data_structures" target="_blank">[1] JavaScript data types and data structures — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object" target="_blank">[2] Object — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-object-type" target="_blank">[3] The Object Type — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [원시 타입 — 값 자체가 복사되는 것들 →](/post/primitive-type) — 이 글의 선행
- [프로토타입 — 객체가 다른 객체를 참조해 상속받는 방식 →](/post/prototype)
