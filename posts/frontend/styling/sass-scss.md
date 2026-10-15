---
title: "Sass 전처리와 SCSS 모듈"
coverImage: /post-thumbnails/sass-scss.svg
slug: sass-scss
category: frontend/styling
concept: sass
tags: [sass, scss, css, "@use", 전처리기]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-10-15
excerpt: >
  Sass는 빌드 시점에 CSS로 컴파일되는 스타일시트 언어이고 SCSS는 CSS 문법을 그대로 포함하는 Sass의 구문이다. Sass 변수와 믹스인은 컴파일 단계에서 값으로 바뀌어 사라지므로, 런타임에 바꿔야 하는 값은 CSS 사용자 정의 속성으로 둔다.
glossary:
  preprocessor: "다른 언어로 쓴 코드를 빌드 단계에서 목표 언어로 바꾸는 도구. Sass는 SCSS 파일을 CSS 파일로 바꾼다."
  custom-property: "--brand 처럼 두 개의 하이픈으로 시작하는 CSS 속성. var(--brand) 로 읽으며, 캐스케이드와 상속을 따르고 런타임에 바꿀 수 있다."
  namespace: "모듈에서 가져온 멤버 앞에 붙는 이름. @use \"tokens\" 로 불러오면 tokens.$brand 처럼 접근한다."
  partial: "파일명이 밑줄로 시작하는 Sass 파일. 단독 CSS로 출력되지 않고 다른 파일이 @use 로 불러 쓴다."
  dart-sass: "Sass 팀이 유지하는 기본 구현. npm 의 sass 패키지가 Dart Sass를 JavaScript로 컴파일한 것이다."
sources:
  - url: https://sass-lang.com/documentation/syntax/
    title: "Syntax — Sass Documentation"
    checked: 2026-10-15
  - url: https://sass-lang.com/documentation/at-rules/use/
    title: "@use — Sass Documentation"
    checked: 2026-10-15
  - url: https://sass-lang.com/documentation/at-rules/mixin/
    title: "@mixin and @include — Sass Documentation"
    checked: 2026-10-15
  - url: https://sass-lang.com/documentation/breaking-changes/import/
    title: "Breaking Change: @import and global built-in functions — Sass Documentation"
    checked: 2026-10-15
  - url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting
    title: "Using CSS nesting — MDN Web Docs"
    checked: 2026-10-15
---

::: abstract
**Sass**는 변수, 중첩, 믹스인, 모듈을 지원하는 스타일시트 언어이며 빌드 시점에 일반 CSS로 컴파일된다.
컴파일이 끝나면 Sass 변수와 믹스인은 값으로 치환되어 사라지므로, 브라우저에서 바뀌어야 하는 값은 Sass 변수가 아니라 CSS 사용자 정의 속성으로 둔다.
:::

::: notice
이 글의 컴파일 결과는 Dart Sass 1.105.1 (npm `sass` 패키지)로 직접 컴파일한 출력이다 (2026-10-15).
:::

## 1. 문제 상황

다크 모드에서 카드 배경을 검정으로 바꾸려고 `.dark` 안에서 같은 이름의 변수에 새 값을 넣었다.

```scss
$bg: white;

.card {
  background: $bg;
}

.dark {
  $bg: black;
}
```

컴파일 결과는 다음과 같다.

```css
.card {
  background: white;
}
```

`.dark` 블록은 출력에서 통째로 사라졌다. `$bg` 는 컴파일러가 `.card` 를 처리하는 순간 `white` 로 치환됐고,
`.dark` 안의 `$bg: black` 은 그 블록 안에서만 유효한 지역 변수라 아무 선언도 만들지 않는다. 브라우저는 `$bg` 라는 이름을 알지 못한다.

---

## 2. 정의

### 2.1 Sass와 SCSS

**Sass**는 CSS로 컴파일되는 스타일시트 언어다. 문법은 두 가지다<a href="https://sass-lang.com/documentation/syntax/" target="_blank"><sup>[1]</sup></a>.

| 구문 | 확장자 | 특징 |
|---|---|---|
| SCSS | `.scss` | CSS 문법의 상위 집합. 유효한 CSS는 그대로 유효한 SCSS다 |
| 들여쓰기 구문 | `.sass` | 중괄호와 세미콜론 대신 들여쓰기와 줄바꿈으로 구분한다 |

