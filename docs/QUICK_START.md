# 빠른 시작 가이드

개발 모드에서 조회수와 댓글 개수를 가져오는 방법을 간단히 설명합니다.

## 1. 필요한 패키지 설치

```bash
npm install @google-analytics/data
```

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Google Analytics
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json

# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/your-repo
```

## 3. Google Analytics 설정

자세한 설정 방법은 [docs/GA_SETUP.md](./docs/GA_SETUP.md)를 참고하세요.

**요약:**

1. Google Cloud Console에서 프로젝트 생성
2. Google Analytics Data API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. JSON 키 파일을 프로젝트에 저장
5. Google Analytics에서 서비스 계정에 "뷰어" 권한 부여

## 4. GitHub 설정

자세한 설정 방법은 [docs/GITHUB_COMMENTS_SETUP.md](./docs/GITHUB_COMMENTS_SETUP.md)를 참고하세요.

**요약:**

1. GitHub Personal Access Token 생성 (권한: `public_repo`)
2. `.env` 파일에 토큰 추가

## 5. 데이터 가져오기

```bash
# 조회수만 가져오기
npm run fetch:views

# 댓글 개수만 가져오기
npm run fetch:comments

# 둘 다 가져오기
npm run fetch:all
```

성공하면 `public/views.json`과 `public/comments.json` 파일이 생성됩니다.

## 6. 개발 서버 실행

```bash
npm run dev
```

이제 블로그에서 조회수와 댓글 개수가 표시됩니다!

## 문제 해결

### "GITHUB_TOKEN이 설정되지 않았습니다"

- `.env` 파일이 프로젝트 루트에 있는지 확인
- `.env` 파일에 `GITHUB_TOKEN`이 올바르게 설정되어 있는지 확인

### "Google Analytics 설정이 없습니다"

- `.env` 파일에 `GA_PROPERTY_ID`와 `GA_SERVICE_ACCOUNT_KEY`가 설정되어 있는지 확인
- JSON 키 파일 경로가 올바른지 확인

### "Permission denied" 오류

- Google Analytics에서 서비스 계정에 권한이 부여되었는지 확인
- GitHub 토큰에 올바른 권한이 있는지 확인
