---
title: DRF 완전 정복 2편 — APIView, GenericAPIView, ViewSet, Router
slug: drf-views
category: study/backend/django
tags: [Django, DRF, APIView, ViewSet, Router, GenericAPIView, ModelViewSet, CRUD, REST, Python]
author: Seobway
readTime: 14
featured: false
createdAt: 2026-04-03
excerpt: DRF의 뷰 계층을 APIView부터 ModelViewSet까지 단계별로 설명한다. 각 레벨의 코드량 차이, ViewSet이 Router와 어떻게 URL을 자동 생성하는지, 언제 어떤 클래스를 선택해야 하는지 기준을 제시한다.
---

## DRF 뷰 계층 구조

DRF는 뷰를 여러 레벨로 제공한다. 위로 올라갈수록 코드가 줄어들고, 아래로 내려올수록 유연성이 높아진다.

```
APIView                  ← 가장 유연, 모든 것 직접 구현
  └─ GenericAPIView      ← queryset, serializer_class 연결
       └─ Mixins         ← list, create, retrieve, update, destroy 행동 단위
            └─ Generic Views  ← Mixin 조합 (ListCreateAPIView 등)
                 └─ ViewSet   ← URL action 기반 뷰 묶음
                      └─ ModelViewSet  ← CRUD 완성
```

---

## 시리즈 구성

| 순서 | 제목 | 설명 |
|------|------|------|
| 7 | DRF 기초 | Serializer, ModelSerializer |
| **8** | **DRF Views** ← | **APIView, ViewSet, Router** |
| 9 | DRF 인증 | Token, JWT, SimpleJWT |
| 10 | DRF Serializer 검증 심화 | validate_<field>, 3단계 검증 |
| 11 | Django 객체 레벨 권한 | Owner, 팀 기반 접근 제어 |

---

## @api_view — 함수형 뷰

