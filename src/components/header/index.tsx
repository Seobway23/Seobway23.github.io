import React from 'react';
import './Header.scss';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <span className="material-icons">menu</span>
        </button>
        <div className="logo">
          <img src="/header-logo.png" alt="header-logo" />
        </div>
      </div>
      
      <div className="header-center">
        <div className="search-bar">
          <input type="text" placeholder="무엇이든 검색해보세요 👀" />
        </div>
      </div>

      <div className="header-right">
        <button className="login-button">버튼1</button>
        <button className="register-button">버튼2</button>
      </div>
    </header>
  );
};

export default Header; 