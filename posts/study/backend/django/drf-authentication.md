---
title: DRF 완전 정복 3편 — 인증(Authentication) — Token, JWT, SimpleJWT
slug: drf-authentication
category: study/backend/django
tags: [Django, DRF, Authentication, JWT, SimpleJWT, TokenAuth, SessionAuth, Security, Authorization]
author: Seobway
readTime: 13
featured: false
createdAt: 2026-04-03
excerpt: DRF의 Authentication과 Permission이 어떻게 분리되는지, TokenAuthentication과 JWT(djangorestframework-simplejwt)의 차이, Access/Refresh 토큰 패턴, API 보안 설정 방법을 단계별로 설명한다.
---

## Authentication vs Authorization

인증과 권한은 다르다. DRF는 이 둘을 명확하게 분리한다.

| 개념 | 질문 | DRF에서 |
|------|------|---------|
| **Authentication (인증)** | "당신이 누구입니까?" | `request.user`, `request.auth` |
| **Authorization (권한)** | "이 작업을 할 수 있습니까?" | `permission_classes` |

인증이 실패해도 DRF는 즉시 거부하지 않는다. `request.user`가 `AnonymousUser`로 설정될 뿐이다.
거부는 Permission이 결정한다.

```python
class TaskListView(APIView):
    authentication_classes = [JWTAuthentication]   # "누구세요?"
    permission_classes = [IsAuthenticated]          # "로그인한 사람만"

    def get(self, request):
        # 여기 도달했으면 request.user는 인증된 User 객체
        tasks = Task.objects.filter(created_by=request.user)
        ...
```

---

## 시리즈 구성

| 순서 | 제목 | 설명 |
|------|------|------|
| 7 | DRF 기초 | Serializer, ModelSerializer |
| 8 | DRF Views | APIView, ViewSet, Router |
| **9** | **DRF 인증** ← | **Token, JWT, SimpleJWT** |
| 10 | DRF Serializer 검증 심화 | validate_<field>, 3단계 검증 |
| 11 | Django 객체 레벨 권한 | Owner, 팀 기반 접근 제어 |

---

## DRF 인증 흐름

```mermaid
flowchart TD
    A[HTTP 요청] --> B{Authorization 헤더?}
    B -->|없음| C[request.user = AnonymousUser]
    B -->|있음| D[authentication_classes 순서대로 시도]
    D --> E{토큰 유효?}
    E -->|유효| F[request.user = User 객체]
    E -->|유효하지 않음| G[401 Unauthorized]
    C --> H{permission_classes 확인}
    F --> H
    H -->|통과| I[View 로직 실행]
    H -->|거부| J[403 Forbidden]
```

---

## SessionAuthentication

Django의 세션 쿠키 기반 인증이다. 브라우저에서 Django Admin이나 Browsable API를 쓸 때 동작한다.

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

- 쿠키에 `sessionid` 저장
- CSRF 토큰 필수 (POST/PUT/PATCH/DELETE)
- 모바일 앱, SPA에는 적합하지 않음

---

## TokenAuthentication

간단한 토큰 기반 인증이다. 사용자별로 하나의 토큰을 발급해 `Authorization: Token <token>` 헤더로 전송한다.

### 설정

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework.authtoken',  # 토큰 테이블 추가
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}
```

```bash
python manage.py migrate  # authtoken_token 테이블 생성
```

### 토큰 발급 뷰 추가

```python
# config/urls.py
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('api/token/', obtain_auth_token),  # POST로 username+password → token
]
```

```bash
# 토큰 발급
curl -X POST http://localhost:8000/api/token/ \
  -d '{"username": "user", "password": "pass"}' \
  -H "Content-Type: application/json"

# 응답
{"token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"}
```

```bash
# 인증된 요청
curl http://localhost:8000/api/tasks/ \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
```

### TokenAuthentication의 한계

- 토큰 하나가 영구적으로 유효 (만료 없음)
- 탈취 시 즉시 무효화할 방법이 제한적
- 사용자별 하나의 토큰 (멀티 디바이스 미지원)

실제 서비스에서는 **JWT**를 쓰는 것이 일반적이다.

---

## JWT — djangorestframework-simplejwt

JWT(JSON Web Token)는 토큰 자체에 사용자 정보를 담는 방식이다.
서버가 DB를 조회하지 않아도 토큰을 검증할 수 있다.[^jwt-intro]

```
Header.Payload.Signature
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDAwMDAwMH0.xxx
```

JWT는 두 가지 토큰으로 운영한다:

| 토큰 | 수명 | 역할 |
|------|------|------|
| **Access Token** | 5분 ~ 1시간 | API 요청에 사용 |
| **Refresh Token** | 7일 ~ 30일 | Access Token 갱신에 사용 |

Access Token이 만료되면 Refresh Token으로 새 Access Token을 발급받는다.
Refresh Token이 만료되면 다시 로그인해야 한다.

### 설치

```bash
pip install djangorestframework-simplejwt
```

### 설정

```python
# settings.py
from datetime import timedelta

INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework_simplejwt',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    # Access Token 수명
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    # Refresh Token 수명
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),

    # Refresh Token 사용 시 새 Refresh Token도 발급
    'ROTATE_REFRESH_TOKENS': True,
    # 사용된 Refresh Token을 블랙리스트에 등록 (재사용 방지)
    'BLACKLIST_AFTER_ROTATION': True,

    # 토큰에 포함할 클레임
    'UPDATE_LAST_LOGIN': True,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    # 알고리즘
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
```

### URL 등록

```python
# config/urls.py
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    # POST username + password → access + refresh 발급
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # POST refresh → 새 access 발급
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # POST token → 유효 여부 확인
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]
```

### 실제 사용 흐름

```bash
# 1. 로그인 → 토큰 발급
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# 응답
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

# 2. API 요청 — Authorization: Bearer {access}
curl http://localhost:8000/api/tasks/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# 3. Access Token 만료 시 갱신
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."}'

# 응답 (ROTATE_REFRESH_TOKENS=True면 refresh도 새로 발급)
{
    "access": "새로운 access token...",
    "refresh": "새로운 refresh token..."
}
```

---

## 토큰에 커스텀 클레임 추가

기본 JWT에는 `user_id`만 들어있다. 추가 정보(email, role 등)가 필요하면 커스텀 serializer를 만든다.

```python
# authentication/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # 커스텀 클레임 추가
        token['email'] = user.email
        token['username'] = user.username
        token['is_staff'] = user.is_staff

        return token
```

```python
# authentication/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
```

```python
# config/urls.py
urlpatterns = [
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    ...
]
```

---

## Permission 클래스

인증(Authentication) 이후 권한(Permission)을 확인한다.

| Permission 클래스 | 동작 |
|-----------------|------|
| `AllowAny` | 모두 허용 (기본값) |
| `IsAuthenticated` | 로그인한 사용자만 |
| `IsAdminUser` | `is_staff=True`인 사용자만 |
| `IsAuthenticatedOrReadOnly` | 비인증은 GET만, 인증은 모두 |

### 전역 설정 vs 뷰별 설정

```python
# settings.py — 전역 기본값
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

```python
# views.py — 뷰별 오버라이드
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser

class PublicTaskListView(generics.ListAPIView):
    # 전역 설정을 이 뷰에서만 덮어씀
    permission_classes = [AllowAny]
    queryset = Task.objects.filter(is_public=True)
    serializer_class = TaskSerializer


class AdminOnlyView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
```

---

## 실전: 회원가입 + 로그인 + 보호된 API 전체 예제

```python
# users/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': '비밀번호가 일치하지 않습니다.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']
        read_only_fields = ['id', 'date_joined']
```

```python
# users/views.py
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserProfileSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
```

```python
# users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', UserProfileView.as_view(), name='me'),
]
```

---

## Blacklist — Refresh Token 무효화 (로그아웃)

JWT는 서버가 상태를 저장하지 않아 토큰을 즉시 무효화할 수 없다.
`rest_framework_simplejwt.token_blacklist` 앱으로 로그아웃 시 Refresh Token을 블랙리스트에 등록한다.

```python
# settings.py
INSTALLED_APPS = [
    ...
    'rest_framework_simplejwt.token_blacklist',
]
```

```bash
python manage.py migrate
```

```python
# users/views.py
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()  # 블랙리스트에 등록
            return Response({'detail': '로그아웃 완료'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': '유효하지 않은 토큰'}, status=status.HTTP_400_BAD_REQUEST)
```

---

## 인증 방식 선택 기준

| 상황 | 추천 |
|------|------|
| Django Admin + Browsable API만 | `SessionAuthentication` |
| 단순 내부 API, 만료 불필요 | `TokenAuthentication` |
| SPA, 모바일 앱, 외부 API | `JWT (SimpleJWT)` |
| 엔터프라이즈, SSO 필요 | OAuth2 (django-oauth-toolkit) |

---

## 마치며

DRF 인증 핵심 요약:
- Authentication = "누구", Permission = "가능 여부" — 두 개념이 분리돼 있다
- `SessionAuthentication`: 브라우저 기반, CSRF 필요
- `TokenAuthentication`: 단순, 만료 없음
- `JWT (SimpleJWT)`: Access(단기) + Refresh(장기) 분리, 실전 표준
- `ROTATE_REFRESH_TOKENS = True`: Refresh Token 재발급으로 보안 강화
- 로그아웃은 Blacklist로 Refresh Token 무효화

---

## 관련 글

- [DRF Serializer 검증 심화 →](/post/drf-serializer-validation) — validate_<field> 완전 정복
- [Django 객체 레벨 권한 →](/post/django-object-permissions) — Owner, 팀 기반 접근 제어

[^drf-auth]: <a href="https://www.django-rest-framework.org/api-guide/authentication/" target="_blank">DRF Documentation — Authentication</a>
[^simplejwt]: <a href="https://django-rest-framework-simplejwt.readthedocs.io/" target="_blank">djangorestframework-simplejwt</a>
[^jwt-intro]: <a href="https://jwt.io/introduction" target="_blank">JWT Introduction</a>
[^drf-permissions]: <a href="https://www.django-rest-framework.org/api-guide/permissions/" target="_blank">DRF Documentation — Permissions</a>
