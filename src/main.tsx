import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme on app start
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const theme = savedTheme || systemTheme;

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

initializeTheme();
initializeBackground();

createRoot(document.getElementById("root")!).render(<App />);
