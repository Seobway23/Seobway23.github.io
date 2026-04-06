import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getGlossaryData, getRelatedPostSlugsForTerm } from "@/lib/glossary";
import { getAllPosts } from "@/lib/posts";

interface PostGlossaryLayerProps {
  glossary: Record<string, string> | undefined; // 글별 오버라이드/추가 (termId -> description)
  rootRef: React.RefObject<HTMLElement | null>;
  isMobile: boolean;
  postSlug?: string;
}

type OpenState = {
  termId: string;
  text: string;
  anchorRect: DOMRect;
} | null;

function isEventTargetInElement(target: EventTarget | null, el: HTMLElement | null) {
  return !!(target instanceof Node && el && el.contains(target));
}

function getTermElementFromEventTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest(".glossary-term");
  return el instanceof HTMLElement ? el : null;
}

function computePanelPosition(anchorRect: DOMRect) {
  const padding = 8;
  const panelWidth = 288; // Tailwind w-72
  const panelEstimatedHeight = 96;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const canFitTop = anchorRect.top - padding - panelEstimatedHeight > 0;
  const side = canFitTop ? "top" : "bottom";

  let left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
  left = Math.max(padding, Math.min(vw - padding - panelWidth, left));

  const top =
    side === "top"
      ? Math.max(padding, anchorRect.top - padding)
      : Math.min(vh - padding, anchorRect.bottom + padding);

  return { left, top, side };
}

