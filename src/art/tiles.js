import {bake, bakeStrip} from './pixel.js';
import {MOODS} from './palette.js';

// 타일은 16 눈금에 그리고 2배로 구워 32px 타일이 된다.
// 배열 순서가 곧 config.js의 타일 인덱스 T다. 순서를 바꾸면 맵이 어긋난다.

// 0 바닥. 사무실 카펫 타일.
// 위·왼쪽 한 줄만 어둡게 눌러 타일 경계를 만들고 나머지는 잔알갱이로 채운다.
// 나무 마루로 깔았더니 사무실이 아니라 교실로 보여서 갈아엎었다.
// prettier-ignore
const FLOOR = [
  'DDDDDDDDDDDDDDDD',
  'DffFfffffFffffff',
  'DfffffFffffffFff',
  'DffffffffFffffff',
  'DFfffffffffffFff',
  'DfffFffffffffffF',
  'DffffffffFffffff',
  'DfFfffffffffffff',
  'DffffffFffffffff',
  'DffffffffffFffff',
  'DFffffffffffffff',
  'DfffffFfffffFfff',
  'DffffffffffffffF',
  'DfFffffffffFffff',
  'DfffffffFfffffff',
  'DffffFfffffffFff',
];

// 1 벽. 흰 사무실 벽. 세로 이음새 한 줄로 파티션 판이 이어진 티를 낸다.
// prettier-ignore
const WALL = [
  'oooooooooooooooo',
  'tttttttttttttttt',
  'TTTTTTTTTTTTTTTT',
  'wwwwwwwwwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'wwwwwwwWwwwwwwww',
  'WWWWWWWWWWWWWWWW',
  'mmmmmmmmmmmmmmmm',
  'MMMMMMMMMMMMMMMM',
  'MMMMMMMMMMMMMMMM',
  'NNNNNNNNNNNNNNNN',
];

// 10 창문. 위쪽 세 줄은 벽(1)과 똑같이 두어 벽에 뚫린 것처럼 이어진다.
// 오프닝에서 번개가 치는 곳이라 유리(y·Y)를 따로 팔레트에 뒀다.
// prettier-ignore
const WINDOW = [
  'oooooooooooooooo',
  'tttttttttttttttt',
  'TTTTTTTTTTTTTTTT',
  'wwwwwwwwwwwwwwww',
  'woooooooooooooow',
  'woQQQQQQQQQQQQow',
  'woQyyyyQQyyyyQow',
  'woQyYyyQQyyYyQow',
  'woQQQQQQQQQQQQow',
  'woQyyyyQQyyyyQow',
  'woQyYyyQQyyyYQow',
  'woQyyyyQQyyyyQow',
  'woQQQQQQQQQQQQow',
  'woooooooooooooow',
  'wBBBBBBBBBBBBBBw',
  'NNNNNNNNNNNNNNNN',
];

// 2 계단. 디딤판만 밝게 남기고 사이는 어둡게 파서 내려가는 깊이를 만든다.
// prettier-ignore
const EXIT = [
  'oooooooooooooooo',
  'oRRRRRRRRRRRRRRo',
  'oRRRRRRRRRRRRRRo',
  'otttttttttttttto',
  'oTTTTTTTTTTTTTTo',
  'oRRRRRRRRRRRRRRo',
  'oRRRRRRRRRRRRRRo',
  'otttttttttttttto',
  'oTTTTTTTTTTTTTTo',
  'oRRRRRRRRRRRRRRo',
  'oRRRRRRRRRRRRRRo',
  'otttttttttttttto',
  'oTTTTTTTTTTTTTTo',
  'oTTTTTTTTTTTTTTo',
  'oRRRRRRRRRRRRRRo',
  'oooooooooooooooo',
];

// 3 책상. 맵에서 2x2로 놓인다.
// 앞판을 두껍게 그렸더니 위아래로 쌓였을 때 책상이 아니라 선반처럼 보였다.
// 상판을 최대한 넓게 두고 앞 모서리는 세 줄로만 낸다.
// prettier-ignore
const DESK = [
  'oooooooooooooooo',
  'EEEEEEEEEEEEEEEE',
  'eeeeeeeeeeeeeeee',
  'eeeeGGeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeGGeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeGGeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeeeeeeeee',
  'eeeeeeeeGGGeeeee',
  'EEEEEEEEEEEEEEEE',
  'GGGGGGGGGGGGGGGG',
  'oooooooooooooooo',
];

