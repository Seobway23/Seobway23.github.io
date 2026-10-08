---
title: "빨리 만들려고 고른 k3s, 뜯어보니 틀린 선택이었다 — 노드 1대 서비스의 아키텍처 트레이드오프"
slug: k3s-vs-compose-single-node
category: work/analysis
tags: [architecture, trade-off, k3s, kubernetes, docker-compose, caddy, retrospective]
author: Seobway
readTime: 13
featured: false
createdAt: 2026-10-08
excerpt: >
  다른 프로젝트의 k3s 배포 코드를 재사용하면 MVP가 빨리 나오겠다고 판단했다. 실제로 빨리 나왔다.
  그런데 같은 서버에 새 서비스를 얹으려고 시스템을 뜯어보니, 노드 1대짜리 서비스에 k3s는 매달
  비용을 내면서 정작 필요한 위험은 막지 못하는 구조였다. 어떻게 알게 됐는지, 무엇이 최선이었는지,
  다음에 같은 결정을 할 때 쓸 기준까지 정리한다.
---

## 이 글에서 다루는 것

::: notice
**한 줄 요약:** "코드 재사용으로 빨리 출시"는 **한 번 버는 이득**이고, 그 대가인 메모리·운영 복잡도·공격 면은 **매달 내는 비용**이다. 노드 1대·서비스 3개 규모에서는 그 비용이 이득보다 컸다. 처음부터 다시 고른다면 **Docker Compose + Caddy**다.
:::

1. 그때 왜 k3s를 골랐나 — 속도를 산 결정
2. 어떻게 틀렸다는 걸 알게 됐나 — 시스템을 직접 뜯어본 과정
3. 재사용 이득을 다시 계산하기 — 한 번 버는 시간 vs 매달 내는 비용
4. 그래서 무엇이 최선이었나 — 후보 4개를 같은 기준으로
5. 다음에 같은 결정을 할 때 쓸 기준

---

## 1. 그때 왜 k3s를 골랐나 — 속도를 산 결정

사내 CRM을 새로 만들 때, 이미 k3s로 운영 중인 다른 프로젝트가 있었다. 그 프로젝트에는 잘 돌아가는 것들이 다 있었다.

- GitLab CI → 컨테이너 레지스트리 → `kubectl apply`로 이어지는 배포 파이프라인
- Deployment·Service·Ingress 매니페스트
- 롤링 업데이트, 헬스 체크, 자동 재시작

판단은 단순했다. **"이걸 복사해서 고치면 배포 인프라를 새로 만들 필요가 없다. MVP가 빨리 나온다."** 덤으로 롤링 업데이트(무중단 배포)까지 공짜로 따라온다.

당시에도 대안은 알고 있었다. 저장소의 배포 문서에는 Compose안을 따로 써 두었고, 거기에 이렇게 적었다.

> 오케스트레이션: **Docker Compose v2** — 단일 VM 3서비스에 최적. 대안: k8s(**과설계**)

알면서도 k3s를 골랐다. 그때 머릿속 트레이드오프 표는 이랬다.

| 얻는 것 | 감수한 것 |
|---|---|
| 검증된 배포 코드 재사용 → 출시 속도 | 단일 VM에는 과한 구조 |
| 롤링 업데이트·자동 재시작 기본 제공 | k8s 관리 부품의 메모리 |
| 두 프로젝트의 배포 방식 통일 | 매니페스트·kubeconfig 관리 |

결과만 보면 성공이었다. MVP는 빨리 나왔고, 배포도 무중단으로 잘 돌았다. 문제는 **"감수한 것" 칸을 숫자로 계산해 본 적이 없다**는 점이었다.

---

## 2. 어떻게 틀렸다는 걸 알게 됐나 — 시스템을 직접 뜯어본 과정

### 계기: 새 서비스를 같은 서버에 얹으려다

새로 만드는 모바일 앱의 API 서버를 같은 VM에 올리기로 했다. 설계 문서에는 무심코 "기존 nginx에 서버 블록 추가, 기존 MySQL 재사용"이라고 썼다. 메모리 계획을 세우려고 서버를 점검했는데, **nginx도 MySQL도 없었다.** 내가 운영하는 서버의 구조를 정확히 모르고 있었다는 것, 이게 첫 번째 신호였다.

### 점검 1단계: OS 수준에서 보이는 것

