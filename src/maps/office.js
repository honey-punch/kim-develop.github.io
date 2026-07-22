import { T } from '../config.js';

// 맵은 문자로 그린다.
// # 벽 / . 바닥 / D 책상 / B 캐비닛 / E 계단 / O 출입문
// R 도로 / P 화단 / C 잠긴 문 / S 셔터 / V 창문
const LEGEND = {
  '#': T.WALL,
  '.': T.FLOOR,
  D: T.DESK,
  B: T.CABINET,
  E: T.EXIT,
  O: T.DOOR,
  R: T.ROAD,
  P: T.PLANTER,
  C: T.CLOSED,
  S: T.SHUTTER,
  V: T.WINDOW,
};

// 문자표에 없는 글자가 섞이면 조용히 빈 칸이 되어 찾기 어려우므로 즉시 알린다.
export function assertLegend(art, name) {
  art.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (LEGEND[ch] === undefined) {
        throw new Error(`${name} 맵 (${x}, ${y})에 모르는 타일 문자 '${ch}'`);
      }
    });
  });
}

const OFFICE_ART = [
  // 창문은 위쪽 벽에 몰아 둔다. 오프닝에서 번개가 이 줄로 친다.
  '##VVVV###VVVV###VVVV#####',
  '#.......................#',
  '#..DD...DD...DD...DD....#',
  '#..DD...DD...DD...DD....#',
  '#.......................#',
  '#.......................#',
  '#..DD...DD...DD...DD....#',
  '#..DD...DD...DD...DD....#',
  '#.......................#',
  '#.......................#',
  '#..DD...DD...DD...DD....#',
  '#..DD...DD...DD...DD....#',
  '#.......................#',
  '#.......................#',
  '#.......................#',
  '#.......................#',
  '#.......................#',
  '###########EE############',
];

export function parseMap(art, name = '맵') {
  assertLegend(art, name);
  return art.map((row) => [...row].map((ch) => LEGEND[ch]));
}

export const OFFICE_MAP = parseMap(OFFICE_ART);

// 타일 좌표 기준 배치 정보
export const OFFICE_SPAWN = { x: 12, y: 15 };

// 거리에서 되돌아왔을 때 서는 자리. 나갔던 계단(17행) 바로 위다.
export const OFFICE_SPAWN_FROM = { StreetScene: { x: 12, y: 16 } };

// 책상 위에 얹는 장식. 타일이 아니라 그림이라 지나가는 데 걸리지 않고
// 맵 글자표를 늘리지 않고도 사무실을 채울 수 있다.
// 책상은 3·4 / 8·9 / 13·14 / 18·19번 칸의 2×2 덩어리다.
export const OFFICE_PROPS = [
  {texture: 'prop-monitor', x: 3, y: 2},
  {texture: 'prop-mug', x: 4, y: 3},
  {texture: 'prop-monitor', x: 9, y: 2},
  {texture: 'prop-papers', x: 8, y: 3},
  {texture: 'prop-monitor', x: 13, y: 2},
  {texture: 'prop-monitor', x: 19, y: 2},

  {texture: 'prop-monitor', x: 4, y: 6},
  {texture: 'prop-papers', x: 9, y: 7},
  {texture: 'prop-monitor', x: 14, y: 6},
  {texture: 'prop-mug', x: 18, y: 7},

  {texture: 'prop-monitor', x: 8, y: 10},
  {texture: 'prop-monitor', x: 18, y: 10},
  {texture: 'prop-papers', x: 13, y: 11},

  // 구석의 화분. 벽만 있는 자리를 비워 두지 않으려고 놓았다.
  {texture: 'prop-plant', x: 1, y: 1},
  {texture: 'prop-plant', x: 23, y: 1},
  {texture: 'prop-plant', x: 1, y: 16},
  {texture: 'prop-plant', x: 23, y: 16},
];

// 스폰 지점에서 멀찍이 흩어놓아 사무실을 한 바퀴 둘러보게 만든다.
export const OFFICE_ITEMS = [
  { id: 'office-daiso', type: 'weapon', item: 'daiso', x: 4, y: 5 },
  { id: 'office-supplement', type: 'potion', item: 'supplement', count: 2, x: 13, y: 9 },
  { id: 'office-americano', type: 'potion', item: 'americano', count: 2, x: 20, y: 13 },
];
