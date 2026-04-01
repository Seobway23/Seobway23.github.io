/**
 * 게시글 데이터를 JSON 파일로 생성하는 스크립트
 * posts/ 폴더의 마크다운 파일을 읽어서 public/posts-data.json과 public/posts.json 생성
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../public");
const postsDir = path.join(__dirname, "../posts");
const glossaryPath = path.join(__dirname, "../data/glossary.yml");

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/** 코드 펜스 밖에서 첫 `![](url)` / `![alt](url)` URL 추출 */
function firstMarkdownImageOutsideFences(markdown) {
  if (!markdown || typeof markdown !== "string") return null;
  const parts = markdown.split(/```[\s\S]*?```/g);
  for (const part of parts) {
    const m = part.match(/!\[[^\]]*\]\(\s*([^)\s]+)\s*\)/);
    if (m) return m[1].trim();
  }
  return null;
}

function normalizeCoverImageUrl(src) {
  if (!src || typeof src !== "string") return null;
  const s = src.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return `/${s.replace(/^\.\//, "")}`;
}

/**
 * 마크다운 각주 문법 처리
 * - 참조: [^id]
 * - 정의: [^id]: 설명...
 * 결과:
 * - 본문 참조를 sup 링크로 변환
 * - 문서 하단에 "참고/주석" 섹션 HTML 추가
 */
function processMarkdownFootnotes(markdown) {
  if (!markdown || typeof markdown !== "string") {
    return { content: markdown || "", hasFootnotes: false };
  }

  const lines = markdown.split("\n");
  const footnotes = [];
  const keptLines = [];
  const defRe = /^\[\^([^\]]+)\]:\s*(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, "");
    const m = line.match(defRe);
    if (!m) {
      keptLines.push(line);
      continue;
    }

    const id = m[1].trim();
    let text = (m[2] || "").trim();
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j].replace(/\r$/, "");
      if (/^\s{2,}\S/.test(next)) {
        text += ` ${next.trim()}`;
        j++;
        continue;
      }
      if (next.trim() === "") {
        j++;
        continue;
      }
      break;
    }
    footnotes.push({ id, text });
    i = j - 1;
  }

  if (footnotes.length === 0) {
    return { content: markdown, hasFootnotes: false };
  }

  const toSafeId = (raw) =>
    String(raw)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "ref";

  const orderedRefIds = [];
  const refIndexMap = new Map();
  const safeIdMap = new Map();
  const contentWithRefs = keptLines.join("\n").replace(/\[\^([^\]]+)\]/g, (_m, idRaw) => {
    const id = String(idRaw).trim();
    if (!refIndexMap.has(id)) {
      orderedRefIds.push(id);
      refIndexMap.set(id, orderedRefIds.length);
      let safeId = toSafeId(id);
      let suffix = 2;
      while ([...safeIdMap.values()].includes(safeId)) {
        safeId = `${toSafeId(id)}-${suffix}`;
        suffix++;
      }
      safeIdMap.set(id, safeId);
    }
    const n = refIndexMap.get(id);
    const safeId = safeIdMap.get(id);
    return `<sup id="fnref-${safeId}" style="scroll-margin-top: 96px;"><a href="#fn-${safeId}" aria-label="각주 ${n}">[${n}]</a></sup>`;
  });

  const footnoteMap = new Map(footnotes.map((f) => [f.id, f.text]));
  const footnoteLines = orderedRefIds.map((id) => {
    const text = footnoteMap.get(id) || "";
    const safeId = safeIdMap.get(id);
    return `<li id="fn-${safeId}" style="scroll-margin-top: 96px;">${text} <a href="#fnref-${safeId}" aria-label="본문으로 돌아가기">↩</a></li>`;
  });

  const footnotesBlock = [
    "",
    "## 참고/주석",
    "",
    "<ol>",
    ...footnoteLines,
    "</ol>",
  ].join("\n");

  return {
    content: `${contentWithRefs}\n${footnotesBlock}\n`,
    hasFootnotes: true,
  };
}

