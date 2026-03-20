import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, Clock, Tag, FolderOpen, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  getSearchSuggestions,
  getRelatedSearchTerms,
  type SearchSuggestion,
} from "@/lib/search-autocomplete";
import {
  getSearchHistory,
  removeFromSearchHistory,
} from "@/lib/search-history";
import { highlightSearchMatch } from "@/lib/korean-search";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState(getSearchHistory());

  // 검색 제안 가져오기
  const { data: suggestions = [], isLoading } = useQuery<SearchSuggestion[]>({
    queryKey: ["search-suggestions", searchQuery],
    queryFn: () => getSearchSuggestions(searchQuery, 8),
    enabled: searchQuery.trim().length > 0,
    staleTime: 30000,
  });

  // 연관검색어 가져오기
  const { data: relatedTerms = [] } = useQuery<string[]>({
    queryKey: ["related-search-terms", searchQuery],
    queryFn: () => getRelatedSearchTerms(searchQuery, 5),
    enabled: searchQuery.trim().length > 0 && suggestions.length === 0,
    staleTime: 30000,
  });

  // 다이얼로그가 열릴 때마다 검색 히스토리 새로고침
  useEffect(() => {
    if (open) {
      setSearchHistory(getSearchHistory());
    }
  }, [open]);

  // 검색 실행
  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      const trimmedQuery = query.trim();

      // 태그 검색인 경우
      if (trimmedQuery.startsWith("tag:")) {
        navigate(`/?tag=${encodeURIComponent(trimmedQuery.slice(4))}`);
      } else {
        navigate(`/?search=${encodeURIComponent(trimmedQuery)}`);
      }

      onOpenChange(false);
      setSearchQuery("");
      setSelectedIndex(0);
    },
    [navigate, onOpenChange]
  );

  // 게시글 클릭 시 해당 게시글 페이지로 이동
  const handlePostClick = useCallback(
    (slug: string) => {
      navigate(`/post/${slug}`);
      onOpenChange(false);
      setSearchQuery("");
      setSelectedIndex(0);
    },
    [navigate, onOpenChange]
  );

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 전체 항목 수 계산
      let totalItems = 0;
      if (searchQuery.trim()) {
        // 검색어가 있을 때: 검색 제안 + "전체 검색" 옵션
        totalItems = suggestions.length;
        if (suggestions.length > 0) {
          totalItems += 1; // "전체 검색" 옵션
        }
        // 연관검색어가 있을 때
        if (relatedTerms.length > 0 && suggestions.length === 0) {
          totalItems = relatedTerms.length;
        }
      } else {
        // 검색어가 없을 때: 최근 검색 히스토리
        totalItems = searchHistory.length;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (searchQuery.trim()) {
          // 검색어가 있을 때
          if (suggestions.length > 0) {
            if (selectedIndex < suggestions.length) {
              // 검색 제안 선택
              const selectedSuggestion = suggestions[selectedIndex];
              // 게시글인 경우 해당 게시글 페이지로 이동
              if (
                selectedSuggestion.type === "post" &&
                selectedSuggestion.slug
              ) {
                handlePostClick(selectedSuggestion.slug);
              } else if (selectedSuggestion.type === "tag") {
                // 태그인 경우 태그 필터로 이동
                const tagName = selectedSuggestion.value.startsWith("tag:")
                  ? selectedSuggestion.value.slice(4)
                  : selectedSuggestion.value;
                navigate(`/?tag=${encodeURIComponent(tagName)}`);
                onOpenChange(false);
                setSearchQuery("");
                setSelectedIndex(0);
              } else if (selectedSuggestion.type === "category") {
                // 카테고리인 경우 카테고리 필터로 이동
                navigate(
                  `/?category=${encodeURIComponent(selectedSuggestion.value)}`
                );
                onOpenChange(false);
                setSearchQuery("");
                setSelectedIndex(0);
              } else {
                handleSearch(selectedSuggestion.value);
              }
            } else if (selectedIndex === suggestions.length) {
              // "전체 검색" 옵션 선택
              handleSearch(searchQuery);
            }
          } else if (
            relatedTerms.length > 0 &&
            selectedIndex < relatedTerms.length
          ) {
            // 연관검색어 선택
            handleSearch(relatedTerms[selectedIndex]);
          } else {
            // 검색어로 직접 검색
            handleSearch(searchQuery);
          }
        } else {
          // 검색어가 없을 때: 최근 검색 히스토리
          if (
            searchHistory.length > 0 &&
            selectedIndex < searchHistory.length
          ) {
            handleSearch(searchHistory[selectedIndex].query);
          }
        }
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    suggestions,
    searchHistory,
    relatedTerms,
    selectedIndex,
    searchQuery,
    handleSearch,
    handlePostClick,
    navigate,
    onOpenChange,
  ]);

  // 검색어 변경 시 선택 인덱스 리셋
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const renderSuggestion = (suggestion: SearchSuggestion, index: number) => {
    const isSelected = index === selectedIndex;
    const highlightedTitle = highlightSearchMatch(
      suggestion.title,
      searchQuery
    );

    // 게시글인 경우 클릭 시 해당 게시글 페이지로 이동
    // 태그/카테고리인 경우 해당 필터로 이동
    const handleClick = () => {
      if (suggestion.type === "post" && suggestion.slug) {
        handlePostClick(suggestion.slug);
      } else if (suggestion.type === "tag") {
        // tag:태그명 형식에서 태그명만 추출
        const tagName = suggestion.value.startsWith("tag:")
          ? suggestion.value.slice(4)
          : suggestion.value;
        navigate(`/?tag=${encodeURIComponent(tagName)}`);
        onOpenChange(false);
        setSearchQuery("");
        setSelectedIndex(0);
      } else if (suggestion.type === "category") {
        navigate(`/?category=${encodeURIComponent(suggestion.value)}`);
        onOpenChange(false);
        setSearchQuery("");
        setSelectedIndex(0);
      } else {
        handleSearch(suggestion.value);
      }
    };

    return (
      <CommandItem
        key={`${suggestion.type}-${suggestion.value}-${index}`}
        value={suggestion.value}
        onSelect={handleClick}
        className={`cursor-pointer ${isSelected ? "bg-accent" : ""}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {suggestion.type === "post" && (
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
          )}
          {suggestion.type === "tag" && (
            <Tag className="h-4 w-4 text-purple-500 shrink-0" />
          )}
          {suggestion.type === "category" && (
            <FolderOpen className="h-4 w-4 text-green-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {highlightedTitle.map((part, i) => (
                <span
                  key={i}
                  className={
                    part.match ? "bg-yellow-200 dark:bg-yellow-900" : ""
                  }
                >
                  {part.text}
                </span>
              ))}
            </div>
            {suggestion.subtitle && (
              <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {suggestion.subtitle}
              </div>
            )}
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {suggestion.type === "post"
              ? "게시글"
              : suggestion.type === "tag"
              ? "태그"
              : "카테고리"}
          </Badge>
        </div>
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="검색어를 입력하세요."
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="text-base"
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              검색 중...
            </div>
          ) : searchQuery.trim() ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                검색 결과가 없습니다.
              </p>
              <button
                onClick={() => handleSearch(searchQuery)}
                className="text-sm text-primary hover:underline mb-4 block"
              >
                "{searchQuery}"로 검색하기
              </button>
              {relatedTerms.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    연관검색어
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {relatedTerms.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="text-xs px-3 py-1 bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              검색어를 입력하세요
            </div>
          )}
        </CommandEmpty>

        <AnimatePresence>
          {searchQuery.trim()
            ? suggestions.length > 0 && (
                <CommandGroup heading="검색 제안">
                  {suggestions.map((suggestion, index) =>
                    renderSuggestion(suggestion, index)
                  )}
                </CommandGroup>
              )
            : searchHistory.length > 0 && (
                <CommandGroup heading="최근 검색">
                  {searchHistory.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <CommandItem
                        key={`history-${item.query}-${item.timestamp}`}
                        value={item.query}
                        onSelect={() => handleSearch(item.query)}
                        className={`cursor-pointer ${
                          isSelected ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="flex-1">{item.query}</span>
                          {item.resultCount !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {item.resultCount}개 결과
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromSearchHistory(item.query);
                              setSearchHistory(getSearchHistory());
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded p-1 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
        </AnimatePresence>

        {searchQuery.trim() && suggestions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandItem
              onSelect={() => handleSearch(searchQuery)}
              className="cursor-pointer"
            >
              <Search className="h-4 w-4 mr-2" />
              <span>"{searchQuery}" 전체 검색</span>
            </CommandItem>
          </>
        )}

        {searchQuery.trim() &&
          relatedTerms.length > 0 &&
          suggestions.length === 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="연관검색어">
                {relatedTerms.map((term) => (
                  <CommandItem
                    key={term}
                    onSelect={() => handleSearch(term)}
                    className="cursor-pointer"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    <span>{term}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
      </CommandList>
    </CommandDialog>
  );
}
