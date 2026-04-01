/** Vite `base` (예: /CustomBlog/). 끝에 / 포함 */
export function getAssetBase(): string {
  return import.meta.env.BASE_URL;
}

/** 루트 기준 정적 파일 (posts.json 등) — 서브패스 배포 시 올바른 URL */
export function publicUrl(path: string): string {
  const base = getAssetBase();
  const p = path.startsWith("/") ? path.slice(1) : path;
  // Dev server에서 base가 서브패스로 잡힌 경우에도 public/ 정적 파일은 루트에서 서빙되는 케이스가 있다.
  // (예: BASE_URL=/RepoName/ 이지만 /RepoName/posts.json 은 index.html로 fallback)
  // 개발 모드에서는 루트(/)를 우선 사용해 JSON fetch 실패를 방지한다.
  if (import.meta.env.DEV && base !== "/") {
    return `/${p}`;
  }
  return `${base}${p}`;
}
