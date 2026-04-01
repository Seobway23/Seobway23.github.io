---
title: "Three.js 렌더링 파이프라인: Scene → Camera → Renderer 한 번에 이해하기"
slug: threejs-rendering-pipeline
category: study/frontend/threejs
tags: [Three.js, WebGL, Graphics, Rendering, requestAnimationFrame]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-01
excerpt: Three.js가 장면을 화면에 그리는 최소 구성(Scene/Camera/Renderer)과 렌더 루프(requestAnimationFrame)의 의미를 “왜 이렇게 설계됐는지” 관점에서 정리한다.
---

## 이 글의 목표

Three.js를 처음 접하면 코드가 대개 이렇게 시작한다.

- `Scene` 만들고
- `Camera` 만들고
- `WebGLRenderer` 만들고
- `requestAnimationFrame`으로 루프를 돌리고

이 글은 “어떻게 쓰는지”보다 **왜 이런 모양인지(내부 동작/역할 분리)**를 설명한다. 이후 최적화 글에서 *무엇을 멈추고( pause ), 무엇을 줄이고(DPR), 무엇을 스로틀(rAF)* 해야 하는지 판단할 수 있게 만드는 게 목적이다.

---

## 1) Scene: “렌더링 대상”을 담는 그래프(컨테이너)

Three.js의 `Scene`은 실제로 “화면”이 아니라 **렌더링할 오브젝트들을 담는 컨테이너**다.  
Mesh/Light/Group 같은 것들이 트리 형태로 붙고, 그 결과가 렌더러에 전달된다.

핵심 포인트:

- **Scene은 데이터 구조**다(오브젝트의 관계/변환/머티리얼 등).
- “무엇을 그릴지”는 Scene에, “어떻게 볼지”는 Camera에, “어떻게 실제 픽셀로 만들지”는 Renderer에 분리된다.

---

## 2) Camera: “어떤 시점으로 볼지” + “어디까지 보이는지(절두체)”

카메라는 2가지를 동시에 결정한다.

- **뷰(view)**: 카메라 위치/방향에서 “어떻게 바라보는지”
- **프로젝션(projection)**: 3D를 2D 화면에 “어떻게 투영하는지”

실전에서 가장 많이 쓰는 건 `PerspectiveCamera`다. (원근감이 생김)

이 지점이 최적화와 연결된다:

- 카메라의 **near/far** 범위가 너무 넓으면 depth precision 문제가 생길 수 있고
- 프러스텀(카메라가 보는 절두체) 바깥의 오브젝트는 **culling**으로 제외될 수 있다 (다음 글에서 다룸)

---

## 3) WebGLRenderer: “Scene+Camera를 캔버스 픽셀로 바꾸는 엔진”

Three.js에서 실제로 GPU(WebGL) 호출을 담당하는 쪽이 `WebGLRenderer`다.

가장 중요한 1줄은 이거다.

```javascript
renderer.render(scene, camera);
```

`render()`는 **“지금 이 순간의 Scene을, 지금 이 Camera로 봤을 때의 결과를” 캔버스에 그린다**.

즉, 렌더링 비용은 대체로 다음으로 구성된다.

- Scene 안에 있는 **오브젝트 수/복잡도**
- 머티리얼/라이트/텍스처/쉐이더의 비용
- 캔버스 내부 해상도(DPR로 결정되는 픽셀 수)
- “초당 몇 번 render()를 호출하느냐”(프레임 루프)

---

## 4) requestAnimationFrame(rAF): “프레임 타이밍에 맞추는 루프”

브라우저는 화면을 계속 repaint 한다. `requestAnimationFrame()`은 “다음 repaint 직전에 콜백을 호출해 달라”는 API다.[^mdn-raf]

가장 단순한 형태는 이렇게 생겼다.

```javascript
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

중요한 디테일:

- `requestAnimationFrame()`은 **one-shot**이다. 계속 돌리고 싶으면 콜백에서 다시 호출해야 한다.[^mdn-raf]
- 대체로 디스플레이 주사율(보통 60Hz)에 맞춰 호출되지만, 환경에 따라 120/144Hz일 수도 있다.[^mdn-raf]
- **백그라운드 탭/숨겨진 iframe**에서는 rAF가 멈추거나 줄어드는 최적화가 걸린다.[^mdn-raf]

---

## 5) “항상 루프”가 답은 아니다: Rendering on Demand

Three.js 공식 매뉴얼은 “움직이지 않는 화면을 굳이 매 프레임 렌더링하는 건 낭비”라고 말한다.[^three-render-on-demand]

핵심은 이거다.

- 애니메이션이 없다면: **처음 1번 렌더하고, 변화가 있을 때만 렌더하라**
- 변화란: 모델/텍스처 로딩 완료, UI 입력, 카메라 변경, 리사이즈 등

이 관점은 “UI가 뜨는 순간” 최적화와 직결된다.

- UI(오버레이)가 올라오는 순간은 레이아웃/페인트가 필요한데
- 3D가 동시에 풀로 렌더링되고 있으면(특히 고DPR) **메인스레드/GPU 경쟁**이 생기고
- 그 결과 “내용이 늦게 뜬다/버벅인다” 같은 체감이 나온다

그래서 최적화 글에서는 “오버레이 열릴 때 3D pause” 같은 기술이 자연스럽게 등장한다.

---

## 6) 다음 글 안내

이 글이 “구조”라면, 다음 글은 “품질/성능의 본질”이다.

- **선명도(DPR) vs 성능(픽셀 수)**: `renderer.setPixelRatio`, canvas drawing buffer의 의미  
  → `threejs-dpr-and-canvas-resolution`

---

## 참고문헌

[^three-render-on-demand]: Three.js Manual, “Rendering on Demand”. `https://threejs.org/manual/en/rendering-on-demand.html`
[^three-responsive]: Three.js Manual, “Responsive Design”. `https://threejs.org/manual/en/responsive.html`
[^mdn-raf]: MDN Web Docs, “Window: requestAnimationFrame() method”. `https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame`

