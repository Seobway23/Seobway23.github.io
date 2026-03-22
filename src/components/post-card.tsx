import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Eye, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Post } from "@shared/schema";
import { getPostComments } from "@/lib/comments";
import { highlightSearchMatch } from "@/lib/korean-search";
import { formatReadTimeShort } from "@/lib/data";
import { getPostCoverImageUrl } from "@/lib/post-cover";

interface PostCardProps {
  post: Post;
  searchQuery?: string;
}

const categoryLabels: Record<string, string> = {
  react: "React",
  typescript: "TypeScript",
  css: "CSS",
  performance: "Performance",
  nextjs: "Next.js",
};

export default function PostCard({ post, searchQuery }: PostCardProps) {
  const categoryLabel = categoryLabels[post.category] || post.category;
  const imageUrl = getPostCoverImageUrl(post);
  const [commentCount, setCommentCount] = useState<number>(0);

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
    <Card className="toss-card overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link href={`/post/${post.slug}`}>
        <div className="aspect-video relative overflow-hidden">
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-4 left-4">
            <Badge
              className="text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
              }}
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
    </Card>
  );
}
