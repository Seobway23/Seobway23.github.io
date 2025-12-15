import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getGradientTextColor, lightenColor } from "@/lib/color-utils";

interface BackgroundCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const presetGradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
];

export default function BackgroundCustomizer({
  open,
  onOpenChange,
}: BackgroundCustomizerProps) {
  const [startColor, setStartColor] = useState("#667eea");
  const [endColor, setEndColor] = useState("#764ba2");

  useEffect(() => {
    const savedGradient = localStorage.getItem("custom-gradient");
    if (savedGradient) {
      // Try to extract colors from saved gradient (simple regex)
      const colorMatches = savedGradient.match(/#[0-9a-fA-F]{6}/g);
      if (colorMatches && colorMatches.length >= 2) {
        setStartColor(colorMatches[0]);
        setEndColor(colorMatches[1]);
        // 저장된 그라디언트의 색상도 CSS 변수로 설정
        const startColor = colorMatches[0];
        const endColor = colorMatches[1];
        
        document.documentElement.style.setProperty(
          "--gradient-start",
          startColor
        );
        document.documentElement.style.setProperty("--gradient-end", endColor);
        
        // 텍스트 색상 자동 계산
        const textColor = getGradientTextColor(startColor, endColor);
        document.documentElement.style.setProperty(
          "--gradient-text",
          textColor
        );
        
        // 다크모드용 밝은 색상 생성
        const startDark = lightenColor(startColor, 0.3);
        const endDark = lightenColor(endColor, 0.3);
        document.documentElement.style.setProperty(
          "--gradient-start-dark",
          startDark
        );
        document.documentElement.style.setProperty(
          "--gradient-end-dark",
          endDark
        );
        
        const textColorDark = getGradientTextColor(startDark, endDark);
        document.documentElement.style.setProperty(
          "--gradient-text-dark",
          textColorDark
        );
      }
    } else {
      // 기본값 설정
      const defaultStart = "#667eea";
      const defaultEnd = "#764ba2";
      
      document.documentElement.style.setProperty(
        "--gradient-start",
        defaultStart
      );
      document.documentElement.style.setProperty("--gradient-end", defaultEnd);
      
      const textColor = getGradientTextColor(defaultStart, defaultEnd);
      document.documentElement.style.setProperty("--gradient-text", textColor);
      
      const startDark = lightenColor(defaultStart, 0.3);
      const endDark = lightenColor(defaultEnd, 0.3);
      document.documentElement.style.setProperty(
        "--gradient-start-dark",
        startDark
      );
      document.documentElement.style.setProperty(
        "--gradient-end-dark",
        endDark
      );
      
      const textColorDark = getGradientTextColor(startDark, endDark);
      document.documentElement.style.setProperty(
        "--gradient-text-dark",
        textColorDark
      );
    }
  }, []);

  const applyGradient = (gradient: string) => {
    document.documentElement.style.setProperty("--custom-gradient", gradient);
    localStorage.setItem("custom-gradient", gradient);

    // 그라디언트에서 색상 추출하여 CSS 변수로 저장
    const colorMatches = gradient.match(/#[0-9a-fA-F]{6}/g);
    if (colorMatches && colorMatches.length >= 2) {
      const startColor = colorMatches[0];
      const endColor = colorMatches[1];
      
      document.documentElement.style.setProperty(
        "--gradient-start",
        startColor
      );
      document.documentElement.style.setProperty("--gradient-end", endColor);
      
      // 텍스트 색상 자동 계산
      const textColor = getGradientTextColor(startColor, endColor);
      document.documentElement.style.setProperty("--gradient-text", textColor);
      
      // 다크모드용 밝은 색상 생성
      const startDark = lightenColor(startColor, 0.3);
      const endDark = lightenColor(endColor, 0.3);
      document.documentElement.style.setProperty(
        "--gradient-start-dark",
        startDark
      );
      document.documentElement.style.setProperty(
        "--gradient-end-dark",
        endDark
      );
      
      const textColorDark = getGradientTextColor(startDark, endDark);
      document.documentElement.style.setProperty(
        "--gradient-text-dark",
        textColorDark
      );
    }
  };

  const applyCustomGradient = () => {
    const gradient = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;
    applyGradient(gradient);
    onOpenChange(false);
  };

  const resetBackground = () => {
    const defaultGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    applyGradient(defaultGradient);
    localStorage.removeItem("custom-gradient");
    setStartColor("#667eea");
    setEndColor("#764ba2");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-1rem)] sm:w-full mx-2 sm:mx-auto max-h-[95vh] sm:max-h-[90vh]">
        <DialogHeader className="mb-2 sm:mb-4">
          <DialogTitle className="text-base sm:text-lg md:text-xl">
            배경 커스터마이징
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Preset Gradients */}
          <div>
            <Label className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 block">
              프리셋 그라데이션
            </Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {presetGradients.map((gradient, index) => (
                <button
                  key={index}
                  onClick={() => {
                    applyGradient(gradient);
                    onOpenChange(false);
                  }}
                  className="w-full h-12 sm:h-14 md:h-16 rounded-lg border-2 border-transparent hover:border-gray-400 dark:hover:border-gray-500 active:scale-95 transition-all touch-manipulation"
                  style={{ background: gradient }}
                  title={`그라데이션 ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label
                htmlFor="start-color"
                className="text-xs sm:text-sm font-medium mb-2 block"
              >
                시작 색상
              </Label>
              <label
                htmlFor="start-color"
                className="block w-full h-12 sm:h-14 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer overflow-hidden touch-manipulation active:scale-95 transition-transform"
                style={{ background: startColor }}
              >
              <input
                id="start-color"
                type="color"
                value={startColor}
                onChange={(e) => setStartColor(e.target.value)}
                  className="w-full h-full opacity-0 cursor-pointer"
              />
              </label>
            </div>

            <div>
              <Label
                htmlFor="end-color"
                className="text-xs sm:text-sm font-medium mb-2 block"
              >
                끝 색상
              </Label>
              <label
                htmlFor="end-color"
                className="block w-full h-12 sm:h-14 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer overflow-hidden touch-manipulation active:scale-95 transition-transform"
                style={{ background: endColor }}
              >
              <input
                id="end-color"
                type="color"
                value={endColor}
                onChange={(e) => setEndColor(e.target.value)}
                  className="w-full h-full opacity-0 cursor-pointer"
              />
              </label>
            </div>

            {/* Preview */}
            <div>
              <Label className="text-xs sm:text-sm font-medium mb-2 block">
                미리보기
              </Label>
              <div
                className="w-full h-12 sm:h-14 rounded-lg border-2 border-gray-300 dark:border-gray-600"
                style={{
                  background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              onClick={applyCustomGradient}
              className="flex-1 toss-button text-sm sm:text-base h-11 sm:h-10 touch-manipulation"
            >
              적용
            </Button>
            <Button
              onClick={resetBackground}
              variant="outline"
              className="flex-1 text-sm sm:text-base h-11 sm:h-10 touch-manipulation"
            >
              기본값으로 리셋
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
