---
title: "Raycaster & Picking 성능: pointermove에서 바로 intersectObjects() 하면 왜 버벅일까?"
slug: threejs-raycaster-picking-performance
category: study/frontend/threejs
tags: [Three.js, Raycaster, Picking, Performance, Events]
author: Seobway
readTime: 16
featured: false
createdAt: 2026-04-01
excerpt: Raycaster 기반 picking이 비싼 이유(삼각형 교차 테스트)와, 이벤트 폭주를 rAF로 제어하는 실전 패턴을 정리한다.
---

## 1) Picking(피킹)이란

Three.js 매뉴얼은 picking을 “사용자가 클릭/터치한 오브젝트를 알아내는 과정”이라고 정의한다.[^three-picking]

가장 흔한 방식은 레이캐스팅이다.

- 마우스 위치에서 카메라 절두체 방향으로 Ray를 쏜다
- 그 Ray가 어떤 오브젝트와 교차하는지 계산한다

---

## 2) 왜 비싼가: “삼각형을 다 검사”하는 문제가 된다

매뉴얼은 아주 직설적으로 말한다.[^three-picking]

> 1000개 오브젝트 × 오브젝트당 1000 triangle이면, 100만 triangle을 검사할 수 있다.

물론 실제 구현은 바운딩 볼륨(구/박스) 같은 “빠른 거”로 먼저 걸러서 최적화하지만,[^three-picking]  
씬이 커지면 결국 병목이 될 수 있다.

---

## 3) 흔한 실수: pointermove 이벤트마다 바로 레이캐스트

`pointermove`는 초당 수백 번도 쉽게 발생한다.  
여기에 `intersectObjects()`를 바로 붙이면, 사용자가 마우스를 살짝만 움직여도 CPU가 계속 바쁘다.

이게 “버벅임”으로 체감되는 이유:

- 메인스레드는 레이캐스트 계산을 한다
- 동시에 렌더 루프도 돌고 있다
- UI(오버레이/레이아웃)까지 들어오면 경쟁이 겹친다

---

## 4) 실전 해법 1: rAF 스로틀(프레임당 1회만)

핵심 아이디어는 이거다.

- 이벤트는 “마지막 값만 저장”한다
- 실제 계산은 `requestAnimationFrame`에서 1번만 한다

이 패턴은 포트폴리오 최적화에서도 가장 효과가 좋았다.

---

## 5) 실전 해법 2: “피킹 대상”을 줄여라

매뉴얼에서도 picking의 한계를 보여주면서, 상황에 따라 GPU picking 같은 대안을 언급한다.[^three-picking]

일반적인 CPU Raycaster 최적화 방향은 보통 다음이다.

- 피킹 대상 오브젝트만 별도 배열로 관리해서 `intersectObjects(targets)`
- 레이캐스트 전용 “저폴리 충돌용 모델”을 따로 두기
- 특정 상태(예: 오버레이 열림, 애니메이션 pause)에서는 피킹 자체를 중단

---

## 참고문헌

[^three-picking]: Three.js Manual, “Picking”. `https://threejs.org/manual/en/picking.html`

