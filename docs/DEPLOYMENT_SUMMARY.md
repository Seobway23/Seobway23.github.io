# 🚀 GitHub 블로그 배포 요약

## 빠른 시작 (5분 안에 배포하기)

### 1단계: GitHub 저장소 설정 (2분)

```bash
# 저장소 생성 및 연결
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

1. GitHub 저장소 Settings > Pages
2. Source: "GitHub Actions" 선택

### 2단계: Utterances 설치 (1분)

1. [Utterances App](https://github.com/apps/utterances) 접속
2. 저장소 선택 후 Install
3. `src/pages/post.tsx`에서 `repo` 수정

### 3단계: GitHub Secrets 설정 (2분)

저장소 Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

**필수:**

- `COMMENTS_GH_PAT`: Personal Access Token (권한: `public_repo`)
- `UTTERANCES_REPO`: 저장소 경로 (예: `username/repo-name`)

**선택사항 (조회수 기능 사용 시):**

- `GA_PROPERTY_ID`: Google Analytics 속성 ID
- `GA_SERVICE_ACCOUNT_KEY`: 서비스 계정 JSON 키 전체 내용

**Personal Access Token 생성:**

- [GitHub Settings > Tokens](https://github.com/settings/tokens)
- "Generate new token (classic)"
- 권한: `public_repo` 또는 `repo`

### 4단계: 배포

```bash
git push origin main
```

완료! 🎉 `https://your-username.github.io`에서 확인하세요.

---

## 조회수 기능 추가 (선택사항)

### Google Analytics Measurement ID

1. [Google Analytics](https://analytics.google.com/) 접속
2. 속성 생성 후 Measurement ID 확인 (예: `G-XXXXXXXXXX`)
3. `.env` 파일에 추가:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Google Analytics Data API (조회수 가져오기)

**자세한 설정:** [GA_SETUP.md](./GA_SETUP.md)

**요약:**

1. Google Cloud Console에서 프로젝트 생성
2. Google Analytics Data API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. GitHub Secrets에 추가:

```
GA_PROPERTY_ID = 123456789
GA_SERVICE_ACCOUNT_KEY = {"type":"service_account",...}  ← JSON 전체 내용
```

---

## 댓글 기능

댓글은 Utterances를 통해 작동합니다:

- 사용자가 댓글 작성 시 GitHub Issue 자동 생성
- 댓글 개수는 빌드 시점에 GitHub API로 자동 가져옴
- `COMMENTS_GH_PAT`과 `UTTERANCES_REPO` Secrets 설정 필요

---

## 전체 가이드

- **전체 배포 가이드:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **GA 설정 가이드:** [GA_SETUP.md](./GA_SETUP.md)
- **댓글 설정 가이드:** [GITHUB_COMMENTS_SETUP.md](./GITHUB_COMMENTS_SETUP.md)
- **빠른 시작:** [QUICK_START.md](./QUICK_START.md)

---

## 문제 해결

### 배포가 안 되는 경우

- GitHub Actions 탭에서 오류 확인
- Secrets가 올바르게 설정되었는지 확인

### 조회수가 0인 경우

- GA Measurement ID가 설정되었는지 확인
- GA Data API 설정 확인 (선택사항)

### 댓글이 안 보이는 경우

- Utterances 앱이 설치되었는지 확인
- `src/pages/post.tsx`의 `repo` 설정 확인

---

## 체크리스트

- [ ] GitHub 저장소 생성 및 연결
- [ ] GitHub Pages 활성화 (Source: GitHub Actions)
- [ ] Utterances 앱 설치
- [ ] `src/pages/post.tsx`에서 저장소 경로 수정
- [ ] GitHub Secrets 설정:
  - [ ] `COMMENTS_GH_PAT` (필수)
  - [ ] `UTTERANCES_REPO` (필수)
  - [ ] `GA_PROPERTY_ID` (선택)
  - [ ] `GA_SERVICE_ACCOUNT_KEY` (선택)
- [ ] 코드 푸시 및 배포 확인
