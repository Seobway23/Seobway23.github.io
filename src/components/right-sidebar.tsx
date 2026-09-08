import { ListTree } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TocList from "@/components/toc-list";
import type { TocGroup } from "@/hooks/use-post-toc";

interface RightSidebarProps {
  /** post.tsx의 usePostToc에서 내려주는 목차(모바일 모달과 동일 소스) */
  toc: TocGroup[];
  activeId?: string;
}

/**
 * 글 우측 열 — 목차 전용.
 *
 * 글 정보(읽기시간·조회수·작성일)·태그·작성자는 본문 헤더와 본문 하단에 이미 있어
 * 사이드바에 두면 같은 정보를 두 번 보여줄 뿐이고, 열이 뷰포트보다 길어져
 * 페이지 스크롤바 + 사이드바 스크롤바가 동시에 생긴다. 그래서 목차만 남긴다.
 * (진행률은 상단 ProgressBar가 담당.)
 */
export default function RightSidebar({ toc, activeId }: RightSidebarProps) {
  if (toc.length === 0) return <aside className="hidden lg:block" />;

  return (
    <aside className="hidden w-full min-w-0 max-w-64 flex-shrink-0 lg:block">
      <div className="sticky top-24">
        <Card className="toss-card">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListTree className="h-4 w-4 text-muted-foreground" aria-hidden />
              목차
            </div>
            {/* 목차가 아주 길 때만 여기서 자른다 — 스크롤바는 최대 1개 */}
            <nav className="max-h-[calc(100vh-11rem)] overflow-y-auto pr-1">
              <TocList groups={toc} activeId={activeId} />
            </nav>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
