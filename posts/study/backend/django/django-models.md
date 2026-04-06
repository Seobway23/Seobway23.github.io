---
title: Django 모델 완전 정복 — 필드, 관계(FK/M2M/O2O), Meta 옵션
slug: django-models
category: study/backend/django
tags: [Django, Model, ORM, ForeignKey, ManyToMany, OneToOne, Meta, ModelFields, Database, Python]
author: Seobway
readTime: 15
featured: false
createdAt: 2026-04-03
excerpt: Django 모델은 Python 클래스로 DB 테이블을 정의한다. 각 필드 타입의 용도와 ForeignKey, ManyToManyField, OneToOneField 세 가지 관계의 차이, Meta 클래스로 인덱스·정렬·제약조건을 설정하는 방법을 설명한다.
---

## 모델이란 무엇인가

Django에서 모델은 **데이터의 단일 정보 소스**다.[^django-models]

Python 클래스 하나가 DB 테이블 하나에 대응되고, 클래스의 속성이 테이블의 컬럼이 된다.
SQL을 직접 쓰지 않아도 Python 코드만으로 스키마를 정의하고, ORM이 실제 SQL로 변환해 실행한다.

```python
from django.db import models

class Task(models.Model):
    title = models.CharField(max_length=200)
    is_done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

위 코드 세 줄이 아래 SQL을 대신한다.

```sql
CREATE TABLE tasks_task (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      VARCHAR(200) NOT NULL,
    is_done    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL
);
```

---

## 시리즈 구성

| 순서 | 제목 | 설명 |
|------|------|------|
| 1 | Django 큰 그림 | 철학, MTV, Batteries Included |
| 2 | MTV 아키텍처 | Project, App, settings.py |
| 3 | 요청-응답 라이프사이클 | HTTP 요청 처리 11단계 |
| **4** | **Django 모델** ← | **필드, 관계, Meta** |
| 5 | Django URL 라우팅 | path(), include(), namespace |
| 6 | Django ORM 심층 | QuerySet, N+1, select_related |
| 7 | DRF 기초 | Serializer, ModelSerializer |
| 8 | DRF Views | APIView, ViewSet, Router |
| 9 | DRF 인증 | Token, JWT, SimpleJWT |
| 10 | Django Migration | makemigrations, FK 순서 문제 |
| 11 | Django 보안 | CSRF, XSS, SQL Injection |

---

## 기본 필드 타입

Django는 DB 컬럼 타입별로 다양한 필드 클래스를 제공한다.

### 문자열 필드

```python
class Article(models.Model):
    # 짧은 문자열 — max_length 필수, VARCHAR로 매핑
    title = models.CharField(max_length=200)

    # 긴 텍스트 — max_length 없음, TEXT로 매핑
    body = models.TextField()

    # 이메일 형식 자동 검증
    contact = models.EmailField(max_length=254)

    # URL 형식 자동 검증
    homepage = models.URLField(blank=True)

    # UUID 저장 (32자 16진수)
    external_id = models.UUIDField(default=uuid.uuid4, editable=False)

    # 선택지 제한 (choices)
    STATUS_CHOICES = [
        ('draft', '초안'),
        ('published', '발행'),
        ('archived', '보관'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
    )
```

> **주의: CharField에 null=True를 쓰지 않는다.**
> 빈 문자열은 `''`(빈 문자열)로 저장한다. `null=True`를 추가하면 `None`과 `''` 두 가지 "없음" 상태가 생겨 혼란스럽다. Django 컨벤션은 CharField/TextField는 `blank=True`만 사용한다.

### 숫자 필드

```python
class Product(models.Model):
    # 정수
    quantity = models.IntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)

    # 고정 소수점 — 금액, 비율 등 정확도가 중요할 때
    price = models.DecimalField(max_digits=10, decimal_places=2)

    # 부동 소수점 — 정확도보다 범위가 중요할 때
    latitude = models.FloatField()
