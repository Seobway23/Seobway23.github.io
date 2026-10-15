// QA 브라우저 자동화 토큰 비용 모델.
// 실행: node token-model.mjs > token-model-results.json
// 원문(2026-06-11)의 Python 계산과 같은 규칙을 쓰고, 프롬프트 캐시 반영 계산과 민감도 분석을 더했다.

// Playwright MCP 도구 한 번의 출력 토큰 범위 (문자 수 / 4 로 근사)
export const STEPS = {
  navigate: [300, 800],
  snapshot: [3000, 15000],
  click: [200, 600],
  type: [200, 600],
  console: [200, 2000],
  network: [500, 5000],
  screenshot: [1000, 1500],
};

// QA 플로우 1회 = 도구 호출 10번
export const FLOW = ["navigate", "snapshot", "click", "snapshot", "type", "click", "snapshot", "console", "network", "screenshot"];

export const DEFAULTS = {
  BASE_MAIN: 18000, // 메인 에이전트 시작 컨텍스트
  BASE_SUB: 9000, // 서브에이전트 시작 컨텍스트
  SKILL: 1500, // 스킬 본문
  REPORT: 800, // 서브에이전트가 메인에 돌려주는 요약
  RUNS: 3, // QA 실행 횟수
  POST_TURNS: 20, // QA 뒤 메인에서 이어지는 일반 작업 턴
};

export function flowOutputs(mode = "avg") {
  return FLOW.map((s) => {
    const [lo, hi] = STEPS[s];
    return mode === "min" ? lo : mode === "max" ? hi : (lo + hi) / 2;
  });
}

// 턴마다 지금까지의 컨텍스트 전체를 입력으로 보낸다.
// 캐시 없음: 입력 토큰을 모두 1배로 센다.
// 캐시 있음: 직전 요청까지의 접두부는 read 배율, 새로 붙은 부분은 write 배율(5분 TTL 1.25배)로 센다.
function makeMeter(cache) {
  let prev = 0;
  return (ctx) => {
    if (!cache) return ctx;
    const cost = cache.read * prev + cache.write * (ctx - prev);
    prev = ctx;
    return cost;
  };
}

function runFlow(meter, ctx, outs) {
  let billed = 0;
  for (const o of outs) {
    billed += meter(ctx);
    ctx += o;
  }
  billed += meter(ctx);
  return { billed, ctx };
}

// A: 메인이 MCP 를 직접 호출 / B: 스킬을 메인에 올리고 직접 호출
function inMain(p, outs, cache, withSkill) {
  const meter = makeMeter(cache);
  let ctx = p.BASE_MAIN + (withSkill ? p.SKILL : 0);
  let qa = 0;
  for (let r = 0; r < p.RUNS; r++) {
    const f = runFlow(meter, ctx, outs);
    qa += f.billed;
    ctx = f.ctx;
  }
  let post = 0;
  for (let t = 0; t < p.POST_TURNS; t++) post += meter(ctx);
  return { finalCtx: ctx, qaMain: qa, qaSub: 0, post, main: qa + post, total: qa + post };
}

// C: 서브에이전트가 실행하고 메인은 요약만 받는다 (원문 계산은 서브에 스킬을 넣지 않았다)
function subagent(p, outs, cache, subSkill = false) {
  const meter = makeMeter(cache);
  let ctx = p.BASE_MAIN;
  let qaMain = 0;
  let qaSub = 0;
  for (let r = 0; r < p.RUNS; r++) {
    qaMain += meter(ctx); // 서브에이전트를 부르는 턴
    ctx += p.REPORT; // 요약이 메인 컨텍스트에 붙는다
    qaSub += runFlow(makeMeter(cache), p.BASE_SUB + (subSkill ? p.SKILL : 0), outs).billed; // 서브는 매번 새 컨텍스트
  }
  let post = 0;
  for (let t = 0; t < p.POST_TURNS; t++) post += meter(ctx);
  return { finalCtx: ctx, qaMain, qaSub, post, main: qaMain + post, total: qaMain + qaSub + post };
}

export function compare(p = DEFAULTS, mode = "avg", cache = null) {
  const outs = flowOutputs(mode);
  return {
    A: inMain(p, outs, cache, false),
    B: inMain(p, outs, cache, true),
    C: subagent(p, outs, cache, false),
    C_skill: subagent(p, outs, cache, true),
  };
}

const round = (o) => JSON.parse(JSON.stringify(o, (_, v) => (typeof v === "number" ? Math.round(v) : v)));

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/").replace(/^(?=[A-Za-z]:)/, "/")}`) {
  const base = compare();
  const ratio = (k) => ({ A: 1, B: base.B[k] / base.A[k], C: base.C[k] / base.A[k] });
  const out = {
    model: "token-model.mjs",
    params: DEFAULTS,
    flowSum: { min: 11600, avg: 33850, max: 56100 },
    noCache: round(base),
    ratioToA: {
      finalCtx: ratio("finalCtx"),
      qaMain: { A: 1, B: base.B.qaMain / base.A.qaMain, C: base.C.qaMain / base.A.qaMain },
      main: ratio("main"),
      total: ratio("total"),
    },
    cache: {
      read010: round(compare(DEFAULTS, "avg", { read: 0.1, write: 1.25 })),
      read005: round(compare(DEFAULTS, "avg", { read: 0.05, write: 1.25 })),
    },
    sensitivity: {},
  };
  for (const mode of ["min", "avg", "max"]) {
    for (const post of [0, 20, 100]) {
      const r = compare({ ...DEFAULTS, POST_TURNS: post }, mode);
      out.sensitivity[`${mode}_${post}`] = {
        A_main: Math.round(r.A.main),
        C_main: Math.round(r.C.main),
        mainRatio: +(r.A.main / r.C.main).toFixed(1),
        totalRatio: +(r.A.total / r.C.total).toFixed(1),
      };
    }
  }
  for (const k of ["read010", "read005"]) {
    const c = out.cache[k];
    out.cache[k].mainRatio = +(c.A.main / c.C.main).toFixed(1);
    out.cache[k].totalRatio = +(c.A.total / c.C.total).toFixed(1);
  }
  for (const k of Object.keys(out.ratioToA)) for (const x of ["B", "C"]) out.ratioToA[k][x] = +out.ratioToA[k][x].toFixed(3);
  console.log(JSON.stringify(out, null, 2));
}
