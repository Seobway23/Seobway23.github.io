# Modern Dev Blog

모던 웹 개발 기술을 다루는 기술 블로그입니다. React, TypeScript, Vite를 기반으로 구축되었습니다.

## 주요 기능

- 📝 마크다운 기반 게시글 작성 및 표시
- 💬 GitHub Issues 기반 댓글 시스템 (Utterances)
- 📊 Google Analytics를 통한 조회수 추적
- 🌓 다크/라이트 모드 지원
- 📱 반응형 디자인
- 🎨 커스터마이징 가능한 테마

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Google Analytics Measurement ID (프론트엔드 추적용)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Analytics Data API (조회수 가져오기용, 선택사항)
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json

# GitHub (댓글 개수 가져오기용, 선택사항)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/your-repo
```

#### Google Analytics Measurement ID 발급 방법

1. [Google Analytics](https://analytics.google.com/)에 접속
2. 계정 및 속성 생성
3. 속성 설정에서 **Measurement ID** 확인 (형식: `G-XXXXXXXXXX`)
4. `.env` 파일에 `VITE_GA_MEASUREMENT_ID`로 설정

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`으로 접속하세요.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 디렉토리에 생성됩니다.

## 프로젝트 구조

```
ModernDevBlog/
├── src/
│   ├── components/      # React 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── lib/            # 유틸리티 함수
│   ├── hooks/          # 커스텀 훅
│   └── App.tsx         # 메인 앱 컴포넌트
├── server/             # Express 서버 (선택사항)
├── public/             # 정적 파일
└── scripts/            # 빌드 스크립트
```

## 주요 기능 설명

### 댓글 시스템 (Utterances)

