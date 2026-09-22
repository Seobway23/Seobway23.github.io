import { useEffect, useState } from "react";

/**
 * 표지 이미지 — 우리가 만든 SVG 표지는 그림이 아니라 **화면의 일부**다.
 *
 * `<img src="...svg">` 로 넣으면 브라우저가 그 파일을 이미지로 취급한다. 안의
 * `@keyframes` 는 돌지만 `:hover` 는 영영 오지 않는다 — 이미지에는 마우스가 없다.
 * 그래서 로컬 SVG 표지만 문서 안으로 들여온다. 들어오는 순간 호버가 산다.
 *
 * 외부 URL(언스플래시 대체 이미지)과 서버 렌더 시점에는 그대로 `<img>` 다.
 * effect 가 돌기 전까지도 `<img>` 라서, 정적 HTML·OG 크롤러는 늘 이미지를 본다.
 */

/** 같은 표지를 여러 카드가 쓴다. 요청은 한 번만. */
const svgCache = new Map<string, Promise<string>>();

function loadSvg(src: string): Promise<string> {
  let pending = svgCache.get(src);
  if (!pending) {
    pending = fetch(src).then((res) => {
      if (!res.ok) throw new Error(`${res.status} ${src}`);
      return res.text();
    });
    svgCache.set(src, pending);
  }
  return pending;
}

/** 같은 출처의 우리 표지만 들여온다. 남의 문서를 문서에 붙이지 않는다. */
const isOwnSvg = (src: string) => src.startsWith("/") && src.endsWith(".svg");

interface CoverImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function CoverImage({ src, alt, className = "" }: CoverImageProps) {
  const [markup, setMarkup] = useState<string | null>(null);

  useEffect(() => {
    setMarkup(null);
    if (!isOwnSvg(src)) return;

    let alive = true;
    loadSvg(src)
      .then((text) => {
        // 진짜 SVG 인지만 확인한다 — 404 HTML 을 그대로 꽂으면 안 된다.
        if (alive && /^\s*(<\?xml[^>]*\?>\s*)?<svg[\s>]/i.test(text)) setMarkup(text);
      })
      .catch(() => {
        /* 실패하면 아래 <img> 가 그대로 남는다 */
      });

    return () => {
      alive = false;
    };
  }, [src]);

  if (markup) {
    return (
      <span
        role="img"
        aria-label={alt}
        // SVG 자체가 preserveAspectRatio="slice" 라 object-cover 와 같은 결과가 된다.
        className={`${className} block [&>svg]:block [&>svg]:h-full [&>svg]:w-full`}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
}
