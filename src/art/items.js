import {bake} from './pixel.js';

// 사무실에서 줍는 것들. 타일·캐릭터와 같은 16 눈금에 그린다.
// 눈금이 다르면 같은 화면 안에서 도트 굵기가 어긋나 보인다.

// prettier-ignore
const KEYBOARD = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..oooooooooooo..',
  '..oWWWWWWWWWWo..',
  '..oWkWkWkWkWWo..',
  '..oWWWWWWWWWWo..',
  '..oWkWkWkWkWWo..',
  '..oWWWWWWWWWWo..',
  '..oQQQQQQQQQQo..',
  '..oooooooooooo..',
  '................',
  '................',
  '................',
];

const KEYBOARD_PALETTE = {
  o: 0x3a3238,
  W: 0xf2ece0, // 키캡
  k: 0x8a8290, // 키 사이 틈
  Q: 0xb9b3ac, // 아래로 지는 그림자
};

// prettier-ignore
const SUPPLEMENT = [
  '................',
  '................',
  '.....oooooo.....',
  '.....oGGGGo.....',
  '....oooooooo....',
  '....oWWWWWWo....',
  '....oWWWWWWo....',
  '....oVVVVVVo....',
  '....oVWWWWVo....',
  '....oVVVVVVo....',
  '....oWWWWWWo....',
  '....oWWWWWWo....',
  '....oQQQQQQo....',
  '....oooooooo....',
  '................',
  '................',
];

const SUPPLEMENT_PALETTE = {
  o: 0x33302c,
  G: 0x4a7a4a, // 뚜껑
  W: 0xe8e4d8, // 병
  V: 0x6fbf6f, // 라벨
  Q: 0xb8b2a4,
};

// prettier-ignore
const AMERICANO = [
  '................',
  '................',
  '........oo......',
  '........oo......',
  '...oooooooooo...',
  '...oWWWWWWWWo...',
  '...oooooooooo...',
  '...oCbbbbbbCo...',
  '...oCbLLbbbCo...',
  '...oCbbbbbbCo...',
  '...oCbbLLbbCo...',
  '....oCbbbbCo....',
  '....oCbbbbCo....',
  '.....oooooo.....',
  '................',
  '................',
];

const AMERICANO_PALETTE = {
  o: 0x2b2a30,
  W: 0xdfe6ea, // 뚜껑
  C: 0xc3d2da, // 투명한 컵 벽
  b: 0x4a2c1a, // 커피
  L: 0xa8d8e8, // 얼음
};

export function bakeItems(scene) {
  bake(scene, 'item-keyboard', KEYBOARD, KEYBOARD_PALETTE);
  bake(scene, 'item-supplement', SUPPLEMENT, SUPPLEMENT_PALETTE);
  bake(scene, 'item-americano', AMERICANO, AMERICANO_PALETTE);
}
