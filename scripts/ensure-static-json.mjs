/**
 * CI에서 fetch:comments 실패 시에도 dist에 JSON이 포함되도록 기본 파일을 둔다.
 * public/*.json 은 .gitignore 로 커밋되지 않을 수 있음.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const defaults = [
  ["comments.json", "{}\n"],
  ["recent-comments.json", "[]\n"],
];

for (const [name, content] of defaults) {
  const filePath = path.join(publicDir, name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`[ensure-static-json] created ${name}`);
  }
}
