/**
 * public/study/roadmap/*.html (정적 페이지, Vite 번들 밖) 는 mermaid를
 * 외부 CDN(jsdelivr) 대신 이미 설치된 node_modules/mermaid에서 복사한
 * 로컬 사본으로 로드한다. CDN 도메인이 차단된 네트워크에서도 항상 동작하고,
 * `npm install`이 어차피 매 빌드마다 받는 패키지를 재사용하므로 추가 다운로드가 없다.
 * public/study/roadmap/assets/mermaid 는 .gitignore 대상이라 커밋되지 않고
 * 빌드할 때마다 이 스크립트가 다시 만든다.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mermaidDist = path.join(__dirname, "../node_modules/mermaid/dist");
const targetDir = path.join(__dirname, "../public/study/roadmap/assets/mermaid");

if (!fs.existsSync(mermaidDist)) {
  console.warn("[copy-roadmap-mermaid] node_modules/mermaid/dist 없음 — npm install 먼저 실행할 것. 건너뜀.");
  process.exit(0);
}

function copyMjs(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyMjs(srcPath, destPath);
    } else if (entry.name.endsWith(".mjs")) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(
  path.join(mermaidDist, "mermaid.esm.min.mjs"),
  path.join(targetDir, "mermaid.esm.min.mjs")
);
copyMjs(
  path.join(mermaidDist, "chunks/mermaid.esm.min"),
  path.join(targetDir, "chunks/mermaid.esm.min")
);

console.log("[copy-roadmap-mermaid] mermaid ESM 번들을 public/study/roadmap/assets/mermaid 로 복사함");
