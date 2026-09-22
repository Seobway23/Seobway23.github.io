import{H as m,j as P,t as N,x as T}from"./app-Bz9uDI7Z.js";let A=!1;function O(){A||(m.registerLanguage("javascript",P),m.registerLanguage("typescript",N),m.registerLanguage("xml",T),m.configure({ignoreUnescapedHTML:!0}),A=!0)}const U={react:"javascript",ts:"typescript",js:"javascript",html:"xml"};function H(e){O(),delete e.dataset.highlighted;try{m.highlightElement(e)}catch{}}const x="18.3.1",k="https://esm.sh",I="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js";function B(e){const t=String(e||"").split(/\r?\n/);let o="react",i="",l=300;if(/^\s*(#!|%%)/.test(t[0]||"")){const c=t[0].replace(/^\s*(#!|%%)\s*/,"");t.shift();const b=c.match(/\b(react|ts|js|html)\b/);b&&(o=b[1]);const f=c.match(/title=("([^"]*)"|(\S+))/);f&&(i=(f[2]??f[3]??"").trim());const p=c.match(/height=(\d+)/);p&&(l=Math.max(140,Math.min(720,Number(p[1]))))}return{kind:o,title:i||{react:"App.jsx",ts:"App.tsx",js:"main.js",html:"index.html"}[o],height:l,code:t.join(`
`).replace(/^\n+|\n+$/g,"")}}const D=JSON.stringify({imports:{react:`${k}/react@${x}`,"react/":`${k}/react@${x}/`,"react-dom":`${k}/react-dom@${x}`,"react-dom/":`${k}/react-dom@${x}/`}});function J(e){const t=e?{fg:"#e5e7eb",border:"#3f4757",btn:"#1f2633",field:"#151a24",link:"#8fa7ff",err:"#fca5a5",track:"#141a24",thumb:"#3a4356",thumbHover:"#566078"}:{fg:"#1f2937",border:"#d1d5db",btn:"#f3f4f6",field:"#ffffff",link:"#3b5bdb",err:"#dc2626",track:"#eef1f5",thumb:"#c3cad6",thumbHover:"#a4adbd"};return`
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:14px/1.6 Pretendard,system-ui,-apple-system,sans-serif;padding:14px;color:${t.fg};background:transparent}
button{font:inherit;padding:6px 12px;border-radius:8px;border:1px solid ${t.border};background:${t.btn};color:${t.fg};cursor:pointer}
button:hover{border-color:#6c8cff}
input,select,textarea{font:inherit;padding:6px 8px;border-radius:8px;border:1px solid ${t.border};background:${t.field};color:${t.fg}}
a{color:${t.link}}
#__err{white-space:pre-wrap;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:${t.err}}

/* iframe 은 별도 문서라 부모의 스크롤바 스타일이 안 닿는다.
   그냥 두면 결과 패널에만 OS 기본 스크롤바가 튀어나와 편집기 쪽과 따로 논다. */
*::-webkit-scrollbar{width:10px;height:10px}
*::-webkit-scrollbar-track{background:${t.track};border-radius:8px}
*::-webkit-scrollbar-thumb{background:${t.thumb};border-radius:8px;border:2px solid ${t.track};background-clip:padding-box}
*::-webkit-scrollbar-thumb:hover{background:${t.thumbHover};background-clip:padding-box}
*::-webkit-scrollbar-corner{background:transparent}
*{scrollbar-width:thin;scrollbar-color:${t.thumb} ${t.track}}
`}const G=()=>typeof document<"u"&&document.documentElement.classList.contains("dark"),M=`
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

  // 이 코드가 화면에 뭔가를 그렸는지 부모에게 알린다.
  // 부모는 이 신호로 렌더 칸을 펴거나 접는다 — 콘솔만 쓰는 예제에 빈 검은 칸을
  // 300px 씩 남기지 않기 위해서다. kind(js/react)로 미리 정하지 않는 이유는,
  // js 예제도 DOM 을 그릴 수 있고 react 예제도 콘솔만 쓸 수 있기 때문이다.
  var lastPainted = null;
  var reportPaint = function(){
    var painted = false;
    var nodes = document.body ? document.body.children : [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.id === '__err') { painted = painted || n.textContent.trim().length > 0; continue; }
      if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE') continue;
      if (n.id === 'root') { painted = painted || n.children.length > 0 || n.textContent.trim().length > 0; continue; }
      painted = true;
    }
    if (painted === lastPainted) return;
    lastPainted = painted;
    try { parent.postMessage({ __pg: true, paint: painted }, '*'); } catch (e) {}
  };

  var tick = null;
  var schedule = function(){
    if (tick) return;
    tick = setTimeout(function(){ tick = null; reportPaint(); }, 60);
  };

  if (document.body) {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
      schedule();
    });
  }
  // 비동기로 그리는 예제(setTimeout·fetch)도 잡히게 잠깐 더 본다
  [0, 120, 400, 1200].forEach(function(ms){ setTimeout(reportPaint, ms); });
})();
`,q=`
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
`,W=`
(function(){
  var raw = window.__PG_SRC || '';
  var blob = new Blob([raw], { type: 'text/javascript' });
  var s = document.createElement('script');
  s.type = 'module';
  s.src = URL.createObjectURL(blob);
  s.onerror = function(){ document.getElementById('__err').textContent = '실행 실패'; };
  document.body.appendChild(s);
})();
`;function F(e,t,o){const i=J(o);if(e.kind==="html")return`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>${i}</style>
<script>${M}<\/script>
</head><body>${t}<pre id="__err"></pre></body></html>`;const l=e.kind==="react"||e.kind==="ts",u=l?q:W,c=JSON.stringify(t).replace(/</g,"\\u003c");return`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>${i}</style>
<script type="importmap">${D}<\/script>
<script>${M}<\/script>
<script>window.__PG_SRC = ${c};<\/script>
${l?`<script src="${I}"><\/script>`:""}
</head><body>
<div id="root"></div>
<pre id="__err"></pre>
<script>${u}<\/script>
</body></html>`}function r(e,t,o){const i=document.createElement(e);return t&&(i.className=t),o!==void 0&&(i.textContent=o),i}function K(e){const t=r("div","post-pg"),o=r("div","post-pg__bar");o.appendChild(r("span","post-pg__file",e.title));const i=r("span","post-pg__kind",e.kind);o.appendChild(i);const l=r("div","post-pg__actions"),u=r("button","post-pg__btn post-pg__btn--run","▶ 실행");u.type="button",u.title="Ctrl+Enter";const c=r("button","post-pg__btn","↺ 되돌리기");c.type="button",l.append(u,c),o.appendChild(l),t.appendChild(o);const b=r("div","post-pg__body"),f=r("div","post-pg__editor"),p=r("pre","post-pg__hl");p.setAttribute("aria-hidden","true");const _=r("code");p.appendChild(_);const n=r("textarea","post-pg__code");n.value=e.code,n.spellcheck=!1,n.setAttribute("aria-label",`${e.title} 편집기`),f.append(p,n);const E=()=>{const a=n.value.endsWith(`
`)?`${n.value} `:n.value;_.className=`hljs language-${U[e.kind]}`,_.textContent=a,H(_)},C=()=>{p.scrollTop=n.scrollTop,p.scrollLeft=n.scrollLeft};n.addEventListener("input",()=>{E(),C()}),n.addEventListener("scroll",C),E();const v=r("div","post-pg__preview"),d=r("iframe");d.className="post-pg__frame",d.setAttribute("sandbox","allow-scripts allow-popups allow-modals"),d.setAttribute("title",`${e.title} 실행 결과`),d.style.height=`${e.height}px`,v.appendChild(d);const L=a=>{v.classList.toggle("post-pg__preview--console-only",!a),d.style.height=a?`${e.height}px`:"0px",d.setAttribute("aria-hidden",a?"false":"true")};L(!1);const R=r("div","post-pg__console"),$=r("div","post-pg__console-head");$.appendChild(r("span",void 0,"콘솔"));const w=r("button","post-pg__btn post-pg__btn--ghost","지우기");w.type="button",$.appendChild(w);const g=r("div","post-pg__console-out");R.append($,g),v.appendChild(R),b.append(f,v),t.appendChild(b);let S=!1;const y=()=>{S=!0,g.replaceChildren(),d.srcdoc=F(e,n.value,G())};u.addEventListener("click",y),c.addEventListener("click",()=>{n.value=e.code,y()}),w.addEventListener("click",()=>g.replaceChildren()),n.addEventListener("keydown",a=>{if(a.key==="Tab"){a.preventDefault();const s=n.selectionStart,h=n.selectionEnd;n.value=`${n.value.slice(0,s)}  ${n.value.slice(h)}`,n.selectionStart=n.selectionEnd=s+2}else a.key==="Enter"&&(a.ctrlKey||a.metaKey)&&(a.preventDefault(),y())}),window.addEventListener("message",a=>{const s=a.data;if(!s||s.__pg!==!0||a.source!==d.contentWindow)return;if(typeof s.paint=="boolean"){L(s.paint);return}const h=r("div",`post-pg__line post-pg__line--${s.level}`,s.text);g.appendChild(h),g.scrollTop=g.scrollHeight});const j=()=>{S||y()};if(typeof IntersectionObserver<"u"){const a=new IntersectionObserver(s=>{for(const h of s)h.isIntersecting&&(j(),a.disconnect())},{rootMargin:"200px"});a.observe(t)}else j();return t}function V(e){e&&(e.querySelectorAll(".post-pg").forEach(t=>t.remove()),e.querySelectorAll("pre[data-pg-rendered]").forEach(t=>{t.style.display="",delete t.dataset.pgRendered}),e.querySelectorAll("code.language-playground").forEach(t=>{const o=t.closest("pre");if(!o||o.dataset.pgRendered)return;const i=B(t.textContent||"");o.style.display="none",o.dataset.pgRendered="true",o.insertAdjacentElement("afterend",K(i))}))}export{V as hydratePlaygrounds};
