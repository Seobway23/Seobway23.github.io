import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">About</h3>
            <p className="text-gray-300">
              개발자 이정섭의 포트폴리오 및 블로그입니다.
              웹 개발과 관련된 다양한 이야기를 공유합니다.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white">홈</Link>
              </li>
              <li>
                <Link to="/projects" className="text-gray-300 hover:text-white">프로젝트</Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white">블로그</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white">연락하기</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: ljs8881234@gmail.com</li>
              <li>GitHub: @Seobway23</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300">
          <p>&copy; {new Date().getFullYear()} 이정섭. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 