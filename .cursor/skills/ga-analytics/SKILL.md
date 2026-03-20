---
name: ga-analytics
description: Google Analytics 4 설정, 조회수 데이터 수집, 이벤트 추적 구현. GA 연동, 조회수 스크립트 수정, 새 GA 이벤트 추가, 서비스 계정 설정, views.json 갱신을 요청할 때 사용.
---

# Google Analytics 분석 스킬

## GA 연동 구조

```
[클라이언트] gtag.js → GA4 실시간 수집
     ↓
[빌드타임] GA Data API → public/views.json → 정적 파일에 포함
```

## 초기 설정 체크리스트

```
- [ ] .env에 VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX 추가
- [ ] .env에 GA_PROPERTY_ID=123456789 추가
- [ ] .env에 GA_SERVICE_ACCOUNT_KEY=./service-account.json 추가
- [ ] GA4 콘솔에서 서비스 계정에 "뷰어" 권한 부여
- [ ] npm run fetch:views 테스트 실행
```

## 조회수 데이터 수집

```bash
npm run fetch:views      # 개발 환경 (fetch-ga-views-dev.js)
npm run fetch:views:prod # 프로덕션 (fetch-ga-views.js)
npm run test:ga-paths    # GA 경로 매핑 테스트
```

## 새 이벤트 추적 추가

`src/lib/analytics.ts`에 추가:
```typescript
export function trackNewEvent(param: string) {
  if (typeof window.gtag === 'undefined') return;
  window.gtag('event', 'event_name', {
    event_category: 'category',
    event_label: param,
    // GA4 권장: snake_case 파라미터
    custom_param: param,
  });
}
```

호출 위치에서:
```typescript
import { trackNewEvent } from "@/lib/analytics";
// 사용자 액션 발생 시
trackNewEvent('value');
```

## 서비스 계정 키 GitHub Secrets 설정

GitHub Actions에서 JSON 파일 대신 환경 변수로 주입:
```bash
# 로컬에서 JSON을 한 줄로 변환
cat service-account.json | tr -d '\n'
# → GitHub > Settings > Secrets > GA_SERVICE_ACCOUNT_KEY에 붙여넣기
```

`scripts/fetch-ga-views.js`는 JSON 문자열 감지:
```javascript
const key = process.env.GA_SERVICE_ACCOUNT_KEY;
const client = key.startsWith('{')
  ? new BetaAnalyticsDataClient({ credentials: JSON.parse(key) })
  : new BetaAnalyticsDataClient({ keyFilename: key });
```

## 조회수 디버깅

```bash
# GA에서 실제로 수집 중인 경로 확인
npm run test:ga-paths

# views.json 직접 확인
cat public/views.json
```

## 추가 참고
- 상세 설정: [docs/GA_SETUP.md](../../docs/GA_SETUP.md)
- GA4 Property ID는 GA 콘솔 > 관리 > 속성 ID에서 확인
