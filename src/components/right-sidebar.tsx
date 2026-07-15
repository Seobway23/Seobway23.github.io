import { useLocation } from "wouter";
import { ListTree } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatReadTimeMinutesOnly } from "@/lib/data";
import TocList from "@/components/toc-list";
import type { TocGroup } from "@/hooks/use-post-toc";
import type { Post } from "@shared/schema";

interface RightSidebarProps {
  post: Post;
  readingProgress?: number;
  /** post.tsx의 usePostToc에서 내려주는 목차(모바일 모달과 동일 소스) */
  toc: TocGroup[];
  activeId?: string;
}

export default function RightSidebar({
  post,
  readingProgress = 0,
  toc,
  activeId,
}: RightSidebarProps) {
  const [, navigate] = useLocation();

  return (
    <aside className="hidden w-full min-w-0 max-w-64 flex-shrink-0 lg:block">
      <div className="sticky top-24 space-y-4">
        {/* 목차 — 항상 보이고, 현재 섹션 하이라이트. 길면 내부 스크롤 */}
        {toc.length > 0 && (
          <Card className="toss-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ListTree
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                목차
              </div>
              <div className="max-h-[min(60vh,32rem)] overflow-y-auto pr-1">
                <TocList groups={toc} activeId={activeId} />
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
                <span className="text-gray-600 dark:text-gray-400">
                  읽기 시간
                </span>
                <span className="font-medium text-foreground">
                  {formatReadTimeMinutesOnly(post.readTime)}
                </span>
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
