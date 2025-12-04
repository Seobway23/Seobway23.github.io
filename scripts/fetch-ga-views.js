/**
 * Google Analytics에서 조회수 데이터를 가져와서 JSON 파일로 저장하는 스크립트
 * 
 * GitHub Actions에서 사용하는 프로덕션용 스크립트
 * 개발 모드에서는 scripts/fetch-ga-views-dev.js를 사용하세요.
 * 
 * 사용 전 설정:
 * 1. Google Cloud Console에서 프로젝트 생성
 * 2. Google Analytics Data API 활성화
 * 3. 서비스 계정 생성 및 JSON 키 다운로드
 * 4. GitHub Secrets에 GA_SERVICE_ACCOUNT_KEY, GA_PROPERTY_ID 설정
 * 
 * 자세한 설정 방법은 docs/GA_SETUP.md를 참고하세요.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 게시글 데이터 읽기
const postsPath = path.join(__dirname, '../src/lib/posts.ts');
const publicDir = path.join(__dirname, '../public');

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 게시글 slug 목록 가져오기
 * 실제로는 posts 데이터에서 가져와야 함
 */
function getPostSlugs() {
  // posts.ts 파일을 읽어서 slug 추출하거나
  // 별도의 posts.json 파일에서 읽기
  // 여기서는 예시로 하드코딩
  try {
    // posts 데이터를 동적으로 가져오는 것은 복잡하므로
    // 빌드 시점에 posts.json 파일을 생성하는 것을 권장
    const postsDataPath = path.join(publicDir, 'posts-data.json');
    if (fs.existsSync(postsDataPath)) {
      const postsData = JSON.parse(fs.readFileSync(postsDataPath, 'utf-8'));
      return postsData.map(post => ({
        slug: post.slug,
        path: `/post/${post.slug}`,
      }));
    }
  } catch (error) {
    console.warn('posts-data.json을 찾을 수 없습니다. 기본값을 사용합니다.');
  }
  
  return [];
}

/**
 * Google Analytics API로 조회수 가져오기
 * 
 * 참고: 실제 구현 시 Google Analytics Data API (GA4)를 사용해야 합니다.
 * 이 함수는 예시이며, 실제 API 호출 코드는 Google Analytics Data API 문서를 참고하세요.
 */
async function fetchViewsFromGA(postSlugs) {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.warn('Google Analytics 설정이 없습니다. 기본 조회수를 사용합니다.');
    return generateDefaultViews(postSlugs);
  }

  // TODO: Google Analytics Data API를 사용하여 실제 조회수 가져오기
  // 예시 코드:
  // const { BetaAnalyticsDataClient } = require('@google-analytics/data');
  // const analyticsDataClient = new BetaAnalyticsDataClient({
  //   keyFilename: GA_SERVICE_ACCOUNT_KEY,
  // });
  // 
  // const [response] = await analyticsDataClient.runReport({
  //   property: `properties/${GA_PROPERTY_ID}`,
  //   dateRanges: [{ startDate: '2020-01-01', endDate: 'today' }],
  //   dimensions: [{ name: 'pagePath' }],
  //   metrics: [{ name: 'screenPageViews' }],
  // });

  // 임시로 기본값 반환
  return generateDefaultViews(postSlugs);
}

/**
 * 기본 조회수 생성 (GA 설정이 없을 때)
 */
function generateDefaultViews(postSlugs) {
  const views = {};
  postSlugs.forEach(({ slug }) => {
    // 기존 posts 데이터의 views를 사용하거나 기본값 설정
    views[slug] = 0;
  });
  return views;
}

/**
 * 메인 함수
 */
async function main() {
  console.log('조회수 데이터 가져오기 시작...');
  
  const postSlugs = getPostSlugs();
  console.log(`총 ${postSlugs.length}개의 게시글 발견`);
  
  const views = await fetchViewsFromGA(postSlugs);
  
  // views.json 파일로 저장
  const viewsPath = path.join(publicDir, 'views.json');
  fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2), 'utf-8');
  
  console.log(`조회수 데이터를 ${viewsPath}에 저장했습니다.`);
  console.log('조회수 데이터:', views);
}

main().catch(console.error);

