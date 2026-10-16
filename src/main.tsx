import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme on app start
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const theme = savedTheme || "dark";

  document.documentElement.classList.toggle("dark", theme === "dark");
};

// Initialize custom background
const initializeBackground = async () => {
  const { getGradientTextColor, lightenColor } = await import("./lib/color-utils");
  
  const savedGradient = localStorage.getItem("custom-gradient");
  if (savedGradient) {
    document.documentElement.style.setProperty(
      "--custom-gradient",
      savedGradient
    );
    // 그라디언트에서 색상 추출하여 CSS 변수로 저장
    const colorMatches = savedGradient.match(/#[0-9a-fA-F]{6}/g);
    if (colorMatches && colorMatches.length >= 2) {
      const startColor = colorMatches[0];
      const endColor = colorMatches[1];
      
      document.documentElement.style.setProperty("--gradient-start", startColor);
      document.documentElement.style.setProperty("--gradient-end", endColor);
      
      // 텍스트 색상 자동 계산
      const textColor = getGradientTextColor(startColor, endColor);
      document.documentElement.style.setProperty("--gradient-text", textColor);
      
      // 다크모드용 밝은 색상 생성
      const startDark = lightenColor(startColor, 0.3);
      const endDark = lightenColor(endColor, 0.3);
      document.documentElement.style.setProperty("--gradient-start-dark", startDark);
      document.documentElement.style.setProperty("--gradient-end-dark", endDark);
      
      const textColorDark = getGradientTextColor(startDark, endDark);
      document.documentElement.style.setProperty("--gradient-text-dark", textColorDark);
    }
  } else {
    // 기본값 설정
    const defaultStart = "#667eea";
    const defaultEnd = "#764ba2";
    
    document.documentElement.style.setProperty("--gradient-start", defaultStart);
    document.documentElement.style.setProperty("--gradient-end", defaultEnd);
    
    const textColor = getGradientTextColor(defaultStart, defaultEnd);
    document.documentElement.style.setProperty("--gradient-text", textColor);
    
    const startDark = lightenColor(defaultStart, 0.3);
    const endDark = lightenColor(defaultEnd, 0.3);
    document.documentElement.style.setProperty("--gradient-start-dark", startDark);
    document.documentElement.style.setProperty("--gradient-end-dark", endDark);
    
    const textColorDark = getGradientTextColor(startDark, endDark);
    document.documentElement.style.setProperty("--gradient-text-dark", textColorDark);
  }
};

// 배포마다 해시가 바뀐 chunk 가 교체된다. 배포 전에 받아 둔 app.js 가 지운 chunk 를
// import 하면 404 가 나서 seq·playground 가 원문 그대로 남는다. 새 index.html 을 받도록
// 한 번만 새로고침한다(같은 경로에서 반복 새로고침은 막는다).
window.addEventListener("vite:preloadError", (event) => {
  const key = `chunk-reload:${location.pathname}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    return;
  }
  event.preventDefault();
  location.reload();
});

initializeTheme();
initializeBackground();

createRoot(document.getElementById("root")!).render(<App />);
