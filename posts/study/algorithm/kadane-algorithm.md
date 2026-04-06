---
title: "Kadane 알고리즘 — 최대 부분배열을 O(n)으로 푸는 DP"
slug: kadane-algorithm
category: study/algorithm
tags: [Algorithm, DynamicProgramming, Kadane, MaximumSubarray, DP, 최적화]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-04-06
excerpt: >
  최대 부분배열(Maximum Subarray)은 “연속 구간”이라는 제약이 붙는 순간 O(n^2)로 쉽게 터진다.
  Kadane 알고리즘을 DP 관점으로 정리하고, 왜 맞는지(증명 스케치)와 어디에 재사용되는지까지 파헤쳐본다.
---

연속된 구간의 합이 최대가 되는 부분배열을 찾는 문제는 자주 나온다.
그런데 “연속”이라는 제약 때문에, 부분집합처럼 정렬/그리디로 대충 처리하면 바로 깨진다.

Kadane 알고리즘은 이 문제를 **한 번의 선형 스캔**으로 해결한다.<a href="https://en.wikipedia.org/wiki/Maximum_subarray_problem" target="_blank"><sup>[1]</sup></a>

---

## 문제 정의 (Maximum Subarray)

정수 배열 $a[0 \ldots n-1]$ 이 있을 때,
합이 최대가 되는 연속 구간 $a[l \ldots r]$ 의 합을 구한다.

예를 들어,

```text
[-2, 1, -3, 4, -1, 2, 1, -5, 4]
```

최대 합은 $4 + (-1) + 2 + 1 = 6$ 이다.<a href="https://en.wikipedia.org/wiki/Maximum_subarray_problem" target="_blank"><sup>[1]</sup></a>

---

## 직관: “손해 보는 접두사는 버린다”

어떤 시점까지의 누적합이 음수가 됐다면, 그 음수 누적합을 들고 다음 원소를 붙여봤자 **무조건 손해**다.

- 지금까지 만든 구간 합이 -10인데 다음 값이 5라면: -10 + 5 = -5
- 그냥 새로 시작하면: 5

그래서 “지금까지 만든 구간을 이어갈지 / 여기서 새로 시작할지”만 결정하면 된다.
이게 Kadane의 핵심이다.

---

## DP로 보기: 점화식이 전부다

인덱스 $i$에서 끝나는(즉, $r=i$) 최대 부분배열 합을 $dp[i]$ 라고 두면,

$$
dp[i] = \max\bigl(a[i],\ dp[i-1] + a[i]\bigr)
$$

의미는 간단하다.

- $a[i]$로 **새로 시작**한다.
- 또는 $i-1$에서 끝나는 최적 구간에 $a[i]$를 **연장**한다.

전체 정답은 모든 $dp[i]$ 중 최댓값이다.

Kadane은 이 DP를 배열로 만들지 않고, **현재값 하나만 들고** 굴리는 최적화 버전이다. (공간 O(1))

같은 내용을 “함수”로 쓰면 더 직관적으로 보일 때가 있다.

- $f(i)$: 인덱스 $i$에서 **끝나는** 최대 부분배열 합

그러면 점화식은

$$
f(i) = \max\bigl(a[i],\ f(i-1) + a[i]\bigr)
$$

이고, 최종 답은

$$
\max_{0 \le i \le n-1} f(i)
$$

로 정리된다.

---

## 구현 — 합만 구하기

아래 구현은 “모두 음수인 경우”도 제대로 처리하도록, 초기값을 `nums[0]` 기반으로 잡는다.

<!-- code-tabs:start -->

```typescript
export function maxSubarraySum(nums: number[]): number {
  if (nums.length === 0) throw new Error("nums is empty");

  let best = nums[0];
  let cur = nums[0];

  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }

  return best;
}
```

```python
from typing import List


def max_subarray_sum(nums: List[int]) -> int:
    if not nums:
        raise ValueError("nums is empty")

    best = nums[0]
    cur = nums[0]

    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)

    return best
```

```cpp
#include <algorithm>
#include <stdexcept>
#include <vector>

long long maxSubarraySum(const std::vector<long long>& a) {
  if (a.empty()) throw std::invalid_argument("a is empty");

  long long best = a[0];
  long long cur = a[0];

  for (size_t i = 1; i < a.size(); i++) {
    cur = std::max(a[i], cur + a[i]);
    best = std::max(best, cur);
  }

  return best;
}
```

<!-- code-tabs:end -->

| 항목 | 값 |
|---|---|
| 시간복잡도 | $O(n)$ |
| 공간복잡도 | $O(1)$ |

---

## 구현 — 구간 인덱스까지 구하기 (TypeScript / Python / C++)

실전에서는 합만이 아니라 “어떤 구간이냐”가 필요할 때가 많다.

<!-- code-tabs:start -->

```typescript
export function maxSubarray(nums: number[]): {
  sum: number;
  l: number;
  r: number;
} {
  if (nums.length === 0) throw new Error("nums is empty");

  let bestSum = nums[0];
  let bestL = 0;
  let bestR = 0;

  let curSum = nums[0];
  let curL = 0;

  for (let i = 1; i < nums.length; i++) {
    const extend = curSum + nums[i];
    if (nums[i] > extend) {
      curSum = nums[i];
      curL = i;
    } else {
      curSum = extend;
    }

    if (curSum > bestSum) {
      bestSum = curSum;
      bestL = curL;
      bestR = i;
    }
  }

  return { sum: bestSum, l: bestL, r: bestR };
}
```

