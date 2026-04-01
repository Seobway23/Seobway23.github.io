---
title: "glTF 모델을 Three.js에 올리는 방식: 로더, 씬 그래프, 렌더 타이밍"
slug: threejs-gltf-loading
category: study/frontend/threejs
tags: [Three.js, glTF, GLTFLoader, Rendering, Assets]
author: Seobway
readTime: 15
featured: false
createdAt: 2026-04-01
excerpt: Three.js에서 glTF를 로딩해 씬에 붙이는 기본 흐름과, 로딩 완료 시점에 ‘언제 렌더해야 하는지(render on demand)’까지 연결해서 설명한다.
---

## 왜 glTF가 기준 포맷인가

웹에서 3D 모델을 전달할 때 glTF는 사실상 표준에 가깝다.  
Three.js도 공식 매뉴얼에서 glTF 로딩을 별도 글로 다룬다.[^three-load-gltf]

---

## 1) 로딩의 결과는 “Mesh 하나”가 아니라 “Scene 그래프”다

glTF는 한 파일 안에 다음이 같이 들어갈 수 있다.

- 노드 트리(부모/자식 변환)
- 여러 Mesh
- 머티리얼/텍스처
- 애니메이션
- 카메라/라이트(있을 수도)

그래서 `GLTFLoader`가 주는 결과에서 실제로 많이 쓰는 건 `gltf.scene`이다.[^three-load-gltf]

---

## 2) 기본 코드 패턴(load / loadAsync)

매뉴얼 기준 패턴은 다음과 같다.[^three-load-gltf]

```javascript
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load("path/to/model.gltf", (gltf) => {
  scene.add(gltf.scene);
});
```

또는 `loadAsync()`를 쓰면 async/await로 정리할 수 있다.[^three-load-gltf]

```javascript
const gltf = await loader.loadAsync("path/to/model.gltf");
scene.add(gltf.scene);
```

---

## 3) “모델을 올렸는데 화면이 안 바뀌는” 이유

Three.js는 “렌더 함수가 호출되었을 때”만 화면이 갱신된다.

즉 모델 로딩이 끝나서 `scene.add()`를 해도,

- 계속 rAF 루프를 돌리고 있다면: 다음 프레임에 자연히 그려짐
- **render on demand** 구조라면: 로딩 완료 시점에 `render()`를 한 번 호출해야 한다

이건 Three.js 매뉴얼의 “Rendering on Demand”가 말하는 핵심이다.[^three-render-on-demand]

---

## 4) 실전 최적화 연결 포인트

모델 로딩이 큰 프로젝트에서 “초반 버벅임/흰 화면”은 보통 다음과 연결된다.

- 텍스처가 크다(다운로드/디코드/업로드 비용)
- 드로잉 버퍼가 크다(DPR이 높다)
- 로딩 완료 직후 바로 애니메이션 루프를 풀로 돌린다

그래서 “로딩 완료 → 첫 렌더 → 필요할 때만 렌더” 패턴이 UI 친화적이다.

---

## 참고문헌

[^three-load-gltf]: Three.js Manual, “Loading a .GLTF File”. `https://threejs.org/manual/en/load-gltf.html`
[^three-render-on-demand]: Three.js Manual, “Rendering on Demand”. `https://threejs.org/manual/en/rendering-on-demand.html`

