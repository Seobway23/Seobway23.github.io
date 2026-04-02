import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
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

type CategoryTreeNode = {
  name: string;
  fullName: string;
  label: string;
  count: number;
  children: Map<string, CategoryTreeNode>;
};

function SidebarCategoryBranch({
  node,
  depth,
  selectedCategory,
  treeOpen,
  setBranchOpen,
  onCategoryChange,
  isMobile,
  onMobileOpenChange,
}: {
  node: CategoryTreeNode;
  depth: number;
  selectedCategory: string;
  treeOpen: Record<string, boolean>;
  setBranchOpen: (fullName: string, open: boolean) => void;
  onCategoryChange?: (category: string) => void;
  isMobile: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}) {
  const sortedKids = Array.from(node.children.values()).sort((a, b) =>
    a.label.localeCompare(b.label, "ko"),
  );

  if (!node.fullName) {
    return (
      <div className="space-y-0.5">
        {sortedKids.map((child, idx) => (
          <motion.div
            key={child.fullName}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              delay: idx * 0.025,
              ease: [0.25, 0.1, 0.25, 1],
            }}
          >
            <SidebarCategoryBranch
              node={child}
              depth={0}
              selectedCategory={selectedCategory}
              treeOpen={treeOpen}
              setBranchOpen={setBranchOpen}
              onCategoryChange={onCategoryChange}
              isMobile={isMobile}
              onMobileOpenChange={onMobileOpenChange}
            />
          </motion.div>
        ))}
      </div>
    );
  }

  const hasKids = sortedKids.length > 0;
  const open = treeOpen[node.fullName] ?? false;

  const pickCategory = () => {
    onCategoryChange?.(node.fullName);
    if (isMobile) onMobileOpenChange?.(false);
  };

  const toggleBranch = () => {
    setBranchOpen(node.fullName, !open);
  };

  return (
    <div
      key={node.fullName}
      className="flex items-start gap-1 rounded-lg"
      style={{ paddingLeft: 0 }}
    >
      <div className={cn("flex h-7 shrink-0 items-center justify-center", !hasKids && depth >= 2 ? "w-3" : "w-7")}>
        {hasKids ? (
          <motion.button
            type="button"
            aria-expanded={open}
            aria-label={open ? "하위 접기" : "하위 펼치기"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              toggleBranch();
            }}
            whileTap={{ scale: 0.92 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 28,
            }}
          >
            <motion.span
              animate={{ rotate: open ? 0 : -90 }}
              transition={{
                duration: 0.22,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="inline-flex"
            >
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </motion.span>
          </motion.button>
        ) : (
          <span className={cn("block h-7 shrink-0", depth >= 2 ? "w-3" : "w-7")} aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={pickCategory}
          className={cn(
            "flex min-h-9 w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
            selectedCategory === node.fullName
              ? "text-white shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover-gradient-bg",
          )}
          style={
            selectedCategory === node.fullName
              ? {
                  background:
                    "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                }
              : undefined
          }
        >
          <span className="flex-1 min-w-0 break-words">{node.label}</span>
          <span className="shrink-0 rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">
            {node.count}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {hasKids && open && (
            <motion.div
              key={`${node.fullName}-sub`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: {
                  duration: 0.28,
                  ease: [0.25, 0.1, 0.25, 1],
                },
                opacity: { duration: 0.18 },
              }}
              className="overflow-hidden"
            >
              <div className="space-y-0.5 border-l border-border/60 py-1 pl-2.5">
                {sortedKids.map((child, idx) => (
                  <motion.div
                    key={child.fullName}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.18,
                      delay: idx * 0.035,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                  >
                    <SidebarCategoryBranch
                      node={child}
                      depth={depth + 1}
                      selectedCategory={selectedCategory}
                      treeOpen={treeOpen}
                      setBranchOpen={setBranchOpen}
                      onCategoryChange={onCategoryChange}
                      isMobile={isMobile}
                      onMobileOpenChange={onMobileOpenChange}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
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
    const root: CategoryTreeNode = {
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
      let current: CategoryTreeNode = root;
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

  /** Select·트리 공통: 깊이 순 정렬된 노드 목록 */
  const flatCategoryNodes = useMemo(() => {
    const rows: {
      value: string;
      label: string;
      depth: number;
      count: number;
    }[] = [];
    function walk(n: CategoryTreeNode, depth: number) {
      if (n.fullName) {
        rows.push({
          value: n.fullName,
          label: n.label,
          depth,
          count: n.count,
        });
      }
      const kids = Array.from(n.children.values()).sort((a, b) =>
        a.label.localeCompare(b.label, "ko"),
      );
      kids.forEach((c) => walk(c, n.fullName ? depth + 1 : depth));
    }
    walk(categoryTree, 0);
    return rows;
  }, [categoryTree]);

  const [treeOpen, setTreeOpen] = useState<Record<string, boolean>>({});

  const setBranchOpen = (fullName: string, open: boolean) => {
    setTreeOpen((prev) => ({ ...prev, [fullName]: open }));
  };

  // URL·Select에서 고른 경로의 상위 폴더는 트리에서 펼침
  useEffect(() => {
    if (selectedCategory === "all") return;
    const segments = selectedCategory.split(/[/\\]/);
    setTreeOpen((prev) => {
      const next = { ...prev };
      let acc = "";
      for (const seg of segments) {
        acc = acc ? `${acc}/${seg}` : seg;
        next[acc] = true;
      }
      return next;
    });
  }, [selectedCategory]);

  const onSelectCategory = (value: string) => {
    onCategoryChange?.(value);
    if (isMobile) onMobileOpenChange?.(false);
  };

  const depthPlClass = (d: number) =>
    (["pl-2", "pl-4", "pl-6", "pl-8", "pl-10", "pl-12"] as const)[
      Math.min(d, 5)
    ];

  const sidebarContent = (
    <div className="space-y-6">
      {/* Categories */}
      <Card className="toss-card">
        <CardContent className="p-6">
          <h3 className="flex items-center gap-2 font-semibold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden /> 카테고리
          </h3>
          <nav className="space-y-4" aria-label="카테고리">
            {/* <motion.div
              initial={false}
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Select value={selectedCategory} onValueChange={onSelectCategory}>
                <SelectTrigger className="h-11 w-full border-input bg-background/80 text-left font-normal shadow-sm">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="max-h-[min(22rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)]"
                >
                  <SelectItem value="all" className="font-medium">
                    <span className="flex w-full items-center justify-between gap-2">
                      <span>전체</span>
                      <span className="text-xs text-muted-foreground">
                        {allCount}개
                      </span>
                    </span>
                  </SelectItem>
                  <SelectSeparator />
                  {flatCategoryNodes.map((row) => (
                    <SelectItem
                      key={row.value}
                      value={row.value}
                      textValue={`${row.label} ${row.count}`}
                      className={cn("cursor-pointer", depthPlClass(row.depth))}
                    >
                      <span className="flex w-full items-center justify-between gap-2 pr-1">
                        <span className="truncate">{row.label}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {row.count}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div> */}

            <div>
              <div className="rounded-lg border border-border/50 bg-muted/20 p-2">
                <SidebarCategoryBranch
                  node={categoryTree}
                  depth={0}
                  selectedCategory={selectedCategory}
                  treeOpen={treeOpen}
                  setBranchOpen={setBranchOpen}
                  onCategoryChange={onCategoryChange}
                  isMobile={isMobile}
                  onMobileOpenChange={onMobileOpenChange}
                />
              </div>
            </div>
          </nav>
        </CardContent>
      </Card>

      {/* Popular Posts - 조회수 기반 (데이터 있을 때만 표시) */}
      {popularPosts.length > 0 && (
        <Card className="toss-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
              인기 글
            </h3>
            <div className="space-y-3">
              {popularPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="block group"
                  onClick={() => {
                    if (isMobile) onMobileOpenChange?.(false);
                  }}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hover-gradient-text transition-colors line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    조회수 {post.views.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
      <aside className="hidden w-full min-w-0 max-w-[18rem] flex-shrink-0 lg:block">
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
        <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
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
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              아직 댓글이 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