export function PostGlossaryLayer({
  glossary,
  rootRef,
  isMobile,
  postSlug,
}: PostGlossaryLayerProps) {
  const [globalTerms, setGlobalTerms] = useState<
    Record<string, { id: string; label: string; description: string; aliases: string[] }>
  >({});

  useEffect(() => {
    let cancelled = false;
    getGlossaryData()
      .then((data) => {
        if (cancelled) return;
        const terms = data?.terms && typeof data.terms === "object" ? data.terms : {};
        setGlobalTerms(terms as any);
      })
      .catch(() => {
        if (cancelled) return;
        setGlobalTerms({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dict = useMemo(() => {
    const merged: Record<string, { label: string; description: string }> = {};
    for (const [id, t] of Object.entries(globalTerms)) {
      merged[id] = {
        label: (t as any)?.label || id,
        description: (t as any)?.description || "",
      };
    }
    if (glossary && typeof glossary === "object") {
      for (const [id, desc] of Object.entries(glossary)) {
        if (typeof desc !== "string" || desc.trim().length === 0) continue;
        merged[id] = {
          label: merged[id]?.label || id,
          description: desc.trim(),
        };
      }
    }
    return merged;
  }, [globalTerms, glossary]);

  const matchers = useMemo(() => {
    const out: Array<{ termId: string; alias: string; isAsciiWord: boolean }> = [];
    const asciiWordRe = /^[A-Za-z0-9_]+$/;
    for (const [termId, t] of Object.entries(globalTerms)) {
      const aliases = Array.isArray((t as any).aliases) ? (t as any).aliases : [];
      for (const a of aliases) {
        if (typeof a !== "string") continue;
        const alias = a.trim();
        if (!alias) continue;
        out.push({ termId, alias, isAsciiWord: asciiWordRe.test(alias) });
      }
    }
    // 글별 glossary는 aliases가 없으므로 자동 매칭 대상은 전역 terms만.
    out.sort((a, b) => b.alias.length - a.alias.length);
    return out;
  }, [globalTerms]);

  const [open, setOpen] = useState<OpenState>(null);
  const [related, setRelated] = useState<Array<{ slug: string; title: string }>>([]);
  const [pos, setPos] = useState<{ left: number; top: number; side: "top" | "bottom" } | null>(
    null
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const lastAutoAppliedSlugRef = useRef<string | null>(null);

  const close = () => {
    if (hoverTimerRef.current) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setOpen(null);
    setPos(null);
    setRelated([]);
  };

  const openFor = (termEl: HTMLElement) => {
    const termId = termEl.dataset.term;
    if (!termId) return;
    const entry = dict[termId];
    if (!entry?.description) return;
    const anchorRect = termEl.getBoundingClientRect();
    setOpen({ termId, text: entry.description, anchorRect });
    setPos(computePanelPosition(anchorRect));
  };

  useEffect(() => {
    let cancelled = false;
    if (!open?.termId) return;
    setRelated([]);

    (async () => {
      const slugs = await getRelatedPostSlugsForTerm(open.termId);
      const filtered = slugs.filter((s) => s && s !== postSlug);
      if (filtered.length === 0) return;
      const posts = await getAllPosts();
      const bySlug = new Map(posts.map((p) => [p.slug, p.title]));
      const items = filtered
        .map((slug) => ({ slug, title: bySlug.get(slug) || slug }))
        .slice(0, 3);
      if (cancelled) return;
      setRelated(items);
    })().catch(() => {
      if (cancelled) return;
      setRelated([]);
    });

    return () => {
      cancelled = true;
    };
  }, [open?.termId, postSlug]);

  const shouldSkipAutoWrap = (el: Element | null) => {
    if (!el) return true;
    if (!(el instanceof HTMLElement)) return false;
    return (
      el.closest("pre, code, a, button, input, textarea, select, h1, h2, h3, h4, h5, h6") != null ||
      el.closest(".glossary-term") != null ||
      el.closest("[data-no-glossary]") != null
    );
  };

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const findNextMatch = (text: string) => {
    const hay = text;
    const hayLower = text.toLowerCase();
    let best: { termId: string; matchText: string; index: number } | null = null;

    for (const m of matchers) {
      const alias = m.alias;
      const idx = m.isAsciiWord
        ? hayLower.indexOf(alias.toLowerCase())
        : hay.indexOf(alias) >= 0
          ? hay.indexOf(alias)
          : hayLower.indexOf(alias.toLowerCase());
      if (idx < 0) continue;

      // 엄격 경계(ASCII word): 앞뒤가 알파넘/언더스코어면 제외
      if (m.isAsciiWord) {
        const before = hay[idx - 1];
        const after = hay[idx + alias.length];
        const beforeOk = before == null || !/[A-Za-z0-9_]/.test(before);
        const afterOk = after == null || !/[A-Za-z0-9_]/.test(after);
        if (!beforeOk || !afterOk) continue;
      } else {
        // 한글/혼합도 앞뒤가 문자/숫자에 붙어있으면 제외(오탐 최소)
        const before = hay[idx - 1];
        const after = hay[idx + alias.length];
        const beforeOk = before == null || !/[0-9A-Za-z\uAC00-\uD7A3]/.test(before);
        const afterOk = after == null || !/[0-9A-Za-z\uAC00-\uD7A3]/.test(after);
        if (!beforeOk || !afterOk) continue;
      }

      const candidate = { termId: m.termId, matchText: hay.slice(idx, idx + alias.length), index: idx };
      if (!best) {
        best = candidate;
        continue;
      }
      if (candidate.index < best.index) {
        best = candidate;
        continue;
      }
      if (candidate.index === best.index && candidate.matchText.length > best.matchText.length) {
        best = candidate;
      }
    }

    return best;
  };

  const autoWrapGlossaryTerms = (root: HTMLElement) => {
    if (!root) return;
    if (matchers.length === 0) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!(node instanceof Text)) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (shouldSkipAutoWrap(parent)) return NodeFilter.FILTER_REJECT;
        const t = node.nodeValue || "";
        if (!t.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let cur: Node | null = walker.nextNode();
    while (cur) {
      if (cur instanceof Text) textNodes.push(cur);
      cur = walker.nextNode();
    }

    for (const node of textNodes) {
      const original = node.nodeValue || "";
      let remaining = original;
      let guard = 0;
      let didWrap = false;
      const frag = document.createDocumentFragment();

      while (remaining && guard < 50) {
        guard++;
        const found = findNextMatch(remaining);
        if (!found) break;
        if (found.index > 0) {
          frag.appendChild(document.createTextNode(remaining.slice(0, found.index)));
        }
        const span = document.createElement("span");
        span.className = "glossary-term";
        span.dataset.term = found.termId;
        span.tabIndex = 0;
        span.textContent = found.matchText;
        frag.appendChild(span);
        didWrap = true;
        remaining = remaining.slice(found.index + found.matchText.length);
      }

      if (remaining) {
        frag.appendChild(document.createTextNode(remaining));
      }

      if (didWrap) {
        node.parentNode?.replaceChild(frag, node);
      }
    }
  };

  // Auto-wrap once per post (by slug) after global glossary is available.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const key = postSlug || "__no_slug__";
    if (lastAutoAppliedSlugRef.current === key) return;
    if (matchers.length === 0) return;
    autoWrapGlossaryTerms(root);
    lastAutoAppliedSlugRef.current = key;
  }, [matchers, postSlug, rootRef]);

  // Event delegation on the rendered HTML container.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleMouseOver = (e: MouseEvent) => {
      if (isMobile) return;
      const termEl = getTermElementFromEventTarget(e.target);
      if (!termEl) return;
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = window.setTimeout(() => openFor(termEl), 200);
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (isMobile) return;
      const termEl = getTermElementFromEventTarget(e.target);
      if (!termEl) return;
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      close();
    };

    const handleFocusIn = (e: FocusEvent) => {
      const termEl = getTermElementFromEventTarget(e.target);
      if (!termEl) return;
      openFor(termEl);
    };

    const handleFocusOut = () => {
      if (isMobile) return;
      close();
    };

    const handleClick = (e: MouseEvent) => {
      const termEl = getTermElementFromEventTarget(e.target);
      if (!termEl) return;
      e.preventDefault();
      openFor(termEl);
    };

    root.addEventListener("mouseover", handleMouseOver);
    root.addEventListener("mouseout", handleMouseOut);
    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("focusout", handleFocusOut);
    root.addEventListener("click", handleClick);
    return () => {
      root.removeEventListener("mouseover", handleMouseOver);
      root.removeEventListener("mouseout", handleMouseOut);
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("focusout", handleFocusOut);
      root.removeEventListener("click", handleClick);
    };
  }, [dict, isMobile, rootRef]);

  // Reposition on scroll/resize while open.
  useEffect(() => {
    if (!open) return;
    const onRecalc = () => setPos(computePanelPosition(open.anchorRect));
    window.addEventListener("scroll", onRecalc, { passive: true });
    window.addEventListener("resize", onRecalc);
    return () => {
      window.removeEventListener("scroll", onRecalc);
      window.removeEventListener("resize", onRecalc);
    };
  }, [open]);

  // Dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current;
      const termEl = getTermElementFromEventTarget(e.target);
      if (termEl) return;
      if (isEventTargetInElement(e.target, panelRef.current)) return;
      if (isEventTargetInElement(e.target, root)) {
        // Click inside content but not on a term should close on mobile.
        if (isMobile) close();
        return;
      }
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobile, open, rootRef]);

  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={panelRef}
      role={isMobile ? "dialog" : "tooltip"}
      aria-label="용어 설명"
      className="fixed z-50 w-72 rounded-md border bg-popover p-4 text-sm text-popover-foreground shadow-md"
      style={{
        left: pos.left,
        top: pos.top,
        transform: pos.side === "top" ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground mb-1">{open.termId}</div>
          <div className="leading-relaxed break-words">{open.text}</div>
          {related.length > 0 ? (
            <div className="mt-3 pt-3 border-t border-border/60">
              <div className="text-xs text-muted-foreground mb-2">관련 글</div>
              <ul className="space-y-1">
                {related.map((p) => (
                  <li key={p.slug} className="min-w-0">
                    <a
                      href={`/post/${p.slug}`}
                      className="glossary-related-link block truncate"
                      title={p.title}
                    >
                      {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {isMobile ? (
          <button
            type="button"
            className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={close}
          >
            닫기
          </button>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

