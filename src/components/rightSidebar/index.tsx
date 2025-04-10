import React from 'react';
import './RightSidebar.scss';

const RightSidebar: React.FC = () => {
  return (
    <aside className="right-sidebar">
      <section className="trending">
        <h2>실시간 클릭 급상승</h2>
        <ul>
          {[1, 2, 3, 4, 5].map((num) => (
            <li key={num} className="trending-item">
              <span className="number">{num}</span>
              <span className="title">인기 있는 뉴스 제목 {num}</span>
              <span className="change up">▲ 5</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="recent-projects">
        <h2>최근 프로젝트</h2>
        <div className="project-list">
          {[1, 2, 3].map((num) => (
            <div key={num} className="project-card">
              <div className="project-image">
                <img src={`/project-${num}.jpg`} alt={`Project ${num}`} />
              </div>
              <div className="project-info">
                <h3>프로젝트 제목 {num}</h3>
                <p>프로젝트 간단 설명이 들어갑니다.</p>
                <div className="project-meta">
                  <span className="date">2024.03.{num}</span>
                  <span className="views">조회수 1.2k</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

export default RightSidebar; 