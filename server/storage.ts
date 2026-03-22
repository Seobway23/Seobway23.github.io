import { posts, comments, type Post, type InsertPost, type Comment, type InsertComment } from "@shared/schema";

export interface IStorage {
  // Posts
  getAllPosts(): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getPostBySlug(slug: string): Promise<Post | undefined>;
  getPostsByCategory(category: string): Promise<Post[]>;
  getFeaturedPosts(): Promise<Post[]>;
  incrementPostViews(id: number): Promise<void>;
  searchPosts(query: string): Promise<Post[]>;
  
  // Comments
  getCommentsByPostId(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
}

export class MemStorage implements IStorage {
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private currentPostId: number;
  private currentCommentId: number;

  constructor() {
    this.posts = new Map();
    this.comments = new Map();
    this.currentPostId = 1;
    this.currentCommentId = 1;
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const samplePosts: Post[] = [
      {
        id: 1,
        title: "React 18의 새로운 Concurrent Features 완벽 정리",
        slug: "react-18-concurrent-features",
        excerpt: "React 18에서 도입된 Concurrent Features와 Suspense, useTransition 등의 새로운 기능들을 실제 예제와 함께 자세히 알아보겠습니다.",
        content: `
# React 18의 주요 변화점

React 18은 React의 새로운 메이저 버전으로, Concurrent Features를 중심으로 많은 변화를 가져왔습니다. 이번 글에서는 React 18의 주요 기능들을 실제 코드 예제와 함께 살펴보겠습니다.

## 1. Automatic Batching

React 18에서는 모든 업데이트가 자동으로 배치됩니다. 이는 성능 향상에 크게 기여합니다.

\`\`\`javascript
// React 17에서는 배치되지 않았던 경우
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
});
\`\`\`

## 2. useTransition과 startTransition

사용자 입력과 같은 긴급한 업데이트와 결과 렌더링과 같은 비긴급 업데이트를 구분할 수 있습니다.

\`\`\`javascript
import { useTransition, useState } from 'react';

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
}
\`\`\`

## 마무리

React 18의 Concurrent Features는 사용자 경험을 크게 개선시킵니다. 특히 큰 애플리케이션에서 성능 향상을 체감할 수 있을 것입니다.
        `,
        category: "react",
        tags: ["React", "JavaScript", "Performance", "Frontend"],
        author: "Seobway",
        readTime: 8,
        views: 1234,
        featured: true,
        coverImage: null,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: 2,
        title: "웹 성능 최적화: Core Web Vitals 완벽 가이드",
        slug: "web-performance-core-web-vitals",
        excerpt: "Core Web Vitals를 이해하고 실제 웹사이트의 성능을 측정하고 개선하는 방법을 단계별로 알아보겠습니다.",
        content: `
# Core Web Vitals란?

Core Web Vitals는 Google이 정의한 웹 성능 지표로, 사용자 경험을 측정하는 핵심 메트릭입니다.

## 1. Largest Contentful Paint (LCP)

페이지의 주요 콘텐츠가 로드되는 시간을 측정합니다.

\`\`\`javascript
// LCP 측정
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.log('LCP candidate:', entry.startTime);
  }
}).observe({ type: 'largest-contentful-paint', buffered: true });
\`\`\`

## 2. 이미지 최적화

이미지는 웹 성능에 가장 큰 영향을 미치는 요소 중 하나입니다.

\`\`\`html
<!-- WebP 형식 사용 -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="설명" loading="lazy">
</picture>
\`\`\`
        `,
        category: "performance",
        tags: ["Performance", "Web Vitals", "Optimization"],
        author: "이성능",
        readTime: 12,
        views: 890,
        featured: true,
        coverImage: null,
        createdAt: new Date("2024-01-12"),
        updatedAt: new Date("2024-01-12"),
      },
      {
        id: 3,
        title: "TypeScript 5.0 새로운 기능과 개선사항 정리",
        slug: "typescript-5-new-features",
        excerpt: "TypeScript 5.0에서 추가된 새로운 기능들과 성능 개선사항을 예제 코드와 함께 살펴보겠습니다.",
        content: `
# TypeScript 5.0의 주요 변화

TypeScript 5.0은 성능 개선과 새로운 기능 추가에 초점을 맞춘 버전입니다.

## 1. Decorators

ECMAScript의 decorator 제안을 공식적으로 지원합니다.

\`\`\`typescript
function logged(value, { kind, name }) {
  if (kind === "method") {
    return function (...args) {
      console.log(\`starting \${name} with arguments \${args.join(", ")}\`);
      const ret = value.call(this, ...args);
      console.log(\`ending \${name}\`);
      return ret;
    };
  }
}

class C {
  @logged
  m(arg) {
    console.log(\`執行中: \${arg}\`);
  }
}
\`\`\`
        `,
        category: "typescript",
        tags: ["TypeScript", "JavaScript", "ES2023"],
        author: "박타입",
        readTime: 10,
        views: 756,
        featured: false,
        coverImage: null,
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-10"),
      },
      {
        id: 4,
        title: "CSS Grid vs Flexbox: 언제 무엇을 사용해야 할까?",
        slug: "css-grid-vs-flexbox-guide",
        excerpt: "CSS의 두 가지 주요 레이아웃 시스템인 Grid와 Flexbox의 차이점을 알아보고, 각각의 장단점과 적절한 사용 시나리오를 실제 예제와 함께 비교해보겠습니다.",
        content: `
# CSS Grid vs Flexbox

CSS의 두 가지 주요 레이아웃 시스템을 비교해보겠습니다.

## Grid를 사용해야 하는 경우

2차원 레이아웃이 필요할 때 Grid를 사용하세요.

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
\`\`\`

## Flexbox를 사용해야 하는 경우

1차원 레이아웃이나 컴포넌트 내부 정렬에는 Flexbox가 적합합니다.

\`\`\`css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
\`\`\`
        `,
        category: "css",
        tags: ["CSS", "Layout", "Grid", "Flexbox"],
        author: "최스타일",
        readTime: 6,
        views: 543,
        featured: false,
        coverImage: null,
        createdAt: new Date("2024-01-08"),
        updatedAt: new Date("2024-01-08"),
      },
      {
        id: 5,
        title: "Next.js 13 App Directory 완벽 가이드",
        slug: "nextjs-13-app-directory-guide",
        excerpt: "Next.js 13의 새로운 App Directory를 사용하여 모던한 React 애플리케이션을 구축하는 방법을 알아보겠습니다.",
        content: `
# App Directory 소개

Next.js 13에서 도입된 App Directory는 React 18의 새로운 기능들을 활용한 파일 기반 라우팅 시스템입니다.

## 파일 기반 라우팅

App Directory에서는 폴더 구조가 곧 라우팅 구조가 됩니다.

\`\`\`
app/
├── layout.tsx          # Root layout
├── page.tsx           # Home page
├── about/
│   └── page.tsx       # About page
└── blog/
    ├── layout.tsx     # Blog layout
    ├── page.tsx       # Blog listing
    └── [slug]/
        └── page.tsx   # Blog post
\`\`\`
        `,
        category: "nextjs",
        tags: ["Next.js", "React", "SSR"],
        author: "최넥스트",
        readTime: 15,
        views: 432,
        featured: false,
        coverImage: null,
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
      }
    ];

    samplePosts.forEach(post => {
      this.posts.set(post.id, post);
      this.currentPostId = Math.max(this.currentPostId, post.id + 1);
    });

    const sampleComments: Comment[] = [
      {
        id: 1,
        postId: 1,
        name: "이개발",
        email: "dev@example.com",
        content: "정말 유용한 정보네요! 특히 React 18의 Concurrent Features 부분이 인상깊었습니다.",
        createdAt: new Date("2024-01-16T10:30:00"),
      },
      {
        id: 2,
        postId: 1,
        name: "박프론트",
        email: "frontend@example.com",
        content: "코드 예제가 정말 도움이 되었습니다. useTransition 사용법을 이해하는데 큰 도움이 되었어요.",
        createdAt: new Date("2024-01-16T14:20:00"),
      },
      {
        id: 3,
        postId: 2,
        name: "김웹개발",
        email: "web@example.com",
        content: "성능 최적화 가이드 감사합니다. Core Web Vitals 개선에 바로 적용해보겠습니다.",
        createdAt: new Date("2024-01-13T09:15:00"),
      }
    ];

    sampleComments.forEach(comment => {
      this.comments.set(comment.id, comment);
      this.currentCommentId = Math.max(this.currentCommentId, comment.id + 1);
    });
  }

  async getAllPosts(): Promise<Post[]> {
    return Array.from(this.posts.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    return Array.from(this.posts.values()).find(post => post.slug === slug);
  }

  async getPostsByCategory(category: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFeaturedPosts(): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.featured)
      .sort((a, b) => b.views - a.views);
  }

  async incrementPostViews(id: number): Promise<void> {
    const post = this.posts.get(id);
    if (post) {
      post.views += 1;
      this.posts.set(id, post);
    }
  }

  async searchPosts(query: string): Promise<Post[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.posts.values()).filter(post =>
      post.title.toLowerCase().includes(lowerQuery) ||
      post.excerpt.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const comment: Comment = {
      ...insertComment,
      id: this.currentCommentId++,
      createdAt: new Date(),
    };
    this.comments.set(comment.id, comment);
    return comment;
  }
}

export const storage = new MemStorage();