```python
from typing import List, Tuple


def max_subarray(nums: List[int]) -> Tuple[int, int, int]:
    if not nums:
        raise ValueError("nums is empty")

    best_sum = nums[0]
    best_l = 0
    best_r = 0

    cur_sum = nums[0]
    cur_l = 0

    for i in range(1, len(nums)):
        x = nums[i]
        extend = cur_sum + x

        if x > extend:
            cur_sum = x
            cur_l = i
        else:
            cur_sum = extend

        if cur_sum > best_sum:
            best_sum = cur_sum
            best_l = cur_l
            best_r = i

    return best_sum, best_l, best_r
```

```cpp
#include <algorithm>
#include <stdexcept>
#include <tuple>
#include <vector>

std::tuple<long long, int, int> maxSubarray(const std::vector<long long>& a) {
  if (a.empty()) throw std::invalid_argument("a is empty");

  long long bestSum = a[0];
  int bestL = 0;
  int bestR = 0;

  long long curSum = a[0];
  int curL = 0;

  for (int i = 1; i < static_cast<int>(a.size()); i++) {
    const long long x = a[i];
    const long long extend = curSum + x;

    if (x > extend) {
      curSum = x;
      curL = i;
    } else {
      curSum = extend;
    }

    if (curSum > bestSum) {
      bestSum = curSum;
      bestL = curL;
      bestR = i;
    }
  }

  return { bestSum, bestL, bestR };
}
```

<!-- code-tabs:end -->

| 항목 | 값 |
|---|---|
| 시간복잡도 | $O(n)$ |
| 공간복잡도 | $O(1)$ |

---

## 왜 맞는가 (증명 스케치)

핵심 주장:

- 어떤 최적 구간 $a[l \ldots r]$가 있을 때,
  $l$ 이전의 부분합이 양수라면 그걸 포함시키는 게 더 이득이므로 $l$이 최적일 수 없다.
- 따라서 최적 구간은 “이전까지의 누적합이 음수였던 지점 다음”에서 시작해도 손해가 없다.

CP-Algorithms는 이 아이디어를 “누적합이 음수가 되는 지점(critical position) 뒤에서만 시작해도 된다”는 형태로 정리하고, 그로부터 선형 알고리즘의 정당성을 도출한다.<a href="https://cp-algorithms.com/others/maximum_average_segment.html" target="_blank"><sup>[2]</sup></a>

DP 관점에서는 더 직접적이다.

- $i$에서 끝나는 최적해는 **새로 시작**하거나 **이전 최적해를 연장**하는 두 경우만 존재한다.
- 두 경우 중 큰 값을 택하면 $dp[i]$가 된다.
- 전체 최적해는 $dp[i]$의 최댓값이다.

---

## 이걸로 무엇을 “최적화”할 수 있나

Kadane은 단순히 “배열 한 번 훑어서 최대 합 구하기”에서 끝나지 않는다.
핵심은 **연속 구간의 최적값을 선형으로 뽑는 패턴**이다.

### 1) 구간 점수 최적화 (score = Σ value)

예:

- 특정 기간의 순이익(매출-비용) 배열이 있을 때, **가장 성과가 좋은 연속 기간** 찾기
- 로그/지표에서 “개선량”을 +/−로 변환해, **가장 크게 좋아진 구간** 찾기

### 2) 2차원(서브매트릭스)로 확장

2D 최대 합 부분행렬은 행 범위를 고정해 1D로 접어서 Kadane을 적용하는 방식으로 풀 수 있고,
전형적으로 O(n^3) 접근이 많이 소개된다.<a href="https://cp-algorithms.com/others/maximum_average_segment.html" target="_blank"><sup>[2]</sup></a>

### 3) “최대 평균 구간” 같은 문제로 변형

평균을 직접 최대화하기 어렵다면,
값을 $a[i] - x$로 치환하고 “양수 합 구간이 존재하는가”를 판단하는 서브문제로 바꿔서
이분탐색 + (Kadane 계열)로 푸는 테크닉이 자주 쓰인다.<a href="https://cp-algorithms.com/others/maximum_average_segment.html" target="_blank"><sup>[2]</sup></a>

---

## 자주 터지는 포인트

### 모든 원소가 음수면?

구현이 “누적합이 음수면 0으로 리셋”만 하고 `best` 초기화를 0으로 두면,
배열이 전부 음수일 때 답이 0이 되어버린다(실제 최대는 가장 덜 음수인 값).

그래서 이 글의 구현처럼:

- `best = nums[0]`, `cur = nums[0]`로 시작하거나
- `best = -Infinity`로 시작하고 케이스를 따로 처리해야 한다.

### 답의 정의가 “빈 구간 허용”인지 확인

문제에 따라 “아무것도 선택하지 않음(합=0)”을 허용하는 변형이 있다.
그때는 초기값/리셋 규칙이 달라진다.

---

## 참고

<ol>
<li><a href="https://en.wikipedia.org/wiki/Maximum_subarray_problem" target="_blank">[1] Maximum subarray problem — Wikipedia</a></li>
<li><a href="https://cp-algorithms.com/others/maximum_average_segment.html" target="_blank">[2] Search the subsegment with the maximum/minimum sum — CP-Algorithms</a></li>
</ol>
