---
title: GitLab CI/CD — artifacts vs cache 완전 정복
slug: gitlab-artifacts-vs-cache
tags: [GitLab, CI/CD, DevOps, artifacts, cache, 인프라]
author: seobway
readTime: 12
featured: false
createdAt: 2026-03-19
excerpt: GitLab CI에서 가장 자주 혼동되는 artifacts와 cache의 차이를 개념부터 실전 설정까지 한 번에 정리합니다.
---

# GitLab CI/CD — `artifacts` vs `cache` 완전 정복

> GitLab CI에서 가장 자주 혼동되는 두 개념.
> **잘못 쓰면 빌드가 느려지거나, 파일이 다음 잡에 전달되지 않는 문제**가 생깁니다.
> 개념부터 실전 설정까지 한 번에 정리합니다.

---

## 1. 왜 헷갈리나 — 근본 원인부터

GitLab CI의 각 잡은 **독립된 컨테이너**에서 실행됩니다.
잡 A에서 만든 파일은 잡 B에서 자동으로 보이지 않습니다.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#5b8ec7', 'primaryTextColor': '#fff', 'primaryBorderColor': '#3d6fa5', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7', 'clusterBkg': '#f4f6f9', 'clusterBorder': '#c5d0dc'}}}%%
flowchart LR
    subgraph JOB_A["build 잡 (컨테이너 A)"]
        A_FS["파일시스템\n/builds/project/..."]
        A_OUT["dist/app.js ✅ 생성됨"]
        A_FS --> A_OUT
    end

    subgraph JOB_B["deploy 잡 (컨테이너 B)"]
        B_FS["파일시스템\n/builds/project/..."]
        B_NOPE["dist/app.js ❌ 없음!\n(다른 컨테이너)"]
        B_FS --> B_NOPE
    end

    JOB_A -.->|"기본적으로 공유 안 됨"| JOB_B

    classDef job_a fill:#4a7fa5,stroke:#2d5e82,color:#fff
    classDef job_b fill:#b94040,stroke:#8a2e2e,color:#fff

    class A_FS,A_OUT job_a
    class B_FS,B_NOPE job_b
```

이 문제를 해결하는 두 가지 방법이 `artifacts`와 `cache`입니다.
하지만 **용도가 다릅니다.**

---

## 2. 핵심 차이 한눈에 보기

| | `artifacts` | `cache` |
|---|---|---|
| **목적** | 잡 간 파일 전달 | 의존성 재다운로드 방지 |
| **방향** | 같은 파이프라인 내 잡 → 잡 | 파이프라인 → 파이프라인 |
| **저장 위치** | GitLab 서버 | Runner 캐시 스토리지 (로컬/S3) |
| **보장** | ✅ 항상 다음 잡에 전달 | ⚠️ 캐시 미스 가능 (있으면 쓰는 것) |
| **만료** | `expire_in` 으로 설정 | 수동 삭제 또는 `cache:key` 갱신 |
| **대표 사용처** | 빌드 산출물, 테스트 리포트, 커버리지 | `node_modules`, `.gradle`, `~/.pip` |

---

## 3. `artifacts` — 잡 간 파일 전달

### 개념

같은 파이프라인 안에서 **앞 잡의 결과물을 뒷 잡이 받아야 할 때** 씁니다.
build 잡에서 만든 `.jar`, `.js`, 테스트 리포트 등을 deploy/test 잡에서 써야 하는 상황이 대표적입니다.

### 흐름

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#4a7fa5', 'primaryTextColor': '#fff', 'primaryBorderColor': '#2d5e82', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7', 'clusterBkg': '#f0f4f9', 'clusterBorder': '#c5d0dc'}}}%%
flowchart LR
    subgraph PIPE["파이프라인 #1"]
        direction LR

        subgraph JOB_A["build 잡"]
            A1["소스코드 빌드"]
            A2["dist/app.js\nbuild/libs/*.jar"]
            A1 --> A2
        end

        subgraph GL["GitLab 서버\nArtifacts 저장소"]
            GL_STORE[("artifacts\n압축 저장\nexpire_in 적용")]
        end

        subgraph JOB_B["test 잡"]
            B1["artifacts\n자동 다운로드"]
            B2["테스트 실행\n(빌드 결과물 사용)"]
            B1 --> B2
        end

        subgraph JOB_C["deploy 잡"]
            C1["artifacts\n자동 다운로드"]
            C2["배포 실행"]
            C1 --> C2
        end

        A2 -->|"업로드"| GL_STORE
        GL_STORE -->|"다음 잡 시작 시\n자동 다운로드"| B1
        GL_STORE -->|"다음 잡 시작 시\n자동 다운로드"| C1
    end

    classDef build fill:#4a7fa5,stroke:#2d5e82,color:#fff
    classDef gl fill:#c87941,stroke:#9e5e2e,color:#fff
    classDef test fill:#7c5cbf,stroke:#5d449a,color:#fff
    classDef deploy fill:#5a9a3a,stroke:#3d7228,color:#fff

    class A1,A2 build
    class GL_STORE gl
    class B1,B2 test
    class C1,C2 deploy
```

