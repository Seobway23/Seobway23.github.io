---
title: "Tailwind CSS 유틸리티 생성 과정"
coverImage: /post-thumbnails/tailwind-css.svg
slug: tailwind-css
category: frontend/styling
concept: tailwind-css
tags: [tailwindcss, css, utility-first, "@theme", 빌드]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-10-15
excerpt: >
  Tailwind CSS는 빌드할 때 소스 파일을 텍스트로 읽어 클래스 이름 후보를 찾고, 유틸리티와 일치하는 후보만 CSS 규칙으로 만든다. 코드를 실행하지 않으므로 문자열을 조합한 클래스 이름은 생성되지 않는다.
glossary:
  utility-class: "선언 하나 또는 몇 개만 담은 작은 CSS 클래스. p-4 는 padding, flex 는 display:flex 하나를 적용한다."
  design-token: "색, 간격, 글자 크기처럼 디자인에서 반복해 쓰는 값에 이름을 붙인 것. Tailwind v4 에서는 CSS 변수로 정의한다."
  oklch: "밝기(L), 채도(C), 색상각(h)으로 색을 지정하는 CSS 색 공간. 같은 L 값이면 사람이 느끼는 밝기가 비슷하다."
  candidate: "스캐너가 소스에서 잘라 낸 클래스 이름 후보 토큰. 실제 유틸리티와 일치하는 것만 CSS로 생성된다."
  media-query: "화면 너비, 입력 장치 같은 조건이 맞을 때만 안의 규칙을 적용하는 CSS 문법. @media 로 쓴다."
sources:
  - url: https://tailwindcss.com/docs/styling-with-utility-classes
    title: "Styling with utility classes — Tailwind CSS"
    checked: 2026-10-15
  - url: https://tailwindcss.com/docs/detecting-classes-in-source-files
    title: "Detecting classes in source files — Tailwind CSS"
    checked: 2026-10-15
  - url: https://tailwindcss.com/docs/theme
    title: "Theme variables — Tailwind CSS"
    checked: 2026-10-15
  - url: https://tailwindcss.com/docs/hover-focus-and-other-states
    title: "Hover, focus, and other states — Tailwind CSS"
    checked: 2026-10-15
  - url: https://tailwindcss.com/docs/responsive-design
    title: "Responsive design — Tailwind CSS"
    checked: 2026-10-15
---

::: abstract
**Tailwind CSS**는 클래스 이름 하나가 CSS 선언 하나 또는 몇 개에 대응하는 유틸리티 클래스를 빌드 시점에 생성하는 CSS 프레임워크다.
빌드 도구는 소스 파일을 텍스트로 읽어 쓰인 클래스 이름만 찾아 CSS로 만들기 때문에, 런타임에 문자열을 조합한 클래스 이름은 스타일이 없다.
:::

::: notice
이 글의 출력 예시는 Tailwind CSS 4.3.3 CLI 로 직접 빌드한 결과다 (2026-10-15).
:::

## 1. 문제 상황

상태에 따라 글자 색을 바꾸려고 클래스 이름을 문자열로 조합했다. 개발 도구로 보면 클래스는 붙어 있는데 색이 적용되지 않는다.

```tsx
function Badge({ color }: { color: "red" | "green" }) {
  return <span className={`text-${color}-500`}>상태</span>;
}
```

`<span class="text-red-500">` 이 DOM에 있지만 빌드된 CSS 파일에는 `.text-red-500` 규칙이 없다.
Tailwind CSS는 클래스가 쓰였는지를 빌드할 때 소스 텍스트에서 판단하는데, 소스에는 `text-${color}-500` 만 적혀 있기 때문이다.

---

## 2. 정의

### 2.1 유틸리티 우선 CSS

Tailwind CSS는 `.card`, `.button` 같은 의미 단위 클래스 대신 [[utility-class|유틸리티 클래스]]를 HTML에 조합해 스타일을 만드는 방식이다<a href="https://tailwindcss.com/docs/styling-with-utility-classes" target="_blank"><sup>[1]</sup></a>.

```html
<button class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
  저장
</button>
```

각 클래스는 다음 선언으로 바뀐다.

