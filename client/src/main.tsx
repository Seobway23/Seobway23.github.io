import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme on app start
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const theme = savedTheme || systemTheme;
  
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

// Initialize custom background
const initializeBackground = () => {
  const savedGradient = localStorage.getItem('custom-gradient');
  if (savedGradient) {
    document.documentElement.style.setProperty('--custom-gradient', savedGradient);
  }
};

initializeTheme();
initializeBackground();

createRoot(document.getElementById("root")!).render(<App />);