/**
 * 마크다운 본문 기준 예상 읽기 시간(분). 코드·이미지·링크 제외.
 * 한글·한자·가나 + 영단어 혼합(기술 블로그)에 맞춰 보수적으로 추정.
 */
function estimateReadTimeMinutes(markdown) {
  if (!markdown || typeof markdown !== "string") return 1;
  let text = markdown.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/^---[\s\S]*?---/m, " ");
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, " ");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/`[^`]+`/g, " ");
  text = text.replace(/[#>*_|]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  if (!text.length) return 1;

  const cjkRe =
    /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/g;
  const cjk = (text.match(cjkRe) || []).length;
  const latin = text.replace(cjkRe, " ");
  const words = latin
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  // 분당 약 300자(한글권)·200단어(영문) — 짧은 글·코드 비중 있으면 약간 길게 느껴지도록 반올림
  const minutes = cjk / 300 + words / 200;
  return Math.max(1, Math.round(minutes));
}

/**
 * marked v12+에서 **text**한글 처럼 볼드 닫는 ** 바로 뒤에 한글/CJK가 오면
 * closing delimiter로 인식 못 하는 문제를 코드 블록 밖에서만 전처리로 해결한다.
 */
function fixBoldBeforeCJK(markdown) {
  const CJK = /[\u1100-\u11FF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7A3]/;
  // 코드 펜스를 분리해서 코드 블록 밖에서만 치환
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // 코드 블록 — 건드리지 않음
      return part
        .replace(
          /\*\*((?:[^*\n]|\*(?!\*))+?)\*\*(?=[^\s*\w])/g,
          (match, inner, offset, str) => {
            const nextChar = str[offset + match.length];
            if (nextChar && CJK.test(nextChar)) {
              return `<strong>${inner}</strong>`;
            }
            return match;
          }
        )
        .replace(
          /__([^_\n]+?)__(?=[^\s_\w])/g,
          (match, inner, offset, str) => {
            const nextChar = str[offset + match.length];
            if (nextChar && CJK.test(nextChar)) {
              return `<strong>${inner}</strong>`;
            }
            return match;
          }
        );
    })
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadGlobalGlossary() {
  if (!fs.existsSync(glossaryPath)) {
    console.warn(`⚠️ 전역 glossary 파일 없음: ${glossaryPath}`);
    return { terms: {} };
  }
  try {
    const raw = fs.readFileSync(glossaryPath, "utf-8");
    const data = yaml.load(raw);
    const termsRaw =
      data &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      data.terms &&
      typeof data.terms === "object" &&
      !Array.isArray(data.terms)
        ? data.terms
        : {};

    const terms = Object.fromEntries(
      Object.entries(termsRaw)
        .filter(([id]) => typeof id === "string" && id.trim().length > 0)
        .map(([id, term]) => {
          const t = term && typeof term === "object" && !Array.isArray(term) ? term : {};
          const label = typeof t.label === "string" && t.label.trim().length > 0 ? t.label.trim() : id;
          const description =
            typeof t.description === "string" && t.description.trim().length > 0
              ? t.description.trim()
              : "";
          const aliases = Array.isArray(t.aliases)
            ? t.aliases.filter((a) => typeof a === "string" && a.trim().length > 0).map((a) => a.trim())
            : [];
          const uniqueAliases = Array.from(new Set([label, ...aliases]));
          return [id, { id, label, description, aliases: uniqueAliases }];
        })
    );

    return { terms };
  } catch (e) {
    console.error(`❌ 전역 glossary 파싱 실패: ${glossaryPath}`, e);
    return { terms: {} };
  }
}

function indexTermMentionsInMarkdown(markdown, glossary) {
  const terms = glossary?.terms && typeof glossary.terms === "object" ? glossary.terms : {};
  const entries = Object.values(terms);
  if (entries.length === 0) return [];

  // 코드 펜스/인라인 코드 제외. 링크 텍스트는 남겨도 되지만, URL/마크다운 문법에 걸리기 쉬워 링크를 통째로 제거.
  let text = String(markdown || "");
  text = text.replace(/```[\s\S]*?```/g, " ");
  text = text.replace(/`[^`]+`/g, " ");
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, " ");
  text = text.replace(/\[[^\]]+\]\([^)]+\)/g, " ");

  const ids = [];
  for (const term of entries) {
    const aliases = Array.isArray(term.aliases) ? term.aliases : [];
    const hay = text;
    const found = aliases.some((alias) => {
      if (!alias) return false;
      // 엄격: alias 그대로 포함 여부만 확인(정확도 우선). 자동 매칭의 세부 경계는 런타임에서 더 엄격하게 처리.
      return hay.includes(alias) || hay.toLowerCase().includes(alias.toLowerCase());
    });
    if (found) ids.push(term.id);
  }
  return ids;
}

