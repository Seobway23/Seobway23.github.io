# 글 작성 매뉴얼 — posts/**/*.md 에서 쓸 수 있는 것 전부

이 문서 하나만 보고 글을 쓸 수 있어야 한다. 이 파일이 글쓰기 기능의 유일한 매뉴얼이다. 규칙(제목 순서·참고 형식)은 루트 `CLAUDE.md`,
역학 시리즈 원칙은 `docs/mechanics-post-principles.md` 를 본다. 여기는 **기능 사용법**이다.

```bash
npm run dev -- --port 5174 --strictPort   # 로컬 미리보기 → http://localhost:5174
npm run generate:posts                    # md → public/posts.json 갱신. 글 고치면 반드시 실행
npm run build                             # 배포 빌드 + 프리렌더(SEO) + sitemap/robots
```

`npm run dev` 중에도 **md 를 고치면 `npm run generate:posts` 를 다시 돌려야** 반영된다.
빌드 산출물이 아니라 정적 JSON을 읽기 때문이다. CI는 push 시 알아서 돌린다.

---

## 0-A. 개념 글 쓰기 (로드맵에 올라가는 글)

로드맵·트랙·"다음 읽을 글"에 들어가려면 **개념 글**로 써야 한다. 절차는 두 단계뿐이다.

**1) `data/concepts.yml` 에 개념을 등록한다** (선행 관계는 여기 한 곳에만 적는다)

```yaml
concepts:
  closure:
    label: 클로저
    domain: javascript          # javascript|typescript|react|css|build|perf|a11y|test
    summary: 함수가 자기 바깥 스코프의 변수를 기억한 채 살아 있는 상태.
    prereq: [scope, hoisting]   # 선행 개념 id
```

**2) 글 frontmatter 에 `concept:` 과 `sources:` 를 넣는다**

```yaml
concept: closure
sources:
  - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Closures
    title: "Closures — MDN Web Docs"
    checked: 2026-09-07
```

끝이다. 학습 순서·레벨·"다음 읽을 글"·로드맵 위치는 전부 자동 계산된다.

::: important
**`prereq` 를 글 frontmatter 에 적지 마라.** 선행 관계는 개념의 성질이지 글의 성질이 아니다.
양쪽에 적으면 반드시 어긋난다. `level` 도 적지 않는다 — 위상정렬로 계산한다.
:::

시작은 `posts/_TEMPLATE_concept.md` 를 복사한다.
본보기: `posts/frontend/javascript/closure.md`

```bash
npm run verify   # 출처 검사 + 그래프 빌드. 빌드에도 포함되어 있다
```

`npm run verify` 가 잡아 실패시키는 것:

| 상황 | 결과 |
|---|---|
| 개념 글인데 `sources` 없음 | 실패 |
| 1차 공식 문서가 아닌 출처(블로그·미디엄 등) | 실패 |
| `concepts.yml` 에 없는 개념을 `concept:` 으로 주장 | 실패 |
| 존재하지 않는 `prereq`, 그래프 순환 | 실패 |
| 트랙 순서가 선행 관계를 어김 | 실패 |
| `checked` 가 6개월 초과 | 경고 |

허용 출처는 `scripts/verify-sources.mjs` 의 `ALLOWED_HOSTS` 에 있다
(MDN · react.dev · tc39.es · WHATWG · W3C · web.dev · nodejs · vitejs · IETF RFC …).
새 도메인이 필요하면 **왜 1차 출처인지 주석과 함께** 거기에 추가한다.

---

## 0. 프런트매터

```yaml
---
title: "글 제목"
slug: slug-name              # URL: /post/slug-name
category: frontend/javascript  # posts/ 폴더 경로와 맞춘다
tags: [javascript, event-loop]
author: Seobway
readTime: 8
featured: false
createdAt: 2026-09-07
excerpt: >
  한 줄 요약. 검색 결과와 SNS 카드에 이 문장이 그대로 쓰인다.
coverImage: /post-assets/foo.png   # 선택. 없으면 본문 첫 이미지
glossary:                          # 선택. 본문 [[termId]] 용어 설명
  eventLoop: "콜 스택이 비면 큐에서 작업을 꺼내 오는 반복 장치."
---
```

`excerpt` 는 **반드시 쓴다.** 비워 두면 본문 앞부분을 잘라 쓰는데, 그게 검색 결과 문구가 된다.

---

## 1. 인터랙티브 시퀀스 — ` ```seq `

