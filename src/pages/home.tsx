import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeftSidebar from "../components/left-sidebar";
import PostCard from "../components/post-card";
import type { Post } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");

  // Get search params from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    const category = params.get("category");
    const sort = params.get("sort");

    if (search) setSearchQuery(search);
    if (category) setSelectedCategory(category);
    if (sort) setSortBy(sort);
  }, []);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (selectedCategory !== "all")
    queryParams.append("category", selectedCategory);
  if (searchQuery) queryParams.append("search", searchQuery);
  if (sortBy !== "latest") queryParams.append("sort", sortBy);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/posts?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateURL({ category, sort: sortBy, search: searchQuery });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateURL({ category: selectedCategory, sort, search: searchQuery });
  };

  const updateURL = ({
    category,
    sort,
    search,
  }: {
    category: string;
    sort: string;
    search: string;
  }) => {
    const params = new URLSearchParams();
    if (category !== "all") params.append("category", category);
    if (sort !== "latest") params.append("sort", sort);
    if (search) params.append("search", search);

    const url = params.toString() ? `/?${params}` : "/";
    window.history.replaceState({}, "", url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <LeftSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />

        <main className="lg:col-span-3">
          {/* Hero Section */}
          {!searchQuery && selectedCategory === "all" && (
            <section className="mb-12">
              <Card className="toss-card overflow-hidden">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400"
                    alt="Modern developer workspace with multiple monitors showing code"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center">
                    <CardContent className="p-8 text-white">
                      <h1 className="text-4xl font-bold mb-4">
                        최신 웹 개발 트렌드와 기술
                      </h1>
                      <p className="text-xl mb-6 opacity-90">
                        프론트엔드 개발자를 위한 실무 중심의 기술 블로그입니다.
                        React, TypeScript, 성능 최적화 등 다양한 주제를
                        다룹니다.
                      </p>
                      <Button
                        onClick={() => navigate("/contact")}
                        className="bg-white text-black hover-gradient-bg"
                      >
                        연락하기 <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {/* Posts Section */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold">
                  {searchQuery
                    ? `"${searchQuery}" 검색 결과`
                    : selectedCategory === "all"
                    ? "최신 글"
                    : `${selectedCategory} 글`}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  총 {posts.length}개의 글
                </p>
              </div>

              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-48 mb-4" />
                    <div className="space-y-2">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-6 w-3/4" />
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-full" />
                      <div className="bg-gray-200 dark:bg-gray-700 rounded h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="toss-card text-center py-12">
                <CardContent>
                  <p className="text-gray-500 text-lg">
                    {searchQuery
                      ? "검색 결과가 없습니다."
                      : "아직 글이 없습니다."}
                  </p>
                  <p className="text-gray-400 mt-2">
                    {searchQuery
                      ? "다른 키워드로 검색해보세요."
                      : "곧 새로운 글을 업로드할 예정입니다."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
