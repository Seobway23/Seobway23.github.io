/**
 * 본문 인터랙티브 시퀀스 — ```seq 펜스
 *
 * 코드를 치는 게 아니라 "무엇이 어디로 가는지"만 줄 단위로 적으면
 * 재생·이전·다음이 붙은 애니메이션이 된다. 이벤트 루프, 요청 흐름,
 * 큐/스택이 오가는 개념 전부 같은 문법으로 그린다.
 *
 *   ```seq
 *   title: 이벤트 루프 한 바퀴
 *   speed: 1200
 *
 *   lane stack  콜 스택        #stack
 *   lane webapi Web API
 *   lane macro  태스크 큐       #queue
 *   lane out    콘솔            #log
 *
 *   step 동기 코드가 콜 스택에 쌓인다
 *     push stack log('A')
 *   step 출력하고 스택에서 빠진다
 *     log out A
 *     pop stack
 *   ```
 *
 * 명령:
 *   title: …            제목
 *   speed: 1000         자동 재생 간격(ms)
 *   caption: …          그림 아래 캡션
 *   preset: event-loop  내장 예제로 시작(뒤에 줄을 더 쓰면 덮어씀)
 *   lane <id> <라벨> [#stack|#queue|#log]
 *   step <설명>         한 장면. 아래 줄들이 이 장면에서 일어나는 일.
 *     push <lane> <라벨>
 *     pop <lane>
 *     move <from> <to> [새 라벨]
 *     log <lane> <텍스트>
 *     mark <lane>
 *     clear <lane>
 *
 * 상태는 매 프레임 0..n 스텝을 다시 재생해서 만든다(되감기가 공짜다).
 * 토큰은 push 때 받은 id를 move 해도 유지하므로 FLIP으로 날아가는 연출이 된다.
 */

type LaneKind = "stack" | "queue" | "log";

interface Lane {
  id: string;
  label: string;
  kind: LaneKind;
}

type Op =
  | { op: "push"; lane: string; label: string }
  | { op: "pop"; lane: string }
  | { op: "move"; from: string; to: string; label?: string }
  | { op: "log"; lane: string; text: string }
  | { op: "mark"; lane: string }
  | { op: "clear"; lane: string };

interface Step {
  say: string;
  ops: Op[];
}

interface SeqSpec {
  title: string;
  caption: string;
  speed: number;
  lanes: Lane[];
  steps: Step[];
  errors: string[];
}

interface Token {
  id: number;
  label: string;
}

interface SeqState {
  tokens: Map<string, Token[]>;
  logs: Map<string, string[]>;
  marks: Set<string>;
  moved: { from: string; to: string }[];
}

/* ── 내장 예제 ─────────────────────────────────────────────── */

// 사양은 shared/seq-presets.mjs 한 곳에만 둔다 — 프리렌더(scripts/prerender.mjs)도
// 같은 파일을 읽어 preset 만 적힌 글에서 step 설명을 꺼낸다.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- 순수 JS 공유 모듈(타입 선언 없음)
import { SEQ_PRESETS, expandSeqPreset } from "../../shared/seq-presets.mjs";

const PRESETS: Record<string, string> = SEQ_PRESETS;


/* ── 파서 ─────────────────────────────────────────────────── */

const LANE_KINDS: LaneKind[] = ["stack", "queue", "log"];

