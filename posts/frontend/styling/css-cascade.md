---
title: "CSS 캐스케이드와 명시도"
coverImage: /post-thumbnails/css-cascade.svg
slug: css-cascade
category: frontend/styling
concept: css-cascade
tags: [css, cascade, specificity, cascade-layers, 명시도]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-10-15
excerpt: >
  한 속성에 선언이 여러 개면 브라우저는 출처와 중요도, 컨텍스트, style 속성, 레이어, 명시도, 등장 순서 순으로 비교해 하나를 고른다. 앞 단계에서 차이가 나면 뒤 단계는 보지 않으므로 명시도가 다른 선언은 순서와 무관하게 결정된다.
glossary:
  ua-stylesheet: "브라우저가 모든 페이지에 기본으로 적용하는 스타일시트. 제목 글자 크기, 목록 들여쓰기 같은 기본 모양을 정한다."
  shadow-dom: "요소 안에 바깥 문서와 분리된 DOM 트리를 붙이는 웹 표준. 웹 컴포넌트가 내부 마크업과 스타일을 감출 때 쓴다."
  pseudo-class: "요소의 상태를 고르는 선택자. :hover, :focus, :nth-child() 처럼 콜론 하나로 시작한다."
  pseudo-element: "요소의 일부나 가상의 자식을 고르는 선택자. ::before, ::placeholder 처럼 콜론 두 개로 시작한다."
  cascaded-value: "캐스케이드가 한 요소의 한 속성에 대해 고른 최종 선언 값. 선언이 하나도 없으면 상속값이나 초기값이 쓰인다."
sources:
  - url: https://www.w3.org/TR/css-cascade-5/
    title: "CSS Cascading and Inheritance Level 5 — W3C"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade
    title: "Introduction to the CSS cascade — MDN Web Docs"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity
    title: "Specificity — MDN Web Docs"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/en-US/docs/Web/CSS/@layer
    title: "@layer — MDN Web Docs"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance
    title: "Inheritance — MDN Web Docs"
    checked: 2026-10-15
---

::: abstract
**캐스케이드**는 한 요소의 한 속성에 적용될 수 있는 선언이 여러 개일 때 하나를 고르는 알고리즘이다.
비교는 출처와 중요도, 컨텍스트, style 속성, 레이어, 명시도, 등장 순서의 6단계로 진행되고, 앞 단계에서 차이가 나면 뒤 단계는 비교하지 않는다.
:::

## 1. 문제 상황

다음 버튼은 마우스를 올려도 파란색이나 남색이 되지 않고 회색으로 남는다.

```html
<button id="buy" class="btn primary">구매</button>
```

```css
#buy { background: gray; }
.btn.primary { background: blue; }
button.primary:hover { background: navy; }
```

`.btn.primary` 는 `#buy` 보다 뒤에 있고, `:hover` 규칙은 더 구체적인 상황을 가리키는 것처럼 보인다.
그런데도 세 선언 중 `#buy` 가 선택된다. 브라우저는 선언 순서보다 명시도를 먼저 비교하고,
ID 선택자 하나는 클래스 선택자 몇 개를 합쳐도 넘을 수 없기 때문이다.

---

## 2. 정의

### 2.1 캐스케이드

**캐스케이드(cascade)** 는 한 요소의 한 속성에 대해 여러 선언 가운데 하나를 골라
[[cascaded-value|캐스케이드 값]]을 정하는 과정이다<a href="https://www.w3.org/TR/css-cascade-5/" target="_blank"><sup>[1]</sup></a>.
경쟁은 속성 단위로 일어난다. 같은 규칙 안의 `color` 와 `background` 는 서로 다른 선언에서 올 수 있다.

### 2.2 사양에서의 위치

CSS Cascading and Inheritance Level 5 의 6절 "Cascading" 이 비교 순서를 정한다<a href="https://www.w3.org/TR/css-cascade-5/" target="_blank"><sup>[1]</sup></a>.