이 블로그는 [Utterances](https://utteranc.es/)를 사용하여 GitHub Issues 기반 댓글 시스템을 제공합니다.

**설정 방법:**

1. GitHub 저장소에서 Utterances 앱 설치
2. `src/pages/post.tsx`에서 `repo` prop을 실제 GitHub 저장소 경로로 변경

```tsx
<UtterancesComments
  repo="your-username/your-repo"
  issueTerm="pathname"
  useCard={true}
/>
```

### 조회수 추적

Google Analytics를 통해 게시글 조회수를 추적합니다. 조회수 데이터는 빌드 타임에 `public/views.json`으로 생성됩니다.

#### Google Analytics Property ID와 Measurement ID 찾는 방법

**⚠️ 중요**: Property ID와 Measurement ID는 서로 다른 값입니다!

- **Property ID**: 숫자만 (예: `123456789`) - Data API에서 조회수 가져오기용
- **Measurement ID**: `G-XXXXXXXXXX` 형식 - 프론트엔드 페이지뷰 추적용

**1. Measurement ID 찾는 방법 (프론트엔드 추적용):**

1. [Google Analytics](https://analytics.google.com/)에 접속
2. 관리(톱니바퀴 아이콘) > 데이터 스트림 클릭
3. 웹 스트림 선택 (또는 새로 생성)
4. **측정 ID** 확인 (형식: `G-XXXXXXXXXX`)
5. `.env` 파일에 `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` 형식으로 설정

**2. Property ID 찾는 방법 (Data API용):**

1. [Google Analytics](https://analytics.google.com/)에 접속
2. 관리(톱니바퀴 아이콘) > 속성 설정으로 이동
3. **속성 ID** 확인 (숫자만, 예: `123456789`)
   - 속성 정보 섹션 상단에 표시됨
   - 또는 URL에서 확인: `https://analytics.google.com/analytics/web/#/p123456789/`
4. `.env` 파일에 `GA_PROPERTY_ID=123456789` 형식으로 설정 (숫자만, G- 접두사 없음)

**📸 위치 확인:**

- **Measurement ID**: 관리 > 데이터 스트림 > 웹 스트림 > 측정 ID
- **Property ID**: 관리 > 속성 설정 > 속성 ID (속성 정보 섹션 상단)

#### 서비스 계정 키 설정 방법

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 프로젝트 선택 (또는 새로 생성)
3. **API 및 서비스 > 사용자 인증 정보**로 이동
4. **+ 사용자 인증 정보 만들기 > 서비스 계정** 선택
5. 서비스 계정 생성 후 **키** 탭에서 **JSON 키 추가**
6. 다운로드한 JSON 파일을 프로젝트 루트에 `ga-service-account-key.json`으로 저장
7. `.env` 파일에 `GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json` 설정

**⚠️ 중요**: `ga-service-account-key.json` 파일은 `.gitignore`에 추가하여 Git에 커밋하지 마세요!

#### 서비스 계정에 Google Analytics 권한 부여 (필수!)

서비스 계정이 Google Analytics 데이터에 접근하려면 **반드시** 다음 권한을 부여해야 합니다:

1. [Google Analytics](https://analytics.google.com/)에 접속
2. 관리(톱니바퀴 아이콘) > 속성 액세스 관리로 이동
3. **+ 추가** 클릭
4. 서비스 계정 이메일 주소 입력 (JSON 파일의 `client_email` 필드 값, 예: `blog-analytics-service@amplified-lamp-396305.iam.gserviceaccount.com`)
5. **역할** 선택:
   - **뷰어** (Viewer): 조회수 데이터 읽기만 가능 (권장)
   - 또는 **분석자** (Analyst): 더 많은 권한
6. **추가** 클릭

**⚠️ PERMISSION_DENIED 에러가 발생하면:**

- 위 단계를 통해 서비스 계정에 Analytics 권한을 부여했는지 확인
- 서비스 계정 이메일 주소가 정확한지 확인 (JSON 파일의 `client_email` 확인)
- Google Analytics 속성 ID(`GA_PROPERTY_ID`)가 올바른지 확인

#### Google Analytics Data API 활성화

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 선택
2. **API 및 서비스 > 라이브러리**로 이동
3. "Google Analytics Data API" 검색 후 **활성화**

#### 데이터 수집 설정 확인

**설정 > 데이터 수집 및 수정** 섹션에서:

- **데이터 수집**: Measurement ID만 설정하면 자동으로 활성화됩니다. 별도 설정 불필요 ✅
- **데이터 가져오기**: BigQuery 연동 등 다른 소스에서 데이터를 가져오는 기능입니다. **필수 아님** ❌
  - 우리는 GA Data API를 직접 사용하므로 이 설정은 필요 없습니다.

#### 조회수 데이터 가져오기

**개발 모드:**

```bash
# 1. 먼저 게시글 데이터 생성
npm run generate:posts

# 2. 조회수 데이터 가져오기
npm run fetch:views
```

**조회수가 0으로 나오는 경우:**

1. `.env` 파일에 `GA_PROPERTY_ID`와 `GA_SERVICE_ACCOUNT_KEY`가 올바르게 설정되었는지 확인
2. `npm run fetch:views` 실행 시 콘솔 로그 확인
3. Google Analytics에 실제 조회수 데이터가 있는지 확인 (GA 대시보드에서 확인)
4. 서비스 계정에 Analytics Data API 권한이 있는지 확인

#### Google Analytics에서 조회수 확인하는 방법

**1. 실시간 조회수 확인 (Realtime 보고서):**

- [Google Analytics](https://analytics.google.com/) 접속
- 왼쪽 메뉴에서 **보고서 > 실시간** 클릭
- **페이지 및 화면** 섹션에서 현재 방문 중인 페이지 확인
- URL 경로가 `/post/frontend/css/css-modern-techniques` 형식으로 표시됨

**2. 전체 조회수 확인 (보고서):**

- 왼쪽 메뉴에서 **보고서 > 참여도 > 페이지 및 화면** 클릭
- 기간 선택 (예: 지난 30일)
- 페이지 경로별 조회수 확인
- 경로 형식: `/post/frontend/css/css-modern-techniques`

**3. 이벤트 확인:**

- **보고서 > 참여도 > 이벤트** 클릭
- `post_view` 이벤트 확인 (게시글 조회수 추적용)
- `view` 이벤트 확인 (카테고리: post)

**4. views.json 갱신:**
조회수를 확인한 후, 다음 명령어로 `views.json`을 갱신하세요:

```bash
npm run fetch:views
```

이 명령어는 GA Data API에서 최신 조회수를 가져와 `public/views.json` 파일을 업데이트합니다.

**GitHub Actions 설정:**

1. GitHub 저장소의 Settings > Secrets에서 다음 시크릿 추가:

   - `GA_PROPERTY_ID`: Google Analytics 속성 ID (숫자)
   - `GA_SERVICE_ACCOUNT_KEY`: 서비스 계정 JSON 키 전체 내용 (한 줄로)

2. `.github/workflows/build.yml`이 자동으로 조회수 데이터를 가져와 빌드에 포함합니다.

### 댓글 개수 표시

GitHub Issues API를 통해 Utterances 댓글 개수를 가져옵니다. 댓글 개수 데이터는 빌드 타임에 `public/comments.json`으로 생성됩니다.

**개발 모드:**

```bash
npm run fetch:comments
```

**GitHub Actions 설정:**

1. GitHub 저장소의 Settings > Secrets에서 다음 시크릿 추가:

   - `GITHUB_TOKEN`: Personal Access Token (권한: `public_repo`)
   - `GITHUB_REPO`: 저장소 경로 (예: `username/repo-name`)

2. `.github/workflows/build.yml`이 자동으로 댓글 개수 데이터를 가져와 빌드에 포함합니다.

### 테마 커스터마이징

헤더의 테마 커스터마이저를 통해 그라디언트 색상을 변경할 수 있습니다.

## 기술 스택

- **프레임워크**: React 18
- **빌드 도구**: Vite
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태 관리**: TanStack Query
- **라우팅**: Wouter
- **코드 하이라이팅**: Highlight.js
- **댓글 시스템**: Utterances

## 라이선스

MIT
