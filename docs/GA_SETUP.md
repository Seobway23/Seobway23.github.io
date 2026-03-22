# Google Analytics API 설정 가이드

이 가이드는 Google Analytics Data API를 사용하여 블로그 게시글의 조회수를 가져오는 방법을 설명합니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 상단의 프로젝트 선택 드롭다운 클릭
3. "새 프로젝트" 클릭
4. 프로젝트 이름 입력 (예: "My Blog Analytics")
5. "만들기" 클릭

### 1.2 Google Analytics Data API 활성화

1. Google Cloud Console에서 "API 및 서비스" > "라이브러리" 메뉴로 이동
2. 검색창에 "Google Analytics Data API" 입력
3. "Google Analytics Data API" 선택
4. "사용" 버튼 클릭

## 2. 서비스 계정 생성

### 2.1 서비스 계정 만들기

1. "API 및 서비스" > "사용자 인증 정보" 메뉴로 이동
2. 상단의 "+ 사용자 인증 정보 만들기" 클릭
3. "서비스 계정" 선택
4. 서비스 계정 이름 입력 (예: "blog-analytics-service")
5. "만들기" 클릭

### 2.2 서비스 계정 키 다운로드

1. 생성된 서비스 계정 클릭
2. "키" 탭으로 이동
3. "키 추가" > "새 키 만들기" 클릭
4. 키 유형: "JSON" 선택
5. "만들기" 클릭
6. JSON 파일이 자동으로 다운로드됨

### 2.3 JSON 키 파일 저장

다운로드한 JSON 파일을 프로젝트 루트에 저장합니다:

```
ModernDevBlog/
├── ga-service-account-key.json  ← 여기에 저장
├── .env
└── ...
```

**⚠️ 중요:** 이 파일은 민감한 정보를 포함하므로 `.gitignore`에 추가하세요:

```gitignore
# Google Analytics 서비스 계정 키
ga-service-account-key.json
*.json
!package.json
!tsconfig.json
```

## 3. Google Analytics 권한 설정

### 3.1 속성 ID 확인

1. [Google Analytics](https://analytics.google.com/)에 접속
2. 관리(톱니바퀴 아이콘) > 속성 설정
3. 속성 ID 확인 (예: `123456789`)

### 3.2 서비스 계정에 권한 부여

1. Google Analytics 관리 > 속성 > 속성 액세스 관리
2. "+" 버튼 클릭 > "사용자 추가"
3. 서비스 계정 이메일 주소 입력 (JSON 파일의 `client_email` 필드)
4. 역할: "뷰어" 선택
5. "추가" 클릭

## 4. 환경 변수 설정

### 4.1 개발 모드 (.env 파일)

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Google Analytics
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json

# GitHub (댓글 가져오기용)
COMMENTS_GH_PAT=ghp_xxxxxxxxxxxx
UTTERANCES_REPO=your-username/your-repo
```

### 4.2 GitHub Actions (프로덕션)

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

1. **GA_PROPERTY_ID**: Google Analytics 속성 ID (예: `123456789`)
2. **GA_SERVICE_ACCOUNT_KEY**: 서비스 계정 JSON 키 파일의 전체 내용 (복사해서 붙여넣기)
3. **COMMENTS_GH_PAT**: GitHub Personal Access Token
4. **UTTERANCES_REPO**: GitHub 저장소 경로 (예: `username/repo-name`)

## 5. 개발 모드에서 테스트

### 5.1 필요한 패키지 설치

```bash
npm install @google-analytics/data
```

### 5.2 조회수 데이터 가져오기

```bash
node scripts/fetch-ga-views-dev.js
```

성공하면 `public/views.json` 파일이 생성됩니다.

### 5.3 댓글 개수 가져오기

```bash
node scripts/fetch-github-comments.js
```

성공하면 `public/comments.json` 파일이 생성됩니다.

## 6. 문제 해결

### 6.1 "Permission denied" 오류

- 서비스 계정에 Google Analytics "뷰어" 권한이 있는지 확인
- 속성 ID가 올바른지 확인

### 6.2 "API not enabled" 오류

- Google Cloud Console에서 "Google Analytics Data API"가 활성화되어 있는지 확인

### 6.3 "Invalid credentials" 오류

- JSON 키 파일 경로가 올바른지 확인
- `.env` 파일의 `GA_SERVICE_ACCOUNT_KEY` 경로 확인

## 7. 참고 자료

- [Google Analytics Data API 문서](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [서비스 계정 인증 가이드](https://cloud.google.com/docs/authentication/production)
- [GitHub Personal Access Token 생성](https://github.com/settings/tokens)
