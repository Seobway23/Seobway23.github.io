---
title: Django URL 라우팅 완전 정복 — path(), include(), namespace, DRF Router
slug: django-urls
category: study/backend/django
tags: [Django, URL, URLconf, path, include, namespace, Router, DRF, Routing, Python]
author: Seobway
readTime: 11
featured: false
createdAt: 2026-04-03
excerpt: Django URL 라우팅이 어떻게 동작하는지, path()와 re_path()의 차이, include()로 앱별 URL을 분리하는 방법, namespace로 URL 이름 충돌을 방지하는 방법, DRF Router가 ViewSet URL을 자동 생성하는 방식을 설명한다.
---

## URL 라우팅이 하는 일

HTTP 요청이 들어오면 Django는 `settings.ROOT_URLCONF`에 지정된 URLconf 모듈을 읽는다.
그 안의 `urlpatterns` 리스트를 **순서대로** 매칭하고, 처음 일치하는 패턴의 뷰를 호출한다.[^django-urls]

```
요청: GET /api/tasks/42/

ROOT_URLCONF = 'config.urls'
  → config/urls.py → urlpatterns
    → '' → tasks/urls.py
      → 'api/tasks/<int:pk>/' → TaskDetailView
```

---

## 시리즈 구성

| 순서 | 제목 | 설명 |
|------|------|------|
| 1 | Django 큰 그림 | 철학, MTV, Batteries Included |
| 2 | MTV 아키텍처 | Project, App, settings.py |
| 3 | 요청-응답 라이프사이클 | HTTP 요청 처리 11단계 |
| 4 | Django 모델 | 필드, 관계, Meta |
| **5** | **Django URL 라우팅** ← | **path(), include(), namespace** |
| 6 | Django ORM 심층 | QuerySet, N+1, select_related |
| 7 | DRF 기초 | Serializer, ModelSerializer |
| 8 | DRF Views | APIView, ViewSet, Router |
| 9 | DRF 인증 | Token, JWT, SimpleJWT |
| 10 | Django Migration | makemigrations, FK 순서 문제 |
| 11 | Django 보안 | CSRF, XSS, SQL Injection |

---

## path() 기초

`path(route, view, kwargs=None, name=None)` — 가장 일반적인 URL 등록 방법이다.

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('api/users/', include('users.urls')),
]
```

```python
# tasks/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('tasks/', views.TaskListView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<uuid:task_id>/comments/', views.CommentListView.as_view(), name='comment-list'),
]
```

### 타입 컨버터

`<타입:변수명>` 형태로 URL 파라미터를 자동으로 변환한다.

| 컨버터 | 매칭 예시 | Python 타입 |
|--------|----------|------------|
| `str` | `django` (기본값, `/` 제외) | `str` |
| `int` | `42` | `int` |
| `slug` | `my-task-title` | `str` |
| `uuid` | `6ba7b810-9dad-11d1-80b4-00c04fd430c8` | `UUID` |
| `path` | `uploads/2026/04/file.pdf` (`/` 포함) | `str` |

```python
# int 컨버터 — pk가 정수로 자동 변환
path('tasks/<int:pk>/', views.TaskDetailView.as_view())

# uuid 컨버터 — UUID 객체로 변환
path('tasks/<uuid:task_id>/', views.TaskDetailView.as_view())

# slug 컨버터 — 알파벳, 숫자, 하이픈, 언더스코어
path('posts/<slug:slug>/', views.PostDetailView.as_view())
```

---

## re_path() — 정규식이 필요할 때

`path()`의 타입 컨버터로 표현할 수 없는 복잡한 패턴은 `re_path()`를 쓴다.

```python
from django.urls import re_path

urlpatterns = [
    # 4자리 연도 + 2자리 월
    re_path(r'^articles/(?P<year>[0-9]{4})/(?P<month>[0-9]{2})/$', views.archive),

    # 특정 확장자만 허용
    re_path(r'^files/(?P<filename>[\w.]+\.(pdf|docx|xlsx))$', views.download),
]
```

대부분의 경우 `path()`로 충분하다. 정규식은 코드 가독성을 낮추므로 꼭 필요한 상황에서만 사용한다.

---

## include() — 앱별 URL 분리

프로젝트가 커지면 모든 URL을 `config/urls.py` 하나에 넣는 것은 관리하기 어렵다.
`include()`로 앱별 `urls.py`를 분리한다.

```python
# config/urls.py
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1 prefix로 묶기
    path('api/v1/', include([
        path('tasks/', include('tasks.urls', namespace='tasks')),
        path('users/', include('users.urls', namespace='users')),
        path('auth/', include('authentication.urls', namespace='auth')),
    ])),
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

---

## namespace — URL 이름 충돌 방지

프로젝트가 커지면 여러 앱에서 같은 URL 이름을 쓸 수 있다.
`namespace`로 구분하면 `app_name:url_name` 형태로 명확하게 참조한다.

```python
# tasks/urls.py
app_name = 'tasks'  # 앱 네임스페이스 선언

urlpatterns = [
    path('', views.TaskListView.as_view(), name='list'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='detail'),
    path('create/', views.TaskCreateView.as_view(), name='create'),
]
```

