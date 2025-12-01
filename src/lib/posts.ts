import type { Post } from "@shared/schema";

// 프론트엔드에서 게시글을 관리하는 스토리지
const STORAGE_KEY = "blog-posts";

// 샘플 게시글 데이터 (React 18 게시글만)
const samplePosts: Post[] = [
  {
    id: 1,
    title: "React 18의 새로운 Concurrent Features 완벽 정리",
    slug: "react-18-concurrent-features",
    excerpt:
      "React 18에서 도입된 Concurrent Features와 Suspense, useTransition 등의 새로운 기능들을 실제 예제와 함께 자세히 알아보겠습니다.",
    content: `<h1>React 18의 주요 변화점</h1>

<p>React 18은 React의 새로운 <strong style="color: #667eea;">메이저 버전</strong>으로, <mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 3px;">Concurrent Features</mark>를 중심으로 많은 변화를 가져왔습니다. 이번 글에서는 React 18의 주요 기능들을 실제 코드 예제와 함께 살펴보겠습니다.</p>

<h2>1. Automatic Batching</h2>

<p>React 18에서는 모든 업데이트가 <strong>자동으로 배치</strong>됩니다. 이는 <span style="color: #10b981; font-weight: 600;">성능 향상</span>에 크게 기여합니다.</p>

<pre><code class="language-javascript">// React 17에서는 배치되지 않았던 경우
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 18에서는 이제 배치됩니다!
}, 1000);

// Promise, setTimeout, 네이티브 이벤트 핸들러에서도 배치됩니다
fetch('/someapi').then(() => {
  setLoading(false);
  setError(null);
  // 배치됨!
});</code></pre>

<h2>2. useTransition과 startTransition</h2>

<p>사용자 입력과 같은 <span style="color: #ef4444; font-weight: 600;">긴급한 업데이트</span>와 결과 렌더링과 같은 <span style="color: #3b82f6; font-weight: 600;">비긴급 업데이트</span>를 구분할 수 있습니다.</p>

<pre><code class="language-javascript">import { useTransition, useState } from 'react';

function SearchBox() {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (term) => {
    // 긴급 업데이트
    setSearchTerm(term);
    
    // 비긴급 업데이트
    startTransition(() => {
      setResults(expensiveSearch(term));
    });
  };

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="검색어를 입력하세요"
      />
      {isPending && <div>검색 중...</div>}
      <SearchResults results={results} />
    </div>
  );
}</code></pre>

<h2>3. Suspense 개선</h2>

<p>React 18에서는 <mark style="background-color: #dbeafe; padding: 2px 4px; border-radius: 3px;">Suspense</mark>가 더 많은 경우에 사용할 수 있게 되었습니다.</p>

<pre><code class="language-javascript">import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ProfilePage />
    </Suspense>
  );
}</code></pre>

<h2>마무리</h2>

<p>React 18의 <strong style="color: #8b5cf6;">Concurrent Features</strong>는 사용자 경험을 크게 개선시킵니다. 특히 <span style="color: #f59e0b; font-weight: 600;">큰 애플리케이션</span>에서 성능 향상을 체감할 수 있을 것입니다.</p>`,
    category: "react",
    tags: ["React", "JavaScript", "Performance", "Frontend"],
    author: "김개발자",
    readTime: 8,
    views: 1234,
    featured: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

// 게시글 저장소 초기화
export function initializePosts(): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samplePosts));
  }
}

// 모든 게시글 가져오기
export function getAllPosts(): Post[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    initializePosts();
    return samplePosts;
  }

  try {
    const posts = JSON.parse(stored);
    // Date 객체 복원
    return posts.map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
    }));
  } catch {
    return samplePosts;
  }
}

// slug로 게시글 가져오기
export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return posts.find((post) => post.slug === slug);
}

// 카테고리로 게시글 가져오기
export function getPostsByCategory(category: string): Post[] {
  const posts = getAllPosts();
  if (category === "all") return posts;
  return posts.filter((post) => post.category === category);
}

// 인기 게시글 가져오기
export function getFeaturedPosts(): Post[] {
  const posts = getAllPosts();
  return posts.filter((post) => post.featured);
}

// 게시글 검색
export function searchPosts(query: string): Post[] {
  const posts = getAllPosts();
  const lowerQuery = query.toLowerCase();
  return posts.filter(
    (post) =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.excerpt.toLowerCase().includes(lowerQuery) ||
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// 조회수 증가
export function incrementPostViews(slug: string): void {
  const posts = getAllPosts();
  const post = posts.find((p) => p.slug === slug);
  if (post) {
    post.views += 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
}

// 새 게시글 추가
export function addPost(
  post: Omit<Post, "id" | "views" | "createdAt" | "updatedAt">
): Post {
  const posts = getAllPosts();
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
