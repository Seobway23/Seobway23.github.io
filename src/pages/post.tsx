import { useState, useEffect, useRef } from "react";
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

const categoryImages: Record<string, string> = {
  react:
    "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  typescript:
    "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  css: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  performance:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  nextjs:
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
};

export default function Post() {
  const [, params] = useRoute("/post/:slug");
  const [, navigate] = useLocation();
  const readingProgress = useReadingProgress();
  const queryClient = useQueryClient();

  const slug = params?.slug;

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

  // Track view mutation
  const trackViewMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/posts/${slug}/view`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${slug}`] });
    },
  });

  useEffect(() => {
    if (post && !trackViewMutation.isPending) {
      // Google Analytics로 조회수 추적 (3초 후)
      const timer = setTimeout(() => {
        // GA 이벤트 추적
        trackPostView(post.slug, post.title);
        // 기존 조회수 증가 (localStorage용)
        trackViewMutation.mutate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [post, trackViewMutation]);

  // HTML 콘텐츠 그대로 표시
  const formatContent = (content: string) => {
    return content;
  };

  // 코드 하이라이팅을 위한 ref
  const contentRef = useRef<HTMLDivElement>(null);

  // 콘텐츠가 렌더링된 후 코드 하이라이팅 적용
  useEffect(() => {
    if (post && contentRef.current) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 실행
      const timer = setTimeout(() => {
        const codeBlocks = contentRef.current?.querySelectorAll("pre code");
        if (codeBlocks) {
          codeBlocks.forEach((block) => {
            // 이전 하이라이트 흔적 제거 (중복 하이라이트 경고 방지)
            if ((block as HTMLElement).dataset.highlighted) {
              (block as HTMLElement).removeAttribute("data-highlighted");
            }
            if (block.classList.contains("hljs")) {
              block.classList.remove("hljs");
            }
            hljs.highlightElement(block as HTMLElement);
          });
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

  const categoryLabel = categoryLabels[post.category] || post.category;
  const imageUrl = categoryImages[post.category] || categoryImages.react;

  return (
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
  );
}
