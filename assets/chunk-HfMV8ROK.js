import{H as m,j as M,t as N,x as O}from"./app-BrYeR-ey.js";let A=!1;function P(){A||(m.registerLanguage("javascript",M),m.registerLanguage("typescript",N),m.registerLanguage("xml",O),m.configure({ignoreUnescapedHTML:!0}),A=!0)}const T={react:"javascript",ts:"typescript",js:"javascript",html:"xml"};function U(e){P(),delete e.dataset.highlighted;try{m.highlightElement(e)}catch{}}const v="18.3.1",x="https://esm.sh",H="https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js";function B(e){const t=String(e||"").split(/\r?\n/);let o="react",s="",l=300;if(/^\s*(#!|%%)/.test(t[0]||"")){const i=t[0].replace(/^\s*(#!|%%)\s*/,"");t.shift();const b=i.match(/\b(react|ts|js|html)\b/);b&&(o=b[1]);const f=i.match(/title=("([^"]*)"|(\S+))/);f&&(s=(f[2]??f[3]??"").trim());const d=i.match(/height=(\d+)/);d&&(l=Math.max(140,Math.min(720,Number(d[1]))))}return{kind:o,title:s||{react:"App.jsx",ts:"App.tsx",js:"main.js",html:"index.html"}[o],height:l,code:t.join(`
`).replace(/^\n+|\n+$/g,"")}}const I=JSON.stringify({imports:{react:`${x}/react@${v}`,"react/":`${x}/react@${v}/`,"react-dom":`${x}/react-dom@${v}`,"react-dom/":`${x}/react-dom@${v}/`}});function D(e){const t=e?{fg:"#e5e7eb",border:"#3f4757",btn:"#1f2633",field:"#151a24",link:"#8fa7ff",err:"#fca5a5",track:"#141a24",thumb:"#3a4356",thumbHover:"#566078"}:{fg:"#1f2937",border:"#d1d5db",btn:"#f3f4f6",field:"#ffffff",link:"#3b5bdb",err:"#dc2626",track:"#eef1f5",thumb:"#c3cad6",thumbHover:"#a4adbd"};return`
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
`}const J=()=>typeof document<"u"&&document.documentElement.classList.contains("dark"),j=`
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
`,G=`
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
`,q=`
(function(){
  var raw = window.__PG_SRC || '';
  var blob = new Blob([raw], { type: 'text/javascript' });
  var s = document.createElement('script');
  s.type = 'module';
  s.src = URL.createObjectURL(blob);
  s.onerror = function(){ document.getElementById('__err').textContent = '실행 실패'; };
  document.body.appendChild(s);
})();
`;function W(e,t,o){const s=D(o);if(e.kind==="html")return`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>${s}</style>
<script>${j}<\/script>
</head><body>${t}<pre id="__err"></pre></body></html>`;const l=e.kind==="react"||e.kind==="ts",p=l?G:q,i=JSON.stringify(t).replace(/</g,"\\u003c");return`<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>${s}</style>
<script type="importmap">${I}<\/script>
<script>${j}<\/script>
<script>window.__PG_SRC = ${i};<\/script>
${l?`<script src="${H}"><\/script>`:""}
</head><body>
<div id="root"></div>
<pre id="__err"></pre>
<script>${p}<\/script>
</body></html>`}function n(e,t,o){const s=document.createElement(e);return t&&(s.className=t),o!==void 0&&(s.textContent=o),s}function F(e){const t=n("div","post-pg"),o=n("div","post-pg__bar");o.appendChild(n("span","post-pg__file",e.title));const s=n("span","post-pg__kind",e.kind);o.appendChild(s);const l=n("div","post-pg__actions"),p=n("button","post-pg__btn post-pg__btn--run","▶ 실행");p.type="button",p.title="Ctrl+Enter";const i=n("button","post-pg__btn","↺ 되돌리기");i.type="button",l.append(p,i),o.appendChild(l),t.appendChild(o);const b=n("div","post-pg__body"),f=n("div","post-pg__editor"),d=n("pre","post-pg__hl");d.setAttribute("aria-hidden","true");const _=n("code");d.appendChild(_);const r=n("textarea","post-pg__code");r.value=e.code,r.spellcheck=!1,r.setAttribute("aria-label",`${e.title} 편집기`),f.append(d,r);const E=()=>{const a=r.value.endsWith(`
`)?`${r.value} `:r.value;_.className=`hljs language-${T[e.kind]}`,_.textContent=a,U(_)},C=()=>{d.scrollTop=r.scrollTop,d.scrollLeft=r.scrollLeft};r.addEventListener("input",()=>{E(),C()}),r.addEventListener("scroll",C),E();const k=n("div","post-pg__preview"),u=n("iframe");u.className="post-pg__frame",u.setAttribute("sandbox","allow-scripts allow-popups allow-modals"),u.setAttribute("title",`${e.title} 실행 결과`),u.style.height=`${e.height}px`,k.appendChild(u);const L=n("div","post-pg__console"),$=n("div","post-pg__console-head");$.appendChild(n("span",void 0,"콘솔"));const w=n("button","post-pg__btn post-pg__btn--ghost","지우기");w.type="button",$.appendChild(w);const g=n("div","post-pg__console-out");L.append($,g),k.appendChild(L),b.append(f,k),t.appendChild(b);let R=!1;const y=()=>{R=!0,g.replaceChildren(),u.srcdoc=W(e,r.value,J())};p.addEventListener("click",y),i.addEventListener("click",()=>{r.value=e.code,y()}),w.addEventListener("click",()=>g.replaceChildren()),r.addEventListener("keydown",a=>{if(a.key==="Tab"){a.preventDefault();const c=r.selectionStart,h=r.selectionEnd;r.value=`${r.value.slice(0,c)}  ${r.value.slice(h)}`,r.selectionStart=r.selectionEnd=c+2}else a.key==="Enter"&&(a.ctrlKey||a.metaKey)&&(a.preventDefault(),y())}),window.addEventListener("message",a=>{const c=a.data;if(!c||c.__pg!==!0||a.source!==u.contentWindow)return;const h=n("div",`post-pg__line post-pg__line--${c.level}`,c.text);g.appendChild(h),g.scrollTop=g.scrollHeight});const S=()=>{R||y()};if(typeof IntersectionObserver<"u"){const a=new IntersectionObserver(c=>{for(const h of c)h.isIntersecting&&(S(),a.disconnect())},{rootMargin:"200px"});a.observe(t)}else S();return t}function z(e){e&&(e.querySelectorAll(".post-pg").forEach(t=>t.remove()),e.querySelectorAll("pre[data-pg-rendered]").forEach(t=>{t.style.display="",delete t.dataset.pgRendered}),e.querySelectorAll("code.language-playground").forEach(t=>{const o=t.closest("pre");if(!o||o.dataset.pgRendered)return;const s=B(t.textContent||"");o.style.display="none",o.dataset.pgRendered="true",o.insertAdjacentElement("afterend",F(s))}))}export{z as hydratePlaygrounds};
