---
title: "Three.js 포트폴리오 렌더링 최적화 실전기: ‘버벅임’은 3D가 아니라 경쟁이었다"
slug: threejs-portfolio-rendering-optimization-story
category: study/frontend/threejs
tags: [Three.js, Performance, Rendering, UX, Optimization]
author: Seobway
readTime: 18
featured: true
createdAt: 2026-04-01
excerpt: “오버레이 내용이 늦게 뜨고 버벅였다”는 체감 문제를, 측정 가능한 실험(perf lab)으로 쪼개서 원인-가설-실험-트레이드오프로 해결한 과정을 기록한다.
---

## 이 글은 튜토리얼이 아니다

Three.js “사용법”을 설명하지 않는다.  
대신 실제로 겪은 최적화 시행착오를 **스토리라인(문제→가설→측정→실험→결론)**으로 정리한다.

핵심은 하나다.

> 버벅임은 단순히 “3D가 무거워서”가 아니라, **UI 전환 순간**에 메인스레드/GPU가 동시에 바빠지는 “경쟁”에서 터진다.

---

## 0) 재현 가능한 실험 환경부터 만든다 (이게 포인트)

말로 “빨라졌다”는 설득력이 약하다.  
그래서 비교 케이스 3개를 고정했다.

- **Before**: baseline
- **After**: 최적화 버전
- **Hybrid(실사용)**: 선명도는 유지하면서 오버레이 UX는 개선

그리고 독자가 직접 눌러서 측정할 수 있도록 “실험 페이지”를 만들었다.

- `public/portfolio/perf-lab.html`
  - 3개를 동시에 띄우고
  - 버튼 한 번으로 지표 표를 뽑는다

이 한 페이지로 “주관적 체감”을 “재현 가능한 실험”으로 바꿀 수 있다.

---

## 1) 첫 번째 병목: 오버레이가 늦게 뜬다

처음엔 “Three.js가 무거워서 UI가 늦게 뜨는 것”처럼 보였는데, 실제로는 더 단순했다.

- 오버레이 열기 함수에 `setTimeout(250ms)`가 들어 있었다
- 그래서 최소 250ms는 무조건 늦게 뜬다

**해결**

- 하드 딜레이 제거
- 대신 오버레이는 즉시 띄우고, 애니메이션 트리거만 다음 프레임으로 넘김

> 포인트: “렌더링 최적화”가 아니라 **UI 반응성 문제**였다.

---

## 2) 두 번째 병목: 오버레이 전환 순간의 ‘경쟁’

오버레이가 뜨는 순간엔 DOM 업데이트/레이아웃/페인트가 들어간다.  
그런데 3D가 계속 풀로 돌아가면(특히 고DPI) GPU/메인스레드가 바빠서 UI가 눌리는 순간이 나온다.

**해결**

- 오버레이가 열리면 3D 루프를 **pause**
- 닫히면 **resume**

이건 “프레임을 낮추는 최적화”가 아니라, **전환 순간에 우선순위를 UI로 양보**하는 설계다.

---

## 3) 세 번째 병목: pointermove + Raycaster

`pointermove`는 이벤트가 많이 온다.  
여기서 매번 레이캐스트를 돌리면 메인스레드가 계속 바쁘다.

Three.js 매뉴얼도 picking(raycasting)이 CPU를 많이 먹는다고 경고한다.[^three-picking]

**해결**

- 이벤트에서 바로 계산하지 않고, 마지막 포인터 위치만 저장
- rAF에서 프레임당 1회만 레이캐스트 실행(스로틀)
- 오브젝트 재사용으로 할당/GC를 줄임

---

## 4) 트레이드오프: 선명도(DPR) vs 성능

여기서 가장 큰 “체감”이 갈린다.

- DPR을 낮추면 프레임은 살아나지만
- 모델/글로우/엣지 선명도가 떨어진다

Three.js 매뉴얼은 HD-DPI에서 내부 픽셀 수 폭증을 설명하면서, “그냥 안 하는 선택”도 현실적이라고 말한다.[^three-responsive]

그래서 최종 결론은 이렇게 갔다.

### Hybrid(실사용)

- **선명도는 이전처럼**(고DPR 유지)
- **오버레이는 즉시 표시**(하드 딜레이 제거)
- **오버레이 열 때만 3D pause**(전환 경쟁 제거)
- **pointermove는 rAF 스로틀**(공짜에 가까운 최적화)

> 이 조합이 “눈으로 보는 품질”과 “UI 반응성”을 동시에 잡았다.

---

## 5) 참고: 기초 개념 글(서브 포스트)

이 글에서 링크로 빠지기 좋은 “개념 글”은 아래 시리즈다.

- `threejs-rendering-pipeline`: Scene/Camera/Renderer, rAF 루프
- `threejs-dpr-and-canvas-resolution`: DPR, drawing buffer, 선명도/성능
- `threejs-raycaster-picking-performance`: Raycaster 비용과 이벤트 제어
- `threejs-gltf-loading`: 모델 로딩과 렌더 타이밍

---

## 참고문헌

[^three-picking]: Three.js Manual, “Picking”. `https://threejs.org/manual/en/picking.html`
[^three-responsive]: Three.js Manual, “Responsive Design”. `https://threejs.org/manual/en/responsive.html`

