import { Route as RouteIcon } from "lucide-react";
import ConceptMap from "@/components/concept-map";

/**
 * 전체 학습 로드맵.
 * 지도 자체는 <ConceptMap /> 이 그린다 — 카테고리 뷰의 "로드맵" 탭과 같은 컴포넌트다.
 */
export default function Roadmap() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <RouteIcon className="h-4 w-4" aria-hidden />
          학습 로드맵
        </div>
        <h1 className="mb-3 text-3xl font-bold sm:text-4xl">
          아래에서 위로 쌓아 올리는 지도
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          위쪽이 기초, 아래로 갈수록 그 위에 쌓이는 개념이다. 선은 &ldquo;이걸 알아야
          저게 보인다&rdquo;는 뜻이다. 읽은 글을 체크하면 진도가 남는다.
        </p>
      </header>

      <ConceptMap />
    </div>
  );
}