```

### 날짜/시간 필드

```python
class Post(models.Model):
    # auto_now_add=True: 생성 시 자동 설정, 이후 수정 불가
    created_at = models.DateTimeField(auto_now_add=True)

    # auto_now=True: 저장할 때마다 자동 갱신
    updated_at = models.DateTimeField(auto_now=True)

    # 직접 날짜 입력받을 때
    published_at = models.DateTimeField(null=True, blank=True)

    # 날짜만 (시간 없음)
    due_date = models.DateField(null=True, blank=True)
```

### 파일/이미지 필드

```python
class Profile(models.Model):
    # FileField: 파일 경로를 문자열로 DB에 저장, 실제 파일은 MEDIA_ROOT에
    resume = models.FileField(upload_to='resumes/')

    # ImageField: FileField + Pillow로 이미지 유효성 검증
    avatar = models.ImageField(upload_to='avatars/', blank=True)
```

```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

### 기타 필드

```python
class Config(models.Model):
    # JSON 데이터 — PostgreSQL은 jsonb, 나머지는 TEXT
    metadata = models.JSONField(default=dict)

    # True/False
    is_active = models.BooleanField(default=True)

    # IP 주소 자동 검증
    last_ip = models.GenericIPAddressField(null=True, blank=True)
```

---

## null=True vs blank=True 차이

이 두 옵션은 전혀 다른 레벨에서 동작한다.

| 옵션 | 적용 레벨 | 의미 |
|------|----------|------|
| `null=True` | **DB 레벨** | 컬럼에 NULL 허용 |
| `blank=True` | **폼/검증 레벨** | 빈 값 입력 허용 |

```python
# DB에는 NULL로 저장 가능, 폼에서는 필수 입력 (unusual pattern)
field = models.IntegerField(null=True)

# DB에는 NOT NULL, 폼에서는 빈 값 허용 → 빈 문자열 ''로 저장
field = models.CharField(max_length=100, blank=True)

# DB와 폼 모두 선택사항
field = models.IntegerField(null=True, blank=True)
```

**가이드라인:**
- 문자열 필드(Char, Text): `blank=True`만 사용
- 숫자/날짜 필드에서 선택 입력: `null=True, blank=True` 함께

---

## 관계 필드 — 3가지 핵심

### ForeignKey (N:1 관계)

가장 많이 쓰이는 관계다. "하나의 카테고리에 여러 개의 태스크"처럼 N(Task) : 1(Category) 관계를 표현한다.

```python
class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Task(models.Model):
    title = models.CharField(max_length=200)

    # ForeignKey: Task(N) → Category(1)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,   # Category 삭제 시 NULL로
        null=True,
        blank=True,
        related_name='tasks',        # category.tasks.all() 로 역참조
    )
```

#### on_delete 옵션

| 옵션 | 동작 |
|------|------|
| `CASCADE` | 부모 삭제 시 자식도 삭제 (주문 삭제 → 주문상품 삭제) |
| `SET_NULL` | 부모 삭제 시 FK 컬럼을 NULL로 (null=True 필요) |
| `PROTECT` | 자식이 있으면 부모 삭제 차단 (에러 발생) |
| `SET_DEFAULT` | 부모 삭제 시 default 값으로 설정 |
| `DO_NOTHING` | 아무것도 안 함 (DB에서 직접 처리) |

```python
# 역참조 사용 예
category = Category.objects.get(id=1)
tasks = category.tasks.all()          # related_name='tasks' 덕분
tasks = category.task_set.all()       # related_name 없으면 이렇게
```

### ManyToManyField (N:M 관계)

"하나의 태스크에 여러 태그, 하나의 태그에 여러 태스크"처럼 양방향으로 다수가 연결되는 관계다.

```python
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    title = models.CharField(max_length=200)

    # ManyToManyField: Django가 중간 테이블(tasks_task_tags)을 자동 생성
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='tasks',
    )
```

