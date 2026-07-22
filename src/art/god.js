import {bake} from './pixel.js';

// HTML의 신. 32x48 눈금에 그려 2배로 구우면 64x96 — 사람(32x64)보다 한참 크다.
//
// 몸이 곧 HTML이다. 머리가 H, 몸통이 T(어깨 가로획 + 세로 기둥),
// 골반이 M, 두 다리가 L 두 개. 짙은 녹색 강철에 글자만 주황색으로 빛난다.
// prettier-ignore
const GOD = [
  '........oooooooooooooooo........',
  '.......oGGGGGGGGGGGGGGGGo.......',
  '.......oggggggggggggggggo.......',
  '.......ogggnnggggggnngggo.......',
  '.......ogggnnggggggnngggo.......',
  '.......ogggnnggggggnngggo.......',
  '.......ogggnnnnnnnnnngggo.......',
  '.......ogggnnnnnnnnnngggo.......',
  '.......ogggnnggggggnngggo.......',
  '.......ogggnnggggggnngggo.......',
  '.......ogggnnggggggnngggo.......',
  '.......oggggggggggggggggo.......',
  '.......oddddddddddddddddo.......',
  '.............oggggo.............',
  '.oGGGGGGGGGGGGGGGGGGGGGGGGGGGGo.',
  '.oggggggggggggggggggggggggggggo.',
  '.oggnnnnnnnnnnnnnnnnnnnnnnnnggo.',
  '.oggnnnnnnnnnnnnnnnnnnnnnnnnggo.',
  '.oggggggggggggggggggggggggggggo.',
  '.oddddddddddddddddddddddddddddo.',
  '...........oggnnnnggo...........',
  '...........oggnnnnggo...........',
  '...........oggnnnnggo...........',
  '...........oggnnnnggo...........',
  '...........oggnnnnggo...........',
  '...........oggnnnnggo...........',
  '...........oggnnnnggo...........',
  '...........oddddddddo...........',
  '.....ognngnnggggggggnngnngo.....',
  '.....ognnggnnggggggnnggnngo.....',
  '.....ognngggnnggggnngggnngo.....',
  '.....ognnggggnnggnnggggnngo.....',
  '.....ognngggggnnnngggggnngo.....',
  '.....ognnggggggggggggggnngo.....',
  '.....ognnggggggggggggggnngo.....',
  '.....oddddddddddddddddddddo.....',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggo......onnggo.......',
  '.......onnggggggo..onnggggggo...',
  '.......onnnnnnnno..onnnnnnnno...',
  '.......oooooooooo..oooooooooo...',
];

const PALETTE = {
  o: 0x122019, // 외곽선. 검정이 아니라 몸 색을 어둡게 누른 것
  g: 0x2f5c40, // 강철 녹색
  G: 0x437a56, // 하이라이트
  d: 0x1f3f2b, // 그림자
  n: 0xff9a3c, // 글자에서 새어 나오는 주황빛
};

export function bakeGod(scene) {
  bake(scene, 'god', GOD, PALETTE);
}
