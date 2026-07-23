import Phaser from 'phaser';
import {DEPTH, COMBAT} from './config.js';
import {GameState} from './state.js';
import {bake} from './art/pixel.js';

// 전투에서 눈에 보이는 것들. 판정과는 아무 상관이 없다 —
// 여기서 무엇을 그리든 맞고 안 맞고는 MapScene의 hitArea가 정한다.
// 그래서 연출은 마음껏 과장해도 된다.

// 바닥에 퍼지는 고리. 눕혀서 그려야 바닥에 깔린 것으로 보인다.
export function groundRing(scene, x, y, color) {
  const ring = scene.add
    .circle(x, y, 20, 0xffffff, 0)
    .setStrokeStyle(2, color, 0.9)
    .setScale(0.25, 0.12)
    .setDepth(DEPTH.effect);

  scene.tweens.add({
    targets: ring,
    scaleX: 1.5,
    scaleY: 0.6,
    alpha: 0,
    duration: 340,
    ease: 'Cubic.easeOut',
    onComplete: () => ring.destroy(),
  });
}

// 평타. 들고 있는 키보드를 바라보는 방향으로 훑는다.
// 맨손이면 휘두른 자취만 남는다 — 없는 키보드를 그릴 수는 없으니.
export function keyboardSwing(scene, attacker) {
  const dir = attacker.facingVector;
  const base = Math.atan2(dir.y, dir.x);
  const arc = Math.PI * 0.85;
  const reach = COMBAT.attackReach * 0.5;
  const weapon = GameState.weapon;
  const color = weapon ? weapon.color : 0xd8d8e0;

  const trail = scene.add.graphics({x: attacker.x, y: attacker.chestY}).setDepth(DEPTH.effect);
  trail.lineStyle(3, color, 0.7);
  trail.beginPath();
  trail.arc(0, 0, reach + 10, base - arc / 2, base + arc / 2);
  trail.strokePath();
  scene.tweens.add({
    targets: trail,
    alpha: 0,
    scaleX: 1.25,
    scaleY: 1.25,
    duration: 200,
    onComplete: () => trail.destroy(),
  });

  if (!weapon) return;

  const kb = scene.add
    .image(attacker.x, attacker.chestY, 'item-keyboard')
    .setTint(weapon.color)
    .setScale(0.85)
    .setDepth(DEPTH.effect + 1);

  // 뒤에서 앞으로 돌린다. 각도를 직접 굴려야 호를 그리며 지나간다.
  scene.tweens.addCounter({
    from: -1,
    to: 1,
    duration: 170,
    ease: 'Cubic.easeOut',
    onUpdate: (tween) => {
      const t = tween.getValue();
      const angle = base + (t * arc) / 2;
      kb.setPosition(attacker.x + Math.cos(angle) * reach, attacker.chestY + Math.sin(angle) * reach);
      kb.setRotation(angle);
    },
    onComplete: () => kb.destroy(),
  });
}

// 소리어택(E)에서 음파를 만들어 내는 동작. 키보드를 앞에 들고 타닥거린다.
// 소리가 그냥 생기는 게 아니라 '두들겨서' 나온다는 게 보여야 한다.
export function keyboardRattle(scene, caster) {
  const dir = caster.facingVector;
  const weapon = GameState.weapon;

  const kb = scene.add
    .image(caster.x + dir.x * 20, caster.chestY + dir.y * 12, 'item-keyboard')
    .setScale(0.9)
    .setDepth(DEPTH.effect + 1);
  if (weapon) kb.setTint(weapon.color);

  const baseX = kb.x;
  const baseY = kb.y;

  scene.tweens.addCounter({
    from: 0,
    to: 1,
    duration: 420,
    onUpdate: () => {
      // 매 프레임 조금씩 흔들어 잔진동을 만든다
      kb.setPosition(baseX + Phaser.Math.Between(-2, 2), baseY + Phaser.Math.Between(-2, 2));
    },
    onComplete: () => {
      scene.tweens.add({targets: kb, alpha: 0, duration: 140, onComplete: () => kb.destroy()});
    },
  });

  // 튀어오르는 키캡. 타닥거리는 소리를 눈으로 보여 주는 몫이다.
  for (let i = 0; i < 6; i++) {
    scene.time.delayedCall(i * 60, () => {
      const key = scene.add
        .rectangle(baseX + Phaser.Math.Between(-10, 10), baseY, 3, 3, 0xf2ece0)
        .setDepth(DEPTH.effect + 2);
      scene.tweens.add({
        targets: key,
        y: key.y - Phaser.Math.Between(12, 22),
        alpha: 0,
        duration: 340,
        ease: 'Sine.easeOut',
        onComplete: () => key.destroy(),
      });
    });
  }
}

