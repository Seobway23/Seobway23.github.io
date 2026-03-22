/**
 * GitHub Issues API를 사용하여 Utterances 댓글 개수를 가져오는 스크립트
 *
 * 사용 전 설정:
 * 1. GitHub Personal Access Token 생성 (권한: public_repo)
 * 2. 환경 변수에 GITHUB_TOKEN, GITHUB_REPO 설정
 *
 * 개발 모드: .env 파일에 설정
 * 프로덕션: GitHub Secrets에 설정
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// .env 파일 로드 (개발 모드용)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../public");
const postsDataPath = path.join(publicDir, "posts-data.json");

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 게시글 slug 목록 가져오기
 */
function getPostSlugs() {
  try {
    if (fs.existsSync(postsDataPath)) {
      const postsData = JSON.parse(fs.readFileSync(postsDataPath, "utf-8"));
      return postsData.map((post) => ({
        slug: post.slug,
        path: post.path || `/post/${post.slug}`,
      }));
    }
  } catch (error) {
    console.warn(
      "⚠️ posts-data.json을 찾을 수 없습니다. generate-posts-data.js를 먼저 실행하세요."
    );
  }

  return [];
}

/**
 * GitHub API로 Issues 가져오기
 */
async function fetchIssuesFromGitHub(repo, token) {
  const issues = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      const url = `https://api.github.com/repos/${repo}/issues?state=all&per_page=${perPage}&page=${page}&sort=created&direction=desc`;
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ModernDevBlog",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("GitHub 인증 실패. GITHUB_TOKEN을 확인하세요.");
        }
        if (response.status === 404) {
          throw new Error(`저장소를 찾을 수 없습니다: ${repo}`);
        }
        throw new Error(
          `GitHub API 오류: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Issues만 필터링 (Pull Request 제외)
      const pageIssues = data.filter((issue) => !issue.pull_request);

      if (pageIssues.length === 0) {
        break;
      }

      issues.push(...pageIssues);

      // 마지막 페이지인 경우
      if (data.length < perPage) {
        break;
      }

      page++;
    } catch (error) {
      if (error.message.includes("fetch")) {
        throw new Error(
          "네트워크 오류가 발생했습니다. 인터넷 연결을 확인하세요."
        );
      }
      throw error;
    }
  }

  return issues;
}

/**
 * Issue에서 댓글 개수 가져오기
 */
async function fetchCommentsCount(issueUrl, token) {
  try {
    const response = await fetch(issueUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ModernDevBlog",
      },
    });

    if (!response.ok) {
      return 0;
    }

    const issue = await response.json();
    // body는 댓글이 아니므로 comments만 카운트
    return issue.comments || 0;
  } catch (error) {
    console.warn(`댓글 개수 가져오기 실패: ${issueUrl}`, error.message);
    return 0;
  }
}

/**
 * Issue의 실제 댓글 내용 가져오기
 */
async function fetchIssueComments(issueNumber, repo, token) {
  try {
    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments?per_page=100&sort=created&direction=desc`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ModernDevBlog",
      },
    });

    if (!response.ok) {
      return [];
    }

    const comments = await response.json();
    return comments.map((comment) => ({
      author: comment.user?.login || "Unknown",
      content: comment.body || "",
      date: comment.created_at || new Date().toISOString(),
      url: comment.html_url || "",
    }));
  } catch (error) {
    console.warn(
      `댓글 내용 가져오기 실패: Issue #${issueNumber}`,
      error.message
    );
    return [];
  }
}

/**
 * 마크다운/HTML 태그 제거하고 텍스트만 추출
 */