**개념이 "어디서 어디로 움직이는지"를 보여줄 때 쓴다.** 이벤트 루프, 요청 흐름, 큐·스택,
프로토콜 핸드셰이크. 코드를 짜는 게 아니라 **움직임을 줄로 적으면** 재생·이전·다음이
붙은 애니메이션이 나온다.

### 가장 짧은 예

````markdown
```seq
preset: event-loop
```
````

내장 예제: `event-loop`, `http-request`. (`shared/seq-presets.mjs` 에 있다.)

### 직접 쓰기

````markdown
```seq
title: 이벤트 루프 한 바퀴
speed: 1400
caption: 동기 → 마이크로태스크 → 매크로태스크 순으로 비워진다.

lane stack  콜 스택 #stack
lane macro  태스크 큐 #queue
lane out    콘솔 #log

step setTimeout 은 콜백을 브라우저에 맡기고 바로 반환한다.
  push stack setTimeout
  move stack macro cb
step 스택이 비면 태스크 큐에서 하나를 꺼낸다.
  move macro stack cb
  log out timeout
  pop stack
```
````

### 문법

| 줄 | 뜻 |
|---|---|
| `title: …` | 제목 |
| `speed: 1400` | 자동 재생 간격(ms). 최소 200 |
| `caption: …` | 그림 아래 설명 |
| `preset: event-loop` | 내장 예제로 시작. 아래에 줄을 더 쓰면 덧붙는다 |
| `lane <id> <라벨> [#종류]` | 상자 하나. `id` 는 영문·숫자·`-`·`_` |
| `step <설명>` | 장면 하나. 이 문장이 아래 해설로 뜬다 |

레인 종류(`#` 뒤):

| 종류 | 동작 |
|---|---|
| `#queue` (기본) | 앞에서 꺼낸다(FIFO). 큐·대기열 |
| `#stack` | 뒤에서 꺼낸다(LIFO). 위에 쌓인 게 위에 보인다 |
| `#log` | 토큰이 아니라 줄글이 쌓인다. 콘솔·화면 출력용 |

`step` 아래에 들여쓴 줄이 **그 장면에서 일어나는 일**이다:

| 명령 | 뜻 |
|---|---|
| `push <lane> <라벨>` | 새 토큰이 생긴다 |
| `pop <lane>` | 토큰 하나가 사라진다 |
| `move <from> <to> [새 라벨]` | 토큰이 날아간다. **화살표가 그려진다** |
| `log <lane> <텍스트>` | `#log` 레인에 한 줄 쌓는다 |
| `mark <lane>` | 이 장면에서 그 레인을 강조 |
| `clear <lane>` | 그 레인을 비운다 |

`#` 나 `//` 로 시작하는 줄은 주석이다.

### 알아둘 것

- **토큰은 정체성을 유지한다.** `push` 로 생긴 토큰을 `move` 하면 같은 상자가 날아간다(FLIP).
- 상태는 매번 0단계부터 다시 재생해서 만든다. 그래서 **아무 점이나 눌러 건너뛰어도** 정확하다.
- 조작: `▶` 재생 / `‹` `›` 한 단계 / `↺` 처음. 블록을 클릭한 뒤 **`←` `→` `Space` 키**로도 된다.
- 화면 밖으로 나가면 자동 재생이 멈춘다.
- 오류가 있으면(없는 lane 참조 등) 블록 아래 빨간 줄로 알려준다. 조용히 넘어가지 않는다.
- **SEO**: `step` 설명이 프리렌더 시 `<ol>` 로 바뀌어 크롤러에게 노출된다.
  그러니 `step` 문장을 **성의 있게 쓰면 검색에도 이득**이다.

---

## 2. 라이브 플레이그라운드 — ` ```playground `

독자가 **직접 고쳐서 실행**하는 블록. `Ctrl+Enter` 로 실행, `↺` 로 원래 코드로 되돌린다.

````markdown
```playground
#! react title=Counter.jsx height=300
import { useState } from "react";

export default function App() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>클릭 {n}</button>;
}
```
````

첫 줄 `#!`(또는 `%%`)은 옵션이며 생략할 수 있다.

| 옵션 | 값 |
|---|---|
| 종류 | `react`(기본) · `ts` · `js` · `html` |
| `title=` | 편집기에 뜰 파일명 |
| `height=` | 결과 패널 높이(px, 140~720) |

