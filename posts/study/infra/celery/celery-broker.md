---
title: Celery Broker — Redis vs RabbitMQ, 메시지 보장의 기초
slug: celery-broker
category: study/infra/celery
tags: [Celery, Broker, Redis, RabbitMQ, AMQP, MessageQueue, Durability, Acknowledgment, Python]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-03-26
excerpt: Celery 브로커가 하는 일, Redis와 RabbitMQ의 차이, AMQP 메시지 보장(Durability, Acknowledgment)이 태스크 손실을 어떻게 방지하는지 설명한다.
---

## 브로커란 무엇인가

**브로커(Message Broker)**는 Producer(Django 뷰, Beat)가 발행한 태스크 메시지를 저장하고,
Worker가 요청할 때까지 보관하는 **중간 저장소**다.[^celery-broker-docs]

```mermaid
%% desc: 브로커의 역할 — Producer와 Worker를 분리하는 중간 메시지 저장소
flowchart LR
  subgraph PROD["Producer"]
    DJ["Django 뷰"]
    BEAT["Celery Beat"]
  end

  subgraph BROKER["메시지 브로커"]
    Q1["큐: default"]
    Q2["큐: email"]
    Q3["큐: reports"]
  end

  subgraph CONSUMER["Consumer"]
    W1["Worker 1"]
    W2["Worker 2"]
    W3["Worker 3"]
  end

  DJ --> Q1 & Q2
  BEAT --> Q1 & Q3
  Q1 --> W1
  Q2 --> W2
  Q3 --> W3
```

브로커 덕분에 Producer와 Worker가 **완전히 분리**된다.
Worker가 잠시 다운돼도 메시지는 큐에 보관되고, Worker가 재시작하면 처리된다.

## Redis 브로커

Redis는 Celery에서 가장 많이 쓰이는 브로커다.[^redis-celery]

```python
# settings.py
CELERY_BROKER_URL = "redis://localhost:6379/0"
# 비밀번호 사용
CELERY_BROKER_URL = "redis://:mypassword@localhost:6379/0"
# Redis Sentinel (고가용성)
CELERY_BROKER_URL = "sentinel://localhost:26379;sentinel://localhost:26380/0"
```

### Redis 브로커의 동작

Redis는 리스트(List) 자료구조를 큐로 사용한다.

```mermaid
%% desc: Redis 브로커의 LPUSH/BRPOP 메커니즘 — 태스크 발행과 소비
sequenceDiagram
  participant PROD as Producer
  participant REDIS as Redis
  participant WORKER as Worker

  PROD->>REDIS: LPUSH celery {task_message}
  Note over REDIS: 리스트에 메시지 추가

  WORKER->>REDIS: BRPOP celery 0 (블로킹 대기)
  REDIS-->>WORKER: 메시지 반환
  Note over WORKER: 태스크 실행

  alt ACK Late 설정 시
    WORKER->>REDIS: 완료 후 별도 처리
  end
```

### Redis 브로커의 주의점

Redis는 기본적으로 **인메모리** 저장소다.
서버가 재시작되면 큐의 메시지가 사라질 수 있다.

```python
# Redis 영속성 설정 (redis.conf)
# AOF (Append Only File) — 모든 명령 로그
appendonly yes
appendfsync everysec

# RDB 스냅샷
save 900 1
save 300 10
```

또한 Redis는 ACK를 **Celery 레벨**에서 처리한다.
Worker가 태스크를 가져간 후 프로세스가 죽으면 메시지가 손실될 수 있다.

```python
# Worker가 태스크 완료 후 ACK를 전송하도록 설정 (기본: 시작 후 즉시 ACK)
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
```

## RabbitMQ 브로커

RabbitMQ는 AMQP(Advanced Message Queuing Protocol) 기반의 전용 메시지 브로커다.[^rabbitmq-docs]

```python
# settings.py
CELERY_BROKER_URL = "amqp://guest:guest@localhost:5672//"
# vhost 지정
CELERY_BROKER_URL = "amqp://myuser:mypassword@localhost:5672/myvhost"
```

### AMQP 구조

RabbitMQ는 Exchange → Binding → Queue의 라우팅 구조를 갖는다.

```mermaid
%% desc: RabbitMQ AMQP 구조 — Exchange가 라우팅 키 기반으로 메시지를 큐에 분배
flowchart LR
  PROD["Producer\n(Django/Beat)"]

  subgraph RABBIT["RabbitMQ"]
    subgraph EXCHANGE["Exchange"]
      EX["celery\n(direct type)"]
    end

    subgraph QUEUES["Queues"]
      Q1["celery (default)"]
      Q2["email"]
      Q3["reports"]
    end
  end

  WORKER1["Worker 1\n(default 큐)"]
  WORKER2["Worker 2\n(email 큐)"]
  WORKER3["Worker 3\n(reports 큐)"]

  PROD -- "routing_key=celery" --> EX
  PROD -- "routing_key=email" --> EX
  EX -- "binding: celery→celery" --> Q1
  EX -- "binding: email→email" --> Q2
  EX -- "binding: reports→reports" --> Q3
  Q1 --> WORKER1
  Q2 --> WORKER2
  Q3 --> WORKER3
```

