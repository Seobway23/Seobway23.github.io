---
title: "QA 브라우저 자동화를 서브에이전트로 분리할 때의 토큰 비용 모델"
coverImage: /post-thumbnails/ai-agent-qa-automation-token-economics.svg
slug: ai-agent-qa-automation-token-economics
category: work/analysis
tags: [ai-agent, claude-code, subagent, mcp, playwright, prompt-caching, token-economics, qa-automation]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-06-11
excerpt: >
  Claude Code 에서 Playwright MCP 로 QA 를 돌릴 때, 메인 에이전트가 직접 호출하는 방식과 스킬, 서브에이전트 위임을
  토큰 비용 모델로 비교했다. QA 3회와 이후 20턴 기준으로 메인이 부담하는 입력 토큰은 서브에이전트 방식이 10.1배 적고,
  프롬프트 캐시를 반영해도 7.9~8.7배 적다.
glossary:
  mcp: "Model Context Protocol. AI 애플리케이션이 외부 도구와 데이터에 접속하는 규약. Playwright MCP 서버는 브라우저 조작을 도구로 제공한다."
  subagent: "메인 대화와 별도의 컨텍스트 창에서 작업하고 요약만 돌려주는 하위 에이전트. 자기 시스템 프롬프트와 도구 권한을 가진다."
  skill: "Claude Code 에서 반복 절차나 참고 자료를 SKILL.md 로 묶어 둔 것. 본문은 그 스킬을 쓸 때만 컨텍스트에 들어간다."
  context-window: "모델이 한 번의 요청에서 입력으로 받는 토큰 전체. 대화 기록, 시스템 프롬프트, 도구 출력이 모두 들어간다."
  tool-search: "MCP 도구의 정의(스키마)를 세션 시작 때 싣지 않고, 이름만 두었다가 필요할 때 검색해 불러오는 Claude Code 기능."
  prompt-caching: "요청의 앞부분(접두부)이 이전 요청과 같으면 저장해 둔 처리 결과를 재사용하는 API 기능. 재사용한 토큰은 기본 입력 단가보다 싸게 계산된다."
  snapshot: "Playwright MCP 의 browser_snapshot 이 돌려주는 페이지 접근성 트리 텍스트. 페이지 요소가 많을수록 길어진다."
sources:
  - url: https://code.claude.com/docs/en/mcp
    title: "Connect Claude Code to tools via MCP — Claude Code Docs"
    checked: 2026-10-15
  - url: https://code.claude.com/docs/en/sub-agents
    title: "Create custom subagents — Claude Code Docs"
    checked: 2026-10-15
  - url: https://code.claude.com/docs/en/skills
    title: "Extend Claude with skills — Claude Code Docs"
    checked: 2026-10-15
  - url: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
    title: "Prompt caching — Claude Platform Docs"
    checked: 2026-10-15
  - url: https://code.claude.com/docs/en/costs
    title: "Manage costs effectively — Claude Code Docs"
    checked: 2026-10-15
---

::: abstract
Claude Code 에서 [[mcp|Playwright MCP]] 로 브라우저 QA 를 돌리면 도구 출력이 메인 에이전트의 [[context-window|컨텍스트]]에 쌓이고, 이후 모든 턴에서 입력으로 다시 전송된다. 메인이 MCP 를 직접 호출하는 방식(A), 스킬을 더한 방식(B), [[subagent|서브에이전트]]에 위임하는 방식(C)을 토큰 비용 모델로 비교했다.
QA 3회와 이후 일반 작업 20턴 기준으로 메인이 부담하는 입력 토큰은 A 4,711,500, B 4,791,000, C 464,400 으로 C 가 A 보다 10.1배 적다. 서브에이전트 비용까지 더한 전체로는 3.4배 적다. [[prompt-caching|프롬프트 캐시]]를 반영하면 메인 부담 차이는 8.7배(캐시 읽기 0.1배 단가), 7.9배(0.05배 단가)다.
스킬은 토큰을 줄이지 않고 절차를 고정한다. MCP 서버를 따로 분리하는 것은 [[tool-search|tool search]]가 켜진 기본 설정에서는 줄일 토큰이 거의 없다.
:::

