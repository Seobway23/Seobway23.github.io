const HomePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">환영합니다!</h1>
      <p className="text-lg text-gray-600 mb-4">
        이곳은 제 GitHub 블로그입니다. 개발 관련 글과 프로젝트를 공유하는 공간입니다.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* 블로그 포스트 목록은 여기에 추가될 예정 */}
      </div>
    </div>
  );
};

export default HomePage; 