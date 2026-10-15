---
title: "shadcn/ui 컴포넌트 배포 방식과 구조"
coverImage: /post-thumbnails/shadcn-ui.svg
slug: shadcn-ui
category: frontend/styling
concept: shadcn-ui
tags: [shadcn-ui, react, tailwindcss, cva, radix-ui, 디자인시스템]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-10-15
excerpt: >
  shadcn/ui는 컴포넌트를 패키지로 설치하지 않고 CLI가 소스 파일을 프로젝트에 복사해 넣는 React 컴포넌트 모음이다. 각 컴포넌트는 headless primitive, Tailwind CSS 클래스, cva 로 만든 variant, cn 클래스 병합 함수로 구성되며 색은 CSS 변수로 바꾼다.
glossary:
  headless: "동작과 접근성(키보드 조작, ARIA 속성, 포커스 관리)만 구현하고 스타일은 갖지 않는 UI 컴포넌트."
  registry: "컴포넌트 소스와 의존성 정보를 JSON으로 제공하는 저장소. shadcn CLI 는 여기서 파일 내용을 받아 프로젝트에 쓴다."
  variant: "같은 컴포넌트의 모양 갈래. 버튼의 default, outline, ghost 처럼 prop 하나로 클래스 묶음을 바꾼다."
  cva: "class-variance-authority. variant 이름과 클래스 문자열의 대응을 선언하면 prop 에 맞는 클래스 문자열을 만들어 주는 함수."
  slot: "자기 자신을 렌더링하지 않고 props 와 이벤트 핸들러를 유일한 자식 요소에 합쳐 넘기는 컴포넌트. asChild 가 이것을 쓴다."
sources:
  - url: https://ui.shadcn.com/docs
    title: "Introduction — shadcn/ui"
    checked: 2026-10-15
  - url: https://ui.shadcn.com/docs/installation/manual
    title: "Manual Installation — shadcn/ui"
    checked: 2026-10-15
  - url: https://ui.shadcn.com/docs/components-json
    title: "components.json — shadcn/ui"
    checked: 2026-10-15
  - url: https://ui.shadcn.com/docs/theming
    title: "Theming — shadcn/ui"
    checked: 2026-10-15
  - url: https://www.radix-ui.com/primitives/docs/utilities/slot
    title: "Slot — Radix Primitives"
    checked: 2026-10-15
  - url: https://cva.style/docs
    title: "Introduction — cva"
    checked: 2026-10-15
---

::: abstract
**shadcn/ui**는 컴포넌트 소스 코드를 CLI로 내 프로젝트에 복사해 넣는 방식으로 배포되는 React 컴포넌트 모음이다.
복사된 파일은 내 코드이므로 스타일과 variant 를 파일에서 직접 고친다. 바깥에서 덮어쓰는 명시도 경쟁이 생기지 않는다.
:::

::: notice
이 글은 shadcn CLI 4.21.5, `cn` 0.4.0, `class-variance-authority` 0.7.1, 레지스트리의 `radix-nova` 스타일 기준이다 (2026-10-15 확인).
:::

## 1. 문제 상황

패키지로 설치한 UI 라이브러리의 버튼을 브랜드 색으로 바꾸려고 클래스를 붙였는데 적용되지 않는다.

```css
/* 라이브러리 CSS (node_modules 안) */
.lib-root .lib-button.lib-contained { background: #1976d2; }

/* 내 CSS */
.my-btn { background: #7c3aed; }   /* 적용되지 않는다 */
```

라이브러리 선택자의 명시도는 (0,3,0), 내 선택자는 (0,1,0) 이다. 이기려면 선택자를 더 길게 쓰거나 `!important` 를 붙여야 한다.
라이브러리 CSS 파일을 직접 고치면 다음 설치 때 원래대로 돌아간다. 컴포넌트 소스가 내 저장소 밖에 있어서 생기는 문제다.

---

## 2. 정의

### 2.1 코드 배포 방식