### yml 설정

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/           # 이 경로를 다음 잡에 전달
    expire_in: 1 hour   # GitLab 서버에서 1시간 후 삭제

test:
  stage: test
  needs: [build]        # build artifacts 자동 수신
  script:
    - npm test          # dist/ 파일 사용 가능

deploy:
  stage: deploy
  needs: [build]        # build artifacts 자동 수신
  script:
    - ./deploy.sh dist/
```

### 알아두면 좋은 것들

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#4a7fa5', 'primaryTextColor': '#fff', 'primaryBorderColor': '#2d5e82', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7'}}}%%
flowchart TD
    ROOT["artifacts 심화"]

    ROOT --> EXP["`expire_in`\n1 hour / 1 day / 1 week\n설정 안 하면 기본값 (30일)"]
    ROOT --> WHEN["`when: always`\n실패한 잡의 산출물도 보존\n→ 실패 로그, 스크린샷 수집에 유용"]
    ROOT --> REPORT["`artifacts: reports:`\njunit, coverage, dotenv 등\nGitLab UI에서 바로 확인 가능"]
    ROOT --> NEEDS["`needs: []`\n빈 배열이면 artifacts 안 내려옴\n주의 필요"]

    classDef root fill:#4a7fa5,stroke:#2d5e82,color:#fff
    classDef detail fill:#5b8ec7,stroke:#3d6fa5,color:#fff

    class ROOT root
    class EXP,WHEN,REPORT,NEEDS detail
```

**`artifacts: reports:`** 는 특히 강력합니다.

```yaml
test:
  script:
    - pytest --junitxml=report.xml --cov-report=xml
  artifacts:
    reports:
      junit: report.xml        # MR에서 테스트 결과 표시
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml     # MR에서 커버리지 표시
```

---

## 4. `cache` — 파이프라인 간 의존성 재사용

### 개념

**매번 `npm install` / `pip install` / `./gradlew dependencies` 를 처음부터 하는 시간을 줄이기 위해** 씁니다.
파이프라인이 달라도 같은 브랜치라면 이전 캐시를 재사용합니다.

> **중요:** cache는 "있으면 쓰고, 없으면 새로 시작"입니다.
> 캐시 미스가 나도 파이프라인은 실패하지 않습니다.

### 흐름

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#7c5cbf', 'primaryTextColor': '#fff', 'primaryBorderColor': '#5d449a', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7', 'clusterBkg': '#f2f0f8', 'clusterBorder': '#c5bce0'}}}%%
flowchart TB
    subgraph PIPE1["파이프라인 #1 (첫 푸시)"]
        P1["build 잡"]
        P1A["캐시 복원 시도\n→ cache MISS ❌\n(처음이라 없음)"]
        P1B["npm ci\n패키지 전체 다운로드\n(느림 ⏳)"]
        P1C["node_modules/ 캐시 저장"]
        P1 --> P1A --> P1B --> P1C
    end

    subgraph RS["Runner 캐시 스토리지\n(key: main-{lock-hash})"]
        CACHE[("node_modules/\n압축 저장")]
    end

    subgraph PIPE2["파이프라인 #2 (다음 푸시)"]
        P2["build 잡"]
        P2A["캐시 복원 시도\n→ cache HIT ✅"]
        P2B["npm ci\n변경분만 처리\n(빠름 ⚡)"]
        P2C["node_modules/ 캐시 갱신"]
        P2 --> P2A --> P2B --> P2C
    end

    P1C -->|"저장"| CACHE
    CACHE -->|"복원"| P2A
    P2C -->|"갱신"| CACHE

    classDef pipe1 fill:#7c5cbf,stroke:#5d449a,color:#fff
    classDef pipe2 fill:#1a8a76,stroke:#12665a,color:#fff
    classDef store fill:#c87941,stroke:#9e5e2e,color:#fff

    class P1,P1A,P1B,P1C pipe1
    class P2,P2A,P2B,P2C pipe2
    class CACHE store
