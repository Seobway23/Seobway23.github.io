# Claude Code Rules for This Project

## PR 작성 규칙

- PR 본문에 세션 링크(`https://claude.ai/code/session_...`)를 절대 포함하지 않는다.

## 블로그 포스트 말미 형식

- 섹션 순서: **`## 참고`** 다음에 **`## 관련 글`** (빌드 스크립트가 각주 글에서도 동일 순서로 합침).
- 참고 목록: `<ol><li><a href="..." target="_blank">[n] 제목 — 출처</a></li></ol>` (빈 `<a>` 줄 나열 금지).
- 관련 글: `- [제목 →](/post/slug) — 요약` 패턴, 내부 링크는 `/post/...` 절대 경로.
- 본문에서 다음 글을 예고하는 문장(“다음에는…”)에는 **반드시 그 글의 `/post/slug` 링크**를 넣는다.
- 시리즈 네비게이션 제목도 **`## 관련 글`** 로 통일 (`다음 글` 등 사용 안 함).
- 상세: `.cursor/skills/blog-post-writing/SKILL.md` 의 「말미 섹션 규칙」.
