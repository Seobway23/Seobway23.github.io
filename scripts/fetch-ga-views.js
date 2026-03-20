/**
 * Google Analytics에서 조회수 데이터를 가져와서 JSON 파일로 저장하는 스크립트
 * (프로덕션 빌드용 - GitHub Actions에서 사용)
 *
 * 사용 전 설정:
 * 1. Google Cloud Console에서 프로젝트 생성
 * 2. Google Analytics Data API 활성화
 * 3. 서비스 계정 생성 및 JSON 키 다운로드
 * 4. GitHub Secrets에 GA_PROPERTY_ID, GA_SERVICE_ACCOUNT_KEY 설정
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
        // posts-data.json의 path 필드를 우선 사용
        // 만약 path가 없으면 /post/${slug} 형식 사용
        const originalPath = post.path || `/post/${post.slug}`;
        // trackPostView에서도 /post/${slug} 형식으로 보내므로 두 경로 모두 시도
        const slugPath = `/post/${post.slug}`;
        return {
          slug: post.slug,
          path: originalPath, // posts-data.json의 원본 path 필드 사용
          slugPath: slugPath, // 추가로 slug 기반 경로도 저장
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
  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;

  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.warn(
      "⚠️ Google Analytics 설정이 없습니다. 기본 조회수(0)를 사용합니다."
    );
    return generateDefaultViews(postSlugs);
  }

  try {
    // GA_SERVICE_ACCOUNT_KEY는 JSON 문자열이거나 파일 경로일 수 있음
    let credentials;
    try {
      // JSON 문자열로 파싱 시도
      credentials = JSON.parse(GA_SERVICE_ACCOUNT_KEY);
    } catch {
      // 파일 경로로 시도
      const keyPath = path.resolve(__dirname, GA_SERVICE_ACCOUNT_KEY);
      if (fs.existsSync(keyPath)) {
        credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      } else {
        throw new Error("GA_SERVICE_ACCOUNT_KEY를 파싱할 수 없습니다.");
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
        // 두 경로 모두 시도: 원본 경로와 slug 기반 경로
        const pathsToTry = [
          post.path, // posts-data.json의 원본 경로
          post.slugPath || `/post/${post.slug}`, // slug 기반 경로
        ].filter(Boolean); // undefined 제거

        let totalViews = 0;

        // 각 경로를 시도하여 조회수 합산
        for (const queryPath of pathsToTry) {
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
                    value: queryPath,
                  },
                },
              },
            });

            if (response.rows && response.rows.length > 0) {
              const viewsForPath = parseInt(
                response.rows[0].metricValues[0].value || "0",
                10
              );
              totalViews += viewsForPath;
            }
          } catch (error) {
            // 개별 경로 조회 실패는 무시하고 계속 진행
            console.warn(
              `  ⚠️ ${post.slug} (${queryPath}) 조회 실패:`,
              error.message
            );
          }
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
  console.log("📊 조회수 데이터 가져오기 시작...");

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