실무에서는 기존 CSS를 그대로 옮길 수 있는 SCSS를 주로 쓴다. 이 글의 예제도 SCSS다.

### 2.2 구현체

현재 기준 구현은 [[dart-sass|Dart Sass]]다. 이전에 쓰이던 LibSass와 이를 감싼 `node-sass` 는 지원이 종료됐다.
Sass는 빌드 단계에서 동작하는 [[preprocessor|전처리기]]이므로 Vite, webpack 같은 번들러가 `sass` 패키지를 불러 `.scss` 파일을 CSS로 바꾼다.

---

## 3. 동작 원리

![Sass 컴파일 시점과 브라우저 실행 시점](/post-assets/frontend/styling/sass-compile.svg "Sass 문법은 컴파일 단계에서만 존재한다. 브라우저가 받는 것은 CSS 파일이다.")

### 3.1 변수와 스코프

Sass 변수는 `$` 로 시작하고 컴파일 시점에 값으로 치환된다. 파일 최상단에 선언한 변수는 전역이고, 블록 `{}` 안에서 선언한 변수는 그 블록 안에서만 쓰인다.
1장의 `.dark { $bg: black; }` 은 블록 안의 새 지역 변수를 만들 뿐 전역 `$bg` 를 바꾸지 않는다.

[[custom-property|CSS 사용자 정의 속성]]은 다르다. 컴파일 후에도 CSS에 남아 브라우저가 캐스케이드와 상속으로 값을 정한다.

| 비교 | Sass 변수 `$brand` | CSS 사용자 정의 속성 `--brand` |
|---|---|---|
| 값이 정해지는 때 | 컴파일 시점 | 브라우저 렌더링 시점 |
| 출력 CSS에 남는가 | 남지 않는다 | 남는다 |
| 선택자별로 다른 값 | 불가 | 가능 (`.dark { --brand: … }`) |
| JavaScript로 변경 | 불가 | `style.setProperty()` 로 가능 |
| 계산·반복문에 사용 | 가능 | `calc()` 만 가능 |

### 3.2 중첩과 부모 선택자

중첩한 규칙은 바깥 선택자와 이어 붙은 선택자로 컴파일된다. `&` 는 바깥 선택자 자체를 가리키며, 뒤에 글자를 붙여 새 클래스 이름을 만들 수도 있다.

::: split
== SCSS
```scss
@use "sass:math";
@use "tokens";

.card {
  padding: math.div(tokens.$space, 2);

  &__title {
    font-weight: 700;
  }

  &:hover {
    border-color: tokens.$brand;
  }

  .icon {
    width: 16px;
  }
}
```

== 컴파일 결과
```css
.card {
  padding: 12px;
}
.card__title {
  font-weight: 700;
}
.card:hover {
  border-color: #7c3aed;
}
.card .icon {
  width: 16px;
}
```
:::

`&__title` 은 `.card__title` 이라는 새 클래스가 되고, `.icon` 은 자손 선택자 `.card .icon` 이 된다.
자손 선택자는 클래스가 하나 늘어난 만큼 명시도가 (0,2,0) 으로 높아진다.

### 3.3 믹스인과 @extend

**믹스인**은 선언 묶음에 이름을 붙이고 `@include` 하는 자리마다 그 선언을 복사해 넣는 기능이다. 인자와 기본값을 받을 수 있다<a href="https://sass-lang.com/documentation/at-rules/mixin/" target="_blank"><sup>[3]</sup></a>.

```scss
@mixin focus-ring($color: tokens.$brand) {
  outline: 2px solid $color;
  outline-offset: 2px;
}

.card:focus-visible {
  @include focus-ring;
}
```

```css
.card:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
}
```

`@extend` 는 선언을 복사하지 않고 선택자를 한 규칙에 합친다. `%` 로 시작하는 placeholder 선택자는 그 자체로는 출력되지 않는다.

::: split
== SCSS
```scss
%btn-base {
  padding: 8px;
}
.btn-a {
  @extend %btn-base;
}
.btn-b {
  @extend %btn-base;
}
```

