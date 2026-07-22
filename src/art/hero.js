import {bake, replaceRows, shiftDown} from './pixel.js';

// 김개발. 16x32 눈금에 그리고 2배로 구워서 32x64가 된다.
// 타일 하나(32px)만큼 넓고 두 타일만큼 큰, 스타듀밸리와 같은 비율이다.
//
// 가슴의 사원증은 장식이 아니다. 거리에서 추종자들이 "저 녀석 명찰을 봐"라고
// 외치는 그 명찰이라, 화면에서 실제로 보여야 한다.

const LEG_ROW = 26; // 다리가 시작되는 줄. 걷기 프레임은 이 아래만 갈아끼운다.

// prettier-ignore
const DOWN = [
  '................',
  '................',
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhHHhhhhhho..',
  '..ohhHHhhhhhho..',
  '..ohhsssssshho..',
  '..ohssssssssho..',
  '..ohsessssesho..',
  '..ohsSssssSsho..',
  '..ohssssssssho..',
  '...ohSsSSsSho...',
  '....oSssssSo....',
  '.....oSSSSo.....',
  '...oCCSSSSCCo...',
  '..oCCCSwwSCCCo..',
  '.oCCCCCwwCCCCCo.',
  '.oddcrccccrcddo.',
  '.oddcrccccrcddo.',
  '.oddccrccrccddo.',
  '.oddccwwwwccddo.',
  '.oddccwnnwccddo.',
  '.oddccwwwwccddo.',
  '.ossccccccccsso.',
  '.oSSddddddddSSo.',
  '...opppoopppo...',
  '...opppoopppo...',
  '...opppoopppo...',
  '...okkkookkko...',
  '...okkkookkko...',
  '...oooooooooo...',
];

// 뒤통수. 얼굴이 없는 대신 목 뒤로 사원증 줄만 넘어와 있다.
// prettier-ignore
const UP = [
  '................',
  '................',
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhHHhhhhhho..',
  '..ohhHHhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhHhhhhhhho..',
  '..ohhhhhhhhhho..',
  '..ohhhhhhhhhho..',
  '...ohhhhhhhho...',
  '....ohhhhhho....',
  '.....oSSSSo.....',
  '...oCCSSSSCCo...',
  '..oCCCSSSSCCCo..',
  '.oCCCCCrrCCCCCo.',
  '.oddcrccccrcddo.',
  '.oddcrccccrcddo.',
  '.oddccccccccddo.',
  '.oddccccccccddo.',
  '.oddccccccccddo.',
  '.oddccccccccddo.',
  '.ossccccccccsso.',
  '.oSSddddddddSSo.',
  '...opppoopppo...',
  '...opppoopppo...',
  '...opppoopppo...',
  '...okkkookkko...',
  '...okkkookkko...',
  '...oooooooooo...',
];

// 오른쪽을 본다. 왼쪽은 flipX로 뒤집어 쓴다.
//
// 머리는 앞뒤로 긴 달걀꼴이다. 위는 둥글게 좁히고, 뒤통수(왼쪽)는 어깨선까지
// 불룩하게 내밀고, 코가 있는 9번째 줄만 한 도트 더 튀어나온다.
// 앞뒤 폭을 똑같이 두면 뒤통수가 잘려 나간 것처럼 보인다.
//
// 몸통은 앞모습보다 좁다(10칸 → 8칸). 사람은 옆에서 보면 홀쭉하다.
// 등(왼쪽)은 3번 칸에 일직선으로 붙여 두고, 배(오른쪽)만 아래쪽에서 한 칸 나온다.
// 사원증은 앞모습처럼 가운데 두면 몸을 뚫고 나온 것처럼 보이므로 배 쪽으로 몰았다.
// 팔(d)이 그 앞을 지나가서 명찰이 옷에 매달려 있는 것으로 읽힌다.
// prettier-ignore
const SIDE = [
  '................',
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '..ohHHhhhhhho...',
  '..ohhhhhhhhso...',
  '..ohhhhhssssso..',
  '..ohhhhhsessso..',
  '..ohhhhSssssso..',
  '..ohhhhSSssso...',
  '...ohhhsSSsso...',
  '....ohhSssSo....',
  '.....oSSSSo.....',
  '.....oSSSSo.....',
  '....oCSSSSCo....',
  '...oCCSSwwCCo...',
  '...oCCCCCCCCo...',
  '...occcccrddo...',
  '...occcccrddo...',
  '...occccccddo...',
  '...occcccwwddo..',
  '...occcccwwddo..',
  '...occcccccddo..',
  '...occcccccsso..',
  '...oddddddSSo...',
  '....opppppo.....',
  '....opppppo.....',
  '....opppppo.....',
  '....okkkkko.....',
  '....okkkkko.....',
  '....ooooooo.....',
];

