# Claude Code Rules for This Project

## PR 작성 규칙

- PR 본문에 세션 링크(`https://claude.ai/code/session_...`)를 절대 포함하지 않는다.

---

## 블로그 포스트 포맷 (필수 준수)

블로그 글을 쓸 때 반드시 `posts/study/frontend/react-query/react-query-mutations.md`를 레퍼런스로 따른다.

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