| 종류 | 쓰임 |
|---|---|
| `react` | JSX 그대로. `export default function App()` 이면 **자동 마운트** |
| `ts` | 타입 주석·`interface` 사용 가능(타입은 지워지고 실행, **타입 검사는 안 한다**) |
| `js` | 콘솔 학습용. `console.log` 결과가 아래 콘솔 패널에 찍힌다 |
| `html` | `<style>`·`<script>` 포함한 문서 조각을 그대로 렌더 |

### 되는 것 / 안 되는 것

- ✅ **`import` 가 진짜 된다.** `react`·`react-dom` 은 물론 npm 패키지도 esm.sh 로 불러온다.
  ```js
  import confetti from "https://esm.sh/canvas-confetti";
  ```
- ✅ `console.log/warn/error` → 콘솔 패널. 에러는 빨갛게.
- ✅ 편집기에 **문법 강조**가 들어간다. 색은 독자가 헤더 팔레트(🎨) → **화면 설정 →
  코드 색상 테마**에서 고른 것을 따르고, 본문 코드 블록과 같은 테마를 쓴다.
- ❌ **인터넷이 필요하다.** 컴파일러(@babel/standalone)와 패키지를 CDN에서 받는다.
- ❌ TypeScript **타입 오류는 잡히지 않는다**(문법만 지우고 실행).
- 화면에 들어올 때 처음 한 번만 실행된다(첫 로딩에 CDN을 몰아치지 않게).

::: 주의
`react` 종류에서 `ReactDOM.render` 를 직접 부르지 마라. `App` 만 정의하면 알아서 마운트한다.
:::

---

## 3. 본문 탭 — `::: tabs`

같은 층위의 것 여럿을 **나열하지 말고 탭으로** 묶을 때.
"A는 …, B는 …, C는 …" 를 세로로 늘어놓는 대신 쓴다.

```markdown
::: tabs
== 정지 토압
벽이 움직이지 않을 때. $K_0 = 1 - \sin\phi'$

== 주동 토압
벽이 흙에서 멀어질 때.

== 수동 토압
벽이 흙을 밀 때.
:::
```

- `== 라벨` 줄이 항목을 가른다.
- 항목 본문은 **일반 마크다운 전부** — 표·수식·코드·이미지·콜아웃까지 된다.
- 첫 탭이 기본 선택. 탭에 포커스를 두고 `←` `→` 로 이동할 수 있다.
- 검색엔진은 **숨은 탭 내용까지 읽는다.** 나눠도 SEO 손해가 없다.

---

## 4. 좌우 2단 — `::: split`

설명과 코드를 나란히 놓을 때. 모바일에서는 자동으로 위아래로 쌓인다.

```markdown
::: split
== 무슨 일이 일어나는가
`useState` 는 값과 setter 를 돌려준다. setter 를 부르면 컴포넌트가 다시 그려진다.

== 코드
```jsx
const [n, setN] = useState(0);
```
:::
```

`== 라벨` 을 생략하면(`==` 만) 소제목 없이 칸만 나뉜다. 항목 2~3개까지 가로로 배치한다.

---

## 5. 카드 격자 — `::: grid`

요약·비교를 카드로. 항목이 3의 배수면 3열, 아니면 2열.

```markdown
::: grid
== 스택이 먼저다
큐는 스택이 빈 뒤에야 열린다.

== 마이크로 > 매크로
마이크로태스크를 다 비운 다음 태스크 큐를 하나 꺼낸다.

== 하나씩
태스크는 한 번에 하나.
:::
```

---

## 6. 콜아웃 — `::: tip`

```markdown
::: notice
이 글은 **2026년 기준** 동작을 설명한다.
:::
```

종류: `tip` `note` `info` `notice` `success` `important` `warning` `danger` `caution` `abstract`

**탭·2단·격자 안에 콜아웃을 중첩할 수 있다.** 반대도 된다.

---

## 7. 체크리스트

GFM 문법 그대로.

```markdown
- [ ] 스택이 비어야 큐를 본다는 걸 설명할 수 있다
- [x] `Promise.then` 과 `setTimeout(…, 0)` 의 순서를 예측할 수 있다
```

글 끝 "이해도 점검"에 쓰면 좋다.

---

## 8. 코드 탭 — 같은 코드를 여러 언어로

```markdown
<!-- code-tabs:start -->
```typescript
const x: number = 1;
```
```python
x = 1
```
<!-- code-tabs:end -->
```

**코드 전용**이다. 설명 문단이 섞이면 `::: tabs` 를 써라.

---

## 9. 그 밖의 표현

