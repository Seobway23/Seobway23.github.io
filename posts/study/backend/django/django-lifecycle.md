---
title: Django 요청-응답 라이프사이클 — HTTP 요청이 처리되는 전체 흐름
slug: django-lifecycle
category: study/backend/django
tags: [Django, Lifecycle, Middleware, URLResolver, View, ORM, Template, WSGI, ASGI, HttpRequest]
author: Seobway
readTime: 14
featured: false
createdAt: 2026-03-27
excerpt: 브라우저가 보낸 HTTP 요청이 Gunicorn에 도달한 순간부터 응답이 돌아올 때까지 — Django가 처리하는 11단계 전체 흐름을 미들웨어 onion 구조와 함께 설명한다.
---

## 왜 라이프사이클을 알아야 하는가

Django를 쓰다 보면 이런 상황을 만난다:

- 로그인 체크가 왜 특정 요청에선 안 되지?
- 미들웨어 순서가 왜 중요한가?
- `request.user`는 언제 채워지는가?
- 내 View가 호출되기 전에 무슨 일이 일어나는가?

이 모든 질문의 답이 **라이프사이클** 안에 있다.

## 전체 흐름 — 11단계

```mermaid
%% desc: HTTP 요청이 Django를 통과해 응답이 되기까지의 11단계 전체 흐름
flowchart TD
  REQ["🌐 HTTP Request\n(브라우저 / API 클라이언트)"]

  S1["① Web Server\nGunicorn / uWSGI / Uvicorn"]
  S2["② WSGI / ASGI 진입점\nwsgi.py / asgi.py"]
  S3["③ Middleware Stack (Inbound)\n위→아래 순서 process_request()"]
  S4["④ URL Resolver\nurlpatterns 매칭"]
  S5["⑤ Middleware process_view()\nView 호출 직전"]
  S6["⑥ View 실행\nFBV / CBV"]
  S7["⑦ ORM 쿼리\nQuerySet SQL 실행"]
  S8["⑧ Template 렌더링\ncontext → HTML"]
  S9["⑨ HttpResponse 생성\n상태코드 · 헤더 · 본문"]
  S10["⑩ Middleware Stack (Outbound)\n아래→위 순서 process_response()"]
  S11["⑪ HTTP Response\n클라이언트에 반환"]

  REQ --> S1 --> S2 --> S3 --> S4 --> S5 --> S6
  S6 --> S7 --> S8 --> S9 --> S10 --> S11

  style S3 fill:#3b82f6,color:#fff
  style S10 fill:#3b82f6,color:#fff
  style S6 fill:#8b5cf6,color:#fff
```

## ① Web Server

Gunicorn(WSGI), Uvicorn/Daphne(ASGI) 같은 웹 서버가 TCP 소켓을 열고 HTTP 요청을 받는다.

Django 자체는 HTTP 파싱을 하지 않는다. 웹 서버가 HTTP를 파싱하고 WSGI/ASGI 인터페이스로 Django에 전달한다.

## ② WSGI / ASGI 진입점

```python
# config/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
application = get_wsgi_application()   # ← 웹 서버가 호출하는 callable
```

`application` 객체가 웹 서버와 Django 사이의 계약(Contract)이다.[^pep3333]

| | WSGI | ASGI |
|-|------|------|
| 표준 | PEP 3333 | ASGI Specification |
| 동작 | 동기 (요청 1개 = 스레드 1개) | 비동기 (이벤트 루프) |
| 서버 | Gunicorn, uWSGI | Uvicorn, Daphne |
| Django 지원 | Django 1.0~ | Django 3.0~ |

## ③ Middleware Stack — Inbound (위→아래)

Django의 `MIDDLEWARE` 설정에 나열된 순서대로 실행된다.

```python
# settings.py
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",      # 1번
    "django.contrib.sessions.middleware.SessionMiddleware",  # 2번
    "django.middleware.common.CommonMiddleware",          # 3번
    "django.middleware.csrf.CsrfViewMiddleware",          # 4번
    "django.contrib.auth.middleware.AuthenticationMiddleware",  # 5번
    "django.contrib.messages.middleware.MessageMiddleware",  # 6번
    "django.middleware.clickjacking.XFrameOptionsMiddleware",  # 7번
]
```

