/**
 * 게시글 데이터를 JSON 파일로 생성하는 스크립트
 * posts/ 폴더의 마크다운 파일을 읽어서 public/posts-data.json과 public/posts.json 생성
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../public");
const postsDir = path.join(__dirname, "../posts");

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 마크다운 파일에서 게시글 데이터 추출
 */
function parseMarkdownFile(filePath, categoryFromPath) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    // 경로 기반 카테고리 (슬래시 통일)
    const normalizedCategory =
      categoryFromPath && categoryFromPath !== "."
        ? categoryFromPath.replace(/\\/g, "/")
        : "";

    // 파일명에서 slug 추출 (확장자 제거)
    const fileName = path.basename(filePath, ".md");
    const slug = data.slug || fileName;

    // 이스케이프된 백틱을 제대로 된 코드 블록으로 변환
    // \`\`\` -> ```
    let processedContent = content.replace(/\\`/g, "`");

    // marked 설정
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // 마크다운을 HTML로 변환
    const htmlContent = marked.parse(processedContent);

    // excerpt 생성 (frontmatter에 없으면 content에서 추출)
    let excerpt = data.excerpt || "";
    if (!excerpt && content) {
      // 마크다운 태그 제거하고 첫 150자 추출
      const plainText = content
        .replace(/[#*`_~\[\]()]/g, "")
        .replace(/\n/g, " ")
        .trim();
      excerpt =
        plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");
    }

    return {
      id: data.id || slug,
      title: data.title || fileName,
      slug: slug,
      excerpt: excerpt,
      content: htmlContent,
      // 폴더 경로를 우선 카테고리로 사용 (frontmatter category는 덮어쓰지 않음)
      category: normalizedCategory || data.category || "",
      tags: data.tags || [],
      author: data.author || "작성자",
      readTime: data.readTime || 5,
      views: 0, // views.json에서 가져올 예정
      featured: data.featured || false,
      createdAt: data.createdAt
        ? new Date(data.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: data.updatedAt
        ? new Date(data.updatedAt).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error(`파일 파싱 오류: ${filePath}`, error);
    return null;
  }
}

/**
 * posts/ 폴더에서 모든 마크다운 파일 찾기
 */
function getAllMarkdownFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 재귀적으로 하위 디렉토리 탐색
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith(".md")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * 게시글 데이터 생성
 */
function generatePostsData() {
  console.log("📝 게시글 데이터 생성 시작...");

  if (!fs.existsSync(postsDir)) {
    console.error(`❌ posts 폴더를 찾을 수 없습니다: ${postsDir}`);
    return;
  }

  // 모든 마크다운 파일 찾기
  const markdownFiles = getAllMarkdownFiles(postsDir);
  console.log(`📄 ${markdownFiles.length}개의 마크다운 파일 발견`);

  const posts = [];
  const postsData = []; // posts-data.json용 (간단한 정보만)

  markdownFiles.forEach((filePath) => {
    // 카테고리 추출 (posts/category/file.md)
    const relativePath = path.relative(postsDir, filePath);
    const category = path.dirname(relativePath);
    // 포스트 경로 (/post/frontend/react/foo)
    const withoutExt = relativePath.replace(/\.md$/i, "");
    const postPath = `/post/${withoutExt.replace(/\\/g, "/")}`;

    const post = parseMarkdownFile(filePath, category);
    if (post) {
      posts.push(post);
      postsData.push({
        slug: post.slug,
        title: post.title,
        path: postPath,
      });
    }
  });

  if (posts.length === 0) {
    console.warn(
      "⚠️ 게시글을 찾을 수 없습니다. posts/ 폴더에 마크다운 파일을 추가하세요."
    );
    return;
  }

  console.log(`✅ ${posts.length}개의 게시글 파싱 완료`);

  // posts.json 저장 (전체 게시글 데이터)
  const postsPath = path.join(publicDir, "posts.json");
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2), "utf-8");
  console.log(`✅ 전체 게시글 데이터를 ${postsPath}에 저장했습니다.`);

  // posts-data.json 저장 (간단한 정보만 - 조회수/댓글 스크립트용)
  const postsDataPath = path.join(publicDir, "posts-data.json");
  fs.writeFileSync(postsDataPath, JSON.stringify(postsData, null, 2), "utf-8");
  console.log(`✅ 게시글 목록을 ${postsDataPath}에 저장했습니다.`);
}

generatePostsData();
