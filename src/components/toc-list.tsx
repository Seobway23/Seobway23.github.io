import { scrollToHeading, type TocGroup } from "@/hooks/use-post-toc";

interface TocListProps {
  groups: TocGroup[];
  activeId?: string;
  /** 항목 클릭 후 실행(모바일 모달 닫기 등) */
  onNavigate?: (id: string) => void;
}

/**
 * 목차 리스트(H2 + H3 자식). 현재 섹션(activeId)은 aria-current로 표시하고
 * 색은 사이트 커스텀 그라디언트 컬러(.toc-link, index.css)를 상속한다.
 * PC 사이드바와 모바일 목차 모달이 공유한다.
 */
export default function TocList({ groups, activeId, onNavigate }: TocListProps) {
  const go = (id: string) => {
    scrollToHeading(id);
    onNavigate?.(id);
  };

  return (
    <nav aria-label="목차" className="space-y-0.5">
      {groups.map(({ h2, children }) => (
        <div key={h2.id}>
          <button
            type="button"
            onClick={() => go(h2.id)}
            aria-current={activeId === h2.id ? "location" : undefined}
            className="toc-link px-2 py-1.5 text-xs font-medium text-foreground"
          >
            {h2.text}
          </button>

          {children.length > 0 && (
            <div className="ml-2 space-y-0.5 border-l border-border/60 pl-2">
              {children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(c.id)}
                  aria-current={activeId === c.id ? "location" : undefined}
                  className="toc-link px-2 py-1 text-[11px] text-muted-foreground"
                >
                  {c.text}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
