import { bakeHuman, createHumanAnims } from './art/hero.js';
import { bakeTiles } from './art/tiles.js';
import { bakeItems } from './art/items.js';
import { bakePortraits } from './art/portraits.js';
import { bakePanels } from './art/panels.js';
import { bakeGod } from './art/god.js';
import { bakeProjectiles } from './art/projectiles.js';
import { bakeBoss } from './art/boss.js';
import { HERO, FOLLOWER, COLLEAGUES } from './art/palette.js';

// 모든 그래픽을 코드로 그린다. 외부 이미지 에셋은 쓰지 않는다.
//
// 캐릭터·타일·아이템은 src/art/ 로 옮겨 아스키 아트로 그린다(스타듀밸리 눈금).
// 스킬 아이콘·탄·보스는 아직 여기 남은 옛 방식이라, 옮기기 전까지 도트가 더 잘다.

export function createBossTextures(scene) {
  bakeBoss(scene);

  // 보스 탄. 추종자 탄과 구분되게 붉은보라색.
  const p = scene.make.graphics({ x: 0, y: 0, add: false });
  p.fillStyle(0x7a2b52);
  p.fillRect(1, 1, 12, 12);
  p.fillStyle(0xd6455d);
  p.fillRect(3, 3, 8, 8);
  p.fillStyle(0xffc4d2);
  p.fillRect(5, 5, 4, 4);
  p.generateTexture('proj-boss', 14, 14);
  p.destroy();
}

function makeSkillIcons(scene) {
  const icon = (key, draw) => {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, 20, 20);
    g.destroy();
  };

  // 평타: 키보드를 휘두른다
  icon('skill-basic', (g) => {
    g.fillStyle(0xd8d8e0);
    g.fillRect(1, 10, 14, 6);
    g.fillStyle(0x8a8a96);
    for (let i = 0; i < 4; i++) g.fillRect(3 + i * 3, 12, 2, 2);
    g.fillStyle(0xffd479);
    g.fillRect(15, 2, 2, 6);
    g.fillRect(13, 4, 6, 2);
  });

  // 버그 소환: 벌레
  icon('skill-bug', (g) => {
    g.fillStyle(0x3d7a2c);
    g.fillRect(2, 8, 4, 1);
    g.fillRect(14, 8, 4, 1);
    g.fillRect(2, 13, 4, 1);
    g.fillRect(14, 13, 4, 1);
    g.fillStyle(0x6fbf4f);
    g.fillRect(6, 6, 8, 11);
    g.fillRect(7, 2, 6, 4);
    g.fillStyle(0x14141c);
    g.fillRect(8, 3, 1, 1);
    g.fillRect(11, 3, 1, 1);
  });

  // 키보드 소리어택: 부채꼴로 퍼지는 음파
  icon('skill-sound', (g) => {
    g.fillStyle(0xd8d8e0);
    g.fillRect(1, 7, 5, 6);
    g.lineStyle(2, 0xffd479);
    [4, 8, 12].forEach((r) => {
      g.beginPath();
      g.arc(6, 10, r, -Math.PI / 3, Math.PI / 3);
      g.strokePath();
    });
  });

  // 병풍코딩: 뒤에서 둘러싸는 화면들
  icon('skill-screen', (g) => {
    g.fillStyle(0x8a8a96);
    g.fillRect(1, 5, 5, 11);
    g.fillRect(7, 2, 6, 14);
    g.fillRect(14, 5, 5, 11);
    g.fillStyle(0x2f2f3a);
    g.fillRect(2, 6, 3, 8);
    g.fillRect(8, 3, 4, 11);
    g.fillRect(15, 6, 3, 8);
  });
}

function makeProjectiles(scene) {
  // 버그 소환(W)의 벌레는 art/projectiles.js로 옮겼다.

  // CSS 추종자의 원거리 공격
  const css = scene.make.graphics({ x: 0, y: 0, add: false });
  css.fillStyle(0x6fa8dc);
  css.fillRect(2, 2, 8, 8);
  css.fillStyle(0xbcd9f2);
  css.fillRect(4, 4, 4, 4);
  css.generateTexture('proj-css', 12, 12);
  css.destroy();
}

export function createTextures(scene) {
  bakeTiles(scene);
  bakeItems(scene);

  // 김개발과 추종자는 같은 그림에 팔레트만 다르다.
  // 사원증 색을 옷 색으로 맞춰 두면 추종자에게서는 명찰이 저절로 사라진다.
  bakeHuman(scene, 'player', HERO);
  bakeHuman(scene, 'follower', FOLLOWER);
  createHumanAnims(scene, 'player');
  createHumanAnims(scene, 'follower');

  // 오프닝에서 사라지는 동료들. 이들도 같은 그림이다.
  COLLEAGUES.forEach((palette, i) => bakeHuman(scene, `mate${i}`, palette));

  bakePortraits(scene);
  bakePanels(scene);
  bakeGod(scene);
  bakeProjectiles(scene);

  makeProjectiles(scene);
  makeSkillIcons(scene);
  createBossTextures(scene);
}