```mermaid
%% desc: Middleware onion 구조 — 요청은 위→아래, 응답은 아래→위로 처리됨
flowchart LR
  subgraph ONION["Middleware Onion 구조"]
    M1["SecurityMiddleware\n(가장 바깥)"]
    M2["SessionMiddleware"]
    M3["CsrfViewMiddleware"]
    M4["AuthenticationMiddleware"]
    M5["XFrameOptionsMiddleware\n(가장 안쪽)"]
    VIEW["View"]
  end

  REQ["요청 →"] --> M1 --> M2 --> M3 --> M4 --> M5 --> VIEW
  VIEW --> M5 --> M4 --> M3 --> M2 --> M1 --> RES["→ 응답"]

  style M1 fill:#1e40af,color:#fff
  style VIEW fill:#7c3aed,color:#fff
```

### 왜 순서가 중요한가

`SessionMiddleware`는 반드시 `AuthenticationMiddleware`보다 앞에 있어야 한다.

```
요청 처리 순서:
SessionMiddleware → 세션 쿠키를 읽어 request.session 채움
AuthenticationMiddleware → request.session을 읽어 request.user 채움
```

`AuthenticationMiddleware`가 먼저 오면 `request.session`이 아직 없어서 `request.user`를 설정할 수 없다.

각 미들웨어의 역할:

| 미들웨어 | 역할 |
|----------|------|
| `SecurityMiddleware` | HTTPS 리디렉션, HSTS 헤더, SECURE 쿠키 |
| `SessionMiddleware` | 세션 쿠키 읽기/쓰기, `request.session` 제공 |
| `CommonMiddleware` | URL 정규화 (`/blog` → `/blog/`), ETags |
| `CsrfViewMiddleware` | CSRF 토큰 검증 |
| `AuthenticationMiddleware` | `request.user` 설정 (세션 기반 인증) |
| `MessageMiddleware` | 1회성 플래시 메시지 |
| `XFrameOptionsMiddleware` | Clickjacking 방어 (`X-Frame-Options`) |

### 미들웨어가 요청을 중단시키는 경우

미들웨어가 `HttpResponse`를 반환하면 이후 스택이 모두 건너뛰어진다.

```python
class MaintenanceModeMiddleware:
    def __call__(self, request):
        if settings.MAINTENANCE_MODE:
            return HttpResponse("점검 중입니다.", status=503)  # ← View까지 가지 않음
        return self.get_response(request)
```

## ④ URL Resolver

`ROOT_URLCONF`에 지정된 파일의 `urlpatterns`를 위에서부터 순서대로 검사한다.[^url-dispatcher]

```python
# config/urls.py
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/articles/", include("articles.urls")),  # 앱 URLconf 위임
    path("api/users/", include("users.urls")),
]

# articles/urls.py
urlpatterns = [
    path("", views.ArticleListView.as_view()),
    path("<int:pk>/", views.ArticleDetailView.as_view()),
    path("<int:pk>/comments/", views.CommentListView.as_view()),
]
```

```mermaid
%% desc: URL 리졸버가 urlpatterns를 위에서부터 순서대로 매칭하는 흐름
sequenceDiagram
  participant REQ as 요청 /api/articles/42/
  participant ROOT as config/urls.py
  participant APP as articles/urls.py
  participant VIEW as ArticleDetailView

  REQ->>ROOT: 매칭 시작
  ROOT->>ROOT: "admin/" → 불일치
  ROOT->>ROOT: "api/articles/" → 일치! include() 위임
  ROOT->>APP: 나머지 "42/" 전달
  APP->>APP: "" → 불일치 (42/ 남음)
  APP->>APP: "<int:pk>/" → 일치! pk=42
  APP->>VIEW: pk=42 전달
```

매칭 실패 시 `Http404` 예외 발생 → 404 응답 반환.

## ⑤ Middleware process_view()

View가 호출되기 **직전**에 실행된다. View 함수와 인자를 받는다.
`CsrfViewMiddleware`의 CSRF 검증이 여기서 일어난다.

## ⑥ View 실행

요청을 실제로 처리하는 곳이다.

```python
# Function-Based View
def article_detail(request, pk):
    article = Article.objects.get(pk=pk)      # ⑦ ORM
    return render(request, "detail.html", {"article": article})  # ⑧ Template

# Class-Based View
class ArticleDetailView(DetailView):
    model = Article
    template_name = "detail.html"
```

