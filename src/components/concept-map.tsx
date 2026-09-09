import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Check, Lock, PenLine } from "lucide-react";
import {
  getConceptGraph,
  getReadSet,
  setRead,
  isLocked,
  domainColor,
  type ConceptGraph,
  type ConceptNode,
} from "@/lib/concept-graph";

/**
 * 개념 지도 — 레벨(위=기초, 아래=응용)로 노드를 쌓고 선행 관계를 곡선으로 잇는다.
 *
 * 배치는 CSS 가 하고, 연결선은 그려진 뒤 실제 좌표를 재서 SVG 베지어로 얹는다.
 * 좌표를 손으로 계산하지 않으므로 화면 폭이 바뀌어도 선이 노드를 정확히 따라간다.
 *
 * mermaid 를 쓰지 않는 이유: mermaid 는 문법에서 그림을 만드는 도구라
 * 노드마다 상태(읽음·잠김·미작성)를 입히고 클릭을 받는 데는 맞지 않는다.
 * 여기서는 데이터(concept-graph.json)가 먼저고 그림이 그 결과다.
 *
 * `/roadmap`(전체)과 카테고리 뷰의 "로드맵" 탭이 이 컴포넌트를 함께 쓴다.
 */

interface Edge {
  from: string;
  to: string;
  d: string;
  dim: boolean;
}

interface ConceptMapProps {
  /** 이 카테고리 접두사에 속한 개념만 그린다 (예: "frontend"). 없으면 전체 */
  categoryPrefix?: string;
  /** 트랙 필터 칩을 보여줄지 */
  showTrackFilter?: boolean;
  /** 진도 막대를 보여줄지 */
  showProgress?: boolean;
  /** 그릴 개념이 하나도 없을 때 대신 보여줄 내용 */
  emptyFallback?: React.ReactNode;
}

