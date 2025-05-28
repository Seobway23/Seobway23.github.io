import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Eye, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RightSidebar from "../components/right-sidebar";
import CommentsSection from "../components/comments-section";
import { useReadingProgress } from "../hooks/use-reading-progress";
import { apiRequest } from "@/lib/queryClient";
import type { Post } from "@shared/schema";

const categoryLabels: Record<string, string> = {
  react: "React",
  typescript: "TypeScript",
  css: "CSS",
  performance: "Performance",
  nextjs: "Next.js"
};

const categoryImages: Record<string, string> = {
  react: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  typescript: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  css: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  performance: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
  nextjs: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
};

export default function Post() {
  const [, params] = useRoute("/post/:slug");
  const [, navigate] = useLocation();
  const readingProgress = useReadingProgress();
  const queryClient = useQueryClient();

  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: [`/api/posts/${slug}`],
    enabled: !!slug,
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
      // Track view after 3 seconds
      const timer = setTimeout(() => {
        trackViewMutation.mutate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [post, trackViewMutation]);

  // Convert markdown-like content to HTML
  const formatContent = (content: string) => {
    return content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, (match) => {
        if (match.startsWith('<h') || match.startsWith('<pre') || match.startsWith('</p>')) {
          return match;
        }
        return `<p>${match}</p>`;
      });
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <main className="lg:col-span-3">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>

          {/* Post Content */}
          <article className="toss-card" id="post-content">
            <CardContent className="p-8">
              {/* Post Header */}
              <header className="mb-8">
                <div className="mb-4">
                  <Badge className="bg-blue-600 text-white hover:bg-blue-700">
                    {categoryLabel}
                  </Badge>
                  {post.featured && (
                    <Badge variant="destructive" className="ml-2">
                      인기
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl font-bold mb-6 leading-tight">{post.title}</h1>
                
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{post.author[0]}</span>
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
                  <span>{new Date(post.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>

                <img 
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-64 object-cover rounded-xl mb-8"
                />
              </header>

              {/* Post Body */}
              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
              />

              {/* Tags */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold mb-3">태그</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </article>

          {/* Comments */}
          <CommentsSection postSlug={post.slug} />
        </main>

        {/* Right Sidebar */}
        <RightSidebar post={post} readingProgress={readingProgress} />
      </div>
    </div>
  );
}
