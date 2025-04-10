import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Oops!</h1>
        
        {isRouteErrorResponse(error) ? (
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              {error.status} {error.statusText}
            </h2>
            <p className="text-gray-600 mb-4">{error.data}</p>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
          </p>
        )}
        
        <Link 
          to="/" 
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage; 