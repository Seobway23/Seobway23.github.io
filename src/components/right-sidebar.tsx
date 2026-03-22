import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@shared/schema";

interface RightSidebarProps {
  post: Post;
  readingProgress?: number;
}

type TocItem = { id: string; text: string; level: number };

export default function RightSidebar({
  post,
  readingProgress = 0,
}: RightSidebarProps) {
  const [, navigate] = useLocation();
  const [tableOfContents, setTableOfContents] = useState<TocItem[]>([]);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generateTOC = () => {
      const headings = document.querySelectorAll(
        "#post-content h1, #post-content h2, #post-content h3",
      );
      const toc = Array.from(headings).map((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        return {
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName.charAt(1)),
        };
      });
      setTableOfContents(toc);
    };
    setTimeout(generateTOC, 100);
  }, [post.content]);

  // H1 제외, H2를 그룹 헤더로, H3를 자식으로 분류
  const groupedToc = useMemo(() => {
    const groups: Array<{ h2: TocItem; children: TocItem[] }> = [];
    let current: (typeof groups)[0] | null = null;
    for (const item of tableOfContents) {
      if (item.level === 1) continue; // 포스트 제목 제외
      if (item.level === 2) {
        current = { h2: item, children: [] };
        groups.push(current);
      } else if (item.level === 3 && current) {
        current.children.push(item);
      }
    }
    return groups;
  }, [tableOfContents]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-4">
        {/* Table of Contents — H2 드롭다운, H3 자식 */}
        {groupedToc.length > 0 && (
          <Card className="toss-card">
            <CardContent className="p-4">
              <div className="space-y-0.5">
                {groupedToc.map(({ h2, children }) => (
                  <div key={h2.id}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => scrollToHeading(h2.id)}
                        className="flex-1 text-left text-xs font-medium py-1.5 hover-gradient-text transition-colors leading-snug"
                      >
                        {h2.text}
                      </button>
                      {children.length > 0 && (
                        <button
                          onClick={() => toggleSection(h2.id)}
                          className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200"
                          style={{
                            transform: openSections.has(h2.id)
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          ▾
                        </button>
                      )}
                    </div>
                    {openSections.has(h2.id) && children.length > 0 && (
                      <div className="ml-2 pl-2.5 border-l border-gray-200 dark:border-gray-700 mb-1 space-y-0.5">
                        {children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => scrollToHeading(child.id)}
                            className="block w-full text-left text-xs text-gray-500 dark:text-gray-400 hover-gradient-text transition-colors py-1 leading-snug"
                          >
                            {child.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post Meta */}
        <Card className="toss-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              글 정보
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">읽기 시간</span>
                <span className="font-medium text-foreground">{post.readTime}분</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">진행률</span>
                <span className="font-medium text-foreground">
                  {Math.round(readingProgress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all duration-300 progress-bar-gradient"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">작성일</span>
                <span className="font-medium text-foreground">
                  {new Date(post.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">조회수</span>
                <span className="font-medium text-foreground">
                  {post.views.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="toss-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/?tag=${encodeURIComponent(tag)}`)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Author Info */}
        <Card className="toss-card text-white author-card-gradient">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">작성자</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold">{post.author[0]}</span>
              </div>
              <div>
                <p className="font-medium">{post.author}</p>
                <p className="text-sm opacity-90">SW Developer</p>
              </div>
            </div>
            <p className="text-sm opacity-90 mb-4">
              프론트엔드 개발과 사용자 경험에 관심이 많은 개발자입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
