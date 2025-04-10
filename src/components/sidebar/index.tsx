import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.scss';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/byte-logo.png" alt="Byte" />
      </div>
      
      <nav className="category">
        <h2>Category</h2>
        <ul>
          <li>
            <Link to="/daily-byte" className="menu-item">
              <span className="icon">🍊</span>
              <span>Daily Byte</span>
              <span className="status active"></span>
            </Link>
          </li>
          <li>
            <Link to="/byte-plus" className="menu-item">
              <span className="icon">🥝</span>
              <span>Byte+</span>
              <span className="status green"></span>
            </Link>
          </li>
          <li>
            <Link to="/curation" className="menu-item">
              <span className="icon">🍿</span>
              <span>Curation</span>
            </Link>
          </li>
          <li>
            <Link to="/shop" className="menu-item">
              <span className="icon">🛍️</span>
              <span>Shop</span>
            </Link>
          </li>
          <li>
            <Link to="/about" className="menu-item">
              <span className="icon">✏️</span>
              <span>About Byte</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="newsletter-box">
        <div className="icon">📬</div>
        <h3>내 뉴스레터 어디갔지?</h3>
        <p>요즘 메일함에서 뉴스레터가 잘 보이지 않나요?</p>
        <button className="check-button">
          깨끗하게 뉴스레터 받는 법 👉
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 