| 기능 | 문법 |
|---|---|
| 수식 | 인라인 `$K_0$`, 블록 `$$ … $$` (코드 펜스 안에서는 안 먹는다) |
| 다이어그램 | ` ```mermaid ` 블록. 첫 줄 `%% desc: 캡션` 선택 |
| 용어 툴팁 | 프런트매터 `glossary` + 본문 `[[termId]]` 또는 `[[termId\|표시어]]` |
| 배경 카드 | `::: domain id="foo" title="제목" … :::` + 본문 `[[domain:foo]]` |
| 역학 시각화 | ` ```diagramatics ` / ` ```jsxgraph ` / ` ```three ` + `{"preset":"…"}` |
| 같은 저장소 글 링크 | `[제목 →](./파일명.md)` → 빌드 시 `/post/slug` 로 변환 |

---

## 10. SEO — 자동으로 되는 것 / 네가 해야 하는 것

`npm run build` 가 글마다 다음을 만든다 (`scripts/prerender.mjs`):

- `dist/post/<slug>.html` — **본문 HTML이 박힌** 정적 페이지
  (JS를 실행하지 않는 GPTBot·ClaudeBot·PerplexityBot 도 본문을 읽는다)
- 글별 `<title>` · `description` · `canonical` · OpenGraph · Twitter 카드
- JSON-LD `BlogPosting` + `BreadcrumbList`
- `dist/sitemap.xml`, `dist/robots.txt`(AI 크롤러 명시 허용)

**네가 해야 하는 것:**

1. `excerpt` 를 한 문장으로 정확히 쓴다 — 검색 결과에 그대로 나온다.
2. `coverImage` 를 넣는다 — 없으면 기본 아이콘이 SNS 카드에 뜬다.
3. `tags` 를 성의 있게 — `keywords` 와 `article:tag` 로 들어간다.
4. `seq` 블록의 `step` 문장을 문장답게 쓴다 — 그대로 크롤러가 읽는 목록이 된다.
5. 배포 후 **Google Search Console · Bing Webmaster Tools** 에
   `https://seobway23.github.io/sitemap.xml` 을 제출한다. (한 번만 하면 된다.)

커스텀 도메인을 붙이면 빌드 시 `SITE_URL` 을 준다:

```bash
SITE_URL=https://example.com npm run build
```

---

## 10-A. AI 검색에 잡히게 쓰는 법

구글 SEO와 **규칙이 다르다.** 챗봇·AI 검색(ChatGPT·Claude·Perplexity·구글 AI 개요)은
페이지를 통째로 읽고 순위를 매기는 게 아니라, **문서를 조각(chunk)으로 잘라 저장했다가
질문에 맞는 조각만 꺼내 인용**한다. 그래서 최적화 단위가 페이지가 아니라 **문단**이다.

### 기계가 이미 해 주는 것 (네가 신경 쓸 필요 없음)

| | |
|---|---|
| 본문이 JS 없이 읽힘 | `scripts/prerender.mjs` 가 글마다 정적 HTML 생성 |
| 글별 메타·OG·JSON-LD | 자동 |
| `sitemap.xml` · `robots.txt` | 자동. AI 크롤러 명시 허용 |
| **`llms.txt`** | 자동. 글 목록 + 한 줄 요약 + **선행 관계**까지 담은 AI용 색인 |
| `concept-graph.json` | 공개. AI 가 학습 순서를 그대로 읽을 수 있다 |
| 출처가 1차 문서인지 | `npm run verify:sources` 가 강제 |

### 네가 지켜야 하는 7가지

**1. 소제목을 질문 모양으로 쓴다.**
사람이 검색창에 치는 말과 소제목이 닮을수록 그 조각이 뽑힌다.

```
✗  ## 동작 원리
✓  ## var 는 undefined 인데 let 은 왜 에러인가
```

**2. 소제목 바로 아래 첫 문단에 답을 다 넣는다.**
그 문단 하나만 뽑혀 인용된다고 생각해라. 뜸 들이면 답이 없는 조각이 인용된다.

```
✗  이제 스코프를 알아보자. 그 전에 변수부터 짚고 넘어가면...
✓  스코프는 변수와 함수가 어디서 접근 가능한지를 정하는 범위다. 전역·함수·블록 세 종류다.
```

**3. 각 문단이 혼자서도 말이 되게 쓴다.**
`이것`, `위에서 본 것처럼`, `앞 절의 그 함수` 는 조각으로 잘리는 순간 의미를 잃는다.
대명사 대신 **이름을 다시 쓴다.**

