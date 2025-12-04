/**
 * 게시글 조회수 관리
 * views.json 파일의 조회수와 posts 데이터를 병합
 */

import type { Post } from "@shared/schema";
import { getViewsData } from "./views";
import { getAllPosts } from "./posts";

/**
 * 조회수 데이터와 병합된 게시글 가져오기
 */
export async function getPostsWithViews(): Promise<Post[]> {
  const posts = getAllPosts();
  const viewsData = await getViewsData();

  // views.json의 조회수로 업데이트 (있으면)
  return posts.map((post) => ({
    ...post,
    views: viewsData[post.slug] ?? post.views,
  }));
}

/**
 * 특정 게시글의 조회수 가져오기 (views.json 우선)
 */
export async function getPostViews(slug: string): Promise<number> {
  const viewsData = await getViewsData();
  return viewsData[slug] ?? 0;
}

