---
title: "Three.js는 왜 만들어졌나: WebGL을 ‘직접’ 쓰지 않기 위해"
slug: why-threejs-exists
category: study/frontend/threejs
tags: [Three.js, WebGL, Graphics, Architecture]
author: Seobway
readTime: 10
featured: false
createdAt: 2026-04-01
excerpt: Three.js를 단순 “라이브러리”가 아니라 WebGL 추상화 계층으로 보고, Scene 그래프/로더/머티리얼이 어떤 문제를 해결하려고 존재하는지 정리한다.
---

## 이 글의 관점

Three.js를 “코드 몇 줄로 3D 보여주는 도구”로만 보면 최적화에서 막힌다.  
대신 Three.js를 **WebGL 위의 추상화(엔진)**로 보면 답이 빨리 나온다.

---

## 1) WebGL은 강력하지만, 너무 저수준이다

WebGL을 직접 쓰면 해야 할 일이 폭발한다.

- 버텍스/프래그먼트 셰이더 작성
- 버퍼/어트리뷰트/유니폼 관리
- 행렬/좌표계 수학
- 씬 그래프(부모/자식 변환) 직접 구현
- 모델 로딩 파이프라인 직접 구성
- 머티리얼/라이트/환경맵 등 “렌더링 룩”을 직접 설계

Three.js는 이걸 “바로 앱 개발에 쓸 수 있는 단위”로 묶어준다.

---

## 2) Three.js가 제공하는 핵심 추상화 3종 세트

- **Scene 그래프**: 오브젝트 트리/변환/계층
- **Camera**: 뷰/프로젝션/프러스텀
- **Renderer(WebGLRenderer)**: 실제 GPU 호출(그리기)

이 구조 덕분에 “UI 상태가 바뀌면 렌더를 멈춘다/재개한다” 같은 제어가 가능해진다.

---

## 3) 왜 최적화가 ‘렌더링’에서만 끝나지 않나

Three.js 앱이 버벅이는 원인은 보통 3가지가 섞여 나온다.

- **픽셀 비용**(고DPR, 후처리, 큰 캔버스)
- **CPU 비용**(Raycaster, 애니메이션 업데이트, 오브젝트 많음)
- **UI/레이아웃 비용**(오버레이/DOM 업데이트, 폰트/이미지 로딩)

그래서 “Three.js 최적화 글”은 결국 **브라우저 앱 최적화 글**이 된다.

---

## 다음 글 안내

이 시리즈의 메인 글(실전 최적화 스토리)에서는 다음을 실제로 보여준다.

- “내용 오버레이가 늦게 뜨는” 문제를 하드 딜레이 제거 + 3D pause로 해결
- DPR/프레임/이벤트 비용의 트레이드오프를 실측으로 비교
- Before/After/Hybrid를 독자가 재현 가능한 실험 페이지(perf lab)로 제공

