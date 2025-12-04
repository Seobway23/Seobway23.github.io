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
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) {
    console.warn("Google Analytics Measurement ID가 설정되지 않았습니다.");
    return;
  }

  // 이미 초기화되었으면 스킵 (gtag 함수가 정의되어 있고 dataLayer가 있는지 확인)
  if (typeof window.gtag === "function" && window.dataLayer) {
    return;
  }

  // Google Analytics 스크립트 로드
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // gtag 초기화 스크립트
  const script2 = document.createElement("script");
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
    });
  `;
  document.head.appendChild(script2);
};

/**
 * 페이지뷰 추적
 */
export const trackPageView = (path: string) => {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: path,
  });
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
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) {
    return;
  }

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * 게시글 조회수 추적
 * @param postSlug 게시글 slug
 * @param postTitle 게시글 제목
 */
export const trackPostView = (postSlug: string, postTitle: string) => {
  trackEvent("view", "post", postSlug);

  // 페이지뷰도 함께 추적 (GA4에서 페이지뷰로도 조회 가능)
  trackPageView(`/post/${postSlug}`);

  // 커스텀 이벤트로 게시글 정보 전달
  if (window.gtag) {
    window.gtag("event", "post_view", {
      post_slug: postSlug,
      post_title: postTitle,
    });
  }
};