| 클래스 | 생성되는 CSS |
|---|---|
| `px-4` | `padding-inline: calc(var(--spacing) * 4)` |
| `bg-blue-500` | `background-color: var(--color-blue-500)` |
| `rounded-lg` | `border-radius: var(--radius-lg)` |
| `hover:bg-blue-600` | `:hover` 상태에서 `background-color: var(--color-blue-600)` |

### 2.2 v4 의 구성 방식

Tailwind CSS v4 는 설정을 JavaScript 파일이 아니라 CSS 안에서 한다. 진입 CSS 파일 한 줄로 시작한다.

```css
@import "tailwindcss";
```

색, 간격 같은 [[design-token|디자인 토큰]]은 `@theme` 블록에 CSS 변수로 정의하고, 정의한 변수 이름에 맞는 유틸리티가 자동으로 생긴다<a href="https://tailwindcss.com/docs/theme" target="_blank"><sup>[3]</sup></a>.

---

## 3. 동작 원리

![Tailwind CSS 빌드 과정](/post-assets/frontend/styling/tailwind-pipeline.svg "소스를 텍스트로 스캔하고, 유틸리티와 일치하는 후보만 CSS로 생성한다. 조합한 문자열은 후보가 되지 못한다.")

### 3.1 스캔: 소스를 텍스트로 읽는다

Tailwind CSS는 프로젝트의 소스 파일을 일반 텍스트로 읽어 클래스 이름이 될 수 있는 토큰([[candidate|후보]])을 잘라 낸다<a href="https://tailwindcss.com/docs/detecting-classes-in-source-files" target="_blank"><sup>[2]</sup></a>.
파일 형식을 해석하거나 코드를 실행하지 않는다. `.gitignore` 에 있는 파일, 바이너리 파일, CSS 파일, 패키지 잠금 파일은 자동으로 제외한다.

스캔 대상에 없는 경로(예: `node_modules` 안의 UI 라이브러리)는 `@source` 로 추가한다.

```css
@import "tailwindcss";
@source "../node_modules/@acme/ui";
```

### 3.2 생성: 일치하는 후보만 CSS가 된다

후보 가운데 실제 유틸리티 이름과 일치하는 것만 CSS 규칙으로 만든다. 4.3.3 CLI 로 아래 HTML을 빌드하면 쓰인 네 클래스에 대한 규칙만 나오고,
`text-${color}-500` 에 해당하는 규칙은 없다.

```html
<button class="p-4 bg-blue-500 hover:bg-blue-600 md:px-8">저장</button>
<script>
  el.className = `text-${color}-500`;
</script>
```

```css
@layer utilities {
  .bg-blue-500 {
    background-color: var(--color-blue-500);
  }
  .p-4 {
    padding: calc(var(--spacing) * 4);
  }
  @media (hover: hover) {
    .hover\:bg-blue-600:hover {
      background-color: var(--color-blue-600);
    }
  }
  @media (width >= 48rem) {
    .md\:px-8 {
      padding-inline: calc(var(--spacing) * 8);
    }
  }
}
```

같은 빌드의 `@layer theme` 에는 `--spacing: 0.25rem`, `--color-blue-500: oklch(62.3% 0.214 259.815)` 처럼 쓰인 유틸리티가 참조하는 변수가 들어간다.
기본 색상표는 [[oklch|OKLCH]] 값으로 정의되어 있다.

```seq
title: 클래스 이름이 CSS 규칙이 되는 과정
speed: 1600
caption: 스캐너는 소스에 적힌 그대로의 토큰만 본다.

lane src   소스 텍스트
lane cand  후보 토큰
lane css   생성된 CSS #log

step Button.tsx 를 텍스트로 읽는다. 클래스 속성에 적힌 문자열과 템플릿 리터럴이 그대로 보인다.
  push src "p-4 bg-blue-500"
  push src `text-${color}-500`
step 공백과 따옴표를 기준으로 토큰을 잘라 후보 목록을 만든다.
  move src cand p-4
  push cand bg-blue-500
  move src cand text-${color}-500
step p-4 는 padding 유틸리티와 일치한다. calc(var(--spacing) * 4) 규칙을 만든다.
  mark cand
  log css .p-4 { padding: … }
step bg-blue-500 도 일치한다. --color-blue-500 변수를 참조하는 규칙을 만든다.
  log css .bg-blue-500 { background-color: … }
step text-${color}-500 은 어떤 유틸리티 이름과도 일치하지 않아 버린다. text-red-500 규칙은 생기지 않는다.
  log css (text-red-500 없음)
```

