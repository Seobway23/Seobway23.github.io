---
title: "Claude Code 하네스 유출이 말해 주는 것 — 모델이 아니라 오케스트레이션"
slug: claude-code-harness-leak-architecture
category: study/ai
tags: [Claude Code, Anthropic, AI, 에이전트, npm, 보안, 하네스, 소스맵]
author: Seobway
readTime: 9
featured: false
createdAt: 2026-04-06
excerpt: >
  2026년 3월 npm 패키지에 실린 소스맵이 Claude Code CLI의 대규모 TypeScript 하네스를 드러냈다.
  여기서는 법적 논쟁보다, 공개된 분석을 바탕으로 한 **현재 국면**과 **하네스가 어떻게 짜여 보이는지**만 정리한다.
---

## 무슨 일이 있었나

2026년 3월 31일, 보안 연구자 **Chaofan Shou**가 X(트위터)에 **Claude Code** npm 패키지 안에 이상한 **소스맵(`.map`)** 이 포함돼 있다고 알렸다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a> 곧이어 이 소스맵이 Anthropic 쪽 **Cloudflare R2** 에 올라간 압축 파일을 가리키고, 그 안에 **약 51만 줄·1,900여 개 파일 분량의 TypeScript** 가 들어 있다는 분석이 퍼진다. 외신·보안 블로그에서도 같은 사건을 다루며, 패키징 실수로 **디버깅용 산출물이 공개 배포물에 섞였다**는 점을 공통으로 짚는다.<a href="https://helixar.ai/press/anthropic-claude-code-source-leak-npm-source-map/" target="_blank"><sup>[2]</sup></a>

Anthropic은 **“보안 침해가 아니라 릴리스 패키징상의 휴먼 에러”** 라는 선에서 고객 데이터·자격 증명 유출은 없었다고 밝혔고, **CLI 소스가 노출된 범위**로 제한됐다고 설명한다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a>

기술적 원인으로는 **Bun** 빌드 체인에서 소스맵이 기대와 다르게 포함됐다는 지적(공개 이슈와의 연관)과, **`.npmignore` / 패키지 설정** 으로 막지 못한 채 배포됐다는 이야기가 함께 나온다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a> **2025년 2월에도 비슷한 소스맵 유출** 이 있었다는 정리도 있어, “한 번 고쳤는데 다시”라는 인상을 준다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a>

---

## 이 글의 초점

법적·윤리적 논쟁, DMCA, 미러 사이트, **가짜 “유출본” 레포에 심은 악성코드** 같은 주제는 중요하지만, 여기서는 **엔지니어 입장에서 “지금 무엇이 드러났고, 생태계가 어떻게 반응했는가”** 에 맞춘다.

에이전트형 코딩 도구에서 **모델(가중치·API 뒤의 추론)** 과 **하네스(도구 호출, 권한, 메모리, 컨텍스트·세션 관리)** 를 나누어 보면, 이번 사건은 후자가 **블랙박스가 아니었다는 것을 실물로 보여 준 사례**에 가깝다. 공개된 분석들이 공통으로 짚는 구조는 대략 다음과 같다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a>

- **권한이 나뉜 다수의 도구**(파일·셸·Git·스크래핑 등)와 샌드박스·접근 제어 쪽 설계
- **단기·세션·장기**를 아우르는 **메모리·지속성** 층의 분리
- **기능 플래그** 로 아직 공개되지 않은 능력이 코드베이스에 존재한다는 흔적
- **MCP** 등 **전송·확장** 방식을 여러 갈래로 두는 부분
- 컨텍스트 창을 어떻게 채우고 비울지에 대한 **정리(eviction)·엔트로피** 성격의 로직

“챗봇에 프롬프트만 얹은 얇은 래퍼”가 아니라, **실사용을 견디기 위한 오케스트레이션 레이어**가 따로 두껍게 깔려 있다는 해석이 설득력을 얻는다.

---

## 그 직후 GitHub에서 벌어진 일: claw-code와 이슈 탭

유출 직후, **Sigrid Jin** 이 이름을 건 **클린룸 재구현** 이 GitHub에 올라오며 짧은 기간에 **스타 수가 10만 단위를 넘어 16만·17만에 가깝게** 불었다는 보도·정리가 있다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a> 저장소 이름·소유자는 포크·이전 등으로 바뀌는 경우가 많아, 숫자는 **검색 시점의 GitHub UI** 를 기준으로 보면 된다. 대표적으로 공개되어 널리 인용되는 저장소는 **`ultraworkers/claw-code`** 쪽으로 정리되는 경우가 많다.<a href="https://github.com/ultraworkers/claw-code" target="_blank"><sup>[4]</sup></a>

