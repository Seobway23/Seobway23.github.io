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

**개발 모드:**

```bash
npm run fetch:views
```

**GitHub Actions 설정:**

1. GitHub 저장소의 Settings > Secrets에서 다음 시크릿 추가:

   - `GA_PROPERTY_ID`: Google Analytics 속성 ID
   - `GA_SERVICE_ACCOUNT_KEY`: 서비스 계정 JSON 키 전체 내용

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
