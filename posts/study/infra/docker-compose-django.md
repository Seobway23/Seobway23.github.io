---
title: Docker Compose로 Django 5개 서비스 띄우기
slug: docker-compose-django
category: study/infra
tags: [Docker, DockerCompose, Django, MySQL, Redis, Celery, Gunicorn, DevOps]
author: Seobway
readTime: 15
featured: false
createdAt: 2026-03-26
excerpt: MySQL, Redis, Django(Gunicorn), Celery Worker, Celery Beat — 5개 서비스를 docker-compose.yml 하나로 올리는 실전 구성과 자주 막히는 포인트를 설명한다.
---

## 구성 목표

로컬 개발 환경에서 다음 5개 서비스를 한 번에 올린다.

| 서비스 | 역할 | 이미지 |
|--------|------|--------|
| `db` | MySQL 8.0 데이터베이스 | `mysql:8.0` |
| `redis` | 메시지 브로커 / 캐시 | `redis:7-alpine` |
| `web` | Django + Gunicorn | 로컬 Dockerfile |
| `worker` | Celery Worker | 로컬 Dockerfile |
| `beat` | Celery Beat 스케줄러 | 로컬 Dockerfile |

```mermaid
%% desc: 5개 서비스의 의존 관계 — db/redis가 먼저 healthy 상태가 돼야 나머지가 시작
flowchart TD
  subgraph INFRA["인프라 레이어"]
    DB["db\n(MySQL 8.0)\nPort: 3306"]
    REDIS["redis\n(Redis 7)\nPort: 6379"]
  end

  subgraph APP["애플리케이션 레이어"]
    WEB["web\n(Django + Gunicorn)\nPort: 8000"]
    WORKER["worker\n(Celery Worker)"]
    BEAT["beat\n(Celery Beat)"]
  end

  DB -- "healthcheck 통과 후" --> WEB & WORKER & BEAT
  REDIS -- "healthcheck 통과 후" --> WEB & WORKER & BEAT
  WEB -- "태스크 발행" --> REDIS
  BEAT -- "스케줄 발행" --> REDIS
  REDIS -- "태스크 전달" --> WORKER
  WEB & WORKER -- "DB 읽기/쓰기" --> DB
```

## 파일 구조

```
myproject/
├── docker-compose.yml
├── Dockerfile
├── .env                 ← Compose 변수 치환용 (WEB_PORT 등)
├── .env.local           ← 컨테이너 환경변수 (시크릿, DB URL 등)
├── requirements.txt
└── config/
    └── settings/
        ├── base.py
        ├── local.py
        └── production.py
```

## docker-compose.yml

```yaml
version: "3.9"

services:
  db:
    image: mysql:8.0
    container_name: pms_v3-mysql
    restart: unless-stopped
    env_file:
      - .env.local
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 30s
    networks:
      - pms_network

  redis:
    image: redis:7-alpine
    container_name: pms_v3-redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - pms_network

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pms_v3-web
    restart: unless-stopped
    ports:
      - "${WEB_PORT}:${WEB_PORT}"
    env_file:
      - .env.local
    volumes:
      - .:/app
      - static_files:/app/staticfiles
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      gunicorn config.wsgi:application
        --bind 0.0.0.0:${WEB_PORT}
        --workers 2
        --timeout 120
    networks:
      - pms_network

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pms_v3-worker
    restart: unless-stopped
    env_file:
      - .env.local
    volumes:
      - .:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: celery -A config worker --loglevel=info -Q default
    networks:
      - pms_network

  beat:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: pms_v3-beat
    restart: unless-stopped
    env_file:
      - .env.local
    volumes:
      - .:/app
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: >
      celery -A config beat
        --scheduler django_celery_beat.schedulers:DatabaseScheduler
        --loglevel=info
    networks:
      - pms_network

volumes:
  mysql_data:
  static_files:

networks:
  pms_network:
    driver: bridge
```

## 환경변수 파일 구성

### .env — Compose 변수 치환용

```bash
# .env (git에 커밋 가능, 단순 포트/이름만)
WEB_PORT=8000
COMPOSE_PROJECT_NAME=pms_v3
```

### .env.local — 컨테이너 내부 환경변수용

