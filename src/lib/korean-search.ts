/**
 * 한글 검색 최적화 유틸리티
 * 초성 검색, 자음/모음 분리, 받침 처리 등을 지원
 */

// 한글 유니코드 범위
const HANGUL_START = 0xac00; // '가'
const HANGUL_END = 0xd7a3; // '힣'
const INITIAL_CONSONANTS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const MEDIAL_VOWELS = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];
const FINAL_CONSONANTS = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

/**
 * 한글 문자를 초성, 중성, 종성으로 분해
 */
export function decomposeHangul(char: string): {
  initial: string;
  medial: string;
  final: string;
} | null {
  const code = char.charCodeAt(0);

  if (code < HANGUL_START || code > HANGUL_END) {
    return null;
  }

  const index = code - HANGUL_START;
  const initialIndex = Math.floor(index / 588);
  const medialIndex = Math.floor((index % 588) / 28);
  const finalIndex = index % 28;

  return {
    initial: INITIAL_CONSONANTS[initialIndex],
    medial: MEDIAL_VOWELS[medialIndex],
    final: FINAL_CONSONANTS[finalIndex],
  };
}

/**
 * 초성, 중성, 종성을 조합하여 한글 문자 생성
 */
export function composeHangul(
  initial: string,
  medial: string,
  final: string = ""
): string {
  const initialIndex = INITIAL_CONSONANTS.indexOf(initial);
  const medialIndex = MEDIAL_VOWELS.indexOf(medial);
  const finalIndex = FINAL_CONSONANTS.indexOf(final);

  if (initialIndex === -1 || medialIndex === -1) {
    return "";
  }

  const code =
    HANGUL_START +
    initialIndex * 588 +
    medialIndex * 28 +
    (finalIndex === -1 ? 0 : finalIndex);
  return String.fromCharCode(code);
}

/**
 * 한글 문자열을 초성 문자열로 변환
 * 예: "안녕" -> "ㅇㄴ", "리액트" -> "ㄹㅇㅌ"
 * 한글이 아닌 문자는 제거하고 초성만 반환
 */
export function toInitials(text: string): string {
  return text
    .split("")
    .map((char) => {
      const decomposed = decomposeHangul(char);
      return decomposed ? decomposed.initial : "";
    })
    .filter((char) => char !== "") // 빈 문자열 제거
    .join("");
}

/**
 * 한글 문자열을 자음/모음으로 분리
 * 예: "안녕" -> "ㅇㅏㄴㄴㅕㅇ"
 */
export function toJamo(text: string): string {
  return text
    .split("")
    .map((char) => {
      const decomposed = decomposeHangul(char);
      if (decomposed) {
        return (
          decomposed.initial + decomposed.medial + (decomposed.final || "")
        );
      }
      return char;
    })
    .join("");
}

/**
 * 검색 쿼리를 정규화 (초성, 자음/모음 분리 등)
 */
export function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().trim();
}

/**
 * 한글 초성 검색이 가능한지 확인
 * 예: "ㅇㄴ" -> true, "안녕" -> false
 */
export function isInitialSearch(query: string): boolean {
  const initialPattern = /^[ㄱ-ㅎ]+$/;
  return initialPattern.test(query);
}

/**
 * 검색어가 한글인지 확인
 */
export function isHangul(text: string): boolean {
  return /[가-힣]/.test(text);
}

/**
 * 텍스트에서 검색어와 매칭되는지 확인 (한글 검색 최적화)
 * @param text 검색 대상 텍스트
 * @param query 검색어
 * @returns 매칭 여부
 */