```python
# 사용법
task = Task.objects.get(id=1)
task.tags.add(tag1, tag2)
task.tags.remove(tag1)
task.tags.set([tag2, tag3])   # 현재 태그를 tag2, tag3으로 교체
task.tags.clear()              # 모두 제거
task.tags.all()                # 연결된 태그 QuerySet
```

#### through 모델 — 중간 테이블에 추가 데이터가 필요할 때

태그를 붙인 날짜나 태그를 붙인 사람 같은 정보가 필요하면 `through`로 직접 중간 모델을 지정한다.

```python
class TaskTag(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    tagged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    tagged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['task', 'tag']]


class Task(models.Model):
    title = models.CharField(max_length=200)
    tags = models.ManyToManyField(Tag, through='TaskTag', blank=True)
```

```python
# through 모델을 쓰면 add()가 아닌 직접 생성
TaskTag.objects.create(task=task, tag=tag, tagged_by=request.user)
```

### OneToOneField (1:1 관계)

하나의 User에 하나의 Profile처럼 테이블을 확장할 때 사용한다.
ForeignKey에 `unique=True`를 건 것과 동일하지만, 역참조가 QuerySet이 아닌 단일 객체다.

```python
class Profile(models.Model):
    # User와 1:1 연결 — User 삭제 시 Profile도 삭제
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    website = models.URLField(blank=True)
```

```python
# 역참조: ForeignKey는 .objects QuerySet, OneToOne은 단일 객체
user = User.objects.get(id=1)
profile = user.profile           # 단일 Profile 객체
# user.profile.all() 은 불가 — QuerySet이 아님
```

#### post_save 시그널로 자동 생성

```python
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

---

## Meta 클래스

모델의 동작 방식을 세부 조정하는 내부 클래스다.

```python
class Task(models.Model):
    title = models.CharField(max_length=200)
    priority = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)

    class Meta:
        # 기본 정렬: -created_at이면 최신순
        ordering = ['-created_at', 'priority']

        # 인덱스 설정 (자주 필터링하는 컬럼)
        indexes = [
            models.Index(fields=['category', 'created_at']),
            models.Index(fields=['priority']),
        ]

        # 복합 유니크 제약
        unique_together = [['title', 'category']]

        # Django 5.1+: UniqueConstraint로 더 세밀하게
        constraints = [
            models.UniqueConstraint(
                fields=['title', 'category'],
                name='unique_task_title_per_category',
            ),
            models.CheckConstraint(
                check=models.Q(priority__gte=0),
                name='task_priority_non_negative',
            ),
        ]

        # Admin, 오류 메시지에 표시되는 이름
        verbose_name = '태스크'
        verbose_name_plural = '태스크 목록'

        # DB 테이블 이름 직접 지정 (기본: appname_modelname)
        db_table = 'tasks'
