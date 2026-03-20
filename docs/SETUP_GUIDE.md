# ModernDevBlog 완전 설정 가이드

> **기존 GA_SETUP.md / DEPLOYMENT.md / GITHUB_COMMENTS_SETUP.md / QUICK_START.md / DEPLOYMENT_SUMMARY.md를 하나로 통합한 최신 가이드입니다.**

---

## 목차

1. [조회수 시스템 동작 원리](#1-조회수-시스템-동작-원리)
2. [댓글 시스템 동작 원리](#2-댓글-시스템-동작-원리)
3. [초기 설정 (처음 시작할 때)](#3-초기-설정-처음-시작할-때)
4. [Google Analytics 설정](#4-google-analytics-설정)
5. [GitHub Secrets 설정](#5-github-secrets-설정)
6. [로컬 개발 환경 설정](#6-로컬-개발-환경-설정)
7. [배포 프로세스](#7-배포-프로세스)
8. [문제 해결](#8-문제-해결)

---

## 1. 조회수 시스템 동작 원리

이 블로그는 **2-레이어 하이브리드** 조회수 시스템을 사용합니다.

### 레이어 1: 실시간 카운터 (counterapi.dev)

```
사용자가 포스트 진입
    ↓ (3초 후 - 실제 읽기 의도 확인)
counterapi.dev API 호출 → count +1
    ↓
PostCard / Post 페이지에서 즉시 갱신된 숫자 표시
```

- **설정 불필요** - 별도 계정/키 없이 바로 동작
- 네임스페이스: `moderndevblog` (고정값, `src/lib/counter.ts`에서 변경 가능)
- 무료, CORS 지원, 요청 제한 없음
- 단점: counterapi.dev 서버 장애 시 조회수 표시 안 됨 (기본값 0 표시)

### 레이어 2: GA 빌드타임 수집 (선택 사항)

```
GitHub Actions (push to main)
    ↓
npm run fetch:views:prod
    ↓
Google Analytics Data API 호출
    ↓
public/views.json 저장 { "slug": 조회수 }
    ↓
빌드에 포함 → 런타임에 초기값으로 사용
```

- GA 서비스 계정 설정이 필요 (아래 [4번 섹션](#4-google-analytics-설정) 참고)
- 설정하지 않아도 레이어 1(실시간)이 동작함

### 최종 표시 우선순위

```
counterapi.dev 값(>0) > GA views.json 값 > 포스트 기본값(0)
```

---

## 2. 댓글 시스템 동작 원리

### 실시간 댓글 (Utterances)

```
사용자가 포스트 페이지 진입
    ↓
utteranc.es 스크립트 로드 (CDN)
    ↓
GitHub Issues에서 해당 포스트의 댓글 표시
    ↓
사용자 댓글 작성 시 → GitHub Issue 자동 생성
```

### 댓글 수 (PostCard 표시용)

```
GitHub Actions (push to main)
    ↓
npm run fetch:comments
    ↓
GitHub API → Issues 목록 → 댓글 수 매핑
    ↓
public/comments.json 저장 { "slug": 댓글수 }
    ↓
빌드에 포함 → PostCard에서 표시
```

- `GITHUB_TOKEN`과 `GITHUB_REPO` 설정 필요

---

## 3. 초기 설정 (처음 시작할 때)

### 3-1. GitHub 저장소 연결

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### 3-2. GitHub Pages 활성화cx

1. 저장소 **Settings > Pages**
2. Source: **"GitHub Actions"** 선택

### 3-3. Utterances 앱 설치

1. [https://github.com/apps/utterances](https://github.com/apps/utterances) 접속
2. "Configure" → 저장소 선택 → "Install"

### 3-4. Utterances 저장소 경로 수정

`src/pages/post.tsx` 파일에서 수정:

```tsx
<UtterancesComments
  repo="your-username/your-repo" // ← 여기를 본인 저장소로 변경
  issueTerm="pathname"
  useCard={true}
/>
```

---

## 4. Google Analytics 설정

> GA 설정을 하지 않아도 실시간 카운터(레이어 1)는 동작합니다.
> GA를 설정하면 더 정확한 누적 데이터와 분석 대시보드를 이용할 수 있습니다.

### 4-1. GA Measurement ID 발급 (클라이언트 추적용)

1. [https://analytics.google.com/](https://analytics.google.com/) 접속
2. 계정 생성 → 속성 생성 (GA4)
3. **관리 > 데이터 스트림 > 웹 스트림**에서 **Measurement ID** 확인
   - 형식: `G-XXXXXXXXXX`
4. `.env` 파일에 추가:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4-2. GA Data API 설정 (빌드타임 조회수 수집용)

#### Google Cloud Console 설정

1. [https://console.cloud.google.com/](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (예: "My Blog Analytics")
3. **API 및 서비스 > 라이브러리** → "Google Analytics Data API" 검색 → "사용" 클릭

#### 서비스 계정 생성

1. **API 및 서비스 > 사용자 인증 정보** → "+ 사용자 인증 정보 만들기" → "서비스 계정"
2. 서비스 계정 이름 입력 (예: `blog-analytics-service`)
3. 생성 완료 후 서비스 계정 클릭 → **"키" 탭** → "키 추가" → "새 키 만들기" → **JSON** → "만들기"
4. JSON 파일 다운로드됨 → 프로젝트 루트에 `ga-service-account-key.json`으로 저장

> ⚠️ **중요**: `.gitignore`에 반드시 추가하세요
>
> ```gitignore
> ga-service-account-key.json
> ```

#### GA 속성에 서비스 계정 권한 부여

1. [https://analytics.google.com/](https://analytics.google.com/) → **관리 > 속성 설정**
2. **속성 액세스 관리** → "+" → "사용자 추가"
3. 서비스 계정 이메일 입력 (JSON 파일의 `client_email` 필드값)
4. 역할: **"뷰어"** 선택 → "추가"

#### 속성 ID 확인

**관리 > 속성 설정** 상단에 표시된 숫자 (예: `123456789`)

#### `.env` 파일에 추가

```env
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json
```

---

## 5. GitHub Secrets 설정

저장소 **Settings > Secrets and variables > Actions** 에서 추가:

| Secret 이름              | 값                                     | 필수 여부 |
| ------------------------ | -------------------------------------- | --------- |
| `GITHUB_TOKEN`           | GitHub Personal Access Token           | 필수      |
| `GITHUB_REPO`            | `username/repo-name`                   | 필수      |
| `GA_PROPERTY_ID`         | GA 속성 ID (숫자)                      | 선택      |
| `GA_SERVICE_ACCOUNT_KEY` | 서비스 계정 JSON **전체 내용** (한 줄) | 선택      |

### GitHub Personal Access Token 생성

1. [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. "Generate new token (classic)"
3. 권한: `public_repo` (Public 저장소) 또는 `repo` (전체)
4. 생성 후 복사 (한 번만 표시됨!)

### GA 서비스 계정 키 한 줄로 변환 (Windows)

PowerShell에서:

```powershell
(Get-Content ga-service-account-key.json -Raw) -replace "`r`n","" -replace "`n",""
```

또는 [https://www.minifyjson.org/](https://www.minifyjson.org/) 에서 JSON 압축 후 붙여넣기

---

## 6. 로컬 개발 환경 설정

### `.env` 파일 생성 (프로젝트 루트)

```env
# GA 클라이언트 추적 (필수)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# GA Data API (빌드타임 조회수, 선택사항)
GA_PROPERTY_ID=123456789
GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json

# GitHub 댓글 수 수집
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/your-repo
```

### 데이터 생성 및 개발 서버 실행

```bash
# 1. 포스트 JSON 생성 (posts/*.md → public/posts.json)
npm run generate:posts

# 2. 데이터 수집 (선택사항 - 환경변수 설정된 경우)
npm run fetch:views        # GA 조회수 → public/views.json
npm run fetch:comments     # GitHub 댓글 수 → public/comments.json
npm run fetch:all          # 위 두 가지 + generate:posts 동시 실행

# 3. 개발 서버
npm run dev
# → http://localhost:5173

# 4. 프로덕션 빌드 확인
npm run build
npm run preview
```

---

## 7. 배포 프로세스

### 자동 배포 (권장)

`main` 브랜치에 push하면 GitHub Actions가 자동 실행:

```bash
git add .
git commit -m "Update blog"
git push origin main
```

### GitHub Actions 실행 순서

```
1. 코드 체크아웃
2. Node.js 18 설치
3. npm install
4. npm run fetch:all:prod
   ├─ generate:posts    → public/posts.json, public/posts-data.json
   ├─ fetch:views:prod  → public/views.json (GA 실패 시 기본값 0)
   └─ fetch:comments    → public/comments.json (실패 시 기본값 0)
5. npm run build        → dist/
6. GitHub Pages 배포    → dist/ → gh-pages 브랜치
```

> `continue-on-error: true` 설정으로 GA/댓글 수집 실패해도 빌드는 계속 진행됩니다.

### 수동 배포

GitHub 저장소 **Actions 탭** → "Build and Deploy" → "Run workflow"

---

## 8. 문제 해결

### 조회수가 0으로만 표시될 때

**체크리스트:**

- [ ] 브라우저 개발자 도구 > Network 탭에서 `api.counterapi.dev` 요청 확인
- [ ] `counterapi.dev` 서버 상태 확인: [https://counterapi.dev/](https://counterapi.dev/)
- [ ] GA 설정 시: `public/views.json` 파일에 0이 아닌 값이 있는지 확인
- [ ] GA 설정 시: GitHub Actions 로그에서 `fetch:views:prod` 단계 오류 확인

**GA 조회수 로컬 테스트:**

```bash
npm run fetch:views
cat public/views.json
```

### 댓글이 표시되지 않을 때

**체크리스트:**

- [ ] `src/pages/post.tsx`에서 `repo` 값이 본인 저장소인지 확인
- [ ] 해당 저장소에 Utterances 앱이 설치되어 있는지 확인
- [ ] 저장소의 Issues 탭이 활성화되어 있는지 확인
- [ ] 브라우저에서 utteranc.es iframe이 로드되는지 확인

### 댓글 수가 PostCard에 표시되지 않을 때

```bash
# 로컬 테스트
npm run fetch:comments
cat public/comments.json
```

### 배포 실패 시

1. 저장소 **Actions 탭**에서 실패한 단계 확인
2. `GITHUB_TOKEN`, `GITHUB_REPO` Secrets 설정 확인
3. GitHub Pages 설정 확인 (Settings > Pages > Source: "GitHub Actions")

### GA "Permission denied" 오류

- 서비스 계정에 GA "뷰어" 권한 부여 여부 확인
- `GA_PROPERTY_ID`가 올바른지 확인 (Analytics 콘솔 > 관리 > 속성 설정)

### GA "API not enabled" 오류

- Google Cloud Console에서 "Google Analytics Data API" 활성화 여부 확인

---

## 빠른 체크리스트

### 최소 설정 (조회수 실시간 동작)

- [ ] `src/pages/post.tsx`의 `repo` 값 수정
- [ ] GitHub Pages 활성화 (Source: GitHub Actions)
- [ ] Utterances 앱 설치
- [ ] `GITHUB_TOKEN`, `GITHUB_REPO` Secrets 추가
- [ ] push → 배포 확인

### 조회수 GA 통합 (선택)

- [ ] `.env`에 `VITE_GA_MEASUREMENT_ID` 추가
- [ ] Google Cloud Console 프로젝트 생성
- [ ] Google Analytics Data API 활성화
- [ ] 서비스 계정 생성 + JSON 키 다운로드
- [ ] GA 속성에 서비스 계정 뷰어 권한 부여
- [ ] `GA_PROPERTY_ID`, `GA_SERVICE_ACCOUNT_KEY` Secrets 추가
