import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@shared/schema";

interface RightSidebarProps {
  post: Post;
  readingProgress?: number;
}

export default function RightSidebar({ post, readingProgress = 0 }: RightSidebarProps) {
  const [tableOfContents, setTableOfContents] = useState<Array<{ id: string; text: string; level: number }>>([]);

  useEffect(() => {
    // Generate table of contents from the post content
    const generateTOC = () => {
      const headings = document.querySelectorAll('#post-content h1, #post-content h2, #post-content h3');
      const toc = Array.from(headings).map((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        return {
          id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1))
        };
      });
      setTableOfContents(toc);
    };

    // Wait for content to render
    setTimeout(generateTOC, 100);
  }, [post.content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Table of Contents */}
        {tableOfContents.length > 0 && (
          <Card className="toss-card">
            <CardContent className="p-6">
              <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                목차
              </h3>
              <nav className="space-y-2 text-sm">
                {tableOfContents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`block text-left hover:text-blue-600 transition-colors ${
                      item.level === 1 ? '' : item.level === 2 ? 'ml-4' : 'ml-8'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
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
                <span className="text-gray-500">읽기 시간</span>
                <span className="font-medium">{post.readTime}분</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">진행률</span>
                <span className="font-medium">{Math.round(readingProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">작성일</span>
                <span className="font-medium">
                  {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">조회수</span>
                <span className="font-medium">{post.views.toLocaleString()}</span>
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
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Author Info */}
        <Card className="toss-card bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">작성자</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold">{post.author[0]}</span>
              </div>
              <div>
                <p className="font-medium">{post.author}</p>
                <p className="text-sm opacity-90">Frontend Developer</p>
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
