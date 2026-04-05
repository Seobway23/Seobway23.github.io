# Claude Code Rules for This Project

Cursor·에이전트: **`posts/**/*.md` 를 쓰거나 고칠 때는 이 파일(블로그 규칙·기능 요약)을 반드시 따른다.** 동일 안내는 `.cursor/rules/blog-content-management.mdc` · `project-overview.mdc` 에도 있다. 상세 워크플로는 `.cursor/skills/blog-post-writing/SKILL.md` .

## PR 작성 규칙

- PR 본문에 세션 링크(`https://claude.ai/code/session_...`)를 절대 포함하지 않는다.

---

## 블로그 포스트 포맷 (필수 준수)

블로그 글을 쓸 때 반드시 `posts/study/frontend/react-query/react-query-mutations.md`를 레퍼런스로 따른다.

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

- 섹션 사이는 반드시 `---` 구분선으로 분리

### 3. 인라인 참조 (각주)

```markdown
본문에서 참조할 때는 superscript 링크:
...설명...<a href="https://example.com" target="_blank"><sup>[1]</sup></a>
```

### 4. 참고 섹션 (페이지 하단, 관련 글 바로 위)

```markdown
## 참고

<a href="https://example.com" target="_blank">[1] 제목 — 사이트명</a>

<a href="https://example.com" target="_blank">[2] 제목 — 사이트명</a>
```

- 섹션 제목은 반드시 `## 참고` (~~참고문헌~~ X)
- `[^footnote]:` markdown footnote 문법 사용 금지

### 5. 관련 글 섹션 (페이지 최하단 필수)

```markdown
---

## 관련 글

- [이전 글 제목 →](/post/slug)
- [다음 글 제목 →](/post/slug)
- [시리즈 메인 글 →](/post/slug)
```

- 반드시 `## 관련 글` 섹션을 글 맨 아래에 추가
- "다음 글 안내" 같은 임시 섹션 사용 금지
- 시리즈 글이면 이전/다음/메인 모두 링크
- 단독 글이면 관련 주제 글 링크

### 6. 금지 패턴

- `[^footnote_name]` 인라인 각주 → `<a href><sup>[N]</sup></a>` 사용
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