export function matchesKoreanSearch(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return false;

  // 1. 기본 포함 검색 (가장 우선)
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // 2. 초성 검색 개선 (예: "ㄹㅇㅌ" -> "리액트")
  // 초성만 있는 경우와 초성+일반 문자가 섞인 경우 모두 처리
  const hasInitials = /[ㄱ-ㅎ]/.test(normalizedQuery);
  if (hasInitials) {
    // 텍스트를 초성으로 변환 (한글만 변환, 영어/숫자는 그대로)
    const textInitials = toInitials(text);
    const queryInitials = toInitials(normalizedQuery);

    // 초성 문자열에서 검색
    if (textInitials.includes(queryInitials)) {
      return true;
    }

    // 연속된 초성 매칭 (예: "ㄹㅇㅌ"가 "리액트"의 초성과 매칭)
    let textInitialIndex = 0;
    let queryInitialIndex = 0;

    while (
      textInitialIndex < textInitials.length &&
      queryInitialIndex < queryInitials.length
    ) {
      if (textInitials[textInitialIndex] === queryInitials[queryInitialIndex]) {
        queryInitialIndex++;
        if (queryInitialIndex === queryInitials.length) {
          return true;
        }
      }
      textInitialIndex++;
    }
  }

  // 3. 자음/모음 분리 검색 (예: "ㅇㅏㄴ" -> "안")
  if (isHangul(normalizedQuery)) {
    const textJamo = toJamo(text);
    const queryJamo = toJamo(normalizedQuery);
    if (textJamo.includes(queryJamo)) {
      return true;
    }
  }

  return false;
}

/**
 * 검색어 하이라이팅을 위한 텍스트 분할
 * @param text 원본 텍스트
 * @param query 검색어
 * @returns 하이라이팅 정보가 포함된 배열
 */
export function highlightSearchMatch(
  text: string,
  query: string
): Array<{ text: string; match: boolean }> {
  if (!query.trim()) {
    return [{ text, match: false }];
  }

  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  const result: Array<{ text: string; match: boolean }> = [];
  let lastIndex = 0;

  // 기본 포함 검색
  let searchIndex = normalizedText.indexOf(normalizedQuery, lastIndex);

  if (searchIndex === -1) {
    // 초성 검색 시도
    const textInitials = toInitials(text);
    const queryInitials = toInitials(query);
    if (textInitials.includes(queryInitials)) {
      // 초성 매칭 위치 찾기
      let initialIndex = 0;
      let queryInitialIndex = 0;
      let matchStart = -1;
      let matchEnd = -1;

      for (let i = 0; i < text.length; i++) {
        const decomposed = decomposeHangul(text[i]);
        if (decomposed) {
          if (
            queryInitialIndex < queryInitials.length &&
            decomposed.initial === queryInitials[queryInitialIndex]
          ) {
            if (matchStart === -1) matchStart = i;
            queryInitialIndex++;
            if (queryInitialIndex === queryInitials.length) {
              matchEnd = i + 1;
              break;
            }
          } else if (matchStart !== -1) {
            // 매칭 중단
            matchStart = -1;
            queryInitialIndex = 0;
          }
        }
      }

      if (matchStart !== -1 && matchEnd !== -1) {
        if (matchStart > lastIndex) {
          result.push({
            text: text.substring(lastIndex, matchStart),
            match: false,
          });
        }
        result.push({
          text: text.substring(matchStart, matchEnd),
          match: true,
        });
        lastIndex = matchEnd;
      }
    }
  } else {
    // 일반 매칭
    while (searchIndex !== -1) {
      if (searchIndex > lastIndex) {
        result.push({
          text: text.substring(lastIndex, searchIndex),
          match: false,
        });
      }
      result.push({
        text: text.substring(searchIndex, searchIndex + normalizedQuery.length),
        match: true,
      });
      lastIndex = searchIndex + normalizedQuery.length;
      searchIndex = normalizedText.indexOf(normalizedQuery, lastIndex);
    }
  }

  if (lastIndex < text.length) {
    result.push({ text: text.substring(lastIndex), match: false });
  }

  return result.length > 0 ? result : [{ text, match: false }];
}

/**
 * 검색어 유사도 점수 계산 (정확도 기반)
 */
export function calculateSearchScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) return 0;

  // 정확한 일치
  if (normalizedText === normalizedQuery) return 100;

  // 시작 부분 일치
  if (normalizedText.startsWith(normalizedQuery)) return 90;

  // 포함
  if (normalizedText.includes(normalizedQuery)) return 70;

  // 초성 검색
  if (isInitialSearch(normalizedQuery)) {
    const textInitials = toInitials(text);
    if (textInitials.includes(normalizedQuery)) return 50;
  }

  // 자음/모음 분리 검색
  if (isHangul(normalizedQuery)) {
    const textJamo = toJamo(text);
    const queryJamo = toJamo(normalizedQuery);
    if (textJamo.includes(queryJamo)) return 40;
  }

  return 0;
}
