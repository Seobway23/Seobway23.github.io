---
title: "Emotion 런타임 CSS-in-JS 동작 방식"
coverImage: /post-thumbnails/emotion.svg
slug: emotion
category: frontend/styling
concept: emotion
tags: [emotion, css-in-js, react, styled, ssr]
author: Seobway
readTime: 10
featured: false
createdAt: 2026-10-15
excerpt: >
  Emotion은 컴포넌트가 렌더될 때 스타일을 문자열로 직렬화하고 해시해 class 이름을 만든 뒤, 처음 보는 해시만 style 요소에 규칙으로 넣는다. 합성은 배열 순서대로 하나의 규칙으로 합쳐지므로 뒤에 쓴 스타일이 이긴다.
glossary:
  css-in-js: "CSS를 별도 파일이 아니라 JavaScript 코드 안에 쓰고, 라이브러리가 실행 중에 스타일시트를 만들어 넣는 방식."
  serialize: "객체나 템플릿 조각처럼 여러 형태로 된 값을 문자열 하나로 바꾸는 일."
  hash: "입력 문자열에서 짧은 고정 길이 값을 계산하는 함수. 같은 입력이면 항상 같은 값이 나온다."
  tagged-template: "함수 이름 바로 뒤에 백틱 문자열을 붙여 호출하는 JavaScript 문법. css`color: red;` 는 css 함수를 템플릿 조각과 함께 호출한다."
  ssr: "서버에서 컴포넌트를 HTML 문자열로 렌더해 보내는 방식. 브라우저는 JavaScript 실행 전에 화면을 먼저 그릴 수 있다."
  rsc: "React Server Components. 서버에서만 실행되고 브라우저로 JavaScript를 보내지 않는 컴포넌트. Context와 상태 훅을 쓸 수 없다."
sources:
  - url: https://emotion.sh/docs/introduction
    title: "Introduction — Emotion"
    checked: 2026-10-15
  - url: https://emotion.sh/docs/css-prop
    title: "The css Prop — Emotion"
    checked: 2026-10-15
  - url: https://emotion.sh/docs/composition
    title: "Composition — Emotion"
    checked: 2026-10-15
  - url: https://emotion.sh/docs/styled
    title: "Styled Components — Emotion"
    checked: 2026-10-15
  - url: https://emotion.sh/docs/theming
    title: "Theming — Emotion"
    checked: 2026-10-15
  - url: https://emotion.sh/docs/ssr
    title: "Server Side Rendering — Emotion"
    checked: 2026-10-15
  - url: https://emotion.sh/docs/best-practices
    title: "Best Practices — Emotion"
    checked: 2026-10-15
  - url: https://nextjs.org/docs/app/guides/css-in-js
    title: "How to use CSS-in-JS libraries — Next.js"
    checked: 2026-10-15
---

::: abstract
**Emotion**은 JavaScript 안에 쓴 스타일을 컴포넌트가 렌더될 때 CSS 규칙으로 바꿔 문서에 넣는 [[css-in-js|CSS-in-JS]] 라이브러리다.
스타일을 [[serialize|직렬화]]하고 [[hash|해시]]해 `css-1gic02d` 같은 class 이름을 만들고, 처음 보는 해시만 규칙으로 삽입한다.
여러 스타일을 합성하면 하나의 규칙으로 합쳐지므로 우선순위가 class 순서나 스타일시트 순서가 아니라 코드에 적은 배열 순서로 정해진다.
:::

::: notice
이 글의 출력 예시는 `@emotion/react` 11.14.0, `@emotion/styled` 11.14.1, `@emotion/css` 11.13.5 로 직접 렌더한 결과다 (2026-10-15).
:::

## 1. 문제 상황

기본 스타일과 위험 상태 스타일을 class 두 개로 나눠 두고, 위험 상태에서는 두 class를 함께 붙였다.

```css
.danger { color: red; }
.base { color: turquoise; background-color: lightgray; }
```

