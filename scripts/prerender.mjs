/**
 * 정적 프리렌더 — 검색엔진·AI 크롤러가 본문을 "JS 없이" 읽게 만든다.
 *
 * 왜 필요한가:
 *   이 블로그는 CSR SPA다. 크롤러가 받는 HTML은 <div id="root"></div> 하나뿐이다.
 *   구글봇은 JS를 실행해 주지만 GPTBot·ClaudeBot·PerplexityBot 등 AI 크롤러는
 *   대부분 실행하지 않는다. 그들에게 이 사이트는 빈 페이지다.
 *
 * 무엇을 하나 (vite build 이후 dist/ 에 대고 실행):
 *   1. 글마다 dist/post/<slug>.html + dist/post/<slug>/index.html 생성
 *      - <title>·description·canonical·OG·Twitter 카드를 글별로 채움
 *      - JSON-LD(BlogPosting + BreadcrumbList) 삽입
 *      - #root 안에 렌더된 본문 HTML을 그대로 넣음 (React가 마운트하며 교체)
 *   2. dist/sitemap.xml, dist/robots.txt 생성
 *   3. dist/index.html 홈에도 description·OG 보강
 *
 * GitHub Pages 는 /post/foo 요청에 post/foo.html 을 그대로 내준다(리다이렉트 없음).
 * 폴더형 index.html 도 같이 써서 /post/foo/ 로 들어와도 같은 문서가 나오게 한다.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expandSeqPreset } from "../shared/seq-presets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const POSTS_JSON = path.join(ROOT, "public", "posts.json");

/** 배포 주소. 커스텀 도메인을 붙이면 SITE_URL 환경변수로 덮어쓴다. */
const SITE_URL = (process.env.SITE_URL || "https://seobway23.github.io").replace(/\/$/, "");
const SITE_NAME = "Tech Blog — 모던 개발 블로그";
const DEFAULT_OG = `${SITE_URL}/pwa-512x512.png`;

const CATEGORY_LABELS = {
  "frontend": "프론트엔드",
  "study/network": "네트워크",
  "study/mechanics": "역학",
  "study/algorithm": "알고리즘",
  study: "학습",
};

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML 본문 → 검색 스니펫용 순수 텍스트 */
function htmlToText(html, limit = 300) {
  const text = String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s\S*$/, "")}…`;
}

function absoluteUrl(maybePath) {
  if (!maybePath) return DEFAULT_OG;
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  return `${SITE_URL}${maybePath.startsWith("/") ? "" : "/"}${maybePath}`;
}

function categoryLabel(category) {
  if (!category) return "학습";
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];
  const parent = category.split("/").slice(0, 2).join("/");
  return CATEGORY_LABELS[parent] || category.split("/").pop();
}

function isoDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/* ── head 조립 ─────────────────────────────────────────────── */

function buildHead(post) {
  const url = `${SITE_URL}/post/${post.slug}`;
  const title = `${post.title} — ${SITE_NAME}`;
  const cleanContent = rewritePlaygroundBlocks(rewriteSeqBlocks(post.content || ""));
  const description = post.excerpt?.trim() || htmlToText(cleanContent, 160);
  const image = absoluteUrl(post.coverImage);
  const published = isoDate(post.createdAt);
  const modified = isoDate(post.updatedAt || post.createdAt);
  const tags = Array.isArray(post.tags) ? post.tags : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description,
        image: [image],
        datePublished: published,
        dateModified: modified,
        author: { "@type": "Person", name: post.author || "Seobway" },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: { "@type": "ImageObject", url: DEFAULT_OG },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        keywords: tags.join(", "),
        articleSection: categoryLabel(post.category),
        inLanguage: "ko-KR",
        wordCount: htmlToText(cleanContent, Number.MAX_SAFE_INTEGER).length,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: `${SITE_URL}/` },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryLabel(post.category),
            item: `${SITE_URL}/?category=${encodeURIComponent(post.category || "")}`,
          },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    tags.length ? `<meta name="keywords" content="${escapeHtml(tags.join(", "))}" />` : "",
    `<meta name="author" content="${escapeHtml(post.author || "Seobway")}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:locale" content="ko_KR" />`,
    `<meta property="og:title" content="${escapeHtml(post.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="article:published_time" content="${published}" />`,
    `<meta property="article:modified_time" content="${modified}" />`,
    ...tags.map((t) => `<meta property="article:tag" content="${escapeHtml(t)}" />`),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(post.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ]
    .filter(Boolean)
    .join("\n    ");
}