export default function ConceptMap({
  categoryPrefix,
  showTrackFilter = true,
  showProgress = true,
  emptyFallback,
}: ConceptMapProps) {
  const [, navigate] = useLocation();
  const [graph, setGraph] = useState<ConceptGraph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [read, setReadState] = useState<Set<string>>(() => new Set());
  const [hover, setHover] = useState<string | null>(null);
  const [trackFilter, setTrackFilter] = useState<string>("all");

  const stageRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [edges, setEdges] = useState<Edge[]>([]);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let cancelled = false;
    getConceptGraph()
      .then((g) => {
        if (!cancelled) setGraph(g);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "불러오지 못했다");
      });
    setReadState(getReadSet());
    const onChange = () => setReadState(getReadSet());
    window.addEventListener("concept-read-change", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("concept-read-change", onChange);
    };
  }, []);

  // 카테고리가 바뀌면 트랙 필터는 초기화한다(빈 화면이 되는 조합을 막는다)
  useEffect(() => setTrackFilter("all"), [categoryPrefix]);

  const nodeById = useMemo(() => {
    const m = new Map<string, ConceptNode>();
    graph?.nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [graph]);

  /** 카테고리 범위 안의 개념 */
  const inCategory = useMemo(() => {
    if (!graph) return [] as ConceptNode[];
    if (!categoryPrefix || categoryPrefix === "all") return graph.nodes;
    return graph.nodes.filter((n) =>
      (n.category || "").startsWith(categoryPrefix)
    );
  }, [graph, categoryPrefix]);

  /** 트랙 필터까지 통과한 개념 */
  const visible = useMemo(() => {
    const base =
      trackFilter === "all"
        ? inCategory
        : inCategory.filter((n) => n.track === trackFilter);
    return new Set(base.map((n) => n.id));
  }, [inCategory, trackFilter]);

  /** 이 범위 안에 실제로 존재하는 트랙만 칩으로 보여준다 */
  const tracksInScope = useMemo(() => {
    if (!graph) return [] as Array<[string, { label: string }]>;
    const ids = new Set(inCategory.map((n) => n.track).filter(Boolean));
    return Object.entries(graph.tracks).filter(([id]) => ids.has(id));
  }, [graph, inCategory]);

  const levels = useMemo(() => {
    if (!graph) return [] as string[][];
    return graph.levels
      .map((lv) => lv.filter((id) => visible.has(id)))
      .filter((lv) => lv.length > 0);
  }, [graph, visible]);

  /* 노드가 실제로 그려진 뒤 좌표를 재서 연결선을 만든다 */
  const measure = () => {
    const stage = stageRef.current;
    if (!stage || !graph) return;
    const box = stage.getBoundingClientRect();
    setStageSize({ w: box.width, h: box.height });

    const next: Edge[] = [];
    for (const node of graph.nodes) {
      if (!visible.has(node.id)) continue;
      const toEl = nodeRefs.current.get(node.id);
      if (!toEl) continue;
      const to = toEl.getBoundingClientRect();
      for (const p of node.prereq) {
        if (!visible.has(p)) continue;
        const fromEl = nodeRefs.current.get(p);
        if (!fromEl) continue;
        const from = fromEl.getBoundingClientRect();

        // 위 노드의 아래 모서리 → 아래 노드의 위 모서리
        const x1 = from.left + from.width / 2 - box.left;
        const y1 = from.bottom - box.top;
        const x2 = to.left + to.width / 2 - box.left;
        const y2 = to.top - box.top;
        const midY = (y1 + y2) / 2;

        next.push({
          from: p,
          to: node.id,
          d: `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`,
          dim: hover != null && hover !== p && hover !== node.id,
        });
      }
    }
    setEdges(next);
  };

  useLayoutEffect(measure, [graph, visible, levels, hover]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, visible]);

  if (error) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        지도를 불러오지 못했다: {error}
      </p>
    );
  }
  if (!graph) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        지도 불러오는 중…
      </p>
    );
  }
  if (inCategory.length === 0) {
    return (
      <>
        {emptyFallback ?? (
          <p className="py-12 text-center text-muted-foreground">
            이 카테고리에는 아직 개념 지도가 없다.
          </p>
        )}
      </>
    );
  }

  const writtenNodes = inCategory.filter((n) => n.written);
  const readCount = writtenNodes.filter((n) => read.has(n.id)).length;
  const progress =
    writtenNodes.length === 0
      ? 0
      : Math.round((readCount / writtenNodes.length) * 100);

  const relatedToHover = (id: string) => {
    if (!hover) return false;
    if (hover === id) return true;
    const h = nodeById.get(hover);
    return !!h && (h.prereq.includes(id) || h.next.includes(id));
  };

  return (
    <div>
      {showProgress && (
        <div className="mb-6 max-w-md">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium">
              읽음 {readCount} / {writtenNodes.length}
            </span>
            <span className="text-muted-foreground">
              개념 {inCategory.length}개 중 {writtenNodes.length}개 작성됨
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="progress-bar-gradient h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {showTrackFilter && tracksInScope.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip
            active={trackFilter === "all"}
            onClick={() => setTrackFilter("all")}
            label="전체"
            detail={`${inCategory.length}개`}
          />
          {tracksInScope.map(([id, t]) => {
            const inTrack = inCategory.filter((n) => n.track === id);
            return (
              <FilterChip
                key={id}
                active={trackFilter === id}
                onClick={() => setTrackFilter(id)}
                label={t.label}
                detail={`${inTrack.filter((n) => n.written).length}/${inTrack.length}`}
              />
            );
          })}
        </div>
      )}

      <div ref={stageRef} className="relative">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={stageSize.w}
          height={stageSize.h}
          aria-hidden
        >
          {edges.map((e) => (
            <path
              key={`${e.from}->${e.to}`}
              d={e.d}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              // 선이 이 화면의 핵심이다. 기본에서도 확실히 보여야 하고,
              // 특정 노드에 마우스를 올리면 그 노드의 선만 남아야 한다.
              strokeWidth={e.dim ? 1 : hover ? 2.5 : 1.75}
              className={`transition-all duration-200 ${
                e.dim
                  ? "text-muted-foreground/15"
                  : hover
                    ? "text-primary"
                    : "text-muted-foreground/45"
              }`}
            />
          ))}
        </svg>

        {/* 레벨 사이를 넉넉히 띄워야 곡선이 카드에 붙지 않고 흐름이 읽힌다 */}
        <div className="relative space-y-14">
          {levels.map((ids, i) => (
            <div key={i} className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  LV{i}
                </span>
                <span className="text-xs text-muted-foreground">
                  {i === 0 ? "선행 없이 바로 읽을 수 있다" : `선행 ${i}단계를 거친다`}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="relative z-10 flex flex-wrap justify-center gap-x-4 gap-y-8">
                {ids.map((id) => {
                  const node = nodeById.get(id)!;
                  return (
                    <ConceptCard
                      key={id}
                      node={node}
                      read={read.has(id)}
                      locked={isLocked(node, read)}
                      dimmed={!!hover && !relatedToHover(id)}
                      onHover={setHover}
                      onOpen={() => node.post && navigate(`/post/${node.post}`)}
                      onToggleRead={() => setReadState(setRead(id, !read.has(id)))}
                      registerRef={(el) => {
                        if (el) nodeRefs.current.set(id, el);
                        else nodeRefs.current.delete(id);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden /> 읽음
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" aria-hidden /> 선행을 아직 안 읽음
        </span>
        <span className="flex items-center gap-1.5">
          <PenLine className="h-3.5 w-3.5" aria-hidden /> 아직 글이 없음
        </span>
        <span>노드에 마우스를 올리면 그 개념의 선행·후행만 남는다.</span>
      </div>
    </div>
  );
}

/* ── 조각들 ────────────────────────────────────────────────── */

function FilterChip({
  active,
  onClick,
  label,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary/10 font-semibold text-foreground"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {label} <span className="ml-1 font-mono text-xs opacity-70">{detail}</span>
    </button>
  );
}

function ConceptCard({
  node,
  read,
  locked,
  dimmed,
  onHover,
  onOpen,
  onToggleRead,
  registerRef,
}: {
  node: ConceptNode;
  read: boolean;
  locked: boolean;
  dimmed: boolean;
  onHover: (id: string | null) => void;
  onOpen: () => void;
  onToggleRead: () => void;
  registerRef: (el: HTMLElement | null) => void;
}) {
  const color = domainColor(node.domain);
  const clickable = node.written;

  return (
    <div
      ref={registerRef}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={`relative w-[15.5rem] rounded-xl border bg-card p-3.5 shadow-sm transition-all duration-200 ${
        dimmed ? "opacity-25" : "opacity-100"
      } ${
        node.written
          ? "border-border hover:-translate-y-0.5 hover:shadow-md"
          : "border-dashed border-border/70"
      } ${locked && node.written ? "opacity-70" : ""}`}
      // 도메인 색은 상단 테두리로만. 아직 글이 없는 개념은 흐리게 해서
      // "쓴 것"과 "쓸 것"이 한눈에 갈리게 한다.
      style={{
        borderTopColor: node.written ? color : `${color}55`,
        borderTopWidth: 3,
      }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={clickable ? onOpen : undefined}
          disabled={!clickable}
          className={`min-w-0 text-left text-sm font-semibold leading-snug ${
            clickable ? "hover:text-primary" : "cursor-default text-muted-foreground"
          }`}
        >
          {node.label}
        </button>

        {node.written ? (
          <button
            type="button"
            onClick={onToggleRead}
            aria-pressed={read}
            aria-label={read ? "읽음 해제" : "읽음으로 표시"}
            title={read ? "읽음 해제" : "읽음으로 표시"}
            className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors ${
              read
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-border text-transparent hover:border-emerald-500"
            }`}
          >
            <Check className="h-3 w-3" aria-hidden />
          </button>
        ) : (
          <PenLine
            className="h-3.5 w-3.5 flex-none text-muted-foreground/60"
            aria-label="아직 글이 없음"
          />
        )}
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {node.summary}
      </p>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className="rounded px-1.5 py-0.5 font-mono"
          style={{ background: `${color}22`, color }}
        >
          {node.domain}
        </span>
        {node.written && node.readTime ? <span>{node.readTime}분</span> : null}
        {!node.written ? <span className="italic">미작성</span> : null}
        {locked && node.written ? (
          <span className="ml-auto flex items-center gap-1" title="선행을 아직 안 읽었다">
            <Lock className="h-3 w-3" aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}
