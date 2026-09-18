/**
 * 개념 그래프 빌더 — data/concepts.yml + posts/**\/*.md → public/concept-graph.json
 *
 * 사람이 적는 것은 두 가지뿐이다.
 *   concepts.yml : 개념과 그 선행 관계(prereq)
 *   글 frontmatter: concept: <id>   ← 이 글이 다루는 개념
 *
 * 나머지는 전부 여기서 계산한다.
 *   level      선행을 모두 만족하는 최소 깊이 (위상정렬). 사람이 적으면 반드시 어긋난다.
 *   next       이 개념을 prereq 로 갖는 개념들 (= "다음에 읽을 글")
 *   written    그 개념을 다루는 글이 실제로 있는가
 *   levels     레벨별 노드 묶음 (로드맵 레인 뷰가 이걸 그대로 쓴다)
 *   chain      뿌리부터 이 개념까지의 대표 선행 경로 (브레드크럼용)
 *
 * 빌드 실패 조건: 순환 참조 · 존재하지 않는 prereq · 트랙에 없는 개념 참조 ·
 *                한 개념을 두 글이 동시에 주장
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONCEPTS_YML = path.join(ROOT, "data", "concepts.yml");
const POSTS_DIR = path.join(ROOT, "posts");
const OUT = path.join(ROOT, "public", "concept-graph.json");

const DOMAINS = new Set([
  "javascript", "typescript", "react", "css",
  "build", "perf", "a11y", "test",
]);

/**
 * 아직 글이 없는 개념도 카테고리 지도에 자리를 잡아야 한다("여기에 이 글이 올 것").
 * 글이 있으면 그 글의 category 를 쓰고, 없으면 이 기본값을 쓴다.
 * concepts.yml 에 `category:` 를 직접 적으면 그게 우선한다.
 */
const DOMAIN_TO_CATEGORY = {
  javascript: "frontend/javascript",
  typescript: "frontend/typescript",
  react: "frontend/react",
  css: "frontend/styling",
  build: "frontend/build",
  perf: "frontend/performance",
  a11y: "frontend/a11y",
  test: "study/engineering/testing",
};

/** posts/ 안에 있어도 글이 아닌 파일 (generate-posts-data.js 와 같은 규칙) */
const NON_POST_FILES = new Set(["readme.md", "_template.md", "index.md"]);

const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}

/* ── 입력 읽기 ─────────────────────────────────────────────── */

function readConcepts() {
  if (!fs.existsSync(CONCEPTS_YML)) {
    fail(`data/concepts.yml 이 없다`);
    return { concepts: {}, tracks: {} };
  }
  const doc = yaml.load(fs.readFileSync(CONCEPTS_YML, "utf-8")) || {};
  const concepts = doc.concepts && typeof doc.concepts === "object" ? doc.concepts : {};
  const tracks = doc.tracks && typeof doc.tracks === "object" ? doc.tracks : {};
  return { concepts, tracks };
}

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

/** concept → { slug, title, readTime, excerpt } */
function readPostsByConcept() {
  const byConcept = new Map();
  for (const file of collectPostFiles(POSTS_DIR)) {
    const { data } = matter(fs.readFileSync(file, "utf-8"));
    const concept = typeof data.concept === "string" ? data.concept.trim() : "";
    if (!concept) continue;
    const slug = data.slug || path.basename(file, ".md");
    if (byConcept.has(concept)) {
      fail(
        `개념 "${concept}" 을 두 글이 동시에 주장한다: ` +
          `${byConcept.get(concept).slug} / ${slug}`
      );
      continue;
    }
    byConcept.set(concept, {
      slug,
      title: data.title || slug,
      readTime: Number(data.readTime) || null,
      excerpt: (data.excerpt || "").toString().trim().replace(/\s+/g, " "),
      category: (data.category || "").toString().replace(/\\/g, "/"),
    });
  }
  return byConcept;
}

/* ── 그래프 계산 ───────────────────────────────────────────── */

/** 칸 위상정렬. 사이클이 남으면 그 노드들을 돌려준다. */
function topoLevels(ids, prereqOf) {
  const indeg = new Map(ids.map((id) => [id, 0]));
  const dependents = new Map(ids.map((id) => [id, []]));
  for (const id of ids) {
    for (const p of prereqOf(id)) {
      if (!indeg.has(p)) continue; // 없는 prereq 는 이미 오류로 잡혔다
      indeg.set(id, indeg.get(id) + 1);
      dependents.get(p).push(id);
    }
  }

  const level = new Map();
  const levels = [];
  let frontier = ids.filter((id) => indeg.get(id) === 0).sort();
  let depth = 0;
  let seen = 0;

  while (frontier.length > 0) {
    levels.push([...frontier]);
    for (const id of frontier) level.set(id, depth);
    seen += frontier.length;
    const nextFrontier = [];
    for (const id of frontier) {
      for (const d of dependents.get(id)) {
        indeg.set(d, indeg.get(d) - 1);
        if (indeg.get(d) === 0) nextFrontier.push(d);
      }
    }
    frontier = nextFrontier.sort();
    depth++;
  }

  const cycle = seen === ids.length ? [] : ids.filter((id) => !level.has(id)).sort();
  return { level, levels, cycle };
}

/** 뿌리 → 이 개념까지의 대표 경로 하나. 브레드크럼에 쓴다(가장 깊은 선행을 따라간다). */
function buildChain(id, prereqOf, level, guard = new Set()) {
  if (guard.has(id)) return [id];
  guard.add(id);
  const prereqs = prereqOf(id).filter((p) => level.has(p));
  if (prereqs.length === 0) return [id];
  const deepest = prereqs.reduce((a, b) => (level.get(a) >= level.get(b) ? a : b));
  return [...buildChain(deepest, prereqOf, level, guard), id];
}

