import { useReadingProgress } from "../hooks/use-reading-progress";

export default function ProgressBar() {
  const progress = useReadingProgress();

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 z-50">
      <div
        className="h-full transition-all duration-150 ease-out progress-bar-gradient-horizontal"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}
