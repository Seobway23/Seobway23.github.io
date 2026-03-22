---
name: comments-system
description: GitHub Issues 기반 Utterances 댓글 시스템 설정, 댓글 수 수집 스크립트 관리, 테마 동기화. 댓글 설정, Utterances 수정, 댓글 수 표시 문제를 요청할 때 사용.
---

# 댓글 시스템 스킬

## 시스템 구성

```
Utterances (CDN 스크립트)     → 실시간 GitHub Issues 댓글
GitHub API (빌드타임 스크립트) → public/comments.json (댓글 수)
                              → public/recent-comments.json (최신 댓글)
```

## Utterances 설정

`src/components/utterances-comments.tsx`:
```typescript
// 설정 변경 위치
const utterancesConfig = {
  repo: "seobway23/Laptop",    // GitHub 저장소
  issueTerm: "pathname",       // 이슈 식별 방식
  theme: isDark ? "github-dark" : "github-light",
};
```

### 저장소 변경 시
1. `utterances-comments.tsx`의 `repo` 값 수정
2. `.env`의 `UTTERANCES_REPO`, `COMMENTS_GH_PAT` 업데이트 (댓글 수 스크립트는 env만 사용)
3. 해당 저장소에 [utterances GitHub App](https://utteranc.es/) 설치

## 테마 동기화

댓글 iframe에 테마 변경 메시지 전송:
```typescript
// utterances-comments.tsx 내부
useEffect(() => {
  const iframe = document.querySelector<HTMLIFrameElement>('.utterances-frame');
  if (!iframe) return;
  iframe.contentWindow?.postMessage(
    { type: 'set-theme', theme: isDark ? 'github-dark' : 'github-light' },
    'https://utteranc.es'
  );
}, [isDark]);
```

## 댓글 수 수집

```bash
npm run fetch:comments
# → public/comments.json: { "post-slug": 댓글수 }
# → public/recent-comments.json: [ { slug, author, content, date } ]
```

### comments.json 형식
```json
{
  "css-modern-techniques": 3,
  "react-18-concurrent-features": 7
}
```

## 런타임 댓글 수 표시

`src/lib/comments.ts` → PostCard에서 사용:
```typescript
import { getPostCommentCount } from "@/lib/comments";

const commentCount = await getPostCommentCount(post.slug);
```

## 최신 댓글 (LeftSidebar)

`src/lib/recent-comments.ts`:
```typescript
import { getRecentComments } from "@/lib/recent-comments";

const recentComments = await getRecentComments(5); // 최근 5개
```

## 설정 가이드
- [docs/GITHUB_COMMENTS_SETUP.md](../../docs/GITHUB_COMMENTS_SETUP.md)
