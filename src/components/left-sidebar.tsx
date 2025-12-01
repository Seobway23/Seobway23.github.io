import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  name: string;
  label: string;
  count: number;
}

interface LeftSidebarProps {
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export default function LeftSidebar({
  selectedCategory = "all",
  onCategoryChange,
}: LeftSidebarProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: featuredPosts = [] } = useQuery({
    queryKey: ["/api/posts/featured"],
  });

  const allCategories = [
    {
      name: "all",
      label: "전체",
      count: categories.reduce((sum, cat) => sum + cat.count, 0),
    },
    ...categories,
  ];

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-6">
        {/* Categories */}
        <Card className="toss-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              카테고리
            </h3>
            <nav className="space-y-2">
              {allCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => onCategoryChange?.(category.name)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedCategory === category.name
                      ? "text-white"
                      : "text-gray-700 dark:text-gray-300 hover-gradient-bg"
                  }`}
                  style={
                    selectedCategory === category.name
                      ? {
                          background:
                            "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                        }
                      : {}
                  }
                >
                  <span>{category.label}</span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Featured Posts */}
        <Card className="toss-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              인기 글
            </h3>
            <div className="space-y-3">
              {featuredPosts.slice(0, 3).map((post: any) => (
                <Link
                  key={post.id}
                  href={`/post/${post.slug}`}
                  className="block group"
                >
                  <p className="text-sm font-medium hover-gradient-text transition-colors line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    조회수 {post.views.toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Comments Preview */}
        <Card className="toss-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
              최신 댓글
            </h3>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">이개발</p>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                  정말 유용한 정보네요! 특히 성능 최적화 부분이 인상깊었습니다.
                </p>
                <p className="text-xs text-gray-500 mt-1">React 성능 최적화</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">박프론트</p>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                  TypeScript 5.0 업데이트 내용 정리해주셔서 감사합니다.
                </p>
                <p className="text-xs text-gray-500 mt-1">TypeScript 5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
