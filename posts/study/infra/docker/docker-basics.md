---
title: Docker 기초 — Image, Container, Volume, Network
slug: docker-basics
category: study/infra/docker
tags: [Docker, Container, Image, Volume, Network, DockerCLI]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-03-26
excerpt: Docker의 핵심 개념인 Image와 Container의 차이, Volume으로 데이터를 영속하는 방법, 컨테이너 간 통신을 가능하게 하는 Network를 설명한다.
---

## 왜 Docker인가

"내 컴퓨터에서는 됐는데요"

협업할 때 가장 많이 듣는 말이다.
Python 버전, 라이브러리 버전, OS 차이... 원인은 늘 **환경 불일치**다.

Docker는 애플리케이션과 그 실행 환경을 함께 패키징한다.
이미지를 받으면 어느 환경에서나 동일하게 실행된다.[^docker-overview]

```mermaid
%% desc: Docker가 해결하는 문제 — 환경 불일치에서 환경 일관성으로
flowchart LR
  subgraph BEFORE["Docker 이전"]
    D1["개발자 A\nPython 3.10\nmysqlclient 2.1"]
    D2["개발자 B\nPython 3.12\nmysqlclient 2.2"]
    D3["서버\nPython 3.9\nmysqlclient 1.4"]
    ERR["❌ 버전 충돌\n환경 불일치"]
    D1 & D2 & D3 --> ERR
  end

  subgraph AFTER["Docker 이후"]
    IMG["Docker Image\n(환경 포함)"]
    R1["개발자 A\n✅ 동일 환경"]
    R2["개발자 B\n✅ 동일 환경"]
    R3["서버\n✅ 동일 환경"]
    IMG --> R1 & R2 & R3
  end
```

## Image vs Container

가장 먼저 잡아야 할 개념이다.

| | Image | Container |
|--|-------|-----------|
| **정의** | 실행 환경의 스냅샷 (read-only) | Image를 실행한 인스턴스 |
| **상태** | 불변 (Immutable) | 가변 (실행 중 상태 변화) |
| **비유** | 클래스 (Class) | 인스턴스 (Instance) |
| **저장** | Docker Hub / 레지스트리 | 로컬 도커 데몬 |

```mermaid
%% desc: Image를 여러 Container로 실행하는 관계 — 하나의 Image에서 N개의 Container
flowchart TD
  IMG["🖼️ Django Image\n(python:3.12 + requirements.txt)"]

  C1["Container 1\n(web 서버, port 8000)"]
  C2["Container 2\n(celery worker)"]
  C3["Container 3\n(celery beat)"]

  IMG --> C1
  IMG --> C2
  IMG --> C3
```

하나의 Image에서 여러 Container를 띄울 수 있다.
Container가 삭제돼도 Image는 남아있다.

### 기본 명령어

```bash
# 이미지 빌드 (Dockerfile 기반)
docker build -t myapp:latest .

# 이미지 목록
docker images

# 컨테이너 실행
docker run -d --name myapp -p 8000:8000 myapp:latest

# 실행 중인 컨테이너 목록
docker ps

# 모든 컨테이너 (중지 포함)
docker ps -a

# 컨테이너 로그
docker logs myapp
docker logs -f myapp          # follow (실시간)

# 컨테이너 내부 접속
docker exec -it myapp bash

# 컨테이너 중지/삭제
docker stop myapp
docker rm myapp
```

## Volume — 데이터 영속성

컨테이너는 삭제되면 내부 데이터도 함께 사라진다.
DB 데이터, 업로드 파일처럼 영속해야 하는 데이터는 **Volume**에 저장해야 한다.[^docker-volumes]

Volume의 종류:

| 타입 | 형식 | 특징 |
|------|------|------|
| **Named Volume** | `mysql_data:/var/lib/mysql` | Docker가 관리. 이름으로 참조. 권장 |
| **Bind Mount** | `./src:/app/src` | 호스트 경로 직접 마운트. 개발 시 코드 동기화 |
| **tmpfs** | `type=tmpfs` | 메모리에만 저장. 컨테이너 종료 시 삭제 |

```mermaid
%% desc: Named Volume vs Bind Mount의 데이터 흐름 차이
flowchart LR
  subgraph HOST["호스트"]
    HF["./src 디렉토리"]
    DV["Docker Named Volume\nmysql_data"]
  end

  subgraph CONTAINERS["컨테이너"]
    WEB["/app/src\n(소스코드 동기화)"]
    DB["/var/lib/mysql\n(DB 데이터 영속)"]
  end

  HF -- "Bind Mount\n코드 변경 즉시 반영" --> WEB
  DV -- "Named Volume\n컨테이너 삭제 후에도 보존" --> DB
```

