# 개발 모드 빠른 시작 가이드

로컬 개발 환경에서 블로그를 실행하고 조회수/댓글 기능을 테스트하는 방법입니다.

## 1. 프로젝트 설정

```bash
# 의존성 설치
npm install
```

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성:

```env
# Google Analytics (선택사항)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json

# GitHub (댓글 기능용)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/your-repo
```

## 3. 게시글 데이터 생성

```bash
npm run generate:posts
```

`public/posts-data.json` 파일이 생성됩니다.

## 4. 데이터 가져오기 (선택사항)

### 조회수 데이터 가져오기

```bash
npm run fetch:views
```

**필요한 설정:**

- Google Analytics Data API 설정 ([GA_SETUP.md](./GA_SETUP.md) 참고)
- `.env`에 `GA_PROPERTY_ID`, `GA_SERVICE_ACCOUNT_KEY` 설정

### 댓글 개수 가져오기

```bash
npm run fetch:comments
```

**필요한 설정:**

- GitHub Personal Access Token 생성 ([GITHUB_COMMENTS_SETUP.md](./GITHUB_COMMENTS_SETUP.md) 참고)
- `.env`에 `GITHUB_TOKEN`, `GITHUB_REPO` 설정

### 모든 데이터 가져오기

```bash
npm run fetch:all
```

## 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 6. 빌드 및 미리보기

```bash
# 빌드
npm run build

# 미리보기
npm run preview
```

## 문제 해결

### "GITHUB_TOKEN이 설정되지 않았습니다"

- `.env` 파일 확인
- `GITHUB_TOKEN`과 `GITHUB_REPO` 설정 확인

### "Google Analytics 설정이 없습니다"

- `.env` 파일에 `GA_PROPERTY_ID`, `GA_SERVICE_ACCOUNT_KEY` 설정
- JSON 키 파일 경로 확인

### "posts-data.json을 찾을 수 없습니다"

- `npm run generate:posts` 실행

### 댓글 개수가 0으로 표시됨

- `npm run fetch:comments` 실행
- `public/comments.json` 파일 확인
- Utterances 앱이 설치되어 있는지 확인

## 참고 문서

- [전체 배포 가이드](./DEPLOYMENT.md)
- [GA 설정 가이드](./GA_SETUP.md)
- [댓글 설정 가이드](./GITHUB_COMMENTS_SETUP.md)
