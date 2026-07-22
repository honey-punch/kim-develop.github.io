import Phaser from 'phaser';
import { TILE, T, BOSS } from '../config.js';
import { SECRET } from '../maps/dungeon.js';
import Boss from '../entities/Boss.js';
import Projectile from '../entities/Projectile.js';
import { GameState } from '../state.js';
import { endingSecret } from '../cutscene/scripts.js';
import MapScene from './MapScene.js';

// 흑막의 공간. 아래에서 위로 올라가며 추종자를 처리하고,
// 셔터를 지나면 최상단에서 김흑막과 싸운다.
export default class BossScene extends MapScene {
  constructor() {
    super('SecretScene');
  }

  // ★ 맵이름
  get mapName() {
    return '비밀공간';
  }

  // 흑막의 공간은 식은 세상이다. 사무실과 같은 도트에 팔레트만 차갑다.
  get mood() {
    return 'cold';
  }

  create() {
    this.buildMap(SECRET.map, SECRET.spawn);
    this.spawnItems(SECRET.items);
    this.spawnEnemies(SECRET.enemies);

    // 어둠을 깔고 그 위에 촛불만 켠다. 순서가 바뀌면 빛이 어둠에 묻힌다.
    this.dim(0.55);
    this.spawnCandles(SECRET.candles);

    this.shutterOpen = false;
    this.bossStarted = false;
    this.defeated = false;

    this.bossShots = this.add.group();
    this.hostileShots.push(this.bossShots);

    this.boss = new Boss(this, SECRET.boss.x * TILE + TILE / 2, SECRET.boss.y * TILE + TILE);
    // 자유롭게 떠도는 만큼 벽과 엄폐물에 막혀야 한다.
    this.physics.add.collider(this.boss, this.layer);
    // 보스는 셔터가 열릴 때까지 잠들어 있다.
    this.boss.setAlpha(0.35);

    this.time.delayedCall(600, () =>
      this.ui.showHint('음산한 기운이 위에서 내려온다. 올라가자', 3400)
    );
    this.time.delayedCall(4200, () =>
      this.ui.showHint('책상과 캐비닛 뒤에 숨으면 공격을 막을 수 있다', 3600)
    );
  }

  // 잡몹을 다 잡으면 셔터가 열린다.
  onEnemyCleared() {
    if (this.shutterOpen || this.bossStarted) return;
    if (this.enemies.countActive() > 0) return;

    this.shutterOpen = true;
    SECRET.shutter.cols.forEach((col) => {
      this.layer.putTileAt(T.FLOOR, col, SECRET.shutter.row);
    });
    this.layer.setCollision(T.SHUTTER, false);

    this.ui.showHint('셔터가 열렸다. 위쪽에 무언가 있다', 3200);
  }

  // 보스 구역(셔터 위쪽)에 발을 들이면 전투가 시작된다.
  startBossFight() {
    if (this.bossStarted) return;
    this.bossStarted = true;

    this.boss.setAlpha(1);
    this.boss.begin();
    this.ui.showBossBar(BOSS.name, this.boss);

    this.ui.showHint('"나는 HTML로 코딩한다!"', 3000);
  }

  // 보스 탄도 함께 걷는다.
  clearHazards() {
    super.clearHazards();
    this.bossShots.clear(true, true);
  }

  // 보스는 enemies 그룹 밖에 있으므로 평타와 스킬이 닿도록 대상에 끼워 넣는다.
  damageTargets() {
    const targets = super.damageTargets();
    if (this.boss?.active && this.boss.fighting) targets.push(this.boss);
    return targets;
  }

  spawnBossShot(x, y, angle) {
    const shot = new Projectile(this, x, y, 'proj-boss', {
      damage: BOSS.shot.damage,
      pierce: false,
      lifespan: BOSS.shot.lifespan,
      velocity: {
        x: Math.cos(angle) * BOSS.shot.speed,
        y: Math.sin(angle) * BOSS.shot.speed,
      },
    });
    this.bossShots.add(shot);
  }

  onBossDefeated() {
    this.defeated = true;
    this.ui.hideBossBar();

    // 엔딩 1부. 끝나면 사무실에서 2부가 이어진다.
    this.playCutscene(endingSecret(), () => {
      GameState.ending = true;
      this.scene.start('OfficeScene', {from: this.scene.key});
    });
  }

  onUpdate() {
    if (this.boss?.active) this.boss.update();

    // 셔터 행보다 위로 올라오면 보스 구역이다.
    if (this.shutterOpen && !this.bossStarted && this.player.tileY < SECRET.shutter.row) {
      this.startBossFight();
    }
  }
}
