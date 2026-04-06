---
title: "gstack 스킬 6~13: Build, Test & Ship — AI가 직접 브라우저 켜고 배포한다"
slug: gstack-skills-ship
category: study/infra/gstack
tags: [gstack, claude-code, qa, ship, deployment, review, chromium, retro]
author: Seobway
readTime: 15
featured: false
createdAt: 2026-03-27
excerpt: >
  gstack의 Build~Reflect 단계 8개 스킬 상세 분석.
  실제 Chromium으로 클릭 테스트하는 /qa, 한 커맨드로 CI까지 도는 /ship,
  커밋 히스토리 전체를 분석하는 /retro.
---

## Build, Test & Ship 단계 개요

Think & Plan이 끝난 뒤의 단계. 코드를 짜고, 실제 브라우저로 검증하고, 프로덕션에 올린다.

```mermaid
%% desc: Build, Test & Ship 스킬 흐름
flowchart LR
    A["Plan 단계 완료"] --> B["/review\n스태프 엔지니어\nPR diff 분석"]
    B --> C["/qa\nQA 리드\n실제 Chromium 클릭"]
    C --> D["/cso\n보안 책임자\nOWASP + STRIDE"]
    D --> E["/benchmark\n퍼포먼스 엔지니어\nCore Web Vitals"]
    E --> F["/ship\n릴리즈 엔지니어\nsync→test→PR"]
    F --> G["/land-and-deploy\n머지 → CI → 프로덕션 검증"]
    G --> H["/canary\nSRE\n배포 후 감시"]
    H --> I["/retro\n엔지니어링 매니저\n주간 회고"]
    I --> J["/document-release\n테크니컬 라이터\n문서 자동 최신화"]
```

---

## 스킬 6: `/review` — 프로덕션 버그 헌터

**역할:** 스태프 엔지니어

base 브랜치 대비 diff를 분석해 **CI는 통과하지만 프로덕션에서 터지는 버그**를 찾는다.<a href="https://github.com/garrytan/gstack" target="_blank"><sup>[1]</sup></a>

### 탐지 항목

| 카테고리 | 탐지 내용 |
|---|---|
| 보안 | SQL injection, LLM 트러스트 바운더리 위반, 인증 우회 |
| 구조적 | 조건부 사이드 이펙트, 암묵적 상태 전이, 숨겨진 결합 |
| 성능 | N+1 쿼리, 불필요한 재렌더링, 메모리 누수 패턴 |
| 일관성 | API 응답 형식 불일치, 에러 처리 누락 |

### 동작 방식

```bash
/review           # 현재 브랜치 diff 전체 리뷰
/review --fix     # 명백한 이슈 자동 수정
```

명백한 이슈는 자동 수정. 판단이 필요한 이슈는 리포트만 생성하고 결정을 사용자에게 남긴다.

---

## 스킬 7: `/qa` — 실제 브라우저 QA

**역할:** QA 리드

gstack의 핵심 차별점. **실제 Playwright 기반 Chromium 브라우저**로 앱을 직접 클릭하고 스크린샷을 찍어 디자인까지 검증한다.

### 텍스트 기반 AI vs `/qa`

| | 텍스트 기반 AI | gstack `/qa` |
|---|---|---|
| 렌더링 확인 | ❌ 불가 | ✅ 실제 Chromium |
| 클릭 동작 | ❌ 불가 | ✅ 실제 클릭 (~100ms/커맨드) |
| 스크린샷 | ❌ 불가 | ✅ before/after 어노테이션 |
| 시각적 버그 | ❌ 코드만 분석 | ✅ 렌더링 결과 직접 확인 |
| 회귀 테스트 | 수동 | ✅ 버그 수정마다 자동 생성 |

### 탐지 항목

```mermaid
%% desc: /qa 탐지 항목
mindmap
  root["/qa 탐지"]
    시각적 문제
      간격 불일치
      정렬 깨짐
      폰트 계층 이상
    인터랙션
      느린 반응성
      AI 슬롭 패턴
      호버 상태 누락
    상태 완전성
      빈 상태
      에러 상태
      로딩 상태
    반응형
      모바일 중단점
      오버플로우
```

