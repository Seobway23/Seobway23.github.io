# Claude Code Rules for This Project

Cursor·에이전트: **`posts/**/\*.md`를 쓰거나 고칠 때는 이 파일(블로그 규칙·기능 요약)을 반드시 따른다.** 동일 안내는`.cursor/rules/blog-content-management.mdc`·`project-overview.mdc`에도 있다. 상세 워크플로는`.cursor/skills/blog-post-writing/SKILL.md` . Cursor·Antigravity 등 도구별 에이전트 힌트 요약은 루트 **`AGENTS.md`** .

## PR 작성 규칙

- PR 본문에 세션 링크(`https://claude.ai/code/session_...`)를 절대 포함하지 않는다.

## 블로그 포스트 포맷

수동 참고·관련 글 패턴은 `posts/study/frontend/react-query/react-query-mutations.md` 를 본다. `[^id]` 각주를 빌드가 합치는 예시는 `posts/study/network/micro/` 글을 본다.

**역학·토질·토압 시리즈** (`posts/study/mechanics/` 에 넣는 글): 추가로 **`docs/mechanics-post-principles.md`** 를 반드시 참고한다 — 공식 유도 필수, 비전공자용 설명, 시각화 원칙, 시리즈 로드맵. (Cursor는 같은 경로 편집 시 `.cursor/rules/mechanics-blog.mdc` 가 이를 상기한다.)

### 1. Frontmatter

```yaml
---
title: "글 제목"
slug: slug-name
category: study/frontend/xxx
tags: [tag1, tag2]
author: Seobway
readTime: N
featured: false
createdAt: YYYY-MM-DD
excerpt: >
  한 줄 요약
---
```

### 2. 본문 섹션 구분

- 섹션 사이는 `---` 구분선으로 분리한다.

### 3. 본문 인라인 출처

말미 `## 참고` 번호와 맞춘다.

```markdown
...설명...<a href="https://example.com" target="_blank"><sup>[1]</sup></a>
```

### 4. 말미 섹션 순서 (필수)

1. **`## 참고`**
2. **`## 관련 글`** (진짜 맨 아래)

`scripts/generate-posts-data.js` 는 `[^id]` 각주만 있는 글에도 동일하게 **`## 참고`** 를 넣고, 본문에 `## 관련 글` 이 있으면 **참고 블록을 그 앞에** 끼워 넣어 순서를 맞춘다.

### 5. `## 참고`

- 제목은 **`## 참고`** 만 쓴다 (`참고문헌` 등 금지).
- **수동 작성** 시 `<a>` 줄만 여러 개 두지 말고, 한 덩어리 `<ol>` 로 쓴다 (marked 가 `<p>` 로 끊어 보기가 나빠진다).

```markdown
## 참고

<ol>
<li><a href="https://example.com" target="_blank">[1] 제목 — 사이트명</a></li>
<li><a href="https://other.com" target="_blank">[2] 제목 — 사이트명</a></li>
</ol>
```

- **`[^id]` + `[^id]: ...` 각주:** 이 저장소에서 허용. 빌드 시 위와 같은 **`## 참고`** + `<ol>` 로 합쳐진다. 정의 줄에는 가능하면 `<a href="..." target="_blank">...</a>` 로 링크를 건다.

### 6. `## 관련 글`

```markdown
---

## 관련 글

- [이전 글 제목 →](/post/slug) — 한 줄 요약(선택)
- [다음 글 제목 →](/post/slug)
- [시리즈 메인 글 →](/post/slug)
```

- 내부 링크는 **`/post/slug`** 절대 경로.
- 시리즈면 이전·다음·메인을 채우고, 단독 글이면 관련 주제만.
- `## 다음 글` / `다음 글 안내` 같은 제목은 쓰지 않는다.
- 본문에서 “다음에는 … 살펴보겠다”처럼 **이어질 글**을 말하면, 그 문장에 **그 글의 `/post/slug` 링크**를 넣는다.

### 7. 금지·비권장

- `## 참고문헌` → `## 참고`
- `## 다음 글 안내` → `## 관련 글`
- `[slug-name]` 같은 코드 스타일 링크 → `[제목 →](/post/slug)` 형식

---

## 블로그 기능 요약 (콘텐츠 작성 시)

상세 프리셋·예시·체크리스트는 **`.cursor/skills/blog-post-writing/SKILL.md`** 를 본문으로 삼는다.

### 데이터·배포

- 글 수정 후 **`npm run generate:posts`** 로 `public/posts.json` 등을 갱신해야 로컬/다음 빌드에 반영된다. CI는 push 시 동일 스크립트를 돌린다.
- URL: **`/post/{slug}`** . 카테고리는 `posts/` 폴더 경로와 맞춘 `category` 필드.

### 수식 (KaTeX)

- **인라인:** `$...$`
- **디스플레이:** `$$` … `$$` (별도 블록)
- **적용 안 됨:** ` ``` ` 펜스 안, 인라인 `` ` `` 코드 안.

### Mermaid

- ` ```mermaid ` 블록. 선택: 첫 줄 근처 `%% desc: 캡션` .

### 콜아웃 (TIP·NOTICE·WARNING 등)

길이가 있는 글에서는 **핵심 한 줄·주의사항**을 `::: 종류` … `:::` 블록으로 감싸 두면 읽기 좋다. 빌드 시 색 구분된 박스로 렌더된다 (`scripts/generate-posts-data.js` + `src/index.css`의 `.post-callout--*`).

**문법:** 첫 줄에 `::: 소문자종류`만, 본문 마크다운, 마지막에 **단독 줄** `:::`

**지원 종류:** `tip`, `note`, `info`, `notice`, `success`, `important`, `warning`, `danger`, `caution` (역할: `tip`·`success`는 권장·완료, `notice`·`info`는 안내, `warning`·`danger`·`caution`은 주의·위험, `important`는 반드시 확인 등)

```markdown
::: notice
이 글은 **2026년 기준** 동작을 기준으로 설명한다.
:::

::: tip
로컬 확인 후에는 `npm run generate:posts` 로 정적 JSON을 갱신한다.
:::
```

### 역학 시각화 (전용 펜스)

- ` ```diagramatics` / `jsxgraph` / `three` — 본문은 JSON 한 줄 `{"preset":"..."}` .
- diagramatics: `earth_pressure`, `unit_circle_trig`
- jsxgraph: `harmonic_ts`, `ka_kp_linear`
- three: `retaining_3d`, `complex_spiral`

### 용어 사전

- 글 frontmatter `glossary: { termId: "설명 문자열" }` + 본문 `[[termId]]` 또는 `[[termId|표시어]]` .
- 전역: `data/glossary.yml` .

### 역학 시리즈 (`posts/study/mechanics/`)

- **`docs/mechanics-post-principles.md`** 필독 (유도·설명·시각화·로드맵).

### 그 밖

- 표지: frontmatter `coverImage` 등 또는 펜스 밖 첫 `![](...)`.
- 같은 저장소 글 링크: `./파일명.md` → 빌드 시 `/post/slug` 로 변환.
- 일반 코드: 언어 태그 필수. `mermaid`·역학 세 언어는 hljs 제외·전용 처리.

### 본문 규칙 빠른 복습

- H1 금지, H2부터. 섹션 사이 `---`.
- 출처는 `<a ...><sup>[N]</sup></a>` + 하단 `## 참고`.
- 맨 아래 `## 관련 글` 필수.
