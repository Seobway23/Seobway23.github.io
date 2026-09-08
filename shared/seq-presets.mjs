/**
 * ```seq 내장 예제.
 *
 * 브라우저(src/lib/post-sequence.ts)와 빌드 스크립트(scripts/prerender.mjs)가
 * 함께 쓴다. 프리렌더는 preset 이름만 적힌 글에서도 step 설명을 꺼내
 * 크롤러가 읽을 목록으로 바꿔야 하므로 사양이 한 곳에 있어야 한다.
 *
 * 문법은 docs/POST_AUTHORING.md 참조.
 */

export const SEQ_PRESETS = {
  "event-loop": `title: 이벤트 루프 한 바퀴
speed: 1400
caption: 동기 코드 → 마이크로태스크 → 매크로태스크 순서로 비워진다.

lane stack  콜 스택 #stack
lane webapi Web API
lane micro  마이크로태스크 큐 #queue
lane macro  태스크 큐 #queue
lane out    콘솔 #log

step 스크립트가 실행되며 main()이 콜 스택에 올라간다.
  push stack main()
step console.log('A') 가 스택에 쌓이고 즉시 실행된다.
  push stack log('A')
  log out A
  pop stack
step setTimeout 은 콜백을 브라우저(Web API)에 맡기고 바로 반환한다.
  push stack setTimeout
  move stack webapi cb: 0ms 타이머
step Promise.then 의 콜백은 마이크로태스크 큐로 예약된다.
  push stack Promise.then
  move stack micro then-cb
step 타이머가 끝나 콜백이 태스크 큐로 넘어간다.
  move webapi macro cb
step main() 이 끝나 콜 스택이 완전히 빈다.
  pop stack
step 스택이 비면 이벤트 루프는 마이크로태스크 큐부터 전부 비운다.
  move micro stack then-cb
  log out then
  pop stack
step 그 다음에야 태스크 큐에서 하나를 꺼낸다.
  move macro stack cb
  log out timeout
  pop stack
step 큐가 모두 비었다. 다음 틱을 기다린다.
  mark out`,

  "http-request": `title: 브라우저가 페이지를 받아오기까지
speed: 1300
caption: 주소창 입력 한 번에 일어나는 왕복.

lane browser 브라우저
lane dns     DNS
lane server  서버
lane out     화면 #log

step 주소를 입력하면 브라우저가 도메인을 IP로 바꿔야 한다.
  push browser example.com
step DNS 에 질의한다.
  move browser dns 질의
step IP 주소를 돌려받는다.
  move dns browser 93.184.216.34
step 그 IP로 TCP 연결을 맺고 HTTP 요청을 보낸다.
  move browser server GET /
step 서버가 HTML 을 만들어 응답한다.
  move server browser 200 OK · HTML
step 브라우저가 HTML 을 파싱해 화면을 그린다.
  pop browser
  log out 페이지 렌더 완료`,
};

/** `preset: name` 줄을 실제 사양으로 펼친다. 사용자가 덧붙인 줄은 뒤에 남는다. */
export function expandSeqPreset(source) {
  const lines = String(source || "").split(/\r?\n/);
  const presetLine = lines.find((l) => /^\s*preset\s*:/.test(l));
  if (!presetLine) return { lines, error: null };

  const name = presetLine.split(":").slice(1).join(":").trim();
  const preset = SEQ_PRESETS[name];
  if (!preset) {
    return {
      lines,
      error: `preset "${name}" 없음 (있는 것: ${Object.keys(SEQ_PRESETS).join(", ")})`,
    };
  }
  return {
    lines: preset.split(/\r?\n/).concat(lines.filter((l) => l !== presetLine)),
    error: null,
  };
}
