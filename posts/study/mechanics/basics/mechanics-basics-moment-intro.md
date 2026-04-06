---
title: "모멘트와 작용점 — ‘어디를 축으로 돌리나’ (역학 기초 2)"
slug: mechanics-basics-moment-intro
category: study/mechanics/basics
tags: [역학, 정역학, 모멘트, 작용점, 비전공]
author: Seobway
readTime: 7
featured: false
createdAt: 2026-04-05
excerpt: >
  힘은 크기와 방향이 있고, 모멘트는 ‘축에서 얼마나 떨어진 곳에 그 힘이 닿나’까지
  포함한 돌리는 효과다. 옹벽 전도 검토의 예비 지식.
---

## 이 글의 역할

**힘**이 같아도 **닿는 높이**가 다르면 문이 훨씬 잘 돌아간다. 옹벽도 마찬가지로, 흙이 **벽 아래쪽**에서 세게 밀면 **아래를 축으로 넘어질 위험**이 달라진다. 여기서 쓰는 말이 **모멘트**와 **작용점**이다.<a href="https://en.wikipedia.org/wiki/Moment_(physics)" target="_blank"><sup>[1]</sup></a>

---

## 모멘트를 말로만 정의하면

어떤 점(보통 **축** 또는 **지지점**)을 기준으로,

> **모멘트 ≈ 힘의 크기 × 그 힘의 작용선까지의 수직 거리(팔 길이)**

라고 외워도 된다. 방향(시계 방향인지 반시계 방향인지)은 **어느 쪽으로 넘어가게 하느냐**로 부호를 붙인다.

---

## 지렛대 그림

아래는 **한쪽 끝에 힘**, 가운데 **축**이 있는 단순 지렛대다. 같은 힘이라도 **축에서 멀수록** 돌리는 효과가 커진다.

```diagramatics
{"preset":"lever_moment"}
```

---

## 작용점이란

**작용점**은 “힘 화살표가 **물체의 어디에 붙어 있는지**”를 말할 때 쓴다. 분포된 힘(벽에 걸친 토압처럼 여러 곳에 닿는 힘)은 **합력 하나**와 **그 합력의 작용점**으로 줄여서 쓰면 계산이 쉬워진다.

토압이 **깊이에 따라 커지는 삼각형 분포**일 때, 합력 $P_h$의 작용점은 벽면 **아래(기초 근처)** 쪽에 가깝게 잡히고, 높이로는 대표적으로 **벽면 하단에서 $H/3$ 위** 같은 위치가 된다(이 유도는 평형 편에서 한다).

---

## 전도(넘어짐)와의 연결

옹벽이 **앞쪽 모서리(토e)** 를 축으로 **앞으로 넘어가려는 모멘트**와, **벽 자중**이 만드는 **복원 모멘트**를 비교한다. 그 비교가 **전도 안전율**로 이어진다. 수식은 [옹벽 힘의 평형 →](/post/mechanics-force-equilibrium)에서 이어진다.

---

## 참고

<a href="https://en.wikipedia.org/wiki/Moment_(physics)" target="_blank">[1] Moment (physics) — Wikipedia</a>

<a href="https://en.wikipedia.org/wiki/Torque" target="_blank">[2] Torque — Wikipedia</a>

---

## 관련 글

- [힘과 평형의 말풀이 (역학 기초 1) →](/post/mechanics-basics-forces-intro)
- [토압이 뭔가요? — 시리즈 개요 →](/post/earth-pressure-overview)
- [옹벽 힘의 평형 — 미끄럼·전도 →](/post/mechanics-force-equilibrium)
