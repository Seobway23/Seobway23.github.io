import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

export default function BackgroundCustomizer({ open, onOpenChange }: BackgroundCustomizerProps) {
  const [startColor, setStartColor] = useState("#667eea");
  const [endColor, setEndColor] = useState("#764ba2");

  useEffect(() => {
    const savedGradient = localStorage.getItem('custom-gradient');
    if (savedGradient) {
      // Try to extract colors from saved gradient (simple regex)
      const colorMatches = savedGradient.match(/#[0-9a-fA-F]{6}/g);
      if (colorMatches && colorMatches.length >= 2) {
        setStartColor(colorMatches[0]);
        setEndColor(colorMatches[1]);
      }
    }
  }, []);

  const applyGradient = (gradient: string) => {
    document.documentElement.style.setProperty('--custom-gradient', gradient);
    localStorage.setItem('custom-gradient', gradient);
  };

  const applyCustomGradient = () => {
    const gradient = `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;
    applyGradient(gradient);
    onOpenChange(false);
  };

  const resetBackground = () => {
    const defaultGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    applyGradient(defaultGradient);
    localStorage.removeItem('custom-gradient');
    setStartColor("#667eea");
    setEndColor("#764ba2");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>배경 커스터마이징</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preset Gradients */}
          <div>
            <Label className="text-sm font-medium mb-3 block">프리셋 그라데이션</Label>
            <div className="grid grid-cols-3 gap-3">
              {presetGradients.map((gradient, index) => (
                <button
                  key={index}
                  onClick={() => applyGradient(gradient)}
                  className="w-full h-12 rounded-lg border-2 border-transparent hover:border-blue-500 transition-all"
                  style={{ background: gradient }}
                  title={`그라데이션 ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="start-color" className="text-sm font-medium mb-2 block">
                시작 색상
              </Label>
              <input
                id="start-color"
                type="color"
                value={startColor}
                onChange={(e) => setStartColor(e.target.value)}
                className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
            
            <div>
              <Label htmlFor="end-color" className="text-sm font-medium mb-2 block">
                끝 색상
              </Label>
              <input
                id="end-color"
                type="color"
                value={endColor}
                onChange={(e) => setEndColor(e.target.value)}
                className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>

            {/* Preview */}
            <div>
              <Label className="text-sm font-medium mb-2 block">미리보기</Label>
              <div
                className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600"
                style={{ background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button onClick={applyCustomGradient} className="flex-1 toss-button">
              적용
            </Button>
            <Button onClick={resetBackground} variant="outline" className="flex-1">
              기본값으로 리셋
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