```bash
# .env.local (반드시 .gitignore에 추가!)

# Django
DJANGO_SETTINGS_MODULE=config.settings.local
DJANGO_SECRET_KEY=your-secret-key-here-change-this
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL (MySQL 컨테이너 초기화에도 사용)
MYSQL_DATABASE=pms_db
MYSQL_USER=pms_user
MYSQL_PASSWORD=pms_password
MYSQL_ROOT_PASSWORD=root_password

# DATABASE_URL (web, worker, beat 컨테이너용)
# 호스트명 = MySQL 서비스 이름 (pms_v3-mysql)
DATABASE_URL=mysql://pms_user:pms_password@pms_v3-mysql:3306/pms_db

# Redis
REDIS_URL=redis://pms_v3-redis:6379/0
CELERY_BROKER_URL=redis://pms_v3-redis:6379/0
CELERY_RESULT_BACKEND=redis://pms_v3-redis:6379/1
```

## Dockerfile

```dockerfile
FROM python:3.12-slim

# 시스템 패키지 (mysqlclient 빌드에 필요)
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
```

## 실행 순서

```bash
# 1. 첫 실행
docker compose up -d

# 2. 컨테이너 상태 확인 (db/redis가 healthy인지 확인)
docker compose ps

# 3. 마이그레이션
docker compose exec web python manage.py migrate

# 4. 정적 파일 수집
docker compose exec web python manage.py collectstatic --noinput

# 5. 슈퍼유저 생성
docker compose exec web python manage.py createsuperuser
```

## 자주 막히는 포인트

### 1. DB 접속 에러 1045 (Access Denied)

```
django.db.utils.OperationalError: (1045, "Access denied for user 'pms_user'@...")
```

**원인**: 두 가지 중 하나

```mermaid
%% desc: DB 1045 에러의 두 가지 원인과 해결 흐름
flowchart TD
  ERR["1045 Access Denied"]

  A["원인 1: mysql_data 볼륨이 이미 존재\n이전 비밀번호로 초기화된 상태\n새 MYSQL_PASSWORD가 적용 안 됨"]
  B["원인 2: DATABASE_URL의 계정 정보와\nMYSQL_USER/MYSQL_PASSWORD 불일치"]

  SOL_A["해결: docker compose down -v\n볼륨 삭제 후 재시작"]
  SOL_B["해결: .env.local에서\nDATABASE_URL ↔ MYSQL_* 값 통일"]

  ERR --> A & B
  A --> SOL_A
  B --> SOL_B
```

```bash
# 볼륨 포함 완전 초기화 (로컬 환경에서만)
docker compose down -v
docker compose up -d
```

### 2. Compose 변수 치환 에러

```
invalid interpolated value: mandatory variable 'WEB_PORT' is not set
```

프로젝트 루트에 `.env` 파일이 없어서 발생.
`env_file:`에 지정한 파일은 치환에 쓰이지 않는다.

```bash
echo "WEB_PORT=8000" > .env
docker compose up -d
```

### 3. web이 DB보다 먼저 시작돼 연결 실패

`depends_on`만 설정하고 `healthcheck`가 없으면 발생한다.
위 `docker-compose.yml`의 healthcheck 설정을 그대로 사용하면 해결된다.

## 관련 글

- [Docker 기초 — Image, Container, Volume, Network](/post/docker-basics): 서비스 구성의 기본 개념
- [Docker Compose 기초 — env_file, interpolation, depends_on](/post/docker-compose-basics): .env 파일 구분과 healthcheck 상세
- [Django settings 분리와 환경변수 관리](/post/django-settings): DJANGO_SETTINGS_MODULE, django-environ, DATABASE_URL 설정법

---

[^compose-docs]: Docker Inc., <a href="https://docs.docker.com/compose/" target="_blank">Docker Compose 공식 문서</a>
[^mysql-docker]: Docker Hub, <a href="https://hub.docker.com/_/mysql" target="_blank">mysql — Official Docker Image</a>
[^redis-docker]: Docker Hub, <a href="https://hub.docker.com/_/redis" target="_blank">redis — Official Docker Image</a>
[^gunicorn-docs]: Gunicorn, <a href="https://docs.gunicorn.org/en/stable/settings.html" target="_blank">Gunicorn Settings</a>
[^compose-healthcheck]: Docker Inc., <a href="https://docs.docker.com/reference/compose-file/services/#healthcheck" target="_blank">healthcheck — Compose reference</a>