// 4 건물 출입문. 세로로 여러 칸 이어 붙여 넓은 입구를 만든다.
// 그래서 위아래 테두리가 없다 — 있으면 칸마다 문이 하나씩 있는 것처럼 잘려 보인다.
// 위아래를 막아 주는 건 그 바깥에 있는 벽 타일이다.
// prettier-ignore
const DOOR = Array(16).fill('wwomMRRRRRRMmoww');

// 5 야외 아스팔트
// prettier-ignore
const ROAD = [
  'QQQQQQQQQQQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQqqQQQQQQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQQQQQQQQQqqQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QqqQQQQQQQQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQQQQQQqqQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQQqqQQQQQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQQQQQQQQQQqqQQ',
  'QQQQQQQQQQQQQQQQ',
  'QQQQQQQQQQQQQQQQ',
];

// 6 길가 화단
// prettier-ignore
const PLANTER = [
  'oooooooooooooooo',
  'obbbbbbbbbbbbbbo',
  'obqqqqqqqqqqqqbo',
  'obqvvvvvvvvvvqbo',
  'obqvVVvvvvvvvqbo',
  'obqvvvvvVVvvvqbo',
  'obqvvvvvvvvvvqbo',
  'obqvvVVvvvvvvqbo',
  'obqvvvvvvvVVvqbo',
  'obqvvvvvvvvvvqbo',
  'obqvVVvvvvvvvqbo',
  'obqvvvvvvvvvvqbo',
  'obqqqqqqqqqqqqbo',
  'obbbbbbbbbbbbbbo',
  'oQQQQQQQQQQQQQQo',
  'oooooooooooooooo',
];

// 7 잠긴 문. 판자를 가로질러 대어 놓아 열리는 문(4)과 한눈에 구분된다.
// prettier-ignore
const CLOSED = [
  'oooooooooooooooo',
  'oWWWWWWWWWWWWWWo',
  'oWoooooooooooWWo',
  'oWoMMMMMMMMMoWWo',
  'oWoMMMMMMMMMoWWo',
  'oWoNNNNNNNNNoWWo',
  'oGGGGGGGGGGGGGGo',
  'oggggggggggggggo',
  'oWoMMMMMMMMMoWWo',
  'oWoNNNNNNNNNoWWo',
  'oWoMMMMMMMMMoWWo',
  'oGGGGGGGGGGGGGGo',
  'oggggggggggggggo',
  'oWoMMMMMMMMMoWWo',
  'oWoMMMMMMMMMoWWo',
  'oooooooooooooooo',
];

// 8 철제 캐비닛. 서랍 두 칸과 손잡이.
// prettier-ignore
const CABINET = [
  'oooooooooooooooo',
  'oBBBBBBBBBBBBBBo',
  'obbbbbbbbbbbbbqo',
  'obqqqqqqqqqqqbqo',
  'obqbbbbbbbbbqbqo',
  'obqbbbbnnbbbqbqo',
  'obqbbbbbbbbbqbqo',
  'obqqqqqqqqqqqbqo',
  'obBBBBBBBBBBBbqo',
  'obqbbbbbbbbbqbqo',
  'obqbbbbnnbbbqbqo',
  'obqbbbbbbbbbqbqo',
  'obqqqqqqqqqqqbqo',
  'obbbbbbbbbbbbbqo',
  'oQQQQQQQQQQQQQQo',
  'oooooooooooooooo',
];

// 9 보스 방 셔터
// prettier-ignore
const SHUTTER = [
  'oooooooooooooooo',
  'oXXXXXXXXXXXXXXo',
  'oxxxxxxxxxxxxxxo',
  'oxxxxxxxxxxxxxxo',
  'oooooooooooooooo',
  'oXXXXXXXXXXXXXXo',
  'oxxxxxxxxxxxxxxo',
  'oxxxxxxxxxxxxxxo',
  'oooooooooooooooo',
  'oXXXXXXXXXXXXXXo',
  'oxxxxxxxxxxxxxxo',
  'oxxxxxxxxxxxxxxo',
  'oooooooooooooooo',
  'oXXXXXXXXXXXXXXo',
  'oxxxxxxxxxxxxxxo',
  'oooooooooooooooo',
];

