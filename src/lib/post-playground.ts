/**
 * 본문 라이브 플레이그라운드 — ```playground 펜스
 *
 *   ```playground
 *   #! react title=Counter.jsx height=300
 *   import { useState } from "react";
 *
 *   export default function App() {
 *     const [n, setN] = useState(0);
 *     return <button onClick={() => setN(n + 1)}>클릭 {n}</button>;
 *   }
 *   ```
 *
 * 첫 줄이 `#!` 또는 `%%` 로 시작하면 옵션 줄로 본다(생략 가능).
 *   kind   : react(기본) | ts | js | html
 *   title  : 편집기 탭에 뜰 파일명
 *   height : 결과 패널 높이(px)
 *
 * 동작:
 *   textarea 편집 → iframe.srcdoc 에 완성된 문서를 주입 → 그 안에서
 *   importmap(esm.sh) + @babel/standalone 으로 JSX/TS 를 브라우저에서 컴파일 →
 *   type="module" 로 실행. console.* 은 postMessage 로 부모에 올려 콘솔 패널에 찍는다.
 *
 * UMD + eval 방식과 달리 `import` 문이 그대로 동작하고 npm 패키지도 쓸 수 있다.
 * 대신 첫 실행에 CDN 왕복이 필요하다(오프라인이면 안내 문구가 뜬다).
 */

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

type PgKind = "react" | "ts" | "js" | "html";

// post.tsx 의 hljs 인스턴스와는 별개 모듈이라 여기서도 언어를 등록해야 한다.
// 이 파일은 playground 가 있는 글에서만 내려받으므로 번들 비용은 그 글에만 붙는다.
let hljsReady = false;
function ensureHljs() {
  if (hljsReady) return;
  hljs.registerLanguage("javascript", javascript);
  hljs.registerLanguage("typescript", typescript);
  hljs.registerLanguage("xml", xml);
  hljs.configure({ ignoreUnescapedHTML: true });
  hljsReady = true;
}

const HLJS_LANG: Record<PgKind, string> = {
  react: "javascript",
  ts: "typescript",
  js: "javascript",
  html: "xml",
};

function highlightPlayground(codeEl: HTMLElement) {
  ensureHljs();
  delete codeEl.dataset.highlighted;
  try {
    hljs.highlightElement(codeEl);
  } catch {
    // 하이라이팅 실패는 치명적이지 않다 — 색만 없이 그대로 보인다
  }
}

interface PgSpec {
  kind: PgKind;
  title: string;
  height: number;
  code: string;
}

const REACT_VERSION = "18.3.1";
const ESM = "https://esm.sh";
const BABEL_URL = "https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js";