// 훈수가 끝나고 유령이 흐려지기 시작하는 시각.
// 적을 묶어 두는 시간도 이 값을 그대로 쓴다 — 훈수를 듣는 동안 꼼짝 못 한다.
export const ADVISOR_MS = 1140;
const FADE_AT = ADVISOR_MS;

// 병풍코딩(R). 적 뒤에 나타나 훈수를 두다가 사라진다.
// 예전엔 0.4초 만에 스쳐 지나가 무슨 일이 일어났는지 알 수 없었다.
// depth는 적의 바로 뒤로 넣는다. 이펙트 층에 두면 적을 가려서
// '뒤에 나타났다'가 아니라 앞을 막아선 것처럼 보인다.
// onFade는 훈수가 끝나는 순간 불린다. 여기서 적을 때려야
// '참견을 듣다가 쓰러지는' 순서가 된다 — 먼저 죽여 버리면
// 적은 이미 없는데 김개발만 허공에 대고 떠드는 그림이 남는다.
export function advisorGhost(scene, x, y, depth, onFade) {
  const ghost = scene.add.image(x, y, 'player').setAlpha(0).setDepth(depth);

  scene.time.delayedCall(FADE_AT, () => onFade?.());

  scene.tweens.add({targets: ghost, alpha: 0.9, duration: 140});

  // 1초 남짓 들썩인다. 어깨너머로 참견하는 몸짓.
  scene.tweens.add({
    targets: ghost,
    y: y - 6,
    delay: 140,
    duration: 160,
    yoyo: true,
    repeat: 2,
    ease: 'Sine.easeInOut',
  });

  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    delay: FADE_AT,
    duration: 260,
    onComplete: () => ghost.destroy(),
  });
}

// 키보드 소리어택. 부채꼴 음파가 세 겹으로 번져 나간다.
// 그래픽은 원점(0,0)에 그리고 객체를 옮겨 놓는다. 월드 좌표에 그려 두면
// 확대할 때 도형이 제자리에서 커지지 않고 화면 밖으로 밀려난다.
export function soundWave(scene, x, y, angle, spec) {
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(i * 70, () => {
      const wave = scene.add.graphics({x, y}).setDepth(DEPTH.effect);
      wave.lineStyle(3, 0xffd479, 0.85);
      wave.beginPath();
      wave.arc(0, 0, spec.radius * 0.36, angle - spec.arc / 2, angle + spec.arc / 2);
      wave.strokePath();

      scene.tweens.add({
        targets: wave,
        scaleX: 2.7,
        scaleY: 2.7,
        alpha: 0,
        duration: 320,
        ease: 'Cubic.easeOut',
        onComplete: () => wave.destroy(),
      });
    });
  }
}

// 스킬을 쓰는 순간 몸에서 번지는 빛. 스프라이트를 한 장 더 겹쳐 부풀린다.
export function castGlow(scene, target, color) {
  const glow = scene.add
    .image(target.x, target.y, target.texture.key, target.frame.name)
    .setOrigin(0.5, 1)
    .setFlipX(target.flipX)
    .setTint(color)
    .setAlpha(0.7)
    .setDepth(DEPTH.effect);

  scene.tweens.add({
    targets: glow,
    alpha: 0,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: 320,
    ease: 'Quad.easeOut',
    onComplete: () => glow.destroy(),
  });
}