```bash
free -m                                   # 메모리
ps -eo pid,rss,comm --sort=-rss | head    # 메모리 많이 쓰는 프로세스
sudo ss -tlnp                             # 열린 포트
sudo ufw status                           # 방화벽
```

| 확인한 것 | 결과 |
|---|---|
| RAM | 3.9GB 중 1.3GB 사용 |
| 메모리 1위 프로세스 | `k3s-server` 588MB — **앱이 아니라 관리 부품이 1위** |
| 외부에 열린 포트 | 22, **6443(k8s API)**, **10250(kubelet)** |
| 방화벽 | **꺼짐** |

### 점검 2단계: 클러스터 안에서 보이는 것

```bash
kubectl get pods -A -o wide
kubectl top pods -A --sort-by=memory
kubectl get pvc -A
sudo du -sh /var/lib/rancher/k3s/storage/*
```

여기서 발견한 것들을 하나씩 따져 봤다.

### 발견 ① 메모리의 28%가 "관리 비용"

| 부품 | 메모리 |
|---|---|
| k3s-server (API 서버·스케줄러·kubelet) | 588MB |
| containerd | 119MB |
| containerd-shim ×13 | 약 234MB |
| traefik · metrics-server · cert-manager ×3 · coredns · local-path | 162MB |
| **관리 부품 합계** | **약 1,103MB** |
| 실제 앱 (api ×2, web ×2, Postgres) | 576MB |

$$
\frac{1103}{3923} \approx 28\%
$$

**앱보다 앱을 관리하는 쪽이 메모리를 두 배 가까이 쓴다.** 같은 앱을 Compose + Caddy로 돌리면 dockerd + containerd + Caddy 합쳐 약 150MB 수준으로 본다. 차이는 약 0.9GB. 4GB VM에서 0.9GB는 새 서비스 하나를 더 올릴 수 있는 크기다. (RSS 합산이라 공유 페이지가 겹쳐 실제보다 조금 클 수 있다.)

### 발견 ② replica 2개는 "같은 기계 위의 2개"

api·web을 2개씩 띄워 두고 가용성을 확보했다고 생각했다. 그런데 노드가 1대다.

| 장애 | k3s (노드 1대) | Compose |
|---|---|---|
| 컨테이너 프로세스가 죽음 | 재시작 | 재시작 (`restart: always`) |
| 살아 있는데 응답 없음 | liveness probe → 재시작<a href="https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/" target="_blank"><sup>[1]</sup></a> | `unhealthy` 표시만<a href="https://docs.docker.com/reference/compose-file/services/#healthcheck" target="_blank"><sup>[2]</sup></a> → autoheal 필요 |
| **VM이 죽음** | **전부 멈춤** | **전부 멈춤** |
| **디스크가 날아감** | **전부 사라짐** | **전부 사라짐** |

쿠버네티스의 본래 가치는 **노드 여러 대에 나눠 띄우고, 한 대가 죽으면 다른 노드로 옮기는 것**이다. 노드 1대에서는 이 핵심이 작동하지 않는다. 내가 얻은 차이는 "응답 없는 프로세스 재시작" 한 줄뿐이었다.

### 발견 ③ 복잡도가 공격 면을 만들었다

6443이 왜 열려 있나 따라가 보니, **CI가 kubeconfig로 k8s API에 직접 접속해 배포하기 때문**이었다. 배포를 편하게 하려고 클러스터 전체를 조종하는 입구를 인터넷에 연 셈이다. 인증이 걸려 있다고 해도 열어 둘 이유는 없다.

그렇다고 방화벽을 그냥 켤 수도 없다. `ufw enable`만 하면 파드 대역(10.42/10.43)까지 막혀 서비스가 멈출 수 있다<a href="https://docs.k3s.io/installation/requirements#inbound-rules-for-k3s-nodes" target="_blank"><sup>[3]</sup></a>. **k3s를 쓰는 순간 방화벽 설정조차 k3s를 알아야 하는 일**이 된다.

### 발견 ④ 정작 중요한 위험은 비어 있었다

::: danger
**백업이 같은 디스크에 있다.** 백업 CronJob은 매일 잘 돌았다. 그런데 저장 위치가 같은 노드의 `local-path` 볼륨이다. VM 디스크가 날아가면 **DB와 백업이 같이 사라진다.** 기계 밖으로 보내는 `rclone` 줄은 주석으로만 남아 있었다.
:::

