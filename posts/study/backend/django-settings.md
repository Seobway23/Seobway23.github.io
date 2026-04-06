---
title: Django settings 분리와 환경변수 관리 — django-environ, DATABASE_URL
slug: django-settings
category: study/backend
tags: [Django, Settings, djangoenviron, DATABASE_URL, WSGI, Gunicorn, EnvironmentVariables, Python]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-03-26
excerpt: Django settings를 환경별로 분리하는 방법, django-environ으로 .env 파일을 읽는 방법, DATABASE_URL 형식이 Docker 서비스명과 어떻게 연결되는지를 설명한다.
---

## 왜 settings를 분리해야 하는가

기본 `settings.py` 하나에 모든 설정을 담으면 문제가 생긴다.

```python
# 이렇게 하면 안 된다
DEBUG = True                         # 운영에서 True면 장애
DATABASES = {
    "default": {
        "HOST": "localhost",         # 운영 서버에선 다른 주소
        "PASSWORD": "1234",          # 시크릿이 코드에 노출
    }
}
ALLOWED_HOSTS = ["*"]               # 운영에서 보안 취약
```

문제:
1. **시크릿 유출** — `SECRET_KEY`, DB 비밀번호가 Git에 올라감
2. **환경 불일치** — 로컬/스테이징/운영 설정이 다른데 하나의 파일로 관리 불가
3. **배포 위험** — `DEBUG=True`가 운영에 올라가는 실수

## settings 분리 패턴

```
config/
└── settings/
    ├── __init__.py
    ├── base.py         ← 공통 설정 (앱 목록, 미들웨어 등)
    ├── local.py        ← 로컬 개발용 (DEBUG=True, 느슨한 보안)
    └── production.py   ← 운영용 (DEBUG=False, 엄격한 보안)
```

```mermaid
%% desc: DJANGO_SETTINGS_MODULE 환경변수로 환경별 settings 파일을 선택하는 흐름
flowchart LR
  ENV["DJANGO_SETTINGS_MODULE\n환경변수"]

  LOCAL["config.settings.local\nDEBUG=True\nDB=localhost"]
  PROD["config.settings.production\nDEBUG=False\nDB=prod-db.internal"]

  ENV -- "=config.settings.local" --> LOCAL
  ENV -- "=config.settings.production" --> PROD

  BASE["config.settings.base\n(공통 설정)\nINSTALLED_APPS\nMIDDLEWARE\n..."]
  LOCAL & PROD -- "from .base import *" --> BASE
```

```python
# config/settings/base.py
from pathlib import Path
import environ

env = environ.Env()
BASE_DIR = Path(__file__).resolve().parent.parent.parent

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    ...
    "rest_framework",
    "django_celery_beat",
    "myapp",
]

MIDDLEWARE = [...]
ROOT_URLCONF = "config.urls"
```

```python
# config/settings/local.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

# .env.local 파일 읽기
environ.Env.read_env(BASE_DIR / ".env.local")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DATABASES = {"default": env.db("DATABASE_URL")}

CELERY_BROKER_URL = env("CELERY_BROKER_URL")
```

```python
# config/settings/production.py
from .base import *

DEBUG = False
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DATABASES = {"default": env.db("DATABASE_URL")}

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

## django-environ — 환경변수 읽기

**django-environ**은 `.env` 파일을 읽고 타입 변환까지 해주는 라이브러리다.[^django-environ]

```bash
pip install django-environ
```

```python
import environ

env = environ.Env(
    # 기본값 설정 (타입 명시)
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)
```

### env() 동작 방식

```mermaid
%% desc: env()가 환경변수를 읽는 우선순위 — 쉘 > .env 파일 > 기본값
flowchart LR
  SHELL["쉘 환경변수\nexport DJANGO_SECRET_KEY=..."]
  FILE[".env.local 파일\nDJANGO_SECRET_KEY=..."]
  DEFAULT["기본값\nenv('KEY', default=None)"]

  ENV["env('DJANGO_SECRET_KEY')"]

  SHELL -- "1순위" --> ENV
  FILE -- "2순위 (read_env 호출 시)" --> ENV
  DEFAULT -- "3순위" --> ENV

  RESULT["값 반환\n(없으면 ImproperlyConfigured 예외)"]
  ENV --> RESULT
```

```python
# .env.local 파일을 읽도록 등록
environ.Env.read_env(BASE_DIR / ".env.local")

# 필수값 (없으면 ImproperlyConfigured 예외 발생)
SECRET_KEY = env("DJANGO_SECRET_KEY")

# 선택값 (없으면 None 반환)
SENTRY_DSN = env("SENTRY_DSN", default=None)

