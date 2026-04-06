# Claude Code Rules for This Project

## PR 작성 규칙

- PR 본문에 세션 링크(`https://claude.ai/code/session_...`)를 절대 포함하지 않는다.

## 블로그 포스트 포맷

수동 참고·관련 글 패턴은 `posts/study/frontend/react-query/react-query-mutations.md` 를 본다. `[^id]` 각주를 빌드가 합치는 예시는 `posts/study/network/micro/` 글을 본다.

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
- `## 다음 글` / `## 다음 글 안내` → `## 관련 글`
- `[slug-name]` 만 있는 링크 → `[제목 →](/post/slug)`

더 자세한 설명: `.cursor/skills/blog-post-writing/SKILL.md` 의 「말미 섹션 규칙」.
