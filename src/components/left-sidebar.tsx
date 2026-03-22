import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { getPopularPosts, getAllPosts } from "@/lib/posts";
import { getRecentComments } from "@/lib/recent-comments";
import type { Post } from "../../shared/schema";

interface Category {
  name: string;
  label: string;
  count: number;
}

interface LeftSidebarProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  showDesktop?: boolean;
}

export default function LeftSidebar({
  selectedCategory = "all",
  onCategoryChange,
  mobileOpen = false,
  onMobileOpenChange,
  showDesktop = true,
}: LeftSidebarProps) {
  const isMobile = useIsMobile();
  // 모든 포스트 로드 (posts.json 기반)
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["/posts.json"],
    queryFn: () => getAllPosts(),
  });

  // 조회수 기반 인기 게시글 (views.json GA 데이터 병합)
  const { data: popularPosts = [] } = useQuery<Post[]>({
    queryKey: ["/posts/popular"],
    queryFn: () => getPopularPosts(5),
    staleTime: 5 * 60 * 1000,
  });

  type TreeNode = {
    name: string;
    fullName: string;
    label: string;
    count: number;
    children: Map<string, TreeNode>;
  };

  // posts에서 카테고리 집계
  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, number>();
    posts.forEach((post) => {
      const cat = post.category || "uncategorized";
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      // 표시용 라벨은 경로의 마지막 세그먼트
      label: name.split(/[/\\]/).pop() || name,
      count,
    }));
  }, [posts]);

  const allCount = posts.length;

  // 카테고리 트리 구성 (예: frontend/react)
  const categoryTree = useMemo(() => {
    const root: TreeNode = {
      name: "root",
      fullName: "",
      label: "",
      count: allCount,
      children: new Map(),
    };

    const findLabel = (fullName: string, segment: string) => {
      const found = categories.find((c) => c.name === fullName);
      // 라벨이 없으면 마지막 세그먼트 사용
      return found?.label || fullName.split(/[/\\]/).pop() || segment;
    };

    categories.forEach((cat) => {
      const parts = cat.name.split(/[/\\]/); // 슬래시 또는 백슬래시
      let current = root;
      let path = "";

      parts.forEach((part) => {
        path = path ? `${path}/${part}` : part;
        if (!current.children.has(path)) {
          current.children.set(path, {
            name: part,
            fullName: path,
            label: findLabel(path, part),
            count: 0,
            children: new Map(),
          });
        }
        const node = current.children.get(path)!;
        node.count += cat.count; // 상위 노드에 누적
        current = node;
      });
    });

    return root;
  }, [categories, allCount]);

  const [openNodes, setOpenNodes] = useState<Set<string>>(new Set());

  const toggleNode = (fullName: string) => {
    setOpenNodes((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children.size > 0;
    const isOpen = openNodes.has(node.fullName);

    return (
      <div key={node.fullName || "root"}>
        {node.fullName && (
          <div
            className="flex items-center gap-1"
            style={{ marginLeft: depth * 12 }}
          >
            {/* 토글 버튼 (자식이 있을 때만) */}
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.fullName)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label={isOpen ? "접기" : "펼치기"}
              >
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="flex-shrink-0 w-5" />
            )}
            <button
              onClick={() => {
                onCategoryChange?.(node.fullName);
                if (isMobile) onMobileOpenChange?.(false);
              }}
              className={`flex items-center justify-between flex-1 px-2 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === node.fullName
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300 hover-gradient-bg"
              }`}
              style={
                selectedCategory === node.fullName
                  ? {
                      background:
                        "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                    }
                  : undefined
              }
            >
              <span>{node.label}</span>
              <span className="text-xs bg-gray-700 dark:bg-gray-700 text-white dark:text-gray-300 px-2 py-1 rounded-full">
                {node.count}
              </span>
            </button>
          </div>
        )}

        {(hasChildren && (isOpen || !node.fullName)) && (
          <div>
            {Array.from(node.children.values()).map((child) =>
              renderTree(child, node.fullName ? depth + 1 : depth)
            )}
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="toss-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-400 uppercase tracking-wide mb-4">
            카테고리
          </h3>
          <nav className="space-y-2">
            <button
              onClick={() => {
                onCategoryChange?.("all");
                if (isMobile) onMobileOpenChange?.(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                selectedCategory === "all"
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300 hover-gradient-bg"
              }`}
              style={
                selectedCategory === "all"
                  ? {
                      background:
                        "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                    }
                  : undefined
              }
            >
              <span>전체</span>
              <span className="text-xs bg-gray-700 dark:bg-gray-700 text-white dark:text-gray-300 px-2 py-1 rounded-full">
                {allCount}
              </span>
            </button>
            {renderTree(categoryTree)}
          </nav>
        </CardContent>
      </Card>

      {/* Popular Posts - 조회수 기반 */}
      <Card className="toss-card">
        <CardContent className="p-6">
          <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-400 uppercase tracking-wide mb-4">
            인기 글
          </h3>
          <div className="space-y-3">
            {popularPosts.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                인기 글이 없습니다.
              </p>
            ) : (
              popularPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="block group"
                  onClick={() => {
                    if (isMobile) onMobileOpenChange?.(false);
                  }}
                >
                  <p className="text-sm font-medium hover-gradient-text transition-colors line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                    조회수 {post.views.toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Comments Preview */}
      <RecentCommentsSection
        onMobileOpenChange={onMobileOpenChange}
        isMobile={isMobile}
      />
    </div>
  );

  // 모바일: Sheet로 사이드바 표시
  if (isMobile) {
    return (
      <AnimatePresence>
        {mobileOpen && (
          <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
            <SheetContent
              side="left"
              className="w-80 sm:w-96 overflow-y-auto"
              hideCloseButton={true}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SheetHeader>
                  <SheetTitle>카테고리</SheetTitle>
                </SheetHeader>
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                >
                  {sidebarContent}
                </motion.div>
              </motion.div>
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    );
  }

  // 데스크톱: 일반 사이드바
  if (showDesktop) {
    return (
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24">{sidebarContent}</div>
      </aside>
    );
  }

  return null;
}

/**
 * 최신 댓글 섹션 컴포넌트
 */
function RecentCommentsSection({
  onMobileOpenChange,
  isMobile,
}: {
  onMobileOpenChange?: (open: boolean) => void;
  isMobile: boolean;
}) {
  const [, setLocation] = useLocation();

  // 최신 댓글 데이터 가져오기
  const { data: recentComments = [] } = useQuery({
    queryKey: ["/recent-comments.json"],
    queryFn: getRecentComments,
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  const handleCommentClick = (slug: string) => {
    // 모바일에서는 사이드바 닫기
    if (isMobile && onMobileOpenChange) {
      onMobileOpenChange(false);
    }
    // 해당 게시글 페이지로 이동
    setLocation(`/post/${slug}`);
  };

  return (
    <Card className="toss-card">
      <CardContent className="p-6">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-400 uppercase tracking-wide mb-4">
          최신 댓글
        </h3>
        <div className="space-y-4">
          {recentComments.length > 0 ? (
            recentComments.slice(0, 5).map((comment, index) => (
              <div
                key={`${comment.slug}-${comment.date}-${index}`}
                className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => handleCommentClick(comment.slug)}
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  {comment.author}
                </p>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                  {comment.content}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {comment.postTitle}
                </p>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              아직 댓글이 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
