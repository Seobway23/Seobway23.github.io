---
name: blog-post-writing
description: ModernDevBlog 포스트 작성·배포 전 가이드. frontmatter, 수식(KaTeX), Mermaid, 역학 시각화(diagramatics/jsxgraph/three), 용어 사전, 참고·관련 글 규칙, generate:posts·CI. 역학 시리즈는 docs/mechanics-post-principles.md 필독. 새 글 작성·마크다운 편집·블로그 콘텐츠 규칙 질문 시 사용.
---

# ModernDevBlog — 블로그 포스트 작성 스킬

정적 SPA 블로그: `posts/*.md` → 빌드 시 `marked` + KaTeX 등으로 HTML 생성 → `public/posts.json` → 런타임에 React가 로드. **API 서버 없음.**

---

## 1. 아키텍처·데이터 흐름

| 단계 | 내용                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------- |
| 소스 | `posts/` 이하 `.md` (폴더 경로 ≈ 카테고리)                                                                 |
| 생성 | `npm run generate:posts` → `public/posts.json`, `posts-data.json`, `glossary.json`, `glossary-index.json`  |
| 배포 | push → GitHub Actions: `generate:posts` → `fetch:views:prod` → `fetch:comments` → Vite 빌드 → GitHub Pages |

**로컬에서 글을 수정한 뒤** 반드시 `npm run generate:posts`를 실행해야 브라우저/빌드에 반영된다 (CI는 push 시 자동).

### 역학 시리즈 (`posts/study/mechanics/`)

역학·토질·토압 글을 쓸 때는 **`docs/mechanics-post-principles.md`** 를 반드시 읽는다 (공식 유도 필수, 비전공자용 설명, 시각화, 로드맵). Cursor: `.cursor/rules/mechanics-blog.mdc` · 루트 `CLAUDE.md`에도 동일 안내.

---

## 2. Frontmatter (필수)

레퍼런스: `posts/study/frontend/react-query/react-query-mutations.md`

```yaml
---
title: "글 제목"
slug: slug-name # 파일명(확장자 제외)과 동일 권장
category: study/frontend/xxx # 실제 폴더 경로와 맞출 것 (슬래시)
tags: [tag1, tag2]
author: Seobway
readTime: N # 분
featured: false
createdAt: YYYY-MM-DD
excerpt: >
  한 줄 또는 여러 줄 요약 (없으면 본문 앞 150자 자동 추출)
---
```

| 필드       | 설명                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------- |
| `slug`     | URL은 `/post/{slug}`                                                                               |
| `category` | 사이드바 분류; 하위 폴더면 `study/mechanics/basics`, `study/mechanics/earth-pressure` 등 전체 경로 |
| `featured` | 뱃지용; 인기 순위는 GA 조회수                                                                      |

### 선택: 표지 이미지

- frontmatter: `coverImage` / `image` / `thumbnail` / `hero` 중 하나에 URL 또는 `/로 시작하는 경로`
- 또는 본문 코드 펜스 밖 첫 `![](...)` 마크다운 이미지

### 선택: 글별 용어 설명 (팝오버용)

frontmatter에 `glossary` 객체 — 값은 **문자열**만:

```yaml
glossary:
  effective_stress: "공극수압을 뺀, 흙 골격에 전달되는 응력."
```

본문에서는 `[[effective_stress]]` 또는 `[[effective_stress|유효응력]]` 형태로 링크한다. `termId`는 `[a-zA-Z0-9_-]+`.

전역 용어는 `data/glossary.yml` (빌드 시 `public/glossary.json`).

---

## 3. 본문 구조·문체 (필수)

- **H1(`#`) 금지** — 제목은 frontmatter `title`이 H1.
- **H2(`##`)부터** 섹션 시작.
- 섹션 사이는 **`---` 한 줄**로 구분.
- 기술 설명은 **현재형** 위주 (`~한다`, `~이다`).

### 인라인 출처 (각주 대신 HTML)

Markdown `[^1]` / `[^1]:` **사용 금지.**

```markdown
...설명...<a href="https://example.com" target="_blank"><sup>[1]</sup></a>
```

### 페이지 하단

```markdown
## 참고

<a href="https://example.com" target="_blank">[1] 제목 — 사이트명</a>
```

- 섹션 제목은 **`## 참고`** 만 (`## 참고문헌` 금지).

```markdown
---

## 관련 글

- [다른 글 제목 →](/post/other-slug)
```

- **`## 관련 글`** 은 맨 아래 필수.
- 링크는 `[표시 제목 →](/post/slug)` 형식 (`[slug]` 코드 링크 금지).

---

## 4. 수식 (KaTeX)

빌드 스크립트(`generate-posts-data.js`)가 **`marked` 직전**에 치환한다.

| 종류       | 문법               | 비고                           |
| ---------- | ------------------ | ------------------------------ |
| 인라인     | `$ ... $`          | `$$` 와 구분됨                 |
| 디스플레이 | `$$` 줄바꿈 … `$$` | 가운데 정렬·스크롤용 래퍼 포함 |