| 순서 | 기준 | 비교 내용 |
|---|---|---|
| 1 | 출처와 중요도 | 브라우저 기본, 사용자, 작성자 스타일. `!important` 여부 |
| 2 | 컨텍스트 | 섀도 DOM 안의 스타일과 바깥 스타일 |
| 3 | 요소에 붙은 스타일 | `style` 속성으로 직접 단 선언 |
| 4 | 레이어 | `@layer` 로 나눈 레이어의 순서 |
| 5 | 명시도 | 선택자의 (ID, 클래스, 타입) 개수 |
| 6 | 등장 순서 | 문서에서 나중에 나온 선언 |

![캐스케이드 정렬 기준 6단계](/post-assets/frontend/styling/cascade-sort.svg "캐스케이드 정렬 기준. 위 단계에서 결정되면 아래 단계는 비교하지 않는다. 출처: CSS Cascading and Inheritance Level 5, 6.1절")

---

## 3. 동작 원리

### 3.1 출처와 중요도

선언은 세 출처 중 하나에서 온다. 브라우저의 [[ua-stylesheet|기본 스타일시트]](user-agent), 사용자가 브라우저 설정으로 넣은 스타일(user),
페이지 작성자가 쓴 스타일(author)이다. 여기에 `!important` 여부가 겹쳐 우선순위가 정해진다<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade" target="_blank"><sup>[2]</sup></a>.

| 우선순위 (높음 → 낮음) | 출처 |
|---|---|
| 1 | 진행 중인 transition |
| 2 | 브라우저 기본 `!important` |
| 3 | 사용자 `!important` |
| 4 | 작성자 `!important` |
| 5 | 진행 중인 animation |
| 6 | 작성자 일반 선언 |
| 7 | 사용자 일반 선언 |
| 8 | 브라우저 기본 일반 선언 |

일반 선언은 작성자가 가장 강하지만 `!important` 선언은 순서가 뒤집혀 브라우저 기본값이 가장 강하다.
사용자가 접근성 때문에 `!important` 로 지정한 글자 크기를 페이지가 덮어쓰지 못하게 하려는 설계다.

### 3.2 컨텍스트와 style 속성

[[shadow-dom|섀도 DOM]]을 쓰는 웹 컴포넌트에서는 컴포넌트 바깥 스타일과 안쪽 스타일이 경쟁한다.
일반 선언은 바깥 스타일이, `!important` 선언은 안쪽 스타일이 이긴다.

`style` 속성으로 단 선언은 선택자가 없으므로 명시도로 비교하지 않는다.
같은 출처·중요도 안에서 3단계에서 바로 이긴다. 그래서 레이어 순서나 ID 선택자로도 덮을 수 없고, `!important` 만 넘을 수 있다.

### 3.3 레이어

`@layer` 는 작성자 스타일을 이름 붙은 묶음으로 나누고 묶음 사이의 우선순위를 명시하는 규칙이다<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@layer" target="_blank"><sup>[4]</sup></a>.
레이어 비교는 명시도보다 먼저 일어난다.

```css
@layer reset, base, components;

@layer components {
  .btn { background: blue; }   /* (0,1,0) */
}

@layer base {
  #buy { background: gray; }   /* (1,0,0) 이지만 진다 */
}
```

`#buy` 의 명시도가 더 높지만 `base` 레이어가 `components` 보다 먼저 선언됐으므로 `.btn` 이 이긴다.
레이어 규칙은 다음 세 가지로 정리된다.

- 일반 선언: 나중에 선언된 레이어가 이긴다.
- 레이어에 속하지 않은 스타일은 마지막 레이어로 취급되어 모든 레이어를 이긴다.
- `!important` 선언: 순서가 뒤집혀 먼저 선언된 레이어가 이긴다.

### 3.4 명시도

**명시도(specificity)** 는 선택자가 요소를 얼마나 좁게 가리키는지를 (A, B, C) 세 수로 나타낸 값이다<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity" target="_blank"><sup>[3]</sup></a>.

| 칸 | 세는 대상 |
|---|---|
| A | ID 선택자 `#id` |
| B | 클래스 `.c`, 속성 선택자 `[type]`, 의사 클래스 `:hover` |
| C | 타입 선택자 `button`, 의사 요소 `::before` |

