/**
 * 게시글 데이터를 JSON 파일로 생성하는 스크립트
 * 빌드 시점에 posts 데이터를 읽어서 public/posts-data.json으로 저장
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

/**
 * 게시글 데이터 생성
 * 실제로는 posts.ts에서 데이터를 가져와야 하지만,
 * TypeScript 파일을 직접 읽는 것은 복잡하므로
 * 빌드 시점에 posts 데이터를 JSON으로 export하는 것을 권장
 */
function generatePostsData() {
  // 기본 게시글 데이터 구조
  // 실제로는 src/lib/posts.ts에서 데이터를 가져와야 함
  const posts = [
    // 예시 데이터
  ];

  const postsDataPath = path.join(publicDir, 'posts-data.json');
  fs.writeFileSync(postsDataPath, JSON.stringify(posts, null, 2), 'utf-8');
  
  console.log(`게시글 데이터를 ${postsDataPath}에 저장했습니다.`);
}

generatePostsData();

