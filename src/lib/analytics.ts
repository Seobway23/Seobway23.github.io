/**
 * Google Analytics 유틸리티
 *
 * 사용 전 설정:
 * 1. Google Analytics 계정 생성
 * 2. Measurement ID 발급 (예: G-XXXXXXXXXX)
 * 3. 환경 변수에 VITE_GA_MEASUREMENT_ID 설정
 */

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

/**
 * Google Analytics 초기화
 */
export const initGA = () => {
  console.log("[GA] Google Analytics 초기화 시작...");
  console.log("[GA] Measurement ID:", GA_MEASUREMENT_ID || "❌ 설정되지 않음");
  console.log(
    "[GA] 현재 URL:",
    typeof window !== "undefined" ? window.location.href : "N/A"
  );

  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) {
    console.warn(
      "[GA] ❌ Google Analytics Measurement ID가 설정되지 않았습니다."
    );
    console.warn(
      "[GA] .env 파일에 VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX 형식으로 설정하세요."
    );
    return;
  }

  // 이미 초기화되었으면 스킵 (gtag 함수가 정의되어 있고 dataLayer가 있는지 확인)
  if (typeof window.gtag === "function" && window.dataLayer) {
    console.log("[GA] ✅ 이미 초기화되어 있습니다.");
    return;
  }

  console.log("[GA] 스크립트 로드 중...");
  // Google Analytics 스크립트 로드
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script1.onload = () => {
    console.log("[GA] ✅ gtag.js 스크립트 로드 완료");
  };
  script1.onerror = () => {
    console.error("[GA] ❌ gtag.js 스크립트 로드 실패");
  };
  document.head.appendChild(script1);

  // gtag 초기화 스크립트
  const script2 = document.createElement("script");
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
      debug_mode: true
    });
    console.log('[GA] ✅ gtag 초기화 완료:', '${GA_MEASUREMENT_ID}');
    console.log('[GA] 현재 페이지 경로:', window.location.pathname);
  `;
  document.head.appendChild(script2);
  console.log("[GA] ✅ Google Analytics 초기화 완료");
};

/**
 * 페이지뷰 추적
 */
export const trackPageView = (path: string) => {
  console.log("[GA] 📊 페이지뷰 추적 시도:", path);
  console.log(
    "[GA] gtag 함수 존재:",
    typeof window !== "undefined" && typeof window.gtag === "function"
  );
  console.log("[GA] Measurement ID:", GA_MEASUREMENT_ID || "❌ 없음");

  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) {
    console.warn("[GA] ❌ 페이지뷰 추적 실패: 조건 불만족");
    return;
  }

  try {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
    });
    console.log("[GA] ✅ 페이지뷰 추적 성공:", path);
  } catch (error) {
    console.error("[GA] ❌ 페이지뷰 추적 에러:", error);
  }
};

/**
 * 커스텀 이벤트 추적
 * @param action 이벤트 액션 (예: 'view', 'click')
 * @param category 이벤트 카테고리 (예: 'post', 'button')
 * @param label 이벤트 라벨 (예: post slug)
 * @param value 이벤트 값 (예: 조회수)
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  console.log("[GA] 🎯 이벤트 추적 시도:", { action, category, label, value });
  console.log(
    "[GA] gtag 함수 존재:",
    typeof window !== "undefined" && typeof window.gtag === "function"
  );
  console.log("[GA] Measurement ID:", GA_MEASUREMENT_ID || "❌ 없음");

  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) {
    console.warn("[GA] ❌ 이벤트 추적 실패: 조건 불만족");
    return;
  }

  try {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
    console.log("[GA] ✅ 이벤트 추적 성공:", {
      action,
      category,
      label,
      value,
    });
  } catch (error) {
    console.error("[GA] ❌ 이벤트 추적 에러:", error);
  }
};

/**
 * 게시글 조회수 추적
 * @param postSlug 게시글 slug
 * @param postTitle 게시글 제목
 */
export const trackPostView = (postSlug: string, postTitle: string) => {
  console.log("[GA] 📝 게시글 조회수 추적 시작:", { postSlug, postTitle });

  trackEvent("view", "post", postSlug);

  // 페이지뷰도 함께 추적 (GA4에서 페이지뷰로도 조회 가능)
  // 실제 라우팅 경로 사용: /post/:slug 형식
  const pagePath = `/post/${postSlug}`;
  console.log("[GA] 📍 페이지 경로:", pagePath);
  trackPageView(pagePath);

  // 커스텀 이벤트로 게시글 정보 전달
  if (window.gtag && GA_MEASUREMENT_ID) {
    try {
      window.gtag("event", "post_view", {
        post_slug: postSlug,
        post_title: postTitle,
      });
      console.log("[GA] ✅ post_view 이벤트 전송 성공:", {
        postSlug,
        postTitle,
      });
    } catch (error) {
      console.error("[GA] ❌ post_view 이벤트 전송 에러:", error);
    }
  } else {
    console.warn(
      "[GA] ❌ post_view 이벤트 전송 실패: gtag 또는 Measurement ID 없음"
    );
  }
};
