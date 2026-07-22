import Phaser from 'phaser';
import { VIEW_WIDTH, VIEW_HEIGHT } from './config.js';
import { GameState } from './state.js';
import BootScene from './scenes/BootScene.js';
import OfficeScene from './scenes/OfficeScene.js';
import StreetScene from './scenes/StreetScene.js';
import { LobbyScene, Floor2Scene, ChairmanScene } from './scenes/dungeonScenes.js';
import BossScene from './scenes/BossScene.js';
import UIScene from './scenes/UIScene.js';
import CutsceneScene from './cutscene/CutsceneScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  backgroundColor: '#0b0b10',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 } },
  },
  scene: [
    BootScene,
    OfficeScene,
    StreetScene,
    LobbyScene,
    Floor2Scene,
    ChairmanScene,
    BossScene,
    UIScene,
    CutsceneScene,
  ],
});

// 개발 중 콘솔에서 씬과 스탯을 들여다보고 값을 바꿔보기 위한 통로. 빌드에는 포함되지 않는다.
if (import.meta.env.DEV) {
  // 지금 돌고 있는 맵 씬(사무실/거리/던전)
  const map = () => game.scene.getScenes(true).find((s) => s.player);

  const dev = {
    get scene() {
      return map();
    },
    get player() {
      return map()?.player;
    },

    // dev.go('Floor2Scene') — 원하는 곳으로 바로 이동
    go(key) {
      map()?.scene.start(key);
    },

    // dev.tp(20, 6) — 타일 좌표로 순간이동
    tp(tileX, tileY) {
      map()?.player.body.reset(tileX * 32 + 16, tileY * 32 + 32);
    },

    // dev.lv(5) — 원하는 레벨로. 스킬 해금도 같이 맞춘다
    lv(level) {
      GameState.reset();
      GameState.unlockSkill('bug');
      while (GameState.level < level && GameState.gainExp(50) >= 0) {
        if (GameState.level >= level) break;
      }
      GameState.hp = GameState.maxHp;
      GameState.dp = GameState.maxDp;
      return GameState.level;
    },

    // dev.god() — 안 죽게. 한 번 더 부르면 해제
    god() {
      const p = map()?.player;
      if (!p) return;
      p.godMode = !p.godMode;
      if (p.godMode) {
        p._takeDamage = p.takeDamage;
        p.takeDamage = () => false;
      } else {
        p.takeDamage = p._takeDamage;
      }
      return p.godMode;
    },

    // dev.clear() — 현재 맵의 적을 전부 없앤다
    clear() {
      map()?.enemies.clear(true, true);
    },

    // dev.kit() — 무기와 포션을 채운다
    kit() {
      GameState.giveWeapon('legend');
      GameState.potions.supplement = 9;
      GameState.potions.americano = 9;
    },
  };

  Object.assign(window, { game, GameState, dev });

  console.log(
    '%c개발 모드',
    'color:#7df9a6;font-weight:bold',
    '\n  ` 키: 화면 디버그 오버레이 켜기/끄기' +
      '\n  dev.go("Floor2Scene") / dev.tp(20,6) / dev.lv(5)' +
      '\n  dev.god() / dev.clear() / dev.kit()' +
      '\n  game, GameState 도 바로 쓸 수 있습니다'
  );
}