### 버그 수정 흐름

```mermaid
%% desc: /qa 자동 버그 수정 루프
sequenceDiagram
    participant Q as /qa
    participant B as Chromium
    participant C as 코드베이스

    Q->>B: 앱 클릭 + 스크린샷
    B-->>Q: before 스크린샷
    Q->>Q: 우선순위 디자인 감사 리포트 (알파벳 등급)
    Q->>C: 버그 수정 (atomic 커밋)
    Q->>C: 회귀 테스트 자동 생성
    Q->>B: 재검증 클릭 + 스크린샷
    B-->>Q: after 스크린샷
    Q->>Q: before/after 비교 어노테이션
```

### `/qa-only` — 수정 없이 리포트만

```bash
/qa        # 버그 탐지 + 자동 수정 + 회귀 테스트 생성
/qa-only   # 버그 탐지 + 리포트만 (코드 변경 없음)
```

---

## 스킬 8: `/ship` — 릴리즈 엔지니어

**역할:** 릴리즈 엔지니어

sync → test → coverage audit → push → PR 오픈을 **한 커맨드**로 처리한다.

### 실행 순서

```mermaid
%% desc: /ship 실행 순서
flowchart TD
    A["/ship 시작"] --> B["main 브랜치 동기화"]
    B --> C["테스트 실행"]
    C --> D{테스트 통과?}
    D -->|❌ 실패| E["실패 내용 리포트\n중단"]
    D -->|✅ 통과| F["커버리지 감사\n(테스트 프레임워크 없으면 부트스트랩)"]
    F --> G["커버리지 리포트 생성"]
    G --> H["브랜치 푸시"]
    H --> I["PR 오픈"]
    I --> J["/document-release 자동 호출"]
    J --> K["완료"]
```

### 테스트 커버리지 목표

| 상태 | 동작 |
|---|---|
| 테스트 프레임워크 없음 | 처음부터 자동 부트스트랩 |
| 커버리지 < 기준 | 커버리지 감사 리포트 + 경고 |
| 커버리지 통과 | 정상 진행 |

> **목표: 100% 테스트 커버리지.** Vibe coding(감으로 짜기)을 yolo coding이 아닌 안전한 개발로 만든다.

### `/document-release` 자동 연동

`/ship`이 완료되면 자동으로 `/document-release`를 호출해 문서를 최신화한다. 별도로 실행할 필요 없다.

---

## 스킬 9: `/land-and-deploy` — 머지 후 프로덕션 검증

**역할:** 릴리즈 엔지니어 (머지 후)

PR 머지, CI 파이프라인 완료 대기, 프로덕션 헬스 검증을 순서대로 처리한다.

```bash
/land-and-deploy   # PR 머지 → CI 대기 → 프로덕션 헬스 체크 → 성공 선언
```

`/ship`이 PR을 열었다면, `/land-and-deploy`가 그것을 프로덕션까지 완전히 도달시킨다.

---

## 스킬 10: `/canary` — 배포 후 모니터링

**역할:** SRE (Site Reliability Engineer)

배포 직후 에러율과 회귀를 실시간으로 감시한다.

```bash
/canary            # 배포 후 모니터링 시작
/canary --window=30m  # 30분 감시 윈도우
```

문제 발생 시 알림. 롤백 여부 결정을 위한 데이터 제공.

---

## 스킬 11: `/benchmark` — 성능 베이스라인

**역할:** 퍼포먼스 엔지니어

모든 배포에 측정 가능한 성능 데이터를 붙인다.

### 측정 항목

| 메트릭 | 기준 |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5초 (Good) |
| FID (First Input Delay) | < 100ms (Good) |
| CLS (Cumulative Layout Shift) | < 0.1 (Good) |
| TTFB (Time to First Byte) | < 800ms |
| 번들 사이즈 | 이전 배포 대비 변화량 |

배포마다 베이스라인을 기록해 성능 회귀를 추적한다.

---

## 스킬 12: `/document-release` — 자동 문서화

**역할:** 테크니컬 라이터 (없던 그 엔지니어)

코드가 바뀌면 문서도 바뀌어야 한다. `/document-release`가 이를 자동화한다.

