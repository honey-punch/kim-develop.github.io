import Phaser from 'phaser';

// 김개발의 버그 소환과 CSS 추종자의 원거리 공격이 함께 쓴다.
export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, config) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.damage = config.damage;
    this.pierce = !!config.pierce;
    this.hitTargets = new Set();

    // 판정은 스프라이트와 별개로 잡는다. 스킬마다 맞히기 쉬운 정도를 조절하기 위함이다.
    const hit = config.hitSize ?? 10;
    this.body.setSize(hit, hit, true);
    this.body.setAllowGravity(false);
    this.setDepth(4);
    this.setVelocity(config.velocity.x, config.velocity.y);

    // 날아가는 쪽을 바라본다. 도트가 위를 향해 그려져 있어 90도를 더한다.
    if (config.faceVelocity) {
      this.setRotation(Math.atan2(config.velocity.y, config.velocity.x) + Math.PI / 2);
    }

    // 벽에 막히면 사라진다.
    scene.physics.add.collider(this, scene.layer, () => this.destroy());

    scene.time.delayedCall(config.lifespan, () => {
      if (this.active) this.destroy();
    });
  }

  // 같은 대상을 두 번 때리지 않는다. 관통이 아니면 첫 명중에 사라진다.
  tryHit(target) {
    if (!this.active || this.hitTargets.has(target)) return false;
    this.hitTargets.add(target);
    if (!this.pierce) this.destroy();
    return true;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // 월드를 벗어나면 정리한다.
    const b = this.scene?.physics.world.bounds;
    if (b && (this.x < b.x || this.x > b.right || this.y < b.y || this.y > b.bottom)) {
      this.destroy();
    }
  }
}
