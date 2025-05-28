import { useState, useEffect } from 'react';

export function useReadingProgress(contentSelector = '#post-content') {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const contentElement = document.querySelector(contentSelector);
      if (!contentElement) return;

      // Get the content bounds
      const contentRect = contentElement.getBoundingClientRect();
      const contentTop = contentElement.offsetTop;
      const contentHeight = contentElement.offsetHeight;
      
      // Current scroll position
      const scrollTop = window.pageYOffset;
      const windowHeight = window.innerHeight;
      
      // Calculate when content starts being visible and when it's fully read
      const contentStart = contentTop - windowHeight * 0.1; // Start when 10% into viewport
      const contentEnd = contentTop + contentHeight - windowHeight * 0.9; // End when 90% through content
      
      // Calculate progress within the content area
      const contentScrolled = scrollTop - contentStart;
      const totalContentToScroll = contentEnd - contentStart;
      
      const scrollPercent = totalContentToScroll > 0 ? (contentScrolled / totalContentToScroll) * 100 : 0;
      setProgress(Math.min(Math.max(scrollPercent, 0), 100));
    };

    const throttledUpdateProgress = throttle(updateProgress, 16); // ~60fps

    window.addEventListener('scroll', throttledUpdateProgress);
    window.addEventListener('resize', throttledUpdateProgress);
    updateProgress(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', throttledUpdateProgress);
      window.removeEventListener('resize', throttledUpdateProgress);
    };
  }, [contentSelector]);

  return progress;
}

// Throttle function to limit how often the progress updates
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}
