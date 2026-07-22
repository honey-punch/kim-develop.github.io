export const WEAPONS = {
  daiso: {id: 'daiso', name: '다이소 키보드', damage: 6, color: 0xf2f2f2},
  mechanical: {id: 'mechanical', name: '기계식 키보드', damage: 12, color: 0x7fd4ff},
  legend: {id: 'legend', name: '사실은 개발자 출신이었던 회장님의 전설의 키보드', damage: 22, color: 0xffcc33},
};

// color는 마셨을 때 몸에 도는 기운의 색이다.
export const POTIONS = {
  supplement: {
    id: 'supplement',
    name: '영양제',
    icon: 'item-supplement',
    key: '1',
    restores: 'hp',
    amount: 40,
    color: 0x7fe08a,
  },
  americano: {
    id: 'americano',
    name: '아이스 아메리카노',
    icon: 'item-americano',
    key: '2',
    restores: 'dp',
    amount: 40,
    color: 0x7fc8f0,
  },
};

// color는 시전할 때 몸에 도는 빛의 색이다.
// 평타는 DP를 쓰지 않는다. 스킬은 레벨 1/3/5에 하나씩 열리고 뒤로 갈수록 DP를 많이 먹는다.
// 소모량과 위력은 3단계에서 전투를 굴려보고 다시 맞출 임시값이다.
export const SKILLS = [
  {
    id: 'basic',
    key: 'Q',
    name: '평타',
    dp: 0,
    level: 1,
    cooldown: 0,
    icon: 'skill-basic',
    desc: '들고 있는 키보드를 휘둘러 앞쪽을 때린다.',
  },
  {
    id: 'bug',
    key: 'W',
    name: '버그 소환',
    dp: 10,
    level: 1,
    cooldown: 1000,
    icon: 'skill-bug',
    color: 0x6fbf4f,
    desc: '벌레를 소환해 일직선으로 돌진시킨다. 겹치는 적을 모두 관통한다.',
    // 레벨이 아니라 전투 튜토리얼을 마쳐야 열린다. 처음엔 평타에만 집중하게 한다.
    requiresUnlock: true,
  },
  {
    id: 'sound',
    key: 'E',
    name: '키보드 소리어택',
    dp: 20,
    level: 3,
    cooldown: 3000,
    icon: 'skill-sound',
    color: 0xffd479,
    desc: '키보드를 크게 쳐서 생긴 음파로 앞쪽 부채꼴 범위를 때린다.',
  },
  {
    id: 'screen',
    key: 'R',
    name: '병풍코딩',
    dp: 35,
    level: 5,
    cooldown: 5000,
    icon: 'skill-screen',
    color: 0x9fd4e8,
    desc: '화면에 보이는 모든 적 뒤에 나타나 훈수를 둔다.',
  },
];

export const MAX_LEVEL = 5;

// 해당 레벨에 도달하는 데 필요한 누적 경험치. 인덱스가 곧 레벨이다.
export const LEVEL_EXP = [0, 0, 100, 250, 450, 700];

// 레벨업 때 최대치가 오르는 폭
export const LEVEL_GAIN = 10;

// 몬스터가 주는 경험치. CSS 타입이 더 세고 더 많이 준다.
export const EXP_REWARD = {html: 25, css: 45};