// 사람이 세상에서 지워지는 연출. 오프닝에서 동료들이 이렇게 사라진다.
// 몸이 위로 떠오르며 흩어지고, 흩어진 알갱이만 잠깐 남는다.
export function vanish(scene, target, color = 0xbfe0f0) {
  groundRing(scene, target.x, target.y, color);
  castGlow(scene, target, color);

  for (let i = 0; i < 12; i++) {
    const bit = scene.add
      .rectangle(
        target.x + Phaser.Math.Between(-13, 13),
        target.y - Phaser.Math.Between(4, 54),
        3,
        3,
        color
      )
      .setDepth(DEPTH.effect + 1);

    scene.tweens.add({
      targets: bit,
      y: bit.y - Phaser.Math.Between(28, 64),
      alpha: 0,
      duration: Phaser.Math.Between(520, 900),
      delay: i * 35,
      ease: 'Sine.easeOut',
      onComplete: () => bit.destroy(),
    });
  }

  // 몸은 떠오르면서 지워진다. 다 지워지면 스스로 없어진다.
  scene.tweens.add({
    targets: target,
    alpha: 0,
    y: target.y - 12,
    duration: 700,
    ease: 'Quad.easeIn',
    onComplete: () => target.destroy(),
  });
}

// 차원문이 열리는 순간.
// 빛이 세로로 찢어지고 → 좌우로 벌어지고 → 주변 먼지가 빨려 들어간 뒤 충격파가 퍼진다.
// 문짝이 열리는 게 아니라 공간이 찢기는 것으로 보여야 한다.
export function portalTear(scene, x, y, width, height) {
  // 1. 한 줄기 빛이 세로로 쭉 늘어난 다음 좌우로 벌어진다.
  const tear = scene.add
    .rectangle(x, y, 4, 6, 0xf2e6ff)
    .setDepth(DEPTH.effect + 2)
    .setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({targets: tear, scaleY: height / 6, duration: 220, ease: 'Cubic.easeOut'});
  scene.tweens.add({
    targets: tear,
    scaleX: (width + 16) / 4,
    delay: 220,
    duration: 260,
    ease: 'Cubic.easeOut',
  });
  scene.tweens.add({
    targets: tear,
    alpha: 0,
    delay: 500,
    duration: 340,
    onComplete: () => tear.destroy(),
  });

  // 2. 주변의 먼지가 문 안으로 빨려 들어간다.
  for (let i = 0; i < 16; i++) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(70, 160);
    const bit = scene.add
      .rectangle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 3, 3, 0xc07fe0)
      .setDepth(DEPTH.effect + 1);

    scene.tweens.add({
      targets: bit,
      x,
      y,
      alpha: 0,
      delay: 180 + i * 22,
      duration: 540,
      ease: 'Cubic.easeIn',
      onComplete: () => bit.destroy(),
    });
  }

  // 3. 다 열린 순간 충격파가 한 번 퍼진다.
  scene.time.delayedCall(480, () => {
    const wave = scene.add
      .circle(x, y, 24, 0xffffff, 0)
      .setStrokeStyle(3, 0xd8ade8, 0.9)
      .setDepth(DEPTH.effect + 1);

    scene.tweens.add({
      targets: wave,
      scale: 5,
      alpha: 0,
      duration: 520,
      ease: 'Cubic.easeOut',
      onComplete: () => wave.destroy(),
    });

    scene.cameras.main.shake(240, 0.005);
  });
}