::: notice
2026-06-11 에 쓴 글을 2026-10-15 에 개정했다. 계산을 스크립트로 다시 실행해 원문 수치가 모두 재현되는 것을 확인했고, 프롬프트 캐시 반영 계산과 민감도 분석을 추가했다. MCP, 서브에이전트, 스킬 설명은 2026-10-15 기준 Claude Code 문서로 바꿨다.
:::

## 1. 배경

### 1.1 문제 상황

화면 QA 를 Claude Code 에 맡기면 Playwright MCP 의 `browser_snapshot` 같은 도구가 페이지 구조를 텍스트로 돌려준다. 폼이 많은 업무 화면은 [[snapshot|snapshot]] 한 번이 1만 토큰을 넘는다.
메인 에이전트가 이 도구를 직접 부르면 출력이 메인 컨텍스트에 남고, QA 를 끝낸 뒤 일반 개발 작업으로 돌아가도 매 턴 그 출력을 함께 보낸다.

QA 를 자동화하면서 세 가지를 판단해야 했다.

1. QA 용 MCP 서버를 따로 분리하면 토큰이 줄어드는가
2. QA 절차를 스킬로 만들면 토큰이 줄어드는가
3. QA 를 서브에이전트에 맡기면 토큰이 얼마나 줄어드는가

### 1.2 세 선택지가 바꾸는 것

세 선택지는 같은 층위의 대안이 아니다. 각자 다른 부분을 바꾼다.

| 선택지 | 하는 일 | 토큰에 영향을 주는 지점 |
| --- | --- | --- |
| MCP 서버 분리 | 브라우저를 조작하는 도구를 제공한다 | 도구 정의(스키마)를 컨텍스트에 싣는 비용 |
| 스킬 | QA 순서와 확인 항목을 고정한다 | 스킬 본문은 쓸 때만 컨텍스트에 들어간다<a href="https://code.claude.com/docs/en/skills" target="_blank"><sup>[3]</sup></a> |
| 서브에이전트 | 별도 컨텍스트 창에서 작업하고 요약만 돌려준다<a href="https://code.claude.com/docs/en/sub-agents" target="_blank"><sup>[2]</sup></a> | 도구 출력이 어느 컨텍스트에 쌓이는가 |

토큰 비용을 가장 크게 바꾸는 변수는 QA 도구 출력이 어느 컨텍스트에 쌓이느냐다. 세 선택지 가운데 이것을 바꾸는 것은 서브에이전트뿐이다.

### 1.3 목표와 제약

- 비교 지표는 **메인 에이전트가 부담하는 입력 토큰 합계**와 **QA 를 마친 시점의 메인 컨텍스트 크기**다. 메인 컨텍스트가 크면 이후 모든 턴의 비용이 커지고, 모델이 참고해야 할 내용도 많아진다.
- 실측이 아니라 계산 모델이다. 도구 출력 크기는 실제 출력 문자 수를 4로 나눈 근사값의 범위다.
- 출력 토큰, 모델의 응답 텍스트, 자동 요약(compaction)은 모델에 넣지 않았다(4.5절).

---

## 2. 방법

### 2.1 비용 모델

모델은 매 요청마다 그때까지의 컨텍스트 전체를 입력으로 받는다. 턴 $t$ 의 컨텍스트 크기를 $C_t$ 라 하면 세션의 입력 토큰 합계는 다음과 같다.

$$
B = \sum_{t=1}^{N} C_t
$$

도구 출력 $o_t$ 가 붙을 때마다 $C_{t+1} = C_t + o_t$ 로 커진다. 한 번 들어온 출력은 그 턴뿐 아니라 이후 모든 턴의 $C_t$ 에 포함되므로, 출력이 쌓이는 동안 합계는 턴 수의 제곱에 가깝게 늘어난다.

프롬프트 캐시를 쓰면 직전 요청과 같은 접두부는 캐시 읽기 단가 $r$, 새로 붙은 부분은 캐시 쓰기 단가 $w$ 로 계산된다. 5분 캐시의 쓰기는 기본 입력 단가의 1.25배, 읽기는 0.1배다. Claude Opus 5.5 와 Sonnet 5.5 의 읽기는 0.05배다<a href="https://platform.claude.com/docs/en/build-with-claude/prompt-caching" target="_blank"><sup>[4]</sup></a>.

