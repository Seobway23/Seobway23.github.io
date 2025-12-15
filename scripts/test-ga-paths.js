/**
 * GA에서 실제 저장된 페이지 경로 확인 테스트 스크립트
 * 모든 페이지 경로를 조회해서 어떤 형식으로 저장되어 있는지 확인
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// .env 파일 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGAPaths() {
  console.log("=".repeat(60));
  console.log("🔍 GA 페이지 경로 확인 테스트");
  console.log("=".repeat(60));

  const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;
  const GA_SERVICE_ACCOUNT_KEY = process.env.GA_SERVICE_ACCOUNT_KEY;

  console.log(`\n[테스트] GA_PROPERTY_ID: ${GA_PROPERTY_ID || "❌ 없음"}`);
  console.log(
    `[테스트] GA_SERVICE_ACCOUNT_KEY: ${
      GA_SERVICE_ACCOUNT_KEY ? "✅ 설정됨" : "❌ 없음"
    }`
  );

  if (!GA_PROPERTY_ID || !GA_SERVICE_ACCOUNT_KEY) {
    console.error("\n❌ 환경 변수가 설정되지 않았습니다.");
    console.error(
      "   .env 파일에 GA_PROPERTY_ID와 GA_SERVICE_ACCOUNT_KEY를 설정하세요."
    );
    return;
  }

  try {
    // 서비스 계정 키 로드
    let credentials;
    const keyPath = path.resolve(__dirname, "..", GA_SERVICE_ACCOUNT_KEY);

    if (fs.existsSync(keyPath)) {
      credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      console.log(`\n[테스트] ✅ 키 파일 로드 성공`);
    } else {
      try {
        credentials = JSON.parse(GA_SERVICE_ACCOUNT_KEY);
        console.log(`\n[테스트] ✅ JSON 문자열 파싱 성공`);
      } catch {
        throw new Error("GA_SERVICE_ACCOUNT_KEY를 파싱할 수 없습니다.");
      }
    }

    // Analytics Data API 클라이언트 초기화
    const { BetaAnalyticsDataClient } = await import("@google-analytics/data");
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials,
    });

    // 여러 날짜 범위로 시도 (GA4 Data API는 실시간 데이터가 아닌 집계 데이터만 조회 가능)
    const dateRanges = [
      { startDate: "today", endDate: "today", label: "오늘" },
      { startDate: "yesterday", endDate: "yesterday", label: "어제" },
      { startDate: "7daysAgo", endDate: "today", label: "최근 7일" },
      { startDate: "30daysAgo", endDate: "today", label: "최근 30일" },
      { startDate: "2020-01-01", endDate: "today", label: "전체" },
    ];

    let foundData = false;

    for (const dateRange of dateRanges) {
      console.log(`\n[테스트] 📅 ${dateRange.label} 데이터 조회 시도...`);
      try {
        const [response] = await analyticsDataClient.runReport({
          property: `properties/${GA_PROPERTY_ID}`,
          dateRanges: [
            { startDate: dateRange.startDate, endDate: dateRange.endDate },
          ],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [
            {
              metric: { metricName: "screenPageViews" },
              desc: true,
            },
          ],
          limit: 100,
        });

        const rowCount = response.rows?.length || 0;
        console.log(
          `[테스트] ${dateRange.label}: ${rowCount}개의 페이지 경로 발견`
        );

        if (rowCount > 0) {
          foundData = true;
          console.log(
            `\n📋 ${dateRange.label} 페이지 경로 목록 (상위 20개):\n`
          );
          response.rows.slice(0, 20).forEach((row, index) => {
            const pagePath = row.dimensionValues[0].value;
            const views = row.metricValues[0].value;
            console.log(
              `  ${index + 1}. ${pagePath} - ${parseInt(
                views,
                10
              ).toLocaleString()}회`
            );
          });

          // /post로 시작하는 경로만 필터링
          const postPaths = response.rows.filter((row) => {
            const pagePath = row.dimensionValues[0].value;
            return pagePath.startsWith("/post");
          });

          if (postPaths.length > 0) {
            console.log(`\n📝 /post로 시작하는 경로: ${postPaths.length}개\n`);
            postPaths.forEach((row, index) => {
              const pagePath = row.dimensionValues[0].value;
              const views = row.metricValues[0].value;
              console.log(
                `  ${index + 1}. ${pagePath} - ${parseInt(
                  views,
                  10
                ).toLocaleString()}회`
              );
            });
          } else {
            console.log(
              `\n⚠️ ${dateRange.label}에 /post로 시작하는 경로가 없습니다.`
            );
          }
          break; // 데이터를 찾으면 중단
        }
      } catch (error) {
        console.error(
          `[테스트] ❌ ${dateRange.label} 조회 실패:`,
          error.message
        );
      }
    }

    if (!foundData) {
      console.log("\n⚠️ 모든 날짜 범위에서 데이터를 찾을 수 없습니다.");
      console.log("\n💡 가능한 원인:");
      console.log(
        "   1. GA4 Data API는 실시간 데이터가 아닌 집계 데이터만 조회 가능"
      );
      console.log("      (실시간 데이터는 GA 대시보드에서만 확인 가능)");
      console.log(
        "   2. 데이터가 아직 집계되지 않았을 수 있음 (최소 몇 시간 지연)"
      );
      console.log("   3. Property ID가 잘못되었을 수 있음");
      console.log("   4. 서비스 계정 권한 문제");
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n❌ 오류 발생:", error.message);
    console.error("상세:", error);
  }
}

testGAPaths().catch(console.error);
