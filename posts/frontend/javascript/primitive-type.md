---
title: "원시 타입과 값 복사"
coverImage: /post-thumbnails/primitive-type.svg
slug: primitive-type
category: frontend/javascript
concept: primitive-type
tags: [javascript, 타입, 원시타입]
author: Seobway
readTime: 6
featured: false
createdAt: 2026-09-09
excerpt: >
  string·number·boolean·undefined·null·bigint·symbol 7가지 원시 타입은 대입할 때 값 자체가 복사되어 변수끼리 서로 영향을 주지 않는다.
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

## 문제 상황

아래 두 코드는 같은 방식으로 대입했지만 결과가 다르다.

```js
let a = 1;
let b = a;
b = 2;
console.log(a);        // 1 (변경되지 않음)

let x = { n: 1 };
let y = x;
y.n = 2;
console.log(x.n);      // 2 (함께 변경됨)
```

첫 번째는 원시 타입, 두 번째는 참조 타입이다. 대입할 때 복사되는 대상이 다르기 때문에 결과가 갈린다.

---

## 원시 타입의 종류

원시 타입(Primitive Type)은 변수에 값 자체가 저장되는 타입이다. ECMAScript 에는 7가지가 있다.

| 타입 | 예 | 비고 |
|---|---|---|
| `string` | `"안녕"` | UTF-16 코드 유닛의 시퀀스 |
| `number` | `42`, `3.14`, `NaN` | IEEE 754 배정밀도 부동소수점. 정수·실수 구분 없음 |
| `boolean` | `true`, `false` | |
| `undefined` | `undefined` | 초기화되지 않은 변수의 기본값 |
| `null` | `null` | 값이 없음을 명시적으로 나타냄 |
| `bigint` | `9007199254740993n` | `Number.MAX_SAFE_INTEGER` 를 넘는 정수 |
| `symbol` | `Symbol("id")` | 유일한 값. 주로 충돌하지 않는 속성 키로 사용 |

이 7가지를 제외한 객체·배열·함수는 모두 [참조 타입](/post/reference-type)이다.

원시 값을 다른 변수에 대입하면 값이 복사된다. 두 변수는 각각 독립된 값을 가지므로
한쪽을 재할당해도 다른 쪽에 영향이 없다.

```seq
title: 원시 값의 대입과 복사
speed: 1400
caption: 두 변수가 각각 독립된 값을 가진다.

lane a   변수 a
lane b   변수 b
lane out 결과 #log

step let a = 1 이 실행되어 a 에 값 1 이 저장된다.
  push a 1
step let b = a 는 a 의 값을 읽어 b 에 복사한다. 값이 두 개 존재한다.
  push b 1 (복사본)
step b = 2 는 b 에 새 값을 재할당한다.
  clear b
  push b 2
step a 는 별도의 값이므로 영향을 받지 않는다.
  log out a 는 여전히 1
```

---

## 원시 값의 불변성

원시 값은 불변(immutable)이다. 값의 일부를 수정하는 연산은 존재하지 않는다.

```js
let s = "hello";
s[0] = "H";
console.log(s);            // "hello" (변경되지 않음)

s = "Hello";               // 변수에 새 문자열을 재할당
```

`s[0] = "H"` 는 원시 값에 속성을 쓰려는 시도이며, 비엄격 모드에서는 무시되고 엄격 모드에서는
`TypeError` 가 발생한다. `toUpperCase()` 같은 문자열 메서드도 원본을 수정하지 않고 새 문자열을 반환한다.
변수 `s` 에 다른 값을 재할당하는 것은 값의 수정이 아니라 변수가 가리키는 값의 교체다.

::: note
`"hello".toUpperCase()` 처럼 원시 값에서 메서드를 호출할 수 있는 이유는, 속성 접근 시점에 엔진이
해당 래퍼 객체(`String`)를 임시로 생성하기 때문이다(auto-boxing). 호출이 끝나면 래퍼 객체는 폐기된다.
:::

---

## 예제

`typeof` 로 각 값의 타입을 출력하고, 원시 값 복사가 독립적인지 확인한다.

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

// 원시 값 복사는 독립적이다
let a = 10;
let b = a;
b += 5;
console.log("a =", a, "/ b =", b);
```

출력에서 `typeof null` 이 `"object"` 로 나오는데, 이는 아래에서 설명한다.

---

## 자주 하는 실수

::: warning
`typeof null` 의 결과는 `"object"` 다

```js
typeof null;        // "object" (null 은 원시 타입)
```

초기 구현에서 값의 타입 태그를 판별하는 방식 때문에 생긴 버그이며, 하위 호환성 때문에
사양에 그대로 남았다. `null` 여부는 `typeof` 대신 일치 비교로 확인한다.

```js
value === null
```
:::

::: caution
`null` 과 `undefined` 의 구분

`undefined` 는 초기화되지 않은 변수나 존재하지 않는 속성에 엔진이 부여하는 값이고,
`null` 은 값이 없음을 코드에서 명시적으로 지정한 값이다. 용도가 다르므로 한 프로젝트 안에서
기준을 정해 일관되게 사용한다.
:::

---

## 정리

원시 타입은 변수에 값 자체가 저장되는 7가지 타입(string, number, boolean, undefined, null,
bigint, symbol)이다. 대입 시 값이 복사되어 변수끼리 독립적이고, 값 자체는 수정할 수 없으며
재할당만 가능하다.

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

- [참조 타입과 참조 복사 →](/post/reference-type) (다음 글)