$$
B_{\text{cache}} = \sum_{t=1}^{N} \left[ r\,C_{t-1} + w\,(C_t - C_{t-1}) \right]
$$

결과는 기본 입력 단가 1배로 환산한 토큰 수로 적는다.

### 2.2 도구 출력 크기

| 도구 호출 | 최소 | 최대 | 비고 |
| --- | --- | --- | --- |
| `browser_navigate` | 300 | 800 | 이동 결과와 상태 |
| `browser_snapshot` | 3,000 | 15,000 | 접근성 트리, 페이지 요소 수에 비례 |
| `browser_click` | 200 | 600 | |
| `browser_type` | 200 | 600 | |
| `browser_console_messages` | 200 | 2,000 | |
| `browser_network_requests` | 500 | 5,000 | |
| `browser_take_screenshot` | 1,000 | 1,500 | 이미지 토큰 |

QA 1회는 도구 호출 10번으로 둔다.

```text
navigate → snapshot → click → snapshot → type → click
        → snapshot → console → network → screenshot
```

1회의 도구 출력 합계는 최소 11,600, 평균(최소와 최대의 중간값) 33,850, 최대 56,100 토큰이다. 기본 계산은 평균값을 쓴다.

### 2.3 상수

| 변수 | 값 | 의미 |
| --- | --- | --- |
| `BASE_MAIN` | 18,000 | 메인 에이전트 시작 컨텍스트 (시스템 프롬프트, CLAUDE.md, 규칙, 대화) |
| `BASE_SUB` | 9,000 | 서브에이전트 시작 컨텍스트 (에이전트 정의와 도구 일부) |
| `SKILL` | 1,500 | 스킬 본문 |
| `REPORT` | 800 | 서브에이전트가 메인에 돌려주는 요약 |
| `RUNS` | 3 | QA 실행 횟수 |
| `POST_TURNS` | 20 | QA 뒤 메인에서 이어지는 일반 작업 턴 |

### 2.4 시나리오

- **A. 메인이 MCP 직접 호출**: 메인 컨텍스트에서 QA 3회를 차례로 실행한다. 도구 출력은 메인에 계속 쌓인다.
- **B. 스킬 + 메인 직접 호출**: A 와 같고 시작 컨텍스트에 스킬 본문 1,500 이 더해진다.
- **C. 서브에이전트 위임**: QA 1회마다 메인이 한 턴으로 서브에이전트를 부르고, 서브에이전트는 시작 컨텍스트 9,000 에서 QA 를 실행한 뒤 요약 800 을 돌려준다. 서브에이전트 컨텍스트는 QA 마다 새로 시작한다. 원문 계산은 서브에이전트에 스킬을 넣지 않았다. 넣으면 서브에이전트 비용이 906,450 에서 955,950 으로 늘고 메인 비용은 같다.

QA 뒤 일반 작업 20턴은 세 방식 모두 QA 를 마친 시점의 메인 컨텍스트로 계산한다.

### 2.5 구현

계산은 [token-model.mjs](/post-assets/work/analysis/ai-agent-qa-token/token-model.mjs) 하나로 한다. 핵심은 한 플로우의 입력 합계를 세는 함수다.

```js
// token-model.mjs (발췌)
function runFlow(meter, ctx, outs) {
  let billed = 0;
  for (const o of outs) {
    billed += meter(ctx); // 이번 턴: 지금까지의 컨텍스트 전체를 보낸다
    ctx += o;             // 도구 출력이 컨텍스트에 붙는다
  }
  billed += meter(ctx);   // 마지막 출력을 읽는 턴
  return { billed, ctx };
}
```

`meter` 는 캐시를 쓰지 않으면 컨텍스트 크기를 그대로, 쓰면 2.1절 식으로 환산한 값을 돌려준다. 원문은 같은 규칙을 Python 으로 계산했고, 이 스크립트로 다시 계산한 값이 원문 수치와 모두 일치했다.

---

## 3. 결과

### 3.1 캐시를 반영하지 않은 계산