```html
<p class="base danger">삭제할까요?</p>
```

글자는 빨간색이 아니라 청록색이다. `class` 속성의 순서는 결과에 영향을 주지 않는다.
두 선택자의 명시도가 (0,1,0) 으로 같아서 스타일시트에 나중에 나온 `.base` 가 이긴다<a href="https://emotion.sh/docs/composition" target="_blank"><sup>[3]</sup></a>.
`.danger` 를 아래로 옮기거나 `!important` 를 붙이면 해결되지만, 그러면 class를 조합하는 쪽이 아니라 CSS 파일 순서를 관리하는 쪽에서 우선순위를 정해야 한다.

---

## 2. 정의

### 2.1 CSS-in-JS

Emotion은 스타일을 JavaScript 값으로 다룬다. 스타일은 문자열([[tagged-template|태그드 템플릿]])이나 객체로 쓸 수 있고, 변수와 함수를 그대로 쓸 수 있다<a href="https://emotion.sh/docs/introduction" target="_blank"><sup>[1]</sup></a>.

::: tabs
== 문자열 스타일
```jsx
import { css } from "@emotion/react";

const base = css`
  padding: 8px 16px;
  color: white;
  background: hotpink;
`;
```
== 객체 스타일
```jsx
import { css } from "@emotion/react";

const base = css({
  padding: "8px 16px",
  color: "white",
  background: "hotpink",
});
```
:::

객체 스타일은 속성 이름을 camelCase 로 쓴다. TypeScript 와 함께 쓰면 속성 이름과 값의 타입을 검사할 수 있어 Emotion 문서는 객체 스타일을 권장한다<a href="https://emotion.sh/docs/best-practices" target="_blank"><sup>[7]</sup></a>.

### 2.2 패키지 구성

| 패키지 | 제공하는 것 | React 필요 |
|---|---|---|
| `@emotion/react` | `css` prop, `css`, `ThemeProvider`, `Global`, `keyframes` | 예 |
| `@emotion/styled` | `styled.button` 형태의 스타일 컴포넌트 | 예 |
| `@emotion/css` | class 이름을 돌려주는 `css`, class를 합성하는 `cx` | 아니오 |

React 프로젝트는 `@emotion/react` 를 기본으로 쓰고, 필요하면 `@emotion/styled` 를 더한다. `@emotion/css` 는 프레임워크와 상관없이 class 이름 문자열만 필요할 때 쓴다<a href="https://emotion.sh/docs/introduction" target="_blank"><sup>[1]</sup></a>.

---

## 3. 동작 원리

![Emotion 런타임 처리 과정](/post-assets/frontend/styling/emotion-runtime.svg "css prop 의 스타일은 직렬화, 해시, 캐시 확인, 규칙 삽입을 거쳐 css-해시 class 가 된다. 이미 삽입한 해시면 삽입을 건너뛴다.")

### 3.1 렌더할 때 class 를 만든다

1장의 두 스타일을 Emotion으로 옮기면 다음과 같다.

```jsx
const base = css`
  padding: 8px 16px;
  color: white;
  background: hotpink;
`;
const danger = css`background: crimson;`;

<p css={[base, danger]}>삭제할까요?</p>
```

컴포넌트가 렌더되면 Emotion은 다섯 단계를 거친다.

1. **직렬화**: 배열에 든 스타일을 순서대로 이어 붙여 문자열 하나로 만든다.
2. **해시**: 그 문자열의 MurmurHash2 값을 계산한다. 결과는 `1gic02d` 다.
3. **캐시 확인**: 이 해시의 규칙을 이미 문서에 넣었는지 확인한다.
4. **규칙 삽입**: 처음 보는 해시면 `<style data-emotion="css">` 요소에 `.css-1gic02d { … }` 규칙을 넣는다.
5. **class 부여**: 요소의 `className` 을 `css-1gic02d` 로 정한다.