== 컴파일 결과
```css
.btn-b, .btn-a {
  padding: 8px;
}
```
:::

### 3.4 모듈 시스템: @use 와 @forward

`@use` 는 다른 Sass 파일을 모듈로 불러온다<a href="https://sass-lang.com/documentation/at-rules/use/" target="_blank"><sup>[2]</sup></a>.
불러온 멤버는 파일명이 [[namespace|네임스페이스]]가 되어 `tokens.$brand` 처럼 접근한다. 같은 모듈을 여러 파일에서 `@use` 해도 CSS는 한 번만 출력된다.

```scss
// _tokens.scss
$brand: #7c3aed;
$space: 24px;
$-internal: 1px;   // - 또는 _ 로 시작하면 비공개 멤버
```

```scss
// card.scss
@use "tokens";

.card { color: tokens.$brand; }
.x { color: tokens.$-internal; }
```

```plaintext
Error: Private members can't be accessed from outside their modules.
  ╷
4 │   color: tokens.$-internal;
  │          ^^^^^^^^^^^^^^^^^
```

밑줄로 시작하는 `_tokens.scss` 는 [[partial|파셜]]이라 단독 CSS 파일로 출력되지 않는다. `@use "tokens"` 처럼 밑줄과 확장자 없이 불러온다.
`@forward` 는 불러온 모듈의 멤버를 다시 내보내, 여러 파셜을 한 진입 파일로 묶을 때 쓴다.

```seq
title: card.scss 가 CSS가 되는 과정
speed: 1700
caption: Sass 문법 요소는 컴파일러 안에서 값으로 바뀌고, 출력에는 CSS 규칙만 남는다.

lane mod  모듈 _tokens.scss
lane comp Dart Sass
lane out  card.css #log

step 컴파일러가 card.scss 를 읽다가 @use "tokens" 를 만나 _tokens.scss 를 모듈로 불러온다.
  push mod $brand: #7c3aed
  push mod $space: 24px
step tokens.$brand 참조를 모듈의 값으로 치환한다.
  move mod comp #7c3aed
step math.div(tokens.$space, 2) 를 계산해 12px 을 얻는다.
  move mod comp 12px
step 중첩 규칙을 펼쳐 .card, .card__title, .card:hover 규칙을 만든다.
  log out .card { padding: 12px; }
  log out .card:hover { border-color: #7c3aed; }
step 출력 파일에는 $brand, @use, @mixin 같은 Sass 문법이 남지 않는다.
  clear comp
```

---

## 4. 예제

### 4.1 테마 값은 CSS 변수로 내보내기

Sass 변수로 관리하던 토큰을 CSS 사용자 정의 속성으로 출력하면 다크 모드처럼 런타임에 바뀌는 값도 다룰 수 있다. Sass 맵과 `@each` 로 선언을 생성한다.

::: split
== SCSS
```scss
@use "sass:map";

$themes: (
  light: (bg: white, fg: #111),
  dark: (bg: #111, fg: white),
);

@each $name, $t in $themes {
  .theme-#{$name} {
    --bg: #{map.get($t, bg)};
    --fg: #{map.get($t, fg)};
  }
}

.card {
  background: var(--bg);
  color: var(--fg);
}
```

== 컴파일 결과
```css
.theme-light {
  --bg: white;
  --fg: #111;
}
.theme-dark {
  --bg: #111;
  --fg: white;
}
.card {
  background: var(--bg);
  color: var(--fg);
}
```
:::

1장의 문제는 `.dark` 에 Sass 변수 대신 `--bg` 를 선언하는 것으로 해결된다. 반복과 계산은 Sass가, 런타임 전환은 CSS가 맡는 구조다.

::: tip
예전 코드에서 자주 보이는 전역 함수 `map-get()` 도 같은 결과를 내지만, 1.105.1 에서는 `DEPRECATION WARNING [global-builtin]` 이 출력된다.
내장 함수는 `sass:map`, `sass:math`, `sass:color` 모듈을 `@use` 해서 쓴다.
:::

### 4.2 CSS 중첩과의 차이

