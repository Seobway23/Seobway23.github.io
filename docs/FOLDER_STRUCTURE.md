# ModernDevBlog 폴더 구조 분석

> 분석일: 2026-03-19

---

## 전체 트리

```
ModernDevBlog/
├── .claude/                          # Claude Code 설정
│   └── settings.local.json
├── .cursor/                          # Cursor IDE 룰/스킬
│   ├── rules/                        # 도메인별 AI 규칙 (.mdc)
│   │   ├── blog-content-management.mdc
│   │   ├── build-scripts.mdc
│   │   ├── ga-analytics.mdc
│   │   ├── project-overview.mdc
│   │   ├── typescript-react-patterns.mdc
│   │   └── ui-components.mdc
│   └── skills/                       # 작업별 AI 스킬
│       ├── blog-post-writing/SKILL.md
│       ├── comments-system/SKILL.md
│       ├── deployment/SKILL.md
│       ├── ga-analytics/SKILL.md
│       └── korean-search/SKILL.md
├── .github/
│   └── workflows/
│       └── build.yml                 # GitHub Actions CI
├── docs/                             # 프로젝트 문서
│   ├── DEPLOYMENT.md
│   ├── DEPLOYMENT_SUMMARY.md
│   ├── FOLDER_STRUCTURE.md           # ← 이 파일
│   ├── GA_SETUP.md
│   ├── GITHUB_COMMENTS_SETUP.md
│   ├── QUICK_START.md
│   └── SETUP_GUIDE.md
├── posts/                            # 마크다운 블로그 포스트 (컨텐츠 소스)
│   └── study/
│       ├── frontend/
│       │   ├── css/
│       │   │   └── css-modern-techniques.md
│       │   ├── react/
│       │   │   └── react-18-concurrent-features.md
│       │   └── typescript/
│       │       └── typescript-advanced-patterns.md
│       └── infra/                    # CI/CD, 인프라 관련 포스트
│           ├── gitlab-cicd-guide.md
│           └── gitlab-artifacts-vs-cache.md
├── public/                           # 정적 자산 (빌드 결과 & 생성 JSON)
│   ├── comments.json                 # GitHub 댓글 캐시 (fetch-github-comments.js 생성)
│   ├── posts.json                    # 전체 포스트 데이터 (generate-posts-data.js 생성)
│   ├── posts-data.json               # 포스트 슬러그/경로 목록 (조회수/댓글 스크립트용)
│   ├── recent-comments.json          # 최신 댓글 (fetch-github-comments.js 생성)
│   └── views.json                    # GA 조회수 데이터 (fetch-ga-views.js 생성)
├── scripts/                          # 빌드/데이터 수집 스크립트 (Node.js)
│   ├── fetch-ga-views.js             # Google Analytics → views.json
│   ├── fetch-ga-views-dev.js         # GA 조회수 개발 버전
│   ├── fetch-github-comments.js      # GitHub Issues → comments.json
│   ├── generate-posts-data.js        # posts/*.md → public/posts.json
│   └── test-ga-paths.js              # GA 경로 테스트
├── server/                           # Express 서버 (로컬 개발용)
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── vite.ts
├── shared/
│   └── schema.ts                     # Post 타입 정의 (공유)
├── src/
│   ├── App.tsx                       # 라우팅 루트
│   ├── main.tsx
│   ├── index.css                     # 전역 CSS (Tailwind + 커스텀 변수)
│   ├── components/
│   │   ├── background-customizer.tsx # 배경 색상 커스터마이저
│   │   ├── code-block.tsx            # 코드 블록 컴포넌트
│   │   ├── comments-section.tsx      # 댓글 섹션
│   │   ├── header.tsx                # 상단 헤더 (검색, 테마 토글)
│   │   ├── layout.tsx                # 공통 레이아웃
│   │   ├── left-sidebar.tsx          # 카테고리 트리 사이드바
│   │   ├── post-card.tsx             # 포스트 카드 (목록 페이지)
│   │   ├── progress-bar.tsx          # 읽기 진행 바
│   │   ├── right-sidebar.tsx         # 목차/진행 사이드바
│   │   ├── search-dialog.tsx         # 검색 다이얼로그
│   │   ├── utterances-comments.tsx   # Utterances GitHub 댓글
│   │   └── ui/                       # Radix UI 기반 공통 컴포넌트 (30+)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-reading-progress.tsx
│   │   ├── use-theme.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── analytics.ts              # GA 이벤트 트래킹
│   │   ├── color-utils.ts            # 색상 유틸
│   │   ├── comments.ts               # 댓글 API
│   │   ├── data.ts
│   │   ├── korean-search.ts          # 한국어 검색 (형태소 기반 스코어링)
│   │   ├── post-views.ts             # 조회수 관리
│   │   ├── posts.ts                  # 포스트 로드/검색/필터 핵심 로직
│   │   ├── queryClient.ts            # TanStack Query 설정
│   │   ├── recent-comments.ts        # 최신 댓글 로드
│   │   ├── search-autocomplete.ts    # 검색 자동완성
│   │   ├── search-history.ts         # 검색 히스토리
│   │   ├── utils.ts
│   │   └── views.ts                  # views.json 로드
│   └── pages/
│       ├── about.tsx
│       ├── home.tsx                  # 홈 (포스트 목록, 검색, 카테고리 필터)
│       ├── not-found.tsx
│       └── post.tsx                  # 포스트 상세 (마크다운 렌더링, 머메이드, 댓글)
├── .env                              # 환경변수 (GA 키 등, git 제외)
├── ga-service-account-key.json       # GA 서비스 계정 키 (git 제외)
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 데이터 플로우

```
posts/*.md
    │
    ▼ (generate-posts-data.js)  gray-matter + marked
public/posts.json   ─────────────────────────────────────────────┐
                                                                   │
Google Analytics API                                               │
    │                                                              │
    ▼ (fetch-ga-views.js)                                          │
public/views.json   ──────────────┐                               │
                                   │                               │
GitHub Issues API                  │                               │
    │                              │                               │
    ▼ (fetch-github-comments.js)   │                               │
public/comments.json               │                               │
public/recent-comments.json        │                               │
                                   ▼                               ▼
                              src/lib/views.ts          src/lib/posts.ts
                                   │                       │
                                   └───────────┬───────────┘
                                               ▼
                                        React Components
                                     (home.tsx / post.tsx)
```

---

## 카테고리 구조 (자동 트리 생성)

폴더 경로 → 카테고리 (left-sidebar.tsx가 자동으로 트리 구성)

```
전체
└── study/
    ├── frontend/
    │   ├── css          (css-modern-techniques)
    │   ├── react        (react-18-concurrent-features)
    │   └── typescript   (typescript-advanced-patterns)
    └── infra/           ← 새로 추가
        ├── gitlab-cicd-guide
        └── gitlab-artifacts-vs-cache
```

---

## 기술 스택 요약

| 레이어 | 기술 |
|--------|------|
| UI 프레임워크 | React 18.3.1 + TypeScript |
| 라우팅 | wouter |
| 스타일링 | Tailwind CSS 3.4.1 + CSS 변수 테마 |
| UI 컴포넌트 | Radix UI primitives |
| 상태/비동기 | TanStack React Query 5.x |
| 빌드 | Vite 5.4 |
| 컨텐츠 | Markdown (gray-matter + marked) |
| 다이어그램 | Mermaid.js (동적 렌더링 + 줌) |
| 애널리틱스 | Google Analytics Data API v5 |
| 댓글 | Utterances (GitHub Issues 기반) |
| 한국어 검색 | 커스텀 스코어링 (제목 3x, 태그 2.5x, 본문 1x) |

---

## 새 포스트 추가 방법

```bash
# 1. 마크다운 파일 작성 (frontmatter 필수)
posts/study/infra/my-new-post.md

# 2. 포스트 데이터 재생성
node scripts/generate-posts-data.js

# 3. (선택) 빌드 전 GA 조회수 / 댓글 갱신
node scripts/fetch-ga-views.js
node scripts/fetch-github-comments.js
```

### Frontmatter 템플릿

```yaml
---
title: 포스트 제목
slug: url-friendly-slug
tags: [Tag1, Tag2, Tag3]
author: 작성자명
readTime: 10
featured: false
createdAt: 2026-03-19
excerpt: 포스트 요약 (150자 이내)
---
```
