import Phaser from 'phaser';
import { BOSS, CHEST_HEIGHT } from '../config.js';

// 김흑막. 근접 공격이 없고 원거리 패턴으로만 싸운다.
// 플레이어는 엄폐물 뒤로 숨었다가 패턴 사이에 붙어서 때리는 흐름이 된다.
export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    // 사람과 같은 32x64 스프라이트. 물리 몸통은 망토 밑단만 잡는다.
    this.body.setSize(20, 10).setOffset(6, 54);
    this.setDepth(y);

    this.maxHp = BOSS.hp;
    this.hp = BOSS.hp;

    this.homeX = x;
    this.homeY = y;
    this.driftAngle = 0;
    this.nextDriftAt = 0;
    this.heldUntil = 0; // 병풍코딩에 붙잡혀 있는 동안
    this.fighting = false;
    this.nextActionAt = 0;
    this.lastPattern = null;
  }

  // 셔터를 지나 보스 구역에 들어서면 호출된다.
  begin() {
    if (this.fighting) return;
    this.fighting = true;
    this.nextActionAt = this.scene.game.loop.time + 1200; // 첫 패턴까지 숨 돌릴 틈
  }

  get raging() {
    return this.hp / this.maxHp <= BOSS.rageAt;
  }

  update() {
    if (!this.fighting || !this.active) return;

    // 훈수를 듣는 동안은 흑막도 꼼짝 못 한다.
    if (this.scene.time.now < this.heldUntil) {
      this.setVelocity(0, 0);
      return;
    }

    this.drift();

    const now = this.scene.game.loop.time;
    if (now >= this.nextActionAt) {
      this.act();
      this.nextActionAt = now + (this.raging ? BOSS.rageInterval : BOSS.actionInterval);
    }
  }

  // 방 안을 자유롭게 떠돈다. 쫓아오지는 않고, 처음 자리에서 driftRange를 넘어가면
  // 되돌아오는 쪽으로 방향을 튼다 — 안 그러면 구석에 처박혀 나오지 않는다.
  drift() {
    const now = this.scene.game.loop.time;

    if (now >= this.nextDriftAt) {
      this.nextDriftAt = now + Phaser.Math.Between(900, 1800);
      this.driftAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    }

    const away = Phaser.Math.Distance.Between(this.x, this.y, this.homeX, this.homeY);
    if (away > BOSS.driftRange) {
      this.driftAngle = Phaser.Math.Angle.Between(this.x, this.y, this.homeX, this.homeY);
    }

    this.setVelocity(Math.cos(this.driftAngle) * BOSS.speed, Math.sin(this.driftAngle) * BOSS.speed);
  }

  // 같은 패턴이 연달아 나오지 않게 하고, 체력이 깎이면 험한 패턴이 자주 나온다.
  pickPattern() {
    const pool = this.raging
      ? ['single', 'triple', 'triple', 'barrage', 'barrage', 'summon']
      : ['single', 'single', 'triple', 'barrage', 'summon'];

    const options = pool.filter((p) => p !== this.lastPattern);
    return Phaser.Utils.Array.GetRandom(options.length ? options : pool);
  }

  act() {
    const pattern = this.pickPattern();
    this.lastPattern = pattern;

    if (pattern === 'single') this.castSingle();
    else if (pattern === 'triple') this.castTriple();
    else if (pattern === 'barrage') this.castBarrage();
    else if (pattern === 'summon') this.castSummon();
  }

  get chestY() {
    return this.y - CHEST_HEIGHT;
  }

  get muzzle() {
    return { x: this.x, y: this.chestY };
  }

  angleToPlayer() {
    const p = this.scene.player;
    return Phaser.Math.Angle.Between(this.muzzle.x, this.muzzle.y, p.x, p.chestY);
  }

  // 1. 한 발씩 노려 쏜다. CSS 추종자와 같은 결이지만 연달아 나온다.
  castSingle() {
    const { shots, gap } = BOSS.patterns.single;
    this.flash('"HTML로 코딩한다!"');

    for (let i = 0; i < shots; i++) {
      this.scene.time.delayedCall(i * gap, () => {
        if (this.active && this.fighting) this.fire(this.angleToPlayer());
      });
    }
  }

  // 2. 부채꼴로 3발. 옆으로 피해야 한다.
  castTriple() {
    const { spread } = BOSS.patterns.triple;
    const base = this.angleToPlayer();
    this.flash('"이게 바로 시맨틱이다!"');
    [-spread, 0, spread].forEach((offset) => this.fire(base + offset));
  }

  // 3. 사방으로 흩뿌린다. 엄폐물 뒤로 숨는 게 정답인 패턴.
  castBarrage() {
    const { count } = BOSS.patterns.barrage;
    const base = this.angleToPlayer();
    this.flash('"div로 다 덮어버리겠다!"');

    for (let i = 0; i < count; i++) {
      this.fire(base + (Math.PI * 2 * i) / count);
    }
  }

  // 4. HTML 추종자를 불러낸다. 이미 많으면 넘기고 다른 패턴을 쓴다.
  castSummon() {
    const { count, max } = BOSS.patterns.summon;
    if (this.scene.enemies.countActive() >= max) {
      this.castTriple();
      return;
    }

    this.flash('"얘들아, 저 불경한 놈을 막아라!"');
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 48;
      this.scene.summonEnemyAt(this.x + offset, this.y + 40, 'html');
    }
  }

  fire(angle) {
    if (!this.active) return;
    this.scene.spawnBossShot(this.muzzle.x, this.muzzle.y, angle);
  }

  // 대사는 추종자들의 외침과 같은 방식으로 머리 위에 띄운다.
  // 하단 힌트로 내보내면 누가 한 말인지 안 보인다.
  flash(line) {
    this.scene.showShout(this, line);
  }

  takeDamage(amount) {
    if (!this.fighting) return; // 전투 시작 전에는 맞지 않는다

    this.hp = Math.max(0, this.hp - amount);
    this.scene.flash(this, 0xffffff);
    this.scene.showDamage(this, amount);

    if (this.hp <= 0) this.defeat();
  }

  defeat() {
    this.fighting = false;
    this.setVelocity(0, 0);

    // 쓰러지는 연출 동안 남은 탄에 맞아 죽는 일이 없도록 즉시 정리한다.
    this.scene.clearHazards();

    // 없애지 않고 무릎을 꿇린다. 엔딩에서 추종자들에게 둘러싸여
    // 진실을 털어놓는 게 이 캐릭터의 마지막 몫이다.
    this.scene.tweens.add({
      targets: this,
      alpha: 0.8,
      duration: 900,
      onComplete: () => this.scene.onBossDefeated(),
    });
  }
}
