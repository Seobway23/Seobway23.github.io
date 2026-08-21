import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// GitHub Pages — 프로젝트 사이트: base /RepoName/ · 사용자 사이트(*.github.io 레포): base /
// CI: 워크플로에서 VITE_BASE_PATH 설정 (로컬은 미설정 시 /)
//
// Windows Git Bash는 VITE_BASE_PATH=/foo/ 를 "C:/Program Files/Git/foo/" 로 바꿀 수 있음.
// 로컬 검증 시 선행 슬래시 없이 설정: VITE_BASE_PATH=RepoName
function resolveViteBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (!raw || raw === "/") return "/";
  let pathPart = raw.replace(/\\/g, "/");
  if (!pathPart.startsWith("/")) pathPart = `/${pathPart}`;
  if (pathPart.includes("Program Files") && pathPart.toLowerCase().includes("git")) {
    const m = pathPart.match(/\/([^/]+)\/?$/);
    pathPart = m ? `/${m[1]}` : "/";
  }
  return pathPart.endsWith("/") ? pathPart : `${pathPart}/`;
}

const base = resolveViteBase();

/**
 * 서브패스 배포·딥링크(/post/slug)에서도 아이콘이 항상 base 루트를 가리키도록.
 * "./favicon.svg" 같은 상대 경로는 /post/slug 에서 /post/favicon.svg 로 새어 404 가 난다.
 */
function faviconBasePlugin(): import("vite").Plugin {
  const abs = (file: string) => (base === "/" ? `/${file}` : `${base}${file}`);
  return {
    name: "favicon-base-href",
    transformIndexHtml(html) {
      return html
        .replace(/href="\.\/favicon\.svg"/, `href="${abs("favicon.svg")}"`)
        .replace(
          /href="\.\/apple-touch-icon\.png"/,
          `href="${abs("apple-touch-icon.png")}"`
        );
    },
  };
}

// PWA — 정적 블로그라 서버가 없다. 앱 셸(index.html + 엔트리 JS/CSS)만 프리캐시하고
// 나머지(레이지 청크·글 JSON·CDN 폰트)는 런타임 캐시로 채운다.
// dist 전체가 11MB 넘어 통째로 프리캐시하면 첫 방문 비용이 과하다.
const THEME_COLOR = "#0f172a"; // .dark --background
const pwa = VitePWA({
  registerType: "prompt", // 읽는 중 강제 새로고침 방지 — 배너로 사용자에게 맡긴다
  injectRegister: false, // src/components/pwa-update-prompt.tsx 에서 직접 등록
  includeAssets: [],
  manifest: {
    id: base,
    name: "Tech Blog — 모던 개발 블로그",
    short_name: "Tech Blog",
    description:
      "최신 프론트엔드 기술과 개발 경험을 공유하는 기술 블로그. React, TypeScript, 네트워크, 역학 등을 다룬다.",
    lang: "ko",
    start_url: base,
    scope: base,
    display: "standalone",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      { src: `${base}pwa-192x192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}pwa-512x512.png`, sizes: "512x512", type: "image/png" },
      {
        src: `${base}pwa-maskable-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    // 엔트리는 assets/app-*.js 로 고정(아래 rollupOptions) → 앱 셸만 정확히 골라낸다
    globPatterns: [
      "index.html",
      "favicon.svg",
      "apple-touch-icon.png",
      "pwa-*.png",
      "assets/app-*.js",
      "assets/*.css",
    ],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    // SPA — 모든 네비게이션은 index.html 로. 404.html 은 Pages 자체 폴백이라 제외
    navigateFallback: `${base}index.html`,
    navigateFallbackDenylist: [/^\/404\.html$/],
    runtimeCaching: [
      {
        // 레이지 청크(mermaid·three·katex…): 해시 파일명이라 내용이 불변
        urlPattern: ({ url, request, sameOrigin }) =>
          sameOrigin &&
          request.destination === "script" &&
          url.pathname.includes("/assets/"),
        handler: "CacheFirst",
        options: {
          cacheName: "app-chunks",
          expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // 글 목록·용어 사전: 캐시로 즉시 그리고 뒤에서 갱신
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          /\/(posts|posts-data|glossary|glossary-index)\.json$/.test(url.pathname),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "blog-content",
          expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 14 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // 댓글·조회수: 신선도 우선, 오프라인이면 캐시로 폴백
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && /\/(comments|recent-comments)\.json$/.test(url.pathname),
        handler: "NetworkFirst",
        options: {
          cacheName: "blog-social",
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: ({ request, sameOrigin }) =>
          sameOrigin && request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "blog-images",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        // Pretendard(jsdelivr) · highlight.js 테마(cdnjs) · Google Fonts
        urlPattern:
          /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
        handler: "CacheFirst",
        options: {
          cacheName: "cdn-assets",
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  devOptions: { enabled: false }, // 개발 중 SW 캐시로 헷갈리는 일 방지
});

export default defineConfig({
  base,
  plugins: [react(), faviconBasePlugin(), pwa],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 엔트리(앱 셸)와 레이지 청크를 이름으로 구분 → 서비스워커 프리캐시 대상 선별용
        entryFileNames: "assets/app-[hash].js",
        chunkFileNames: "assets/chunk-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
