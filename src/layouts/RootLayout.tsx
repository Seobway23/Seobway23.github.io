import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <div className="min-h-screen">
      <header className="bg-gray-800 text-white p-4">
        <nav>
          {/* 네비게이션 메뉴는 여기에 추가 */}
        </nav>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <p className="text-center">© 2024 My GitHub Blog</p>
      </footer>
    </div>
  );
};

export default RootLayout; 