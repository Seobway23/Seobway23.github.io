/**
 * 포스트 내 mermaid 블록에서 classDef / class 줄 제거 (테마는 앱 라이트·다크만 사용)
 * 실행: node scripts/strip-mermaid-class-styles.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = [
  path.join(__dirname, "../posts/study/infra/gitlab-artifacts-vs-cache.md"),
  path.join(__dirname, "../posts/study/infra/gitlab-cicd-guide.md"),
];

for (const filePath of files) {
  let s = fs.readFileSync(filePath, "utf8");
  s = s.replace(/```mermaid\r?\n([\s\S]*?)```/g, (_, body) => {
    const lines = body.split(/\r?\n/);
    const out = lines.filter((line) => {
      const t = line.trim();
      if (t.startsWith("classDef")) return false;
      if (/^class\s/.test(t)) return false;
      return true;
    });
    return "```mermaid\n" + out.join("\n") + "\n```";
  });
  fs.writeFileSync(filePath, s);
  console.log("OK", filePath);
}
