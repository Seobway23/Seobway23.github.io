export type ProjectStatus = "live" | "wip" | "idea";

export interface Project {
  /** GA 이벤트 라벨로도 사용 */
  id: string;
  name: string;
  /** 카드 한 줄 요약 */
  tagline: string;
  description: string;
  status: ProjectStatus;
  tags: string[];
  /** 실제 서비스 주소 (없으면 CTA 비활성) */
  liveUrl?: string;
  repoUrl?: string;
  /** public/ 기준 상대 경로. 없으면 그라디언트 폴백 */
  thumbnail?: string;
  highlights: string[];
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  live: "서비스 중",
  wip: "개발 중",
  idea: "구상 중",
};

export const projects: Project[] = [
  {
    id: "info-cert",
    name: "정보처리기사 실기 문제은행",
    tagline: "기출 380문제와 모의고사 24회차를 브라우저에서 바로 풀고 자동 채점",
    description:
      "2020~2026년 정보처리기사 실기 기출 380문제를 7개 카테고리로 정리하고 상세 해설을 붙였습니다. 기출을 재구성한 모의고사 19회차와 새로 만든 예상문제 5회차를 더해 총 24회차를 풀 수 있습니다. 설치도 서버도 필요 없이 브라우저에서 바로 동작합니다.",
    status: "live",
    tags: ["Vanilla JS", "Single HTML", "LocalStorage", "Canvas"],
    liveUrl: "https://seobway23.github.io/info_cert/",
    repoUrl: "https://github.com/Seobway23/info_cert",
    highlights: [
      "24회차 · 회차당 20문항 · 150분 타이머 자동 진행",
      "자동 채점으로 1차 판별 후 애매한 답만 직접 판정",
      "회차별 점수 추이 · 카테고리별 정답률 · 오답 노트",
    ],
  },
];