/**
 * ```seq 블록은 사람이 읽을 글이 아니라 사양(spec)이다. 그대로 두면
 * "preset: event-loop", "move stack macro" 같은 줄이 검색 스니펫에 섞인다.
 * 대신 step 설명만 뽑아 순서 있는 목록으로 바꾼다 — 크롤러에게는 이쪽이 훨씬 유용하다.
 */
function rewriteSeqBlocks(html) {
  return String(html ?? "").replace(
    /<pre><code class="language-(?:seq|sequence)">([\s\S]*?)<\/code><\/pre>/g,
    (_all, body) => {
      const decoded = body
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&");
      // preset 만 적힌 글도 step 설명이 나오도록 사양을 펼친 뒤 읽는다
      const lines = expandSeqPreset(decoded).lines.map((l) => l.trim());
      const title = (lines.find((l) => /^title\s*:/.test(l)) || "")
        .replace(/^title\s*:\s*/, "")
        .trim();
      const steps = lines
        .filter((l) => /^step\s+/.test(l))
        .map((l) => l.replace(/^step\s+/, "").trim())
        .filter(Boolean);
      const heading = `<p>인터랙티브 다이어그램${title ? `: ${escapeHtml(title)}` : ""} (단계별로 재생할 수 있다)</p>`;
      if (steps.length === 0) return heading;
      return `${heading}<ol>${steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>`;
    }
  );
}

/** ```playground 의 옵션 줄(#! react title=…)은 본문이 아니므로 지운다. 코드는 남긴다. */
function rewritePlaygroundBlocks(html) {
  return String(html ?? "").replace(
    /(<pre><code class="language-playground">)([\s\S]*?)(<\/code><\/pre>)/g,
    (_all, open, body, close) =>
      `${open}${body.replace(/^\s*(#!|%%)[^\n]*\n/, "")}${close}`
  );
}

/**
 * 크롤러가 읽을 본문. React 가 마운트하면서 통째로 교체하므로
 * 스타일은 신경 쓰지 않고 의미 구조(h1/time/article)만 정확히 담는다.
 */
function buildBody(post) {
  const published = isoDate(post.createdAt);
  const tags = Array.isArray(post.tags) ? post.tags : [];
  return [
    `<article data-prerendered="true">`,
    `<nav aria-label="breadcrumb"><a href="/">홈</a> › <span>${escapeHtml(categoryLabel(post.category))}</span></nav>`,
    `<h1>${escapeHtml(post.title)}</h1>`,
    `<p>${escapeHtml(post.excerpt || "")}</p>`,
    `<p><span>${escapeHtml(post.author || "Seobway")}</span> · <time datetime="${published}">${published.slice(0, 10)}</time> · <span>${Number(post.readTime) || 1}분</span></p>`,
    rewritePlaygroundBlocks(rewriteSeqBlocks(post.content || "")),
    tags.length
      ? `<ul>${tags.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
      : "",
    `</article>`,
  ].join("\n");
}

/* ── 템플릿 주입 ───────────────────────────────────────────── */

/** 기존 <title> 과 우리가 넣는 것과 겹치는 메타를 걷어낸다(중복 방지). */
function stripConflictingHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\s+name="description"[^>]*>\s*/gi, "")
    .replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
}

function renderPage(template, headHtml, bodyHtml) {
  let html = stripConflictingHead(template);
  html = html.replace("</head>", `    ${headHtml}\n  </head>`);
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${bodyHtml}</div>`
  );
  return html;
}