function parseSeq(source: string): SeqSpec {
  const spec: SeqSpec = {
    title: "",
    caption: "",
    speed: 1200,
    lanes: [],
    steps: [],
    errors: [],
  };

  // preset: 을 먼저 펼치고, 사용자가 쓴 줄을 뒤에 이어 붙인다(뒤가 이긴다).
  const { lines, error } = expandSeqPreset(source) as {
    lines: string[];
    error: string | null;
  };
  if (error) spec.errors.push(error);

  let cur: Step | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("//")) continue;

    const meta = t.match(/^(title|caption|speed)\s*:\s*(.*)$/);
    if (meta) {
      if (meta[1] === "speed") {
        const n = Number(meta[2]);
        if (Number.isFinite(n) && n >= 200) spec.speed = n;
      } else if (meta[1] === "title") spec.title = meta[2].trim();
      else spec.caption = meta[2].trim();
      continue;
    }
    if (/^preset\s*:/.test(t)) continue;

    const lane = t.match(/^lane\s+([A-Za-z0-9_-]+)\s+(.+)$/);
    if (lane) {
      let label = lane[2].trim();
      let kind: LaneKind = "queue";
      const kindMatch = label.match(/#([A-Za-z]+)\s*$/);
      if (kindMatch) {
        const k = kindMatch[1].toLowerCase() as LaneKind;
        if (LANE_KINDS.includes(k)) kind = k;
        label = label.slice(0, kindMatch.index).trim();
      }
      spec.lanes.push({ id: lane[1], label, kind });
      continue;
    }

    const step = t.match(/^step\s*(.*)$/);
    if (step) {
      cur = { say: step[1].trim(), ops: [] };
      spec.steps.push(cur);
      continue;
    }

    const op = parseOp(t, spec);
    if (!op) continue;
    if (!cur) {
      cur = { say: "", ops: [] };
      spec.steps.push(cur);
    }
    cur.ops.push(op);
  }

  const laneIds = new Set(spec.lanes.map((l) => l.id));
  for (const s of spec.steps) {
    for (const o of s.ops) {
      const used = o.op === "move" ? [o.from, o.to] : [o.lane];
      for (const id of used) {
        if (!laneIds.has(id)) spec.errors.push(`lane "${id}" 가 정의되지 않음`);
      }
    }
  }
  if (spec.lanes.length === 0) spec.errors.push("lane 이 하나도 없다");
  if (spec.steps.length === 0) spec.errors.push("step 이 하나도 없다");

  return spec;
}

function parseOp(t: string, spec: SeqSpec): Op | null {
  let m = t.match(/^push\s+([A-Za-z0-9_-]+)\s+(.+)$/);
  if (m) return { op: "push", lane: m[1], label: m[2].trim() };

  m = t.match(/^pop\s+([A-Za-z0-9_-]+)\s*$/);
  if (m) return { op: "pop", lane: m[1] };

  m = t.match(/^move\s+([A-Za-z0-9_-]+)\s+([A-Za-z0-9_-]+)\s*(.*)$/);
  if (m)
    return {
      op: "move",
      from: m[1],
      to: m[2],
      label: m[3].trim() || undefined,
    };

  m = t.match(/^log\s+([A-Za-z0-9_-]+)\s+(.+)$/);
  if (m) return { op: "log", lane: m[1], text: m[2].trim() };

  m = t.match(/^mark\s+([A-Za-z0-9_-]+)\s*$/);
  if (m) return { op: "mark", lane: m[1] };

  m = t.match(/^clear\s+([A-Za-z0-9_-]+)\s*$/);
  if (m) return { op: "clear", lane: m[1] };

  spec.errors.push(`알 수 없는 줄: ${t}`);
  return null;
}

/* ── 상태 재생 ─────────────────────────────────────────────── */

