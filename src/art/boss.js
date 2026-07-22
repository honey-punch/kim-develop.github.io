import {bake} from './pixel.js';

// 김흑막. 사람과 같은 16x32 눈금이다 — 흑막도 사람이라 김개발만 해야 한다.
// 예전엔 24x34짜리 옛 도트라 추종자보다도 작았다.
//
// 다리는 그리지 않는다. 망토가 바닥까지 닿아 걷는 게 아니라 떠 있는 것처럼 보이게 한다.
// prettier-ignore
const BOSS_ART = [
  '................',
  '......oooo......',
  '.....occcco.....',
  '....occcccco....',
  '....occcccco....',
  '...occcccccco...',
  '...occcccccco...',
  '...ockkkkkkco...',
  '..occkkkkkkcco..',
  '..occkEekEecco..',
  '..occkeekeecco..',
  '..occkkkkkkcco..',
  '..occkkkkkkcco..',
  '..occcccccccco..',
  '..oCCCCCCCCCCo..',
  '..oCCCCCCCCCCo..',
  '.occccddddcccco.',
  '.otcccddddcccto.',
  '.otcccddddcccto.',
  '.otcccddddcccto.',
  '.otcccddddcccto.',
  '.otcccddddcccto.',
  '.otcccddddcccto.',
  '.otcccddddcccto.',
  'octcccddddccctco',
  'ottcccddddccctto',
  'ottcccddddccctto',
  'ottcccddddccctto',
  'otccccccccccccto',
  'otccccccccccccto',
  '.ooccoccoccocco.',
  '...oo.oo.oo.oo..',
];

const PALETTE = {
  o: 0x08080e, // 외곽선
  c: 0x1e1e2a, // 망토
  C: 0x2e2e40, // 어깨 하이라이트
  d: 0x14141c, // 망토 안쪽 그림자
  t: 0x3a2b3f, // 망토 가장자리에 도는 보라기
  k: 0x000000, // 두건 속 어둠
  e: 0xd6455d, // 붉은 눈
  E: 0xff8a94, // 눈에서 새는 빛
};

export function bakeBoss(scene) {
  bake(scene, 'boss', BOSS_ART, PALETTE);
}