// 걸을 때 갈아끼우는 다리. 몸통은 한 도트 내려앉혀 반동을 준다 —
// 다리만 바꾸는 것보다 이 반동이 걷는 느낌의 대부분을 만든다.
// prettier-ignore
const STEPS = {
  down: [
    [
      '...opppoopppo...',
      '...opppoopppo...',
      '...opppookkko...',
      '...okkkookkko...',
      '...okkkoooooo...',
      '...ooooo........',
    ],
    [
      '...opppoopppo...',
      '...opppoopppo...',
      '...okkkoopppo...',
      '...okkkookkko...',
      '...ooooookkko...',
      '........ooooo...',
    ],
  ],
  side: [
    [
      '....opppppo.....',
      '....opppppo.....',
      '....opppppo.....',
      '...oPPkkkko.....',
      '...okkkkkko.....',
      '...oooooooo.....',
    ],
    [
      '....opppppo.....',
      '....opppppo.....',
      '....opppppo.....',
      '.....okkkkPPo...',
      '.....okkkkkko...',
      '.....oooooooo...',
    ],
  ],
};

STEPS.up = STEPS.down;

const POSES = {down: DOWN, up: UP, side: SIDE};

function walkFrame(base, legs) {
  // 상체만 내려앉히고 다리는 바닥에 붙여 둔다. 통째로 밀면 발이 땅에 파묻힌다.
  return [...shiftDown(base.slice(0, LEG_ROW), 1), ...legs];
}

// 김개발도 추종자도 같은 그림을 쓴다. 팔레트만 다르다.
export function bakeHuman(scene, key, palette) {
  Object.entries(POSES).forEach(([pose, base]) => {
    bake(scene, `${key}-${pose}-0`, base, palette);
    STEPS[pose].forEach((legs, i) => {
      bake(scene, `${key}-${pose}-${i + 1}`, walkFrame(base, legs), palette);
    });
  });

  // 스킬 잔상처럼 그냥 한 장이 필요한 곳을 위해 정면 그림을 기본 키로도 남겨 둔다.
  bake(scene, key, DOWN, palette);
}

export function createHumanAnims(scene, key) {
  const frames = (pose, order) => order.map((i) => ({key: `${key}-${pose}-${i}`}));

  Object.keys(POSES).forEach((pose) => {
    if (scene.anims.exists(`${key}-idle-${pose}`)) return;

    scene.anims.create({
      key: `${key}-idle-${pose}`,
      frames: frames(pose, [0]),
    });
    scene.anims.create({
      key: `${key}-walk-${pose}`,
      // 0(양발 모임)을 사이에 끼워야 두 걸음이 이어져 보인다.
      frames: frames(pose, [1, 0, 2, 0]),
      frameRate: 8,
      repeat: -1,
    });
  });
}

const poseOf = (facing) => (facing === 'left' || facing === 'right' ? 'side' : facing);

// 제자리에 선 채로 방향만 바꾼다. 컷신에서 두리번거릴 때 쓴다.
export function faceIdle(sprite, key, facing) {
  sprite.facing = facing;
  sprite.setFlipX(facing === 'left');
  sprite.anims.play(`${key}-idle-${poseOf(facing)}`, true);
}

// 속도로 방향을 정하고 알맞은 동작을 튼다. 김개발과 추종자가 같이 쓴다.
export function playFacing(sprite, key, vx, vy) {
  if (Math.abs(vx) > Math.abs(vy)) {
    sprite.facing = vx < 0 ? 'left' : 'right';
  } else if (vy !== 0) {
    sprite.facing = vy < 0 ? 'up' : 'down';
  }

  const moving = vx !== 0 || vy !== 0;

  sprite.setFlipX(sprite.facing === 'left');
  sprite.anims.play(`${key}-${moving ? 'walk' : 'idle'}-${poseOf(sprite.facing)}`, true);
}
