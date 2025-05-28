import Header from "./header";
import ProgressBar from "./progress-bar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      <ProgressBar />
      <Header />
      <main>{children}</main>
    </div>
  );
}