볼륨 정의에 `10Gi`라고 적어 둔 것도 실제로는 강제되지 않는다. local-path-provisioner README에 "The capacity limit will be ignored for now"라고 명시돼 있다<a href="https://github.com/rancher/local-path-provisioner" target="_blank"><sup>[4]</sup></a>. 모든 볼륨이 결국 VM 디스크 하나를 나눠 쓴다.

장애 알림도 없었다. 서비스가 죽으면 사용자가 먼저 안다.

### 발견 ⑤ 무중단 배포의 가치가 생각보다 낮았다

이 CRM은 사용자가 정해진 사내 시스템이고, 업무시간 밖에 배포할 수 있다. **몇 초 끊기는 배포가 비즈니스에 주는 손해가 거의 없다.** 게다가 무중단 배포는 Compose로도 된다(4절).

### 정리: 복잡도 예산을 어디에 썼나

```mermaid
%% desc: 복잡도를 쓴 곳 vs 비어 있던 곳
flowchart LR
  subgraph Spent["복잡도를 쓴 곳 (있으면 좋은 것)"]
    R["롤링 업데이트"]
    H["replica 2개"]
    C["cert-manager"]
  end
  subgraph Empty["비어 있던 곳 (없으면 망하는 것)"]
    B["기계 밖 백업"]
    F["방화벽"]
    M["장애 알림"]
    T["복구 테스트"]
  end
  Spent -.->|"같은 시간·관심을 썼다면"| Empty
```

**복잡도를 "있으면 좋은 것"에 쓰고, "없으면 망하는 것"은 비워 두었다.** k3s가 나쁜 도구라서가 아니라, 이 규모의 서비스가 실제로 필요로 하는 것과 k3s가 잘하는 것이 어긋나 있었다.

---

## 3. 재사용 이득을 다시 계산하기 — 한 번 버는 시간 vs 매달 내는 비용

처음 판단의 핵심은 "재사용하면 빠르다"였다. 그 판단 자체는 맞았다. 틀린 건 **비교 대상**이다.

| 항목 | 성격 | 크기 |
|---|---|---|
| 배포 코드 재사용으로 아낀 시간 | **한 번** | 며칠 |
| 관리 부품 메모리 | **매달** | VM의 28% (약 0.9GB를 계속 점유) |
| k3s·traefik·cert-manager 업그레이드 | **반복** | 버전마다 CRD·호환성 확인 |
| 방화벽·네트워크를 k3s 기준으로 관리 | **반복** | 설정 하나 바꿀 때마다 |
| 장애 시 볼 곳 | **반복** | 앱 → 파드 → 노드 → k3s, 한 겹 더 |
| CI용 kubeconfig·레지스트리 토큰 관리 | **반복** | 만료·회전 |

::: tip
**"재사용으로 빨라진다"를 판단할 때는, 아낀 시간과 함께 그 선택이 매달 청구하는 비용을 같은 표에 놓아야 한다.** 한 번 버는 이득은 출시 후 사라지지만, 구조가 만든 비용은 서비스가 살아 있는 동안 계속 나온다.
:::

그리고 Compose + Caddy로 갔어도 출시가 크게 늦어졌을까? 배포 문서에 Compose안이 이미 거의 다 쓰여 있었다. **재사용으로 아낀 시간은 생각보다 작았다.**

---

## 4. 그래서 무엇이 최선이었나 — 후보 4개를 같은 기준으로

먼저 이 서비스가 실제로 요구하는 것을 적었다. 이게 판단의 기준이다.

- 서비스 3개(web·api·db), 사용자 수십 명, 노드 1대, 1년 안에 늘릴 계획 없음
- 데이터를 잃으면 안 됨 → **백업·복구가 최우선**
- 업무시간 밖 배포 가능 → 무중단은 "있으면 좋음"
- 운영자 1명 → **운영 복잡도가 낮아야 함**
- 이미 VM이 있음 → 추가 비용은 적을수록 좋음