// 열린 뒤에도 계속 숨쉬는 빛. 타일은 정적이라 이게 없으면 그냥 벽 무늬로 보인다.
export function portalGlow(scene, x, y) {
  const glow = scene.add
    .circle(x, y, 44, 0xc07fe0, 0.22)
    .setDepth(DEPTH.effect - 1)
    .setBlendMode(Phaser.BlendModes.ADD);

  scene.tweens.add({
    targets: glow,
    scale: 1.25,
    alpha: 0.34,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return glow;
}

// 지워졌던 사람이 도로 나타난다. vanish를 거꾸로 돌린 것.
// 엔딩에서 개발자들이 사무실에 뿅 하고 돌아올 때 쓴다.
export function appear(scene, target, color = 0xbfe0f0) {
  const restY = target.y;

  target.setAlpha(0).setY(restY - 12);
  scene.tweens.add({targets: target, alpha: 1, y: restY, duration: 460, ease: 'Quad.easeOut'});

  groundRing(scene, target.x, restY, color);

  for (let i = 0; i < 12; i++) {
    const bit = scene.add
      .rectangle(
        target.x + Phaser.Math.Between(-13, 13),
        restY - Phaser.Math.Between(40, 90),
        3,
        3,
        color
      )
      .setDepth(DEPTH.effect + 1);

    // 위에서 몸으로 모여든다
    scene.tweens.add({
      targets: bit,
      y: restY - Phaser.Math.Between(4, 40),
      alpha: 0,
      duration: Phaser.Math.Between(360, 620),
      delay: i * 28,
      ease: 'Sine.easeIn',
      onComplete: () => bit.destroy(),
    });
  }
}

// 얻어맞을 때 발밑에서 피어오르는 먼지.
export function dustPuff(scene, x, y) {
  for (let i = 0; i < 7; i++) {
    const dir = Phaser.Math.FloatBetween(-1, 1);
    const puff = scene.add
      .circle(x + Phaser.Math.Between(-14, 14), y - Phaser.Math.Between(0, 8), Phaser.Math.Between(3, 6), 0xb9b3a8, 0.5)
      .setDepth(y + 1);

    scene.tweens.add({
      targets: puff,
      x: puff.x + dir * Phaser.Math.Between(14, 30),
      y: puff.y - Phaser.Math.Between(10, 26),
      scale: Phaser.Math.FloatBetween(1.6, 2.4),
      alpha: 0,
      duration: Phaser.Math.Between(420, 760),
      delay: i * 40,
      ease: 'Sine.easeOut',
      onComplete: () => puff.destroy(),
    });
  }
}

// 물방울 도트. 위가 뾰족하고 아래가 둥근 그 모양이다.
// 원을 늘려 쓰면 그냥 타원이라 땀으로 안 읽혀서 따로 그린다.
// prettier-ignore
const DROP = [
  '...oo...',
  '...oo...',
  '..oWWo..',
  '..oWWo..',
  '.oWWWWo.',
  '.oWLWWo.',
  'oWWLWWWo',
  'oWLWWWWo',
  'oWWWWWWo',
  '.oWWWWo.',
  '..oooo..',
];

const DROP_PALETTE = {
  o: 0x4a7f9c, // 테두리
  W: 0x9fd4e8, // 물
  L: 0xeaf8ff, // 빛나는 부분
};

// 머리 위로 내려와 맺히는 땀방울. 말문이 막혔을 때.
// 지우기 전까지 그대로 붙어 있으므로 돌려받은 것을 들고 있다가 없애야 한다.
export function sweatDrop(scene, x, y, delay = 0) {
  if (!scene.textures.exists('sweat-drop')) {
    bake(scene, 'sweat-drop', DROP, DROP_PALETTE);
  }

  const drop = scene.add
    .image(x, y - 40, 'sweat-drop')
    .setDepth(DEPTH.effect)
    .setAlpha(0);

  // 위에서 스르르 내려와 살짝 튕기고 멈춘다.
  scene.tweens.add({targets: drop, alpha: 1, duration: 200, delay});
  scene.tweens.add({
    targets: drop,
    y,
    duration: 620,
    delay,
    ease: 'Bounce.easeOut',
  });

  return drop;
}

// 포션. 발밑에서 알갱이가 몸을 타고 올라가고 기운이 한 번 돈다.
export function potionBurst(scene, target, color) {
  groundRing(scene, target.x, target.y, color);
  castGlow(scene, target, color);

  for (let i = 0; i < 9; i++) {
    const bit = scene.add
      .rectangle(target.x + Phaser.Math.Between(-14, 14), target.y - 4, 3, 3, color)
      .setDepth(DEPTH.effect + 1);

    scene.tweens.add({
      targets: bit,
      y: target.y - Phaser.Math.Between(52, 78),
      alpha: 0,
      duration: Phaser.Math.Between(420, 680),
      delay: i * 45,
      ease: 'Sine.easeOut',
      onComplete: () => bit.destroy(),
    });
  }
}
