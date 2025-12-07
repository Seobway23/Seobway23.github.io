# GitHub 블로그 배포 가이드

이 가이드는 GitHub Actions를 사용하여 블로그를 자동으로 빌드하고 배포하는 전체 프로세스를 설명합니다.

## 📋 목차

1. [사전 준비사항](#사전-준비사항)
2. [GitHub 저장소 설정](#github-저장소-설정)
3. [Google Analytics 설정](#google-analytics-설정)
4. [GitHub 댓글 설정](#github-댓글-설정)
5. [GitHub Actions 설정](#github-actions-설정)
6. [배포 프로세스](#배포-프로세스)
7. [문제 해결](#문제-해결)

## 사전 준비사항

### 1. GitHub 저장소 준비

1. GitHub에 새 저장소 생성 (예: `your-username.github.io`)
2. 로컬 프로젝트를 저장소에 연결:

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### 2. GitHub Pages 활성화

1. 저장소 Settings > Pages로 이동
2. Source: "GitHub Actions" 선택
3. 저장

## GitHub 저장소 설정

### 1. Utterances 앱 설치

1. [Utterances App](https://github.com/apps/utterances)에 접속
2. "Configure" 클릭
3. 저장소 선택
4. "Install" 클릭

### 2. Utterances 설정 확인

`src/pages/post.tsx`에서 저장소 경로 확인:

```tsx
<UtterancesComments
  repo="your-username/your-repo" // ← 여기 수정
  issueTerm="pathname"
  useCard={true}
/>
```

## Google Analytics 설정

### 1. Google Analytics Measurement ID 발급

1. [Google Analytics](https://analytics.google.com/) 접속
2. 계정 및 속성 생성
3. 속성 설정에서 **Measurement ID** 확인 (형식: `G-XXXXXXXXXX`)
4. `.env` 파일에 추가:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Google Analytics Data API 설정

조회수 데이터를 가져오려면 추가 설정이 필요합니다.

**자세한 설정 방법:** [GA_SETUP.md](./GA_SETUP.md) 참고

**요약:**

1. Google Cloud Console에서 프로젝트 생성
2. Google Analytics Data API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. GitHub Secrets에 추가 (아래 참고)

## GitHub 댓글 설정

### 1. GitHub Personal Access Token 생성

1. [GitHub Settings > Tokens](https://github.com/settings/tokens) 접속
2. "Generate new token (classic)" 클릭
3. 토큰 이름 입력 (예: "Blog Comments API")
4. 권한 선택: `public_repo` 또는 `repo`
5. "Generate token" 클릭
6. **토큰 복사하여 안전한 곳에 저장**

**자세한 설정 방법:** [GITHUB_COMMENTS_SETUP.md](./GITHUB_COMMENTS_SETUP.md) 참고

## GitHub Actions 설정

### 1. GitHub Secrets 추가

저장소 Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

#### 필수 시크릿

1. **GITHUB_TOKEN**

   - 값: GitHub Personal Access Token (위에서 생성)
   - 설명: GitHub API 호출 및 Pages 배포용

2. **GITHUB_REPO**
   - 값: 저장소 경로 (예: `your-username/your-repo`)
   - 설명: 댓글 개수 가져오기용

#### 선택적 시크릿 (조회수 기능 사용 시)

3. **GA_PROPERTY_ID**

   - 값: Google Analytics 속성 ID (숫자, 예: `123456789`)
   - 설명: GA Data API 호출용

4. **GA_SERVICE_ACCOUNT_KEY**
   - 값: 서비스 계정 JSON 키 파일의 **전체 내용** (한 줄로)
   - 설명: GA API 인증용
   - **주의:** JSON 파일을 열어서 전체 내용을 복사하여 붙여넣기

### 2. Secrets 추가 방법

1. 저장소 Settings > Secrets and variables > Actions
2. "New repository secret" 클릭
3. Name과 Secret 입력
4. "Add secret" 클릭

**예시:**

```
Name: GITHUB_TOKEN
Secret: ghp_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

Name: GITHUB_REPO
Secret: your-username/your-repo

Name: GA_PROPERTY_ID
Secret: 123456789

Name: GA_SERVICE_ACCOUNT_KEY
Secret: {"type":"service_account","project_id":"..."}  ← JSON 전체 내용
```

## 배포 프로세스

### 1. 자동 배포 (GitHub Actions)

코드를 `main` 브랜치에 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "Update blog"
git push origin main
```

### 2. 배포 프로세스 상세

GitHub Actions는 다음 순서로 실행됩니다:

1. **코드 체크아웃** - 저장소 코드 가져오기
2. **Node.js 설정** - Node.js 18 설치
3. **의존성 설치** - `npm install`
4. **게시글 데이터 생성** - `scripts/generate-posts-data.js` 실행
   - `public/posts-data.json` 생성
5. **조회수 데이터 가져오기** - `scripts/fetch-ga-views.js` 실행
   - Google Analytics에서 조회수 가져오기
   - `public/views.json` 생성
   - 실패 시 기본값(0) 사용
6. **댓글 개수 가져오기** - `scripts/fetch-github-comments.js` 실행
   - GitHub API에서 댓글 개수 가져오기
   - `public/comments.json` 생성
   - 실패 시 기본값(0) 사용
7. **빌드** - `npm run build`
   - `dist` 디렉토리에 빌드 결과 생성
8. **GitHub Pages 배포** - `dist` 디렉토리를 GitHub Pages에 배포

### 3. 배포 확인

1. GitHub 저장소의 "Actions" 탭에서 워크플로우 실행 상태 확인
2. 배포 완료 후 `https://your-username.github.io` 접속
3. 게시글 페이지에서 조회수와 댓글 개수 확인

### 4. 수동 배포

필요시 GitHub Actions 탭에서 "Run workflow" 버튼으로 수동 실행 가능

## 문제 해결

### 1. 배포가 실패하는 경우

**확인 사항:**

- GitHub Secrets가 올바르게 설정되었는지 확인
- Actions 탭에서 오류 메시지 확인
- 로그에서 구체적인 오류 원인 확인

**일반적인 오류:**

#### "GA_PROPERTY_ID is not defined"

- GitHub Secrets에 `GA_PROPERTY_ID` 추가
- 또는 조회수 기능을 사용하지 않으려면 해당 스텝이 `continue-on-error: true`로 설정되어 있어 실패해도 계속 진행됨

#### "GITHUB_TOKEN authentication failed"

- GitHub Personal Access Token이 올바른지 확인
- 토큰에 `repo` 권한이 있는지 확인
- 토큰이 만료되지 않았는지 확인

#### "Repository not found"

- `GITHUB_REPO` 시크릿이 올바른 형식인지 확인 (예: `username/repo-name`)
- 저장소가 존재하고 접근 가능한지 확인

### 2. 조회수가 0으로 표시되는 경우

**확인 사항:**

1. Google Analytics가 제대로 설정되었는지 확인
2. `public/views.json` 파일이 생성되었는지 확인
3. GA Data API 권한이 올바르게 설정되었는지 확인
4. 게시글 경로가 GA에서 추적되고 있는지 확인

**해결 방법:**

- [GA_SETUP.md](./GA_SETUP.md)의 "문제 해결" 섹션 참고
- 개발 모드에서 `npm run fetch:views` 실행하여 테스트

### 3. 댓글 개수가 0으로 표시되는 경우

**확인 사항:**

1. Utterances 앱이 설치되어 있는지 확인
2. `public/comments.json` 파일이 생성되었는지 확인
3. GitHub Issues가 생성되었는지 확인
4. `GITHUB_REPO` 시크릿이 올바른지 확인

**해결 방법:**

- [GITHUB_COMMENTS_SETUP.md](./GITHUB_COMMENTS_SETUP.md)의 "문제 해결" 섹션 참고
- 개발 모드에서 `npm run fetch:comments` 실행하여 테스트

### 4. 빌드는 성공하지만 사이트가 표시되지 않는 경우

**확인 사항:**

1. GitHub Pages 설정 확인 (Settings > Pages)
2. Source가 "GitHub Actions"로 설정되어 있는지 확인
3. 배포된 브랜치 확인 (`gh-pages` 또는 `main`)

**해결 방법:**

- GitHub Pages 설정에서 Source를 "GitHub Actions"로 변경
- Actions 탭에서 배포 워크플로우가 성공적으로 완료되었는지 확인

### 5. 로컬에서는 작동하지만 배포 후 작동하지 않는 경우

**확인 사항:**

1. 환경 변수가 GitHub Secrets에 올바르게 설정되었는지 확인
2. 빌드 시점에 생성되는 파일들 (`views.json`, `comments.json`)이 포함되었는지 확인
3. 브라우저 콘솔에서 오류 확인

**해결 방법:**

- GitHub Actions 로그에서 빌드 과정 확인
- `public/views.json`과 `public/comments.json`이 `dist` 디렉토리에 포함되었는지 확인

## 개발 모드에서 테스트

배포 전에 로컬에서 테스트하려면:

```bash
# 게시글 데이터 생성
npm run generate:posts

# 조회수 데이터 가져오기 (GA 설정 필요)
npm run fetch:views

# 댓글 개수 가져오기 (GitHub Token 필요)
npm run fetch:comments

# 모두 가져오기
npm run fetch:all

# 빌드
npm run build

# 미리보기
npm run preview
```

## 추가 리소스

- [Google Analytics 설정 가이드](./GA_SETUP.md)
- [GitHub 댓글 설정 가이드](./GITHUB_COMMENTS_SETUP.md)
- [빠른 시작 가이드](./QUICK_START.md)
- [README.md](../README.md)

## 요약 체크리스트

배포 전 확인 사항:

- [ ] GitHub 저장소 생성 및 연결
- [ ] GitHub Pages 활성화 (Source: GitHub Actions)
- [ ] Utterances 앱 설치
- [ ] `src/pages/post.tsx`에서 저장소 경로 수정
- [ ] Google Analytics Measurement ID 발급 및 `.env` 설정
- [ ] (선택) GA Data API 설정
- [ ] GitHub Personal Access Token 생성
- [ ] GitHub Secrets 설정:
  - [ ] `GITHUB_TOKEN`
  - [ ] `GITHUB_REPO`
  - [ ] (선택) `GA_PROPERTY_ID`
  - [ ] (선택) `GA_SERVICE_ACCOUNT_KEY`
- [ ] 코드 푸시 및 배포 확인
- [ ] 사이트 접속 및 기능 테스트

모든 항목을 완료하면 블로그가 자동으로 배포됩니다! 🎉
