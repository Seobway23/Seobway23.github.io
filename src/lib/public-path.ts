/** Vite `base` (예: /CustomBlog/). 끝에 / 포함 */
export function getAssetBase(): string {
  return import.meta.env.BASE_URL;
}

/** 루트 기준 정적 파일 (posts.json 등) — 서브패스 배포 시 올바른 URL */
export function publicUrl(path: string): string {
  const base = getAssetBase();
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${p}`;
}