| 지표 (평균 출력, QA 3회 + 20턴) | A | B | C |
| --- | --- | --- | --- |
| QA 를 마친 시점의 메인 컨텍스트 | 119,550 | 121,050 | **20,400** |
| QA 동안 메인 입력 | 2,320,500 | 2,370,000 | **56,400** |
| QA 동안 서브에이전트 입력 | 0 | 0 | 906,450 |
| QA 뒤 20턴 메인 입력 | 2,391,000 | 2,421,000 | **408,000** |
| **메인이 부담하는 입력 합계** | 4,711,500 | 4,791,000 | **464,400** |
| 서브에이전트를 포함한 입력 합계 | 4,711,500 | 4,791,000 | 1,370,850 |

```chart
{
  "type": "bar",
  "caption": "A 를 1 로 둔 비율. 평균 출력, QA 3회 + 이후 20턴, 프롬프트 캐시 미반영. B 는 모든 지표에서 A 보다 1~2% 크다.",
  "source": "/post-assets/work/analysis/ai-agent-qa-token/token-model-results.json",
  "value": "ratioToA.{panel}.{bar}",
  "max": 1.1,
  "panels": [
    { "key": "finalCtx", "label": "최종 메인 컨텍스트" },
    { "key": "main", "label": "메인 부담 입력 합계" },
    { "key": "total", "label": "서브 포함 입력 합계" }
  ],
  "bars": [
    { "key": "A", "label": "A 직접", "style": "base" },
    { "key": "B", "label": "B 스킬" },
    { "key": "C", "label": "C 서브" }
  ]
}
```

- QA 를 마친 시점의 메인 컨텍스트는 C 가 A 의 0.171배(5.9분의 1)다.
- QA 동안 메인 입력은 C 가 A 보다 41.1배 적다. C 의 메인은 QA 1회마다 서브에이전트를 부르는 한 턴만 쓴다.
- 메인이 부담하는 입력 합계는 C 가 A 보다 10.1배 적다. 서브에이전트 입력까지 더하면 3.4배 적다.
- B 는 A 보다 모든 지표가 1~2% 크다. 스킬 본문만큼 컨텍스트가 커지기 때문이다.

![QA 3회 뒤 컨텍스트 구성](/post-assets/work/analysis/ai-agent-qa-token/context-after-qa.svg "막대 길이는 토큰 수에 비례한다. A 는 도구 출력이 메인에 쌓이고, C 는 서브에이전트 컨텍스트에 쌓인 뒤 메인에는 요약만 붙는다.")

```seq
title: QA 를 한 번 할 때마다 메인 컨텍스트에 남는 것
speed: 1700
caption: 평균 출력 기준. 서브에이전트 컨텍스트는 QA 마다 새로 시작한다.

lane a     A 메인 컨텍스트
lane c     C 메인 컨텍스트
lane sub   C 서브에이전트 #log

step 시작. 두 메인 모두 시작 컨텍스트 18,000 이다.
  push a 시작 18,000
  push c 시작 18,000
step QA 1회. A 는 도구 출력 33,850 이 메인에 붙는다. C 는 서브에이전트가 9,000 에서 시작해 출력을 받고 요약 800 만 돌려준다.
  push a QA1 출력 33,850
  log sub 서브 1: 9,000 → 42,850
  push c 요약 800
step QA 2회. A 메인은 85,700 이 된다. C 메인은 19,600 이다.
  push a QA2 출력 33,850
  log sub 서브 2: 9,000 → 42,850
  push c 요약 800
step QA 3회. A 메인은 119,550, C 메인은 20,400 이다.
  push a QA3 출력 33,850
  log sub 서브 3: 9,000 → 42,850
  push c 요약 800
step QA 뒤 일반 작업 20턴. 매 턴 A 는 119,550, C 는 20,400 을 입력으로 보낸다. 합계는 2,391,000 과 408,000 이다.
  mark a
  mark c
```

### 3.2 프롬프트 캐시를 반영한 계산

Claude Code 는 프롬프트 캐시를 자동으로 쓴다<a href="https://code.claude.com/docs/en/costs" target="_blank"><sup>[5]</sup></a>. 매 턴 직전 요청까지의 접두부가 캐시에 남아 있다고 가정하고 2.1절 식으로 다시 계산했다.

