/**
 * 코드 색상 테마 (syntax highlighting theme).
 *
 * 본문 코드 블록과 플레이그라운드 편집기는 highlight.js 로 색을 입힌다.
 * 색은 CDN 스타일시트가 정하는데, index.html 에 이미 두 개의 <link> 가 있다.
 *   <link class="light-syntax">  라이트 테마일 때 활성
 *   <link class="dark-syntax">   다크 테마일 때 활성
 * (활성/비활성 전환은 src/hooks/use-theme.tsx 가 disabled 로 한다.)
 *
 * 여기서는 그 두 <link> 의 href 만 갈아 끼워 "어떤 색 조합을 쓸지"를 바꾼다.
 * 테마마다 라이트/다크 한 쌍을 갖고 있어 사이트 테마를 바꿔도 느낌이 유지된다.
 */

export interface CodeTheme {
  id: string;
  label: string;
  /** 라이트 모드에서 쓸 hljs 스타일 파일명 (확장자 제외) */
  light: string;
  /** 다크 모드에서 쓸 hljs 스타일 파일명 (확장자 제외) */
  dark: string;
  /** 선택 버튼에 보여줄 대표 색 4개 — 실제 테마 팔레트에서 뽑았다 */
  swatch: [string, string, string, string];
}

const HLJS_VERSION = "11.9.0";
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${HLJS_VERSION}/styles`;

export const CODE_THEMES: CodeTheme[] = [
  {
    id: "github",
    label: "GitHub",
    light: "github",
    dark: "github-dark",
    swatch: ["#0d1117", "#ff7b72", "#79c0ff", "#a5d6ff"],
  },
  {
    id: "atom-one",
    label: "Atom One",
    light: "atom-one-light",
    dark: "atom-one-dark",
    swatch: ["#282c34", "#c678dd", "#61afef", "#98c379"],
  },
  {
    id: "stackoverflow",
    label: "Stack Overflow",
    light: "stackoverflow-light",
    dark: "stackoverflow-dark",
    swatch: ["#1c1b1b", "#ab6526", "#0092c2", "#54790d"],
  },
  {
    id: "tokyo-night",
    label: "Tokyo Night",
    light: "tokyo-night-light",
    dark: "tokyo-night-dark",
    swatch: ["#1a1b26", "#bb9af7", "#7aa2f7", "#9ece6a"],
  },
  {
    id: "a11y",
    label: "고대비",
    light: "a11y-light",
    dark: "a11y-dark",
    swatch: ["#2b2b2b", "#f92672", "#00e0e0", "#abe338"],
  },
  {
    id: "jetbrains",
    label: "JetBrains · VS",
    light: "intellij-light",
    dark: "vs2015",
    swatch: ["#1e1e1e", "#c586c0", "#569cd6", "#ce9178"],
  },
];

export const DEFAULT_CODE_THEME_ID = "github";
const STORAGE_KEY = "code-theme";

export function getCodeTheme(id: string | null | undefined): CodeTheme {
  return (
    CODE_THEMES.find((t) => t.id === id) ??
    CODE_THEMES.find((t) => t.id === DEFAULT_CODE_THEME_ID)!
  );
}

export function readStoredCodeThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_CODE_THEME_ID;
  } catch {
    // 사생활 보호 모드 등에서 localStorage 접근 자체가 던질 수 있다
    return DEFAULT_CODE_THEME_ID;
  }
}

/** 선택한 테마의 스타일시트를 두 <link> 에 반영한다. disabled 토글은 건드리지 않는다. */
export function applyCodeTheme(id: string) {
  if (typeof document === "undefined") return;
  const theme = getCodeTheme(id);
  const light = document.querySelector<HTMLLinkElement>("link.light-syntax");
  const dark = document.querySelector<HTMLLinkElement>("link.dark-syntax");
  const lightHref = `${CDN}/${theme.light}.min.css`;
  const darkHref = `${CDN}/${theme.dark}.min.css`;
  if (light && light.getAttribute("href") !== lightHref) light.href = lightHref;
  if (dark && dark.getAttribute("href") !== darkHref) dark.href = darkHref;
  document.documentElement.dataset.codeTheme = theme.id;
}

export function setCodeTheme(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // 저장 실패는 무시 — 이번 세션에는 그래도 적용된다
  }
  applyCodeTheme(id);
  window.dispatchEvent(new CustomEvent("code-theme-change", { detail: id }));
}
