import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

interface UtterancesCommentsProps {
  repo: string; // GitHub 저장소 경로 (예: "username/repo-name")
  issueTerm?: string; // "pathname" | "url" | "title" | "og:title"
  theme?: string; // "github-light" | "github-dark" | "preferred-color-scheme" (수동 지정 시)
  label?: string; // 댓글 라벨 (선택사항)
  className?: string; // 컨테이너에 적용할 추가 클래스
  style?: React.CSSProperties; // 인라인 스타일
  width?: string | number; // 너비 (예: "100%", "800px", 800)
  maxWidth?: string | number; // 최대 너비
  useCard?: boolean; // toss-card 스타일 적용 여부
  autoTheme?: boolean; // 자동 테마 감지 여부 (기본값: true)
}

/**
 * Utterances 댓글 시스템 컴포넌트
 *
 * Utterances는 GitHub Issues를 기반으로 한 댓글 시스템입니다.
 * - 완전히 정적 페이지에서 작동 (서버 불필요)
 * - GitHub OAuth 인증
 * - 무료 및 오픈소스
 *
 * 사용 전 설정:
 * 1. GitHub 저장소 생성
 * 2. https://github.com/apps/utterances 방문하여 앱 설치
 * 3. 저장소에 Issues 권한 부여
 */
export default function UtterancesComments({
  repo,
  issueTerm = "pathname",
  theme, // prop으로 받은 테마 (없으면 자동 감지)
  label,
  className,
  style,
  width,
  maxWidth,
  useCard = false,
  autoTheme = true, // 기본값: 자동 감지 활성화
}: UtterancesCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const utterancesRef = useRef<HTMLScriptElement | null>(null);
  const { theme: currentTheme } = useTheme(); // 현재 테마 가져오기

  // 초기 테마 결정: autoTheme이 true이고 theme prop이 없으면 현재 테마에 맞게 설정
  const getInitialTheme = () => {
    if (theme) return theme; // 수동 지정된 테마 사용
    if (autoTheme) {
      // 현재 테마에 맞게 github-light 또는 github-dark 직접 지정
      return currentTheme === "dark" ? "github-dark" : "github-light";
    }
    return "preferred-color-scheme";
  };

  // 스크립트는 한 번만 로드 (repo, issueTerm, label 변경 시에만)
  useEffect(() => {
    if (!containerRef.current) return;

    // 이미 스크립트가 있으면 스킵
    if (utterancesRef.current) return;

    // Utterances 스크립트 생성
    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm || "pathname");
    script.setAttribute("theme", getInitialTheme());
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    // 라벨이 있으면 추가
    if (label) {
      script.setAttribute("label", label);
    }

    containerRef.current.appendChild(script);
    utterancesRef.current = script;

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (containerRef.current && utterancesRef.current) {
        try {
          if (containerRef.current.contains(utterancesRef.current)) {
            containerRef.current.removeChild(utterancesRef.current);
          }
        } catch (e) {
          // 이미 제거된 경우 무시
        }
      }
    };
  }, [repo, issueTerm, label]); // 스크립트는 한 번만 로드

  // 테마 변경 시 Utterances iframe에 메시지 전송
  // 주의: iframe이 about:blank 이거나 아직 utteranc.es로 로드 전이면
  // contentWindow 출처가 부모(localhost)와 같아져 postMessage(..., 'https://utteranc.es')가 예외를 던짐.
  useEffect(() => {
    if (!autoTheme || theme) return;

    const container = containerRef.current;
    if (!container) return;

    const newTheme = currentTheme === "dark" ? "github-dark" : "github-light";

    const postTheme = (iframe: HTMLIFrameElement) => {
      const src = iframe.getAttribute("src") || "";
      if (!src.includes("utteranc.es")) return;
      if (!iframe.contentWindow) return;
      let targetOrigin = "https://utteranc.es";
      try {
        targetOrigin = new URL(src, window.location.href).origin;
      } catch {
        /* keep default */
      }
      try {
        iframe.contentWindow.postMessage(
          { type: "set-theme", theme: newTheme },
          targetOrigin
        );
      } catch {
        try {
          iframe.contentWindow.postMessage(
            { type: "set-theme", theme: newTheme },
            "*"
          );
        } catch {
          /* ignore */
        }
      }
    };

    const hookIframe = (iframe: HTMLIFrameElement) => {
      if (iframe.dataset.utterancesThemeHook !== "1") {
        iframe.dataset.utterancesThemeHook = "1";
        iframe.addEventListener("load", () => postTheme(iframe));
      }
      postTheme(iframe);
    };

    const scan = () => {
      const iframe = container.querySelector<HTMLIFrameElement>(
        'iframe[src*="utteranc.es"]'
      );
      if (iframe) hookIframe(iframe);
    };

    const mo = new MutationObserver(scan);
    mo.observe(container, { childList: true, subtree: true });
    scan();

    return () => mo.disconnect();
  }, [currentTheme, autoTheme, theme]);

  // 스타일 객체 생성
  const containerStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(maxWidth && {
      maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
    }),
  };

  return (
    <div
      className={cn("mt-12", useCard && "toss-card p-6", className)}
      style={containerStyle}
    >
      <div ref={containerRef} className="utterances-container" />
    </div>
  );
}
