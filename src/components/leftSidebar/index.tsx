import React from 'react';
import { Link } from 'react-router-dom';
import './LeftSidebar.scss';

const categories = [
  { name: '전체', icon: '🌐' , path: '/all' },
  { name: '프론트엔드', icon: '💻' , path: '/frontend' },
  { name: '백엔드', icon: '⚙️' , path: '/backend' },
  { name: '모바일', icon: '📱' , path: '/mobile' },
  { name: 'DevOps', icon: '🛠' , path: '/devops' },
  { name: '인공지능', icon: '🤖' , path: '/ai' },
  { name: '데이터 사이언스', icon: '📊' , path: '/data-science' },
  { name: '보안', icon: '🔒' , path: '/security' },
  { name: '블록체인', icon: '⛓' , path: '/blockchain' },
  { name: '게임 개발', icon: '🎮' , path: '/game-dev' },
];

const LeftSidebar: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 뉴스레터 구독 로직 구현
  };

  return (
    <aside className="left-sidebar">
      <div className="categories">
        <h2>카테고리</h2>
        <nav>
          {categories.map((category) => (
            <Link
              key={category.path}
              to={category.path}
              className="category-item"
            >
              {category.icon}
              <span className="name">{category.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="newsletter-box">
        <h3>비즈니스 영역</h3>
        <p>최신 소식과 업데이트를 받아보세요</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            required
          />
          <button type="submit">구독하기</button>
        </form>
      </div>
    </aside>
  );
};

export default LeftSidebar; 