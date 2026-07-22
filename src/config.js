export const TILE = 32;

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

// 월드 카메라만 확대해 도트를 키운다. UI 씬 카메라는 줌 1로 두어 텍스트가 선명하게 나온다.
export const WORLD_ZOOM = 2;

// 하단바가 차지하는 높이. 월드 카메라는 이만큼 줄여서 맵이 바 뒤로 숨지 않게 한다.
export const UI_BAR_HEIGHT = 88;

// ★ 김개발의 이동 속도. 초당 몇 픽셀을 가는지다(타일 한 칸 = 32px).
//    125면 1초에 약 네 칸.
//
//    도트를 키우면서 몸이 두 배가 됐는데 이 값은 그대로라 느리게 느껴진다.
//    화면에서 몸 길이만큼 가는 데 걸리는 시간이 두 배가 됐기 때문이지 버그가 아니다.
//    예전과 같은 체감을 내려면 180~200쯤이 시작점이다.
//
//    올릴 때 같이 봐야 할 것:
//    - ENEMY_TYPES의 speed(아래). 김개발보다 확실히 느려야 치고 빠지기가 된다
//    - COMBAT.knockback(150). 이동 속도보다 느리면 맞고 밀려나는 맛이 없다
export const PLAYER_SPEED = 250;

// 사람 스프라이트는 32x64이고 기준점이 발밑이다. 공격 판정과 탄은 이만큼 올려서 쏜다.
export const CHEST_HEIGHT = 32;

// 깊이. 사람과 소품은 y좌표를 그대로 깊이로 써서 아래에 있는 쪽이 앞에 그려진다.
// 맵 크기를 넘지 않는 값이라 이펙트는 그보다 훨씬 위에 둔다.
export const DEPTH = {
  ground: 0,
  effect: 5000,
  text: 5100,
};

export const COMBAT = {
  attackCooldown: 380,
  // 키보드를 휘두르는 만큼 적의 근접 사거리(26)보다 확실히 길어야 한다.
  attackReach: 52, // 바라보는 방향으로 뻗는 길이
  attackWidth: 42, // 그 직각 방향 폭
  hitInvuln: 700, // 맞고 난 뒤 무적 시간
  knockback: 150,

  collapseMs: 2500, // HP가 0이 되면 움직이지 못하는 시간
  reviveHp: 20, // 이 수치에 닿을 때까지는 무적
  hpRegenPerSec: 12, // 쓰러진 뒤 회복 속도
  dpRegenPerSec: 2, // DP는 평상시에도 서서히 찬다. 스킬을 연달아 못 쓰게 하는 제동장치다
};

// 스킬별 위력과 사거리. DP 소모량과 해금 레벨은 state.js의 SKILLS에 있다.
export const SKILL_SPECS = {
  // 벌레를 일직선으로 돌진시킨다. 겹치는 적을 관통한다.
  // hitSize는 스프라이트보다 넉넉하게 잡아 대충 겨눠도 맞게 한다.
  // 사거리 = speed * lifespan/1000 (화면 가로의 3분의 2쯤)
  bug: {damage: 14, speed: 320, lifespan: 1600, hitSize: 30},
  // 키보드 소리를 부채꼴로 퍼뜨린다.
  sound: {damage: 22, radius: 96, arc: Math.PI * 0.75},
  // 화면에 보이는 모든 적 뒤에 나타나 훈수를 둔다.
  screen: {damage: 36},
};

export const ENEMY_TYPES = {
  html: {
    id: 'html',
    word: 'HTML로 프로그래밍하자',
    hp: 24,
    damage: 8,
    // ★ 추종자 이동 속도. PLAYER_SPEED보다 확실히 느려야 치고 빠지기가 된다.
    //    김개발을 빠르게 했으면 여기도 같은 비율로 올려야 쫓기는 맛이 남는다.
    speed: 40,
    aggro: 380,
    attackRange: 26,
    attackCooldown: 1100,
    tint: 0xffffff,
  },
  // 근거리는 HTML보다 세고, 원거리는 HTML의 근거리 수준으로 맞춘다.
  css: {
    id: 'css',
    word: 'CSS로 프로그래밍하자',
    hp: 40,
    damage: 13,
    speed: 44,
    aggro: 380,
    attackRange: 26,
    attackCooldown: 1200,
    rangedDamage: 8,
    rangedRange: 170,
    rangedCooldown: 2000,
    rangedSpeed: 90, // 느리게 날아와야 피할 여지가 생긴다
    tint: 0x6fa8dc,
  },
};

// 최종 보스 김흑막. 근접 공격이 없고 원거리 패턴으로만 싸운다.
export const BOSS = {
  name: '김흑막',
  hp: 420,
  speed: 34, // 좌우로 천천히 부유하며 자리를 옮긴다
  driftRange: 150, // 처음 자리에서 이만큼까지만 움직인다

  actionInterval: 2200, // 패턴 사이 간격
  rageInterval: 1500, // 체력 절반 아래에서 빨라진다
  rageAt: 0.5,

  shot: {damage: 10, speed: 110, lifespan: 4000},

  patterns: {
    // 한 발씩 노려 쏜다
    single: {shots: 3, gap: 260},
    // 부채꼴로 3발
    triple: {spread: Math.PI / 9},
    // 사방으로 흩뿌린다. 엄폐물 뒤로 숨어야 하는 패턴
    barrage: {count: 12},
    // HTML 추종자를 불러낸다
    summon: {count: 2, max: 6},
  },
};

// 타일셋 프레임 인덱스
export const T = {
  FLOOR: 0,
  WALL: 1,
  EXIT: 2, // 층과 층을 잇는 계단
  DESK: 3,
  DOOR: 4, // 건물 출입문. 계단과 구분되게 생겼다.
  ROAD: 5, // 야외 아스팔트
  PLANTER: 6, // 길가 화단
  CLOSED: 7, // 잠긴 문. 들어갈 수 없다.
  CABINET: 8, // 사무실 캐비닛. 몸을 숨기는 엄폐물이 된다.
  SHUTTER: 9, // 보스 방을 막는 셔터. 잡몹을 다 잡으면 열린다.
  WINDOW: 10, // 벽에 난 창. 오프닝에서 여기로 번개가 친다.
  PORTAL: 11, // 회장실의 차원문. 처음엔 없고 조건을 채우면 생긴다.
};

// 탄도 이 타일들에 막힌다. 캐비닛과 책상이 곧 엄폐물이 되는 이유다.
export const COLLIDING_TILES = [
  T.WALL,
  T.DESK,
  T.PLANTER,
  T.CLOSED,
  T.CABINET,
  T.SHUTTER,
  T.WINDOW,
];

// 밟으면 다음 장소로 넘어가는 타일들
export const EXIT_TILES = [T.EXIT, T.DOOR, T.PORTAL];