| 지표 | 캐시 없음 | 읽기 0.1배 | 읽기 0.05배 |
| --- | --- | --- | --- |
| A 메인 부담 | 4,711,500 | 608,633 | 379,035 |
| C 메인 부담 | 464,400 | 69,900 | 47,700 |
| 메인 부담 비율 (A ÷ C) | 10.1배 | 8.7배 | 7.9배 |
| 서브 포함 비율 (A ÷ C) | 3.4배 | 2.0배 | 1.5배 |

캐시를 반영하면 두 방식 모두 비용이 크게 줄고, 메인 부담 비율은 10.1배에서 8~9배로 줄어든다. 서브에이전트를 포함한 비율은 1.5~2.0배로 줄어든다. 캐시는 반복해서 보내는 접두부를 싸게 만드는데, A 의 비용 대부분이 그 반복 전송이었기 때문이다. 도구 출력을 처음 컨텍스트에 넣는 쓰기 비용(1.25배)은 A 와 C 모두 내고, C 는 서브에이전트마다 시작 컨텍스트 9,000 도 새로 쓴다.

캐시가 줄여 주지 않는 것도 있다. QA 를 마친 시점의 메인 컨텍스트 크기(119,550 대 20,400)는 캐시와 관계없이 같다.

### 3.3 민감도

도구 출력 크기(최소, 평균, 최대)와 QA 뒤 턴 수(0, 20, 100)를 바꿔 A ÷ C 비율을 계산했다. 캐시는 반영하지 않았다.

| 도구 출력 | QA 뒤 턴 | 메인 부담 비율 | 서브 포함 비율 |
| --- | --- | --- | --- |
| 최소 (11,600) | 0 | 21.0배 | 2.1배 |
| 최소 | 20 | 4.8배 | 2.3배 |
| 최소 | 100 | 3.1배 | 2.5배 |
| 평균 (33,850) | 0 | 41.1배 | 2.4배 |
| 평균 | 20 | 10.1배 | 3.4배 |
| 평균 | 100 | 6.8배 | 4.8배 |
| 최대 (56,100) | 0 | 61.3배 | 2.5배 |
| 최대 | 20 | 15.5배 | 4.1배 |
| 최대 | 100 | 10.5배 | 6.5배 |

- 모든 조합에서 C 가 A 보다 적다. 가장 작은 차이는 출력 최소, 100턴의 메인 3.1배, 서브 포함 2.1배다.
- 도구 출력이 클수록 차이가 커진다.
- QA 뒤 턴이 늘면 메인 부담 비율은 **줄어든다**. 두 방식 모두 턴마다 일정한 컨텍스트를 보내므로 비율은 최종 컨텍스트 비율(평균 기준 5.9배)에 가까워진다. 절대 차이는 턴마다 99,150 토큰씩 커진다.
- QA 뒤 턴이 늘면 서브 포함 비율은 커진다. 서브에이전트 비용은 QA 횟수로 정해지고 이후 턴 수와 관계없기 때문이다.

### 3.4 직접 계산해 보기

아래 코드의 `P` 와 `CACHE_READ` 를 바꿔 실행하면 같은 모델로 다시 계산한다. `CACHE_READ` 를 `null` 로 두면 캐시를 반영하지 않는다.

