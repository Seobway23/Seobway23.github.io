---
title: "Frustum Culling: ‘보이는 것만 그리기’가 성능의 1순위인 이유"
slug: threejs-frustum-culling
category: study/frontend/threejs
tags: [Three.js, Rendering, Performance, Frustum, Culling]
author: Seobway
readTime: 11
featured: false
createdAt: 2026-04-01
excerpt: 프러스텀(카메라 절두체)과 컬링의 개념을 정리하고, 왜 ‘그리기 전에 빼는 것’이 가장 강력한 최적화인지 설명한다.
---

## 이 글에서 다룰 것

- 프러스텀(Frustum)이란 무엇인가
- 컬링(Culling)이 왜 “렌더 최적화의 첫 번째 레버”인지
- Three.js에서 컬링이 어떻게 작동하는지(개념 수준)

---

## 1) 프러스텀(Frustum) = 카메라가 보는 절두체

원근 카메라는 “원뿔”이 아니라 **절두체(Frustum)** 형태로 공간을 잘라서 본다.

- near plane보다 가까운 건 잘린다
- far plane보다 먼 것도 잘린다
- 좌/우/상/하도 시야 밖이면 잘린다

이 절두체 밖의 오브젝트는 **애초에 그릴 필요가 없다**.

---

## 2) 컬링이 왜 그렇게 중요한가

렌더링 비용은 크게 2단계로 볼 수 있다.

- **그릴지 말지 결정**(CPU 쪽 판단)
- **실제로 그리기**(GPU가 픽셀을 채우는 비용)

컬링은 “그릴지 말지” 단계에서 오브젝트를 빼버리니까,

- 드로우콜
- 셰이더 실행
- 픽셀 채우기(fill-rate)

같은 비용을 통째로 줄이는 효과가 있다.

---

## 3) 실전 팁(최적화 글과 연결)

컬링은 특히 이런 경우에 체감이 크다.

- 씬에 오브젝트가 많다(수백~수천)
- 카메라가 이동한다(가시 영역이 계속 바뀐다)
- 포스트프로세싱/고DPR로 픽셀 비용이 크다

다만, “내 포트폴리오 키보드 씬”처럼 오브젝트 수가 제한적이고 화면에 대부분 들어오는 경우에는 컬링이 병목이 아닐 수도 있다.  
그럴 때는 DPR, rAF 루프, 입력 이벤트(Raycaster) 쪽이 더 큰 레버가 된다.

---

## 다음 글 안내

컬링을 이해했으면, 이제 “입력 이벤트가 왜 병목이 되는지”로 넘어가야 한다.

- `threejs-raycaster-picking-performance`

