---
title: "참조 타입과 참조 복사"
coverImage: /post-thumbnails/reference-type.svg
slug: reference-type
category: frontend/javascript
concept: reference-type
tags: [javascript, 타입, 참조타입, 객체]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-09
excerpt: >
  객체·배열·함수를 담은 변수에는 값이 아니라 객체의 참조가 저장된다. 대입하면 참조가 복사되므로 두 변수가 같은 객체를 가리킨다.
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

## 문제 상황

[원시 타입](/post/primitive-type)은 대입할 때 값이 복사되어 두 변수가 서로 영향을 주지 않는다.
객체는 다르게 동작한다.

```js
const original = { name: "서브웨이" };
const copy = original;

copy.name = "바뀜";
console.log(original.name);   // "바뀜" (원본도 바뀐다)
```

`copy = original` 에서 복사되는 것은 객체가 아니라 객체의 참조다. 두 변수가 같은 객체를 가리키므로
한쪽에서 속성을 바꾸면 다른 쪽에서도 바뀐 값이 보인다.

---

## 동작 원리

참조 타입은 변수에 값 대신 **참조(reference)**, 즉 힙에 할당된 객체의 위치 정보가 저장되는 타입이다.
[원시 타입 7가지](/post/primitive-type)를 제외한 모든 값이 여기에 속한다.

- 객체 `{}`
- 배열 `[]`
- 함수 `function () {}`
- 그 밖에 `Date` · `Map` · `Set` · `RegExp` 등

객체 리터럴을 평가하면 엔진은 힙에 객체를 할당하고, 변수에는 그 객체의 참조를 저장한다.
대입(`=`)과 인자 전달은 이 참조를 복사하므로, 같은 참조를 가진 변수들은 모두 같은 객체를 가리킨다.

```seq
title: 대입 시 참조가 복사되는 과정
speed: 1500
caption: 변수는 둘이고 힙의 객체는 하나다.

lane a    변수 original
lane b    변수 copy
lane heap 힙
lane out  결과 #log

step const original = { name: "서브웨이" } 를 평가하면 힙에 객체가 할당된다.
  push heap { name: "서브웨이" }
step original 에는 객체의 참조가 저장된다.
  push a 참조 → 객체
step const copy = original 은 참조를 복사한다. 객체는 새로 만들어지지 않는다.
  push b 참조 → 객체 (같은 객체)
step copy.name 을 수정하면 참조를 따라가 힙의 객체를 직접 수정한다.
  move b heap name 수정
step original 도 같은 객체를 참조하므로 수정된 값이 읽힌다.
  log out original.name === "바뀜"
```

::: important
`const` 로 선언한 객체도 속성은 수정할 수 있다. `const` 는 변수의 재할당(다른 참조로 교체)만
금지하고, 참조가 가리키는 객체의 내용 변경은 막지 않는다.

```js
const obj = { n: 1 };
obj.n = 2;          // 가능: 객체의 속성 수정
obj = { n: 3 };     // TypeError: 변수 재할당
```

객체 자체를 수정 불가능하게 하려면 `Object.freeze` 를 쓴다(최상위 속성에만 적용된다).
:::

---

## 동등 비교

참조 타입에서 `===` 는 두 피연산자가 같은 객체를 참조하는지 비교한다. 속성 값이 같은지는 보지 않는다.

```js
{ a: 1 } === { a: 1 }    // false (내용은 같지만 서로 다른 객체)
[1, 2] === [1, 2]        // false

const x = { a: 1 };
const y = x;
x === y                  // true (같은 참조)
```

내용을 비교하려면 속성을 직접 순회해 비교해야 한다. `JSON.stringify` 결과를 비교하는 방법도 있지만
속성 순서, `undefined`·함수 값 누락 때문에 정확하지 않다.

---

## 예제

참조 복사와 스프레드 복사의 차이를 비교한다.

```playground
#! js title=reference.js height=260
const original = { name: "서브웨이", tags: ["js"] };

const alias = original;              // 참조 복사: 같은 객체
const shallow = { ...original };     // 얕은 복사: 최상위만 새 객체

alias.name = "별칭이 바꿈";
console.log("1:", original.name);    // 바뀐다

shallow.name = "복사본이 바꿈";
console.log("2:", original.name);    // 바뀌지 않는다

// 중첩된 배열은 여전히 공유된다
shallow.tags.push("ts");
console.log("3:", original.tags);    // 같이 바뀐다

console.log("같은 객체?", original === alias, original === shallow);
```

3번 결과가 달라지는 이유는 `{ ...original }` 이 최상위 속성만 새 객체로 복사하고, 속성 값인 배열은
참조만 복사하기 때문이다. 이 차이는 [얕은 복사와 깊은 복사](/post/shallow-deep-copy)에서 다룬다.

---

## 자주 하는 실수

::: warning
**함수에 넘긴 객체가 수정되지 않는다고 가정하는 것**

```js
function reset(config) {
  config.retry = 0;      // 호출한 쪽의 객체가 수정된다
}

const config = { retry: 3 };
reset(config);
console.log(config.retry);   // 0
```

인자로 전달되는 것도 참조다. 원본을 유지하려면 함수 안에서 복사본을 만들어 수정하거나,
수정한 새 객체를 반환해 호출한 쪽에서 교체한다.
:::

::: caution
**배열·객체를 `===` 로 비교하는 것**

```js
[1, 2, 3] === [1, 2, 3]    // false
```

React 의 의존성 배열이나 `useMemo` 가 매 렌더마다 다시 실행되는 원인 중 하나다.
렌더마다 새 객체·배열을 생성하면 참조가 달라지므로 값이 바뀐 것으로 판단된다.
:::

---

## 정리

참조 타입(객체·배열·함수)의 변수에는 객체의 참조가 저장된다. 대입과 인자 전달은 참조를 복사하므로
여러 변수가 같은 객체를 가리킬 수 있고, `===` 는 참조가 같은지를 비교한다.

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

- [원시 타입과 값 복사 →](/post/primitive-type) (선행 개념)
- [프로토타입과 프로토타입 체인 →](/post/prototype)
- [얕은 복사와 깊은 복사 →](/post/shallow-deep-copy) (다음 글)