| 기준 | A. systemd + Caddy (컨테이너 없음) | **B. Compose + Caddy** | C. k3s (노드 1대) | D. PaaS (Railway·Render 등) |
|---|---|---|---|---|
| 관리 메모리 | ✅ 거의 0 | ✅ 약 0.15GB | ❌ 약 1.1GB | ✅ 0 (남의 서버) |
| 실행 환경 재현 | ❌ 서버에 Node·chromium·Postgres 직접 설치 | ✅ 이미지 | ✅ 이미지 | ✅ 이미지 |
| 운영 복잡도 | ⚪ 서비스 파일 여러 개 | ✅ compose 1개 + Caddyfile | ❌ 매니페스트·kubeconfig·CRD | ✅ 낮음 |
| HTTPS | ✅ Caddy 자동 | ✅ Caddy 자동 | ⚪ cert-manager | ✅ 자동 |
| 무중단 배포 | ❌ 직접 구현 | ⚪ docker rollout | ✅ 기본 | ✅ 기본 |
| 응답 없는 프로세스 재시작 | ⚪ systemd watchdog | ⚪ autoheal | ✅ liveness | ✅ |
| 공격 면 | ✅ 22·80·443 | ✅ 22·80·443 | ❌ +6443·10250 | ✅ |
| 비용 | ✅ 기존 VM | ✅ 기존 VM | ✅ 기존 VM | ❌ 월 과금, DB 별도 |
| 노드 늘리기 | ❌ | ❌ 사실상 재설계 | ✅ | ✅ |

- **A가 아닌 이유:** api가 PDF·캡처용 헤드리스 chromium을 쓴다. 서버에 직접 깔면 OS 업데이트 때마다 의존성이 깨질 수 있다. 실행 환경을 이미지로 고정하는 이점이 크다.
- **C가 아닌 이유:** 2절 그대로. 노드 1대에서는 장점 대부분이 작동하지 않고, 비용은 매달 나온다. "노드 늘리기" 칸만 이기는데, 늘릴 계획이 없다.
- **D가 아닌 이유:** 이미 있는 VM을 두고 월 비용을 새로 낼 이유가 약하다. DB까지 옮기면 비용이 더 커진다.
- **B가 최선인 이유:** 이 서비스가 요구하는 것(낮은 운영 복잡도, 이미지 기반 재현, HTTPS 자동, 적은 메모리)을 모두 만족하고, 부족한 두 칸(무중단·멈춘 프로세스 재시작)은 작은 도구로 메울 수 있다.

### B로 했다면: 무중단 배포까지

Compose에서 무중단 배포의 핵심은 두 가지다. 새 컨테이너를 먼저 띄우고 healthy가 되면 옛 컨테이너를 내리는 `docker rollout`<a href="https://github.com/wowu/docker-rollout" target="_blank"><sup>[5]</sup></a>, 그리고 컨테이너를 이름으로 찾는 앞단 프록시다. README 표현 그대로 "같은 이름이나 포트 매핑으로 컨테이너 여러 개를 띄울 수 없기 때문"에 `container_name`과 `ports`를 빼야 한다.

```yaml
# docker-compose.prod.yml (요지)
services:
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
  api:
    image: registry.example.com/crm/api:${TAG}
    # container_name·ports 없음 → 교체 중 2개가 동시에 뜰 수 있음
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 5s
      retries: 3
    restart: always
volumes:
  caddy_data:
```

```plaintext
# Caddyfile — 인증서 발급·갱신 자동
crm.example.com {
    reverse_proxy api:3000 {
        lb_try_duration 5s   # 옛 컨테이너가 내려가는 순간 실패한 요청을 재시도
    }
}
```

```bash
docker compose pull
docker compose run --rm api npx prisma migrate deploy   # 마이그레이션 1회
docker rollout api                                      # 새 컨테이너 healthy → 옛것 제거
```

::: note
README는 프록시 예로 Traefik·nginx-proxy를 든다. Caddy 구성은 Docker 내부 DNS로 서비스 이름을 찾고, 교체 순간을 `lb_try_duration` 재시도로 메우는 방식이다. 이 부분은 README 범위 밖이라 실제 배포 전에 부하를 걸어 확인해야 한다.
:::

cert-manager + ClusterIssuer + Ingress annotation 세 겹이, Caddyfile 세 줄이 된다<a href="https://caddyserver.com/docs/automatic-https" target="_blank"><sup>[6]</sup></a>. 아낀 메모리와 시간은 **기계 밖 백업, 복구 테스트, 장애 알림**에 쓴다.

---

## 5. 다음에 같은 결정을 할 때 쓸 기준