### 3.3 변형: 상태와 화면 크기

`hover:`, `focus:`, `md:`, `dark:` 같은 접두어를 변형(variant)이라고 한다. 변형은 유틸리티를 선택자 조건이나 [[media-query|미디어 쿼리]]로 감싼다<a href="https://tailwindcss.com/docs/hover-focus-and-other-states" target="_blank"><sup>[4]</sup></a>.

| 변형 | 감싸는 조건 |
|---|---|
| `hover:` | `:hover` 이면서 `@media (hover: hover)` |
| `focus-visible:` | `:focus-visible` |
| `md:` | `@media (width >= 48rem)` |
| `dark:` | `@media (prefers-color-scheme: dark)` (기본값) |

v4 의 `hover:` 는 `@media (hover: hover)` 안에 생성된다. 마우스가 없는 터치 기기에서는 탭한 뒤 hover 스타일이 남는 현상이 생기지 않는다.
화면 크기 변형은 모바일 우선이다. 접두어가 없는 클래스는 모든 너비에, `md:` 는 48rem(768px) 이상에서만 적용된다<a href="https://tailwindcss.com/docs/responsive-design" target="_blank"><sup>[5]</sup></a>.

### 3.4 레이어 구조

`@import "tailwindcss"` 는 네 개의 캐스케이드 레이어를 이 순서로 선언한다.

```css
@layer theme, base, components, utilities;
```

`utilities` 가 마지막이라 유틸리티는 같은 파일의 `base`, `components` 보다 강하다. 레이어 밖에 쓴 일반 CSS는 유틸리티보다도 강하다.
레이어 비교가 명시도보다 먼저라는 규칙은 [CSS 캐스케이드와 명시도 →](/post/css-cascade) 3.3절에서 설명한다.

### 3.5 @theme 으로 토큰 추가

`@theme` 에 정의한 변수는 두 가지가 된다. `:root` 의 CSS 변수, 그리고 이름 규칙에 맞는 유틸리티다<a href="https://tailwindcss.com/docs/theme" target="_blank"><sup>[3]</sup></a>.

```css
@import "tailwindcss";

@theme {
  --color-brand: #7c3aed;
  --font-display: "Pretendard", sans-serif;
}
```

`--color-*` 네임스페이스라서 `bg-brand`, `text-brand`, `border-brand` 가, `--font-*` 라서 `font-display` 가 생긴다.
4.3.3 빌드에서 `bg-brand` 는 `background-color: var(--color-brand)` 로 나온다.

---

## 4. 예제

### 4.1 브라우저에서 바로 빌드하기

아래 예제는 `@tailwindcss/browser` 로 브라우저 안에서 Tailwind CSS를 실행한다. `@theme` 의 `--color-brand` 값을 바꾸거나 클래스를 추가한 뒤 실행해 본다.
버튼 아래 줄은 클래스 이름을 문자열로 조합한 경우다.

```playground
#! html title=tailwind.html height=240
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3"></script>
<style type="text/tailwindcss">
  @theme {
    --color-brand: #7c3aed;
  }
</style>

<div class="flex flex-col items-start gap-3 p-4 font-sans">
  <button class="rounded-lg bg-brand px-4 py-2 text-white hover:opacity-90 md:px-8">
    bg-brand 버튼
  </button>
  <p id="dyn">이 문장의 클래스는 조합으로 붙였다</p>
</div>

<script>
  const color = "red";
  document.getElementById("dyn").className = "text-" + color + "-500";
</script>
```

::: caution
`@tailwindcss/browser` 는 개발 중 확인용이다. 배포용 CSS는 Vite 플러그인(`@tailwindcss/vite`)이나 CLI로 빌드한다.
:::

브라우저 빌드는 페이지의 DOM을 관찰하므로 조합한 클래스도 색이 적용될 수 있다. 소스 파일을 스캔하는 실제 빌드에서는 적용되지 않는다.

### 4.2 실무 패턴