```playground
#! js title=token-model.js
const P = { BASE_MAIN: 18000, BASE_SUB: 9000, REPORT: 800, RUNS: 3, POST_TURNS: 20 };
const FLOW_OUT = [550, 9000, 400, 9000, 400, 400, 9000, 1100, 2750, 1250]; // 평균 출력, 합계 33,850
const CACHE_READ = null; // 0.1 이나 0.05 로 바꿔 본다
const CACHE_WRITE = 1.25;

function meter() {
  let prev = 0;
  return (ctx) => {
    if (CACHE_READ == null) return ctx;
    const cost = CACHE_READ * prev + CACHE_WRITE * (ctx - prev);
    prev = ctx;
    return cost;
  };
}

function runFlow(m, ctx) {
  let billed = 0;
  for (const o of FLOW_OUT) { billed += m(ctx); ctx += o; }
  return { billed: billed + m(ctx), ctx };
}

// A: 메인이 직접 호출
const ma = meter();
let ctxA = P.BASE_MAIN, mainA = 0;
for (let r = 0; r < P.RUNS; r++) { const f = runFlow(ma, ctxA); mainA += f.billed; ctxA = f.ctx; }
for (let t = 0; t < P.POST_TURNS; t++) mainA += ma(ctxA);

// C: 서브에이전트 위임
const mc = meter();
let ctxC = P.BASE_MAIN, mainC = 0, subC = 0;
for (let r = 0; r < P.RUNS; r++) {
  mainC += mc(ctxC);
  ctxC += P.REPORT;
  subC += runFlow(meter(), P.BASE_SUB).billed;
}
for (let t = 0; t < P.POST_TURNS; t++) mainC += mc(ctxC);

const n = (x) => Math.round(x).toLocaleString();
console.log("최종 메인 컨텍스트  A", n(ctxA), " C", n(ctxC));
console.log("메인 부담 입력      A", n(mainA), " C", n(mainC), " 비율", (mainA / mainC).toFixed(1));
console.log("서브 포함 입력      A", n(mainA), " C", n(mainC + subC), " 비율", (mainA / (mainC + subC)).toFixed(1));
```

기본값으로 실행하면 메인 부담 비율 10.1, 서브 포함 비율 3.4 가 나온다. `CACHE_READ = 0.1` 이면 8.7 과 2.0 이다.

---

## 4. 논의

### 4.1 MCP 서버 분리

2026-10-15 기준 Claude Code 는 [[tool-search|tool search]]가 기본으로 켜져 있다. MCP 도구 정의는 지연(deferred) 상태로 두고, 세션 시작 때는 도구 이름과 서버 안내문만 싣는다. Claude 가 도구를 쓸 때 검색해 정의를 불러온다<a href="https://code.claude.com/docs/en/mcp" target="_blank"><sup>[1]</sup></a>.
Playwright MCP 를 연결해 두어도 쓰지 않는 동안 컨텍스트에 남는 것은 이름 목록이다. QA 용 MCP 서버를 따로 분리해 줄일 수 있는 도구 정의 비용이 거의 없다.

예외가 있다. `ANTHROPIC_BASE_URL` 이 Anthropic 이 아닌 주소(프록시 등)를 가리키면 Claude Code 는 tool search 를 끄고 도구 정의를 처음부터 싣는다. `ENABLE_TOOL_SEARCH=false` 로 꺼도 같다<a href="https://code.claude.com/docs/en/mcp" target="_blank"><sup>[1]</sup></a>. 이런 환경에서는 쓰지 않는 MCP 서버를 연결에서 빼는 것이 도구 정의 비용을 줄인다.

### 4.2 스킬

스킬 본문은 그 스킬을 쓸 때만 컨텍스트에 들어간다<a href="https://code.claude.com/docs/en/skills" target="_blank"><sup>[3]</sup></a>. B 처럼 메인에서 스킬을 쓰면 컨텍스트가 스킬 크기만큼 커질 뿐, 도구 출력이 쌓이는 위치는 A 와 같다. 스킬의 효과는 QA 순서와 확인 항목을 매번 같게 만드는 것이고, 토큰 절감 효과는 이 모델에 나타나지 않는다.

### 4.3 권장 구성

세 가지를 각자 맡은 부분에 함께 쓴다.

```text
메인 에이전트
  └─ QA 서브에이전트 호출          도구 출력이 쌓이는 곳을 메인과 분리
       ├─ 절차: QA 스킬            확인 순서와 항목을 고정
       └─ 도구: Playwright MCP      tool search 로 쓸 때만 정의를 불러옴
  ← 돌려받는 것: QA 결과 요약 (약 800 토큰)
```

Claude Code 비용 문서도 테스트 실행, 로그 처리처럼 출력이 많은 작업을 서브에이전트에 맡겨 메인에는 요약만 돌아오게 하라고 안내한다<a href="https://code.claude.com/docs/en/costs" target="_blank"><sup>[5]</sup></a>.

### 4.4 원문 해석 정정

