import {bake} from './pixel.js';
import {HERO, FOLLOWER} from './palette.js';

// 컷신용 얼굴 클로즈업. 24x24 눈금에 그려 크게 띄운다.
// 걸어다니는 스프라이트(16x32)는 눈이 도트 한 칸이라 확대해도 표정이 안 나온다.
// 그래서 얼굴이 필요한 컷만 이 그림을 따로 쓴다.

// 평소의 김개발. 야근에 절어 눈 밑이 꺼져 있다.
// prettier-ignore
const KIM_CALM = [
  '.......oooooooooo.......',
  '.....ohhhhhhhhhhhho.....',
  '....ohhhhhhhhhhhhhho....',
  '...ohhhhhhhhhhhhhhhho...',
  '..ohhhhHHHhhhhhhhhhhho..',
  '..ohhhhHHHhhhhhhhhhhho..',
  '..ohhhhhhhhhhhhhhhhhho..',
  '..ohhhsssssssssssshhho..',
  '..ohhsssssssssssssshho..',
  '..ohhshhhsssssshhhshho..',
  '..ohhsseesssssseesshho..',
  '..ohhsseesssssseesshho..',
  '..ohhsSSSssssssSSSshho..',
  '..ohssssssssssssssssho..',
  '..ohsssssssSSsssssssho..',
  '..ohssssssSSSSssssssho..',
  '...osssssSSSSSSssssso...',
  '....oSssssssssssssSo....',
  '......oSSssssssSSo......',
  '........oSSSSSSo........',
  '....oCCCCSSSSSSCCCCo....',
  '.oCCCCCCCwwwwwwCCCCCCCo.',
  'occccrccccccccccccrcccco',
  'occccrccccccccccccrcccco',
];

// 당황한 김개발. 눈썹을 치켜올리고 눈을 부릅뜨고 입을 벌린다.
// prettier-ignore
const KIM_SHOCK = [
  '.......oooooooooo.......',
  '.....ohhhhhhhhhhhho.....',
  '....ohhhhhhhhhhhhhho....',
  '...ohhhhhhhhhhhhhhhho...',
  '..ohhhhHHHhhhhhhhhhhho..',
  '..ohhhhHHHhhhhhhhhhhho..',
  '..ohhhhhhhhhhhhhhhhhho..',
  '..ohhhsssssssssssshhho..',
  '..ohhsshhhsssshhhsshho..',
  '..ohhswwwsssssswwwshho..',
  '..ohhswewsssssswewshho..',
  '..ohhswwwsssssswwwshho..',
  '..ohhsSSSssssssSSSshho..',
  '..ohssssssssssssssssho..',
  '..ohsssssssSSsssssssho..',
  '..ohssssssSSSSssssssho..',
  '...ossssssoooosssssso...',
  '....oSssssoooossssSo....',
  '......oSSssssssSSo......',
  '........oSSSSSSo........',
  '....oCCCCSSSSSSCCCCo....',
  '.oCCCCCCCwwwwwwCCCCCCCo.',
  'occccrccccccccccccrcccco',
  'occccrccccccccccccrcccco',
];

// 김흑막. 두건 속이 새까매서 표정이 없다 — 당황은 땀방울로만 읽힌다.
// prettier-ignore
const BOSS_FACE = [
  '..........oooo..........',
  '.........occcco.........',
  '........ooccccoo........',
  '.......occcccccco.......',
  '......ooccccccccoo......',
  '.....occcccccccccco.....',
  '.....occcccccccccco..S..',
  '..S.ooccccccccccccoo.s..',
  '..socckkkkkkkkkkkkcco...',
  '...occkkkkkkkkkkkkcco.S.',
  '...occkkkkkkkkkkkkcco.s.',
  '...occkkkkkkkkkkkkcco...',
  '...occkkEeekkEeekkcco...',
  '..occckkeeekkeeekkccco..',
  '..otcckkeeekkeeekkccto..',
  '..otcckkkkkkkkkkkkccto..',
  '..otcckkkkkkkkkkkkccto..',
  '..otcckkkkkkkkkkkkccto..',
  '..otcckkkkkkkkkkkkccto..',
  '.ocCCCCCCCCCCCCCCCCCCco.',
  '.occcccccccccccccccccco.',
  '.occcccccccccccccccccco.',
  '.occcccccccccccccccccco.',
  '.occcccccccccccccccccco.',
];

const BOSS_PALETTE = {
  o: 0x08080e, // 외곽선
  c: 0x1e1e2a, // 두건
  C: 0x2e2e40, // 어깨 하이라이트
  t: 0x3a2b3f, // 두건 가장자리에 도는 보라기
  k: 0x000000, // 두건 속 어둠
  e: 0xd6455d, // 붉은 눈
  E: 0xff8a94, // 눈에서 새는 빛
  s: 0x9fd4e8, // 땀
  S: 0xd8f0ff,
};

// 추종자 얼굴. 김개발의 놀란 얼굴을 그대로 쓰고 팔레트만 갈아끼운다.
// 흰자(w)만 밝게 남겨 두면 새까만 얼굴에서 붉은 눈이 도드라진다.
const FOLLOWER_FACE = {...FOLLOWER, w: 0xb8b2c0, n: 0x8a8290};

export const PORTRAITS = {
  'face-kim': KIM_CALM,
  'face-kim-shock': KIM_SHOCK,
};

export function bakePortraits(scene) {
  Object.entries(PORTRAITS).forEach(([key, art]) => bake(scene, key, art, HERO));
  bake(scene, 'face-boss', BOSS_FACE, BOSS_PALETTE);
  bake(scene, 'face-follower', KIM_SHOCK, FOLLOWER_FACE);
}
