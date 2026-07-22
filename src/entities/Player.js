import Phaser from 'phaser';
import {PLAYER_SPEED, COMBAT, CHEST_HEIGHT} from '../config.js';
import {GameState, SKILLS} from '../state.js';
import {playFacing} from '../art/hero.js';

const FACING_VECTOR = {
  up: {x: 0, y: -1},
  down: {x: 0, y: 1},
  left: {x: -1, y: 0},
  right: {x: 1, y: 0},
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player-down-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1);
    // 발밑만 충돌시켜야 위쪽 타일에 머리가 걸리지 않는다.
    // 스프라이트는 32x64지만 실제로 자리를 차지하는 건 신발이 놓인 이 사각형뿐이다.
    this.body.setSize(20, 10).setOffset(6, 54);
    this.setCollideWorldBounds(true);

    this.shadow = scene.addShadow(this);

    this.facing = 'down';
    this.attackReadyAt = 0;
    this.invulnUntil = 0;
    this.collapsedUntil = 0;
    this.reviving = false;

    // 이동은 방향키만 쓴다. WASD는 QWER 전투키와 손이 겹쳐 스킬 쪽에 내줬다.
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    // 평타(Q)를 뺀 나머지가 스킬. 순서대로 W, E, R에 붙는다.
    this.skillKeys = SKILLS.filter((s) => s.id !== 'basic').map((skill) => ({
      skill,
      key: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[skill.key]),
    }));
  }

  get collapsed() {
    return this.scene.time.now < this.collapsedUntil;
  }

  get invulnerable() {
    // 쓰러진 동안과 HP가 회복 기준선에 닿기 전까지는 무적이다.
    return this.reviving || this.collapsed || this.scene.time.now < this.invulnUntil;
  }

  update(delta) {
    this.regen(delta);
    this.scene.sortDepth(this);

    if (this.collapsed) {
      this.setAngle(90); // 쓰러진 자세
      this.anims.play('player-idle-side', true);
      this.setVelocity(0, 0);
      return;
    }

    // 자세 복구를 별도 타이머에 맡기면 시계가 어긋나 누운 채로 움직이게 된다.
    if (this.angle !== 0) this.setAngle(0);

    this.move();

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) this.attack();

    this.skillKeys.forEach(({skill, key}) => {
      if (Phaser.Input.Keyboard.JustDown(key)) this.useSkill(skill);
    });
  }

  useSkill(skill) {
    if (!GameState.hasSkill(skill)) {
      this.scene.ui.showHint(`${skill.name}은 Lv.${skill.level}에 배운다`, 1500);
      return;
    }
    // 쿨타임은 스킬마다 따로 돈다. 남아 있으면 조용히 무시한다(하단 UI가 남은 시간을 보여 준다).
    const now = this.scene.game.loop.time;
    if (now < (GameState.cooldownUntil[skill.id] ?? 0)) return;

    // DP가 모자라면 평타만 가능하다.
    if (GameState.dp < skill.dp) {
      this.scene.ui.showHint('DP가 부족하다. 평타로 버티자', 1500);
      return;
    }

    GameState.dp -= skill.dp;
    GameState.cooldownUntil[skill.id] = now + skill.cooldown;
    this.scene.castSkill(skill, this);
  }

  move() {
    const c = this.cursors;

    const vx = (c.right.isDown ? 1 : 0) - (c.left.isDown ? 1 : 0);
    const vy = (c.down.isDown ? 1 : 0) - (c.up.isDown ? 1 : 0);

    this.setVelocity(vx, vy);
    this.body.velocity.normalize().scale(PLAYER_SPEED);

    playFacing(this, 'player', vx, vy);
  }

  regen(delta) {
    const sec = delta / 1000;

    if (GameState.dp < GameState.maxDp) {
      GameState.dp = Math.min(GameState.maxDp, GameState.dp + COMBAT.dpRegenPerSec * sec);
    }

    // HP는 쓰러진 뒤 회복 구간에서만 찬다.
    if (!this.reviving) return;

    GameState.hp = Math.min(GameState.maxHp, GameState.hp + COMBAT.hpRegenPerSec * sec);
    if (GameState.hp >= COMBAT.reviveHp) this.reviving = false;
  }

  // 바라보는 방향 앞의 사각형. 여기 겹치는 적이 맞는다.
  attackArea() {
    const dir = FACING_VECTOR[this.facing];
    const cx = this.x + dir.x * COMBAT.attackReach * 0.5;
    const cy = this.chestY + dir.y * COMBAT.attackReach * 0.5;

    const horizontal = dir.x !== 0;
    const w = horizontal ? COMBAT.attackReach : COMBAT.attackWidth;
    const h = horizontal ? COMBAT.attackWidth : COMBAT.attackReach;

    return new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
  }

  attack() {
    if (this.scene.time.now < this.attackReadyAt) return;
    this.attackReadyAt = this.scene.time.now + COMBAT.attackCooldown;

    const damage = GameState.weapon ? GameState.weapon.damage : 2;
    this.scene.resolveAttack(this.attackArea(), damage);
    // 연출은 판정 사각형이 아니라 김개발을 보고 그린다. 바라보는 방향으로 휘둘러야 하니까.
    this.scene.showSwing(this);
  }

  takeDamage(amount, source) {
    if (this.invulnerable) return false;

    GameState.hp = Math.max(0, GameState.hp - amount);
    this.invulnUntil = this.scene.time.now + COMBAT.hitInvuln;

    if (source) {
      const angle = Phaser.Math.Angle.Between(source.x, source.y, this.x, this.y);
      this.setVelocity(Math.cos(angle) * COMBAT.knockback, Math.sin(angle) * COMBAT.knockback);
    }

    this.scene.flash(this, 0xff5566);

    if (GameState.hp <= 0) this.collapse();
    return true;
  }

  collapse() {
    this.collapsedUntil = this.scene.time.now + COMBAT.collapseMs;
    this.reviving = true;
    this.setVelocity(0, 0);
    this.setAngle(90);
    this.scene.ui.showHint('쓰러졌다... 죽은척 하며 체력을 회복하자.', 2200);
  }

  get facingVector() {
    return FACING_VECTOR[this.facing];
  }

  // 가슴 높이. 발밑이 기준점이라 공격 판정과 탄은 이만큼 올려서 쏜다.
  get chestY() {
    return this.y - CHEST_HEIGHT;
  }

  get tileX() {
    return Math.floor(this.x / 32);
  }

  get tileY() {
    return Math.floor((this.y - 4) / 32);
  }
}