가장 간단한 형태. 함수형 뷰에 DRF 기능을 붙인다.

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Task
from .serializers import TaskSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list(request):
    if request.method == 'GET':
        tasks = Task.objects.filter(created_by=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
```

**언제 쓰나:** 빠른 프로토타입, 단일 엔드포인트, 메서드 로직이 복잡할 때.

---

## APIView — 클래스 기반 기본

HTTP 메서드(get, post, put, delete)를 클래스 메서드로 분리한다.
인증, 권한, 파싱, 렌더링이 자동으로 처리된다.

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class TaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(created_by=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Task.objects.get(pk=pk, created_by=user)
        except Task.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        task = self.get_object(pk, request.user)
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    def patch(self, request, pk):
        task = self.get_object(pk, request.user)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        task = self.get_object(pk, request.user)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

**언제 쓰나:** 비즈니스 로직이 복잡해서 제네릭 뷰에 맞지 않을 때. 예외적인 쿼리, 다중 시리얼라이저.

---

## GenericAPIView + Mixins

`GenericAPIView`에 `queryset`과 `serializer_class`를 선언하고, Mixin으로 행동을 붙인다.

```python
from rest_framework import generics, mixins

class TaskListView(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    generics.GenericAPIView,
):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # 현재 사용자의 태스크만
        return Task.objects.filter(created_by=self.request.user)

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
```

Mixin 종류:

| Mixin | 제공하는 메서드 | HTTP 동작 |
|-------|--------------|----------|
| `ListModelMixin` | `list()` | GET (목록) |
| `CreateModelMixin` | `create()` | POST |
| `RetrieveModelMixin` | `retrieve()` | GET (단건) |
| `UpdateModelMixin` | `update()`, `partial_update()` | PUT, PATCH |
| `DestroyModelMixin` | `destroy()` | DELETE |

---

## Generic Views — Mixin 조합

자주 쓰는 Mixin 조합을 미리 만들어놓은 뷰들이다.

```python
from rest_framework import generics

# GET(목록) + POST
class TaskListView(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        # save() 호출 직전 — 추가 데이터 주입
        serializer.save(created_by=self.request.user)


# GET(단건) + PUT + PATCH + DELETE
class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
```

Generic Views 전체 목록:

| 클래스 | 지원 메서드 |
|--------|-----------|
| `ListAPIView` | GET (목록) |
| `CreateAPIView` | POST |
| `RetrieveAPIView` | GET (단건) |
| `UpdateAPIView` | PUT, PATCH |
| `DestroyAPIView` | DELETE |
| `ListCreateAPIView` | GET, POST |
| `RetrieveUpdateAPIView` | GET, PUT, PATCH |
| `RetrieveDestroyAPIView` | GET, DELETE |
| `RetrieveUpdateDestroyAPIView` | GET, PUT, PATCH, DELETE |

**언제 쓰나:** 표준 CRUD에 약간의 커스터마이징이 필요할 때. `get_queryset()`, `perform_create()` 오버라이드로 대부분 처리 가능.

---

## perform_create / perform_update / perform_destroy

Generic Views의 훅 메서드. `save()` 직전에 호출되어 추가 데이터를 주입하거나 사이드 이펙트를 처리한다.

```python
class TaskListView(generics.ListCreateAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        # 현재 사용자를 created_by로 자동 설정
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        # 실제 삭제 대신 soft delete
        instance.is_deleted = True
        instance.save()
```

---

## ViewSet — action 기반

ViewSet은 연관된 뷰들을 하나의 클래스로 묶는다.
HTTP 메서드가 아닌 **action**(`list`, `create`, `retrieve`, `update`, `destroy`) 이름으로 메서드를 정의한다.

```python
from rest_framework import viewsets
from rest_framework.response import Response

class TaskViewSet(viewsets.ViewSet):
    """직접 구현하는 ViewSet"""

    def list(self, request):
        """GET /tasks/"""
        tasks = Task.objects.filter(created_by=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def create(self, request):
        """POST /tasks/"""
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=201)

    def retrieve(self, request, pk=None):
        """GET /tasks/{pk}/"""
        task = get_object_or_404(Task, pk=pk, created_by=request.user)
        serializer = TaskSerializer(task)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """PUT /tasks/{pk}/"""
        ...

    def partial_update(self, request, pk=None):
        """PATCH /tasks/{pk}/"""
        ...

    def destroy(self, request, pk=None):
        """DELETE /tasks/{pk}/"""
        ...
```

---

## ModelViewSet — CRUD 완성

`ModelViewSet`은 `queryset`과 `serializer_class`만 선언하면 5개 action을 모두 자동으로 구현한다.

```python
from rest_framework import viewsets, permissions

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            created_by=self.request.user
        ).select_related('category').prefetch_related('tags')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
```

이 15줄이 아래 모든 엔드포인트를 처리한다:

```
GET    /tasks/          → list
POST   /tasks/          → create
GET    /tasks/{pk}/     → retrieve
PUT    /tasks/{pk}/     → update
PATCH  /tasks/{pk}/     → partial_update
DELETE /tasks/{pk}/     → destroy
```

---

## Router — URL 자동 생성

ViewSet과 Router를 연결하면 URL을 수동으로 작성할 필요가 없다.

```python
# tasks/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CategoryViewSet

router = DefaultRouter()
router.register('tasks', TaskViewSet, basename='task')
router.register('categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
```

`DefaultRouter`가 생성하는 URL:

| URL | 메서드 | Action | URL Name |
|-----|--------|--------|----------|
| `/tasks/` | GET | list | `task-list` |
| `/tasks/` | POST | create | `task-list` |
| `/tasks/{pk}/` | GET | retrieve | `task-detail` |
| `/tasks/{pk}/` | PUT | update | `task-detail` |
| `/tasks/{pk}/` | PATCH | partial_update | `task-detail` |
| `/tasks/{pk}/` | DELETE | destroy | `task-detail` |

---

## @action — 커스텀 엔드포인트

CRUD 외에 비즈니스 액션이 필요하면 `@action` 데코레이터를 쓴다.

```python
from rest_framework.decorators import action
from rest_framework.response import Response

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """POST /tasks/{pk}/complete/ — 태스크 완료 처리"""
        task = self.get_object()
        task.status = Task.STATUS_DONE
        task.save()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """POST /tasks/{pk}/reopen/ — 태스크 재개"""
        task = self.get_object()
        task.status = Task.STATUS_TODO
        task.save()
        return Response({'status': 'reopened'})

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """GET /tasks/overdue/ — 마감 초과 태스크 목록"""
        from django.utils import timezone
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__lt=today,
            status__in=[Task.STATUS_TODO, Task.STATUS_IN_PROGRESS],
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """GET /tasks/stats/ — 상태별 통계"""
        qs = self.get_queryset()
        return Response({
            'total': qs.count(),
            'todo': qs.filter(status=Task.STATUS_TODO).count(),
            'in_progress': qs.filter(status=Task.STATUS_IN_PROGRESS).count(),
            'done': qs.filter(status=Task.STATUS_DONE).count(),
        })
```

`@action(detail=True)`는 `tasks/{pk}/complete/`처럼 특정 객체 액션이고,
`@action(detail=False)`는 `tasks/overdue/`처럼 컬렉션 액션이다.

---

## 뷰 선택 기준

| 상황 | 선택 |
|------|------|
| 비표준 로직, 다중 모델, 복잡한 쿼리 | `APIView` |
| 표준 CRUD + 약간의 커스터마이징 | `GenericAPIView` / Generic Views |
| 완전 표준 CRUD | `ModelViewSet` |
| CRUD 일부만 노출 (조회만, 생성만) | `ReadOnlyModelViewSet`, 또는 개별 Mixin 조합 |
| 커스텀 액션 필요 | `ModelViewSet` + `@action` |

---

## get_serializer_class — 상황별 다른 Serializer

목록 조회와 상세 조회에서 다른 시리얼라이저를 쓰고 싶을 때:

```python
class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer    # 경량 버전
        return TaskDetailSerializer      # 상세 버전

    def get_queryset(self):
        qs = Task.objects.filter(created_by=self.request.user)
        if self.action == 'list':
            return qs.select_related('category')
        return qs.select_related('category').prefetch_related('tags', 'comments')
```

---

## 마치며

DRF Views 핵심 요약:
- `APIView` — 가장 유연, 모든 것 직접 구현
- `GenericAPIView` + Mixin — 표준 행동을 조합
- Generic Views — 자주 쓰는 조합을 미리 만들어놓은 것
- `ModelViewSet` + Router — CRUD + URL 자동 생성, 가장 생산적
- `@action` — CRUD 외 커스텀 엔드포인트 추가
- `get_serializer_class()` — 액션별로 다른 시리얼라이저 선택

---

## 다음 글

- [DRF 인증](/study/backend/django/drf-authentication) — Token, JWT, SimpleJWT
- [DRF Serializer 검증 심화](/study/backend/django/drf-serializer-validation)

---

## References

[^drf-views]: DRF Documentation — Views: https://www.django-rest-framework.org/api-guide/views/
[^drf-generic-views]: DRF Documentation — Generic views: https://www.django-rest-framework.org/api-guide/generic-views/
[^drf-viewsets]: DRF Documentation — ViewSets: https://www.django-rest-framework.org/api-guide/viewsets/
[^drf-routers]: DRF Documentation — Routers: https://www.django-rest-framework.org/api-guide/routers/
