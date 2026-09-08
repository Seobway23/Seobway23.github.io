/**
 * 출처 검증 — "공신력 있는 자료만" 을 사람 눈이 아니라 빌드가 지킨다.
 *
 * 개념 글(frontmatter 에 `concept:` 이 있는 글)은 반드시 1차 공식 문서를 출처로 단다.
 *
 *   sources:
 *     - url: https://developer.mozilla.org/ko/docs/Web/JavaScript/Closures
 *       title: "Closures — MDN Web Docs"
 *       checked: 2026-09-07
 *
 * 검사
 *   · sources 없음 / 빈 배열                    → 실패
 *   · url·title·checked 누락, 날짜 형식 오류      → 실패
 *   · 화이트리스트 밖 도메인                      → 실패
 *   · checked 가 STALE_MONTHS 초과               → 경고
 *   · http:// (평문)                            → 실패
 *
 * 실행
 *   npm run verify:sources              형식·도메인만 (빠름, 빌드에 포함)
 *   npm run verify:sources -- --links   실제 응답까지 확인 (느림, 주기적으로)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "posts");

const NON_POST_FILES = new Set(["readme.md", "_template.md", "index.md"]);
const STALE_MONTHS = 6;

/**
 * 1차 공식 출처만. 블로그·미디엄·개인 사이트는 넣지 않는다.
 * 새 도메인이 필요하면 여기에 추가하고, 왜 1차 출처인지 주석을 단다.
 */
const ALLOWED_HOSTS = [
  // 표준·명세
  "developer.mozilla.org",
  "whatwg.org", "html.spec.whatwg.org", "dom.spec.whatwg.org",
  "tc39.es", "ecma-international.org",
  "w3.org", "www.w3.org", "drafts.csswg.org",
  "datatracker.ietf.org", "rfc-editor.org", "www.rfc-editor.org",
  "unicode.org",
  // 런타임·언어 공식
  "nodejs.org", "typescriptlang.org", "www.typescriptlang.org",
  "developer.chrome.com", "web.dev", "webkit.org", "v8.dev",
  // 프레임워크·도구 공식
  "react.dev", "vitejs.dev", "vite.dev", "vitest.dev",
  "playwright.dev", "eslint.org", "prettier.io", "biomejs.dev",
  "tanstack.com", "tailwindcss.com", "ui.shadcn.com",
  "yarnpkg.com", "docs.npmjs.com", "www.npmjs.com",
  "git-scm.com", "docs.github.com",
  "zustand.docs.pmnd.rs", "redux.js.org",
  "conventionalcommits.org", "www.conventionalcommits.org",
  "semver.org",
  // 접근성
  "www.w3.org", "webaim.org",
];

const args = process.argv.slice(2);
const CHECK_LINKS = args.includes("--links");

const errors = [];
const warns = [];

function collectPostFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectPostFiles(full, out);
    else if (
      name.endsWith(".md") &&
      !name.startsWith("_") &&
      !NON_POST_FILES.has(name.toLowerCase())
    ) {
      out.push(full);
    }
  }
  return out;
}

function hostAllowed(host) {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.some((a) => h === a || h.endsWith(`.${a}`));
}

function monthsSince(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

/**
 * `checked: 2026-09-07` 을 따옴표 없이 쓰면 YAML 이 Date 객체로 파싱한다.
 * 글쓴이에게 따옴표를 강요하는 대신 여기서 YYYY-MM-DD 로 되돌린다.
 */
function normalizeChecked(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return value == null ? "" : String(value);
}

const toCheck = [];

function verifyPost(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const { data } = matter(fs.readFileSync(file, "utf-8"));
  const concept = typeof data.concept === "string" ? data.concept.trim() : "";
  if (!concept) return; // 개념 글이 아니면 대상이 아니다

  const sources = data.sources;
  if (!Array.isArray(sources) || sources.length === 0) {
    errors.push(`${rel}: 개념 글인데 sources 가 없다 (최소 1개, 1차 공식 문서)`);
    return;
  }

  sources.forEach((s, i) => {
    const at = `${rel} sources[${i}]`;
    if (!s || typeof s !== "object") {
      errors.push(`${at}: 객체가 아니다`);
      return;
    }
    if (!s.url) errors.push(`${at}: url 없음`);
    if (!s.title) errors.push(`${at}: title 없음`);
    if (!s.checked) errors.push(`${at}: checked(확인 날짜) 없음`);

    const checked = normalizeChecked(s.checked);
    if (s.checked && !/^\d{4}-\d{2}-\d{2}$/.test(checked)) {
      errors.push(`${at}: checked 는 YYYY-MM-DD 형식이어야 한다 (받은 값: ${s.checked})`);
    } else if (checked) {
      const m = monthsSince(checked);
      if (m != null && m > STALE_MONTHS) {
        warns.push(`${at}: 확인한 지 ${Math.floor(m)}개월 지났다 — 다시 확인해라`);
      }
    }

    if (!s.url) return;
    let u;
    try {
      u = new URL(String(s.url));
    } catch {
      errors.push(`${at}: URL 형식이 아니다 — ${s.url}`);
      return;
    }
    if (u.protocol !== "https:") {
      errors.push(`${at}: https 가 아니다 — ${s.url}`);
      return;
    }
    if (!hostAllowed(u.hostname)) {
      errors.push(
        `${at}: 허용되지 않은 출처 "${u.hostname}" — 1차 공식 문서만 쓴다. ` +
          `정말 필요하면 scripts/verify-sources.mjs 의 ALLOWED_HOSTS 에 근거와 함께 추가해라.`
      );
      return;
    }
    toCheck.push({ at, url: String(s.url) });
  });
}

async function checkLinks() {
  console.log(`\n[verify-sources] 링크 응답 확인 ${toCheck.length}개...`);
  let ok = 0;
  for (const { at, url } of toCheck) {
    try {
      let res = await fetch(url, { method: "HEAD", redirect: "follow" });
      // HEAD 를 막는 사이트가 있어 실패 시 GET 으로 한 번 더
      if (!res.ok) res = await fetch(url, { method: "GET", redirect: "follow" });
      if (res.ok) ok++;
      else warns.push(`${at}: HTTP ${res.status} — ${url}`);
    } catch (e) {
      warns.push(`${at}: 요청 실패 (${e?.message || e}) — ${url}`);
    }
  }
  console.log(`[verify-sources] 정상 응답 ${ok}/${toCheck.length}`);
}

async function main() {
  const files = collectPostFiles(POSTS_DIR);
  files.forEach(verifyPost);

  if (CHECK_LINKS && errors.length === 0) await checkLinks();

  for (const w of warns) console.warn("⚠️ ", w);

  if (errors.length > 0) {
    console.error(`\n❌ 출처 검증 실패 (${errors.length}건)`);
    for (const e of errors) console.error("  ·", e);
    process.exit(1);
  }

  const conceptPosts = files.filter((f) => {
    const { data } = matter(fs.readFileSync(f, "utf-8"));
    return typeof data.concept === "string" && data.concept.trim();
  }).length;

  console.log(
    `[verify-sources] 개념 글 ${conceptPosts}개 · 출처 ${toCheck.length}개 전부 1차 공식 문서` +
      (warns.length ? ` · 경고 ${warns.length}건` : "")
  );
}

main();