이번 일을 겪고 아키텍처를 고를 때 스스로 묻는 질문을 정리했다.

::: tip
**1. 이 도구의 핵심 가치가 내 규모에서 작동하는가?**
k8s의 핵심은 여러 노드 스케줄링과 노드 장애 대응이다. 노드가 1대면 작동하지 않는다. "기능 목록"이 아니라 **"핵심 가치가 내 조건에서 켜지는가"**를 본다.

**2. 이득은 한 번인가, 매달인가? 비용은?**
재사용·익숙함은 대개 한 번 버는 이득이고, 구조가 만든 비용은 매달 나온다. 둘을 같은 표에 놓고 **숫자로** 계산한다.

**3. 복잡도를 "없으면 망하는 것"에 먼저 썼는가?**
백업(기계 밖) → 복구 테스트 → 장애 알림 → 방화벽. 이게 채워지기 전에 무중단 배포나 오토스케일링에 복잡도를 쓰지 않는다.

**4. 이 서비스가 실제로 요구하는 것을 먼저 적었는가?**
사용자 수, 허용 가능한 중단 시간, 운영 인원, 1년 안의 확장 계획. 도구 비교는 그다음이다.

**5. 바꿀 조건을 미리 적어 두었는가?**
"노드를 2대 이상으로 늘릴 때 k3s로 간다"처럼, 다음 결정의 트리거를 지금 적어 둔다.
:::

### 지금은 어떻게 하나

당장 갈아엎지는 않는다. 잘 돌아가는 운영 서버를 옮기는 위험이 아낄 0.9GB보다 크다. 대신 순서를 바로잡는다.

1. 백업을 VM 밖으로 보내고, 그 백업으로 실제 복구를 한 번 해 본다
2. 방화벽 규칙을 k3s 대역까지 고려해 켜고, 6443은 CI 러너 IP만 허용한다
3. 외부 헬스 체크와 장애 알림을 붙인다
4. **VM 메모리 사용이 75%를 넘거나 다음 큰 인프라 작업이 생기면 Compose + Caddy로 옮긴다**

---

## 마치며

k3s를 고른 판단은 그 순간에는 합리적이었다. 빨리 출시해야 했고, 검증된 코드가 있었다. 틀린 건 도구가 아니라 **트레이드오프 표의 한쪽 칸을 숫자로 채우지 않았다**는 점이다.

아키텍처 결정은 정답을 맞히는 일이 아니라 **무엇을 내주고 무엇을 받았는지 기록하고, 조건이 바뀌면 다시 계산하는 일**이라고 생각한다. 이번에는 시스템을 직접 뜯어보고 나서야 그 계산을 했다. 다음에는 결정하는 시점에 한다.

---

## 참고

<a href="https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/" target="_blank">[1] Liveness, Readiness, and Startup Probes — Kubernetes</a>

<a href="https://docs.docker.com/reference/compose-file/services/#healthcheck" target="_blank">[2] Compose file reference: healthcheck — Docker Docs</a>

<a href="https://docs.k3s.io/installation/requirements#inbound-rules-for-k3s-nodes" target="_blank">[3] Requirements: Inbound Rules for K3s Nodes — K3s Docs</a>

<a href="https://github.com/rancher/local-path-provisioner" target="_blank">[4] local-path-provisioner — Rancher — GitHub</a>

<a href="https://github.com/wowu/docker-rollout" target="_blank">[5] docker-rollout — Zero downtime deployment for Docker Compose — GitHub</a>

<a href="https://caddyserver.com/docs/automatic-https" target="_blank">[6] Automatic HTTPS — Caddy Documentation</a>

---

## 관련 글

- [GitOps 파이프라인 완전 정복 — Jenkins + ArgoCD + k3s로 코드를 서버에 배포하기 →](/post/jenkins-argocd-gitops)
- [K8s에서 MySQL 백업 다시 짜기 — rsync에서 CronJob+mysqldump로 →](/post/mysql-backup-k8s)
- [백업의 증명 — K3s에서 mysqldump 복구 테스트 →](/post/mysql-restore-test)
- [Docker Compose 기초 — env_file, 변수 치환, depends_on →](/post/docker-compose-basics)
- [kubectl 실전 — 로그 확인, 컨테이너 접속, 리소스 모니터링 →](/post/kubectl-debugging)
