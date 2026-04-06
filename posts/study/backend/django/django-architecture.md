---
title: Django MTV 아키텍처와 앱 구조 — Project, App, settings.py의 역할
slug: django-architecture
category: study/backend/django
tags: [Django, MTV, MVC, Architecture, Project, App, AppConfig, WSGI, ASGI, Settings]
author: Seobway
readTime: 12
featured: false
createdAt: 2026-03-27
excerpt: Django의 MTV 패턴이 MVC와 정확히 어떻게 다른지, Project와 App의 경계는 어디인지, settings.py가 어떻게 모든 컴포넌트를 연결하는 허브가 되는지 설명한다.
---

## MTV 패턴 — 이름이 다른 이유

Django를 처음 배울 때 혼란이 오는 지점이다. "MVC인데 왜 View가 Controller 역할을 하지?"

Django 공식 FAQ의 답변:[^django-faq]

> *"Django appears to be an MVC framework, but it calls the Controller the 'view', and the View the 'template'. Why does Django use these names?"*

이름을 다르게 쓴 건 우연이 아니다. Django 팀은 용어를 **역할 중심**으로 재정의했다.

```mermaid
%% desc: MVC와 Django MTV의 역할 대응 — URL Dispatcher가 독립 레이어로 분리된 점이 핵심
flowchart LR
  subgraph MVC["전통적 MVC"]
    M1["Model\n데이터 + 비즈니스 로직"]
    V1["View\n화면 렌더링"]
    C1["Controller\n요청 처리 + 라우팅"]
    M1 <--> C1 <--> V1
  end

  subgraph MTV["Django MTV"]
    M2["Model\n데이터 + 비즈니스 로직"]
    T2["Template\n화면 렌더링 (HTML)"]
    V2["View\n요청 처리 + 데이터 선택"]
    U2["URL Dispatcher\n라우팅 (독립 레이어)"]
    U2 --> V2 --> M2
    V2 --> T2
  end
```

핵심 차이: Django는 **URL 라우팅을 Controller에서 분리**해 독립 레이어로 만들었다. 덕분에 URL 설계가 View 코드와 완전히 분리되고, 같은 View를 여러 URL 패턴에 연결할 수 있다.

| 개념 | Django에서 | 역할 |
|------|-----------|------|
| **Model** | `models.py` | DB 스키마 정의, 데이터 접근, 비즈니스 로직 |
| **Template** | `templates/*.html` | 화면 렌더링. context 데이터를 HTML로 변환 |
| **View** | `views.py` | 요청을 받아 데이터 조회/처리 후 Template에 context 전달 |
| **URL Dispatcher** | `urls.py` | URL 패턴 → View 함수 매핑 |

## Model — 데이터와 로직의 집합

```python
# articles/models.py
from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    author = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "기사"

    def __str__(self):
        return self.title

    def publish(self):
        """비즈니스 로직도 모델에 포함"""
        self.is_published = True
        self.save()
```

Model에서 정의한 내용이 파생시키는 것들:

```mermaid
%% desc: 모델 하나에서 Admin, Form, Migration, API Serializer가 자동 파생되는 DRY 원칙
flowchart TD
  MODEL["Article 모델\n(models.py)"]

  ADMIN["Admin 인터페이스\n(admin.site.register)"]
  FORM["ModelForm\n(자동 필드 검증)"]
  MIGRATION["Migration 파일\n(스키마 이력)"]
  SERIAL["ModelSerializer\n(DRF, 자동 직렬화)"]

  MODEL --> ADMIN & FORM & MIGRATION & SERIAL
```

## Template — 화면 렌더링 전용

Django Template Language(DTL)는 의도적으로 **제한된** 언어다.[^dtl-docs]

```django
{# articles/templates/articles/detail.html #}
{% extends "base.html" %}

{% block content %}
  <h1>{{ article.title }}</h1>
  <p>{{ article.body }}</p>

  {% if article.is_published %}
    <span>게시됨</span>
  {% endif %}

  {% for comment in article.comments.all %}
    <p>{{ comment.text }}</p>
  {% endfor %}
{% endblock %}
```

DTL의 설계 원칙: "프레젠테이션 관련 결정만 할 수 있을 정도의 로직만 허용한다."
DB 삭제, 파일 접근 같은 사이드이펙트 있는 작업은 Template에서 불가능하다.

> 기본 Template 엔진은 DTL이지만, Jinja2로 교체 가능하다. Loose Coupling의 실제 사례다.

## View — 요청 처리의 핵심

View는 `HttpRequest`를 받아 `HttpResponse`를 반환하는 callable이다.[^view-docs]

```python
# articles/views.py

# Function-Based View (FBV) — 단순하고 명시적
def article_list(request):
    articles = Article.objects.filter(is_published=True)
    return render(request, "articles/list.html", {"articles": articles})

# Class-Based View (CBV) — 재사용 가능한 공통 패턴
from django.views.generic import ListView, DetailView

class ArticleListView(ListView):
    model = Article
    queryset = Article.objects.filter(is_published=True)
    template_name = "articles/list.html"
    context_object_name = "articles"
    paginate_by = 20
```

FBV vs CBV:

| | FBV | CBV |
|-|-----|-----|
| 코드 스타일 | 함수 | 클래스 (상속) |
| 가독성 | 높음 (선형적) | 낮음 (메서드 분산) |
| 재사용 | mixins 필요 | 상속으로 쉬움 |
| 적합한 경우 | 단순 뷰, 복잡한 커스텀 로직 | CRUD 반복 패턴 |

