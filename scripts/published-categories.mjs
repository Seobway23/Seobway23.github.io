/**
 * 공개 중인 카테고리 목록.
 *
 * 여기 적힌 경로(posts/ 기준) 아래 글만 빌드에 들어간다. 나머지 폴더의 글은
 * 파일은 그대로 두고 목록·검색·사이트맵·개념 지도에서 빠진다(비활성).
 * 다시 켜려면 경로를 이 배열에 추가하고 `npm run generate:posts` 를 돌린다.
 */
import path from "node:path";

export const PUBLISHED_CATEGORIES = [
  "work",
  "frontend/javascript",
  "frontend/react",
  "frontend/typescript",
  "frontend/styling",
  "study/network",
  "study/electron",
];

/** posts/ 기준 상대 경로(파일 또는 폴더)가 공개 카테고리 아래인가 */
export function isPublishedPath(relativePath) {
  const rel = relativePath.split(path.sep).join("/");
  return PUBLISHED_CATEGORIES.some((c) => rel === c || rel.startsWith(`${c}/`));
}