shadcn/ui 는 npm 패키지로 컴포넌트를 받지 않는다. CLI 가 [[registry|레지스트리]]에서 컴포넌트 소스를 받아 `components/ui/button.tsx` 같은 파일로 프로젝트에 쓴다<a href="https://ui.shadcn.com/docs" target="_blank"><sup>[1]</sup></a>.
공식 문서는 이 방식을 "open code" 라고 부른다. 컴포넌트 코드가 처음부터 내 저장소에 있으므로 수정, 삭제, 확장을 파일 편집으로 한다.

![패키지 배포 방식과 shadcn/ui 배포 방식](/post-assets/frontend/styling/shadcn-distribution.svg "왼쪽은 node_modules 안의 컴포넌트를 바깥에서 덮어쓰는 구조, 오른쪽은 CLI가 소스를 내 저장소에 쓰는 구조다.")

### 2.2 구성 요소

컴포넌트 파일 하나는 네 요소로 만들어진다.

| 요소 | 역할 | 패키지 |
|---|---|---|
| [[headless|headless]] primitive | 키보드 조작, ARIA, 포커스 관리 | `radix-ui` 또는 `@base-ui/react` |
| Tailwind CSS 클래스 | 모양 | `tailwindcss` |
| [[cva|cva]] | [[variant|variant]] 별 클래스 묶음 선택 | `class-variance-authority` |
| `cn()` | 클래스 조건부 결합과 충돌 제거 | `cn` |

`components.json` 의 `style` 값이 primitive 를 정한다. `radix-nova` 스타일의 버튼은 `radix-ui` 를, `base-nova` 스타일의 버튼은 `@base-ui/react/button` 을 불러온다.

---

## 3. 동작 원리

### 3.1 초기화와 추가

`init` 은 프로젝트 설정을 `components.json` 에 기록한다<a href="https://ui.shadcn.com/docs/components-json" target="_blank"><sup>[3]</sup></a>. CLI 는 이 파일을 읽어 컴포넌트를 어디에 쓸지, import 경로를 어떻게 바꿀지 정한다.

```bash
npx shadcn@latest init
npx shadcn@latest add button
```

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "tsx": true,
  "tailwind": {
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "iconLibrary": "lucide"
}
```

`add button` 은 레지스트리의 `button.json` 을 받아 `aliases.ui` 경로에 `button.tsx` 를 쓰고, 파일 안의 import 경로를 `aliases` 에 맞게 바꾸고, 필요한 패키지를 설치한다.
수동 설치 문서 기준 기본 의존성은 `shadcn`, `class-variance-authority`, `cn`, `lucide-react`, `tw-animate-css` 다<a href="https://ui.shadcn.com/docs/installation/manual" target="_blank"><sup>[2]</sup></a>.

### 3.2 버튼 파일의 구조

레지스트리의 `radix-nova` 버튼을 줄인 코드다. 클래스 목록 일부와 variant 일부를 생략했다.

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

- `cva()` 는 기본 클래스와 variant 별 클래스를 선언한다. `buttonVariants({ variant: "outline" })` 를 호출하면 해당 클래스들을 이어 붙인 문자열을 돌려준다<a href="https://cva.style/docs" target="_blank"><sup>[6]</sup></a>.
- `VariantProps<typeof buttonVariants>` 는 선언한 variant 이름에서 `variant`, `size` prop 타입을 뽑는다. 없는 variant 이름은 타입 오류가 된다.
- `asChild` 가 참이면 `<button>` 대신 [[slot|Slot]]을 렌더링한다. Slot 은 버튼의 클래스와 속성을 자식 요소에 합쳐 넘긴다<a href="https://www.radix-ui.com/primitives/docs/utilities/slot" target="_blank"><sup>[5]</sup></a>.
- `data-slot`, `data-variant` 는 바깥 CSS나 테스트에서 컴포넌트를 고를 때 쓰는 속성이다.

```tsx
<Button asChild variant="outline">
  <a href="/docs">문서</a>