같은 내용의 스타일은 해시가 같으므로, 같은 버튼을 100개 렌더해도 규칙은 하나만 들어간다.

```seq
title: css prop 하나가 class 가 되는 과정
speed: 1600
caption: 해시가 캐시에 있으면 규칙 삽입을 건너뛴다.

lane input  입력 스타일
lane cache  캐시 (삽입한 해시)
lane dom    문서 #log

step 렌더가 시작된다. css prop 에 [base, danger] 배열이 들어 있다.
  push input base
  push input danger
step 배열 순서대로 이어 붙여 문자열 하나로 직렬화하고, MurmurHash2 로 1gic02d 를 얻는다.
  pop input
  pop input
  push input …hotpink;background:crimson;
step 캐시에 1gic02d 가 없다. 해시를 기록하고 style 요소에 규칙을 넣는다.
  move input cache 1gic02d
  log dom .css-1gic02d { … } 삽입
step 요소에 class="css-1gic02d" 를 붙인다.
  log dom <p class="css-1gic02d">
step 같은 스타일의 두 번째 p 가 렌더된다. 해시가 같으므로 캐시에서 찾고, 삽입 없이 class 만 붙인다.
  mark cache
  log dom <p class="css-1gic02d"> (삽입 없음)
```

### 3.2 합성: 배열 뒤쪽이 이긴다

`[base, danger]` 를 실제로 렌더하면 두 스타일이 규칙 하나로 합쳐진다<a href="https://emotion.sh/docs/composition" target="_blank"><sup>[3]</sup></a>.

```css
.css-1gic02d{padding:8px 16px;color:white;background:hotpink;background:crimson;}
```

한 규칙 안에 `background` 가 두 번 있으면 뒤의 선언이 적용된다. 그래서 배열 뒤쪽에 쓴 `danger` 가 이긴다.
1장처럼 스타일시트 순서를 신경 쓸 필요가 없다. 우선순위를 코드에 적은 배열 순서로 정한다.

프레임워크와 상관없는 `@emotion/css` 의 `cx` 도 같은 방식이다. Emotion이 만든 class 들을 받아 인자 순서대로 합친 새 class를 만든다.

```js
import { css, cx } from "@emotion/css";

const a = css`padding: 4px; color: red;`; // "css-11885fe"
const b = css`color: blue;`;              // "css-14jcta0"

cx(a, b); // "css-p2t3w5"  → .css-p2t3w5{padding:4px;color:red;color:blue;}
cx(b, a); // "css-1eb3fbe" → .css-1eb3fbe{color:blue;padding:4px;color:red;}
```

`cx(a, b)` 는 파란색, `cx(b, a)` 는 빨간색이다. 인자 순서를 바꾸면 결과가 바뀐다.

### 3.3 css prop 을 쓰려면 JSX 변환을 바꾼다

`css` 는 HTML 속성이 아니다. JSX가 React의 기본 `jsx` 함수로 변환되면 React는 `css` 를 알 수 없는 속성으로 보고 그대로 출력한다.
변환 설정 없이 렌더하면 결과는 `<p css="[object Object]">` 이고 스타일은 적용되지 않는다.

JSX 를 Emotion의 `jsx` 함수로 변환하도록 설정해야 한다. 방법은 둘이다<a href="https://emotion.sh/docs/css-prop" target="_blank"><sup>[2]</sup></a>.

::: tabs
== 파일마다 pragma 주석
```jsx
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

export function Alert() {
  return <p css={css`color: crimson;`}>삭제할까요?</p>;
}
```
== Babel 설정 (자동 런타임)
```json
{
  "presets": [
    ["@babel/preset-react", { "runtime": "automatic", "importSource": "@emotion/react" }]
  ],
  "plugins": ["@emotion/babel-plugin"]
}
```
:::

TypeScript 는 `tsconfig.json` 의 `"jsxImportSource": "@emotion/react"` 로 같은 설정을 한다. `@emotion/styled` 와 `@emotion/css` 는 일반 함수 호출이라 JSX 설정이 필요 없다.