// 플레이어의 전역 상태. 씬을 넘나들어도 유지된다.
export const GameState = {
  maxHp: 100,
  maxDp: 100,
  hp: 20, // 김개발은 야근으로 체력이 1/100인 상태로 시작한다
  dp: 100,
  level: 1,
  exp: 0,
  weapon: null,
  potions: {supplement: 0, americano: 0},

  // 맵에 놓인 아이템을 이미 주웠는지. 포션을 다 써버려도 이 기록은 남으므로
  // 획득 여부로 거는 관문이 포션 개수에 휘둘리지 않는다.
  picked: {},

  // 스킬별 쿨타임이 끝나는 시각. 씬마다 초기화되는 시계 대신
  // 게임 전체에서 이어지는 game.loop.time을 기준으로 삼는다.
  cooldownUntil: {},

  // 레벨이 아닌 진행으로 열리는 스킬 기록
  unlocked: {},

  // 이미 본 컷신. 맵으로 되돌아왔을 때 오프닝이 다시 돌면 안 된다.
  watched: {},

  // 김흑막을 쓰러뜨렸는지. 사무실로 돌아갔을 때 엔딩을 이어 틀지 정한다.
  ending: false,

  // 이미 잡은 몬스터. 맵을 오가도 되살아나지 않게 한 마리씩 기록한다.
  // 보스가 불러낸 추종자처럼 맵에 원래 없던 개체는 여기 남지 않는다.
  killed: {},

  hasKilled(id) {
    return !!this.killed[id];
  },

  markKilled(id) {
    this.killed[id] = true;
  },

  hasWatched(id) {
    return !!this.watched[id];
  },

  markWatched(id) {
    this.watched[id] = true;
  },

  hasPicked(id) {
    return !!this.picked[id];
  },

  markPicked(id) {
    this.picked[id] = true;
  },

  giveWeapon(id) {
    const next = WEAPONS[id];
    if (!next) return false;
    // 획득 즉시 장착되며 변경 불가. 더 약한 무기로는 되돌아가지 않는다.
    if (this.weapon && this.weapon.damage >= next.damage) return false;
    this.weapon = next;
    return true;
  },

  hasSkill(skill) {
    if (this.level < skill.level) return false;
    if (skill.requiresUnlock && !this.unlocked[skill.id]) return false;
    return true;
  },

  // 레벨과 별개로 특정 시점에 열리는 스킬. 이미 열려 있으면 false를 돌려준다.
  unlockSkill(id) {
    if (this.unlocked[id]) return false;
    this.unlocked[id] = true;
    return true;
  },

  // 다음 레벨까지 필요한 경험치. 만렙이면 null.
  expToNext() {
    if (this.level >= MAX_LEVEL) return null;
    return LEVEL_EXP[this.level + 1] - this.exp;
  },

  // 이번 레벨 구간에서의 진행도 0~1. 만렙이면 1.
  expRatio() {
    if (this.level >= MAX_LEVEL) return 1;
    const floor = LEVEL_EXP[this.level];
    const ceil = LEVEL_EXP[this.level + 1];
    return Math.min(1, Math.max(0, (this.exp - floor) / (ceil - floor)));
  },

  // 오른 레벨 수를 돌려준다. 한 번에 여러 레벨이 오를 수도 있다.
  gainExp(amount) {
    if (this.level >= MAX_LEVEL) return 0;

    this.exp += amount;
    let gained = 0;

    while (this.level < MAX_LEVEL && this.exp >= LEVEL_EXP[this.level + 1]) {
      this.level += 1;
      gained += 1;
      this.maxHp += LEVEL_GAIN;
      this.maxDp += LEVEL_GAIN;
      // 오른 만큼은 채워 준다. 레벨업이 곧 보상으로 느껴지도록.
      this.hp = Math.min(this.maxHp, this.hp + LEVEL_GAIN);
      this.dp = Math.min(this.maxDp, this.dp + LEVEL_GAIN);
    }

    // 만렙에서는 경험치를 상한에 묶어 둔다.
    if (this.level >= MAX_LEVEL) this.exp = Math.min(this.exp, LEVEL_EXP[MAX_LEVEL]);

    return gained;
  },

  // 'used' | 'none' | 'full'
  usePotion(id) {
    const potion = POTIONS[id];
    if (!potion || this.potions[id] <= 0) return 'none';

    const stat = potion.restores;
    const max = stat === 'hp' ? this.maxHp : this.maxDp;
    if (this[stat] >= max) return 'full';

    this.potions[id] -= 1;
    this[stat] = Math.min(max, this[stat] + potion.amount);
    return 'used';
  },

  reset() {
    this.maxHp = 100;
    this.maxDp = 100;
    this.hp = 1;
    this.dp = 100;
    this.level = 1;
    this.exp = 0;
    this.weapon = null;
    this.potions = {supplement: 0, americano: 0};
    this.picked = {};
    this.cooldownUntil = {};
    this.unlocked = {};
    this.watched = {};
    this.killed = {};
    this.ending = false;
  },
};