</Button>
// 렌더 결과: <a href="/docs" data-slot="button" data-variant="outline" data-size="default" class="... border bg-background ...">문서</a>
```

### 3.3 cn 이 클래스 충돌을 제거한다

`cn()` 은 조건부 클래스 결합과 Tailwind 클래스 충돌 제거를 한 번에 한다. 예전 버전의 `lib/utils.ts` 는 `clsx` 와 `tailwind-merge` 를 조합해 이 함수를 정의했고,
현재 문서는 `cn` 패키지를 다시 내보낸다<a href="https://ui.shadcn.com/docs/installation/manual" target="_blank"><sup>[2]</sup></a>.

```ts
// lib/utils.ts
export { cn } from "cn"
```

충돌 제거가 필요한 이유는 Tailwind CSS에서 같은 속성의 클래스 두 개가 붙으면 class 속성 순서가 아니라 생성된 CSS 순서로 결과가 정해지기 때문이다
([Tailwind CSS 유틸리티 생성 과정 →](/post/tailwind-css) 5장). `cn()` 은 같은 속성을 다루는 클래스 중 뒤에 온 것만 남긴다.

```seq
title: <Button variant="outline" className="px-8"> 의 class 가 정해지는 과정
speed: 1700
caption: className 이 cva 에 마지막으로 전달되고, cn 이 충돌하는 px-4 를 제거한다.

lane props  props
lane cva    buttonVariants()
lane cn     cn()
lane dom    렌더된 class #log

step 사용처에서 variant="outline", className="px-8" 을 넘긴다. size 는 기본값 default 가 된다.
  push props outline
  push props px-8
step cva 가 기본 클래스, outline 클래스, size default 클래스(h-9 px-4 py-2)를 순서대로 잇고 className(px-8)을 맨 뒤에 붙인다.
  move props cva outline 클래스
  move props cva px-8
  push cva h-9 px-4 py-2
step cn 이 문자열을 받는다. px-4 와 px-8 은 둘 다 padding-inline 을 다룬다.
  move cva cn 클래스 문자열
  mark cn
step 뒤에 온 px-8 만 남기고 px-4 를 지운다. py-2 처럼 충돌하지 않는 클래스는 유지한다.
  log dom inline-flex … border bg-background … h-9 py-2 px-8
```

### 3.4 테마는 CSS 변수로 바꾼다

컴포넌트 클래스에는 `bg-blue-500` 같은 구체적인 색 대신 `bg-primary`, `bg-background` 같은 의미 이름이 들어 있다<a href="https://ui.shadcn.com/docs/theming" target="_blank"><sup>[4]</sup></a>.
실제 색은 전역 CSS의 변수로 정의하고, `@theme inline` 으로 Tailwind 유틸리티에 연결한다.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-background: var(--background);
}

:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}
```

`@theme inline` 은 유틸리티가 테마 변수를 거치지 않고 값을 직접 쓰게 한다. Tailwind CSS 4.3.3 으로 빌드하면 `bg-primary` 는 `background-color: var(--primary)` 가 된다.
`inline` 없이 같은 변수를 정의하면 `var(--color-primary)` 를 거치는데, 이 변수는 `:root` 에서 한 번 계산되므로 하위 요소에서 `--primary` 를 바꿔도 반영되지 않을 수 있다.
브랜드 색을 바꾸려면 컴포넌트 파일이 아니라 `:root` 와 `.dark` 의 변수 값만 바꾼다.

---

## 4. 예제

### 4.1 cva 와 cn 직접 실행

`buttonVariants` 와 같은 구조를 esm.sh 로 불러와 실행한다. 출력은 Node 에서 같은 버전으로 실행해 확인한 값과 같다.
`className` 에 `px-8` 대신 `bg-red-500` 을 넣거나 `size: "sm"` 을 넘겨 결과를 비교해 본다.

```playground
#! js title=button-variants.js height=260
import { cva } from "https://esm.sh/class-variance-authority@0.7.1";
import { cn } from "https://esm.sh/cn@0.4.0";

const buttonVariants = cva("inline-flex items-center rounded-md text-sm font-medium", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border bg-background hover:bg-accent",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

console.log(buttonVariants());
// inline-flex items-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2

console.log(cn(buttonVariants({ variant: "outline", className: "px-8" })));
// inline-flex items-center rounded-md text-sm font-medium border bg-background hover:bg-accent h-9 py-2 px-8

console.log(cn("bg-red-500", false && "bg-blue-500", { "opacity-50": true }));
// bg-red-500 opacity-50
```