비교는 A부터 한다. A가 크면 B와 C는 보지 않는다. 그래서 (1,0,0) 은 (0,20,0) 보다 높다.
[[pseudo-class|의사 클래스]] 가운데 `:is()`, `:not()`, `:has()` 는 자기 자신은 세지 않고 괄호 안 인자 중 가장 높은 명시도를 쓴다.
`:where()` 는 인자와 관계없이 항상 (0,0,0) 이다. 전체 선택자 `*` 와 결합자(` `, `>`, `+`, `~`)도 0이다.

| 선택자 | 명시도 |
|---|---|
| `#buy` | (1,0,0) |
| `button.primary:hover` | (0,2,1) |
| `.btn.primary` | (0,2,0) |
| `ul li:not(.done)` | (0,1,2) |
| `:is(#nav, .menu) a` | (1,0,1) |
| `:where(.card) p` | (0,0,1) |
| `p::first-line` | (0,0,2) |

1장의 버튼에서 일어난 비교를 단계별로 재생하면 다음과 같다.

```seq
title: 1장 버튼의 background 가 결정되는 과정
speed: 1700
caption: 명시도에서 승부가 나면 등장 순서는 비교하지 않는다.

lane cand  후보 선언
lane judge 비교 기록 #log
lane win   캐스케이드 값 #stack

step background 에 적용될 수 있는 선언 세 개를 모은다. 마우스를 올린 상태라 :hover 규칙도 후보다.
  push cand #buy gray
  push cand .btn.primary blue
  push cand button.primary:hover navy
step 1단계. 세 선언 모두 작성자 일반 선언이라 출처와 중요도가 같다.
  log judge 출처·중요도 같음
step 2~4단계. 섀도 DOM, style 속성, 레이어가 없으므로 모두 같다.
  log judge 컨텍스트·style·레이어 같음
step 5단계. 명시도는 (1,0,0), (0,2,0), (0,2,1) 이다. A 칸이 1인 #buy 가 이긴다.
  mark cand
  log judge 명시도 (1,0,0) 승
step 승부가 났으므로 6단계 등장 순서는 비교하지 않는다. #buy 의 gray 가 캐스케이드 값이 된다.
  move cand win gray
```

### 3.5 등장 순서와 상속

앞 다섯 단계가 모두 같으면 문서에서 나중에 나온 선언이 이긴다. `<link>` 와 `<style>` 이 여러 개면 문서에 나온 순서대로 이어 붙인 것으로 본다.

선언이 하나도 없는 속성은 캐스케이드가 고를 것이 없다. 이때 상속 속성(`color`, `font-family`, `line-height` 등)은 부모의 계산값을 물려받고,
비상속 속성(`margin`, `border`, `background` 등)은 초기값을 쓴다<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance" target="_blank"><sup>[5]</sup></a>.
이 동작은 키워드로 바꿀 수 있다.

| 키워드 | 동작 |
|---|---|
| `inherit` | 부모 값을 쓴다 |
| `initial` | 속성의 초기값을 쓴다 |
| `unset` | 상속 속성이면 `inherit`, 아니면 `initial` |
| `revert` | 작성자 스타일을 없던 것으로 하고 사용자·브라우저 기본값으로 돌아간다 |
| `revert-layer` | 현재 레이어의 선언을 없던 것으로 하고 이전 레이어 값으로 돌아간다 |

---

## 4. 예제

### 4.1 레이어 밖 스타일과 레이어 안 스타일

아래 예제의 버튼은 초록색이다. 레이어 밖의 `button` (0,0,1) 이 `components` 레이어의 `.btn` (0,1,0) 을 이긴다.
`/* 레이어 밖 */` 줄을 지우고 실행하면 파란색이 된다. 그 상태에서 `@layer` 첫 줄을 `components, base` 로 바꾸면 회색이 된다.