```

### abstract 모델 — 공통 필드 재사용

```python
class TimeStampedModel(models.Model):
    """생성/수정 시각을 자동 기록하는 추상 모델"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True  # DB 테이블 생성 안 됨, 상속만 가능


class Task(TimeStampedModel):
    title = models.CharField(max_length=200)
    # created_at, updated_at 자동으로 포함됨


class Comment(TimeStampedModel):
    body = models.TextField()
    # created_at, updated_at 자동으로 포함됨
```

---

## __str__ 메서드

Admin, shell, 디버그 출력 등 모든 곳에서 모델 객체를 사람이 읽을 수 있게 표현한다.
**반드시 정의해야 한다.**

```python
class Task(models.Model):
    title = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f'[{self.category}] {self.title}'
```

```python
# __str__ 없으면
>>> Task.objects.first()
<Task: Task object (1)>  # 의미 없음

# __str__ 있으면
>>> Task.objects.first()
<Task: [개발] Django 모델 정리>  # 명확함
```

---

## 실전 예제: Task 앱 전체 모델

Task 관리 앱의 모델을 처음부터 끝까지 작성한다.

```python
# tasks/models.py
import uuid
from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = '카테고리'
        verbose_name_plural = '카테고리 목록'
        ordering = ['name']

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Task(TimeStampedModel):
    PRIORITY_LOW = 0
    PRIORITY_MEDIUM = 1
    PRIORITY_HIGH = 2
    PRIORITY_CHOICES = [
        (PRIORITY_LOW, '낮음'),
        (PRIORITY_MEDIUM, '보통'),
        (PRIORITY_HIGH, '높음'),
    ]

    STATUS_TODO = 'todo'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_DONE = 'done'
    STATUS_CHOICES = [
        (STATUS_TODO, '할 일'),
        (STATUS_IN_PROGRESS, '진행 중'),
        (STATUS_DONE, '완료'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_TODO
    )

    due_date = models.DateField(null=True, blank=True)

    # FK 관계
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tasks',
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
    )

    # M2M 관계
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['created_by', 'created_at']),
            models.Index(fields=['due_date']),
        ]
        verbose_name = '태스크'
        verbose_name_plural = '태스크 목록'

    def __str__(self):
        return f'[{self.get_status_display()}] {self.title}'

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.due_date and self.status != self.STATUS_DONE:
            return self.due_date < timezone.now().date()
        return False


class Comment(TimeStampedModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    body = models.TextField()

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author} → {self.task.title[:30]}'
```

---

## 자주 하는 실수

### 1. ForeignKey로 연결된 객체를 N+1로 조회

```python
# BAD: Task 수만큼 category 쿼리 추가 발생
tasks = Task.objects.all()
for task in tasks:
    print(task.category.name)  # 매번 DB 쿼리

# GOOD: JOIN으로 한 번에 가져오기
tasks = Task.objects.select_related('category', 'created_by').all()
for task in tasks:
    print(task.category.name)  # 추가 쿼리 없음
```

### 2. ManyToMany를 즉시 평가하지 않고 N+1 유발

```python
# BAD
tasks = Task.objects.all()
for task in tasks:
    print(task.tags.all())  # 매번 쿼리

# GOOD
tasks = Task.objects.prefetch_related('tags').all()
for task in tasks:
    print(task.tags.all())  # 미리 가져온 캐시 사용
```

### 3. CharField에 null=True 추가

```python
# BAD: 빈 상태가 None과 '' 두 가지
name = models.CharField(max_length=100, null=True, blank=True)

# GOOD: 빈 상태는 '' 하나로 통일
name = models.CharField(max_length=100, blank=True, default='')
```

---

## 마치며

Django 모델을 제대로 설계하면 ORM이 나머지를 처리한다.

핵심 원칙:
- **FK, M2M, O2O** 중 관계 유형을 먼저 명확히 정한다
- `on_delete`를 비즈니스 로직에 맞게 선택한다 (CASCADE vs SET_NULL vs PROTECT)
- `null=True` / `blank=True` 차이를 정확히 이해하고 적용한다
- `abstract = True` 추상 모델로 공통 필드(created_at, updated_at)를 재사용한다
- `__str__`을 반드시 정의한다
- `Meta.indexes`로 자주 쓰는 필터 컬럼에 인덱스를 설정한다

---

## 관련 글

- [Django URL 라우팅 →](/post/django-urls) — path(), include(), namespace
- [DRF 기초 →](/post/drf-overview) — Serializer, ModelSerializer

[^django-models]: <a href="https://docs.djangoproject.com/en/5.2/topics/db/models/" target="_blank">Django Documentation — Models</a>
[^django-fields]: <a href="https://docs.djangoproject.com/en/5.2/ref/models/fields/" target="_blank">Django Documentation — Model field reference</a>
[^django-relations]: <a href="https://docs.djangoproject.com/en/5.2/topics/db/examples/many_to_one/" target="_blank">Django Documentation — Many-to-one relationships</a>
[^django-m2m]: <a href="https://docs.djangoproject.com/en/5.2/topics/db/examples/many_to_many/" target="_blank">Django Documentation — Many-to-many relationships</a>
[^django-meta]: <a href="https://docs.djangoproject.com/en/5.2/ref/models/options/" target="_blank">Django Documentation — Meta options</a>
