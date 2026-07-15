import { useState, useEffect, useMemo } from "react";

export type TocItem = { id: string; text: string; level: number };
export type TocGroup = { h2: TocItem; children: TocItem[] };

/**
 * 렌더된 글 본문(#post-content)의 H2/H3를 읽어 목차 데이터를 만들고,
 * 스크롤 위치에 따라 현재 보이는 섹션(activeId)을 추적한다(스크롤스파이).
 * PC 사이드바와 모바일 목차 모달이 이 하나의 소스를 공유한다.
 *
 * @param contentKey 글이 바뀌면 목차를 다시 만들기 위한 의존값(예: post.content/slug)
 */
export function usePostToc(contentKey: unknown) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // 본문 헤딩 수집 + id 부여 (본문은 dangerouslySetInnerHTML 이후 렌더되므로 약간 지연)
  useEffect(() => {
    let cancelled = false;
    const build = () => {
      // 본문(prose) 안의 헤딩만 — article의 태그/댓글 h3 등이 섞이지 않게 범위를 좁힘
      const headings = document.querySelectorAll<HTMLElement>(
        "#post-body h2, #post-body h3",
      );
      const toc: TocItem[] = Array.from(headings).map((h, i) => {
        const id = h.id && h.id.startsWith("heading-") ? h.id : `heading-${i}`;
        h.id = id;
        return {
          id,
          text: h.textContent || "",
          level: parseInt(h.tagName.charAt(1), 10),
        };
      });
      if (!cancelled) setItems(toc);
    };
    const t = setTimeout(build, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [contentKey]);

  // 스크롤스파이: 현재 화면 상단에 걸린 헤딩을 active로
  useEffect(() => {
    if (items.length === 0) return;
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el != null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      // 상단 80px(헤더) 아래부터, 화면 위쪽 30% 구간에 들어온 헤딩을 현재 섹션으로 본다
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const groups = useMemo<TocGroup[]>(() => {
    const g: TocGroup[] = [];
    let cur: TocGroup | null = null;
    for (const it of items) {
      if (it.level === 2) {
        cur = { h2: it, children: [] };
        g.push(cur);
      } else if (it.level === 3 && cur) {
        cur.children.push(it);
      }
    }
    return g;
  }, [items]);

  return { groups, activeId };
}

/** 헤더 높이만큼 여백을 두고 해당 헤딩으로 부드럽게 스크롤 */
export function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
  window.scrollTo({ top: y, behavior: "smooth" });
}
