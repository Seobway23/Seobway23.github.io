---
name: blog-post-writing
description: ModernDevBlog에 새 블로그 포스트를 작성하고 배포하는 전체 워크플로우. 포스트 생성, frontmatter 작성, 카테고리 구조 설정, JSON 재생성까지 안내. 새 글 작성, 포스트 추가, 마크다운 파일 생성을 요청할 때 사용.
---

# 블로그 포스트 작성 스킬

## 전체 자동화 흐름

```
posts/frontend/css/my-post.md 파일 추가
        ↓
git push origin main
        ↓
GitHub Actions 자동 실행
  ① generate:posts   → public/posts.json, public/posts-data.json
  ② fetch:views:prod → GA 조회수 → public/views.json
  ③ fetch:comments   → GitHub 댓글 수 → public/comments.json
        ↓
Vite 빌드 → GitHub Pages 배포 완료
```

**마크다운 파일 하나 추가 + push = 끝.** 나머지는 전부 자동.

---

## Step 1: 경로(카테고리) 결정

폴더 구조 = URL 카테고리 = 사이드바 분류:

```
posts/
  frontend/
    css/        → category: "frontend/css",  URL: /post/my-slug
    react/      → category: "frontend/react"
    typescript/ → category: "frontend/typescript"
  backend/
    nodejs/     → category: "backend/nodejs"
  devops/       → category: "devops"
```

> URL은 항상 `/post/{파일명(slug)}` 형식. 폴더 깊이와 무관.

---

## Step 2: Frontmatter 템플릿 (실제 파일 기준)

```markdown
---
title: "포스트 제목"
slug: my-post-slug
category: frontend/css
tags: [CSS, Frontend, Design]
author: Seobway
readTime: 6
featured: false
createdAt: 2025-01-25
excerpt: "포스트 요약 1-2문장. 없으면 본문 앞 150자 자동 추출."
---
```

### 필드 설명

| 필드        | 필수 | 설명                                  |
| ----------- | ---- | ------------------------------------- |
| `title`     | ✅   | 포스트 제목 (SEO, 카드 표시)          |
| `slug`      | ✅   | URL 식별자 = **파일명과 동일하게**    |
| `category`  | ✅   | 폴더 경로와 동일하게 (`frontend/css`) |
| `tags`      | ✅   | 태그 배열 (검색, 필터에 사용)         |
| `author`    | ✅   | 작성자명                              |
| `readTime`  | ✅   | 읽기 예상 시간 (분)                   |
| `featured`  | ✅   | 인기글 뱃지 표시 여부 (`false` 기본)  |
| `createdAt` | ✅   | 작성일 (`YYYY-MM-DD`)                 |
| `excerpt`   | 선택 | 없으면 본문 앞 150자 자동 추출        |

---

## Step 3: 마크다운 본문 규칙

- H1(`#`)은 쓰지 않음 → title이 H1 역할
- H2(`##`)부터 시작
- 코드 블록 언어 반드시 지정:

```
\`\`\`css
.container { display: grid; }
\`\`\`
```

지원 언어: `javascript` `typescript` `css` `html` `bash`

---

## Step 4: 로컬 확인 (선택)

```bash
npm run generate:posts   # posts.json 재생성
npm run dev              # http://localhost:5173 확인
```

---

## 각 기능 자동화 시점

| 기능               | 자동화 시점                                 |
| ------------------ | ------------------------------------------- |
| 포스트 목록 표시   | push 후 배포 완료 즉시                      |
| 조회수 카운트 시작 | 배포 후 첫 방문 시 GA 수집 시작             |
| 조회수 숫자 표시   | **다음 push** 때 GA에서 읽어와 반영         |
| 댓글 기능          | 배포 후 Utterances가 GitHub Issue 자동 생성 |
| 댓글 수 표시       | **다음 push** 때 GitHub API에서 읽어와 반영 |
| 인기글 순위        | **다음 push** 때 조회수 기준 자동 재정렬    |

---

## 주의사항

- `slug` 필드 = 파일명 (반드시 일치, 영문 소문자 + 하이픈만)
- `category` 필드 = 실제 폴더 경로와 일치 (`frontend/css`)
- `posts-data.json` 직접 수정 금지 (자동 생성)
- `featured: true`는 단순 뱃지 표시용, 인기글 순위는 GA 조회수로 결정