View의 책임:
- 요청 파라미터 검증
- ORM으로 데이터 조회/변경
- 비즈니스 로직 처리
- Template에 context 전달
- `HttpResponse` 반환

## ⑦ ORM 쿼리

View 안에서 QuerySet을 **평가(evaluate)**하는 시점에 SQL이 실행된다.

```python
# SQL 실행 안 됨 — QuerySet은 lazy
qs = Article.objects.filter(is_published=True).order_by("-created_at")

# 이 시점에 SELECT 실행
articles = list(qs)           # 명시적 평가
article = qs.get(pk=pk)       # .get()
count = qs.count()             # .count()
for a in qs:                   # 반복
    ...
```

## ⑧ Template 렌더링

```python
render(request, "articles/detail.html", {"article": article})
```

내부 동작:
1. `TEMPLATES` 설정에서 엔진(DTL 또는 Jinja2) 선택
2. 템플릿 파일 로드
3. `{% extends %}`, `{% block %}` 상속 관계 해석
4. context 변수를 템플릿 코드에 바인딩
5. 모든 변수 **자동 이스케이프** (XSS 방어)
6. HTML 문자열 반환

## ⑩ Middleware Stack — Outbound (아래→위)

응답 경로는 요청과 반대 방향이다.

```python
class TimingMiddleware:
    def __call__(self, request):
        start = time.time()
        response = self.get_response(request)  # 아래 스택 전체 실행
        duration = time.time() - start
        response["X-Response-Time"] = f"{duration:.3f}s"  # 응답에 헤더 추가
        return response
```

`TemplateResponse`를 사용하면 `process_template_response()`도 이 단계에서 호출된다.

## 전체 시퀀스 다이어그램

```mermaid
%% desc: Django 요청-응답 라이프사이클 전체 — 미들웨어, URL, View, ORM, Template의 상호작용
sequenceDiagram
  participant C as 클라이언트
  participant GU as Gunicorn
  participant MW as Middleware Stack
  participant URL as URL Resolver
  participant VIEW as View
  participant ORM as ORM / DB
  participant TPL as Template

  C->>GU: HTTP GET /api/articles/42/
  GU->>MW: WSGI environ 전달
  MW->>MW: SecurityMiddleware (inbound)
  MW->>MW: SessionMiddleware → request.session 설정
  MW->>MW: AuthenticationMiddleware → request.user 설정
  MW->>URL: process_view 전 URL 매칭 요청
  URL->>URL: urlpatterns 순서대로 매칭
  URL->>MW: ArticleDetailView, kwargs={pk:42}
  MW->>VIEW: process_view() 후 View 호출
  VIEW->>ORM: Article.objects.get(pk=42)
  ORM->>ORM: SELECT * FROM articles WHERE id=42
  ORM-->>VIEW: Article 인스턴스
  VIEW->>TPL: render(request, "detail.html", context)
  TPL-->>VIEW: HTML 문자열
  VIEW-->>MW: HttpResponse(html, status=200)
  MW->>MW: XFrameOptionsMiddleware (outbound)
  MW->>MW: SecurityMiddleware → HSTS 헤더 추가
  MW-->>GU: 최종 HttpResponse
  GU-->>C: HTTP 200 OK
```

## 관련 글

- [Django 프레임워크 큰 그림 →](/post/django-overview) — Django 철학과 전체 구조 개요
- [Django MTV 아키텍처와 앱 구조 →](/post/django-architecture) — MTV 패턴, Project vs App, WSGI vs ASGI 상세
- [Django ORM — QuerySet과 지연 실행 →](/post/django-orm-deep) — ⑦단계 ORM 동작 심층 탐구

---

[^pep3333]: Python, <a href="https://peps.python.org/pep-3333/" target="_blank">PEP 3333 — Python Web Server Gateway Interface v1.0.1</a>
[^middleware-docs]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/topics/http/middleware/" target="_blank">Middleware — Django Docs</a>
[^url-dispatcher]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/topics/http/urls/" target="_blank">URL dispatcher — Django Docs</a>
[^request-response]: Django Project, <a href="https://docs.djangoproject.com/en/5.2/ref/request-response/" target="_blank">Request and response objects — Django Docs</a>