### 3.4 값이 바뀌면 새 규칙이 생긴다

`styled` 의 보간 함수는 props 를 받아 값을 정한다<a href="https://emotion.sh/docs/styled" target="_blank"><sup>[4]</sup></a>.

```jsx
const Button = styled.button`
  padding: 8px 16px;
  color: ${(p) => (p.primary ? "white" : "black")};
`;

<Button primary>저장</Button>   // class="css-3swxnk"
<Button>취소</Button>           // class="css-dz4ebc"
```

보간 결과가 다르면 직렬화한 문자열이 다르고, 해시도 다르다. 값이 다른 경우마다 규칙이 하나씩 추가된다.
두 가지 값이면 문제가 없지만, 너비를 `${p => p.w}%` 로 받아 10%, 20%, 30%, 40%, 50% 로 렌더하면 규칙이 5개 생긴다.
같은 막대를 `style={{ width }}` 로 렌더하면 규칙은 1개다.

Emotion 문서는 자주 바뀌거나 요소마다 다른 값은 `css` 나 `styled` 가 아니라 `style` 속성으로 넘기라고 권한다<a href="https://emotion.sh/docs/best-practices" target="_blank"><sup>[7]</sup></a>.

### 3.5 테마

`ThemeProvider` 에 넘긴 객체는 `styled` 의 `props.theme`, 또는 `css` prop 에 넘긴 함수의 인자로 받는다<a href="https://emotion.sh/docs/theming" target="_blank"><sup>[5]</sup></a>.

```jsx
import { ThemeProvider } from "@emotion/react";

<ThemeProvider theme={{ color: { brand: "#7c3aed" } }}>
  <span css={(theme) => ({ color: theme.color.brand })}>테마 색</span>
</ThemeProvider>
```

렌더 결과는 `.css-nd7dc1{color:#7c3aed;}` 다. 테마 값은 렌더할 때 CSS 규칙에 숫자와 색으로 들어간다.
CSS 변수(`var(--brand)`)로 바꾸는 방식과 달리, 테마 객체가 바뀌면 그 테마를 쓰는 컴포넌트가 다시 렌더되어 새 규칙을 만든다.

### 3.6 서버 렌더링

`@emotion/react` 와 `@emotion/styled` 만 쓰면 [[ssr|서버 렌더링]]에 추가 설정이 필요 없다. `renderToString` 결과에서 스타일을 쓰는 요소 바로 앞에 `<style>` 이 들어간다<a href="https://emotion.sh/docs/ssr" target="_blank"><sup>[6]</sup></a>.

```html
<style data-emotion="css 3swxnk">.css-3swxnk{padding:8px 16px;color:white;}</style>
<button class="css-3swxnk">저장</button>
```

이 방식은 스트리밍 렌더링과도 동작한다. 다만 본문 사이에 `<style>` 요소가 끼므로 `:nth-child` 같은 선택자의 계산이 달라진다.
그런 선택자를 써야 하면 `@emotion/server` 로 렌더 결과에서 쓰인 규칙만 뽑아 `<head>` 에 넣는 방식을 쓴다. 이 방식은 스트리밍과 함께 쓸 수 없다<a href="https://emotion.sh/docs/ssr" target="_blank"><sup>[6]</sup></a>.

::: warning
**[[rsc|React Server Components]]에서는 쓸 수 없다**

Emotion은 캐시와 테마를 React Context로 전달한다. 서버 컴포넌트는 Context를 쓸 수 없으므로 Emotion을 쓰는 컴포넌트는 `"use client"` 를 붙인 클라이언트 컴포넌트여야 한다.
Next.js App Router 문서는 2026-10-15 기준으로 Emotion을 「지원 작업 중」 목록에 두고 있다<a href="https://nextjs.org/docs/app/guides/css-in-js" target="_blank"><sup>[8]</sup></a>.
:::