2023년 이후 주요 브라우저는 CSS 자체의 중첩 문법을 지원한다<a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting" target="_blank"><sup>[5]</sup></a>.
중첩만 필요하다면 Sass 없이도 쓸 수 있다. 다만 CSS 중첩의 `&` 는 선택자를 가리킬 뿐 문자열이 아니므로 `&__title` 처럼 클래스 이름을 이어 붙이는 BEM 패턴은 Sass에서만 동작한다.

| 기능 | Sass | 브라우저 CSS |
|---|---|---|
| 중첩 | 지원 | 지원 |
| `&__suffix` 이름 결합 | 지원 | 미지원 |
| 변수 | `$var` (컴파일 시점) | `--var` (런타임) |
| 믹스인, 반복문, 맵 | 지원 | 미지원 |
| 모듈 | `@use`, `@forward` | `@import` (런타임 요청) |

---

## 5. 자주 하는 실수

::: warning
**`@import` 계속 쓰기**

Sass의 `@import` 는 deprecated 상태이고 Dart Sass 3.0.0 에서 제거된다<a href="https://sass-lang.com/documentation/breaking-changes/import/" target="_blank"><sup>[4]</sup></a>.
1.105.1 로 `@import "tokens";` 를 컴파일하면 `DEPRECATION WARNING [import]` 가 출력된다. `@import` 는 모든 멤버를 전역에 풀어 이름 충돌을 만든다. `@use` 로 바꾼다.
:::

::: warning
**`/` 로 나누기**

`width: 10px / 2;` 는 1.105.1 에서 `width: 10px/2;` 로 그대로 출력된다. CSS에서 `/` 는 `grid-area: 1 / 3` 처럼 구분자로 쓰이기 때문에 Sass는 나눗셈으로 해석하지 않는다.
나눗셈은 `@use "sass:math";` 후 `math.div(10px, 2)` 로 쓴다.
:::

::: caution
**깊은 중첩**

HTML 구조를 따라 5단계로 중첩하면 `.page .content .card .title span` 처럼 명시도 (0,4,1) 의 선택자가 출력된다.
이 규칙을 덮어쓰려면 더 긴 선택자가 필요해진다. 중첩은 `&:hover`, `&__title` 같은 상태와 이름 결합 위주로 2단계 안에서 쓴다.
명시도 계산은 [CSS 캐스케이드와 명시도 →](/post/css-cascade) 3.4절을 참고한다.
:::

---

## 6. 정리

Sass는 빌드 시점에 CSS로 컴파일되는 언어이고 SCSS는 CSS를 그대로 포함하는 구문이다. 변수, 믹스인, 함수는 컴파일 중에 값으로 바뀌어 출력에 남지 않는다.
모듈은 `@use` 와 `@forward` 로 나누고, 런타임에 바뀌는 값은 CSS 사용자 정의 속성으로 출력한다.

- [ ] 1장의 `.dark` 블록이 출력에서 사라진 이유를 설명할 수 있다
- [ ] Sass 변수와 CSS 사용자 정의 속성의 차이를 표로 말할 수 있다
- [ ] `@use` 가 `@import` 와 다른 점(네임스페이스, 한 번만 출력, 비공개 멤버)을 안다
- [ ] `10px / 2` 가 나눗셈이 되지 않는 이유를 안다

## 참고

<ol>
<li><a href="https://sass-lang.com/documentation/syntax/" target="_blank">[1] Syntax — Sass Documentation</a></li>
<li><a href="https://sass-lang.com/documentation/at-rules/use/" target="_blank">[2] @use — Sass Documentation</a></li>
<li><a href="https://sass-lang.com/documentation/at-rules/mixin/" target="_blank">[3] @mixin and @include — Sass Documentation</a></li>
<li><a href="https://sass-lang.com/documentation/breaking-changes/import/" target="_blank">[4] Breaking Change: @import and global built-in functions — Sass Documentation</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting" target="_blank">[5] Using CSS nesting — MDN Web Docs</a></li>
</ol>

---

## 관련 글

- [CSS 캐스케이드와 명시도 →](/post/css-cascade) (선행 개념: 중첩이 만드는 명시도)
- [Tailwind CSS 유틸리티 생성 과정 →](/post/tailwind-css) (빌드 시점에 CSS를 만드는 다른 방식)
- [shadcn/ui 컴포넌트 배포 방식과 구조 →](/post/shadcn-ui)
