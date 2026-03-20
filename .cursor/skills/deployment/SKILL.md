---
name: deployment
description: ModernDevBlog GitHub Pages 배포 워크플로우, GitHub Actions 설정, 빌드 파이프라인 수정. 배포, CI/CD, GitHub Actions 수정, 빌드 오류 해결을 요청할 때 사용.
---

# 배포 스킬

## 배포 흐름

```
git push to main
    ↓
.github/workflows/build.yml
    ↓
1. npm run fetch:all:prod
   ├─ generate:posts    (posts/*.md → public/posts.json)
   ├─ fetch:views:prod  (GA API → public/views.json)
   └─ fetch:comments    (GitHub API → public/comments.json)
    ↓
2. npm run build (Vite 빌드 → dist/)
    ↓
3. peaceiris/actions-gh-pages → gh-pages 브랜치
    ↓
GitHub Pages 공개
```

## 로컬 빌드 테스트

```bash
npm run fetch:all        # 데이터 수집 (개발용 GA 스크립트)
npm run build            # Vite 빌드
npx serve dist           # 빌드 결과 로컬 확인
```

## GitHub Secrets 설정 목록

| Secret | 설명 |
|--------|------|
| `GA_PROPERTY_ID` | GA4 속성 ID |
| `GA_SERVICE_ACCOUNT_KEY` | GA 서비스 계정 JSON (한 줄) |
| `GITHUB_TOKEN` | GitHub PAT (자동 제공) |
| `GITHUB_REPO` | 댓글 저장소 (`user/repo`) |

## 배포 오류 대응

### GA 수집 실패 시
- `views.json`이 없어도 빌드 계속 진행 (views=0으로 표시)
- GitHub Actions 로그에서 `fetch:views:prod` 단계 확인
- `npm run test:ga-paths`로 경로 매핑 확인

### 포스트 생성 실패 시
```bash
# 오류 원인 확인
node scripts/generate-posts-data.js
# frontmatter YAML 문법 오류인 경우가 많음
```

### 빌드 캐시 초기화
```bash
rm -rf node_modules dist
npm install
npm run build
```

## GitHub Pages 설정 확인
- Repository > Settings > Pages
- Source: `gh-pages` 브랜치 / `/ (root)`
- Custom domain 사용 시 `public/CNAME` 파일 추가

## 참고 문서
- [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md)
- [docs/DEPLOYMENT_SUMMARY.md](../../docs/DEPLOYMENT_SUMMARY.md)
- [docs/QUICK_START.md](../../docs/QUICK_START.md)