---

## 4. 예제

### 4.1 값마다 규칙이 쌓이는 모습

아래 예제는 막대 두 개의 너비를 슬라이더로 바꾼다. 분홍 막대는 너비를 `styled` 보간으로, 보라 막대는 `style` 속성으로 넘긴다.
슬라이더를 움직이면서 문서에 삽입된 Emotion 규칙 수를 본다.

```playground
#! react title=Bars.jsx height=260
import { useState, useEffect } from "react";
import styled from "https://esm.sh/@emotion/styled@11.14.1?deps=react@18.3.1";

// 너비가 바뀔 때마다 새 규칙이 생긴다
const BarByCss = styled.div`
  height: 12px;
  border-radius: 6px;
  background: #d26ac2;
  width: ${(p) => p.w}%;
`;

// 규칙은 하나, 너비는 style 속성으로
const BarByStyle = styled.div`
  height: 12px;
  border-radius: 6px;
  background: #7c3aed;
`;

function countRules() {
  let n = 0;
  for (const s of document.querySelectorAll("style[data-emotion]")) {
    n += s.sheet.cssRules.length;
  }
  return n;
}

export default function App() {
  const [w, setW] = useState(30);
  const [rules, setRules] = useState(0);
  useEffect(() => setRules(countRules()), [w]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <input type="range" min="10" max="100" value={w}
        onChange={(e) => setW(Number(e.target.value))} />
      <BarByCss w={w} />
      <BarByStyle style={{ width: `${w}%` }} />
      <p>너비 {w}% · 삽입된 규칙 {rules}개</p>
    </div>
  );
}
```

처음에는 규칙이 2개다. 슬라이더를 처음 보는 값으로 옮길 때마다 분홍 막대의 규칙이 하나씩 늘어난다. 이미 지나간 값으로 돌아가면 캐시에 있으므로 늘지 않는다.

### 4.2 같은 버튼을 세 API로

::: tabs
== css prop
```jsx
/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";

const button = css({
  padding: "8px 16px",
  borderRadius: 8,
  background: "#7c3aed",
  color: "white",
});

export const Save = () => <button css={button}>저장</button>;
```
== styled
```jsx
import styled from "@emotion/styled";

export const Save = styled.button({
  padding: "8px 16px",
  borderRadius: 8,
  background: "#7c3aed",
  color: "white",
});
```
== @emotion/css
```js
import { css } from "@emotion/css";

const button = css({
  padding: "8px 16px",
  borderRadius: 8,
  background: "#7c3aed",
  color: "white",
});

el.className = button; // "css-…" 문자열
```
:::

`borderRadius: 8` 처럼 단위 없는 숫자는 `px` 로 출력된다. 객체 스타일 `{ padding: 8, fontSize: 14 }` 는 `padding:8px;font-size:14px;` 가 된다.

---

## 5. 자주 하는 실수

::: warning
**className 을 받지 않는 컴포넌트에 css prop 주기**

`css` prop 은 자식 컴포넌트에 `className` 으로 전달된다. 컴포넌트가 `className` 을 받아 DOM에 넘기지 않으면 규칙은 삽입되지만 어떤 요소에도 붙지 않는다.
실제로 렌더하면 `<style>…</style><p>a</p>` 처럼 class 없는 요소가 나온다<a href="https://emotion.sh/docs/best-practices" target="_blank"><sup>[7]</sup></a>.
:::

::: warning
**자주 바뀌는 값을 보간으로 넘기기**

애니메이션 좌표, 드래그 위치, 사용자마다 다른 이미지 URL 을 `styled` 보간이나 `css` 로 넘기면 값마다 규칙이 쌓이고, 매번 직렬화와 해시를 다시 계산한다. 이런 값은 `style` 속성이나 CSS 변수로 넘긴다.
:::

::: caution
**컴포넌트 함수 안에서 매번 스타일 객체를 새로 만들기**

