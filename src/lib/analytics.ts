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
    return;
  }

  if (typeof window.gtag === "function" && window.dataLayer) {
    return;
  }

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      page_path: window.location.pathname
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

  try {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
    });
  } catch {
    // silent fail
  }
};

/**
 * 커스텀 이벤트 추적
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

  try {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } catch {
    // silent fail
  }
};

/**
 * 게시글 조회수 추적 (GA 이벤트 + 페이지뷰)
 */
export const trackPostView = (postSlug: string, postTitle: string) => {
  trackEvent("view", "post", postSlug);
  trackPageView(`/post/${postSlug}`);

  if (window.gtag && GA_MEASUREMENT_ID) {
    try {
      window.gtag("event", "post_view", {
        post_slug: postSlug,
        post_title: postTitle,
      });
    } catch {
      // silent fail
    }
  }
};