/** 0..stepIndex 까지 재생한 결과. stepIndex = -1 이면 시작 전 상태. */
function replay(spec: SeqSpec, stepIndex: number): SeqState {
  const tokens = new Map<string, Token[]>();
  const logs = new Map<string, string[]>();
  for (const l of spec.lanes) {
    tokens.set(l.id, []);
    logs.set(l.id, []);
  }
  const state: SeqState = { tokens, logs, marks: new Set(), moved: [] };

  let nextTokenId = 1;
  const kindOf = (id: string) =>
    spec.lanes.find((l) => l.id === id)?.kind ?? "queue";

  /** stack 은 마지막(위)에서, queue 는 처음(앞)에서 꺼낸다. */
  const take = (laneId: string): Token | undefined => {
    const arr = tokens.get(laneId);
    if (!arr || arr.length === 0) return undefined;
    return kindOf(laneId) === "stack" ? arr.pop() : arr.shift();
  };

  for (let i = 0; i <= stepIndex && i < spec.steps.length; i++) {
    const isCurrent = i === stepIndex;
    for (const o of spec.steps[i].ops) {
      switch (o.op) {
        case "push": {
          tokens.get(o.lane)?.push({ id: nextTokenId++, label: o.label });
          if (isCurrent) state.marks.add(o.lane);
          break;
        }
        case "pop": {
          take(o.lane);
          if (isCurrent) state.marks.add(o.lane);
          break;
        }
        case "move": {
          const tok = take(o.from);
          const carried: Token = tok
            ? { id: tok.id, label: o.label || tok.label }
            : { id: nextTokenId++, label: o.label || "?" };
          tokens.get(o.to)?.push(carried);
          if (isCurrent) {
            state.marks.add(o.to);
            state.moved.push({ from: o.from, to: o.to });
          }
          break;
        }
        case "log": {
          logs.get(o.lane)?.push(o.text);
          if (isCurrent) state.marks.add(o.lane);
          break;
        }
        case "mark": {
          if (isCurrent) state.marks.add(o.lane);
          break;
        }
        case "clear": {
          tokens.set(o.lane, []);
          logs.set(o.lane, []);
          if (isCurrent) state.marks.add(o.lane);
          break;
        }
      }
    }
  }
  return state;
}

/* ── 렌더러 ───────────────────────────────────────────────── */

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

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