// 11 차원문. 회장실에서 조건을 채우면 벽에 뚫린다.
// 문짝이 아니라 빨려 들어가는 소용돌이다 — 안쪽으로 갈수록 밝아지게 겹을 쌓았다.
// prettier-ignore
const PORTAL = [
  'oooooooooooooooo',
  'ozzzzzzzzzzzzzzo',
  'ozZZZZZZZZZZZZzo',
  'ozZZuuuuuuuuZZzo',
  'ozZuuUUUUUUuuZzo',
  'ozZuUUjjjjUUuZzo',
  'ozZuUjjjjjjUuZzo',
  'ozZuUjjjjjjUuZzo',
  'ozZuUjjjjjjUuZzo',
  'ozZuUjjjjjjUuZzo',
  'ozZuUUjjjjUUuZzo',
  'ozZuuUUUUUUuuZzo',
  'ozZZuuuuuuuuZZzo',
  'ozZZZZZZZZZZZZzo',
  'ozzzzzzzzzzzzzzo',
  'oooooooooooooooo',
];

const TILESET = [
  FLOOR,
  WALL,
  EXIT,
  DESK,
  DOOR,
  ROAD,
  PLANTER,
  CLOSED,
  CABINET,
  SHUTTER,
  WINDOW,
  PORTAL,
];

// 책상 위에 얹는 소품. 타일이 아니라 그림이라 맵 배열을 건드리지 않는다.
// prettier-ignore
const PROPS = {
  'prop-monitor': [
    '..oooooooooooo..',
    '..oQQQQQQQQQQo..',
    '..oQllllllllQo..',
    '..oQlLLllllLQo..',
    '..oQllllllllQo..',
    '..oQlllLLlllQo..',
    '..oQllllllllQo..',
    '..oQllLllllLQo..',
    '..oQllllllllQo..',
    '..oQQQQQQQQQQo..',
    '..oooooooooooo..',
    '.....oQQQQo.....',
    '.....oQQQQo.....',
    '...oQQQQQQQQo...',
    '...oBBBBBBBBo...',
    '...oooooooooo...',
  ],
  'prop-mug': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '....oBBBBBBo....',
    '....oBnnnnBo....',
    '....oBBBBBBo....',
    '....oBBBBBBo....',
    '....oBBBBBBo....',
    '....oQQQQQQo....',
    '.....oooooo.....',
    '................',
    '................',
  ],
  'prop-plant': [
    '................',
    '.......vv.......',
    '......vVVv......',
    '....vvVVVVvv....',
    '...vVVvvvvVVv...',
    '..vvVvvvvvvVvv..',
    '...vvvvvvvvvv...',
    '.....vvvvvv.....',
    '.......vv.......',
    '....oooooooo....',
    '....oMMMMMMo....',
    '....oMmmmmMo....',
    '....oMmmmmMo....',
    '.....oMMMMo.....',
    '.....oooooo.....',
    '................',
  ],
  // 비밀공간의 집기 위에 올려 두는 촛불. 이 방의 유일한 광원이다.
  'prop-candle': [
    '................',
    '................',
    '................',
    '.......n........',
    '......nnn.......',
    '......nNn.......',
    '.......n........',
    '................',
    '.....oooooo.....',
    '.....oWWWWo.....',
    '.....oWWWWo.....',
    '.....oWWWWo.....',
    '.....oWWWWo.....',
    '....oQQQQQQo....',
    '....oooooooo....',
    '................',
  ],
  'prop-papers': [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...oooooooo.....',
    '...owwwwwwo.....',
    '..oooooooooo....',
    '..owwwwwwwwo....',
    '.oooooooooooo...',
    '.owwwwwwwwwwo...',
    '.oWWWWWWWWWWo...',
    '.oooooooooooo...',
  ],
};

// 발밑 그림자. 이게 있어야 캐릭터가 바닥 위에 서 있는 것으로 보인다.
// prettier-ignore
const SHADOW = [
  '.....zzzzzz.....',
  '...zzzzzzzzzz...',
  '..zzzzzzzzzzzz..',
  '...zzzzzzzzzz...',
  '.....zzzzzz.....',
];

export function tilesetKey(mood) {
  return `tiles-${mood}`;
}

// 같은 도트를 팔레트만 바꿔 두 번 굽는다.
// 번개가 친 뒤 세상이 식는 연출은 씬이 쓰는 키를 cold로 바꾸기만 하면 된다.
export function bakeTiles(scene) {
  Object.entries(MOODS).forEach(([mood, palette]) => {
    bakeStrip(scene, tilesetKey(mood), TILESET, palette);
    Object.entries(PROPS).forEach(([key, art]) => {
      bake(scene, `${key}-${mood}`, art, palette);
    });
  });

  bake(scene, 'shadow', SHADOW, {z: [0x000000, 0.32]});
}
