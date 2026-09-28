---
title: "얕은 복사와 깊은 복사 — 겉만 새로 만드는가, 속까지 새로 만드는가"
coverImage: /post-thumbnails/shallow-deep-copy.svg
slug: shallow-deep-copy
category: frontend/javascript
concept: shallow-deep-copy
tags: [javascript, 얕은 복사, 깊은 복사, structuredClone, 참조 타입]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-09-28
excerpt: >
  스프레드로 복사했는데 원본이 같이 바뀌는 이유. 복사가 최상위 상자만 새로 만드는지, 안에 든 객체까지 새로 만드는지의 차이다.
sources:
  - url: https://developer.mozilla.org/ko/docs/Glossary/Shallow_copy
    title: "Shallow copy — MDN Web Docs 용어 사전"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Glossary/Deep_copy
    title: "Deep copy — MDN Web Docs 용어 사전"
    checked: 2026-09-28
  - url: https://developer.mozilla.org/ko/docs/Web/API/Window/structuredClone
    title: "structuredClone() — MDN Web Docs"
    checked: 2026-09-28
---

## 복사했는데 왜 원본이 바뀌나

스프레드(`...`)로 복사했다. 복사본만 고쳤다. 그런데 원본도 바뀌어 있다.

```js
const user = { name: "민수", address: { city: "서울" } };
const copy = { ...user };

copy.name = "영희";           // 원본 그대로 — 여기까진 괜찮다
copy.address.city = "부산";   // 원본도 부산이 된다 ← ?

user.name;          // "민수"
user.address.city;  // "부산"
```

`name` 은 따로 놀고 `address` 는 같이 논다. 같은 복사인데 결과가 반반이다.
이 반반이 **얕은 복사**다.

---

## 어떻게 동작하는가

먼저 [참조 타입](/post/reference-type)에서 본 것 하나만 기억하면 된다.
**객체를 담은 변수에는 객체가 아니라 주소가 들어 있다.**

그러면 `user` 는 이렇게 생겼다.

```text
user ──▶ { name: "민수", address: ──▶ { city: "서울" } }
          ─────── 상자 A ───────        ─── 상자 B ───
```

상자가 **두 개**다. 바깥 상자 A 안에 `address` 라는 칸이 있고, 그 칸에는
상자 B 의 **주소**가 들어 있다.

::: important
**얕은 복사 — 상자 A 만 새로 만든다.** 칸의 내용은 그대로 옮겨 적는다.
`name` 칸에는 `"민수"` 라는 값이, `address` 칸에는 **B 의 주소**가 그대로 복사된다.
그래서 새 상자 A' 도 같은 B 를 가리킨다.

**깊은 복사 — B 까지 새로 만든다.** 안쪽 상자도 전부 새로 만들어
원본과 **공유하는 상자가 하나도 없다.**
:::

```seq
title: 얕은 복사는 바깥 상자만 새로 만든다
speed: 1600
caption: 주소가 복사되면 같은 상자를 두 곳에서 가리킨다. 깊은 복사는 안쪽 상자까지 새로 만든다.

lane orig  원본 user (상자 A)
lane copy  복사본 copy (상자 A')
lane inner 안쪽 상자 B
lane inner2 새 상자 B'
lane out   결과 #log

step 원본 상자 A 에는 name 값과 B 의 주소가 들어 있다.
  push orig name: "민수"
  push orig address → B
  push inner city: "서울"
step { ...user } 는 새 상자 A' 를 만들고 칸을 하나씩 옮겨 적는다. name 은 값이 복사된다.
  push copy name: "민수"
step address 칸에는 B 의 주소가 적혀 있으니 주소가 그대로 옮겨진다. B 는 새로 생기지 않는다.
  push copy address → B
  mark inner
step copy.address.city = "부산" 은 B 를 고친다. user 도 B 를 보고 있으니 같이 바뀐다.
  clear inner
  push inner city: "부산"
  log out user.address.city → "부산"
step 처음부터 깊은 복사(structuredClone)였다면 B 도 새로 만들어 A' 는 B' 를 가리킨다.
  clear copy
  push copy name: "민수"
  push copy address → B'
  push inner2 city: "서울"
  log out 깊은 복사: 복사본을 고쳐도 원본은 그대로
```

정리하면 **"몇 층까지 새로 만드느냐"** 의 차이다.

| | 새로 만드는 범위 | 대표 방법 |
|---|---|---|
| 얕은 복사 | 맨 바깥 한 층 | `{ ...obj }`, `[...arr]`, `Object.assign`, `arr.slice()`, `Array.from` |
| 깊은 복사 | 안쪽 끝까지 전부 | `structuredClone(obj)` |

원시 값(`"민수"`, `3`)은 원래 값 자체가 복사되니 층이 없다.
**층이 생기는 건 객체 안에 객체가 있을 때뿐이다.** 중첩이 없으면 얕은 복사로 충분하다.