/* ── sitemap / robots ─────────────────────────────────────── */

function buildSitemap(posts) {
  const urls = [
    { loc: `${SITE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${SITE_URL}/about`, priority: "0.5", changefreq: "monthly" },
    ...posts.map((p) => ({
      loc: `${SITE_URL}/post/${p.slug}`,
      lastmod: isoDate(p.updatedAt || p.createdAt).slice(0, 10),
      priority: p.featured ? "0.9" : "0.7",
      changefreq: "weekly",
    })),
  ];
  const body = urls
    .map((u) =>
      [
        "  <url>",
        `    <loc>${u.loc}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : "",
        `    <changefreq>${u.changefreq}</changefreq>`,
        `    <priority>${u.priority}</priority>`,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");
  const ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="${ns}">\n${body}\n</urlset>\n`;
}

/**
 * llms.txt — AI 크롤러/에이전트가 사이트를 한 번에 파악하도록 만든 목록.
 *
 * 사람용 sitemap.xml 은 URL 만 있고 "이 글이 무엇인지"가 없다. AI 는 링크를
 * 하나하나 열어보는 대신 이런 요약 목록을 먼저 읽는 편이 정확하다.
 * (llmstxt.org 에서 제안된 관례. 표준은 아니지만 비용이 거의 없다.)
 *
 * 개념 글은 선행 관계까지 적어 준다 — "무엇을 먼저 읽어야 하는가"는
 * 이 사이트가 가진 정보 중 다른 데서 못 얻는 것이다.
 */
function buildLlmsTxt(posts, graph) {
  const byConcept = new Map(
    (graph?.nodes || []).filter((n) => n.post).map((n) => [n.post, n])
  );

  const line = (p) => {
    const node = byConcept.get(p.slug);
    const desc = (p.excerpt || htmlToText(p.content, 160)).replace(/\s+/g, " ").trim();
    const prereq =
      node && node.prereq.length > 0
        ? ` (선행: ${node.prereq
            .map((id) => graph.nodes.find((n) => n.id === id)?.label || id)
            .join(", ")})`
        : "";
    return `- [${p.title}](${SITE_URL}/post/${p.slug}): ${desc}${prereq}`;
  };

  const concepts = posts.filter((p) => byConcept.has(p.slug));
  const others = posts.filter((p) => !byConcept.has(p.slug));

  const byCategory = new Map();
  for (const p of others) {
    const key = categoryLabel(p.category);
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(p);
  }

  const out = [
    `# ${SITE_NAME}`,
    "",
    "> React·TypeScript·네트워크·역학을 다루는 한국어 기술 블로그.",
    "> 개념 글은 1차 공식 문서(MDN·ECMAScript 사양·WHATWG·W3C)만 출처로 쓰고,",
    "> 각 글에 확인 날짜를 적어 둔다.",
    "",
  ];

  if (concepts.length > 0) {
    out.push(
      "## 개념 글 (학습 순서가 정의되어 있음)",
      "",
      `선행 관계를 담은 그래프: ${SITE_URL}/concept-graph.json`,
      `사람이 보는 지도: ${SITE_URL}/roadmap`,
      ""
    );
    // 레벨 순서대로 — 바텀업 순서 그대로 읽히게
    const sorted = [...concepts].sort((a, b) => {
      const la = byConcept.get(a.slug)?.level ?? 99;
      const lb = byConcept.get(b.slug)?.level ?? 99;
      return la - lb;
    });
    for (const p of sorted) out.push(line(p));
    out.push("");
  }

  for (const [cat, list] of [...byCategory.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )) {
    out.push(`## ${cat}`, "");
    for (const p of list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
      out.push(line(p));
    }
    out.push("");
  }

  return out.join("\n");
}

/**
 * AI 크롤러를 명시적으로 허용한다. 기본값은 어차피 허용이지만,
 * 적어두면 의도가 분명해지고 나중에 특정 봇만 막기도 쉽다.
 */
function buildRobots() {
  const bots = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "Applebot-Extended",
    "CCBot",
  ];
  return [
    "User-agent: *",
    "Allow: /",
    "",
    ...bots.flatMap((b) => [`User-agent: ${b}`, "Allow: /", ""]),
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
    "# AI 크롤러용 요약 목록 (llmstxt.org 관례)",
    `# ${SITE_URL}/llms.txt`,
    "",
  ].join("\n");
}

/* ── 실행 ─────────────────────────────────────────────────── */

function main() {
  if (!fs.existsSync(DIST)) {
    console.error("❌ dist/ 가 없다. vite build 를 먼저 돌려라.");
    process.exit(1);
  }
  const templatePath = path.join(DIST, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("❌ dist/index.html 이 없다.");
    process.exit(1);
  }
  if (!fs.existsSync(POSTS_JSON)) {
    console.error("❌ public/posts.json 이 없다. npm run generate:posts 를 먼저 돌려라.");
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");
  const posts = JSON.parse(fs.readFileSync(POSTS_JSON, "utf-8"));

  let count = 0;
  for (const post of posts) {
    if (!post?.slug) continue;
    const html = renderPage(template, buildHead(post), buildBody(post));

    const flatPath = path.join(DIST, "post", `${post.slug}.html`);
    fs.mkdirSync(path.dirname(flatPath), { recursive: true });
    fs.writeFileSync(flatPath, html, "utf-8");

    const dirPath = path.join(DIST, "post", post.slug, "index.html");
    fs.mkdirSync(path.dirname(dirPath), { recursive: true });
    fs.writeFileSync(dirPath, html, "utf-8");

    count++;
  }

  // 홈 메타 보강
  const homeDescription =
    "React·TypeScript·네트워크·역학을 다루는 기술 블로그. 개념을 인터랙티브하게 확인하며 읽는다.";
  const homeHead = [
    `<meta name="description" content="${escapeHtml(homeDescription)}" />`,
    `<link rel="canonical" href="${SITE_URL}/" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:locale" content="ko_KR" />`,
    `<meta property="og:title" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:description" content="${escapeHtml(homeDescription)}" />`,
    `<meta property="og:url" content="${SITE_URL}/" />`,
    `<meta property="og:image" content="${DEFAULT_OG}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      description: homeDescription,
      inLanguage: "ko-KR",
    })}</script>`,
  ].join("\n    ");
  let homeHtml = stripConflictingHead(template);
  homeHtml = homeHtml.replace(
    "</head>",
    `    <title>${escapeHtml(SITE_NAME)}</title>\n    ${homeHead}\n  </head>`
  );
  fs.writeFileSync(templatePath, homeHtml, "utf-8");

  fs.writeFileSync(path.join(DIST, "sitemap.xml"), buildSitemap(posts), "utf-8");
  fs.writeFileSync(path.join(DIST, "robots.txt"), buildRobots(), "utf-8");

  // AI 크롤러용 요약 목록
  let graph = null;
  const graphPath = path.join(ROOT, "public", "concept-graph.json");
  if (fs.existsSync(graphPath)) {
    try {
      graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
    } catch {
      console.warn("⚠️  concept-graph.json 을 못 읽어 llms.txt 에 선행 관계를 넣지 못했다");
    }
  }
  fs.writeFileSync(path.join(DIST, "llms.txt"), buildLlmsTxt(posts, graph), "utf-8");

  console.log(
    `[prerender] 글 ${count}개 프리렌더 · sitemap.xml · robots.txt · llms.txt 생성 (${SITE_URL})`
  );
}

main();
