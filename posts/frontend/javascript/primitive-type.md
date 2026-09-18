---
title: "원시 타입 — 값 자체가 복사되는 것들"
slug: primitive-type
category: frontend/javascript
concept: primitive-type
tags: [javascript, 타입, 원시타입]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-09
excerpt: >
  숫자·문자열·불리언처럼 변수에 값이 그대로 담기는 7가지 타입. 복사하면 서로 영향을 주지 않는다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/Primitive
    title: "Primitive — MDN Web Docs 용어 사전"
    checked: 2026-09-09
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Data_structures
    title: "JavaScript data types and data structures — MDN Web Docs"
    checked: 2026-09-09
  - url: https://tc39.es/ecma262/#sec-ecmascript-language-types
    title: "ECMAScript Language Types — ECMAScript 사양"
    checked: 2026-09-09
---

## 변수를 복사했는데 왜 어떤 건 같이 바뀌고 어떤 건 안 바뀌는가

아래 두 코드는 똑같이 "복사"했는데 결과가 반대다.

```js
let a = 1;
let b = a;
b = 2;
console.log(a);        // 1     ← 안 바뀐다

let x = { n: 1 };
let y = x;
y.n = 2;
console.log(x.n);      // 2     ← 같이 바뀐다
```

이 차이를 만드는 것이 **원시 타입이냐 아니냐**다.

---

## 원시 타입은 무엇인가

원시 타입은 **변수에 값 자체가 저장되는 타입**이다. 자바스크립트에 7가지가 있다.

| 타입 | 예 | 비고 |
|---|---|---|
| `string` | `"안녕"` | |
| `number` | `42`, `3.14`, `NaN` | 정수·실수 구분 없음 |
| `boolean` | `true`, `false` | |
| `undefined` | `undefined` | 값을 아직 안 넣음 |
| `null` | `null` | 값이 없음을 **의도적으로** 표시 |
| `bigint` | `9007199254740993n` | `number` 로 표현 못 하는 큰 정수 |
| `symbol` | `Symbol("id")` | 겹치지 않는 고유 키 |

이 7가지가 아닌 것은 전부 [참조 타입](/post/reference-type)이다 — 객체·배열·함수.

원시 타입의 값을 다른 변수에 넣으면 **값이 통째로 복사**된다. 두 변수는 각자 자기 값을
들고 있어서 한쪽을 바꿔도 다른 쪽은 그대로다.

```seq
title: 원시 타입은 값이 복사된다
speed: 1400
caption: 두 변수가 각자 자기 값을 들고 있다.

lane a   변수 a
lane b   변수 b
lane out 결과 #log

step let a = 1 — a 라는 상자에 값 1 이 들어간다.
  push a 1
step let b = a — a 의 값을 읽어 b 상자에 새로 넣는다. 상자가 두 개다.
  push b 1 (복사본)
step b = 2 — b 의 상자만 바뀐다.
  clear b
  push b 2
step a 는 그대로다. 서로 다른 상자이기 때문이다.
  log out a는 여전히 1
```

---

## 원시 타입은 바꿀 수 없다

원시 값 자체는 **불변(immutable)** 이다. 문자열의 글자 하나를 바꾸려 해도 무시된다.

```js
let s = "hello";
s[0] = "H";
console.log(s);            // "hello"   ← 안 바뀐다

s = "Hello";               // 이건 된다 — 새 값으로 "교체"한 것
```

`s[0] = "H"` 는 문자열을 고치는 게 아니라 없는 속성에 값을 넣으려는 시도라 조용히 무시된다.
`toUpperCase()` 같은 메서드도 원본을 고치지 않고 **새 문자열을 만들어 돌려준다.**

::: note
`"hello".toUpperCase()` 처럼 원시 값에 메서드를 쓸 수 있는 것은, 그 순간에만 자바스크립트가
임시 래퍼 객체(`String`)를 만들어 주기 때문이다. 쓰고 나면 바로 버려진다.
:::

---

## 직접 확인

`typeof` 로 각 값의 타입을 찍어 보고, 값 복사가 독립적인지 확인해라.

```playground
#! js title=primitives.js height=240
const values = [
  "문자열", 42, true, undefined, null,
  9007199254740993n, Symbol("id"),
  {}, [], function () {},
];

for (const v of values) {
  console.log(String(typeof v).padEnd(10), "|", typeof v === "object" || typeof v === "function" ? "참조 타입" : "원시 타입");
}

// 값 복사는 독립적이다
let a = 10;
let b = a;
b += 5;
console.log("a =", a, "/ b =", b);
```

`typeof null` 이 `"object"` 로 나오는 것에 주목해라. 다음 절에서 다룬다.

---

## 흔한 실수

::: warning
**`typeof null` 이 `"object"` 다**

```js
typeof null;        // "object"   ← null 은 원시 타입인데도
```

자바스크립트 초창기의 버그이고, 고치면 기존 코드가 깨져서 사양에 그대로 남았다.
`null` 인지 확인하려면 `typeof` 말고 값을 직접 비교한다.

```js
value === null
```
:::

::: caution
**`null` 과 `undefined` 를 섞어 쓰는 것**

`undefined` 는 "아직 값을 안 넣음"(엔진이 넣는 기본값),
`null` 은 "값이 없음을 내가 정했음"이다. 의미가 다르므로 섞지 않는 편이 낫다.
:::

---

## 한 줄 정리

원시 타입은 **변수에 값 자체가 저장되는 7가지 타입**(string · number · boolean ·
undefined · null · bigint · symbol)이고, 대입하면 값이 복사되어 서로 독립적이다.
값 자체는 바꿀 수 없고 교체만 된다.

- [ ] 원시 타입 7가지를 말할 수 있다
- [ ] `let b = a` 뒤에 `b` 를 바꿔도 `a` 가 그대로인 이유를 안다
- [ ] `typeof null` 이 `"object"` 인 이유를 안다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Primitive" target="_blank">[1] Primitive — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/JavaScript/Guide/Data_structures" target="_blank">[2] JavaScript data types and data structures — MDN Web Docs</a></li>
<li><a href="https://tc39.es/ecma262/#sec-ecmascript-language-types" target="_blank">[3] ECMAScript Language Types — ECMAScript 사양</a></li>
</ol>

---

## 관련 글

- [참조 타입 — 주소가 복사되는 것들 →](/post/reference-type) — 나머지 절반