function buildPlayer(spec: SeqSpec): HTMLElement {
  const root = el("figure", "post-seq");
  root.tabIndex = 0;
  root.setAttribute("role", "group");
  root.setAttribute("aria-label", spec.title || "인터랙티브 시퀀스");

  /* 머리 — 제목 + 컨트롤 */
  const head = el("div", "post-seq__head");
  head.appendChild(el("span", "post-seq__title", spec.title || "시퀀스"));

  const ctrl = el("div", "post-seq__ctrl");
  const mkBtn = (label: string, aria: string) => {
    const b = el("button", "post-seq__btn", label);
    b.type = "button";
    b.setAttribute("aria-label", aria);
    return b;
  };
  const btnReset = mkBtn("↺", "처음으로");
  const btnPrev = mkBtn("‹", "이전 단계");
  const btnPlay = mkBtn("▶", "재생");
  const btnNext = mkBtn("›", "다음 단계");
  ctrl.append(btnReset, btnPrev, btnPlay, btnNext);
  head.appendChild(ctrl);
  root.appendChild(head);

  /* 무대 — 레인들 */
  const stage = el("div", "post-seq__stage");
  stage.style.setProperty("--seq-lanes", String(spec.lanes.length));
  const laneEls = new Map<string, { lane: HTMLElement; slot: HTMLElement }>();
  for (const l of spec.lanes) {
    const laneEl = el("div", `post-seq__lane post-seq__lane--${l.kind}`);
    laneEl.dataset.lane = l.id;
    laneEl.appendChild(el("div", "post-seq__lane-label", l.label));
    const slot = el("div", "post-seq__slot");
    laneEl.appendChild(slot);
    stage.appendChild(laneEl);
    laneEls.set(l.id, { lane: laneEl, slot });
  }
  const arrows = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  arrows.setAttribute("class", "post-seq__arrows");
  arrows.setAttribute("aria-hidden", "true");
  stage.appendChild(arrows);
  root.appendChild(stage);

  /* 해설 */
  const narr = el("div", "post-seq__narr");
  const stepNo = el("span", "post-seq__stepno");
  const say = el("p", "post-seq__say");
  narr.append(stepNo, say);
  root.appendChild(narr);

  /* 진행 점 */
  const dots = el("ol", "post-seq__dots");
  const dotEls: HTMLButtonElement[] = [];
  spec.steps.forEach((s, i) => {
    const li = el("li");
    const b = el("button", "post-seq__dot");
    b.type = "button";
    b.title = `${i + 1}. ${s.say}`;
    b.setAttribute("aria-label", `${i + 1}단계로 이동`);
    b.addEventListener("click", () => {
      pause();
      goTo(i);
    });
    li.appendChild(b);
    dots.appendChild(li);
    dotEls.push(b);
  });
  root.appendChild(dots);

  if (spec.caption) {
    const cap = el("figcaption", "post-seq__caption", spec.caption);
    root.appendChild(cap);
  }
  if (spec.errors.length > 0) {
    const err = el(
      "div",
      "post-seq__errors",
      `⚠ ${spec.errors.slice(0, 4).join(" · ")}`
    );
    root.appendChild(err);
  }

  /* ── 그리기 ── */
  const tokenEls = new Map<number, HTMLElement>();
  let index = -1;
  let timer: number | null = null;

  const render = (animate: boolean) => {
    const state = replay(spec, index);

    // FLIP: 이동 전 위치 기록
    const before = new Map<number, DOMRect>();
    if (animate && !prefersReducedMotion()) {
      tokenEls.forEach((node, id) => before.set(id, node.getBoundingClientRect()));
    }

    const seen = new Set<number>();
    for (const l of spec.lanes) {
      const target = laneEls.get(l.id);
      if (!target) continue;
      const { lane, slot } = target;
      lane.classList.toggle("is-marked", state.marks.has(l.id));

      if (l.kind === "log") {
        slot.textContent = "";
        for (const line of state.logs.get(l.id) || []) {
          slot.appendChild(el("div", "post-seq__logline", line));
        }
        continue;
      }

      const list = state.tokens.get(l.id) || [];
      // stack 은 위에 쌓인 게 위로 보이게 뒤집어 그린다
      const ordered = l.kind === "stack" ? [...list].reverse() : list;
      const nodes: HTMLElement[] = [];
      for (const tok of ordered) {
        seen.add(tok.id);
        let node = tokenEls.get(tok.id);
        if (!node) {
          node = el("div", "post-seq__token");
          tokenEls.set(tok.id, node);
        }
        node.textContent = tok.label;
        nodes.push(node);
      }
      // 순서대로 다시 붙인다(appendChild 는 이동이므로 노드 동일성이 유지된다)
      slot.replaceChildren(...nodes);
    }

    // 사라진 토큰 정리
    tokenEls.forEach((node, id) => {
      if (!seen.has(id)) {
        node.remove();
        tokenEls.delete(id);
      }
    });

    // FLIP: 이동 후 위치와의 차이만큼 되돌렸다가 0으로 보낸다
    if (before.size > 0) {
      tokenEls.forEach((node, id) => {
        const prev = before.get(id);
        if (!prev) {
          node.animate(
            [
              { opacity: 0, transform: "translateY(-6px) scale(0.9)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 220, easing: "ease-out" }
          );
          return;
        }
        const next = node.getBoundingClientRect();
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        node.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "none" },
          ],
          { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      });
    }

    drawArrows(state);

    const total = spec.steps.length;
    stepNo.textContent = index < 0 ? `0 / ${total}` : `${index + 1} / ${total}`;
    say.textContent =
      index < 0
        ? "재생을 누르거나 → 키를 눌러 시작한다."
        : spec.steps[index].say;
    dotEls.forEach((d, i) => {
      d.classList.toggle("is-done", i <= index);
      d.classList.toggle("is-current", i === index);
    });
    btnPrev.disabled = index < 0;
    btnNext.disabled = index >= total - 1;
  };

  const drawArrows = (state: SeqState) => {
    arrows.replaceChildren();
    if (state.moved.length === 0) return;
    const stageRect = stage.getBoundingClientRect();
    arrows.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
    for (const mv of state.moved) {
      const a = laneEls.get(mv.from)?.lane.getBoundingClientRect();
      const b = laneEls.get(mv.to)?.lane.getBoundingClientRect();
      if (!a || !b) continue;
      // 레인 세로 중심을 잇는다. 상단에 붙이면 모바일처럼 레인이 여러 줄로
      // 접힐 때 화살표가 아래 줄 레인의 라벨을 뚫고 지나간다.
      const x1 = a.left + a.width / 2 - stageRect.left;
      const y1 = a.top + a.height / 2 - stageRect.top;
      const x2 = b.left + b.width / 2 - stageRect.left;
      const y2 = b.top + b.height / 2 - stageRect.top;

      const sameRow = Math.abs(a.top - b.top) < 8;
      // 같은 줄이면 위로 넘겨 그리고(레인을 가리지 않게),
      // 줄이 다르면 옆으로 휘어 내려간다.
      const cx = sameRow
        ? (x1 + x2) / 2
        : (x1 + x2) / 2 + (x2 >= x1 ? 1 : -1) * Math.min(60, a.width * 0.5);
      const cy = sameRow
        ? Math.min(y1, y2) - Math.min(56, a.height * 0.45 + 16)
        : (y1 + y2) / 2;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
      path.setAttribute("class", "post-seq__arrow");
      arrows.appendChild(path);
    }
  };

  /* ── 조작 ── */
  const goTo = (i: number) => {
    const clamped = Math.max(-1, Math.min(spec.steps.length - 1, i));
    if (clamped === index) return;
    index = clamped;
    render(true);
  };
  const next = () => {
    if (index >= spec.steps.length - 1) {
      pause();
      return;
    }
    goTo(index + 1);
  };
  const prev = () => goTo(index - 1);
  const pause = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    btnPlay.textContent = "▶";
    btnPlay.setAttribute("aria-label", "재생");
    root.classList.remove("is-playing");
  };
  const play = () => {
    if (timer !== null) return;
    if (index >= spec.steps.length - 1) {
      index = -1;
      render(false);
    }
    btnPlay.textContent = "❚❚";
    btnPlay.setAttribute("aria-label", "일시정지");
    root.classList.add("is-playing");
    timer = window.setInterval(next, spec.speed);
    next();
  };

  btnPlay.addEventListener("click", () => (timer === null ? play() : pause()));
  btnNext.addEventListener("click", () => {
    pause();
    next();
  });
  btnPrev.addEventListener("click", () => {
    pause();
    prev();
  });
  btnReset.addEventListener("click", () => {
    pause();
    index = -1;
    render(true);
  });

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      pause();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      pause();
      prev();
    } else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      timer === null ? play() : pause();
    }
  });

  // 화면 밖으로 나가면 자동 재생을 멈춘다(모바일 배터리·산만함 방지)
  if (typeof IntersectionObserver !== "undefined") {
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) if (!en.isIntersecting) pause();
      },
      { threshold: 0 }
    );
    io.observe(root);
  }
  window.addEventListener("resize", () => drawArrows(replay(spec, index)));

  render(false);
  return root;
}