이런 저장소의 **Issues** 는 단순 버그 리포트 수준을 넘어, **클린룸이 실제로 무엇을 의미하는지**, **라이선스·출처**, **Anthropic과의 관계**, **DMCA·저작권** 을 둘러싼 논쟁이 한꺼번에 몰리는 공간이 됐다. “스타가 많이 달렸다”는 것은 기술적 검증을 대신하지 않지만, **하네스·에이전트 오케스트레이션이 얼마나 많은 개발자의 관심을 끄는 축인지** 를 보여 주는 지표로는 읽을 만하다.

---

## 위험 요소와 국면

- **패키징·공급망** — 소스맵 한 장이 **IP·로드맵 추론**까지 연결될 수 있다는 점에서, npm 배포 파이프라인은 감사 대상이 된다. 같은 시기에 **별도의 npm 공급망 공격** 이 겹쳤다는 보고도 있어, “유출 소식 + 급히 클론” 조합은 특히 위험하다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a>
- **DMCA와 생태계** — 광범위한 저장소 네트워크에 대한 조치가 **과도하게 적용**됐다가 일부 **철회**됐다는 서술이 있고, 그 과정에서 **오픈소스 포크·스킬-only 저장소**까지 영향을 받았다는 불만이 제기됐다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a>
- **가짜 미러·트로이** — “진짜 유출”을 사칭한 저장소에 **정보 탈취·채굴기** 등이 실렸다는 경고가 있다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a> **공식 설치 경로 외 바이너리/소스는 이미 침해된 것으로 가정**하는 편이 안전하다.
- **산업 쪽 읽기** — 하네스 설계가 **아키텍처 힌트**로 읽히는 순간, 경쟁 제품 입장에서는 **모델 격차만**이 아니라 **실행·에코시스템·모델–하네스 공동 설계** 쪽 경쟁이 더 드러난다. 기술적 봉인이 어려워지면 **API 과금·구독** 쪽으로 모트가 이동한다는 관측도 나온다.<a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank"><sup>[1]</sup></a>

---

## 마무리

이번 사건에서 정리할 수 있는 핵심은 하나다. **에이전트 제품의 가치가 모델 한 축에만 있지 않고, 도구·메모리·컨텍스트·권한이 합쳐진 오케스트레이션** 에도 크게 실려 있다는 점이, 유출된 하네스 분석을 통해 **구체적으로 관찰 가능한 형태**로 드러났다는 것이다. 동시에 **반복된 패키징 실수**, **유출을 빙자한 공급망 공격**, **법·커뮤니티와의 마찰** 은 같은 사건의 다른 면이다.

**Anthropic이 공식 배포하는 경로의 Claude Code만** 쓰고, 출처 불명 “유출 소스”는 **실행도, 그대로 복붙도 하지 않는 것**이 안전하다. 아키텍처는 **합법적인 글·공식 문서·오픈 대안**으로도 충분히 따라갈 수 있다.

---

## 참고

<ol>
<li><a href="https://paddo.dev/blog/claude-code-leak-harness-exposed/" target="_blank">[1] The Claude Code Leak: What the Harness Actually Looks Like — paddo.dev</a></li>
<li><a href="https://helixar.ai/press/anthropic-claude-code-source-leak-npm-source-map/" target="_blank">[2] Anthropic Claude Code source leak (npm source map) — Helixar.ai 요약</a></li>
<li><a href="https://breached.company/claude-code-source-map-leak-anthropic-2026/" target="_blank">[3] Claude Code source map leak 개요 — Breached.Company</a></li>
<li><a href="https://github.com/ultraworkers/claw-code" target="_blank">[4] ultraworkers/claw-code — GitHub</a></li>
</ol>

---

## 관련 글

- [gstack 개요 — 전체 구조와 철학 →](/post/gstack-overview) — Claude Code 위에 얹는 스킬·가상 엔지니어링 팀 워크플로
- [gstack Think & Plan 스킬 1~5 →](/post/gstack-skills-plan) — 기획·플랜 단계 스킬 묶음
- [gstack Build, Test & Ship 스킬 6~13 →](/post/gstack-skills-ship) — 리뷰·QA·배포 쪽 스킬 묶음
