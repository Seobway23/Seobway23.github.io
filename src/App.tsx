import { useEffect } from "react";
import { Router as WouterRouter, Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./hooks/use-theme";
import { initGA, trackPageView } from "./lib/analytics";
import Layout from "./components/layout";
import Home from "./pages/home";
import Post from "./pages/post";
import About from "./pages/about";
import NotFound from "./pages/not-found";

function AppRoutes() {
  const [location] = useLocation();

  // Google Analytics 초기화
  useEffect(() => {
    initGA();
  }, []);

  // 페이지 변경 시 페이지뷰 추적
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/post/:slug" component={Post} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const baseUrl = import.meta.env.BASE_URL;
  const wouterBase =
    baseUrl.length > 1 ? baseUrl.replace(/\/$/, "") : undefined;

  const tree = (
    <ThemeProvider>
      <TooltipProvider>
        <Layout>
          <AppRoutes />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {wouterBase ? (
        <WouterRouter base={wouterBase}>{tree}</WouterRouter>
      ) : (
        tree
      )}
    </QueryClientProvider>
  );
}

export default App;
