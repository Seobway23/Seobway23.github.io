import { Link } from "wouter";
import { Eye, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getPostComments } from "@/lib/comments";
import type { Post } from "@shared/schema";

interface PostCardProps {
  post: Post;
}

const categoryLabels: Record<string, string> = {
  react: "React",
  typescript: "TypeScript",
  css: "CSS",
  performance: "Performance",
  nextjs: "Next.js",
};

// Stock photo mappings for categories
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

export default function PostCard({ post }: PostCardProps) {
  const categoryLabel = categoryLabels[post.category] || post.category;
  const imageUrl = categoryImages[post.category] || categoryImages.react;

  // 댓글 개수 가져오기
  const { data: commentsCount = 0 } = useQuery({
    queryKey: [`/comments/${post.slug}`],
    queryFn: () => getPostComments(post.slug),
  });

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
          <h3 className="text-xl font-bold mb-3 hover-gradient-text transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>

        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="font-medium">{post.author}</span>
            <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}분</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.views.toLocaleString()}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageCircle className="w-4 h-4" />
              <span>{commentsCount}</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
