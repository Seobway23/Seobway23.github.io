import { QueryClient, QueryFunction } from "@tanstack/react-query";
import {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getFeaturedPosts,
  searchPosts,
  incrementPostViews,
  initializePosts,
} from "./posts";

// 프론트엔드 전용: 게시글 초기화
if (typeof window !== "undefined") {
  initializePosts();
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  // 프론트엔드에서 직접 처리
  if (url.startsWith("/api/posts/") && url.endsWith("/view")) {
    const slug = url.split("/")[3];
    incrementPostViews(slug);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 서버가 있는 경우에만 fetch 사용
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost"
  ) {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  }

  // 프론트엔드에서 직접 처리
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;

    // 프론트엔드에서 직접 처리
    if (url.startsWith("/api/posts")) {
      const params = new URLSearchParams(queryKey[1] as string);
      const category = params.get("category");
      const search = params.get("search");
      const sort = params.get("sort");

      if (url === "/api/posts/featured") {
        return getFeaturedPosts() as T;
      }

      if (url === "/api/posts/popular") {
        // 조회수 기반 인기 게시글
        const { getPopularPosts } = await import("./posts");
        return (await getPopularPosts(10)) as T;
      }

      if (url.startsWith("/api/posts/") && !url.includes("?")) {
        const slug = url.split("/").pop();
        if (slug) {
          const post = getPostBySlug(slug);
          if (post) {
            return { ...post, views: post.views + 1 } as T;
          }
          throw new Error("Post not found");
        }
      }

      let posts;
      if (search) {
        posts = searchPosts(search);
      } else if (category && category !== "all") {
        posts = getPostsByCategory(category);
      } else {
        posts = getAllPosts();
      }

      // 정렬
      if (sort === "popular") {
        posts.sort((a, b) => b.views - a.views);
      } else if (sort === "oldest") {
        posts.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else {
        // 최신순 (기본값)
        posts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      return posts as T;
    }

    // 카테고리 목록 가져오기
    if (url === "/api/categories") {
      const { getCategories } = await import("./posts");
      return getCategories() as T;
    }

    // 서버가 있는 경우에만 fetch 사용
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
    ) {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    }

    // 기본값 반환
    return [] as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