```

### yml 설정

```yaml
build:
  cache:
    key:
      files:
        - package-lock.json    # 락파일이 바뀌면 캐시 키도 바뀜 → 자동 무효화
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
```

### cache key 전략

캐시 키를 어떻게 잡느냐에 따라 캐시 효율이 크게 달라집니다.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#7c5cbf', 'primaryTextColor': '#fff', 'primaryBorderColor': '#5d449a', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7'}}}%%
flowchart TD
    ROOT["cache key 전략"]

    ROOT --> K1["key: $CI_COMMIT_REF_SLUG\n브랜치별 캐시\n→ 브랜치마다 독립 캐시 유지"]
    ROOT --> K2["key:\n  files:\n    - package-lock.json\n락파일 해시 기반\n→ 의존성 변경 시 자동 무효화"]
    ROOT --> K3["key: global\n모든 브랜치 공유\n→ 저장소 절약, 충돌 주의"]
    ROOT --> K4["key: $CI_COMMIT_REF_SLUG-node\n브랜치 + 런타임 조합\n→ 다중 언어 프로젝트에 유용"]

    classDef root fill:#7c5cbf,stroke:#5d449a,color:#fff
    classDef detail fill:#9575cc,stroke:#7c5cbf,color:#fff

    class ROOT root
    class K1,K2,K3,K4 detail
```

**락파일 기반 키** 가 가장 실전적입니다.

```yaml
cache:
  key:
    files:
      - package-lock.json   # 이 파일의 해시가 키
    prefix: "$CI_COMMIT_REF_SLUG"  # + 브랜치명 조합
  paths:
    - node_modules/
```

---

## 5. 같이 쓰는 실전 패턴

`artifacts`와 `cache`는 **같이 쓰는 게 정석**입니다.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#5b8ec7', 'primaryTextColor': '#fff', 'primaryBorderColor': '#3d6fa5', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7', 'clusterBkg': '#f4f6f9', 'clusterBorder': '#c5d0dc'}}}%%
flowchart TB
    subgraph PIPE["파이프라인"]
        direction TB

        subgraph BUILD["build 잡"]
            B_CACHE["① cache 복원\nnode_modules/ (빠른 install)"]
            B_INSTALL["npm ci"]
            B_BUILD["npm run build"]
            B_ART["② artifacts 업로드\ndist/ (다음 잡 전달)"]
            B_CSAVE["③ cache 저장\nnode_modules/ (다음 파이프라인용)"]
            B_CACHE --> B_INSTALL --> B_BUILD --> B_ART
            B_BUILD --> B_CSAVE
        end

        subgraph TEST["test 잡"]
            T_ART["artifacts 다운로드\ndist/ 수신"]
            T_RUN["테스트 실행"]
            T_ART --> T_RUN
        end

        subgraph DEPLOY["deploy 잡"]
            D_ART["artifacts 다운로드\ndist/ 수신"]
            D_RUN["배포 실행"]
            D_ART --> D_RUN
        end
    end

    subgraph STORES["저장소"]
        GL[("GitLab 서버\nArtifacts")]
        RS[("Runner 캐시\nnode_modules")]
    end

    B_ART -->|"업로드"| GL
    GL -->|"다운로드"| T_ART
    GL -->|"다운로드"| D_ART
    B_CSAVE -->|"저장"| RS
    RS -->|"다음 파이프라인\n복원"| B_CACHE

    classDef build fill:#4a7fa5,stroke:#2d5e82,color:#fff
    classDef test fill:#7c5cbf,stroke:#5d449a,color:#fff
    classDef deploy fill:#5a9a3a,stroke:#3d7228,color:#fff
    classDef store fill:#c87941,stroke:#9e5e2e,color:#fff

    class B_CACHE,B_INSTALL,B_BUILD,B_ART,B_CSAVE build
    class T_ART,T_RUN test
    class D_ART,D_RUN deploy
    class GL,RS store
```

### 실전 yml 예시

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/         # ← cache: 파이프라인 간 재사용
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/                 # ← artifacts: 다음 잡에 전달
    expire_in: 1 hour

test:
  stage: test
  needs: [build]              # dist/ 자동 수신
  script:
    - npm test
  artifacts:
    when: always              # 실패해도 리포트 보존
    reports:
      junit: test-results.xml

deploy:
  stage: deploy
  needs: [build]              # dist/ 자동 수신
  script:
    - ./deploy.sh dist/
```

---

## 6. 흐름 비교 — 한 장으로 끝내기

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#5b8ec7', 'primaryTextColor': '#fff', 'primaryBorderColor': '#3d6fa5', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7'}}}%%
flowchart LR
    subgraph ART["artifacts — 같은 파이프라인, 잡 → 잡"]
        direction LR
        A1["잡 A\n빌드 산출물 생성"] -->|"항상 업로드 ✅"| AGL[("GitLab 서버")]
        AGL -->|"다음 잡 자동 다운로드"| A2["잡 B\n산출물 사용"]
    end

    subgraph CAC["cache — 파이프라인 → 파이프라인"]
        direction LR
        C1["파이프라인 #1\n의존성 설치 후 저장"] -->|"캐시 저장"| CRS[("Runner 캐시")]
        CRS -->|"복원 (캐시 히트 시만) ⚠️"| C2["파이프라인 #2\n의존성 재사용"]
    end

    classDef art fill:#4a7fa5,stroke:#2d5e82,color:#fff
    classDef cache_c fill:#7c5cbf,stroke:#5d449a,color:#fff
    classDef store fill:#c87941,stroke:#9e5e2e,color:#fff

    class A1,A2 art
    class C1,C2 cache_c
    class AGL,CRS store