```playground
#! html title=layers.html height=200
<style>
  @layer base, components;

  @layer components {
    .btn { background: #2563eb; color: white; }
  }

  @layer base {
    button { background: #9ca3af; padding: 10px 16px; border: 0; border-radius: 8px; font-size: 16px; }
  }

  button { background: #16a34a; } /* 레이어 밖 */
</style>

<button class="btn">background 는 어디서 왔나</button>
```

### 4.2 실무 패턴

::: tabs
== 낮은 명시도의 기본 스타일
리셋이나 기본 스타일은 `:where()` 로 감싸면 명시도가 (0,0,0) 이 되어, 이후 어떤 선택자로도 덮을 수 있다.

```css
:where(ul, ol)[role="list"] {
  list-style: none;
  padding: 0;
}
```

== 레이어로 우선순위 고정
외부 CSS를 레이어에 넣으면 그 안의 명시도가 아무리 높아도 레이어 밖의 내 스타일이 이긴다.

```css
@import url("vendor.css") layer(vendor);

.card { padding: 16px; }  /* vendor.css 의 #app .card 보다 강하다 */
```

== Tailwind CSS v4
Tailwind CSS v4 의 `@import "tailwindcss"` 는 `@layer theme, base, components, utilities;` 를 선언한다.
레이어 밖에 쓴 CSS는 유틸리티 클래스보다 강하다. 자세한 구조는 [Tailwind CSS 유틸리티 생성 과정 →](/post/tailwind-css) 에서 다룬다.
:::

---

## 5. 자주 하는 실수

::: warning
**순서로 해결하려는 시도**

선언을 파일 아래로 옮겨도 명시도가 낮으면 이기지 못한다. 등장 순서는 6단계 중 마지막 기준이다.
먼저 두 선택자의 명시도를 (A, B, C) 로 적어 비교한다.
:::

::: warning
**`!important` 로 덮어쓰기**

`!important` 는 1단계의 중요도를 바꾸므로 이후 모든 일반 선언을 이긴다. 이것을 다시 덮으려면 또 `!important` 가 필요하다.
레이어 안에서는 순서가 뒤집혀 먼저 선언된 레이어의 `!important` 가 이긴다는 점도 함께 기억한다.
:::

::: caution
**ID 선택자로 스타일 작성**

ID 하나는 (1,0,0) 이라 클래스 조합으로 덮을 수 없다. 컴포넌트 스타일은 클래스로 쓰고, 기본값은 `:where()` 로 명시도를 낮춘다.
[[pseudo-element|의사 요소]]와 의사 클래스의 명시도도 칸이 다르다는 점을 표로 확인한다.
:::

---

## 6. 정리

캐스케이드는 출처와 중요도, 컨텍스트, style 속성, 레이어, 명시도, 등장 순서 순서로 선언을 비교한다.
앞 단계에서 결정되면 뒤 단계는 보지 않는다. 작성자가 주로 조절하는 것은 레이어, 명시도, 등장 순서다.

- [ ] 1장 버튼이 회색인 이유를 명시도 (A, B, C) 로 설명할 수 있다
- [ ] 레이어 밖 스타일이 레이어 안 스타일보다 강한 이유를 안다
- [ ] `:is()` 와 `:where()` 의 명시도 차이를 설명할 수 있다
- [ ] `!important` 가 레이어 순서를 뒤집는다는 것을 안다

## 참고

<ol>
<li><a href="https://www.w3.org/TR/css-cascade-5/" target="_blank">[1] CSS Cascading and Inheritance Level 5 — W3C</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade" target="_blank">[2] Introduction to the CSS cascade — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity" target="_blank">[3] Specificity — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@layer" target="_blank">[4] @layer — MDN Web Docs</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance" target="_blank">[5] Inheritance — MDN Web Docs</a></li>
</ol>

---

## 관련 글

- [Sass 전처리와 SCSS 모듈 →](/post/sass-scss) (중첩이 명시도를 높이는 과정)
- [Tailwind CSS 유틸리티 생성 과정 →](/post/tailwind-css) (레이어를 쓰는 CSS 프레임워크)
- [shadcn/ui 컴포넌트 배포 방식과 구조 →](/post/shadcn-ui)
