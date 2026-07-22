import { parseMap } from './office.js';

// 회사 건물 앞 거리. 가로로 긴 야외 도로다.
// 왼쪽 끝은 김개발이 방금 나온 회사(다시 들어갈 수 있다),
// 오른쪽 끝이 흑막의 건물 출입문이다. 오른쪽으로 나아가며 전투를 익힌다.
//
// 폭 48칸(1536px). 카메라가 한 번에 640px만 보여 주므로 좌우로 길게 스크롤된다.
const SIDEWALK = '....P.......P.......P.......P.......P......';
const ROAD = 'R'.repeat(43);

const STREET_ART = [
  '#'.repeat(48),
  `#${SIDEWALK}####`,
  `#${ROAD}####`,
  `#${ROAD}####`,
  `#${ROAD}####`,
  // 양쪽 출입문은 세 칸씩이다. 한 칸이면 문을 찾아 위아래로 더듬게 된다.
  // 왼쪽=사무실로 돌아가는 문, 오른쪽=흑막 건물 출입문
  `O${ROAD}O###`,
  `O${ROAD}O###`,
  `O${ROAD}O###`,
  `#${ROAD}####`,
  `#${ROAD}####`,
  `#${SIDEWALK}####`,
  '#'.repeat(48),
];

export const STREET_MAP = parseMap(STREET_ART);
export const STREET_SPAWN = { x: 2, y: 6 };

// 되돌아왔을 때 서는 자리. 로비에서 오면 들어갔던 건물 문(44칸) 앞이다.
export const STREET_SPAWN_FROM = { LobbyScene: { x: 43, y: 6 } };

// 전투 튜토리얼. 근접만 하는 HTML 타입으로만 채운다.
// 원거리 견제를 하는 CSS 타입은 2층 사무실에서 처음 등장한다.
//
// 앞의 둘은 스폰 지점 코앞에 세워 김개발의 길을 막는다 — 오프닝 컷신에서
// "앞을 가로막는" 추종자가 바로 이 둘이다. 이 둘을 잡으면 버그 스킬이 열린다.
// 나머지는 오른쪽으로 나아가며 한 마리씩 마주치도록 흩어 놓는다.
export const STREET_ENEMIES = [
  { type: 'html', x: 8, y: 5 },
  { type: 'html', x: 9, y: 7 },
  { type: 'html', x: 22, y: 4 },
  { type: 'html', x: 34, y: 7 },
];
