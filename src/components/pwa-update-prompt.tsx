import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

/**
 * 서비스워커 등록 + 새 버전 안내 배너.
 *
 * registerType 은 'prompt' 라 새 빌드가 올라와도 자동 새로고침하지 않는다.
 * 글을 읽는 중에 화면이 갈아엎이는 걸 막고, 사용자가 직접 누르게 한다.
 */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // 오래 켜둔 탭도 새 글을 받도록 1시간마다 갱신 확인
      if (!registration) return;
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-auto sm:right-4">
      <RefreshCw className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 text-sm">
        <p className="font-medium text-foreground">새 버전이 있습니다</p>
        <p className="text-muted-foreground">새로고침하면 최신 글이 반영됩니다.</p>
      </div>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        새로고침
      </button>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => setNeedRefresh(false)}
        className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
