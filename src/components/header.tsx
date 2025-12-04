import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Sun, Moon, Palette } from "lucide-react";
import { useTheme } from "../hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BackgroundCustomizer from "./background-customizer";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomizer, setShowCustomizer] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center logo-gradient">
                <span className="text-white font-bold text-sm">TB</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Tech Blog
              </span>
            </Link>

            {/* Search */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Navigation & Controls */}
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/"
                  className={`text-sm font-medium hover-gradient-text ${
                    location === "/"
                      ? "hover-gradient-text"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  style={
                    location === "/" ? { color: "var(--gradient-start)" } : {}
                  }
                >
                  홈
                </Link>
                <Link
                  href="/contact"
                  className={`text-sm font-medium hover-gradient-text ${
                    location === "/contact"
                      ? "hover-gradient-text"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  style={
                    location === "/contact"
                      ? { color: "var(--gradient-start)" }
                      : {}
                  }
                >
                  연락처
                </Link>
              </nav>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="w-9 h-9 text-white"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  <span className="sr-only">테마 전환</span>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCustomizer(true)}
                  className="w-9 h-9 text-white"
                >
                  <Palette className="w-4 h-4" />
                  <span className="sr-only">배경 커스터마이징</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <BackgroundCustomizer
        open={showCustomizer}
        onOpenChange={setShowCustomizer}
      />
    </>
  );
}
