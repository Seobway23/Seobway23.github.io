/**
 * Google Analytics에서 조회수 데이터를 가져와서 JSON 파일로 저장하는 스크립트
 * (개발 모드용 - 로컬에서 사용)
 *
 * 사용 전 설정:
 * 1. Google Cloud Console에서 프로젝트 생성
 * 2. Google Analytics Data API 활성화
 * 3. 서비스 계정 생성 및 JSON 키 다운로드
 * 4. .env 파일에 GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_KEY 설정
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// .env 파일 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../public");
const postsDataPath = path.join(publicDir, "posts-data.json");

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 게시글 slug 목록 가져오기
 */
function getPostSlugs() {
  try {
    if (fs.existsSync(postsDataPath)) {
      const postsData = JSON.parse(fs.readFileSync(postsDataPath, "utf-8"));
      return postsData.map((post) => ({
        slug: post.slug,
        path: post.path || `/post/${post.slug}`,
      }));
    }
  } catch (error) {
    console.warn(
      "⚠️ posts-data.json을 찾을 수 없습니다. generate-posts-data.js를 먼저 실행하세요."
    );
  }

  return [];
}

/**
 * Google Analytics Data API로 조회수 가져오기
 */
async function fetchViewsFromGA(postSlugs) {
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.warn(
      "⚠️ Google Analytics 설정이 없습니다. 기본 조회수(0)를 사용합니다."
    );
    console.warn(
      "   .env 파일에 GA_PROPERTY_ID와 GA_SERVICE_ACCOUNT_KEY를 설정하세요."
    );
    return generateDefaultViews(postSlugs);
  }

  try {
    // GA_SERVICE_ACCOUNT_KEY는 파일 경로 또는 JSON 문자열일 수 있음
    let credentials;
    const keyPath = path.resolve(__dirname, "..", GA_SERVICE_ACCOUNT_KEY);

    if (fs.existsSync(keyPath)) {
      // 파일 경로인 경우
      credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    } else {
      // JSON 문자열인 경우
      try {
        credentials = JSON.parse(GA_SERVICE_ACCOUNT_KEY);
      } catch {
        throw new Error(
          "GA_SERVICE_ACCOUNT_KEY를 파싱할 수 없습니다. 파일 경로 또는 JSON 문자열이어야 합니다."
        );
      }
    }

    // @google-analytics/data 패키지 동적 import
    const { BetaAnalyticsDataClient } = await import("@google-analytics/data");

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });

    console.log("📊 Google Analytics에서 조회수 데이터 가져오는 중...");

    // 각 게시글 경로에 대한 조회수 가져오기
    const views = {};

    for (const post of postSlugs) {
      try {
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${GA_PROPERTY_ID}`,
          dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          dimensionFilter: {
            filter: {
              fieldName: "pagePath",
              stringFilter: {
                matchType: "EXACT",
                value: post.path,
              },
            },
          },
        });

        let totalViews = 0;
        if (response.rows && response.rows.length > 0) {
          totalViews = parseInt(
            response.rows[0].metricValues[0].value || "0",
            10
          );
        }

        views[post.slug] = totalViews;
        console.log(`  ✓ ${post.slug}: ${totalViews}회`);
      } catch (error) {
        console.warn(`  ⚠️ ${post.slug} 조회수 가져오기 실패:`, error.message);
        views[post.slug] = 0;
      }
    }

    return views;
  } catch (error) {
    console.error("❌ Google Analytics API 오류:", error.message);
    console.warn("⚠️ 기본 조회수(0)를 사용합니다.");
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
  console.log("📊 조회수 데이터 가져오기 시작 (개발 모드)...");

  const postSlugs = getPostSlugs();
  console.log(`📝 ${postSlugs.length}개의 게시글 발견`);

  if (postSlugs.length === 0) {
    console.warn(
      "⚠️ 게시글이 없습니다. generate-posts-data.js를 먼저 실행하세요."
    );
  }

  const views = await fetchViewsFromGA(postSlugs);

  // views.json 파일로 저장
  const viewsPath = path.join(publicDir, "views.json");
  fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2), "utf-8");

  console.log(`\n✅ 조회수 데이터를 ${viewsPath}에 저장했습니다.`);
  console.log("📊 조회수 데이터:", views);
}

main().catch(console.error);
