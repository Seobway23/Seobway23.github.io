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
import { useTheme } from "@/hooks/use-theme";
import { useLayout } from "@/components/layout";
import LeftSidebar from "../components/left-sidebar";
import PostCard from "../components/post-card";
import type { Post } from "@shared/schema";
import { addToSearchHistory } from "@/lib/search-history";

export default function Home() {
  const [location, navigate] = useLocation();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout();

  // Get search params from URL - URL이 변경될 때마다 실행
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    const category = params.get("category");
    const sort = params.get("sort");
    const tag = params.get("tag");

    // 상태 초기화
    if (tag) {
      // 태그가 있으면 태그 모드
      setSearchQuery(`tag:${tag}`);
      setSelectedCategory("all");
    } else if (search) {
      // 검색어가 있으면 검색 모드
      if (!search.startsWith("tag:")) {
        setSearchQuery(search);
      }
      setSelectedCategory("all");
    } else if (category) {
      // 카테고리가 있으면 카테고리 모드
      setSelectedCategory(category);
      setSearchQuery("");
    } else {
      // 모두 없으면 초기화
      setSelectedCategory("all");
      setSearchQuery("");
    }

    if (sort) setSortBy(sort);
  }, [location]); // location이 변경될 때마다 실행

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", location, selectedCategory, sortBy], // state 변경 시 자동으로 재요청
    queryFn: async () => {
      // 정적 SPA(GitHub Pages 등): /api 서버 없음 — 항상 posts.json 기반 로직 사용
      const { getAllPosts, getPostsByCategory, searchPosts, getPostsByTag } =
        await import("../lib/posts");
      const { getViewsData } = await import("../lib/views");

      let posts;
      // URL 파라미터에서 직접 확인 (최신 상태 보장)
      const currentParams = new URLSearchParams(window.location.search);
      const tagParam = currentParams.get("tag");
      const categoryParam = currentParams.get("category");
      const searchParam = currentParams.get("search");

      if (tagParam) {
        // 태그 필터
        posts = await getPostsByTag(tagParam);
      } else if (searchParam) {
        // 검색 필터
        posts = await searchPosts(searchParam);
      } else if (categoryParam && categoryParam !== "all") {
        // 카테고리 필터
        posts = await getPostsByCategory(categoryParam);
      } else {
        // 전체 게시글
        posts = await getAllPosts();
      }

      // 정렬 - URL 파라미터에서 직접 가져오기
      const sortParam = currentParams.get("sort") || "latest";
      if (sortParam === "popular") {
        posts.sort((a, b) => b.views - a.views || b.slug.localeCompare(a.slug));
      } else if (sortParam === "oldest") {
        posts.sort((a, b) => {
          const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
        });
      } else {
        // 최신순 (기본값) — 날짜 동점 시 slug 역순(최근 추가된 글 우선)
        posts.sort((a, b) => {
          const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          return diff !== 0 ? diff : b.slug.localeCompare(a.slug);
        });
      }

      // views.json의 조회수와 병합
      const mergedPosts = await mergeViewsData(posts);

      // 검색 히스토리에 추가 (검색어가 있을 때만)
      if (searchParam && !searchParam.startsWith("tag:")) {
        addToSearchHistory(searchParam, mergedPosts.length);
      }

      return mergedPosts;
    },
  });

  // views.json의 조회수와 병합하는 함수
  const mergeViewsData = async (posts: Post[]): Promise<Post[]> => {
    try {
      const viewsData = await import("../lib/views").then((m) =>
        m.getViewsData()
      );
      return posts.map((post) => ({
        ...post,
        views: viewsData[post.slug] ?? post.views,
      }));
    } catch (e) {
      // views.json이 없으면 원본 데이터 반환
      return posts;
    }
  };

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
      {/* lg: 4등분 그리드 + 고정폭 사이드바는 셀(1/4)보다 넓어져 겹침 → 18rem 고정 트랙 + 유동 메인 */}
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-8">
        <LeftSidebar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />

        <main className="min-w-0">
          {/* Hero Section */}
          {(() => {
            const currentParams = new URLSearchParams(window.location.search);
            const hasFilter =
              currentParams.has("tag") ||
              currentParams.has("category") ||
              currentParams.has("search");
            return !hasFilter;
          })() && (
            <section className="mb-12">
              <Card className="toss-card overflow-hidden">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400"
                    alt="Modern developer workspace with multiple monitors showing code"
                    className="w-full h-64 object-cover"
                  />
                  {/* 라이트 모드: 흰색 블러, 다크 모드: 블랙 블러 */}
                  <div
                    className={`absolute inset-0 ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-black/60 to-transparent backdrop-blur-md"
                        : "bg-gradient-to-r from-white/100 to-transparent backdrop-blur-md"
                    }`}
                  />
                  <div className="absolute inset-0 flex items-center">
                    <CardContent className="p-4 sm:p-6 md:p-8 text-white">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                        코드로 만드는 더 나은 일상
                      </h1>
                      <p className="text-sm sm:text-base md:text-xl mb-4 sm:mb-6 opacity-90">
                        웹 개발, AI 에이전트, 역학 시뮬레이션, 알고리즘까지.
                        다양한 분야의 기술을 활용해 재미있고 유용한 프로젝트를
                        만들고, 일상의 문제를 해결하는 과정을 공유합니다.
                      </p>
                      <Button
                        onClick={() => navigate("/about")}
                        className="toss-button text-white text-sm sm:text-base"
                      >
                        소개 보기 <ArrowRight className="w-4 h-4 ml-2" />
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
                  {(() => {
                    const currentParams = new URLSearchParams(
                      window.location.search
                    );
                    const tagParam = currentParams.get("tag");
                    const searchParam = currentParams.get("search");
                    const categoryParam = currentParams.get("category");

                    if (tagParam) {
                      return `"${tagParam}" 태그 글`;
                    }
                    if (searchParam) {
                      return `"${searchParam}" 검색 결과`;
                    }
                    if (categoryParam && categoryParam !== "all") {
                      // 카테고리 라벨 매핑
                      const categoryLabels: Record<string, string> = {
                        react: "React",
                        typescript: "TypeScript",
                        css: "CSS",
                        performance: "Performance",
                        nextjs: "Next.js",
                        frontend: "Frontend",
                        ai: "AI",
                        gstack: "gstack",
                      };
                      // 카테고리 경로에서 마지막 부분 추출
                      const categoryName =
                        categoryParam.split("/").pop() || categoryParam;
                      return `${
                        categoryLabels[categoryName] || categoryName
                      } 글`;
                    }
                    return "최신 글";
                  })()}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
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
                    {(() => {
                      const currentParams = new URLSearchParams(
                        window.location.search
                      );
                      return currentParams.has("tag") ||
                        currentParams.has("category") ||
                        currentParams.has("search")
                        ? "검색 결과가 없습니다."
                        : "아직 글이 없습니다.";
                    })()}
                  </p>
                  <p className="text-gray-400 mt-2">
                    {(() => {
                      const currentParams = new URLSearchParams(
                        window.location.search
                      );
                      return currentParams.has("tag") ||
                        currentParams.has("category") ||
                        currentParams.has("search")
                        ? "다른 키워드로 검색해보세요."
                        : "곧 새로운 글을 업로드할 예정입니다.";
                    })()}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {posts.map((post) => {
                  const currentParams = new URLSearchParams(
                    window.location.search
                  );
                  const searchParam = currentParams.get("search");
                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                      searchQuery={searchParam || undefined}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