::: split
== 조합 대신 전체 이름으로 매핑
값에 따라 달라지는 클래스는 완성된 이름을 객체에 적어 둔다. 스캐너가 모든 이름을 소스에서 찾을 수 있다.

== 코드
```tsx
const colorClass = {
  red: "text-red-500",
  green: "text-green-500",
} as const;

<span className={colorClass[color]}>상태</span>
```
:::

반복되는 클래스 묶음은 CSS로 다시 빼기보다 컴포넌트로 만든다. 변형이 많은 컴포넌트는 [shadcn/ui 컴포넌트 배포 방식과 구조 →](/post/shadcn-ui) 처럼 클래스 묶음을 variant 별로 관리한다.

---

## 5. 자주 하는 실수

::: warning
**같은 속성의 유틸리티를 두 개 붙이기**

`class="p-2 p-4"` 의 결과는 class 속성에 적은 순서가 아니라 생성된 CSS 안의 순서로 정해진다. 두 규칙의 명시도가 (0,1,0) 으로 같아 등장 순서로 비교되기 때문이다.
props 로 받은 클래스로 기본값을 덮어써야 하면 충돌을 제거하는 병합 함수(tailwind-merge 등)를 쓴다.
:::

::: warning
**v3 설정 파일을 그대로 두기**

v4 는 `tailwind.config.js` 의 `content` 배열을 읽지 않는다. 스캔 경로는 자동 감지와 `@source` 로, 토큰은 `@theme` 으로 옮긴다.
기존 JavaScript 설정을 계속 쓰려면 CSS에 `@config "./tailwind.config.js";` 를 명시해야 한다.
:::

::: caution
**임의 값 남용**

`w-[37px]` 처럼 대괄호 안에 값을 직접 쓰는 임의 값(arbitrary value)은 4.3.3 에서 `width: 37px` 로 생성된다.
한 번 쓰는 값에는 편하지만 반복되면 토큰 체계가 무너진다. 두 번 이상 쓰는 값은 `@theme` 에 이름을 붙여 추가한다.
:::

---

## 6. 정리

Tailwind CSS는 빌드 시점에 소스 텍스트를 스캔해 쓰인 유틸리티만 CSS로 만든다. 생성된 규칙은 `utilities` 레이어에 들어가고,
변형 접두어는 규칙을 선택자 조건이나 미디어 쿼리로 감싼다. v4 의 설정은 `@import`, `@theme`, `@source` 로 CSS 안에서 한다.

- [ ] 1장의 `text-${color}-500` 이 스타일이 없는 이유를 설명할 수 있다
- [ ] `@theme` 에 `--color-*` 변수를 추가하면 어떤 유틸리티가 생기는지 안다
- [ ] 레이어 밖 CSS가 유틸리티보다 강한 이유를 안다
- [ ] `p-2 p-4` 의 결과가 class 순서로 정해지지 않는 이유를 안다

## 참고

<ol>
<li><a href="https://tailwindcss.com/docs/styling-with-utility-classes" target="_blank">[1] Styling with utility classes — Tailwind CSS</a></li>
<li><a href="https://tailwindcss.com/docs/detecting-classes-in-source-files" target="_blank">[2] Detecting classes in source files — Tailwind CSS</a></li>
<li><a href="https://tailwindcss.com/docs/theme" target="_blank">[3] Theme variables — Tailwind CSS</a></li>
<li><a href="https://tailwindcss.com/docs/hover-focus-and-other-states" target="_blank">[4] Hover, focus, and other states — Tailwind CSS</a></li>
<li><a href="https://tailwindcss.com/docs/responsive-design" target="_blank">[5] Responsive design — Tailwind CSS</a></li>
</ol>

---

## 관련 글

- [CSS 캐스케이드와 명시도 →](/post/css-cascade) (선행 개념: 레이어와 명시도)
- [shadcn/ui 컴포넌트 배포 방식과 구조 →](/post/shadcn-ui) (Tailwind CSS 위에서 동작하는 컴포넌트)
- [Sass 전처리와 SCSS 모듈 →](/post/sass-scss)
- [Emotion 런타임 CSS-in-JS 동작 방식 →](/post/emotion) (CSS를 렌더 시점에 만드는 방식과 비교)