# 타입 변환
DEBUG = env.bool("DEBUG", default=False)
PORT = env.int("PORT", default=8000)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost"])
```

## DATABASE_URL — 한 줄로 DB 연결 설정

`DATABASE_URL`은 DB 연결 정보를 URI 형식으로 표현하는 관례다.[^twelve-factor]

```
mysql://USER:PASSWORD@HOST:PORT/DBNAME
```

예시:

```bash
# 로컬 MySQL
DATABASE_URL=mysql://root:1234@localhost:3306/mydb

# Docker Compose 환경 (서비스 이름이 호스트)
DATABASE_URL=mysql://pms_user:pms_password@pms_v3-mysql:3306/pms_db

# PostgreSQL
DATABASE_URL=postgres://user:pass@db-host:5432/mydb

# SQLite (테스트용)
DATABASE_URL=sqlite:///./db.sqlite3
```

django-environ이 이 URL을 Django `DATABASES` dict로 변환한다.

```python
# settings.py
DATABASES = {"default": env.db("DATABASE_URL")}

# 위 한 줄은 아래와 동일
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "pms_db",
        "USER": "pms_user",
        "PASSWORD": "pms_password",
        "HOST": "pms_v3-mysql",   # Docker Compose 서비스 이름
        "PORT": "3306",
    }
}
```

### Docker Compose에서 HOST는 서비스 이름

```mermaid
%% desc: DATABASE_URL의 HOST가 Docker 서비스 이름과 매핑되는 구조
flowchart LR
  ENVFILE[".env.local\nDATABASE_URL=mysql://pms_user:pass\n@pms_v3-mysql:3306/pms_db"]
  DJANGO["Django\nDATABASES['HOST']='pms_v3-mysql'"]
  NETWORK["Docker 내부 DNS\npms_v3-mysql → 172.18.0.3"]
  MYSQL["MySQL 컨테이너\ncontainer_name: pms_v3-mysql"]

  ENVFILE --> DJANGO
  DJANGO -- "TCP 연결" --> NETWORK
  NETWORK --> MYSQL
```

`localhost`를 쓰면 컨테이너 자기 자신을 가리킨다.
반드시 **Docker Compose 서비스 이름** (`pms_v3-mysql`)을 사용해야 한다.

## WSGI vs ASGI

Django는 두 가지 서버 인터페이스를 지원한다.

| | WSGI | ASGI |
|--|------|------|
| **표준** | PEP 3333 | PEP 503 (ASGI Spec) |
| **동작 방식** | 동기 (요청 1개 = 스레드 1개) | 비동기 (이벤트 루프) |
| **서버** | Gunicorn, uWSGI | Uvicorn, Daphne |
| **사용 시기** | 일반 REST API | WebSocket, Server-Sent Events, async views |

```python
# config/wsgi.py (기본 Django 생성)
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
application = get_wsgi_application()
```

```bash
# Gunicorn으로 실행
gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --timeout 120
```

Gunicorn의 `--workers`는 보통 `CPU 코어 수 × 2 + 1`을 권장한다.[^gunicorn-workers]

## manage.py와 DJANGO_SETTINGS_MODULE

```bash
# settings 파일 명시적으로 지정
python manage.py migrate --settings=config.settings.local

# 환경변수로 지정 (권장)
export DJANGO_SETTINGS_MODULE=config.settings.local
python manage.py migrate

# Docker Compose 환경에서
docker compose exec web python manage.py migrate
# (DJANGO_SETTINGS_MODULE은 .env.local에서 이미 설정됨)
```

## 관련 글

- [Docker Compose로 Django 5개 서비스 띄우기 →](/post/docker-compose-django) — .env.local, DATABASE_URL을 실전 프로젝트에 적용
- [Django Migration 완전 정복 →](/post/django-migration) — settings 설정 이후 migrate 실행 방법과 순서 문제

---

[^django-environ]: joke2k, <a href="https://django-environ.readthedocs.io/en/latest/" target="_blank">django-environ 공식 문서</a>
[^twelve-factor]: Heroku, <a href="https://12factor.net/config" target="_blank">The Twelve-Factor App — III. Config</a>
[^django-settings-docs]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/topics/settings/" target="_blank">Django settings — 공식 문서</a>
[^gunicorn-workers]: Gunicorn, <a href="https://docs.gunicorn.org/en/stable/design.html#how-many-workers" target="_blank">How Many Workers? — Gunicorn Docs</a>
[^pep3333]: Python, <a href="https://peps.python.org/pep-3333/" target="_blank">PEP 3333 — Python Web Server Gateway Interface v1.0.1</a>