### 4.2 variant 추가

복사된 파일은 내 코드이므로 새 variant 는 `cva` 선언에 한 줄을 추가하면 된다. `VariantProps` 가 타입을 다시 뽑으므로 사용처에서 바로 자동 완성된다.

::: split
== button.tsx
```tsx
variant: {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border bg-background ...",
  brand: "bg-brand text-white hover:bg-brand/90",
},
```

== 사용처
```tsx
<Button variant="brand">구매</Button>
```
:::

`bg-brand` 는 Tailwind CSS `@theme` 에 `--color-brand` 를 정의해야 생성된다.

---

## 5. 자주 하는 실수

::: warning
**패키지처럼 업데이트를 기다리기**

복사된 컴포넌트는 `npm update` 로 바뀌지 않는다. 레지스트리의 새 버전을 받으려면 `add` 를 다시 실행하고 기존 파일과의 차이를 직접 확인해 합친다.
내가 고친 부분이 있다면 덮어쓰기 전에 diff 로 확인한다.
:::

::: warning
**className 을 cva 바깥에서 문자열로 잇기**

`className={buttonVariants({ variant }) + " " + className}` 처럼 이으면 `px-4 px-8` 이 둘 다 남아 결과가 생성된 CSS 순서에 따라 정해진다.
`cn(buttonVariants({ variant, size, className }))` 처럼 `cn()` 을 거쳐야 충돌이 제거된다.
:::

::: caution
**CSS 변수만 추가하고 @theme inline 연결을 빠뜨리기**

`:root` 에 `--brand` 만 정의하면 `bg-brand` 클래스는 생성되지 않는다. Tailwind CSS는 `--color-*` 네임스페이스의 테마 변수만 색 유틸리티로 만든다.
`@theme inline { --color-brand: var(--brand); }` 를 함께 추가한다.
:::

---

## 6. 정리

shadcn/ui 는 컴포넌트 소스를 CLI 로 내 저장소에 쓰는 배포 방식이다. 컴포넌트는 headless primitive, Tailwind CSS 클래스, cva variant, `cn()` 병합으로 구성되고,
색은 `:root` 와 `.dark` 의 CSS 변수에서 정해진다. 스타일 변경은 바깥에서 덮어쓰지 않고 파일과 변수를 직접 고친다.

- [ ] 1장의 덮어쓰기 문제가 shadcn/ui 에서 생기지 않는 이유를 설명할 수 있다
- [ ] `buttonVariants({ variant, size, className })` 가 만드는 문자열의 순서를 안다
- [ ] `cn()` 이 `px-4` 를 지우는 이유를 Tailwind CSS 생성 순서와 연결해 설명할 수 있다
- [ ] `@theme inline` 이 필요한 이유를 안다

## 참고

<ol>
<li><a href="https://ui.shadcn.com/docs" target="_blank">[1] Introduction — shadcn/ui</a></li>
<li><a href="https://ui.shadcn.com/docs/installation/manual" target="_blank">[2] Manual Installation — shadcn/ui</a></li>
<li><a href="https://ui.shadcn.com/docs/components-json" target="_blank">[3] components.json — shadcn/ui</a></li>
<li><a href="https://ui.shadcn.com/docs/theming" target="_blank">[4] Theming — shadcn/ui</a></li>
<li><a href="https://www.radix-ui.com/primitives/docs/utilities/slot" target="_blank">[5] Slot — Radix Primitives</a></li>
<li><a href="https://cva.style/docs" target="_blank">[6] Introduction — cva</a></li>
</ol>

---

## 관련 글

- [Tailwind CSS 유틸리티 생성 과정 →](/post/tailwind-css) (선행 개념: 유틸리티와 @theme)
- [CSS 캐스케이드와 명시도 →](/post/css-cascade) (1장의 덮어쓰기 문제의 원인)
- [Sass 전처리와 SCSS 모듈 →](/post/sass-scss)