### RabbitMQ 메시지 보장

RabbitMQ는 AMQP 수준에서 메시지 보장을 제공한다.

**1. 메시지 영속성 (Durability)**

```python
# settings.py
CELERY_TASK_SERIALIZER = "json"
CELERY_BROKER_TRANSPORT_OPTIONS = {
    "delivery_mode": 2,  # PERSISTENT (재시작 후에도 보존)
}
```

**2. Publisher Confirm**

```python
CELERY_BROKER_TRANSPORT_OPTIONS = {
    "confirm_publish": True,  # 브로커가 수신 확인 후 발행 완료
}
```

**3. Consumer ACK**

RabbitMQ는 Worker가 명시적으로 ACK를 보내야 메시지를 큐에서 제거한다.
ACK 전에 Worker가 죽으면 메시지가 **자동으로 다른 Worker에 재분배**된다.

```mermaid
%% desc: RabbitMQ의 Consumer ACK — Worker 장애 시 메시지 자동 재분배
sequenceDiagram
  participant RABBIT as RabbitMQ
  participant W1 as Worker 1 (장애)
  participant W2 as Worker 2

  RABBIT->>W1: 메시지 전달 (unacked 상태)
  Note over W1: 태스크 실행 중
  W1->>W1: 프로세스 크래시!

  Note over RABBIT: Heartbeat 실패 감지
  RABBIT->>W2: 메시지 재전달 (requeue)
  W2->>W2: 태스크 실행
  W2->>RABBIT: basic.ack
  Note over RABBIT: 메시지 큐에서 제거
```

## Redis vs RabbitMQ 비교

| 항목 | Redis | RabbitMQ |
|------|-------|----------|
| **프로토콜** | Redis Protocol | AMQP 0-9-1 |
| **설치 복잡도** | 낮음 | 중간 |
| **메시지 영속성** | 설정 필요 (AOF/RDB) | 기본 지원 |
| **ACK 보장** | Celery 레벨 | AMQP 레벨 (더 강력) |
| **성능** | 매우 높음 | 높음 |
| **라우팅** | 단순 | Exchange/Binding으로 복잡한 라우팅 |
| **관리 UI** | Redis Commander | RabbitMQ Management Plugin |
| **동시 용도** | 캐시, 세션 등 다용도 | 전용 메시지 브로커 |
| **추천 케이스** | 빠른 개발, 단순 태스크 | 메시지 손실 불허, 복잡한 라우팅 |

## Result Backend

브로커와 별도로 **Result Backend**는 태스크 실행 결과를 저장한다.

```python
# Redis를 Result Backend로
CELERY_RESULT_BACKEND = "redis://localhost:6379/1"

# Django DB를 Result Backend로 (django-celery-results)
CELERY_RESULT_BACKEND = "django-db"

# 결과 만료 시간 (기본 24시간)
CELERY_RESULT_EXPIRES = 3600  # 1시간
```

결과를 조회하지 않는다면 Result Backend 설정을 생략하거나 무시(ignore)할 수 있다.

```python
@shared_task(ignore_result=True)
def fire_and_forget_task():
    do_something()
```

## 연결 풀과 재연결

```python
# settings.py
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True   # 시작 시 연결 실패 재시도
CELERY_BROKER_CONNECTION_MAX_RETRIES = 10
CELERY_BROKER_POOL_LIMIT = 10                       # 연결 풀 크기
```

## 관련 글

- [Django + Celery 개요](/post/celery-django): 브로커 설정을 포함한 전체 Celery 설정
- [Celery Worker — 내부 구조와 동시성 모델](/post/celery-worker): ACK 설정과 Prefetch가 브로커 메시지 보장에 미치는 영향
- [Celery Beat — 주기적 태스크 스케줄링](/post/celery-beat): Beat가 브로커에 발행하는 스케줄 메시지

---

[^celery-broker-docs]: Celery Brokers, <a href="https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/index.html" target="_blank">Celery Docs</a>
[^redis-celery]: Using Redis with Celery, <a href="https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/redis.html" target="_blank">Celery Docs</a>
[^rabbitmq-docs]: RabbitMQ, <a href="https://www.rabbitmq.com/docs" target="_blank">RabbitMQ Docs</a>
[^amqp]: AMQP 0-9-1 Model, <a href="https://www.rabbitmq.com/tutorials/amqp-concepts" target="_blank">RabbitMQ</a>
[^django-celery-results]: django-celery-results, <a href="https://github.com/celery/django-celery-results" target="_blank">GitHub</a>
