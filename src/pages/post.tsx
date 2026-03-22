import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Eye, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RightSidebar from "../components/right-sidebar";
import UtterancesComments from "../components/utterances-comments";
import { useReadingProgress } from "../hooks/use-reading-progress";
import { apiRequest } from "@/lib/queryClient";
import { trackPostView } from "@/lib/analytics";
import type { Post } from "../../shared/schema";
import { getPostCoverImageUrl } from "@/lib/post-cover";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import html from "highlight.js/lib/languages/xml";
import bash from "highlight.js/lib/languages/bash";

// Register languages
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", html);
hljs.registerLanguage("bash", bash);

const categoryLabels: Record<string, string> = {
  react: "React",
  typescript: "TypeScript",
  css: "CSS",
  performance: "Performance",
  nextjs: "Next.js",
};

export default function Post() {
  const [, params] = useRoute("/post/:slug");
  const [, navigate] = useLocation();
  const readingProgress = useReadingProgress();
  const queryClient = useQueryClient();

  const slug = params?.slug;
  const [mermaidModal, setMermaidModal] = useState<string | null>(null);
  const [mermaidZoom, setMermaidZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const closeMermaidModal = () => {
    setMermaidModal(null);
    setMermaidZoom(1);
    setPanX(0);
    setPanY(0);
    panRef.current = { x: 0, y: 0 };
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMermaidModal();
    };
    if (mermaidModal) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mermaidModal]);

  const {
    data: post,
    isLoading,
    error,
  } = useQuery<Post>({
    queryKey: [`/api/posts/${slug}`],
    enabled: !!slug,
    queryFn: async () => {
      // 서버가 있으면 API 호출
      if (
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost"
      ) {
        try {
          const response = await fetch(`/api/posts/${slug}`);
          if (response.ok) {
            const data = await response.json();
            // views.json의 조회수와 병합
            const { getViewsData } = await import("../lib/views");
            const viewsData = await getViewsData();
            return {
              ...data,
              views: viewsData[data.slug] ?? data.views,
            };
          }
        } catch (e) {
          // API 실패 시 직접 처리
        }
      }

      // 프론트엔드에서 직접 처리
      const { getPostBySlug } = await import("../lib/posts");
      const { getViewsData } = await import("../lib/views");
      const post = await getPostBySlug(slug || "");
      if (!post) {
        throw new Error("Post not found");
      }

      // views.json의 조회수와 병합
      const viewsData = await getViewsData();
      const gaViews = viewsData[post.slug];
      const finalViews = gaViews ?? post.views;
      return {
        ...post,
        views: finalViews,
      };
    },
  });

  // 조회수 중복 카운트 방지: 컴포넌트 마운트 후 1회만 실행
  const hasTrackedRef = useRef(false);

  const trackViewMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${slug}/view`, {}),
    // invalidateQueries 제거 — 조회수 변경이 post 상태를 바꿔 useEffect 재실행 루프 유발
  });

  useEffect(() => {
    if (!post || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    const timer = setTimeout(() => {
      trackPostView(post.slug, post.title);
      trackViewMutation.mutate();
    }, 3000);
    return () => clearTimeout(timer);
  // post.slug 기준 — slug가 바뀔 때만 재실행 (같은 페이지 내 post 객체 변경 무시)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.slug]);

  // ── Mermaid Modal: SVG 자연 크기 읽기 ────────────────────────────────────────
  const getSvgNaturalSize = (container: HTMLElement) => {
    const svgEl = container.querySelector("svg");
    let svgW = 900, svgH = 500;
    if (svgEl) {
      const vb = svgEl.getAttribute("viewBox");
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/);
        if (parts.length >= 4) {
          const w = parseFloat(parts[2]);
          const h = parseFloat(parts[3]);
          if (w > 0 && h > 0) { svgW = w; svgH = h; }
        }
      } else {
        svgW = svgEl.clientWidth || svgW;
        svgH = svgEl.clientHeight || svgH;
      }
    }
    return { svgW, svgH };
  };

  // ── Mermaid Modal: 맞춤 보기 ──────────────────────────────────────────────────
  const fitToView = useCallback(() => {
    const container = modalContainerRef.current;
    if (!container) return;
    const { svgW, svgH } = getSvgNaturalSize(container);
    const cW = container.clientWidth;
    const cH = container.clientHeight;
    const fit = Math.max(0.2, Math.min(cW * 0.88 / svgW, cH * 0.88 / svgH, 3));
    const px = (cW - svgW * fit) / 2;
    const py = (cH - svgH * fit) / 2;
    setMermaidZoom(fit);
    setPanX(px);
    setPanY(py);
    panRef.current = { x: px, y: py };
  }, []);

  // ── Mermaid Modal: 열릴 때 자동 맞춤 ─────────────────────────────────────────
  useEffect(() => {
    if (!mermaidModal) return;
    const timer = setTimeout(() => fitToView(), 80);
    return () => clearTimeout(timer);
  }, [mermaidModal, fitToView]);

  // ── Mermaid Modal: 휠 줌 (passive:false 필수) ─────────────────────────────────
  useEffect(() => {
    const container = modalContainerRef.current;
    if (!container || !mermaidModal) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setMermaidZoom((prev) => {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.2, Math.min(4, prev * factor));
        const ratio = newZoom / prev;
        const newPx = cx * (1 - ratio) + panRef.current.x * ratio;
        const newPy = cy * (1 - ratio) + panRef.current.y * ratio;
        panRef.current = { x: newPx, y: newPy };
        setPanX(newPx);
        setPanY(newPy);
        return newZoom;
      });
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [mermaidModal]);

  // ── Mermaid Modal: 드래그 패닝 ────────────────────────────────────────────────
  const handleModalMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX, y: e.clientY,
      panX: panRef.current.x, panY: panRef.current.y,
    };
    e.preventDefault();
  }, []);

  const handleModalMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newX = dragStartRef.current.panX + dx;
    const newY = dragStartRef.current.panY + dy;
    panRef.current = { x: newX, y: newY };
    setPanX(newX);
    setPanY(newY);
  }, []);

  const handleModalMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // ── Mermaid Modal: 버튼 줌 (컨테이너 중심 기준) ───────────────────────────────
  const zoomBy = useCallback((delta: number) => {
    const container = modalContainerRef.current;
    setMermaidZoom((prev) => {
      const newZoom = Math.max(0.2, Math.min(4, +(prev + delta).toFixed(2)));
      if (container) {
        const cx = container.clientWidth / 2;
        const cy = container.clientHeight / 2;
        const ratio = newZoom / prev;
        const newPx = cx * (1 - ratio) + panRef.current.x * ratio;
        const newPy = cy * (1 - ratio) + panRef.current.y * ratio;
        panRef.current = { x: newPx, y: newPy };
        setPanX(newPx);
        setPanY(newPy);
      }
      return newZoom;
    });
  }, []);

  // HTML 콘텐츠 그대로 표시
  const formatContent = (content: string) => {
    return content;
  };

  // 코드 하이라이팅을 위한 ref
  const contentRef = useRef<HTMLDivElement>(null);

  // 콘텐츠가 렌더링된 후 코드 하이라이팅 + 머메이드 다이어그램 처리
  useEffect(() => {
    if (post && contentRef.current) {
      const timer = setTimeout(async () => {
        // 1) hljs: mermaid 블록 제외하고 하이라이팅
        const codeBlocks = contentRef.current?.querySelectorAll("pre code");
        if (codeBlocks) {
          codeBlocks.forEach((block) => {
            if (block.classList.contains("language-mermaid")) return;
            if ((block as HTMLElement).dataset.highlighted) {
              (block as HTMLElement).removeAttribute("data-highlighted");
            }
            if (block.classList.contains("hljs")) {
              block.classList.remove("hljs");
            }
            hljs.highlightElement(block as HTMLElement);
          });
        }

        // 2) Mermaid 다이어그램 렌더링
        const mermaidBlocks = contentRef.current?.querySelectorAll(
          "code.language-mermaid"
        );
        if (mermaidBlocks && mermaidBlocks.length > 0) {
          const { default: mermaid } = await import("mermaid");
          const isDark = document.documentElement.classList.contains("dark");
          mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? "dark" : "default",
            securityLevel: "loose",
            flowchart: { useMaxWidth: false, htmlLabels: true },
            sequence: { useMaxWidth: false },
          });

          for (let i = 0; i < mermaidBlocks.length; i++) {
            const block = mermaidBlocks[i];
            const pre = block.parentElement;
            if (!pre || (pre as HTMLElement).dataset.mermaidRendered) continue;

            const code = block.textContent || "";
            const id = `mermaid-${Date.now()}-${i}`;

            // %% desc: 주석에서 설명 추출
            const descMatch = code.match(/%%\s*desc:\s*(.+)/);
            const diagramDesc = descMatch ? descMatch[1].trim() : "";

            // 다이어그램 타입 감지 (첫 번째 비주석 줄 기준) → 최소 높이 + 라벨
            const codeLines = code.trim().split("\n");
            const typeDetectLine = (codeLines.find((l) => !l.trim().startsWith("%%")) || "").toLowerCase();
            let diagramMinHeight = "220px";
            let diagramTypeLabel = "다이어그램";
            if (/sequencediagram/.test(typeDetectLine)) { diagramMinHeight = "440px"; diagramTypeLabel = "시퀀스 다이어그램"; }
            else if (/classdiagram/.test(typeDetectLine)) { diagramMinHeight = "360px"; diagramTypeLabel = "클래스 다이어그램"; }
            else if (/statediagram/.test(typeDetectLine)) { diagramMinHeight = "300px"; diagramTypeLabel = "상태 다이어그램"; }
            else if (/gantt/.test(typeDetectLine)) { diagramMinHeight = "200px"; diagramTypeLabel = "간트 차트"; }
            else if (/gitgraph/.test(typeDetectLine)) { diagramMinHeight = "220px"; diagramTypeLabel = "Git 그래프"; }
            else if (/flowchart\s+lr|graph\s+lr/.test(typeDetectLine)) { diagramMinHeight = "240px"; diagramTypeLabel = "플로우차트 (좌→우)"; }
            else if (/flowchart\s+rl|graph\s+rl/.test(typeDetectLine)) { diagramMinHeight = "240px"; diagramTypeLabel = "플로우차트 (우→좌)"; }
            else if (/flowchart\s+(td|tb)|graph\s+(td|tb)/.test(typeDetectLine)) { diagramMinHeight = "340px"; diagramTypeLabel = "플로우차트 (상→하)"; }
            try {
              const { svg } = await mermaid.render(id, code);

              const wrapper = document.createElement("div");
              // mermaid-wrapper 클래스: index.css에서 resize:both 적용
              wrapper.className = "mermaid-wrapper my-6";
              wrapper.style.width = "100%";
              wrapper.style.overflow = "hidden";
              wrapper.style.boxSizing = "border-box";

              const inner = document.createElement("div");
              inner.className =
                "mermaid-inner group relative cursor-zoom-in rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200";
              inner.style.width = "100%";
              inner.style.height = "100%";
              inner.style.boxSizing = "border-box";
              inner.style.overflow = "hidden";
              inner.innerHTML = svg;

              // 호버 힌트 (확대 + 리사이즈 안내)
              const hint = document.createElement("span");
              hint.className =
                "absolute top-2 right-2 text-xs text-gray-400 bg-gray-100/90 dark:bg-gray-800/90 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10";
              hint.textContent = "🔍 클릭하여 확대 · ↔ 모서리 드래그로 크기 조절";
              inner.appendChild(hint);

              wrapper.appendChild(inner);

              // SVG: width 100%로 컨테이너에 맞춤 (w 기준 자동 조절)
              const svgEl = inner.querySelector("svg");
              if (svgEl) {
                svgEl.removeAttribute("width");
                svgEl.removeAttribute("height");
                svgEl.style.width = "100%";
                svgEl.style.height = "auto";
                svgEl.style.display = "block";
                svgEl.style.minHeight = diagramMinHeight;
              }
              wrapper.style.minHeight = diagramMinHeight;

              // ResizeObserver: wrapper 크기 변경 시 inner도 동기화
              if (typeof ResizeObserver !== "undefined") {
                const ro = new ResizeObserver(() => {
                  inner.style.width = wrapper.clientWidth + "px";
                  inner.style.height = wrapper.clientHeight + "px";
                });
                ro.observe(wrapper);
              }

              inner.addEventListener("click", () => {
                setMermaidModal(svg);
              });

              (pre as HTMLElement).dataset.mermaidRendered = "true";
              pre.replaceWith(wrapper);

              // 다이어그램 캡션 (타입 + 설명)
              const figcap = document.createElement("div");
              figcap.className = "mermaid-caption";
              figcap.innerHTML =
                `<span class="mermaid-caption-badge">${diagramTypeLabel}</span>` +
                (diagramDesc ? `<span class="mermaid-caption-text">${diagramDesc}</span>` : "");
              wrapper.insertAdjacentElement("afterend", figcap);
            } catch (e) {
              console.error("Mermaid render error:", e);
            }
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-8 w-32 mb-6" />
          <div className="bg-gray-200 dark:bg-gray-700 rounded h-64 mb-8" />
          <div className="space-y-4">
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-3/4" />
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-full" />
            <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="toss-card text-center py-12">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">글을 찾을 수 없습니다</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              요청하신 글이 존재하지 않거나 삭제되었습니다.
            </p>
            <Button onClick={() => navigate("/")} className="toss-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryLabel = categoryLabels[post.category] || post.category.split("/").pop() || post.category;
  const imageUrl = getPostCoverImageUrl(post);

  return (
    <>
    {/* Mermaid 다이어그램 확대 모달 */}
    {mermaidModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={closeMermaidModal}
      >
        <div
          className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col"
          style={{ width: "95vw", height: "95vh" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 상단 컨트롤 바 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => zoomBy(-0.25)}
                className="w-7 h-7 flex items-center justify-center text-lg font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >−</button>
              <span className="text-xs font-mono w-12 text-center text-gray-500 dark:text-gray-400">
                {Math.round(mermaidZoom * 100)}%
              </span>
              <button
                onClick={() => zoomBy(0.25)}
                className="w-7 h-7 flex items-center justify-center text-lg font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >+</button>
              <button
                onClick={fitToView}
                className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              >맞춤</button>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
              스크롤 확대 · 드래그 이동 · ESC 닫기
            </span>
            <button
              onClick={closeMermaidModal}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              ✕ 닫기
            </button>
          </div>
          {/* SVG 영역 — 줌 + 드래그 패닝 */}
          <div
            ref={modalContainerRef}
            className={`flex-1 overflow-hidden relative select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseDown={handleModalMouseDown}
            onMouseMove={handleModalMouseMove}
            onMouseUp={handleModalMouseUp}
            onMouseLeave={handleModalMouseUp}
          >
            <div
              className="mermaid-svg-content absolute pointer-events-none"
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${mermaidZoom})`,
                transformOrigin: "0 0",
                transition: isDragging ? "none" : "transform 0.1s ease",
              }}
              dangerouslySetInnerHTML={{ __html: mermaidModal }}
            />
          </div>
        </div>
      </div>
    )}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-center">
        <div className="w-full max-w-4xl lg:max-w-none lg:grid lg:grid-cols-4 lg:gap-8">
          <main className="lg:col-span-3 mx-auto max-w-4xl">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-6 hover-gradient-bg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Button>

            {/* Post Content */}
            <article className="toss-card" id="post-content">
              <CardContent className="p-6 sm:p-8">
                {/* Post Header */}
                <header className="mb-8">
                  <div className="mb-4">
                    <Badge
                      className="text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                      }}
                    >
                      {categoryLabel}
                    </Badge>
                    {post.featured && (
                      <Badge variant="destructive" className="ml-2">
                        인기
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                    {post.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {post.author[0]}
                        </span>
                      </div>
                      <span className="font-medium">{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}분 읽기</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.views.toLocaleString()}회</span>
                    </div>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <img
                    src={imageUrl}
                    alt={post.title}
                    className="w-full h-64 object-cover rounded-xl mb-8"
                  />
                </header>

                {/* Post Body */}
                <div
                  ref={contentRef}
                  className="prose max-w-none dark:prose-invert md:prose-lg"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(post.content),
                  }}
                />

                {/* Tags */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold mb-3">태그</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          navigate(`/?tag=${encodeURIComponent(tag)}`)
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </article>

            {/* Comments - Utterances를 사용한 GitHub 기반 댓글 시스템 */}
            <UtterancesComments
              repo="seobway23/Laptop"
              issueTerm="pathname" // URL 경로 기반으로 댓글 매핑 (예: /post/my-post)
              // theme prop 제거 - 자동으로 라이트/다크 모드 감지
              useCard={true} // Card 스타일 적용
              maxWidth="100%" // 최대 너비 설정
              className="w-full" // 추가 클래스
            />
          </main>

          {/* Right Sidebar */}
          <RightSidebar post={post} readingProgress={readingProgress} />
        </div>
      </div>
    </div>
    </>
  );
}