원문은 「세션이 길수록 C 의 우위가 커진다」고 적었다. 3.3절 계산에서 QA 뒤 턴이 늘면 메인 부담의 **절대 차이**는 커지지만 **비율**은 10.1배에서 6.8배로 줄어 5.9배에 가까워진다. 서브에이전트를 포함한 비율은 3.4배에서 4.8배로 커진다. 개정판은 이 구분을 반영했다.

### 4.5 한계

- 도구 출력 크기는 문자 수를 4로 나눈 근사값의 범위다. 실제 세션에서 토큰 사용량을 기록해 맞춰 보지 않았다.
- 모델의 출력 토큰, 응답 텍스트, 생각(thinking) 토큰은 넣지 않았다. 출력 토큰은 입력보다 단가가 높다.
- 캐시 계산은 매 턴 직전 접두부가 캐시에 남아 있다고 가정했다. 5분 넘게 멈추면 캐시가 만료되어 다시 쓰기 단가가 붙는다.
- 서브에이전트도 자기 요청을 보내고, 그 사용량은 메인 대화와 같은 사용량 한도에 포함된다<a href="https://code.claude.com/docs/en/sub-agents" target="_blank"><sup>[2]</sup></a>. 「메인 부담」 지표는 이 비용을 빼고 센 것이다.
- 컨텍스트가 차면 동작하는 자동 요약(compaction)은 넣지 않았다. A 에서 요약이 일어나면 이후 턴의 컨텍스트가 줄어든다.
- 메인 컨텍스트 크기가 응답 품질에 주는 영향은 측정하지 않았다.

---

## 5. 결론

- 토큰 비용을 가장 크게 바꾸는 것은 QA 도구 출력이 어느 컨텍스트에 쌓이느냐다. 이것을 바꾸는 선택지는 서브에이전트 위임뿐이다.
- QA 3회와 이후 20턴, 평균 출력 기준으로 메인 부담 입력은 C 가 A 보다 10.1배, 서브에이전트까지 포함하면 3.4배 적다. 프롬프트 캐시를 반영하면 메인 부담 7.9~8.7배, 서브 포함 1.5~2.0배다.
- 출력 크기와 이후 턴 수를 바꾼 9가지 조합 모두에서 C 가 적었다. 이후 턴이 늘면 메인 부담 비율은 5.9배 쪽으로 줄어든다.
- 스킬은 절차를 고정하는 용도이고 토큰을 줄이지 않는다. MCP 서버 분리는 tool search 가 켜진 기본 설정에서 줄일 비용이 거의 없다.

---

## 부록 A. 원시 데이터

<ul>
<li><a href="/post-assets/work/analysis/ai-agent-qa-token/token-model.mjs" target="_blank">token-model.mjs</a>: 비용 모델. <code>node token-model.mjs</code> 로 아래 JSON 을 만든다.</li>
<li><a href="/post-assets/work/analysis/ai-agent-qa-token/token-model-results.json" target="_blank">token-model-results.json</a>: 3장의 모든 수치(캐시 미반영, 캐시 0.1배·0.05배, 민감도 9가지)</li>
</ul>

## 참고

<ol>
<li><a href="https://code.claude.com/docs/en/mcp" target="_blank">[1] Connect Claude Code to tools via MCP — Claude Code Docs</a></li>
<li><a href="https://code.claude.com/docs/en/sub-agents" target="_blank">[2] Create custom subagents — Claude Code Docs</a></li>
<li><a href="https://code.claude.com/docs/en/skills" target="_blank">[3] Extend Claude with skills — Claude Code Docs</a></li>
<li><a href="https://platform.claude.com/docs/en/build-with-claude/prompt-caching" target="_blank">[4] Prompt caching — Claude Platform Docs</a></li>
<li><a href="https://code.claude.com/docs/en/costs" target="_blank">[5] Manage costs effectively — Claude Code Docs</a></li>
</ol>

---

## 관련 글

- [저장한 설계량이 다음 날짜 화면에 늦게 반영된 원인 분석 →](/post/cache-overlay-timing-rca) (AI 에이전트 파이프라인으로 만든 기능의 원인 분석)
- [3D 캔버스 렌더 최적화 8가지를 하나씩 켜서 잰 결과 →](/post/modeler-canvas-render-ablation) (같은 work 시리즈)
