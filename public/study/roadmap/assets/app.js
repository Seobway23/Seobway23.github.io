/* ==========================================================================
   Frontend Roadmap Study — Runtime
   - 헤더 / 탭바 / TOC / 이전·다음 자동 생성
   - 라이브 코드 플레이그라운드 (iframe srcdoc + Babel Standalone)
   - Mermaid 다이어그램, highlight.js, 툴팁 위치 보정, 진도 저장
   페이지는 <body data-chapter="01"> 만 지정하면 나머지는 이 파일이 조립한다.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
   * 1. 챕터 레지스트리 — 탭/이전다음/인덱스가 모두 이 배열을 따른다
   * -------------------------------------------------------------------- */
  var CHAPTERS = [
    { id: "00", file: "index.html", tab: "로드맵", title: "프론트엔드 전체 지도",
      desc: "무엇을 왜 배우는지, 브라우저가 화면을 그리는 전체 흐름부터 잡는다.",
      keys: ["Roadmap", "브라우저", "학습경로"] },
    { id: "01", file: "ch01.html", tab: "JavaScript 원리", title: "JavaScript 동작 원리",
      desc: "값·타입·스코프·클로저·this·이벤트 루프·Promise. 모든 프레임워크의 밑바닥.",
      keys: ["Closure", "Event Loop", "Promise", "async/await"] },
    { id: "02", file: "ch02.html", tab: "TypeScript", title: "TypeScript 타입 시스템",
      desc: "타입 좁히기, 제네릭, 유틸리티 타입, tsconfig까지 실무 기준으로.",
      keys: ["Narrowing", "Generic", "Utility Types", "tsconfig"] },
    { id: "03", file: "ch03.html", tab: "React 기초", title: "React 기초 — 컴포넌트와 상태",
      desc: "JSX, props, state, 리스트와 key, 이벤트, 폼. UI를 함수로 만드는 법.",
      keys: ["JSX", "props", "state", "key"] },
    { id: "04", file: "ch04.html", tab: "Hooks 심화", title: "React Hooks 심화 & 렌더링 최적화",
      desc: "전체 훅 레퍼런스 + 리렌더링 원리 + memo/useMemo/useCallback 판단 기준.",
      keys: ["useEffect", "useMemo", "memo", "React Compiler"] },
    { id: "05", file: "ch05.html", tab: "상태 · 데이터",
      title: "상태 관리 & 데이터 페칭",
      desc: "서버 상태(TanStack Query)와 클라이언트 상태(Zustand)를 나눠서 다룬다.",
      keys: ["TanStack Query", "Zustand", "캐시", "Optimistic"] },
    { id: "06", file: "ch06.html", tab: "UI · 스타일링", title: "UI & 스타일링",
      desc: "모던 CSS, Tailwind, shadcn/ui, 디자인 토큰, 컴포넌트 패턴.",
      keys: ["CSS Nesting", "Tailwind", "shadcn/ui", "Design Token"] },
    { id: "07", file: "ch07.html", tab: "빌드 · Yarn Berry", title: "빌드 도구 & 패키지 매니저",
      desc: "ESM/번들링 원리, Vite, 그리고 Yarn Berry(PnP · Zero-Install · Workspaces).",
      keys: ["Vite", "ESM", "Yarn Berry", "PnP"] },
    { id: "08", file: "ch08.html", tab: "성능 · 자료구조", title: "성능 최적화 & 자료구조",
      desc: "Web Vitals, 페이지네이션, 무한스크롤, 가상 스크롤, Map/Set/LRU와 복잡도.",
      keys: ["Web Vitals", "Pagination", "Virtual List", "O(n)"] },
    { id: "09", file: "ch09.html", tab: "렌더링 · a11y", title: "렌더링 전략 & 접근성",
      desc: "CSR/SSR/SSG/ISR/RSC 선택 기준과 WCAG·ARIA 기반 접근성.",
      keys: ["SSR", "RSC", "Hydration", "WCAG", "ARIA"] },
    { id: "10", file: "ch10.html", tab: "테스트 · 품질", title: "테스트 · 코드 품질 · Git",
      desc: "Vitest, Testing Library, Playwright, ESLint/Prettier/Biome, 커밋 전략.",
      keys: ["Vitest", "Playwright", "ESLint", "Conventional Commits"] },
    { id: "99", file: "glossary.html", tab: "용어사전", title: "용어 사전",
      desc: "본문에 나온 모든 용어를 한곳에서. 모르는 단어는 여기로 타고 들어온다.",
      keys: ["Glossary"] }
  ];
  window.CHAPTERS = CHAPTERS;

  var CDN = {
    react: "https://unpkg.com/react@18.3.1/umd/react.development.js",
    reactDom: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js",
    babel: "https://unpkg.com/@babel/standalone@7.25.6/babel.min.js",
    hljs: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js",
    hljsDark: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css",
    hljsLight: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css",
    mermaid: "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs"
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  /* ----------------------------------------------------------------------
   * 2. 테마
   * -------------------------------------------------------------------- */
  var THEME_KEY = "fe-study-theme";
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    var link = $("#hljs-theme");
    if (link) link.href = t === "light" ? CDN.hljsLight : CDN.hljsDark;
    var btn = $("#theme-btn");
    if (btn) btn.textContent = t === "light" ? "🌙" : "☀";
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    document.documentElement.setAttribute("data-theme", saved || "dark");
  })();

  /* ----------------------------------------------------------------------
   * 3. 헤더 · 탭바 · 이전/다음
   * -------------------------------------------------------------------- */
  function buildChrome() {
    var cur = document.body.getAttribute("data-chapter") || "00";
    var idx = -1;
    for (var i = 0; i < CHAPTERS.length; i++) if (CHAPTERS[i].id === cur) idx = i;

    var hdr = $("#hdr");
    if (hdr) {
      hdr.outerHTML =
        '<header class="hdr">' +
        '  <a class="hdr__brand" href="index.html"><span class="hdr__logo">FE</span>' +
        '     프론트엔드 로드맵 학습서</a>' +
        '  <span class="hdr__spacer"></span>' +
        '  <span class="hdr__meta">출처: 공식 문서(MDN · React · TypeScript · Vite · Yarn · W3C)</span>' +
        '  <button class="iconbtn" id="theme-btn" title="테마 전환" aria-label="테마 전환">☀</button>' +
        '</header>';
      $("#theme-btn").addEventListener("click", function () {
        applyTheme(currentTheme() === "light" ? "dark" : "light");
      });
    }

    var tb = $("#tabbar");
    if (tb) {
      var html = '<nav class="tabbar" aria-label="챕터"><div class="tabbar__inner">';
      CHAPTERS.forEach(function (c) {
        html +=
          '<a class="tab" href="' + c.file + '"' +
          (c.id === cur ? ' aria-current="page"' : "") + ">" +
          '<span class="tab__no">' + c.id + "</span>" + esc(c.tab) + "</a>";
      });
      tb.outerHTML = html + "</div></nav>";
      var active = $('.tab[aria-current="page"]');
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: "nearest", inline: "center" });
      }
    }

    var content = $(".content");
    if (content && idx >= 0 && !$(".pager")) {
      var prev = CHAPTERS[idx - 1], next = CHAPTERS[idx + 1];
      var p = document.createElement("nav");
      p.className = "pager";
      p.innerHTML =
        (prev ? '<a href="' + prev.file + '"><small>← 이전</small><b>' + esc(prev.title) + "</b></a>" : "<span style='flex:1'></span>") +
        (next ? '<a class="nx" href="' + next.file + '"><small>다음 →</small><b>' + esc(next.title) + "</b></a>" : "<span style='flex:1'></span>");
      content.appendChild(p);
    }
  }

  /* ----------------------------------------------------------------------
   * 4. TOC 자동 생성 + 스크롤 스파이
   * -------------------------------------------------------------------- */
  function slug(s, i) {
    var base = String(s).trim().toLowerCase()
      .replace(/[^\w가-힣\s-]/g, "").replace(/\s+/g, "-").slice(0, 48);
    return base ? "s-" + base : "s-" + i;
  }
  function buildToc() {
    var toc = $("#toc"), content = $(".content");
    if (!toc || !content) return;
    var heads = $$("h2, h3", content).filter(function (h) {
      return !h.closest(".refs") || h.tagName === "H2";
    });
    if (!heads.length) { toc.style.display = "none"; return; }
    var html = '<div class="toc__title">이 챕터 목차</div>';
    heads.forEach(function (h, i) {
      if (!h.id) h.id = slug(h.textContent, i);
      var label = h.textContent.replace(/^\s*[\d.]+\s*/, "").trim();
      html += '<a href="#' + h.id + '" data-depth="' + (h.tagName === "H3" ? 3 : 2) + '">' + esc(label) + "</a>";
    });
    toc.innerHTML = html;

    var links = {};
    $$("a", toc).forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    if (!("IntersectionObserver" in window)) return;
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var found = null;
      for (var i = 0; i < heads.length; i++) if (visible[heads[i].id]) { found = heads[i].id; break; }
      $$("a", toc).forEach(function (a) { a.classList.remove("is-active"); });
      if (found && links[found]) links[found].classList.add("is-active");
    }, { rootMargin: "-110px 0px -70% 0px" });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ----------------------------------------------------------------------
   * 5. 툴팁 가장자리 보정
   * -------------------------------------------------------------------- */
  function fixTooltips() {
    $$(".t").forEach(function (el) {
      el.setAttribute("tabindex", "0");
      el.addEventListener("mouseenter", function () {
        el.classList.remove("t--l", "t--r");
        var r = el.getBoundingClientRect();
        var half = 175;
        if (r.left < half) el.classList.add("t--l");
        else if (window.innerWidth - r.right < half) el.classList.add("t--r");
      });
    });
  }

  /* ----------------------------------------------------------------------
   * 6. 코드 복사 버튼 + highlight.js
   * -------------------------------------------------------------------- */
  function initCopy() {
    $$(".codeblock").forEach(function (cb) {
      var bar = $(".codeblock__bar", cb);
      if (!bar || $(".copy", bar)) return;
      var btn = document.createElement("button");
      btn.className = "copy"; btn.type = "button"; btn.textContent = "복사";
      btn.addEventListener("click", function () {
        var code = $("pre code", cb) || $("pre", cb);
        var text = code ? code.textContent : "";
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        btn.textContent = "복사됨 ✓";
        setTimeout(function () { btn.textContent = "복사"; }, 1400);
      });
      bar.appendChild(btn);
    });
  }
  function initHighlight() {
    var link = document.createElement("link");
    link.rel = "stylesheet"; link.id = "hljs-theme";
    link.href = currentTheme() === "light" ? CDN.hljsLight : CDN.hljsDark;
    document.head.appendChild(link);
    var s = document.createElement("script");
    s.src = CDN.hljs;
    s.onload = function () {
      if (!window.hljs) return;
      window.hljs.configure({ ignoreUnescapedHTML: true });
      $$("pre code").forEach(function (b) { window.hljs.highlightElement(b); });
    };
    document.head.appendChild(s);
  }

  /* ----------------------------------------------------------------------
   * 7. Mermaid
   * -------------------------------------------------------------------- */
  function initMermaid() {
    if (!$(".mermaid")) return;
    import(CDN.mermaid)
      .then(function (m) {
        var mermaid = m.default;
        var dark = currentTheme() !== "light";
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: dark ? "dark" : "default",
          fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif',
          themeVariables: dark
            ? { primaryColor: "#1b2130", primaryTextColor: "#e6e9f0", primaryBorderColor: "#6c8cff",
                lineColor: "#6f7891", secondaryColor: "#151923", tertiaryColor: "#11141b",
                background: "#151923", mainBkg: "#1b2130", nodeBorder: "#6c8cff",
                clusterBkg: "#11141b", clusterBorder: "#232a38", titleColor: "#e6e9f0",
                edgeLabelBackground: "#151923", textColor: "#e6e9f0" }
            : {}
        });
        mermaid.run({ querySelector: ".mermaid" });
      })
      .catch(function () {
        $$(".mermaid").forEach(function (el) {
          el.innerHTML =
            '<div class="note note--warn" style="text-align:left"><span class="note__t">다이어그램 로드 실패</span>' +
            "인터넷 연결이 없으면 Mermaid CDN을 불러오지 못합니다. 아래는 원본 정의입니다." +
            "<pre style='margin-top:10px'>" + esc(el.textContent) + "</pre></div>";
        });
      });
  }

  /* ----------------------------------------------------------------------
   * 8. 플레이그라운드 (라이브 실행)
   *
   *  마크업 계약:
   *  <div class="pg" data-pg="react|html|js|ts" data-title="App.jsx" data-height="260">
   *    <script type="text/plain" class="pg__src">  ...코드...  </script>
   *  </div>
   * -------------------------------------------------------------------- */
  var PG_BASE_CSS =
    "*,*::before,*::after{box-sizing:border-box}" +
    "body{font-family:'Pretendard Variable',Pretendard,-apple-system,system-ui,'Malgun Gothic',sans-serif;" +
    "margin:0;padding:16px;color:#171a21;background:#fff;font-size:15px;line-height:1.7}" +
    "button{font:inherit;padding:7px 13px;border-radius:9px;border:1px solid #d6dae4;background:#fff;cursor:pointer}" +
    "button:hover{background:#f2f4f9}" +
    "input,select,textarea{font:inherit;padding:7px 10px;border-radius:9px;border:1px solid #d6dae4}" +
    "ul,ol{padding-left:20px}h1{font-size:22px}h2{font-size:18px}h3{font-size:16px}" +
    "table{border-collapse:collapse}th,td{border:1px solid #e2e6f0;padding:6px 10px;text-align:left}";

  function consoleShim(id) {
    return (
      "(function(){var send=function(lv,args){try{parent.postMessage({__pg:'" + id + "',lv:lv," +
      "msg:Array.prototype.map.call(args,function(a){try{" +
      "if(a instanceof Error)return a.stack||a.message;" +
      "return typeof a==='object'?JSON.stringify(a,function(k,v){return typeof v==='function'?'[Function]':v},2):String(a)}" +
      "catch(e){return String(a)}}).join(' ')},'*')}catch(e){}};" +
      "['log','info','warn','error','debug'].forEach(function(m){var o=console[m];" +
      "console[m]=function(){send(m,arguments);try{o.apply(console,arguments)}catch(e){}}});" +
      "window.addEventListener('error',function(e){send('error',[e.message+' ('+(e.lineno||0)+':'+(e.colno||0)+')'])});" +
      "window.addEventListener('unhandledrejection',function(e){send('error',['Unhandled rejection: '+e.reason])});" +
      "})();"
    );
  }

  function buildSrcdoc(code, kind, id) {
    var head =
      "<!doctype html><html lang='ko'><head><meta charset='utf-8'>" +
      "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
      "<link rel='stylesheet' href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css'>" +
      "<style>" + PG_BASE_CSS + "</style>";

    if (kind === "html") {
      return head + "</head><body>" + code +
        "<scr" + "ipt>" + consoleShim(id) + "</scr" + "ipt></body></html>";
    }

    var needReact = kind === "react" || kind === "ts";
    var scripts = "";
    if (needReact) {
      scripts += "<scr" + "ipt src='" + CDN.react + "'></scr" + "ipt>" +
                 "<scr" + "ipt src='" + CDN.reactDom + "'></scr" + "ipt>";
    }
    scripts += "<scr" + "ipt src='" + CDN.babel + "'></scr" + "ipt>";

    // 사용자 코드가 App 컴포넌트를 정의하면 자동으로 마운트한다.
    var autoMount =
      "\n;try{if(typeof App!=='undefined'&&document.getElementById('root')){" +
      "var __r=ReactDOM.createRoot(document.getElementById('root'));" +
      "__r.render(React.createElement(React.StrictMode,null,React.createElement(App)));}}" +
      "catch(__e){console.error(__e)}";

    var payload = JSON.stringify(code + (needReact ? autoMount : ""));
    var presets = kind === "ts"
      ? "[['typescript',{allExtensions:true,isTSX:true}],'react']"
      : (needReact ? "['react']" : "[]");

    var runner =
      "(function(){var code=" + payload + ";" +
      "if(typeof Babel==='undefined'){document.body.insertAdjacentHTML('beforeend'," +
      "\"<div style='padding:12px;border:1px solid #ffcf9e;background:#fff7ec;border-radius:10px;color:#8a5300'>\"+" +
      "'라이브 실행에는 인터넷 연결이 필요합니다 (Babel/React CDN). 코드는 왼쪽에서 그대로 확인하세요.'+'</div>');return}" +
      "try{var out=Babel.transform(code,{presets:" + presets + ",filename:'demo.tsx'}).code;" +
      "(0,eval)(out)}catch(e){console.error(e.message||String(e));" +
      "document.body.insertAdjacentHTML('beforeend'," +
      "\"<pre style='color:#c0392b;white-space:pre-wrap;font-size:12.5px'>\"+" +
      "String(e.message||e).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</pre>')}})();";

    return head + "</head><body>" + (needReact ? "<div id='root'></div>" : "") +
      "<scr" + "ipt>" + consoleShim(id) + "</scr" + "ipt>" +
      scripts +
      "<scr" + "ipt>window.addEventListener('load',function(){" + runner + "});</scr" + "ipt>" +
      "</body></html>";
  }

  var pgSeq = 0;
  var pgConsoles = {};

  function initPlaygrounds() {
    $$(".pg").forEach(function (pg) {
      var srcEl = $(".pg__src", pg);
      if (!srcEl) return;
      var kind = pg.getAttribute("data-pg") || "react";
      var title = pg.getAttribute("data-title") || (kind === "html" ? "index.html" : kind === "js" ? "main.js" : "App.jsx");
      var height = pg.getAttribute("data-height") || "";
      // `<\/script>` 로 이스케이프해 둔 것을 실제 태그로 복원한다.
      var original = srcEl.textContent
        .replace(/^\s*\n/, "")
        .replace(/\s+$/, "")
        .replace(/<\\\//g, "</");
      var id = "pg" + (++pgSeq);

      pg.innerHTML =
        '<div class="pg__bar">' +
        '  <span class="pg__dot" style="background:#ff5f57"></span>' +
        '  <span class="pg__dot" style="background:#febc2e"></span>' +
        '  <span class="pg__dot" style="background:#28c840"></span>' +
        '  <span class="pg__title">' + esc(title) + "</span>" +
        '  <span class="pg__actions">' +
        '    <button class="pg__btn" type="button" data-act="reset">되돌리기</button>' +
        '    <button class="pg__btn pg__btn--run" type="button" data-act="run">▶ 실행</button>' +
        "  </span>" +
        "</div>" +
        '<div class="pg__body">' +
        '  <div class="pg__pane">' +
        '    <div class="pg__label">코드 — 직접 고쳐보고 ▶ 실행</div>' +
        '    <textarea class="pg__code" spellcheck="false"></textarea>' +
        "  </div>" +
        '  <div class="pg__pane">' +
        '    <div class="pg__label">' + (kind === "js" ? "콘솔 출력" : "실행 결과") + "</div>" +
        '    <iframe class="pg__out" sandbox="allow-scripts allow-modals allow-popups" title="실행 결과"></iframe>' +
        '    <div class="pg__console" aria-live="polite"></div>' +
        "  </div>" +
        "</div>";

      var ta = $(".pg__code", pg);
      var frame = $(".pg__out", pg);
      var box = $(".pg__console", pg);
      var label = $(".pg__pane + .pg__pane .pg__label", pg);
      ta.value = original;
      // 코드/결과가 세로로 쌓이므로 결과 패널 높이는 별도로 눌러 전체가 너무 길어지지 않게 한다.
      var codeH = parseInt(height, 10) || 240;
      var outH = Math.max(180, Math.min(codeH, 320));
      ta.style.minHeight = codeH + "px";
      pgConsoles[id] = box;

      var HAS_APP = /function\s+App\s*\(|const\s+App\s*=|class\s+App\s/;
      // 렌더할 컴포넌트가 없는 코드는 출력 패널을 콘솔 전용으로 전환한다.
      function applyLayout(code) {
        var consoleOnly = kind === "js" ||
          ((kind === "react" || kind === "ts") && !HAS_APP.test(code));
        if (consoleOnly) {
          frame.style.minHeight = "0"; frame.style.height = "0"; frame.style.border = "0";
          box.style.maxHeight = "none"; box.style.minHeight = outH + "px";
          if (label) label.textContent = "콘솔 출력";
        } else {
          frame.style.height = ""; frame.style.border = "";
          frame.style.minHeight = outH + "px";
          box.style.maxHeight = "190px"; box.style.minHeight = "";
          if (label) label.textContent = "실행 결과";
        }
      }
      applyLayout(original);

      // Tab 키로 들여쓰기
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Tab") {
          e.preventDefault();
          var s = ta.selectionStart, en = ta.selectionEnd;
          ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 2;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); }
      });

      function run() {
        box.innerHTML = "";
        applyLayout(ta.value);
        frame.srcdoc = buildSrcdoc(ta.value, kind, id);
      }
      $('[data-act="run"]', pg).addEventListener("click", run);
      $('[data-act="reset"]', pg).addEventListener("click", function () {
        ta.value = original; run();
      });

      // 뷰포트에 들어올 때 최초 1회 실행 (초기 로딩 부담 최소화)
      if ("IntersectionObserver" in window) {
        var once = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { run(); once.disconnect(); } });
        }, { rootMargin: "300px" });
        once.observe(pg);
      } else { run(); }
    });

    window.addEventListener("message", function (e) {
      var d = e.data;
      if (!d || !d.__pg || !pgConsoles[d.__pg]) return;
      var box = pgConsoles[d.__pg];
      var cls = d.lv === "error" ? "lg-err" : d.lv === "warn" ? "lg-warn" : "";
      box.insertAdjacentHTML("beforeend",
        '<div class="' + cls + '"><span class="lg-i">› </span>' + esc(d.msg) + "</div>");
      box.scrollTop = box.scrollHeight;
    });
  }

  /* ----------------------------------------------------------------------
   * 9. 체크리스트 진도 저장
   * -------------------------------------------------------------------- */
  function initChecklist() {
    var page = location.pathname.split("/").pop() || "index.html";
    $$('.check input[type="checkbox"]').forEach(function (cb, i) {
      var key = "fe-study:" + page + ":" + i;
      try { if (localStorage.getItem(key) === "1") cb.checked = true; } catch (e) {}
      cb.addEventListener("change", function () {
        try { localStorage.setItem(key, cb.checked ? "1" : "0"); } catch (e) {}
      });
    });
  }

  /* ----------------------------------------------------------------------
   * 10. 인덱스 페이지용 챕터 카드 렌더러
   * -------------------------------------------------------------------- */
  function renderChapterCards() {
    var host = $("#chapter-cards");
    if (!host) return;
    host.innerHTML = CHAPTERS.filter(function (c) { return c.id !== "00"; })
      .map(function (c) {
        return '<a class="chapcard" href="' + c.file + '">' +
          '<div class="chapcard__no">CHAPTER ' + c.id + "</div>" +
          '<div class="chapcard__t">' + esc(c.title) + "</div>" +
          '<p class="chapcard__d">' + esc(c.desc) + "</p>" +
          '<div class="chapcard__k">' + c.keys.map(function (k) { return "<span>" + esc(k) + "</span>"; }).join("") + "</div>" +
          "</a>";
      }).join("");
  }

  /* ----------------------------------------------------------------------
   * 11. 용어사전 검색
   * -------------------------------------------------------------------- */
  function initGlossarySearch() {
    var input = $("#gsearch");
    if (!input) return;
    var items = $$(".gitem");
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (it) {
        var hit = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
        it.style.display = hit ? "" : "none";
        if (hit) shown++;
      });
      $$(".gsection").forEach(function (sec) {
        var any = $$(".gitem", sec).some(function (i) { return i.style.display !== "none"; });
        sec.style.display = any ? "" : "none";
      });
      var c = $("#gcount");
      if (c) c.textContent = shown + "개 용어";
    });
  }

  /* ----------------------------------------------------------------------
   * boot
   * -------------------------------------------------------------------- */
  function boot() {
    applyTheme(currentTheme());
    buildChrome();
    renderChapterCards();
    buildToc();
    fixTooltips();
    initCopy();
    initHighlight();
    initMermaid();
    initPlaygrounds();
    initChecklist();
    initGlossarySearch();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
