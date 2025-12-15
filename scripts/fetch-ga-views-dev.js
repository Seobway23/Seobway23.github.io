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
      return postsData.map((post) => {
        // 실제 라우팅 경로 사용: /post/:slug 형식
        // 프론트에서 trackPageView(`/post/${postSlug}`)로 보내므로 동일한 형식으로 조회
        const actualPath = `/post/${post.slug}`;
        console.log(
          `[GA 조회수] 게시글 경로 매핑: ${post.slug} -> ${actualPath}`
        );
        return {
          slug: post.slug,
          path: actualPath, // 실제 라우팅 경로 사용
        };
      });
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
  console.log("\n[GA 조회수] 환경 변수 확인 중...");
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;

  console.log(
    `[GA 조회수] GA_PROPERTY_ID: ${GA_PROPERTY_ID ? "✅ 설정됨" : "❌ 없음"}`
  );
  console.log(
    `[GA 조회수] GA_SERVICE_ACCOUNT_KEY: ${
      GA_SERVICE_ACCOUNT_KEY ? "✅ 설정됨" : "❌ 없음"
    }`
  );

  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.warn(
      "\n⚠️ Google Analytics 설정이 없습니다. 기본 조회수(0)를 사용합니다."
    );
    console.warn("   .env 파일에 다음을 설정하세요:");
    console.warn("   GA_PROPERTY_ID=123456789");
    console.warn("   GA_SERVICE_ACCOUNT_KEY=./ga-service-account-key.json");
    return generateDefaultViews(postSlugs);
  }

  try {
    console.log("\n[GA 조회수] 서비스 계정 키 로드 중...");
    // GA_SERVICE_ACCOUNT_KEY는 파일 경로 또는 JSON 문자열일 수 있음
    let credentials;
    const keyPath = path.resolve(__dirname, "..", GA_SERVICE_ACCOUNT_KEY);
    console.log(`[GA 조회수] 키 파일 경로 확인: ${keyPath}`);

    if (fs.existsSync(keyPath)) {
      // 파일 경로인 경우
      console.log("[GA 조회수] ✅ 키 파일 발견, 로드 중...");
      credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      console.log(
        `[GA 조회수] ✅ 키 파일 로드 성공 (project_id: ${credentials.project_id})`
      );
    } else {
      // JSON 문자열인 경우
      console.log("[GA 조회수] 키 파일 없음, JSON 문자열로 파싱 시도...");
      try {
        credentials = JSON.parse(GA_SERVICE_ACCOUNT_KEY);
        console.log("[GA 조회수] ✅ JSON 문자열 파싱 성공");
      } catch {
        throw new Error(
          "GA_SERVICE_ACCOUNT_KEY를 파싱할 수 없습니다. 파일 경로 또는 JSON 문자열이어야 합니다."
        );
      }
    }

    // @google-analytics/data 패키지 동적 import
    console.log("[GA 조회수] Analytics Data API 클라이언트 초기화 중...");
    const { BetaAnalyticsDataClient } = await import("@google-analytics/data");

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });
    console.log("[GA 조회수] ✅ 클라이언트 초기화 완료");

    console.log(`\n📊 Google Analytics에서 조회수 데이터 가져오는 중...`);
    console.log(`[GA 조회수] Property ID: ${GA_PROPERTY_ID}`);
    console.log(`[GA 조회수] 조회할 게시글 수: ${postSlugs.length}개\n`);

    // 각 게시글 경로에 대한 조회수 가져오기
    const views = {};

    for (const post of postSlugs) {
      try {
        console.log(
          `[GA 조회수] ${post.slug} 조회수 요청 중... (경로: ${post.path})`
        );
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

        console.log(`[GA 조회수] ${post.slug} API 응답:`, {
          rowsCount: response.rows?.length || 0,
          hasData: !!(response.rows && response.rows.length > 0),
        });

        let totalViews = 0;
        if (response.rows && response.rows.length > 0) {
          const rawValue = response.rows[0].metricValues[0].value || "0";
          totalViews = parseInt(rawValue, 10);
          console.log(
            `[GA 조회수] ${post.slug} 원본 값: ${rawValue} → 파싱: ${totalViews}`
          );
        } else {
          console.log(`[GA 조회수] ${post.slug} 데이터 없음 (0으로 설정)`);
        }

        views[post.slug] = totalViews;
        console.log(`  ✓ ${post.slug}: ${totalViews}회\n`);
      } catch (error) {
        console.error(`  ❌ ${post.slug} 조회수 가져오기 실패:`, error.message);
        console.error(`  [GA 조회수] 에러 상세:`, error);
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
  console.log("=".repeat(60));
  console.log("📊 조회수 데이터 가져오기 시작 (개발 모드)");
  console.log("=".repeat(60));

  const postSlugs = getPostSlugs();
  console.log(`\n[메인] 📝 ${postSlugs.length}개의 게시글 발견`);
  if (postSlugs.length > 0) {
    console.log("[메인] 게시글 목록:");
    postSlugs.forEach((post, idx) => {
      console.log(`  ${idx + 1}. ${post.slug} (경로: ${post.path})`);
    });
  }

  if (postSlugs.length === 0) {
    console.warn(
      "\n⚠️ 게시글이 없습니다. generate-posts-data.js를 먼저 실행하세요."
    );
    console.warn("   실행 명령: npm run generate:posts");
    return;
  }

  const views = await fetchViewsFromGA(postSlugs);

  // views.json 파일로 저장
  const viewsPath = path.join(publicDir, "views.json");
  console.log(`\n[메인] views.json 파일 저장 중: ${viewsPath}`);
  fs.writeFileSync(viewsPath, JSON.stringify(views, null, 2), "utf-8");

  console.log(`\n✅ 조회수 데이터를 ${viewsPath}에 저장했습니다.`);
  console.log("\n📊 최종 조회수 데이터:");
  console.log(JSON.stringify(views, null, 2));
  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