## Project vs App — 경계 나누는 기준

```mermaid
%% desc: Project는 설정 허브, App은 독립 기능 단위 — 앱은 여러 프로젝트에서 재사용 가능
flowchart TD
  subgraph PROJECT["Django Project (mysite/)"]
    SETTINGS["settings.py"]
    ROOT_URL["urls.py (root)"]
    WSGI_FILE["wsgi.py"]
    MANAGE["manage.py"]
  end

  subgraph APPS["Django Apps"]
    BLOG["blog app\nmodels.py\nviews.py\nurls.py\ntemplates/\nmigrations/\napps.py"]
    AUTH_APP["accounts app\n사용자 인증"]
    SHOP_APP["shop app\n상품/주문"]
  end

  PROJECT --> APPS

  REUSE["다른 Project에서도\n이 앱을 그대로 재사용 가능\n(pip install my-blog-app)"]
  BLOG -.-> REUSE
```

**앱 분리 기준**: 한 앱이 "하나의 명확한 역할"을 담당해야 한다. 기능이 독립적으로 존재할 수 있는가? 다른 프로젝트에 복사해서 쓸 수 있는가?

### apps.py — 앱 설정과 등록

```python
# blog/apps.py
from django.apps import AppConfig

class BlogConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "blog"
    verbose_name = "블로그"

    def ready(self):
        """앱이 로드될 때 실행 — 시그널 등록 등"""
        import blog.signals  # noqa
```

```python
# settings.py
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    ...
    "blog.apps.BlogConfig",   # 앱 등록
]
```

`INSTALLED_APPS`에 등록돼야 모델·Admin·시그널·관리명령어가 활성화된다.

## settings.py — 모든 것의 허브

`settings.py`는 INI나 YAML이 아니라 **Python 모듈**이다.[^settings-docs]

```python
# settings.py는 실행되는 Python 코드
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# 동적 설정 가능
INSTALLED_APPS = [
    "django.contrib.admin",
    ...
]
if os.environ.get("ENABLE_DEBUG_TOOLBAR"):
    INSTALLED_APPS += ["debug_toolbar"]
```

주요 설정:

| 설정키 | 역할 |
|--------|------|
| `INSTALLED_APPS` | 활성화된 앱 목록 (모델·Admin·시그널 활성화) |
| `MIDDLEWARE` | 요청/응답 파이프라인 구성 |
| `DATABASES` | DB 연결 설정 |
| `TEMPLATES` | 템플릿 엔진과 경로 |
| `ROOT_URLCONF` | URL 설정 파일 경로 |
| `STATIC_URL` | 정적 파일 URL |
| `SECRET_KEY` | 암호화·세션·CSRF에 사용 |
| `DEBUG` | 개발/운영 모드 분리 |

## WSGI vs ASGI

```mermaid
%% desc: WSGI는 동기 1요청=1스레드, ASGI는 비동기 이벤트 루프로 다수 동시 처리
flowchart LR
  subgraph WSGI["WSGI (동기)"]
    W_REQ1["요청 1"] --> W_T1["스레드 1\n처리 중..."]
    W_REQ2["요청 2"] --> W_T2["스레드 2\n처리 중..."]
    W_REQ3["요청 3"] --> W_T3["스레드 3 (대기)"]
    W_T1 & W_T2 & W_T3 --> W_RES["응답"]
  end

  subgraph ASGI["ASGI (비동기)"]
    A_REQ1["요청 1"] --> A_LOOP["이벤트 루프\n(단일 프로세스)"]
    A_REQ2["요청 2"] --> A_LOOP
    A_REQ3["요청 3"] --> A_LOOP
    A_LOOP -- "I/O 대기 중 다른 요청 처리" --> A_RES["응답"]
  end
```

```python
# config/asgi.py
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
application = get_asgi_application()
```

**주의**: ASGI 성능을 100% 이용하려면 **미들웨어 전체**가 async-compatible이어야 한다. 단 하나의 sync-only 미들웨어가 있으면 Django가 자동으로 스레드를 쓰게 돼 ASGI 이점이 사라진다.

Django의 async 지원 진화:

| 버전 | 변화 |
|------|------|
| 3.0 | ASGI 진입점 지원 시작 |
| 3.1 | async FBV / CBV 지원 |
| 4.1 | async ORM (`aget()`, `acreate()` 등) |
| 5.0 | async 시그널, async 인증 |
| **5.2 (현재 LTS)** | async 전반 성숙 단계 |

## 관련 글

- [Django 프레임워크 큰 그림 →](/post/django-overview) — 전체 철학과 구조 개요
- [Django 요청-응답 라이프사이클 →](/post/django-lifecycle) — MTV 각 레이어가 요청 처리에서 어떤 순서로 개입하는가
- [Django ORM — QuerySet과 지연 실행 →](/post/django-orm-deep) — Model 레이어 심층 탐구

---

[^django-faq]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/faq/general/#django-appears-to-be-a-mvc-framework-but-you-call-the-controller-the-view-and-the-view-the-template" target="_blank">FAQ: MVC — Django Docs</a>
[^dtl-docs]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/ref/templates/language/" target="_blank">The Django template language — Django Docs</a>
[^view-docs]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/topics/http/views/" target="_blank">Writing views — Django Docs</a>
[^settings-docs]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/topics/settings/" target="_blank">Django settings — Django Docs</a>
[^apps-docs]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/ref/applications/" target="_blank">Applications — Django Docs</a>
