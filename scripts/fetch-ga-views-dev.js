/**
 * 개발 모드용: Google Analytics 조회수 가져오기
 * 
 * 사용 전 설정:
 * 1. Google Cloud Console에서 프로젝트 생성
 * 2. Google Analytics Data API 활성화
 * 3. 서비스 계정 생성 및 JSON 키 다운로드
 * 4. .env 파일에 다음 환경 변수 추가:
 *    GA_PROPERTY_ID=your_property_id
 *    GA_SERVICE_ACCOUNT_KEY=./path/to/service-account-key.json
 * 
 * 실행:
 * node scripts/fetch-ga-views-dev.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수에서 설정 가져오기
const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;
const publicDir = path.join(__dirname, '../public');

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 게시글 slug 목록 가져오기
 */
function getPostSlugs() {
  try {
    const postsPath = path.join(__dirname, '../src/lib/posts.ts');
    const postsContent = fs.readFileSync(postsPath, 'utf-8');
    
    const slugMatches = postsContent.matchAll(/slug:\s*["']([^"']+)["']/g);
    const slugs = Array.from(slugMatches, match => match[1]);
    
    if (slugs.length > 0) {
      return slugs.map(slug => ({
        slug,
        path: `/post/${slug}`,
      }));
    }
  } catch (error) {
    console.warn('posts.ts에서 slug를 추출할 수 없습니다:', error.message);
  }
  
  return [];
}

/**
 * Google Analytics Data API로 조회수 가져오기
 */
async function fetchViewsFromGA(postSlugs) {
  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.warn('⚠️  Google Analytics 설정이 없습니다.');
    console.warn('\n📋 개발 모드 사용법:');
    console.warn('1. .env 파일 생성 (프로젝트 루트에)');
    console.warn('2. 다음 내용 추가:');
    console.warn('   GA_PROPERTY_ID=your_property_id');
    console.warn('   GA_SERVICE_ACCOUNT_KEY=./path/to/service-account-key.json');
    console.warn('\n현재는 기본값(0)을 사용합니다.\n');
    return generateDefaultViews(postSlugs);
  }

  // 서비스 계정 키 파일 경로 확인
  const keyPath = path.resolve(__dirname, '..', GA_SERVICE_ACCOUNT_KEY);
  if (!fs.existsSync(keyPath)) {
    console.error(`❌ 서비스 계정 키 파일을 찾을 수 없습니다: ${keyPath}`);
    return generateDefaultViews(postSlugs);
  }

  try {
    const analyticsDataClient = new BetaAnalyticsDataClient({
      keyFilename: keyPath,
    });

    const views = {};
    
    // 각 게시글에 대해 조회수 가져오기
    for (const { slug, path: postPath } of postSlugs) {
      try {
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${GA_PROPERTY_ID}`,
          dateRanges: [
            {
              startDate: '2020-01-01', // 시작일 (필요에 따라 변경)
              endDate: 'today',
            },
          ],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          dimensionFilter: {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'EXACT',
                value: postPath,
              },
            },
          },
        });

        let totalViews = 0;
        if (response.rows) {
          response.rows.forEach(row => {
            const metricValue = row.metricValues?.[0]?.value || '0';
            totalViews += parseInt(metricValue, 10);
          });
        }

        views[slug] = totalViews;
        console.log(`  ✓ ${slug}: ${totalViews}회 조회`);
      } catch (error) {
        console.warn(`  ⚠️  ${slug} 조회수 가져오기 실패:`, error.message);
        views[slug] = 0;
      }
    }

    return views;
  } catch (error) {
    console.error('Google Analytics API 호출 실패:', error.message);
    return generateDefaultViews(postSlugs);
  }
}

/**
 * 기본 조회수 생성 (GA 설정이 없을 때)
 */
function generateDefaultViews(postSlugs) {
  const views = {};
  postSlugs.forEach(({ slug }) => {
    views[slug] = 0;
  });
  return views;
}

/**
 * 메인 함수
 */
async function main() {
  console.log('📊 Google Analytics 조회수 데이터 가져오기 시작...');
  
  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.log('\n📖 Google Analytics 설정 가이드:');
    console.log('1. Google Cloud Console 접속: https://console.cloud.google.com/');
    console.log('2. 프로젝트 생성 또는 선택');
    console.log('3. "API 및 서비스" > "라이브러리"에서 "Google Analytics Data API" 활성화');
    console.log('4. "API 및 서비스" > "사용자 인증 정보" > "서비스 계정 만들기"');
    console.log('5. 서비스 계정 생성 후 JSON 키 다운로드');
    console.log('6. 다운로드한 JSON 파일을 프로젝트에 저장 (예: ./ga-service-account-key.json)');
    console.log('7. Google Analytics에서 서비스 계정 이메일에 "뷰어" 권한 부여');
    console.log('8. .env 파일에 다음 추가:');
    console.log('   GA_PROPERTY_ID=your_property_id (GA4 속성 ID, 예: 123456789)');
    console.log('   GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json');
    console.log('\n');
  } else {
    console.log(`📦 속성 ID: ${GA_PROPERTY_ID}`);
    console.log(`🔑 서비스 계정 키: ${GA_SERVICE_ACCOUNT_KEY}`);
  }
  
  const postSlugs = getPostSlugs();
  console.log(`📝 총 ${postSlugs.length}개의 게시글 발견\n`);
  
  const views = await fetchViewsFromGA(postSlugs);
  
  // views.json 파일로 저장
  const viewsPath = path.join(publicDir, 'views.json');
  fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2), 'utf-8');
  
  console.log(`\n✅ 조회수 데이터를 ${viewsPath}에 저장했습니다.`);
  console.log('📊 조회수 데이터:', views);
}

main().catch(console.error);