/**
 * Glossary 마크업([[termId|label]])을 HTML span으로 치환한다.
 * - 코드 펜스 내부는 제외
 * - termId는 [a-zA-Z0-9_-]+만 허용
 */
function applyGlossaryMarkup(markdown, glossary, filePath) {
  if (!markdown || typeof markdown !== "string") return markdown || "";
  const parts = markdown.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // 코드 블록
      return part.replace(
        /\[\[([a-zA-Z0-9_-]+)(?:\|([^\]]+))?\]\]/g,
        (_m, termId, label) => {
          const display = (label || termId || "").trim();
          if (glossary && typeof glossary === "object") {
            if (!(termId in glossary)) {
              console.warn(
                `⚠️ glossary 정의 없음: ${termId} (${filePath})`
              );
            }
          } else {
            console.warn(
              `⚠️ glossary 데이터 없음: ${termId} (${filePath})`
            );
          }
          return `<span class="glossary-term" data-term="${escapeHtml(
            termId
          )}" tabindex="0">${escapeHtml(display)}</span>`;
        }
      );
    })
    .join("");
}

/**
 * 마크다운 파일에서 게시글 데이터 추출
 * @param {Map<string,string>} filenameToSlug - 파일명(확장자 제외) → slug 맵
 */
function parseMarkdownFile(filePath, categoryFromPath, filenameToSlug = new Map()) {
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
    // 각주 문법([^1], [^1]: ...)을 HTML 앵커 링크로 변환
    processedContent = processMarkdownFootnotes(processedContent).content;
    // marked v12+: **text**한글 볼드 인식 실패 보정
    processedContent = fixBoldBeforeCJK(processedContent);

    // 글별 용어 사전 (frontmatter glossary)
    // - { termId: "설명", ... } 형태만 허용
    // - 값이 문자열이 아니면 제외
    const glossary =
      data &&
      data.glossary &&
      typeof data.glossary === "object" &&
      !Array.isArray(data.glossary)
        ? Object.fromEntries(
            Object.entries(data.glossary).filter(
              ([, v]) => typeof v === "string" && v.trim().length > 0
            )
          )
        : undefined;

    // Glossary 마크업 치환 (코드 블록 제외)
    processedContent = applyGlossaryMarkup(processedContent, glossary, filePath);

    // marked 설정
    marked.setOptions({
      breaks: true,
      gfm: true,
    });

    // 커스텀 렌더러: ./filename 상대 링크를 /post/actual-slug 로 변환
    const renderer = new marked.Renderer();
    renderer.link = function (href, title, text) {
      let finalHref = href || "";
      if (finalHref.startsWith("./")) {
        const raw = finalHref.slice(2).split("/")[0].replace(/\.md$/, "");
        const mappedSlug = filenameToSlug.get(raw);
        if (mappedSlug) {
          finalHref = `/post/${mappedSlug}`;
        }
      }
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${finalHref}"${titleAttr}>${text}</a>`;
    };

    // 마크다운을 HTML로 변환
    const htmlContent = marked.parse(processedContent, { renderer });

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

    const fromMatter =
      data.coverImage || data.image || data.thumbnail || data.hero || "";
    const fromBody = firstMarkdownImageOutsideFences(content);
    const coverRaw = (fromMatter || fromBody || "").trim();
    const coverImage = normalizeCoverImageUrl(coverRaw);

    return {
      id: data.id || slug,
      title: data.title || fileName,
      slug: slug,
      excerpt: excerpt,
      content: htmlContent,
      glossary: glossary,
      coverImage: coverImage || null,
      // 폴더 경로를 우선 카테고리로 사용 (frontmatter category는 덮어쓰지 않음)
      category: normalizedCategory || data.category || "",
      tags: data.tags || [],
      author: data.author || "작성자",
      readTime: (() => {
        const n =
          data.readTime != null && data.readTime !== ""
            ? Number(data.readTime)
            : NaN;
        return Number.isFinite(n) && n > 0
          ? Math.round(n)
          : estimateReadTimeMinutes(content);
      })(),
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

  const globalGlossary = loadGlobalGlossary();
  const glossaryIndex = Object.create(null);

  // 1차 패스: 파일명 → slug 맵 구성 (링크 변환용)
  const filenameToSlug = new Map();
  markdownFiles.forEach((filePath) => {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      const fileName = path.basename(filePath, ".md");
      filenameToSlug.set(fileName, data.slug || fileName);
    } catch (_) {}
  });

  const posts = [];
  const postsData = []; // posts-data.json용 (간단한 정보만)

  markdownFiles.forEach((filePath) => {
    // 카테고리 추출 (posts/category/file.md)
    const relativePath = path.relative(postsDir, filePath);
    const category = path.dirname(relativePath);
    // 포스트 경로 (/post/frontend/react/foo)
    const withoutExt = relativePath.replace(/\.md$/i, "");
    const postPath = `/post/${withoutExt.replace(/\\/g, "/")}`;

    const post = parseMarkdownFile(filePath, category, filenameToSlug);
    if (post) {
      posts.push(post);
      postsData.push({
        slug: post.slug,
        title: post.title,
        path: postPath,
      });

      const raw = fs.readFileSync(filePath, "utf-8");
      const { content } = matter(raw);
      const mentioned = indexTermMentionsInMarkdown(content, globalGlossary);
      for (const termId of mentioned) {
        if (!glossaryIndex[termId]) glossaryIndex[termId] = [];
        if (!glossaryIndex[termId].includes(post.slug)) glossaryIndex[termId].push(post.slug);
      }
    }
  });

  if (posts.length === 0) {
    console.warn(
      "⚠️ 게시글을 찾을 수 없습니다. posts/ 폴더에 마크다운 파일을 추가하세요."
    );
    return;
  }

  // 최신순(createdAt 내림차순) 정렬 후 저장 — 날짜가 같으면 파일명 역순(Z→A)
  posts.sort((a, b) => {
    const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (diff !== 0) return diff;
    return b.slug.localeCompare(a.slug);
  });

  console.log(`✅ ${posts.length}개의 게시글 파싱 완료`);

  // posts.json 저장 (전체 게시글 데이터)
  const postsPath = path.join(publicDir, "posts.json");
  fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2), "utf-8");
  console.log(`✅ 전체 게시글 데이터를 ${postsPath}에 저장했습니다.`);

  // glossary.json 저장 (전역 용어 사전)
  const glossaryJsonPath = path.join(publicDir, "glossary.json");
  fs.writeFileSync(glossaryJsonPath, JSON.stringify(globalGlossary, null, 2), "utf-8");
  console.log(`✅ 전역 glossary 데이터를 ${glossaryJsonPath}에 저장했습니다.`);

  // glossary-index.json 저장 (termId -> post slugs)
  const glossaryIndexPath = path.join(publicDir, "glossary-index.json");
  fs.writeFileSync(glossaryIndexPath, JSON.stringify(glossaryIndex, null, 2), "utf-8");
  console.log(`✅ glossary 인덱스를 ${glossaryIndexPath}에 저장했습니다.`);

  // posts-data.json 저장 (간단한 정보만 - 조회수/댓글 스크립트용)
  const postsDataPath = path.join(publicDir, "posts-data.json");
  fs.writeFileSync(postsDataPath, JSON.stringify(postsData, null, 2), "utf-8");
  console.log(`✅ 게시글 목록을 ${postsDataPath}에 저장했습니다.`);
}

generatePostsData();
