import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ListTree } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatReadTimeMinutesOnly } from "@/lib/data";
import { cn } from "@/lib/utils";
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
  const [tocSelectNonce, setTocSelectNonce] = useState(0);

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

  const tocJumpOptions = useMemo(() => {
    const o: { id: string; label: string; depth: number }[] = [];
    for (const { h2, children } of groupedToc) {
      o.push({ id: h2.id, label: h2.text, depth: 0 });
      for (const c of children) {
        o.push({ id: c.id, label: c.text, depth: 1 });
      }
    }
    return o;
  }, [groupedToc]);

  // 기본은 전부 접힘. 글 바뀔 때만 초기화(heading id 충돌 방지)
  useEffect(() => {
    setOpenSections(new Set());
  }, [post.slug]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <aside className="hidden w-full min-w-0 max-w-64 flex-shrink-0 lg:block">
      <div className="sticky top-24 space-y-4">
        {/* Table of Contents — H2 드롭다운, H3 자식 */}
        {groupedToc.length > 0 && (
          <Card className="toss-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ListTree
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                목차
              </div>

              <motion.div
                initial={false}
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <Select
                  key={`${post.slug}-${tocSelectNonce}`}
                  onValueChange={(id) => {
                    scrollToHeading(id);
                    setTocSelectNonce((n) => n + 1);
                  }}
                >
                  <SelectContent
                    position="popper"
                    className="max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)]"
                  >
                    {tocJumpOptions.map((opt) => (
                      <SelectItem
                        key={opt.id}
                        value={opt.id}
                        textValue={opt.label}
                        className={cn(
                          "cursor-pointer text-xs",
                          opt.depth === 0
                            ? "font-medium"
                            : "pl-6 text-muted-foreground",
                        )}
                      >
                        <span className="line-clamp-2">{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              <div className="border-t border-border/60 pt-2">
                <div className="space-y-0.5">
                  {groupedToc.map(({ h2, children }) => {
                    const hasChildren = children.length > 0;
                    const open = openSections.has(h2.id);

                    const toggleBranch = () => {
                      setOpenSections((prev) => {
                        const next = new Set(prev);
                        if (next.has(h2.id)) next.delete(h2.id);
                        else next.add(h2.id);
                        return next;
                      });
                    };

                    return (
                      <div key={h2.id} className="flex items-start gap-1">
                        {/* 항상 동일 너비: 자식 없어도 치버 자리 확보 → 본문 시작 x 정렬 */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                          {hasChildren ? (
                            <motion.button
                              type="button"
                              aria-expanded={open}
                              aria-label={
                                open ? "하위 목차 접기" : "하위 목차 펼치기"
                              }
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
                            <span
                              className="block h-7 w-7 shrink-0"
                              aria-hidden
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => scrollToHeading(h2.id)}
                            className="w-full rounded-md py-1.5 pr-1 text-left text-xs font-medium leading-snug text-foreground transition-colors hover:bg-muted/80 hover:text-primary"
                          >
                            {h2.text}
                          </button>

                          <AnimatePresence initial={false}>
                            {hasChildren && open && (
                              <motion.div
                                key={`${h2.id}-sub`}
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
                                  {children.map((child, idx) => (
                                    <motion.button
                                      key={child.id}
                                      type="button"
                                      initial={{ opacity: 0, x: -4 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                        duration: 0.18,
                                        delay: idx * 0.035,
                                        ease: [0.25, 0.1, 0.25, 1],
                                      }}
                                      onClick={() => scrollToHeading(child.id)}
                                      className="block w-full rounded-md px-1 py-1 text-left text-[11px] leading-snug text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                                    >
                                      {child.text}
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
