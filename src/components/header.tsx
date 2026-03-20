import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Sun, Moon, Palette, Menu, X } from "lucide-react";
import { useTheme } from "../hooks/use-theme";
import { useIsMobile } from "../hooks/use-mobile";
import { useLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundCustomizer from "./background-customizer";
import { SearchDialog } from "./search-dialog";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const isMobile = useIsMobile();
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout();

  // Cmd+K / Ctrl+K 단축키로 검색 다이얼로그 열기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchDialog(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 모바일: 햄버거 메뉴, 데스크톱: 로고 */}
            {isMobile ? (
              <button
                onClick={handleMenuClick}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                style={{ position: "relative", zIndex: 60, flexShrink: 0 }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-6 h-6 text-gray-900 dark:text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ) : (
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
            )}

            {/* Search - 데스크톱: 검색 입력창, 모바일: 검색 버튼 */}
            <div className="flex-1 max-w-md mx-4 md:mx-8">
              {isMobile ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearchDialog(true)}
                  className="w-full justify-start text-left text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Search className="w-4 h-4 mr-2" />
                  <span className="text-sm">검색...</span>
                  <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    {navigator.platform.toLowerCase().includes("mac") ? (
                      <span className="text-xs">⌘</span>
                    ) : (
                      <span className="text-xs">Ctrl</span>
                    )}
                    <span>K</span>
                  </kbd>
                </Button>
              ) : (
                <button
                  onClick={() => setShowSearchDialog(true)}
                  className="w-full relative"
                >
                  <Input
                    type="text"
                    placeholder={`검색어를 입력하세요... (${
                      navigator.platform.toLowerCase().includes("mac")
                        ? "⌘"
                        : "Ctrl"
                    } K)`}
                    readOnly
                    className="pl-10 pr-20 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    {navigator.platform.toLowerCase().includes("mac") ? (
                      <span className="text-xs">⌘</span>
                    ) : (
                      <span className="text-xs">Ctrl</span>
                    )}
                    <span>K</span>
                  </kbd>
                </button>
              )}
            </div>

            {/* Navigation & Controls */}
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex items-center space-x-6">
                <Link
                  href="/"
                  className={`text-sm font-medium ${
                    location === "/"
                      ? "hover-gradient-text"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  style={
                    location === "/"
                      ? { color: "var(--gradient-start)" }
                      : undefined
                  }
                >
                  홈
                </Link>
                <Link
                  href="/about"
                  className={`text-sm font-medium ${
                    location === "/about"
                      ? "hover-gradient-text"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  style={
                    location === "/about"
                      ? { color: "var(--gradient-start)" }
                      : undefined
                  }
                >
                  소개
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

      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
      />
    </>
  );
}
