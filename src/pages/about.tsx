import { Mail, Github, Linkedin, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getAllPosts } from "@/lib/posts";
import { getViewsData } from "@/lib/views";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import type { Post } from "@shared/schema";

export default function About() {
  const { theme } = useTheme();

  // 게시글 데이터 가져오기
  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["/posts.json"],
    queryFn: () => getAllPosts(),
  });

  // 조회수 데이터 가져오기
  const { data: viewsData = {} } = useQuery({
    queryKey: ["/views.json"],
    queryFn: getViewsData,
  });

  // 통계 계산
  const totalPosts = posts.length;
  const totalViews = Object.values(viewsData).reduce(
    (sum, views) => sum + (typeof views === "number" ? views : 0),
    0,
  );
  const categories = new Set(
    posts.flatMap((post) => post.category?.split("/") || []),
  ).size;

  // 카테고리별 분포 계산 (최상위 카테고리 기준)
  const categoryDistribution = useMemo(() => {
    const categoryMap = new Map<string, number>();

    posts.forEach((post) => {
      if (post.category) {
        // 최상위 카테고리 추출 (예: "frontend/css" -> "frontend")
        const topCategory = post.category.split("/")[0];
        const count = categoryMap.get(topCategory) || 0;
        categoryMap.set(topCategory, count + 1);
      }
    });

    // 카테고리 라벨 매핑
    const categoryLabels: Record<string, string> = {
      frontend: "Frontend",
      backend: "Backend",
      ai: "AI",
      algorithm: "Algorithm",
      study: "Study",
    };

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        name: categoryLabels[name] || name,
        count,
        originalName: name,
      }))
      .sort((a, b) => b.count - a.count); // 내림차순 정렬
  }, [posts]);

  // 커스텀 그라데이션 색상 가져오기
  const [gradientColors, setGradientColors] = useState<string[]>([
    "#667eea",
    "#764ba2",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
  ]);

  useEffect(() => {
    // CSS 변수에서 실제 색상 값 가져오기
    const getComputedColor = (varName: string, fallback: string) => {
      if (typeof window === "undefined") return fallback;
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(varName)
        .trim();
      return value || fallback;
    };

    const startColor = getComputedColor("--gradient-start", "#667eea");
    const endColor = getComputedColor("--gradient-end", "#764ba2");

    // 세련된 색상 팔레트 (그라데이션 기반 + 보색)
    setGradientColors([
      startColor,
      endColor,
      "#8b5cf6", // 보라색
      "#ec4899", // 핑크
      "#f59e0b", // 오렌지
      "#10b981", // 그린
      "#3b82f6", // 블루
      "#6366f1", // 인디고
    ]);
  }, []);

  // 표 형태로 보기 여부
  const [showTable, setShowTable] = useState(false);

  // 최근 게시글 (최대 5개)
  const recentPosts = [...posts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">소개</h1>
        <p className="text-xl  max-w-2xl mx-auto">
          코드로 만드는 더 나은 일상을 추구하는 개발자입니다. 웹 개발, AI
          에이전트, 역학 시뮬레이션, 알고리즘까지 다양한 분야의 기술을
          공유합니다.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Profile & Contact Info */}
        <div className="space-y-8">
          <Card className="toss-card">
            <CardContent className="p-8 text-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
                alt="Professional developer headshot for about page"
                className="w-32 h-32 rounded-full object-cover mx-auto mb-6 shadow-lg"
              />

              <h2 className="text-2xl font-bold mb-2">Seobway</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                SW Developer
              </p>

              <p className="leading-relaxed">
                프론트엔드 개발자로 React, TypeScript, Electron 등의 기술을 주로
                다룹니다. 웹 성능 최적화와 사용자 경험 개선에 관심이 많으며,
                새로운 기술을 학습하고 공유하는 것을 좋아합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="toss-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>연락</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href="mailto:developer@example.com"
                className="flex items-center space-x-3 p-3 rounded-lg hover-gradient-bg transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-end), var(--gradient-start))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))";
                  }}
                >
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">이메일</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    developer@example.com
                  </p>
                </div>
              </a>

              <a
                href="https://github.com/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg hover-gradient-bg transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-end), var(--gradient-start))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))";
                  }}
                >
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">GitHub</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    github.com/developer
                  </p>
                </div>
              </a>

              <a
                href="https://linkedin.com/in/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg hover-gradient-bg transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-end), var(--gradient-start))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))";
                  }}
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">LinkedIn</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    linkedin.com/in/developer
                  </p>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="toss-card">
            <CardHeader>
              <CardTitle>주요 기술 스택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "React",
                  "TypeScript",
                  "Next.js",
                  "Tailwind CSS",
                  "Node.js",
                  "PostgreSQL",
                  "Docker",
                  "AWS",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-300/30 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blog Statistics & Recent Posts */}
        <div className="space-y-8">
          {/* Blog Statistics */}
          <Card className="toss-card">
            <CardHeader>
              <CardTitle>블로그 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{totalPosts}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    게시글
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    {totalViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    조회수
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">{categories}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    카테고리
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="toss-card">
            <CardHeader
              className="flex flex-row items-center justify-between"
              style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
            >
              <CardTitle
                className="!text-black dark:!text-white"
                style={{
                  color: theme === "dark" ? "#ffffff" : "#000000",
                }}
              >
                카테고리별 분포
              </CardTitle>
              <button
                onClick={() => setShowTable(!showTable)}
                className="text-xs text-gray-800 dark:text-gray-400 hover:text-black dark:hover:text-gray-300 transition-colors"
              >
                {showTable ? "그래프 보기" : "표 보기"}
              </button>
            </CardHeader>
            <CardContent>
              {categoryDistribution.length === 0 ? (
                <p className="text-sm text-gray-800 dark:text-gray-400 text-center py-8">
                  카테고리 데이터가 없습니다.
                </p>
              ) : (
                <AnimatePresence mode="wait">
                  {showTable ? (
                    // 표 형태
                    <motion.div
                      key="table"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {categoryDistribution.map((item, index) => {
                        const percentage = Math.round(
                          (item.count / totalPosts) * 100,
                        );
                        return (
                          <motion.div
                            key={item.originalName}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div
                                className="w-4 h-4 rounded"
                                style={{
                                  backgroundColor:
                                    gradientColors[
                                      index % gradientColors.length
                                    ],
                                }}
                              />
                              <span
                                className="text-sm font-medium !text-black dark:!text-gray-300"
                                style={{
                                  color:
                                    theme === "dark" ? "#d1d5db" : "#000000",
                                }}
                              >
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{
                                    delay: index * 0.05 + 0.2,
                                    duration: 0.4,
                                  }}
                                  className="h-full rounded-full"
                                  style={{
                                    background: `linear-gradient(90deg, ${
                                      gradientColors[
                                        index % gradientColors.length
                                      ]
                                    }, ${
                                      gradientColors[
                                        (index + 1) % gradientColors.length
                                      ]
                                    })`,
                                  }}
                                />
                              </div>
                              <span
                                className="text-sm font-semibold !text-black dark:!text-white w-12 text-right"
                                style={{
                                  color:
                                    theme === "dark" ? "#ffffff" : "#000000",
                                }}
                              >
                                {item.count}개
                              </span>
                              <span
                                className="text-xs !text-gray-800 dark:!text-gray-400 w-10 text-right"
                                style={{
                                  color:
                                    theme === "dark" ? "#9ca3af" : "#1f2937",
                                }}
                              >
                                {percentage}%
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  ) : (
                    // 그래프 형태
                    <motion.div
                      key="chart"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="w-full"
                    >
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                          data={categoryDistribution}
                          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={theme === "dark" ? "#374151" : "#e5e7eb"}
                            opacity={0.2}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{
                              fontSize: 12,
                              fill: theme === "dark" ? "#9ca3af" : "#000000",
                            }}
                          />
                          <YAxis
                            tick={{
                              fontSize: 12,
                              fill: theme === "dark" ? "#9ca3af" : "#000000",
                            }}
                            allowDecimals={false}
                          />
                          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                            {categoryDistribution.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  gradientColors[index % gradientColors.length]
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        className="mt-4 space-y-2"
                      >
                        {categoryDistribution.map((item, index) => (
                          <div
                            key={item.originalName}
                            className="flex items-center justify-between text-sm p-2 rounded bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{
                                  backgroundColor:
                                    gradientColors[
                                      index % gradientColors.length
                                    ],
                                }}
                              />
                              <span
                                className="!text-black dark:!text-gray-300 font-medium"
                                style={{
                                  color:
                                    theme === "dark" ? "#d1d5db" : "#000000",
                                }}
                              >
                                {item.name}
                              </span>
                            </div>
                            <span
                              className="font-semibold !text-black dark:!text-white"
                              style={{
                                color: theme === "dark" ? "#ffffff" : "#000000",
                              }}
                            >
                              {item.count}개
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>

          {/* Recent Posts */}
          <Card className="toss-card">
            <CardHeader>
              <CardTitle>최근 게시글</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPosts.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    게시글이 없습니다.
                  </p>
                ) : (
                  recentPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.slug}`}
                      className="block group"
                    >
                      <p className="text-sm font-medium hover-gradient-text transition-colors line-clamp-2">
                        {post.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 메시지 보내기와 FAQ는 주석 처리 (나중에 추가할 수 있도록) */}
          {/* 
          <Card className="toss-card">
            <CardHeader>
              <CardTitle>메시지 보내기</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                ...
              </form>
            </CardContent>
          </Card>

          <Card className="toss-card mt-8">
            <CardHeader>
              <CardTitle>자주 묻는 질문</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              ...
            </CardContent>
          </Card>
          */}
        </div>
      </div>
    </div>
  );
}
