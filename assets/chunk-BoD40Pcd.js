const H={"event-loop":`title: 이벤트 루프 한 바퀴
speed: 1400
caption: 동기 코드 → 마이크로태스크 → 매크로태스크 순서로 비워진다.

lane stack  콜 스택 #stack
lane webapi Web API
lane micro  마이크로태스크 큐 #queue
lane macro  태스크 큐 #queue
lane out    콘솔 #log

step 스크립트가 실행되며 main()이 콜 스택에 올라간다.
  push stack main()
step console.log('A') 가 스택에 쌓이고 즉시 실행된다.
  push stack log('A')
  log out A
  pop stack
step setTimeout 은 콜백을 브라우저(Web API)에 맡기고 바로 반환한다.
  push stack setTimeout
  move stack webapi cb: 0ms 타이머
step Promise.then 의 콜백은 마이크로태스크 큐로 예약된다.
  push stack Promise.then
  move stack micro then-cb
step 타이머가 끝나 콜백이 태스크 큐로 넘어간다.
  move webapi macro cb
step main() 이 끝나 콜 스택이 완전히 빈다.
  pop stack
step 스택이 비면 이벤트 루프는 마이크로태스크 큐부터 전부 비운다.
  move micro stack then-cb
  log out then
  pop stack
step 그 다음에야 태스크 큐에서 하나를 꺼낸다.
  move macro stack cb
  log out timeout
  pop stack
step 큐가 모두 비었다. 다음 틱을 기다린다.
  mark out`,"http-request":`title: 브라우저가 페이지를 받아오기까지
speed: 1300
caption: 주소창 입력 한 번에 일어나는 왕복.

lane browser 브라우저
lane dns     DNS
lane server  서버
lane out     화면 #log

step 주소를 입력하면 브라우저가 도메인을 IP로 바꿔야 한다.
  push browser example.com
step DNS 에 질의한다.
  move browser dns 질의
step IP 주소를 돌려받는다.
  move dns browser 93.184.216.34
step 그 IP로 TCP 연결을 맺고 HTTP 요청을 보낸다.
  move browser server GET /
step 서버가 HTML 을 만들어 응답한다.
  move server browser 200 OK · HTML
step 브라우저가 HTML 을 파싱해 화면을 그린다.
  pop browser
  log out 페이지 렌더 완료`};function Q(t){const e=String(t||"").split(/\r?\n/),s=e.find(k=>/^\s*preset\s*:/.test(k));if(!s)return{lines:e,error:null};const c=s.split(":").slice(1).join(":").trim(),o=H[c];return o?{lines:o.split(/\r?\n/).concat(e.filter(k=>k!==s)),error:null}:{lines:e,error:`preset "${c}" 없음 (있는 것: ${Object.keys(H).join(", ")})`}}const G=["stack","queue","log"];function K(t){const e={title:"",caption:"",speed:1200,lanes:[],steps:[],errors:[]},{lines:s,error:c}=Q(t);c&&e.errors.push(c);let o=null;for(const v of s){const b=v.replace(/\r$/,"").trim();if(!b||b.startsWith("#")||b.startsWith("//"))continue;const f=b.match(/^(title|caption|speed)\s*:\s*(.*)$/);if(f){if(f[1]==="speed"){const n=Number(f[2]);Number.isFinite(n)&&n>=200&&(e.speed=n)}else f[1]==="title"?e.title=f[2].trim():e.caption=f[2].trim();continue}if(/^preset\s*:/.test(b))continue;const _=b.match(/^lane\s+([A-Za-z0-9_-]+)\s+(.+)$/);if(_){let n=_[2].trim(),$="queue";const E=n.match(/#([A-Za-z]+)\s*$/);if(E){const z=E[1].toLowerCase();G.includes(z)&&($=z),n=n.slice(0,E.index).trim()}e.lanes.push({id:_[1],label:n,kind:$});continue}const l=b.match(/^step\s*(.*)$/);if(l){o={say:l[1].trim(),ops:[]},e.steps.push(o);continue}const p=F(b,e);p&&(o||(o={say:"",ops:[]},e.steps.push(o)),o.ops.push(p))}const k=new Set(e.lanes.map(v=>v.id));for(const v of e.steps)for(const g of v.ops){const b=g.op==="move"?[g.from,g.to]:[g.lane];for(const f of b)k.has(f)||e.errors.push(`lane "${f}" 가 정의되지 않음`)}return e.lanes.length===0&&e.errors.push("lane 이 하나도 없다"),e.steps.length===0&&e.errors.push("step 이 하나도 없다"),e}function F(t,e){let s=t.match(/^push\s+([A-Za-z0-9_-]+)\s+(.+)$/);return s?{op:"push",lane:s[1],label:s[2].trim()}:(s=t.match(/^pop\s+([A-Za-z0-9_-]+)\s*$/),s?{op:"pop",lane:s[1]}:(s=t.match(/^move\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)\s*(.*)$/),s?{op:"move",from:s[1],to:s[2],label:s[3].trim()||void 0}:(s=t.match(/^log\s+([A-Za-z0-9_-]+)\s+(.+)$/),s?{op:"log",lane:s[1],text:s[2].trim()}:(s=t.match(/^mark\s+([A-Za-z0-9_-]+)\s*$/),s?{op:"mark",lane:s[1]}:(s=t.match(/^clear\s+([A-Za-z0-9_-]+)\s*$/),s?{op:"clear",lane:s[1]}:(e.errors.push(`알 수 없는 줄: ${t}`),null))))))}function W(t,e){var b,f,_;const s=new Map,c=new Map;for(const l of t.lanes)s.set(l.id,[]),c.set(l.id,[]);const o={tokens:s,logs:c,marks:new Set,moved:[]};let k=1;const v=l=>{var p;return((p=t.lanes.find(n=>n.id===l))==null?void 0:p.kind)??"queue"},g=l=>{const p=s.get(l);if(!(!p||p.length===0))return v(l)==="stack"?p.pop():p.shift()};for(let l=0;l<=e&&l<t.steps.length;l++){const p=l===e;for(const n of t.steps[l].ops)switch(n.op){case"push":{(b=s.get(n.lane))==null||b.push({id:k++,label:n.label}),p&&o.marks.add(n.lane);break}case"pop":{g(n.lane),p&&o.marks.add(n.lane);break}case"move":{const $=g(n.from),E=$?{id:$.id,label:n.label||$.label}:{id:k++,label:n.label||"?"};(f=s.get(n.to))==null||f.push(E),p&&(o.marks.add(n.to),o.moved.push({from:n.from,to:n.to}));break}case"log":{(_=c.get(n.lane))==null||_.push(n.text),p&&o.marks.add(n.lane);break}case"mark":{p&&o.marks.add(n.lane);break}case"clear":{s.set(n.lane,[]),c.set(n.lane,[]),p&&o.marks.add(n.lane);break}}}return o}const Y=()=>{var t;return typeof window<"u"&&((t=window.matchMedia)==null?void 0:t.call(window,"(prefers-reduced-motion: reduce)").matches)===!0};function u(t,e,s){const c=document.createElement(t);return e&&(c.className=e),s!==void 0&&(c.textContent=s),c}function J(t){const e=u("figure","post-seq");e.tabIndex=0,e.setAttribute("role","group"),e.setAttribute("aria-label",t.title||"인터랙티브 시퀀스");const s=u("div","post-seq__head");s.appendChild(u("span","post-seq__title",t.title||"시퀀스"));const c=u("div","post-seq__ctrl"),o=(a,r)=>{const m=u("button","post-seq__btn",a);return m.type="button",m.setAttribute("aria-label",r),m},k=o("↺","처음으로"),v=o("‹","이전 단계"),g=o("▶","재생"),b=o("›","다음 단계");c.append(k,v,g,b),s.appendChild(c),e.appendChild(s);const f=u("div","post-seq__stage");f.style.setProperty("--seq-lanes",String(t.lanes.length));const _=new Map;for(const a of t.lanes){const r=u("div",`post-seq__lane post-seq__lane--${a.kind}`);r.dataset.lane=a.id,r.appendChild(u("div","post-seq__lane-label",a.label));const m=u("div","post-seq__slot");r.appendChild(m),f.appendChild(r),_.set(a.id,{lane:r,slot:m})}const l=document.createElementNS("http://www.w3.org/2000/svg","svg");l.setAttribute("class","post-seq__arrows"),l.setAttribute("aria-hidden","true"),f.appendChild(l),e.appendChild(f);const p=u("div","post-seq__narr"),n=u("span","post-seq__stepno"),$=u("p","post-seq__say");p.append(n,$),e.appendChild(p);const E=u("ol","post-seq__dots"),z=[];if(t.steps.forEach((a,r)=>{const m=u("li"),w=u("button","post-seq__dot");w.type="button",w.title=`${r+1}. ${a.say}`,w.setAttribute("aria-label",`${r+1}단계로 이동`),w.addEventListener("click",()=>{q(),Z(r)}),m.appendChild(w),E.appendChild(m),z.push(w)}),e.appendChild(E),t.caption){const a=u("figcaption","post-seq__caption",t.caption);e.appendChild(a)}if(t.errors.length>0){const a=u("div","post-seq__errors",`⚠ ${t.errors.slice(0,4).join(" · ")}`);e.appendChild(a)}const P=new Map;let h=-1,L=null;const N=a=>{const r=W(t,h),m=new Map;a&&!Y()&&P.forEach((i,d)=>m.set(d,i.getBoundingClientRect()));const w=new Set;for(const i of t.lanes){const d=_.get(i.id);if(!d)continue;const{lane:y,slot:A}=d;if(y.classList.toggle("is-marked",r.marks.has(i.id)),i.kind==="log"){A.textContent="";for(const S of r.logs.get(i.id)||[])A.appendChild(u("div","post-seq__logline",S));continue}const C=r.tokens.get(i.id)||[],x=i.kind==="stack"?[...C].reverse():C,I=[];for(const S of x){w.add(S.id);let M=P.get(S.id);M||(M=u("div","post-seq__token"),P.set(S.id,M)),M.textContent=S.label,I.push(M)}A.replaceChildren(...I)}P.forEach((i,d)=>{w.has(d)||(i.remove(),P.delete(d))}),m.size>0&&P.forEach((i,d)=>{const y=m.get(d);if(!y){i.animate([{opacity:0,transform:"translateY(-6px) scale(0.9)"},{opacity:1,transform:"none"}],{duration:220,easing:"ease-out"});return}const A=i.getBoundingClientRect(),C=y.left-A.left,x=y.top-A.top;Math.abs(C)<1&&Math.abs(x)<1||i.animate([{transform:`translate(${C}px, ${x}px)`},{transform:"none"}],{duration:420,easing:"cubic-bezier(.2,.7,.2,1)"})}),D(r);const R=t.steps.length;n.textContent=h<0?`0 / ${R}`:`${h+1} / ${R}`,$.textContent=h<0?"재생을 누르거나 → 키를 눌러 시작한다.":t.steps[h].say,z.forEach((i,d)=>{i.classList.toggle("is-done",d<=h),i.classList.toggle("is-current",d===h)}),v.disabled=h<0,b.disabled=h>=R-1},D=a=>{var m,w;if(l.replaceChildren(),a.moved.length===0)return;const r=f.getBoundingClientRect();l.setAttribute("viewBox",`0 0 ${r.width} ${r.height}`);for(const R of a.moved){const i=(m=_.get(R.from))==null?void 0:m.lane.getBoundingClientRect(),d=(w=_.get(R.to))==null?void 0:w.lane.getBoundingClientRect();if(!i||!d)continue;const y=i.left+i.width/2-r.left,A=i.top+i.height/2-r.top,C=d.left+d.width/2-r.left,x=d.top+d.height/2-r.top,I=Math.abs(i.top-d.top)<8,S=I?(y+C)/2:(y+C)/2+(C>=y?1:-1)*Math.min(60,i.width*.5),M=I?Math.min(A,x)-Math.min(56,i.height*.45+16):(A+x)/2,B=document.createElementNS("http://www.w3.org/2000/svg","path");B.setAttribute("d",`M ${y} ${A} Q ${S} ${M} ${C} ${x}`),B.setAttribute("class","post-seq__arrow"),l.appendChild(B)}},Z=a=>{const r=Math.max(-1,Math.min(t.steps.length-1,a));r!==h&&(h=r,N(!0))},T=()=>{if(h>=t.steps.length-1){q();return}Z(h+1)},O=()=>Z(h-1),q=()=>{L!==null&&(window.clearInterval(L),L=null),g.textContent="▶",g.setAttribute("aria-label","재생"),e.classList.remove("is-playing")},j=()=>{L===null&&(h>=t.steps.length-1&&(h=-1,N(!1)),g.textContent="❚❚",g.setAttribute("aria-label","일시정지"),e.classList.add("is-playing"),L=window.setInterval(T,t.speed),T())};return g.addEventListener("click",()=>L===null?j():q()),b.addEventListener("click",()=>{q(),T()}),v.addEventListener("click",()=>{q(),O()}),k.addEventListener("click",()=>{q(),h=-1,N(!0)}),e.addEventListener("keydown",a=>{a.key==="ArrowRight"?(a.preventDefault(),q(),T()):a.key==="ArrowLeft"?(a.preventDefault(),q(),O()):(a.key===" "||a.key==="Spacebar")&&(a.preventDefault(),L===null?j():q())}),typeof IntersectionObserver<"u"&&new IntersectionObserver(r=>{for(const m of r)m.isIntersecting||q()},{threshold:0}).observe(e),window.addEventListener("resize",()=>D(W(t,h))),N(!1),e}const U=["seq","sequence"];function V(t){if(t){t.querySelectorAll(".post-seq").forEach(e=>e.remove()),t.querySelectorAll("pre[data-seq-rendered]").forEach(e=>{e.style.display="",delete e.dataset.seqRendered});for(const e of U)t.querySelectorAll(`code.language-${e}`).forEach(c=>{const o=c.closest("pre");if(!o||o.dataset.seqRendered)return;const k=K(c.textContent||""),v=J(k);o.style.display="none",o.dataset.seqRendered="true",o.insertAdjacentElement("afterend",v)})}}export{V as hydrateSequences};