/* ── 하이드레이션 ─────────────────────────────────────────── */

const SEQ_LANGS = ["seq", "sequence"];

/**
 * 본문의 ```seq 코드 블록을 실제 플레이어로 바꾼다.
 * post.tsx 의 다른 하이드레이터들과 같은 규약: 이미 처리한 <pre> 는 건너뛴다.
 */
export function hydrateSequences(root: HTMLElement | null) {
  if (!root) return;

  // 재렌더(테마 전환 등)로 두 번 불려도 중복 생성되지 않게 이전 결과를 걷어낸다
  root.querySelectorAll(".post-seq").forEach((n) => n.remove());
  root.querySelectorAll("pre[data-seq-rendered]").forEach((pre) => {
    (pre as HTMLElement).style.display = "";
    delete (pre as HTMLElement).dataset.seqRendered;
  });

  for (const lang of SEQ_LANGS) {
    const blocks = root.querySelectorAll<HTMLElement>(`code.language-${lang}`);
    blocks.forEach((code) => {
      const pre = code.closest("pre") as HTMLElement | null;
      if (!pre || pre.dataset.seqRendered) return;
      const spec = parseSeq(code.textContent || "");
      const player = buildPlayer(spec);
      pre.style.display = "none";
      pre.dataset.seqRendered = "true";
      pre.insertAdjacentElement("afterend", player);
    });
  }
}

export const __test = { parseSeq, replay, PRESETS };