### 업데이트 대상

```mermaid
%% desc: /document-release 업데이트 범위
flowchart LR
    D["/document-release"] --> A["README.md\n설치·사용법 최신화"]
    D --> B["ARCHITECTURE.md\n컴포넌트 다이어그램 갱신"]
    D --> C["CONTRIBUTING.md\n개발 가이드 업데이트"]
    D --> E["CLAUDE.md\n프로젝트 규칙 동기화"]
    D --> F["CHANGELOG.md\n이번 배포 변경 내역"]
    D --> G["TODOS.md\n완료 항목 체크"]
    D --> H["VERSION\n선택적 버전 범프"]
```

동작 방식:
1. 프로젝트 내 모든 문서 파일 읽기
2. 현재 diff와 교차 참조
3. 드리프트된 모든 섹션 업데이트

`/ship`에 의해 자동 호출되지만 독립 실행도 가능:

```bash
/document-release          # 문서 갱신만
/document-release --bump   # 문서 갱신 + VERSION 범프
```

---

## 스킬 13: `/retro` — 주간 엔지니어링 회고

**역할:** 엔지니어링 매니저

커밋 히스토리, 작업 패턴, 코드 품질 메트릭을 분석해 팀 회고를 진행한다.

### 분석 항목

```mermaid
%% desc: /retro 분석 항목
mindmap
  root["/retro"]
    커밋 분석
      커밋 수
      순 코드 변화량
      배포 빈도
    팀 메트릭
      개인별 배포 스트릭
      테스트 건강 트렌드
      리뷰 사이클 타임
    피드백
      칭찬 포인트
      성장 포인트
    AI 도구 크로스 분석
      Claude Code
      Codex
      Gemini
```

### 모드

```bash
/retro             # 현재 프로젝트 주간 회고
/retro global      # 모든 프로젝트 + 모든 AI 도구 크로스 분석
```

### 영구 히스토리

회고 결과는 `~/.gstack/retros/`에 저장된다. 시간이 지나면서 트렌드를 추적할 수 있다.

---

## Build, Test & Ship 단계 요약

| 스킬 | 필수 여부 | 실행 시점 | 주요 아웃풋 |
|---|---|---|---|
| `/review` | 선택 | PR 생성 전 | 버그 리포트 + 자동 수정 |
| `/qa` | 선택 (강권) | 머지 전 | 스크린샷 감사 + 자동 수정 + 회귀 테스트 |
| `/cso` | 선택 | 배포 전 | OWASP + STRIDE 감사 리포트 |
| `/benchmark` | 선택 | 배포마다 | Core Web Vitals 베이스라인 |
| `/ship` | 선택 | 배포 준비 시 | PR + 커버리지 리포트 |
| `/land-and-deploy` | 선택 | 머지 결정 시 | 프로덕션 헬스 검증 |
| `/canary` | 선택 | 배포 직후 | 에러율 + 회귀 감시 |
| `/document-release` | 자동 (`/ship` 연동) | 배포마다 | 전체 문서 최신화 |
| `/retro` | 선택 | 주 1회 | 팀 메트릭 + 트렌드 |

---

## 참고

<ol>
<li><a href="https://github.com/garrytan/gstack" target="_blank">[1] garrytan/gstack — GitHub</a></li>
<li><a href="https://www.toolworthy.ai/tool/gstack" target="_blank">[2] GStack Review 2026 — toolworthy.ai</a></li>
<li><a href="https://agentnativedev.medium.com/garry-tans-gstack-running-claude-like-an-engineering-team-392f1bd38085" target="_blank">[3] Garry Tan's gstack: Running Claude Like an Engineering Team — Agent Native</a></li>
<li><a href="https://www.marktechpost.com/2026/03/14/garry-tan-releases-gstack-an-open-source-claude-code-system-for-planning-code-review-qa-and-shipping/" target="_blank">[4] Garry Tan Releases gstack — MarkTechPost</a></li>
</ol>

---

## 관련 글

- [gstack 개요 — 전체 구조와 철학 →](/post/gstack-overview)
- [gstack Think & Plan 스킬 1~5 →](/post/gstack-skills-plan)