/* ── 실행 ──────────────────────────────────────────────────── */

function main() {
  const { concepts, tracks } = readConcepts();
  const postsByConcept = readPostsByConcept();

  const ids = Object.keys(concepts).sort();
  if (ids.length === 0) fail("개념이 하나도 없다");

  // 필수 필드·도메인·선행 존재 확인
  for (const id of ids) {
    const c = concepts[id] || {};
    if (!c.label) fail(`${id}: label 없음`);
    if (!c.summary) fail(`${id}: summary 없음`);
    if (!c.domain) fail(`${id}: domain 없음`);
    else if (!DOMAINS.has(c.domain))
      fail(`${id}: 알 수 없는 domain "${c.domain}" (허용: ${[...DOMAINS].join(", ")})`);
    for (const p of c.prereq || []) {
      if (!concepts[p]) fail(`${id}: 존재하지 않는 선행 개념 "${p}"`);
      if (p === id) fail(`${id}: 자기 자신을 선행으로 가리킨다`);
    }
  }

  // 글이 없는 개념을 주장하는 글
  for (const [concept, post] of postsByConcept) {
    if (!concepts[concept]) {
      fail(`글 ${post.slug}: concepts.yml 에 없는 개념 "${concept}" 을 주장한다`);
    }
  }

  const prereqOf = (id) => (concepts[id]?.prereq || []).filter((p) => concepts[p]);
  const { level, levels, cycle } = topoLevels(ids, prereqOf);
  if (cycle.length > 0) {
    fail(`개념 그래프에 순환이 있다: ${cycle.join(" → ")}`);
  }

  // 역방향(next)
  const nextOf = new Map(ids.map((id) => [id, []]));
  for (const id of ids) {
    for (const p of prereqOf(id)) nextOf.get(p).push(id);
  }

  // 트랙 검증
  const trackOf = new Map();
  for (const [tid, t] of Object.entries(tracks)) {
    if (!Array.isArray(t.order) || t.order.length === 0) {
      fail(`트랙 ${tid}: order 가 비었다`);
      continue;
    }
    for (const cid of t.order) {
      if (!concepts[cid]) fail(`트랙 ${tid}: 존재하지 않는 개념 "${cid}"`);
      else if (trackOf.has(cid)) {
        warnings.push(`개념 ${cid} 가 트랙 ${trackOf.get(cid)} 와 ${tid} 양쪽에 있다`);
      } else trackOf.set(cid, tid);
    }
    // 트랙 순서가 선행 관계를 어기는지 확인 — 바텀업이 깨지면 가이드라인이 거짓말이 된다
    const pos = new Map(t.order.map((cid, i) => [cid, i]));
    for (const cid of t.order) {
      for (const p of prereqOf(cid)) {
        if (pos.has(p) && pos.get(p) > pos.get(cid)) {
          fail(`트랙 ${tid}: "${cid}" 가 선행 "${p}" 보다 앞에 온다`);
        }
      }
    }
  }

  const nodes = ids.map((id) => {
    const c = concepts[id];
    const post = postsByConcept.get(id) || null;
    return {
      id,
      label: c.label,
      domain: c.domain,
      summary: c.summary,
      prereq: prereqOf(id),
      next: (nextOf.get(id) || []).sort(),
      level: level.has(id) ? level.get(id) : null,
      track: trackOf.get(id) || null,
      // 카테고리별 지도에 쓰는 값. 글이 있으면 그 글을 따르고,
      // 없으면 concepts.yml 의 category → domain 기본값 순으로 정한다.
      category:
        (post && post.category) ||
        c.category ||
        DOMAIN_TO_CATEGORY[c.domain] ||
        "",
      written: !!post,
      post: post ? post.slug : null,
      postTitle: post ? post.title : null,
      readTime: post ? post.readTime : null,
      excerpt: post ? post.excerpt : null,
      chain: level.has(id) ? buildChain(id, prereqOf, level) : [id],
    };
  });

  const orphans = nodes
    .filter((n) => n.prereq.length === 0 && n.next.length === 0)
    .map((n) => n.id);
  if (orphans.length > 0) {
    warnings.push(`아무 데도 연결되지 않은 개념: ${orphans.join(", ")}`);
  }

  if (errors.length > 0) {
    console.error("\n❌ 개념 그래프 빌드 실패");
    for (const e of errors) console.error("  ·", e);
    process.exit(1);
  }

  const graph = {
    generatedAt: new Date().toISOString(),
    nodes,
    levels,
    tracks: Object.fromEntries(
      Object.entries(tracks).map(([tid, t]) => [
        tid,
        {
          label: t.label || tid,
          summary: t.summary || "",
          order: t.order,
          written: t.order.filter((cid) => postsByConcept.has(cid)).length,
          total: t.order.length,
        },
      ])
    ),
    stats: {
      concepts: nodes.length,
      written: nodes.filter((n) => n.written).length,
      depth: levels.length,
      tracks: Object.keys(tracks).length,
    },
  };

  fs.writeFileSync(OUT, JSON.stringify(graph, null, 2), "utf-8");

  for (const w of warnings) console.warn("⚠️ ", w);
  console.log(
    `[concept-graph] 개념 ${graph.stats.concepts}개 (글 있음 ${graph.stats.written}) · ` +
      `깊이 ${graph.stats.depth} · 트랙 ${graph.stats.tracks} → public/concept-graph.json`
  );
  for (const [tid, t] of Object.entries(graph.tracks)) {
    console.log(`   ${tid.padEnd(14)} ${t.written}/${t.total}  ${t.label}`);
  }
}

main();
