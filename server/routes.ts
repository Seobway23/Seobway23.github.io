import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const { category, search, sort } = req.query;
      
      let posts;
      if (search) {
        posts = await storage.searchPosts(search as string);
      } else if (category && category !== 'all') {
        posts = await storage.getPostsByCategory(category as string);
      } else {
        posts = await storage.getAllPosts();
      }

      // Apply sorting
      if (sort === 'popular') {
        posts.sort((a, b) => b.views - a.views);
      } else if (sort === 'oldest') {
        posts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }

      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get featured posts
  app.get("/api/posts/featured", async (req, res) => {
    try {
      const posts = await storage.getFeaturedPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured posts" });
    }
  });

  // Get popular posts (조회수 기반)
  app.get("/api/posts/popular", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      // 조회수 내림차순 정렬
      const sortedPosts = posts.sort((a, b) => b.views - a.views);
      const limit = parseInt(req.query.limit as string) || 10;
      res.json(sortedPosts.slice(0, limit));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular posts" });
    }
  });

  // Get single post by slug
  app.get("/api/posts/:slug", async (req, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Increment post views (호출 1회 = 조회수 +1)
  app.post("/api/posts/:slug/view", async (req, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      await storage.incrementPostViews(post.id);
      res.json({ views: post.views + 1 });
    } catch (error) {
      res.status(500).json({ message: "Failed to increment views" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:slug/comments", async (req, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.getCommentsByPostId(post.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create a comment
  app.post("/api/posts/:slug/comments", async (req, res) => {
    try {
      const post = await storage.getPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: post.id,
      });

      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create comment" });
      }
    }
  });

  // Get categories with post counts
  app.get("/api/categories", async (req, res) => {
    try {
      const posts = await storage.getAllPosts();
      const categories = posts.reduce((acc, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const result = Object.entries(categories).map(([name, count]) => ({
        name,
        count,
        label: getCategoryLabel(name)
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      react: "React",
      typescript: "TypeScript", 
      css: "CSS",
      performance: "Performance",
      nextjs: "Next.js",
      "study/ai/gstack": "gstack",
    };
    return labels[category] || category;
  }

  const httpServer = createServer(app);
  return httpServer;
}
