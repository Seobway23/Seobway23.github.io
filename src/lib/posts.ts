import type { Post } from "@shared/schema";

// 프론트엔드에서 게시글을 관리하는 스토리지
const STORAGE_KEY = "blog-posts";

// 게시글 캐시
let postsCache: Post[] | null = null;

/**
 * posts.json 파일에서 게시글 데이터 가져오기
 */
async function loadPostsFromJSON(): Promise<Post[]> {
  if (postsCache) {
    return postsCache;
  }

  try {
    const response = await fetch("/posts.json");
    if (!response.ok) {
      throw new Error("Failed to fetch posts data");
    }
    const posts = await response.json();

    // Date 객체 복원
    postsCache = posts.map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
    }));

    return postsCache;
  } catch (error) {
    console.warn(
      "posts.json을 가져올 수 없습니다. 기본값을 사용합니다.",
      error
    );
    return [];
  }
}

/**
 * 게시글 저장소 초기화 (localStorage에 캐시)
 */
export async function initializePosts(): Promise<void> {
  if (typeof window === "undefined") return;

  const posts = await loadPostsFromJSON();
  if (posts.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
}

/**
 * 모든 게시글 가져오기
 */
export async function getAllPosts(): Promise<Post[]> {
  if (typeof window === "undefined") return [];

  // 먼저 posts.json에서 로드 시도
  try {
    const posts = await loadPostsFromJSON();
    if (posts.length > 0) {
      return posts;
    }
  } catch (error) {
    // posts.json 로드 실패 시 localStorage 확인
  }

  // localStorage에서 가져오기 (fallback)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const posts = JSON.parse(stored);
      return posts.map((post: any) => ({
        ...post,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt),
      }));
    } catch {
      // 파싱 실패
    }
  }

  return [];
}

/**
 * slug로 게시글 가져오기
 */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}

/**
 * 카테고리로 게시글 가져오기
 * 계층 구조 지원: frontend 선택 시 frontend/css, frontend/react 등 모든 하위 카테고리 포함
 */
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const posts = await getAllPosts();
  if (category === "all") return posts;

  // 정확히 일치하거나, 선택한 카테고리로 시작하는 모든 하위 카테고리 포함
  return posts.filter((post) => {
    const postCategory = post.category || "";
    return postCategory === category || postCategory.startsWith(`${category}/`);
  });
}

/**
 * 인기 게시글 가져오기 (featured 플래그 기반)
 */
export async function getFeaturedPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.featured);
}

/**
 * 조회수 기반 인기 게시글 가져오기
 */
export async function getPopularPosts(limit: number = 10): Promise<Post[]> {
  const posts = await getAllPosts();

  // views.json에서 조회수 데이터 가져오기
  try {
    const { getViewsData } = await import("./views");
    const viewsData = await getViewsData();

    // 조회수 데이터와 병합
    const postsWithViews = posts.map((post) => ({
      ...post,
      views: viewsData[post.slug] ?? post.views, // views.json의 조회수 우선 사용
    }));

    // 조회수 내림차순 정렬
    return postsWithViews.sort((a, b) => b.views - a.views).slice(0, limit);
  } catch (error) {
    // views.json을 가져올 수 없으면 기존 views 사용
    return posts.sort((a, b) => b.views - a.views).slice(0, limit);
  }
}

/**
 * 게시글 검색
 */
export async function searchPosts(query: string): Promise<Post[]> {
  const posts = await getAllPosts();
  const lowerQuery = query.toLowerCase();
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.excerpt.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 태그로 게시글 가져오기
 */
export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter((post) =>
    post.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * 카테고리 목록 가져오기 (게시글 수 포함)
 */
export async function getCategories(): Promise<
  Array<{ name: string; label: string; count: number }>
> {
  const posts = await getAllPosts();
  const categoryMap = new Map<string, number>();

  posts.forEach((post) => {
    const count = categoryMap.get(post.category) || 0;
    categoryMap.set(post.category, count + 1);
  });

  const categoryLabels: Record<string, string> = {
    react: "React",
    typescript: "TypeScript",
    css: "CSS",
    performance: "Performance",
    nextjs: "Next.js",
  };

  return Array.from(categoryMap.entries()).map(([name, count]) => ({
    name,
    label: categoryLabels[name] || name,
    count,
  }));
}

/**
 * 조회수 증가 (localStorage용)
 */
export async function incrementPostViews(slug: string): Promise<void> {
  const posts = await getAllPosts();
  const post = posts.find((p) => p.slug === slug);
  if (post) {
    post.views += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    // 캐시도 업데이트
    if (postsCache) {
      const cachedPost = postsCache.find((p) => p.slug === slug);
      if (cachedPost) {
        cachedPost.views += 1;
      }
    }
  }
}

/**
 * 새 게시글 추가 (개발용 - 마크다운 파일 추가 후 generate-posts-data.js 실행 권장)
 */
export async function addPost(
  post: Omit<Post, "id" | "views" | "createdAt" | "updatedAt">
): Promise<Post> {
  const posts = await getAllPosts();
  const newPost: Post = {
    ...post,
    id: Math.max(...posts.map((p) => p.id), 0) + 1,
    views: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  posts.push(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return newPost;
}
