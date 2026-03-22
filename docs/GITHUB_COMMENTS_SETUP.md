# GitHub 댓글 개수 가져오기 설정 가이드

이 가이드는 GitHub API를 사용하여 Utterances 댓글 개수를 가져오는 방법을 설명합니다.

## 1. GitHub Personal Access Token 생성

### 1.1 토큰 생성

1. [GitHub Settings](https://github.com/settings/tokens)에 접속
2. "Developer settings" > "Personal access tokens" > "Tokens (classic)" 클릭
3. "Generate new token" > "Generate new token (classic)" 클릭
4. 토큰 이름 입력 (예: "Blog Comments API")
5. 만료 기간 선택 (권장: 90일 또는 No expiration)
6. 권한 선택:
   - ✅ `public_repo` (Public 저장소의 Issues 읽기)
   - 또는 `repo` (Private 저장소 포함, 모든 권한)
7. "Generate token" 클릭
8. **토큰을 복사하여 안전한 곳에 저장** (한 번만 표시됨!)

### 1.2 토큰 형식

토큰은 다음과 같은 형식입니다:

```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 2. 환경 변수 설정

### 2.1 개발 모드 (.env 파일)

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# GitHub
COMMENTS_GH_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
UTTERANCES_REPO=your-username/your-repo
```

**예시:**

```env
COMMENTS_GH_PAT=ghp_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
UTTERANCES_REPO=seobway23/Laptop
```

### 2.2 GitHub Actions (프로덕션)

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿 추가:

1. **COMMENTS_GH_PAT**: Personal Access Token
2. **UTTERANCES_REPO**: 저장소 경로 (예: `username/repo-name`)

## 3. Utterances 설정 확인

### 3.1 Utterances 앱 설치

1. [Utterances App](https://github.com/apps/utterances)에 접속
2. "Configure" 클릭
3. 저장소 선택
4. "Install" 클릭

### 3.2 저장소 설정 확인

`src/pages/post.tsx`에서 Utterances 설정 확인:

```tsx
<UtterancesComments
  repo="your-username/your-repo" // ← 여기 확인
  issueTerm="pathname"
  useCard={true}
/>
```

## 4. 개발 모드에서 테스트

### 4.1 댓글 개수 가져오기

```bash
node scripts/fetch-github-comments.js
```

성공하면 다음과 같은 출력이 표시됩니다:

```
💬 댓글 개수 데이터 가져오기 시작...
📦 저장소: seobway23/Laptop
📡 GitHub API에서 Issues 가져오는 중...
✅ 3개의 Issue 발견
  ✓ react-18-concurrent-features: 5개 댓글
  ✓ typescript-advanced-patterns: 2개 댓글
  - css-in-js-best-practices: Issue 없음 (0개 댓글)

✅ 댓글 데이터를 public/comments.json에 저장했습니다.
📊 댓글 데이터: {
  "react-18-concurrent-features": 5,
  "typescript-advanced-patterns": 2,
  "css-in-js-best-practices": 0
}
```

### 4.2 생성된 파일 확인

`public/comments.json` 파일이 생성됩니다:

```json
{
  "react-18-concurrent-features": 5,
  "typescript-advanced-patterns": 2,
  "css-in-js-best-practices": 0
}
```

## 5. 문제 해결

### 5.1 "401 Unauthorized" 오류

- GitHub Personal Access Token이 올바른지 확인
- 토큰에 `public_repo` 또는 `repo` 권한이 있는지 확인
- 토큰이 만료되지 않았는지 확인

### 5.2 "404 Not Found" 오류

- `UTTERANCES_REPO` 환경 변수가 올바른 형식인지 확인 (예: `username/repo-name`)
- 저장소가 존재하고 접근 가능한지 확인

### 5.3 "Issues를 찾을 수 없습니다"

- Utterances가 제대로 설치되어 있는지 확인
- 저장소에 Issues가 생성되어 있는지 확인
- Issue의 title이나 body에 게시글 경로가 포함되어 있는지 확인

### 5.4 댓글 개수가 0으로 표시됨

- Utterances Issue가 실제로 생성되었는지 확인
- Issue에 댓글이 있는지 확인
- `scripts/fetch-github-comments.js`의 경로 매칭 로직 확인

## 6. Utterances Issue 매칭 방식

Utterances는 `issueTerm="pathname"`을 사용할 때 다음과 같이 Issue를 생성합니다:

- **Issue Title**: 게시글 경로 (예: `/post/react-18-concurrent-features`)
- **Issue Body**: Utterances가 자동으로 추가하는 메타데이터

스크립트는 다음 순서로 Issue를 찾습니다:

1. Issue title에 게시글 경로가 포함되어 있는지
2. Issue title에 slug가 포함되어 있는지
3. Issue body에 slug가 포함되어 있는지

## 7. 참고 자료

- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub Issues API](https://docs.github.com/en/rest/issues/issues)
- [Utterances Documentation](https://utteranc.es/)
