import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Eye, MessageCircle, Clock } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@shared/schema";
import { getPostComments } from "@/lib/comments";
import { highlightSearchMatch } from "@/lib/korean-search";
import { formatReadTimeShort } from "@/lib/data";
import { getPostCoverImageUrl } from "@/lib/post-cover";
import { categoryColor } from "@/lib/category-color";

interface PostCardProps {
  post: Post;
  searchQuery?: string;
}

/** 마지막 칸만 보여준다. 경로 전체(frontend/javascript)는 배지에 넣기엔 길다. */
const CATEGORY_LEAF_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  "react-query": "React Query",
  threejs: "Three.js",
  css: "CSS",
  styling: "스타일링",
  performance: "성능",
  "data-fetching": "데이터 페칭",
  nextjs: "Next.js",
  gstack: "gstack",
  algorithm: "알고리즘",
  mechanics: "역학",
  network: "네트워크",
  backend: "백엔드",
  frontend: "프론트엔드",
  infra: "인프라",
  electron: "Electron",
  engineering: "엔지니어링",
  architecture: "아키텍처",
  analysis: "분석",
  testing: "테스트",
};

function categoryLabelOf(category: string): string {
  const leaf = String(category || "").replace(/\\/g, "/").split("/").pop() || "";
  return CATEGORY_LEAF_LABELS[leaf] || leaf;
}

export default function PostCard({ post, searchQuery }: PostCardProps) {
  const categoryLabel = categoryLabelOf(post.category);
  const imageUrl = getPostCoverImageUrl(post);
  const [commentCount, setCommentCount] = useState<number>(0);
  const cardRef = useRef<HTMLElement | null>(null);
  const accent = categoryColor(post.category);

  /** 커서 위치를 CSS 변수로. state 로 두면 목록 전체가 리렌더된다. */
  const trackPointer = (e: React.PointerEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--glow-y", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const resetPointer = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.removeProperty("--glow-x");
    el.style.removeProperty("--glow-y");
  };

  useEffect(() => {
    getPostComments(post.slug)
      .then(setCommentCount)
      .catch(() => {});
  }, [post.slug]);

  // 검색어 하이라이팅
  const highlightedTitle = searchQuery
    ? highlightSearchMatch(post.title, searchQuery)
    : [{ text: post.title, match: false }];
  const highlightedExcerpt = searchQuery
    ? highlightSearchMatch(post.excerpt, searchQuery)
    : [{ text: post.excerpt, match: false }];

  return (
    <article
      ref={cardRef}
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
      className={`glow-card glow-card--list group overflow-hidden ${
        post.featured ? "glow-card--featured" : ""
      }`}
      // 카테고리 색이 커서 하이라이트가 된다 — 목록을 훑을 때 색만으로
      // 어느 분야 글인지 읽힌다.
      style={{ "--glow-c": accent } as React.CSSProperties}
    >
      <Link href={`/post/${post.slug}`}>
        <div className="aspect-video relative overflow-hidden">
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            {/* 배지도 카테고리 색을 쓴다. 프리셋 그라데이션을 쓰면 모든 글의
                배지가 같은 색이라 아무 정보도 주지 못한다. */}
            <Badge
              className="border-0 font-semibold text-white shadow-sm"
              style={{ background: accent }}
            >
              {categoryLabel}
            </Badge>
          </div>
          {post.featured && (
            <div className="absolute top-4 right-4">
              <Badge variant="destructive">인기</Badge>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-6">
        <Link href={`/post/${post.slug}`}>
          <h3 className="text-xl font-bold mb-3 hover-gradient-text transition-colors line-clamp-2 min-h-[3.5rem] overflow-hidden">
            {highlightedTitle.map((part, i) => (
              <span
                key={i}
                className={
                  part.match
                    ? "bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded"
                    : ""
                }
              >
                {part.text}
              </span>
            ))}
          </h3>
        </Link>

        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {highlightedExcerpt.map((part, i) => (
            <span
              key={i}
              className={
                part.match
                  ? "bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded"
                  : ""
              }
            >
              {part.text}
            </span>
          ))}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="font-medium">{post.author}</span>
            <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatReadTimeShort(post.readTime)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.views.toLocaleString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{commentCount.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </article>
  );
}
