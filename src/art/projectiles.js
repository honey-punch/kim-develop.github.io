import {bake} from './pixel.js';

// 날아다니는 것들. 캐릭터·타일과 같은 16 눈금에 그린다.

// 버그 소환(W). 디버그 버튼에 흔히 쓰이는 딱정벌레 모양이다.
// prettier-ignore
const BUG = [
  '................',
  '...o........o...',
  '....oooooooo....',
  '....obbbbbbo....',
  '....obobbobo....',
  '....obbbbbbo....',
  '...obbbbbbbbo...',
  '...obbbddbbbo...',
  '..obbBBddbbbbo..',
  '.oobbBBddbbbboo.',
  '..obbBBddbbbbo..',
  '.oobbBBddbbbboo.',
  '..obbbbddbbbbo..',
  '..oobbbddbbboo..',
  '...obbbddbbbo...',
  '....oooooooo....',
];

const BUG_PALETTE = {
  o: 0x1c3a14, // 외곽선. 검정이 아니라 몸 색을 어둡게 누른 것
  b: 0x6fbf4f, // 등껍질
  B: 0x9ade7c, // 하이라이트
  d: 0x3d7a2c, // 등을 가르는 선
};

export function bakeProjectiles(scene) {
  bake(scene, 'proj-bug', BUG, BUG_PALETTE);
}