```bash
# Named Volume 생성
docker volume create mysql_data

# Volume 목록
docker volume ls

# Volume 상세 정보
docker volume inspect mysql_data

# Volume 삭제 (데이터 삭제 주의!)
docker volume rm mysql_data

# 컨테이너와 Volume 함께 삭제
docker compose down -v
```

> `docker compose down -v`는 Named Volume까지 삭제한다.
> DB를 완전 초기화할 때 유용하지만, **운영 환경에서 절대 사용 금지**.

## Network — 컨테이너 간 통신

컨테이너는 기본적으로 격리된 환경이다.
서로 통신하려면 같은 **Network**에 속해야 한다.[^docker-network]

Docker Compose는 자동으로 프로젝트 단위 네트워크를 생성한다.
같은 Compose 파일의 서비스끼리는 **서비스 이름**으로 접근할 수 있다.

```mermaid
%% desc: Docker 내부 네트워크에서 서비스 이름으로 통신하는 구조
flowchart LR
  subgraph NETWORK["Docker Bridge Network (pms_v3_default)"]
    WEB["web\n(Django)\n172.18.0.2"]
    MYSQL["pms_v3-mysql\n172.18.0.3"]
    REDIS["pms_v3-redis\n172.18.0.4"]
    WORKER["worker\n(Celery)\n172.18.0.5"]
  end

  WEB -- "mysql://pms_v3-mysql:3306" --> MYSQL
  WEB -- "redis://pms_v3-redis:6379" --> REDIS
  WORKER -- "redis://pms_v3-redis:6379" --> REDIS

  HOST["호스트"] -- "localhost:8000" --> WEB
```

컨테이너 내부에서 DB에 접속할 때 `localhost`가 아니라 **서비스 이름**을 써야 한다.

```python
# 잘못된 예: 컨테이너 내부에서 localhost는 자기 자신을 가리킴
DATABASE_URL = "mysql://user:pass@localhost:3306/mydb"  # ❌

# 올바른 예: 서비스 이름으로 접근
DATABASE_URL = "mysql://user:pass@pms_v3-mysql:3306/mydb"  # ✅
```

### 포트 매핑

컨테이너의 포트를 호스트에 노출할 때 `ports`를 사용한다.

```yaml
services:
  web:
    ports:
      - "8000:8000"    # 호스트:컨테이너
```

- 왼쪽(8000): 호스트에서 접근하는 포트 (`localhost:8000`)
- 오른쪽(8000): 컨테이너 내부 포트

내부 통신에는 포트 매핑이 필요 없다. `pms_v3-mysql:3306`처럼 컨테이너 내부 포트로 바로 접근한다.

## Dockerfile 기초

Image를 빌드하는 설계도다.

```dockerfile
# Dockerfile
FROM python:3.12-slim          # 베이스 이미지

WORKDIR /app                   # 작업 디렉토리

# 의존성 먼저 복사 (레이어 캐시 활용)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

# 포트 노출 (문서 목적, 실제 바인딩은 ports:로)
EXPOSE 8000

# 기본 실행 명령
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```mermaid
%% desc: Dockerfile 레이어 구조 — 각 명령이 레이어를 쌓고, 변경 시 해당 레이어부터 재빌드
flowchart TD
  L1["FROM python:3.12-slim\n(Base Layer)"]
  L2["WORKDIR /app"]
  L3["COPY requirements.txt ."]
  L4["RUN pip install ...\n(의존성 레이어 — 자주 캐시됨)"]
  L5["COPY . .\n(소스 레이어 — 코드 변경 시 여기부터 재빌드)"]
  L6["CMD gunicorn ..."]

  L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

## 관련 글

- [Docker Compose 기초 — env_file, interpolation, depends_on](/post/docker-compose-basics): 이 글의 개념을 바탕으로 Compose 파일 작성법
- [Docker Compose로 Django 5개 서비스 띄우기](/post/docker-compose-django): 실전 Django + MySQL + Redis + Celery 구성

---

[^docker-overview]: Docker Inc., <a href="https://docs.docker.com/get-started/docker-overview/" target="_blank">Docker Overview</a>
[^docker-volumes]: Docker Inc., <a href="https://docs.docker.com/engine/storage/volumes/" target="_blank">Volumes — Docker Docs</a>
[^docker-network]: Docker Inc., <a href="https://docs.docker.com/engine/network/" target="_blank">Networking overview — Docker Docs</a>
[^dockerfile-ref]: Docker Inc., <a href="https://docs.docker.com/reference/dockerfile/" target="_blank">Dockerfile reference</a>
