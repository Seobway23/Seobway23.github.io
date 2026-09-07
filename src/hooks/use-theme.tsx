import { createContext, useContext, useEffect, useState } from "react";
import { applyCodeTheme, readStoredCodeThemeId } from "@/lib/code-theme";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);

    // 코드 색상 테마(사용자 선택)를 두 <link> 의 href 에 반영한 뒤,
    // 사이트 테마에 맞춰 둘 중 하나만 활성화한다.
    applyCodeTheme(readStoredCodeThemeId());

    // Switch syntax highlighting themes
    const lightSyntax = document.querySelector('.light-syntax') as HTMLLinkElement;
    const darkSyntax = document.querySelector('.dark-syntax') as HTMLLinkElement;

    if (lightSyntax && darkSyntax) {
      if (theme === 'dark') {
        lightSyntax.disabled = true;
        darkSyntax.disabled = false;
      } else {
        lightSyntax.disabled = false;
        darkSyntax.disabled = true;
      }
    }

    // PWA standalone 모드의 상태바·주소창 색을 현재 테마에 맞춘다
    const themeColor = document.querySelector(
      'meta[name="theme-color"]'
    ) as HTMLMetaElement | null;
    if (themeColor) {
      themeColor.content = theme === "dark" ? "#0f172a" : "#ffffff";
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    toggleTheme: () => {
      const newTheme = theme === "light" ? "dark" : "light";
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