---

## 직접 확인

`===` 는 두 객체가 **같은 상자**인지 묻는다. 층마다 물어보면 어디까지 새로 만들어졌는지 보인다.

```playground
#! js title=copy-depth.js height=300
const user = {
  name: "민수",
  address: { city: "서울" },
  tags: ["a", "b"],
};

const shallow = { ...user };
const deep = structuredClone(user);

console.log("바깥 상자가 같은가");
console.log("  shallow:", shallow === user);                 // false
console.log("  deep   :", deep === user);                    // false

console.log("안쪽 address 가 같은가");
console.log("  shallow:", shallow.address === user.address); // true  ← 공유
console.log("  deep   :", deep.address === user.address);    // false

shallow.address.city = "부산";
shallow.tags.push("c");
console.log("얕은 복사를 고친 뒤 원본:", user.address.city, user.tags);

deep.address.city = "대구";
console.log("깊은 복사를 고친 뒤 원본:", user.address.city);  // 대구가 아니다
```

`shallow === user` 는 `false` 인데 `shallow.address === user.address` 는 `true` 다.
**바깥은 새것, 안쪽은 같은 것** — 얕은 복사를 한 줄로 보여준다.

---

## 흔한 실수

::: warning
**React·상태 관리에서 중첩된 값을 한 층만 복사하는 것**

```js
// 도시만 바꾸고 싶다
const next = { ...state };
next.address.city = "부산";   // state.address 를 직접 고쳤다
setState(next);
```

`next` 는 새 객체지만 `next.address` 는 원래 `state.address` 다.
원본을 고쳐 버렸으므로 "이전 상태"도 같이 바뀐다.
**바꾸는 경로에 있는 층마다 새로 만든다.**

```js
setState({ ...state, address: { ...state.address, city: "부산" } });
```

전부 깊은 복사할 필요는 없다. 바꾸는 길목만 새로 만들고 나머지는 공유해도 된다.
:::

::: caution
**`JSON.parse(JSON.stringify(obj))` 를 깊은 복사로 쓰는 것**

예전에 많이 쓰던 방법인데 JSON 으로 표현 못 하는 값이 조용히 사라지거나 바뀐다.

```js
const src = { when: new Date(), fn() {}, nothing: undefined, n: NaN };
JSON.parse(JSON.stringify(src));
// { when: "2026-09-28T...", n: null }   ← Date 는 문자열, fn·nothing 은 사라짐, NaN 은 null
```

`Map`·`Set` 은 빈 객체가 되고, 자기 자신을 가리키는(순환) 객체는 에러가 난다.
지금은 `structuredClone` 을 쓴다. `Date`·`Map`·`Set`·순환 참조까지 제대로 복사한다.
:::

::: notice
**`structuredClone` 도 전부 복사하지는 못한다.**

- **함수**가 들어 있으면 `DataCloneError` 로 실패한다.
- **클래스 인스턴스**는 속성만 복사되고 [프로토타입](/post/prototype) 연결은 끊긴다.
  복사본은 그냥 `Object` 가 되어 클래스 메서드를 못 쓴다.
- DOM 노드도 복사하지 못한다.

데이터(값 덩어리)를 복사하는 도구라고 생각하면 맞다.
:::

---

## 한 줄 정리

얕은 복사는 **맨 바깥 상자만** 새로 만들고 안쪽 객체는 주소를 옮겨 적어 **공유**한다.
깊은 복사는 안쪽 상자까지 **전부** 새로 만든다. 중첩이 없으면 둘은 같다.

- [ ] `{ ...obj }` 로 복사한 뒤 중첩된 값을 고치면 왜 원본이 바뀌는지 설명할 수 있다
- [ ] `shallow.address === user.address` 가 `true` 인 이유를 안다
- [ ] 중첩 상태를 바꿀 때 어느 층을 새로 만들어야 하는지 안다
- [ ] `JSON` 복사 대신 `structuredClone` 을 쓰는 이유와 그 한계를 말할 수 있다

## 참고

<ol>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Shallow_copy" target="_blank">[1] Shallow copy — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Glossary/Deep_copy" target="_blank">[2] Deep copy — MDN Web Docs 용어 사전</a></li>
<li><a href="https://developer.mozilla.org/ko/docs/Web/API/Window/structuredClone" target="_blank">[3] structuredClone() — MDN Web Docs</a></li>
</ol>

---

## 관련 글

- [참조 타입 — 주소가 복사되는 것들 →](/post/reference-type) — 이 글의 선행
- [원시 타입 — 값 자체가 복사되는 것들 →](/post/primitive-type)
- [프로토타입 — 없으면 위에 물어보는 상속 →](/post/prototype) — `structuredClone` 이 끊는 연결
