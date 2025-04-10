import React from 'react';
import './MainContent.scss';

const MainContent: React.FC = () => {
  return (
    <main className="main-content">
      <div className="stock-ticker">
        <div className="ticker-item">
          <span className="label">코스피</span>
          <span className="value">2,445.06</span>
          <span className="change positive">+6.6%</span>
        </div>
        <div className="ticker-item">
          <span className="label">코스닥</span>
          <span className="value">681.79</span>
          <span className="change positive">+5.97%</span>
        </div>
        <div className="ticker-item">
          <span className="label">S&P 500</span>
          <span className="value">5,456.9</span>
          <span className="change positive">+9.52%</span>
        </div>
      </div>

      <article className="blog-post">
        <header className="post-header">
          <h1>네트워크의 기초: OSI 7계층 완벽 가이드</h1>
          <div className="post-meta">
            <span className="post-date">2025년 4월 10일</span>
            <span className="post-author">seobway</span>
            <span className="post-category">네트워크</span>
          </div>
        </header>
        
        <div className="post-content">
          <p>
            현대 네트워크 통신의 근간이 되는 OSI 7계층 모델에 대해 알아보겠습니다. 
            OSI 모델은 네트워크 통신이 일어나는 과정을 7단계로 나누어 설명하는 표준화된 방법입니다.
          </p>

          <h2>1. 물리 계층 (Physical Layer)</h2>
          <p>
            네트워크의 가장 기본이 되는 물리적인 연결을 담당합니다. 
            전기적, 기계적, 기능적인 특성을 이용해 데이터를 전송합니다. 
            케이블, 리피터, 허브 등이 이 계층에서 작동합니다.
          </p>

          <h2>2. 데이터 링크 계층 (Data Link Layer)</h2>
          <p>
            물리 계층을 통해 송수신되는 정보의 오류와 흐름을 관리합니다. 
            MAC 주소를 통해 통신합니다. 
            스위치, 브리지 등이 이 계층에서 작동합니다.
          </p>

          <h2>3. 네트워크 계층 (Network Layer)</h2>
          <p>
            데이터를 목적지까지 가장 안전하고 빠르게 전달하는 기능을 담당합니다. 
            라우터를 통해 이동할 경로를 선택하여 IP 주소를 지정하고, 
            해당 경로에 따라 패킷을 전달합니다.
          </p>

          <div className="code-block">
            <pre>
              <code>
                {`// 간단한 IP 주소 확인 예제 코드
const getIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    console.log('Your IP:', data.ip);
  } catch (error) {
    console.error('Error:', error);
  }
};`}
              </code>
            </pre>
          </div>

          <p className="continue-reading">
            이 글은 시리즈의 첫 번째 파트입니다. 
            다음 글에서는 전송 계층부터 응용 계층까지 자세히 다루도록 하겠습니다.
          </p>

          <div className="post-tags">
            <span className="tag">네트워크</span>
            <span className="tag">OSI 7계층</span>
            <span className="tag">IT 기초</span>
          </div>
        </div>
      </article>
    </main>
  );
};

export default MainContent; 