```python
# users/urls.py
app_name = 'users'

urlpatterns = [
    path('', views.UserListView.as_view(), name='list'),  # 'list' 중복이지만 OK
    path('<int:pk>/', views.UserDetailView.as_view(), name='detail'),
]
```

```python
# 코드에서 reverse()로 URL 생성
from django.urls import reverse

# tasks:list → /api/v1/tasks/
reverse('tasks:list')

# tasks:detail → /api/v1/tasks/42/
reverse('tasks:detail', kwargs={'pk': 42})

# users:list → /api/v1/users/
reverse('users:list')
```

---

## name= 파라미터를 써야 하는 이유

URL 경로를 하드코딩하면 나중에 경로를 바꿀 때 모든 곳을 수정해야 한다.
`name`을 쓰면 경로가 바뀌어도 `reverse()` 호출부는 그대로다.

```python
# BAD: 경로 하드코딩
redirect('/api/v1/tasks/')

# GOOD: 이름으로 참조
from django.urls import reverse
redirect(reverse('tasks:list'))
```

DRF에서는 `reverse()` 대신 `HyperlinkedIdentityField`나 시리얼라이저의 URL 필드에서 name을 참조한다.

---

## URL 설계 베스트 프랙티스

### API 버전 관리

```python
# config/urls.py
urlpatterns = [
    path('api/v1/', include('api.v1.urls')),
    path('api/v2/', include('api.v2.urls')),
]
```

### REST 리소스 명명 규칙

```
GET    /api/v1/tasks/          → 목록 조회
POST   /api/v1/tasks/          → 생성
GET    /api/v1/tasks/42/       → 단건 조회
PUT    /api/v1/tasks/42/       → 전체 수정
PATCH  /api/v1/tasks/42/       → 부분 수정
DELETE /api/v1/tasks/42/       → 삭제

GET    /api/v1/tasks/42/comments/   → 중첩 리소스
POST   /api/v1/tasks/42/comments/
```

---

## DRF Router — ViewSet URL 자동 생성

ViewSet을 사용하면 Router가 URL을 자동으로 생성한다. 직접 `urlpatterns`에 등록할 필요가 없다.

```python
# tasks/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'categories', views.CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
```

`router.register('tasks', TaskViewSet)`가 자동 생성하는 URL:

| URL 패턴 | HTTP 메서드 | ViewSet action | name |
|----------|------------|----------------|------|
| `tasks/` | GET | `list` | `task-list` |
| `tasks/` | POST | `create` | `task-list` |
| `tasks/{pk}/` | GET | `retrieve` | `task-detail` |
| `tasks/{pk}/` | PUT | `update` | `task-detail` |
| `tasks/{pk}/` | PATCH | `partial_update` | `task-detail` |
| `tasks/{pk}/` | DELETE | `destroy` | `task-detail` |

`@action` 데코레이터로 커스텀 엔드포인트를 추가하면 Router가 이것도 자동으로 URL에 포함한다.

```python
# views.py
from rest_framework.decorators import action
from rest_framework.response import Response

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = Task.STATUS_DONE
        task.save()
        return Response({'status': 'completed'})

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        tasks = Task.objects.filter(...)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
```

`@action(detail=True)`는 `tasks/{pk}/complete/`으로, `detail=False`는 `tasks/overdue/`로 생성된다.

---

## 전체 URL 구조 예시

```
config/
├── urls.py              # ROOT_URLCONF
tasks/
├── urls.py
users/
└── urls.py
```

```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('', include('tasks.urls')),
        path('', include('users.urls')),
    ])),
]
```

```python
# tasks/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CategoryViewSet

app_name = 'tasks'
router = DefaultRouter()
router.register('tasks', TaskViewSet, basename='task')
router.register('categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
```

```python
# users/urls.py
from django.urls import path
from .views import UserProfileView, RegisterView

app_name = 'users'

urlpatterns = [
    path('users/me/', UserProfileView.as_view(), name='me'),
    path('users/register/', RegisterView.as_view(), name='register'),
]
```

최종 URL 목록:
```
/admin/
/api/v1/tasks/
/api/v1/tasks/{pk}/
/api/v1/tasks/{pk}/complete/
/api/v1/tasks/overdue/
/api/v1/categories/
/api/v1/categories/{pk}/
/api/v1/users/me/
/api/v1/users/register/
```

---

## 마치며

Django URL 라우팅의 핵심:
- `path()` + 타입 컨버터로 대부분 처리한다
- `include()`로 앱별 URLconf를 분리한다
- `namespace`와 `name`을 반드시 설정해 `reverse()`로 URL을 생성한다
- DRF ViewSet + Router로 CRUD URL을 자동 생성한다
- `/api/v1/` prefix로 버전을 관리한다

---

## 다음 글

- [DRF 기초](/study/backend/django/drf-overview) — Serializer, ModelSerializer
- [DRF Views](/study/backend/django/drf-views) — APIView, ViewSet, Router

---

## References

[^django-urls]: Django Documentation — URL dispatcher: https://docs.djangoproject.com/en/5.2/topics/http/urls/
[^django-path]: Django Documentation — path() function: https://docs.djangoproject.com/en/5.2/ref/urls/#path
[^drf-routers]: Django REST Framework — Routers: https://www.django-rest-framework.org/api-guide/routers/
