import Phaser from 'phaser';
import { COMBAT, ENEMY_TYPES, CHEST_HEIGHT } from '../config.js';
import { EXP_REWARD, GameState } from '../state.js';
import { playFacing } from '../art/hero.js';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, typeId) {
    super(scene, x, y, 'follower-down-0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.facing = 'down';
    this.stats = ENEMY_TYPES[typeId];
    this.hp = this.stats.hp;
    this.attackReadyAt = 0;
    this.shoutReadyAt = 0;
    this.knockedUntil = 0;
    this.rangedReadyAt = 0;
    this.heldUntil = 0; // 병풍코딩에 붙잡혀 있는 동안

    this.setOrigin(0.5, 1);
    this.body.setSize(20, 10).setOffset(6, 54);
    this.setCollideWorldBounds(true);
    if (this.stats.tint !== 0xffffff) this.setTint(this.stats.tint);

    this.shadow = scene.addShadow(this);
  }

  // 가슴 높이. 김개발과 같은 그림을 쓰므로 기준도 같다.
  get chestY() {
    return this.y - CHEST_HEIGHT;
  }

  update() {
    const player = this.scene.player;
    if (!player?.active) return;

    this.scene.sortDepth(this);

    // 컷신이 도는 동안과 씬을 넘어가는 동안은 얼어 있는다.
    // 김개발은 조작을 뺏긴 상태라 그동안 맞고만 있게 된다.
    if (this.scene.transitioning) {
      this.setVelocity(0, 0);
      return;
    }

    // 훈수를 듣는 동안에도 꼼짝 못 한다. 붙잡아 두지 않으면
    // 훈수가 끝나기도 전에 김개발에게 달라붙어 때리고 있다.
    if (this.scene.time.now < this.heldUntil) {
      this.setVelocity(0, 0);
      return;
    }

    // 넉백으로 밀려나는 동안은 스스로 움직이지 않는다.
    if (this.scene.time.now < this.knockedUntil) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist > this.stats.aggro) {
      this.setVelocity(0, 0);
      playFacing(this, 'follower', 0, 0);
      return;
    }

    this.shout();

    if (dist <= this.stats.attackRange) {
      this.setVelocity(0, 0);
      playFacing(this, 'follower', 0, 0);
      this.tryAttack(player);
      return;
    }

    // CSS 타입은 붙기 전에도 원거리로 견제한다.
    if (this.stats.rangedDamage && dist <= this.stats.rangedRange) this.tryRanged(player);

    this.scene.physics.moveToObject(this, player, this.stats.speed);
    playFacing(this, 'follower', this.body.velocity.x, this.body.velocity.y);
  }

  // 'HTML'만 말할 수 있는 추종자들. 너무 자주 외치면 시끄러우니 간격을 둔다.
  shout() {
    if (this.scene.time.now < this.shoutReadyAt) return;
    this.shoutReadyAt = this.scene.time.now + Phaser.Math.Between(2200, 4200);
    this.scene.showShout(this, this.stats.word);
  }

  tryRanged(player) {
    if (this.scene.time.now < this.rangedReadyAt) return;
    this.rangedReadyAt = this.scene.time.now + this.stats.rangedCooldown;
    this.scene.spawnEnemyShot(this, player);
  }

  tryAttack(player) {
    if (this.scene.time.now < this.attackReadyAt) return;
    this.attackReadyAt = this.scene.time.now + this.stats.attackCooldown;
    player.takeDamage(this.stats.damage, this);
  }

  takeDamage(amount, fromX, fromY) {
    this.hp -= amount;
    this.scene.flash(this, 0xffffff);
    this.scene.showDamage(this, amount);

    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
    this.setVelocity(Math.cos(angle) * COMBAT.knockback, Math.sin(angle) * COMBAT.knockback);
    this.knockedUntil = this.scene.time.now + 180;

    if (this.hp <= 0) this.die();
  }

  die() {
    // 맵에 원래 있던 개체만 기록한다. 보스가 불러낸 추종자는 spawnId가 없다.
    if (this.spawnId) GameState.markKilled(this.spawnId);

    // 먼저 없앤 뒤에 알린다. 살아 있는 채로 알리면 남은 적을 세는 쪽이 자신을 포함해 버린다.
    const { x, y } = this;
    const scene = this.scene;
    this.shadow.destroy();
    this.destroy();
    scene.onEnemyDefeated(x, y, EXP_REWARD[this.stats.id]);
  }
}
