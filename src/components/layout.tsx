import { createContext, useContext, useState } from "react";
import { useLocation } from "wouter";
import Header from "./header";
import ProgressBar from "./progress-bar";
import LeftSidebar from "./left-sidebar";

interface LayoutContextType {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within Layout");
  }
  return context;
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <LayoutContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      <div className="min-h-screen">
        <ProgressBar />
        <Header />
        {location !== "/" && (
          <LeftSidebar
            mobileOpen={mobileMenuOpen}
            onMobileOpenChange={setMobileMenuOpen}
            onCategoryChange={() => setMobileMenuOpen(false)}
            showDesktop={false}
          />
        )}
        <main>{children}</main>
      </div>
    </LayoutContext.Provider>
  );
}