```

---

## 7. 실전 판단 플로차트

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#5b8ec7', 'primaryTextColor': '#fff', 'primaryBorderColor': '#3d6fa5', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7'}}}%%
flowchart TD
    Q["이 파일, 어떻게 공유할까?"]

    Q -->|"같은 파이프라인의\n다른 잡에서 써야 함"| ART
    Q -->|"다음 파이프라인에서\n재설치 시간 줄이고 싶음"| CAC
    Q -->|"둘 다 해당\n(빌드 산출물 + 의존성)"| BOTH

    ART["✅ artifacts\npath: 빌드 결과물\nexpire_in: 보관 기간"]
    CAC["✅ cache\nkey: 락파일 해시\npath: node_modules 등"]
    BOTH["✅ 같이 사용\nartifacts: dist/\ncache: node_modules/"]

    ART --> SUB_ART["언제 받나?\nneeds: [이전잡] → 자동\nneeds 없어도 같은 stage면 자동"]
    CAC --> SUB_CAC["캐시 미스나도 괜찮나?\n✅ 괜찮음\n처음부터 다시 설치할 뿐"]
    BOTH --> SUB_BOTH["순서?\n① cache 복원 (의존성)\n② 빌드 실행\n③ artifacts 업로드 (산출물)\n④ cache 저장 (의존성)"]

    classDef q fill:#3d5166,stroke:#2c3e50,color:#fff
    classDef art fill:#4a7fa5,stroke:#2d5e82,color:#fff
    classDef cac fill:#7c5cbf,stroke:#5d449a,color:#fff
    classDef both fill:#1a8a76,stroke:#12665a,color:#fff
    classDef sub fill:#5b8ec7,stroke:#3d6fa5,color:#fff

    class Q q
    class ART art
    class CAC cac
    class BOTH both
    class SUB_ART,SUB_CAC,SUB_BOTH sub
```

---

## 8. 자주 하는 실수 모음

### artifacts인데 cache 씀 (또는 반대)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#b94040', 'primaryTextColor': '#fff', 'primaryBorderColor': '#8a2e2e', 'lineColor': '#64748b', 'edgeLabelBackground': '#eef2f7'}}}%%
flowchart LR
    subgraph WRONG["❌ 잘못된 패턴"]
        W1["build 잡\ncache: dist/ 저장"]
        W2["deploy 잡\n→ dist/ 없음!\n(캐시 미스 또는 다른 Runner)"]
        W1 -.->|"캐시는 Runner마다 다를 수 있음"| W2
    end

    subgraph RIGHT["✅ 올바른 패턴"]
        R1["build 잡\nartifacts: dist/ 저장"]
        R2["deploy 잡\n→ dist/ 항상 있음 ✅"]
        R1 -->|"artifacts 보장"| R2
    end

    classDef wrong fill:#b94040,stroke:#8a2e2e,color:#fff
    classDef right fill:#5a9a3a,stroke:#3d7228,color:#fff

    class W1,W2 wrong
    class R1,R2 right
```

### `needs: []` 로 artifacts 차단

```yaml
# ❌ 이렇게 하면 build artifacts 안 내려옴
deploy:
  needs: []     # 빈 배열 = "아무 잡도 기다리지 않겠다" = artifacts도 없음

# ✅ 올바른 방법
deploy:
  needs: [build]  # build 잡의 artifacts 자동 수신
```

### 캐시 키 너무 넓게 잡기

```yaml
# ❌ 모든 브랜치가 같은 캐시 → 충돌/오염 위험
cache:
  key: "global"
  paths:
    - node_modules/

# ✅ 브랜치 + 락파일 조합
cache:
  key:
    files:
      - package-lock.json
    prefix: "$CI_COMMIT_REF_SLUG"
  paths:
    - node_modules/
```

---

## 9. 한 줄 요약

| | 한 줄 요약 |
|---|---|
| `artifacts` | **"이 파일, 다음 잡에 줘"** — 같은 파이프라인 내 잡 간 전달, 보장됨 |
| `cache` | **"이 폴더, 다음 파이프라인에서 재사용"** — 설치 시간 단축, 미스 가능 |