```
✗  이것 때문에 3, 3, 3 이 나온다.
✓  var 는 블록을 인정하지 않아 i 가 하나뿐이므로 3, 3, 3 이 나온다.
```

**4. 정의 문장을 `<용어>는 <정의>다` 형태로 한 번은 쓴다.**
AI 는 개체(entity)와 정의를 이 형태에서 가장 잘 뽑아낸다. 비유는 그 **뒤에** 붙인다.

**5. 구체적인 값·버전·날짜를 쓴다.**
"최신 버전에서는" 이 아니라 "React 19 기준", "2026-09-07 확인". 애매한 문장은
인용해도 쓸모가 없어 버려진다. `sources.checked` 가 이 역할을 자동으로 한다.

**6. 표와 목록을 쓴다.**
비교·분류는 문단보다 표가 훨씬 정확하게 추출된다. 3개 이상 나열하면 표나 목록으로.

**7. `excerpt` 를 그 글의 한 문장 답으로 쓴다.**
`llms.txt`·검색 결과·SNS 카드에 그대로 나간다. 글 소개가 아니라 **답**이어야 한다.

```
✗  excerpt: 클로저에 대해 알아봅니다.
✓  excerpt: 함수가 끝났는데도 그 안의 변수가 살아 있는 이유. 카운터·모듈·이벤트 핸들러가 전부 이것으로 돈다.
```

### 하지 말 것

- **키워드 욱여넣기.** 같은 단어를 반복하면 조각의 정보 밀도가 떨어져 오히려 안 뽑힌다.
- **결론을 맨 끝에만 두기.** 마지막 문단은 잘 안 뽑힌다. 답은 위에도 한 번 쓴다.
- **이미지로만 설명하기.** AI 는 그림을 안 본다. `seq` 다이어그램의 `step` 문장이
  프리렌더에서 목록으로 바뀌는 이유가 이것이다 — **`step` 문장을 성의 있게 쓰면
  그게 곧 AI 가 읽는 설명이 된다.**
- **출처 없이 단정하기.** 근거 링크가 있는 조각이 인용될 확률이 높다.

### 확인

```bash
npm run build
```
빌드 뒤 `dist/llms.txt` 를 열어 **네 글이 한 줄 요약만으로 말이 되는지** 본다.
그 한 줄이 어색하면 `excerpt` 가 잘못 쓰인 것이다.

```bash
# 프리렌더된 본문이 JS 없이 읽히는지 (AI 크롤러가 보는 것과 같다)
node -e "const s=require('fs').readFileSync('dist/post/closure.html','utf8'); console.log(s.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,500))"
```

---

## 11. 글 쓰고 나서 확인할 것

- [ ] `npm run generate:posts` 를 돌렸다
- [ ] 소제목이 질문 모양이고, 그 아래 첫 문단에 답이 다 들어 있다 (§10-A)
- [ ] 문단에 `이것`·`위에서 본` 같은 대명사가 남아 있지 않다
- [ ] `excerpt` 가 글 소개가 아니라 **한 문장 답**이다
- [ ] `npm run dev` 로 실제 화면을 봤다 (탭 전환·시퀀스 재생·플레이그라운드 실행)
- [ ] `excerpt` 가 한 문장으로 정확하다
- [ ] 말미가 `## 참고` → `## 관련 글` 순서다
- [ ] H1 을 쓰지 않았다(H2부터), 섹션 사이에 `---` 이 있다

---

## 부록 — 어디를 고치면 무엇이 바뀌나

| 하고 싶은 것 | 파일 |
|---|---|
| `::: tabs / split / grid` 문법·출력 HTML | `scripts/generate-posts-data.js` (`processSectionBlocks`) |
| 탭 클릭·키보드 동작 | `src/pages/post.tsx` (`initPostTabs`) |
| `seq` 문법·애니메이션 | `src/lib/post-sequence.ts` |
| `seq` 내장 예제 추가 | `shared/seq-presets.mjs` (브라우저·프리렌더가 함께 읽는다) |
| 플레이그라운드 실행 환경·편집기 하이라이팅 | `src/lib/post-playground.ts` |
| 코드 색상 테마 목록 추가 | `src/lib/code-theme.ts` (`CODE_THEMES`) |
| 용어 툴팁 동작(호버 유예·클릭 고정) | `src/components/post-glossary-layer.tsx` |
| 위 블록들의 모양 | `src/index.css` 맨 아래 "본문 확장 블록" 구역 |
| SEO 메타·sitemap | `scripts/prerender.mjs` |