function parseSpec(source: string): PgSpec {
  const lines = String(source || "").split(/\r?\n/);
  let kind: PgKind = "react";
  let title = "";
  let height = 300;

  if (/^\s*(#!|%%)/.test(lines[0] || "")) {
    const opt = lines[0].replace(/^\s*(#!|%%)\s*/, "");
    lines.shift();
    const kindMatch = opt.match(/\b(react|ts|js|html)\b/);
    if (kindMatch) kind = kindMatch[1] as PgKind;
    const titleMatch = opt.match(/title=("([^"]*)"|(\S+))/);
    if (titleMatch) title = (titleMatch[2] ?? titleMatch[3] ?? "").trim();
    const heightMatch = opt.match(/height=(\d+)/);
    if (heightMatch) height = Math.max(140, Math.min(720, Number(heightMatch[1])));
  }

  const defaultTitle: Record<PgKind, string> = {
    react: "App.jsx",
    ts: "App.tsx",
    js: "main.js",
    html: "index.html",
  };

  return {
    kind,
    title: title || defaultTitle[kind],
    height,
    code: lines.join("\n").replace(/^\n+|\n+$/g, ""),
  };
}

/* ── iframe 문서 ──────────────────────────────────────────── */

const IMPORT_MAP = JSON.stringify({
  imports: {
    react: `${ESM}/react@${REACT_VERSION}`,
    "react/": `${ESM}/react@${REACT_VERSION}/`,
    "react-dom": `${ESM}/react-dom@${REACT_VERSION}`,
    "react-dom/": `${ESM}/react-dom@${REACT_VERSION}/`,
  },
});

/**
 * iframe 안은 부모의 CSS 변수를 못 쓴다(별도 문서다). 그래서 색을 직접 넘긴다.
 * 하드코딩하면 라이트 테마에서 밝은 글자가 밝은 배경에 묻혀 아무것도 안 보인다.
 */
function frameCss(dark: boolean): string {
  const c = dark
    ? {
        fg: "#e5e7eb", border: "#3f4757", btn: "#1f2633", field: "#151a24",
        link: "#8fa7ff", err: "#fca5a5",
        track: "#141a24", thumb: "#3a4356", thumbHover: "#566078",
      }
    : {
        fg: "#1f2937", border: "#d1d5db", btn: "#f3f4f6", field: "#ffffff",
        link: "#3b5bdb", err: "#dc2626",
        track: "#eef1f5", thumb: "#c3cad6", thumbHover: "#a4adbd",
      };
  return `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:14px/1.6 Pretendard,system-ui,-apple-system,sans-serif;padding:14px;color:${c.fg};background:transparent}
button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid ${c.border};background:${c.btn};color:${c.fg};cursor:pointer}
button:hover{border-color:#6c8cff}
input,select,textarea{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid ${c.border};background:${c.field};color:${c.fg}}
a{color:${c.link}}
#__err{white-space:pre-wrap;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:${c.err}}

/* iframe 은 별도 문서라 부모의 스크롤바 스타일이 안 닿는다.
   그냥 두면 결과 패널에만 OS 기본 스크롤바가 튀어나와 편집기 쪽과 따로 논다. */
*::-webkit-scrollbar{width:10px;height:10px}
*::-webkit-scrollbar-track{background:${c.track};border-radius:8px}
*::-webkit-scrollbar-thumb{background:${c.thumb};border-radius:8px;border:2px solid ${c.track};background-clip:padding-box}
*::-webkit-scrollbar-thumb:hover{background:${c.thumbHover};background-clip:padding-box}
*::-webkit-scrollbar-corner{background:transparent}
*{scrollbar-width:thin;scrollbar-color:${c.thumb} ${c.track}}
`;
}

const isDarkTheme = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

/** 부모로 로그를 올리고, 에러를 화면에도 남기는 공통 부트스트랩. */
const RUNTIME_PRELUDE = `
(function(){
  var send = function(level, args){
    try {
      parent.postMessage({ __pg: true, level: level, text: Array.prototype.map.call(args, function(a){
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch (e) { return String(a); }
      }).join(' ') }, '*');
    } catch (e) {}
  };
  ['log','info','warn','error'].forEach(function(k){
    var orig = console[k].bind(console);
    console[k] = function(){ send(k, arguments); orig.apply(null, arguments); };
  });
  window.addEventListener('error', function(e){ send('error', [e.message]); });
  window.addEventListener('unhandledrejection', function(e){ send('error', ['Unhandled rejection: ' + e.reason]); });
})();
`;

/** react/ts: 컴파일 → blob 모듈로 실행. App 이 있으면 자동 마운트. */
const MODULE_RUNNER = `
(function(){
  var raw = window.__PG_SRC || '';
  var boot = [
    '',
    'let __App;',
    'try { __App = App } catch (e) {}',
    'try { __App = __App || (typeof exports !== "undefined" ? exports.default : undefined) } catch (e) {}',
    'if (__App) {',
    '  const { createRoot } = await import("react-dom/client");',
    '  const { createElement } = await import("react");',
    '  createRoot(document.getElementById("root")).render(createElement(__App));',
    '}',
  ].join('\\n');

  function fail(msg){
    var box = document.getElementById('__err');
    box.textContent = String(msg);
    try { parent.postMessage({ __pg: true, level: 'error', text: String(msg) }, '*'); } catch (e) {}
  }

  if (typeof Babel === 'undefined') {
    fail('컴파일러(@babel/standalone)를 CDN에서 불러오지 못했다. 네트워크 연결을 확인해라.');
    return;
  }

  var out;
  try {
    out = Babel.transform(raw.replace(/export\\s+default\\s+function\\s+App/, 'function App')
                             .replace(/export\\s+default\\s+/, 'const __default = '), {
      presets: [['react', { runtime: 'automatic' }], 'typescript'],
      filename: 'playground.tsx',
      sourceType: 'module',
    }).code;
  } catch (e) {
    fail('컴파일 오류\\n' + (e && e.message ? e.message : e));
    return;
  }

  var blob = new Blob([out + boot], { type: 'text/javascript' });
  var url = URL.createObjectURL(blob);
  var s = document.createElement('script');
  s.type = 'module';
  s.src = url;
  s.onerror = function(){ fail('모듈 실행 실패 — import 한 패키지 이름을 확인해라.'); };
  document.body.appendChild(s);
})();
`;

/** js: 모듈로 그냥 실행(콘솔 학습용). */
const PLAIN_RUNNER = `
(function(){
  var raw = window.__PG_SRC || '';
  var blob = new Blob([raw], { type: 'text/javascript' });
  var s = document.createElement('script');
  s.type = 'module';
  s.src = URL.createObjectURL(blob);
  s.onerror = function(){ document.getElementById('__err').textContent = '실행 실패'; };
  document.body.appendChild(s);
})();
`;

function buildSrcdoc(spec: PgSpec, code: string, dark: boolean): string {
  const FRAME_CSS = frameCss(dark);

  if (spec.kind === "html") {
    // 사용자가 문서 전체를 쓴다. 콘솔만 가로채 부모로 넘긴다.
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>${FRAME_CSS}</style>
<script>${RUNTIME_PRELUDE}<\/script>
</head><body>${code}<pre id="__err"></pre></body></html>`;
  }

  const needsReact = spec.kind === "react" || spec.kind === "ts";
  const runner = needsReact ? MODULE_RUNNER : PLAIN_RUNNER;

  // 코드는 JS 문자열 리터럴로 넘긴다.
  // <script type="text/plain"> 안은 raw text 라 HTML 엔티티가 디코딩되지 않는다
  // (=&gt; 가 그대로 코드가 되어 SyntaxError 가 났다).
  // "<" 만 < 로 바꿔 두면 문자열 안의 </script> 로 블록이 끊기지 않는다.
  const srcLiteral = JSON.stringify(code).replace(/</g, "\\u003c");

  return `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>${FRAME_CSS}</style>
<script type="importmap">${IMPORT_MAP}<\/script>
<script>${RUNTIME_PRELUDE}<\/script>
<script>window.__PG_SRC = ${srcLiteral};<\/script>
${needsReact ? `<script src="${BABEL_URL}"><\/script>` : ""}
</head><body>
<div id="root"></div>
<pre id="__err"></pre>
<script>${runner}<\/script>
</body></html>`;
}

/* ── UI ───────────────────────────────────────────────────── */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildPlayground(spec: PgSpec): HTMLElement {
  const root = el("div", "post-pg");

  const bar = el("div", "post-pg__bar");
  bar.appendChild(el("span", "post-pg__file", spec.title));
  const badge = el("span", "post-pg__kind", spec.kind);
  bar.appendChild(badge);
  const actions = el("div", "post-pg__actions");
  const btnRun = el("button", "post-pg__btn post-pg__btn--run", "▶ 실행");
  btnRun.type = "button";
  btnRun.title = "Ctrl+Enter";
  const btnReset = el("button", "post-pg__btn", "↺ 되돌리기");
  btnReset.type = "button";
  actions.append(btnRun, btnReset);
  bar.appendChild(actions);
  root.appendChild(bar);

  const body = el("div", "post-pg__body");

  // 편집기 — 색이 입혀진 <pre> 위에 글자만 투명한 <textarea> 를 정확히 포개 둔다.
  // 커서·선택·IME 는 textarea 가 그대로 처리하고, 보이는 색은 뒤의 <pre> 가 낸다.
  // (외부 에디터 라이브러리 없이 하이라이팅을 얻는 가장 가벼운 방법)
  const editorWrap = el("div", "post-pg__editor");
  const highlightPre = el("pre", "post-pg__hl");
  highlightPre.setAttribute("aria-hidden", "true");
  const highlightCode = el("code");
  highlightPre.appendChild(highlightCode);

  const ta = el("textarea", "post-pg__code");
  ta.value = spec.code;
  ta.spellcheck = false;
  ta.setAttribute("aria-label", `${spec.title} 편집기`);
  editorWrap.append(highlightPre, ta);

  const paintHighlight = () => {
    // 마지막 줄이 개행으로 끝나면 <pre> 가 그 줄을 렌더하지 않아 높이가 어긋난다
    const src = ta.value.endsWith("\n") ? `${ta.value} ` : ta.value;
    highlightCode.className = `hljs language-${HLJS_LANG[spec.kind]}`;
    highlightCode.textContent = src;
    highlightPlayground(highlightCode);
  };
  const syncScroll = () => {
    highlightPre.scrollTop = ta.scrollTop;
    highlightPre.scrollLeft = ta.scrollLeft;
  };
  ta.addEventListener("input", () => {
    paintHighlight();
    syncScroll();
  });
  ta.addEventListener("scroll", syncScroll);
  paintHighlight();

  const preview = el("div", "post-pg__preview");
  const frame = el("iframe");
  frame.className = "post-pg__frame";
  frame.setAttribute("sandbox", "allow-scripts allow-popups allow-modals");
  frame.setAttribute("title", `${spec.title} 실행 결과`);
  frame.style.height = `${spec.height}px`;
  preview.appendChild(frame);

  const consoleBox = el("div", "post-pg__console");
  const consoleHead = el("div", "post-pg__console-head");
  consoleHead.appendChild(el("span", undefined, "콘솔"));
  const btnClear = el("button", "post-pg__btn post-pg__btn--ghost", "지우기");
  btnClear.type = "button";
  consoleHead.appendChild(btnClear);
  const consoleOut = el("div", "post-pg__console-out");
  consoleBox.append(consoleHead, consoleOut);
  preview.appendChild(consoleBox);

  body.append(editorWrap, preview);
  root.appendChild(body);

  /* 실행 */
  let started = false;
  const run = () => {
    started = true;
    consoleOut.replaceChildren();
    // iframe 은 별도 문서라 부모 CSS 변수가 안 먹는다. 실행 시점의 테마를 넣어 준다.
    // 테마를 바꾸면 post.tsx 의 useEffect(deps: [post, theme])가 통째로 다시
    // 하이드레이트하므로 여기서 따로 감시하지 않는다.
    frame.srcdoc = buildSrcdoc(spec, ta.value, isDarkTheme());
  };

  btnRun.addEventListener("click", run);
  btnReset.addEventListener("click", () => {
    ta.value = spec.code;
    run();
  });
  btnClear.addEventListener("click", () => consoleOut.replaceChildren());

  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart;
      const t = ta.selectionEnd;
      ta.value = `${ta.value.slice(0, s)}  ${ta.value.slice(t)}`;
      ta.selectionStart = ta.selectionEnd = s + 2;
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      run();
    }
  });

  // 이 플레이그라운드의 iframe 이 보낸 메시지만 받는다
  window.addEventListener("message", (e: MessageEvent) => {
    const d = e.data;
    if (!d || d.__pg !== true) return;
    if (e.source !== frame.contentWindow) return;
    const line = el("div", `post-pg__line post-pg__line--${d.level}`, d.text);
    consoleOut.appendChild(line);
    consoleOut.scrollTop = consoleOut.scrollHeight;
  });

  // 화면에 들어올 때 처음 한 번만 실행(첫 화면에서 CDN을 동시에 때리지 않게)
  const start = () => {
    if (started) return;
    run();
  };
  if (typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries)
          if (en.isIntersecting) {
            start();
            io.disconnect();
          }
      },
      { rootMargin: "200px" }
    );
    io.observe(root);
  } else {
    start();
  }

  return root;
}

/* ── 하이드레이션 ─────────────────────────────────────────── */

export function hydratePlaygrounds(root: HTMLElement | null) {
  if (!root) return;

  root.querySelectorAll(".post-pg").forEach((n) => n.remove());
  root.querySelectorAll("pre[data-pg-rendered]").forEach((pre) => {
    (pre as HTMLElement).style.display = "";
    delete (pre as HTMLElement).dataset.pgRendered;
  });

  root
    .querySelectorAll<HTMLElement>("code.language-playground")
    .forEach((code) => {
      const pre = code.closest("pre") as HTMLElement | null;
      if (!pre || pre.dataset.pgRendered) return;
      const spec = parseSpec(code.textContent || "");
      pre.style.display = "none";
      pre.dataset.pgRendered = "true";
      pre.insertAdjacentElement("afterend", buildPlayground(spec));
    });
}

export const __test = { parseSpec, buildSrcdoc };
