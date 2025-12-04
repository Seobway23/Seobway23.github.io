/**
 * GitHub API를 사용하여 Utterances 댓글 개수를 가져와서 JSON 파일로 저장하는 스크립트
 * 
 * 사용 전 설정:
 * 1. GitHub Personal Access Token 생성
 *    - GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
 *    - 권한: repo (public_repo만으로도 충분)
 * 2. 환경 변수에 GITHUB_TOKEN 설정
 *    - 개발 모드: .env 파일에 GITHUB_TOKEN=your_token 추가
 *    - GitHub Actions: Secrets에 GITHUB_TOKEN 추가
 * 
 * 개발 모드에서 실행:
 * node scripts/fetch-github-comments.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'seobway23/Laptop'; // 기본값, .env에서 변경 가능
const publicDir = path.join(__dirname, '../public');

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 게시글 slug 목록 가져오기
 */
function getPostSlugs() {
  try {
    // posts.ts 파일을 읽어서 slug 추출
    const postsPath = path.join(__dirname, '../src/lib/posts.ts');
    const postsContent = fs.readFileSync(postsPath, 'utf-8');
    
    // slug 패턴 찾기: slug: "react-18-concurrent-features"
    const slugMatches = postsContent.matchAll(/slug:\s*["']([^"']+)["']/g);
    const slugs = Array.from(slugMatches, match => match[1]);
    
    if (slugs.length > 0) {
      return slugs.map(slug => ({
        slug,
        path: `/post/${slug}`,
      }));
    }
  } catch (error) {
    console.warn('posts.ts에서 slug를 추출할 수 없습니다:', error.message);
  }
  
  // 기본값 반환
  return [
    { slug: 'react-18-concurrent-features', path: '/post/react-18-concurrent-features' },
  ];
}

/**
 * GitHub API로 Issues 가져오기
 */
async function fetchIssuesFromGitHub() {
  if (!GITHUB_TOKEN) {
    console.warn('⚠️  GITHUB_TOKEN이 설정되지 않았습니다.');
    console.warn('   개발 모드에서 사용하려면 .env 파일에 GITHUB_TOKEN을 추가하세요.');
    console.warn('   예: GITHUB_TOKEN=ghp_xxxxxxxxxxxx');
    return [];
  }

  const [owner, repo] = GITHUB_REPO.split('/');
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ModernDevBlog-FetchComments',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('GitHub 인증 실패. GITHUB_TOKEN을 확인하세요.');
      }
      if (response.status === 404) {
        throw new Error(`저장소를 찾을 수 없습니다: ${GITHUB_REPO}`);
      }
      throw new Error(`GitHub API 오류: ${response.status} ${response.statusText}`);
    }

    const issues = await response.json();
    // Pull requests는 제외 (issues만)
    return issues.filter(issue => !issue.pull_request);
  } catch (error) {
    console.error('GitHub API 호출 실패:', error.message);
    return [];
  }
}

/**
 * Issue에서 경로 추출 (Utterances는 pathname을 사용)
 * Utterances는 issue title이나 body에 경로 정보를 포함할 수 있음
 */
function extractPathFromIssue(issue) {
  // Issue title에서 경로 찾기
  const titleMatch = issue.title.match(/\/post\/([a-z0-9-]+)/i);
  if (titleMatch) {
    return `/post/${titleMatch[1]}`;
  }
  
  // Issue body에서 경로 찾기
  const bodyMatch = issue.body?.match(/\/post\/([a-z0-9-]+)/i);
  if (bodyMatch) {
    return `/post/${bodyMatch[1]}`;
  }
  
  // Utterances는 보통 title에 경로를 포함하므로, title 전체를 경로로 사용
  // 또는 issue number를 기반으로 매핑할 수도 있음
  return null;
}

/**
 * 게시글 경로를 slug로 변환
 */
function pathToSlug(path) {
  const match = path.match(/\/post\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * GitHub Issues에서 댓글 개수 가져오기
 */
async function fetchCommentsFromGitHub() {
  console.log('📡 GitHub API에서 Issues 가져오는 중...');
  
  const issues = await fetchIssuesFromGitHub();
  
  if (issues.length === 0) {
    console.warn('⚠️  Issues를 찾을 수 없습니다. 기본값을 사용합니다.');
    return generateDefaultComments();
  }

  console.log(`✅ ${issues.length}개의 Issue 발견`);

  const postSlugs = getPostSlugs();
  const comments = {};

  // 각 게시글에 대해 Issue 찾기
  postSlugs.forEach(({ slug, path: postPath }) => {
    // Issue에서 해당 경로를 가진 것 찾기
    const issue = issues.find(issue => {
      const issuePath = extractPathFromIssue(issue);
      return issuePath === postPath || 
             issue.title.includes(slug) ||
             issue.body?.includes(slug);
    });

    if (issue) {
      // comments_count는 issue 자체의 댓글 수 (첫 댓글 제외)
      // GitHub API는 comments 필드에 댓글 수를 제공
      comments[slug] = issue.comments || 0;
      console.log(`  ✓ ${slug}: ${comments[slug]}개 댓글`);
    } else {
      comments[slug] = 0;
      console.log(`  - ${slug}: Issue 없음 (0개 댓글)`);
    }
  });

  return comments;
}

/**
 * 기본 댓글 수 생성 (GitHub API를 사용할 수 없을 때)
 */
function generateDefaultComments() {
  const postSlugs = getPostSlugs();
  const comments = {};
  postSlugs.forEach(({ slug }) => {
    comments[slug] = 0;
  });
  return comments;
}

/**
 * 메인 함수
 */
async function main() {
  console.log('💬 댓글 개수 데이터 가져오기 시작...');
  console.log(`📦 저장소: ${GITHUB_REPO}`);
  
  if (!GITHUB_TOKEN) {
    console.log('\n⚠️  개발 모드 사용법:');
    console.log('1. .env 파일 생성 (프로젝트 루트에)');
    console.log('2. 다음 내용 추가:');
    console.log('   GITHUB_TOKEN=your_github_token_here');
    console.log('   GITHUB_REPO=your-username/your-repo');
    console.log('3. GitHub Personal Access Token 생성:');
    console.log('   https://github.com/settings/tokens');
    console.log('   권한: public_repo (또는 repo)');
    console.log('\n현재는 기본값(0)을 사용합니다.\n');
  }
  
  const comments = await fetchCommentsFromGitHub();
  
  // comments.json 파일로 저장
  const commentsPath = path.join(publicDir, 'comments.json');
  fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2), 'utf-8');
  
  console.log(`\n✅ 댓글 데이터를 ${commentsPath}에 저장했습니다.`);
  console.log('📊 댓글 데이터:', comments);
}

main().catch(console.error);