function stripMarkdown(text) {
  if (!text) return "";
  // HTML 태그 제거
  let cleaned = text.replace(/<[^>]*>/g, "");
  // 마크다운 링크 제거 [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  // 마크다운 강조 제거 **text** -> text, *text* -> text
  cleaned = cleaned.replace(/\*\*([^\*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*([^\*]+)\*/g, "$1");
  // 코드 블록 제거
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  // 줄바꿈 정리
  cleaned = cleaned.replace(/\n+/g, " ").trim();
  // 최대 길이 제한
  return cleaned.length > 150 ? cleaned.substring(0, 150) + "..." : cleaned;
}

/**
 * Issue를 게시글 slug와 매칭
 */
function matchIssueToPost(issue, postSlugs) {
  const issueTitle = issue.title || "";
  const issueBody = issue.body || "";

  // Utterances는 issueTerm="pathname"일 때 경로를 title에 포함
  for (const post of postSlugs) {
    const postPath = post.path;
    const slug = post.slug;

    // Issue title에 경로가 포함되어 있는지 확인
    if (issueTitle.includes(postPath) || issueTitle.includes(slug)) {
      return slug;
    }

    // Issue body에 slug가 포함되어 있는지 확인
    if (issueBody.includes(slug) || issueBody.includes(postPath)) {
      return slug;
    }
  }

  return null;
}

/**
 * 메인 함수
 */
async function main() {
  console.log("💬 댓글 개수 데이터 가져오기 시작...");

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;

  if (!GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN이 설정되지 않았습니다.");
    console.error(
      "   .env 파일에 GITHUB_TOKEN을 추가하거나 환경 변수를 설정하세요."
    );
    process.exit(1);
  }

  if (!GITHUB_REPO) {
    console.error("❌ GITHUB_REPO가 설정되지 않았습니다.");
    console.error(
      "   .env 파일에 GITHUB_REPO를 추가하거나 환경 변수를 설정하세요."
    );
    console.error("   형식: username/repo-name");
    process.exit(1);
  }

  console.log(`📦 저장소: ${GITHUB_REPO}`);

  // 게시글 slug 목록 가져오기
  const postSlugs = getPostSlugs();
  console.log(`📝 ${postSlugs.length}개의 게시글 발견`);

  // 게시글 정보 맵 (slug -> title)
  const postsMap = {};
  try {
    if (fs.existsSync(postsDataPath)) {
      const postsData = JSON.parse(fs.readFileSync(postsDataPath, "utf-8"));
      postsData.forEach((post) => {
        postsMap[post.slug] = post.title || post.slug;
      });
    }
  } catch (error) {
    console.warn("⚠️ posts-data.json을 읽을 수 없습니다.");
  }

  // 댓글 개수 초기화
  const comments = {};
  postSlugs.forEach(({ slug }) => {
    comments[slug] = 0;
  });

  // 최신 댓글 배열
  const recentComments = [];

  try {
    // GitHub API에서 Issues 가져오기
    console.log("📡 GitHub API에서 Issues 가져오는 중...");
    const issues = await fetchIssuesFromGitHub(GITHUB_REPO, GITHUB_TOKEN);
    console.log(`✅ ${issues.length}개의 Issue 발견`);

    // 각 Issue를 게시글과 매칭하고 댓글 개수 및 내용 가져오기
    for (const issue of issues) {
      const matchedSlug = matchIssueToPost(issue, postSlugs);

      if (matchedSlug) {
        const commentCount = await fetchCommentsCount(issue.url, GITHUB_TOKEN);
        comments[matchedSlug] = commentCount;
        console.log(`  ✓ ${matchedSlug}: ${commentCount}개 댓글`);

        // 댓글이 있으면 실제 댓글 내용 가져오기
        if (commentCount > 0 && issue.number) {
          const issueComments = await fetchIssueComments(
            issue.number,
            GITHUB_REPO,
            GITHUB_TOKEN
          );

          // 각 댓글을 recentComments에 추가
          issueComments.forEach((comment) => {
            recentComments.push({
              slug: matchedSlug,
              postTitle: postsMap[matchedSlug] || matchedSlug,
              author: comment.author,
              content: stripMarkdown(comment.content),
              date: comment.date,
              url: comment.url,
            });
          });
        }
      }
    }

    // 최신 댓글을 날짜순으로 정렬 (최신순)
    recentComments.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    const validSlugSet = new Set(postSlugs.map((p) => p.slug));
    const onlyExistingPosts = recentComments.filter((c) =>
      validSlugSet.has(c.slug)
    );

    // 최대 10개만 유지 (현재 posts-data.json에 있는 글만)
    const topRecentComments = onlyExistingPosts.slice(0, 10);

    // 매칭되지 않은 게시글 표시
    const unmatchedPosts = postSlugs.filter(({ slug }) => comments[slug] === 0);
    if (unmatchedPosts.length > 0) {
      console.log(`\n⚠️ Issue가 없는 게시글 (0개 댓글):`);
      unmatchedPosts.forEach(({ slug }) => {
        console.log(`  - ${slug}`);
      });
    }

    // comments.json 파일로 저장 (댓글 개수)
    const commentsPath = path.join(publicDir, "comments.json");
    fs.writeFileSync(commentsPath, JSON.stringify(comments, null, 2), "utf-8");
    console.log(`\n✅ 댓글 개수 데이터를 ${commentsPath}에 저장했습니다.`);

    // recent-comments.json 파일로 저장 (최신 댓글 내용)
    const recentCommentsPath = path.join(publicDir, "recent-comments.json");
    fs.writeFileSync(
      recentCommentsPath,
      JSON.stringify(topRecentComments, null, 2),
      "utf-8"
    );
    console.log(
      `✅ 최신 댓글 데이터를 ${recentCommentsPath}에 저장했습니다. (${topRecentComments.length}개)`
    );

    console.log("\n📊 댓글 개수 데이터:", comments);
    console.log(
      "\n📝 최신 댓글 샘플:",
      topRecentComments.slice(0, 3).map((c) => ({
        author: c.author,
        post: c.postTitle,
        preview: c.content.substring(0, 50) + "...",
      }))
    );
  } catch (error) {
    console.error("❌ 오류 발생:", error.message);
    process.exit(1);
  }
}

main().catch(console.error);
