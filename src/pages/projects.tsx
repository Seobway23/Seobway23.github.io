import { ExternalLink, Github, Boxes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { publicUrl } from "@/lib/public-path";
import { projects, STATUS_LABEL, type Project } from "@/data/projects";

/** 배지 자체가 밝은 배경 + 어두운 글자라 테마와 무관하게 읽힌다 */
const STATUS_STYLE: Record<Project["status"], string> = {
  live: "bg-emerald-100 text-emerald-800",
  wip: "bg-amber-100 text-amber-800",
  idea: "bg-gray-200 text-gray-700",
};

function ProjectCard({ project }: { project: Project }) {
  const open = (target: "live" | "repo") =>
    trackEvent("click", "projects", `${project.id}:${target}`);

  return (
    <Card className="toss-card overflow-hidden flex flex-col w-full max-w-md">
      <div className="relative h-44 w-full">
        {project.thumbnail ? (
          <img
            src={publicUrl(project.thumbnail)}
            alt={`${project.name} 미리보기`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
            }}
          >
            <Boxes className="w-14 h-14 text-white/70" aria-hidden />
          </div>
        )}
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
            STATUS_STYLE[project.status]
          }`}
        >
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      <CardContent className="p-6 flex flex-col flex-1">
        <h2 className="text-xl font-bold mb-2">{project.name}</h2>
        {/* dark: 유틸리티가 이 저장소에서 동작하지 않아 상속 색 + opacity 로 위계를 만든다 */}
        <p className="text-sm opacity-75 mb-4 leading-relaxed">
          {project.tagline}
        </p>

        <ul className="space-y-2 mb-5">
          {project.highlights.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "var(--gradient-start)" }}
              />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium border"
              style={{
                borderColor: "var(--gradient-start)",
                color: "var(--gradient-start)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2">
          {project.liveUrl && (
            <Button asChild className="flex-1 toss-button">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => open("live")}
              >
                열어보기
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
          {project.repoUrl && (
            <Button asChild variant="outline" size="icon" className="w-10 h-10">
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} GitHub 저장소`}
                onClick={() => open("repo")}
              >
                <Github className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Projects() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">프로젝트</h1>
        <p className="text-xl max-w-2xl mx-auto">
          공부하다 불편했던 걸 직접 만들어 씁니다. 전부 브라우저에서 바로 열어볼
          수 있습니다.
        </p>
      </div>

      {/* flex-wrap: 카드 1개면 가운데, 2개면 나란히, 3개 이상이면 줄바꿈 */}
      <div className="flex flex-wrap justify-center gap-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
