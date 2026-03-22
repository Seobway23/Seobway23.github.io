import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// GitHub Pages 프로젝트 사이트: https://user.github.io/RepoName/ → base는 /RepoName/
// CI: VITE_BASE_PATH=/RepoName/ (워크플로에서 저장소 이름으로 설정)
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

export default defineConfig({
  base,
  plugins: [react()],
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