**치환되지 않는 곳:** ` ``` … ``` ` 코드 펜스 전체, 인라인 `` `…` `` 안.

- LaTeX는 KaTeX가 지원하는 범위 (예: `\frac`, `\sigma`, `\varphi`, `\bigr`, `e^{i\theta}`).
- 애매하면 디스플레이 블록에 넣는다.

---

## 5. 일반 코드 블록

펜스에 **언어 태그 필수** (highlight.js).

등록된 예: `javascript`, `typescript`, `css`, `html`, `bash`, `python`, `yaml`, `json`, `sql`, `go`, `java`, `dockerfile`, `nginx`, `plaintext`, `shell` 등 (`post.tsx` 참고).

**다음 언어는 hljs 대신 전용 처리**되므로 본문은 JSON 한 줄 위주:

- `mermaid`
- `diagramatics`, `jsxgraph`, `three`

---

## 6. Mermaid

````markdown
```mermaid
%% desc: 한 줄 설명 (캡션에 표시)
flowchart LR
  A --> B
```
````

- 첫 번째 비-`%%` 줄로 다이어그램 종류를 추정해 최소 높이·캡션 배지를 잡는다.
- PC: 클릭 확대, 모서리 리사이즈 힌트.

---

## 7. 역학·시각화 펜스 (JSON preset)

포스트 페이지 로드 후 `hydrateMechanicsVisualizations`가 치환한다. **코드 내용은 한 줄 JSON**이 일반적.

### `diagramatics`

JSON에 선택 필드: **`caption`** (캡션 문구 덮어쓰기), **`interactive`: true** (`earth_pressure`, `retaining_3d`에서 주동/수동 토글 버튼 표시).

````markdown
```diagramatics
{"preset":"earth_pressure","interactive":true,"caption":"주동·수동을 버튼으로 전환"}
```
````

| preset                        | 설명                                           |
| ----------------------------- | ---------------------------------------------- |
| `earth_pressure`              | 토압 스케치(지반·벽·쐐기·화살표)               |
| `retaining_wall_fbd`          | 옹벽 자유물체도(Ph, W, Rn, T)                  |
| `pressure_triangle_resultant` | 삼각형 수평토압 분포와 합력 작용점             |
| `balance_horizontal`          | 한 물체에 작용하는 수평 힘의 평형(개념 스케치) |
| `lever_moment`                | 지렛대·축·팔 길이와 모멘트 직관                |
| `unit_circle_trig`            | 단위원·cos/sin 투영                            |

### `jsxgraph`

````markdown
```jsxgraph
{"preset":"harmonic_ts"}
```
````

| preset         | 설명                           |
| -------------- | ------------------------------ |
| `harmonic_ts`  | `cos t`, `sin t` (기본)        |
| `ka_kp_linear` | 깊이 z–압력 p 예시 선형 그래프 |

### `three` (Three.js + OrbitControls)

````markdown
```three
{"preset":"retaining_3d"}
```
````

| preset           | 설명                                          |
| ---------------- | --------------------------------------------- |
| `retaining_3d`   | 막류벽·지면·쐐기·화살표 3D                    |
| `complex_spiral` | 단위원·헬릭스·축·투영선 (오일러/cos/sin 직관) |

프리셋 추가·수정은 `src/lib/post-mechanics-viz.ts`.

---

## 8. 상대 링크 (같은 저장소의 다른 글)

마크다운에서 `./other-file.md` 로 쓰면 빌드 시 **`/post/other-file-slug`** 로 변환된다 (`filenameToSlug` 맵). slug는 보통 파일명과 같다.

---

## 9. 금지·주의

- `[^footnote]` / `[^id]:` 마크다운 각주
- `## 참고문헌`, `## 다음 글 안내`
- `[slug-only]` 형태의 코드 스타일 내부 링크
- `public/posts.json` 수동 편집
- 수식·용어 마크업이 필요한 내용을 **코드 펜스 안**에 넣기 (KaTeX·`[[term]]` 미적용)

---

## 10. 로컬 워크플로

```bash
npm run generate:posts   # posts.json 등 재생성 (글·수식·용어 반영)
npm run dev              # 미리보기
npm run build            # 프로덕션 검증
```

조회수·댓글 수는 **다음 배포 주기**의 fetch 스크립트로 갱신된다.

---

## 11. 체크리스트 (발행 전)

- [ ] `slug` = 파일명, `category` = 폴더 경로
- [ ] H2·`---`·`## 참고`·`## 관련 글`
- [ ] 수식·Mermaid·역학 블록이 코드 펜스 밖에서 의도대로인지
- [ ] `npm run generate:posts` 실행 후 확인

---

## 12. 관련 코드 경로

| 기능                       | 경로                                                          |
| -------------------------- | ------------------------------------------------------------- |
| 마크다운 → HTML + KaTeX    | `scripts/generate-posts-data.js`                              |
| 포스트 페이지·Mermaid·hljs | `src/pages/post.tsx`                                          |
| 역학 시각화                | `src/lib/post-mechanics-viz.ts`                               |
| KaTeX 스타일               | `src/index.css` (`katex.min.css`, `.post-math-display`, 다크) |
