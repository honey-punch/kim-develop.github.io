import { GameState } from '../state.js';
import { T, TILE } from '../config.js';
import { portalTear, portalGlow } from '../effects.js';
import MapScene from './MapScene.js';

// 던전의 각 층은 구조가 같다. 맵과 배치만 다른 씬을 설정으로 찍어낸다.
export function createFloorScene(config) {
  return class extends MapScene {
    constructor() {
      super(config.key);
    }

    // ★ 맵이름. 층마다 dungeonScenes.js의 설정에서 넘어온다.
    get mapName() {
      return config.name ?? '';
    }

    create() {
      this.buildMap(config.layout.map, config.layout.spawn, config.layout.spawnFrom);
      this.spawnItems(config.layout.items);
      this.spawnEnemies(config.layout.enemies);

      // 이미 다 잡고 되돌아온 층이면 처음부터 열려 있다.
      // 설정의 적 목록이 아니라 실제로 살아 있는 수를 봐야 한다.
      this.cleared = this.enemies.countActive() === 0;
      this.portalOpen = false;

      (config.intro ?? []).forEach(({ at, text, hold }) => {
        this.time.delayedCall(at, () => this.ui.showHint(text, hold ?? 3200));
      });
    }

    onEnemyCleared() {
      if (this.cleared || this.enemies.countActive() > 0) return;
      this.cleared = true;
      if (config.clearedText) this.ui.showHint(config.clearedText, 3200);
    }

    // 층마다 나가기 전에 챙겨야 할 물건이 있을 수 있다.
    hasRequiredItem() {
      return !config.requiresItem || GameState.hasPicked(config.requiresItem);
    }

    // 차원문은 처음엔 없다. 전멸시키고 필수 아이템까지 챙겨야 벽이 뚫린다.
    // 출구가 처음부터 보이면 '아직 못 나간다'는 안내를 반복해서 읽게 될 뿐이다.
    openPortal() {
      const portal = config.layout.portal;
      if (!portal || this.portalOpen) return;
      if (!this.cleared || !this.hasRequiredItem()) return;

      this.portalOpen = true;
      portal.cols.forEach((col) => this.layer.putTileAt(T.PORTAL, col, portal.row));

      const cx = ((portal.cols[0] + portal.cols.at(-1) + 1) / 2) * TILE;
      const cy = portal.row * TILE + TILE / 2;
      const width = portal.cols.length * TILE;

      // 찢기며 열리는 순간 + 열린 뒤에도 계속 숨쉬는 빛.
      // 타일은 정적이라 빛이 없으면 그냥 벽 무늬로 보인다.
      portalTear(this, cx, cy, width, TILE);
      portalGlow(this, cx, cy);

      this.ui.showHint(config.portalText ?? '벽이 갈라지며 차원문이 열렸다', 3200);
    }

    onUpdate() {
      this.openPortal();

      // 아래쪽 계단은 왔던 곳으로 되돌아간다. 잡은 몬스터는 되살아나지 않는다.
      if (config.back && this.player.tileY >= config.layout.map.length - 1) {
        this.goTo(config.back);
        return;
      }

      if (!config.next) return;

      const onExit = this.onExitTile();

      // 전멸 + 필수 아이템을 둘 다 갖춰야 넘어갈 수 있다.
      // 경험치와 무기를 건너뛰지 못하게 하는 장치이기도 하다.
      if (onExit && !this.wasOnExit) {
        if (!this.cleared) {
          this.ui.showHint(config.blockedText ?? '아직 추종자들이 남아 있다', 2200);
        } else if (!this.hasRequiredItem()) {
          this.ui.showHint(config.missingItemText ?? '아직 챙기지 않은 것이 있다', 2600);
        } else {
          this.goTo(config.next);
        }
      }
      this.wasOnExit = onExit;
    }
  };
}