내용이 같으면 해시도 같아 규칙은 늘지 않는다. 하지만 렌더할 때마다 직렬화와 해시 계산은 다시 한다. 값이 고정된 스타일은 컴포넌트 밖에 상수로 둔다.
:::

::: caution
**Emotion 과 다른 스타일링 방식 섞기**

Emotion 규칙은 레이어 없이 `<head>` 에 들어간다. Tailwind CSS 의 유틸리티는 `@layer utilities` 안에 있으므로, 둘이 같은 속성을 정하면 명시도와 상관없이 Emotion 규칙이 이긴다.
레이어 밖 규칙이 레이어 안 규칙보다 강한 이유는 [CSS 캐스케이드와 명시도 →](/post/css-cascade) 3.3절에서 설명한다.
:::

---

## 6. 정리

Emotion은 렌더 시점에 스타일을 직렬화하고 MurmurHash2 로 해시해 `css-해시` class 를 만들고, 처음 보는 해시만 `<style data-emotion>` 에 규칙으로 넣는다.
합성은 규칙 하나로 합쳐지므로 배열이나 `cx` 인자의 뒤쪽이 이긴다. 대신 스타일 계산이 브라우저에서 일어나므로 값이 자주 바뀌는 스타일은 `style` 속성으로 넘기고, 서버 컴포넌트에서는 쓸 수 없다.

| | Sass | Tailwind CSS | Emotion |
|---|---|---|---|
| CSS를 만드는 시점 | 빌드 | 빌드 | 렌더(런타임) |
| JavaScript 값 사용 | 불가 | 클래스 이름 매핑만 | 그대로 사용 |
| 우선순위 결정 | 스타일시트 순서 | 생성된 CSS 순서 | 합성 배열 순서 |
| 서버 컴포넌트 | 가능 | 가능 | 클라이언트 컴포넌트만 |

- [ ] `[base, danger]` 에서 `danger` 가 이기는 이유를 규칙 하나로 합쳐지는 과정으로 설명할 수 있다
- [ ] 같은 버튼을 100번 렌더해도 규칙이 하나인 이유를 안다
- [ ] pragma 없이 css prop 을 쓰면 어떤 HTML 이 나오는지 안다
- [ ] 자주 바뀌는 값을 `style` 속성으로 넘겨야 하는 이유를 안다
- [ ] Emotion 컴포넌트에 `"use client"` 가 필요한 이유를 안다

## 참고

<ol>
<li><a href="https://emotion.sh/docs/introduction" target="_blank">[1] Introduction — Emotion</a></li>
<li><a href="https://emotion.sh/docs/css-prop" target="_blank">[2] The css Prop — Emotion</a></li>
<li><a href="https://emotion.sh/docs/composition" target="_blank">[3] Composition — Emotion</a></li>
<li><a href="https://emotion.sh/docs/styled" target="_blank">[4] Styled Components — Emotion</a></li>
<li><a href="https://emotion.sh/docs/theming" target="_blank">[5] Theming — Emotion</a></li>
<li><a href="https://emotion.sh/docs/ssr" target="_blank">[6] Server Side Rendering — Emotion</a></li>
<li><a href="https://emotion.sh/docs/best-practices" target="_blank">[7] Best Practices — Emotion</a></li>
<li><a href="https://nextjs.org/docs/app/guides/css-in-js" target="_blank">[8] How to use CSS-in-JS libraries — Next.js</a></li>
</ol>

---

## 관련 글

- [CSS 캐스케이드와 명시도 →](/post/css-cascade) (선행 개념: 같은 명시도에서 등장 순서로 정해지는 규칙)
- [Tailwind CSS 유틸리티 생성 과정 →](/post/tailwind-css) (빌드 시점에 CSS를 만드는 방식과 비교)
- [Sass 전처리와 SCSS 모듈 →](/post/sass-scss)
- [shadcn/ui 컴포넌트 배포 방식과 구조 →](/post/shadcn-ui)
