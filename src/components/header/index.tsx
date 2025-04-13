import React from 'react';
import { Link } from 'react-router-dom';
import './Header.scss';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">Seobway23</Link>
      </div>
      <nav className="nav-links">
        <Link to="/">홈</Link>
        <Link to="/about">소개</Link>
        <Link to="/projects">프로젝트</Link>
        <Link to="/contact">연락하기</Link>
      </nav>
    </header>
  );
};

export default Header; 