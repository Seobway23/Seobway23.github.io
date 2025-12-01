import { useState } from "react";
import { Mail, Github, Linkedin, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "모든 필드를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "메시지가 전송되었습니다",
        description: "빠른 시일 내에 답변드리겠습니다. 감사합니다!",
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">연락하기</h1>
        <p className="text-xl  max-w-2xl mx-auto">
          궁금한 점이 있으시거나 협업을 원하신다면 언제든 연락해주세요. 새로운
          기회와 도전을 기다리고 있습니다.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Profile & Contact Info */}
        <div className="space-y-8">
          <Card className="toss-card">
            <CardContent className="p-8 text-center">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"
                alt="Professional developer headshot for contact page"
                className="w-32 h-32 rounded-full object-cover mx-auto mb-6 shadow-lg"
              />

              <h2 className="text-2xl font-bold mb-2">김개발자</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Frontend Developer
              </p>

              <p className="leading-relaxed">
                5년차 프론트엔드 개발자로 React, TypeScript, Next.js 등의 기술을
                주로 다룹니다. 웹 성능 최적화와 사용자 경험 개선에 관심이
                많으며, 새로운 기술을 학습하고 공유하는 것을 좋아합니다.
              </p>
            </CardContent>
          </Card>

          <Card className="toss-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>연락처</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href="mailto:developer@example.com"
                className="flex items-center space-x-3 p-3 rounded-lg hover-gradient-bg transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-end), var(--gradient-start))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))";
                  }}
                >
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">이메일</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    developer@example.com
                  </p>
                </div>
              </a>

              <a
                href="https://github.com/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg hover-gradient-bg transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-end), var(--gradient-start))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))";
                  }}
                >
                  <Github className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">GitHub</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    github.com/developer
                  </p>
                </div>
              </a>

              <a
                href="https://linkedin.com/in/developer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 rounded-lg hover-gradient-bg transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-end), var(--gradient-start))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))";
                  }}
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">LinkedIn</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    linkedin.com/in/developer
                  </p>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="toss-card">
            <CardHeader>
              <CardTitle>주요 기술 스택</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "React",
                  "TypeScript",
                  "Next.js",
                  "Tailwind CSS",
                  "Node.js",
                  "PostgreSQL",
                  "Docker",
                  "AWS",
                ].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-300/30 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div>
          <Card className="toss-card">
            <CardHeader>
              <CardTitle>메시지 보내기</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium mb-2"
                    >
                      이름 *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-2"
                    >
                      이메일 *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium mb-2"
                  >
                    제목 *
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="제목을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium mb-2"
                  >
                    메시지 *
                  </label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full toss-button"
                >
                  {isSubmitting ? "전송 중..." : "메시지 보내기"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="toss-card mt-8">
            <CardHeader>
              <CardTitle>자주 묻는 질문</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">
                  프로젝트 협업이 가능한가요?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  네, 흥미로운 프로젝트라면 언제든 협업하고 싶습니다. 프로젝트
                  규모와 일정을 알려주시면 검토 후 답변드리겠습니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">기술 상담이 가능한가요?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  React, TypeScript, 웹 성능 최적화 등의 분야에서 간단한 기술
                  상담은 가능합니다.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">답변은 얼마나 걸리나요?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  보통 1-2일 내에 답변드리려고 노력하고 있습니다. 급한 사항의
                  경우 제목에 [긴급]을 표시해주세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
