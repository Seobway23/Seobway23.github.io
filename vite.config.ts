import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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

/** 서브패스 배포에서도 파비콘이 항상 base 루트를 가리키도록 */
function faviconBasePlugin(): import("vite").Plugin {
  const faviconHref = base === "/" ? "/favicon.svg" : `${base}favicon.svg`;
  return {
    name: "favicon-base-href",
    transformIndexHtml(html) {
      return html.replace(
        /href="\.\/favicon\.svg"/,
        `href="${faviconHref}"`
      );
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), faviconBasePlugin()],
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
  },
});
