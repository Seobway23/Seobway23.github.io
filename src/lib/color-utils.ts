/**
 * 색상 밝기를 계산하는 함수
 * @param hex - #RRGGBB 형식의 색상 코드
 * @returns 0-255 사이의 밝기 값 (0이 가장 어둡고, 255가 가장 밝음)
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 128; // 기본값

  // 상대적 밝기 계산 (WCAG 표준)
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * HEX 색상을 RGB로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 색상이 밝은지 어두운지 판단
 * @param hex - #RRGGBB 형식의 색상 코드
 * @returns true면 밝은 색상, false면 어두운 색상
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5;
}

/**
 * 배경 색상에 맞는 텍스트 색상 반환
 * @param hex - #RRGGBB 형식의 배경 색상 코드
 * @returns 어두운 배경이면 '#FFFFFF', 밝은 배경이면 '#000000'
 */
export function getContrastTextColor(hex: string): string {
  return isLightColor(hex) ? "#000000" : "#FFFFFF";
}

/**
 * 그라디언트의 평균 밝기를 계산
 * @param startHex - 시작 색상
 * @param endHex - 끝 색상
 * @returns 평균 밝기
 */
export function getAverageLuminance(startHex: string, endHex: string): number {
  const startLum = getLuminance(startHex);
  const endLum = getLuminance(endHex);
  return (startLum + endLum) / 2;
}

/**
 * 그라디언트에 맞는 텍스트 색상 반환
 * @param startHex - 시작 색상
 * @param endHex - 끝 색상
 * @returns 어두운 그라디언트면 '#FFFFFF', 밝은 그라디언트면 '#000000'
 */
export function getGradientTextColor(
  startHex: string,
  endHex: string
): string {
  const avgLum = getAverageLuminance(startHex, endHex);
  return avgLum > 0.5 ? "#000000" : "#FFFFFF";
}

/**
 * 색상을 밝게 만드는 함수 (다크모드용)
 * @param hex - #RRGGBB 형식의 색상 코드
 * @param amount - 밝게 만들 정도 (0-1)
 * @returns 밝아진 색상
 */
export function lightenColor(hex: string, amount: number = 0.3): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

