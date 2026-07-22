import { STREET_MAP, STREET_SPAWN, STREET_SPAWN_FROM, STREET_ENEMIES } from '../maps/street.js';
import { GameState, SKILLS } from '../state.js';
import { openingStreet } from '../cutscene/scripts.js';
import MapScene from './MapScene.js';

export default class StreetScene extends MapScene {
  constructor() {
    super('StreetScene');
  }

  // ★ 맵이름
  get mapName() {
    return '회사 앞 거리';
  }

  create() {
    this.buildMap(STREET_MAP, STREET_SPAWN, STREET_SPAWN_FROM);
    this.spawnEnemies(STREET_ENEMIES);
    // 이미 다 잡고 되돌아온 거리면 처음부터 길이 트여 있다.
    this.cleared = this.enemies.countActive() === 0;
    this.kills = 0;

    // 거리에 처음 나섰을 때 한 번만. 되돌아와도 다시 틀지 않는다.
    if (GameState.hasWatched('opening-street')) {
      this.playIntro();
      return;
    }
    GameState.markWatched('opening-street');
    this.playCutscene(openingStreet(), () => this.playIntro());
  }

  // 컷신이 끝난 뒤 전투 조작을 알려 준다.
  playIntro() {
    this.time.delayedCall(400, () =>
      this.ui.showHint('Q키를 이용해서 키보드로 적들을 공격하세요.', 4000)
    );
    this.time.delayedCall(5000, () => {
      if (!this.cleared) this.ui.showHint('거리 오른쪽 끝에 수수께끼의 건물이 있다', 3200);
    });
  }

  onEnemyKilled() {
    this.kills += 1;

    // 두 번째 적을 잡으면 첫 스킬을 열어 준다.
    if (this.kills >= 2 && GameState.unlockSkill('bug')) {
      this.ui.queueSkillDialog(SKILLS.find((s) => s.id === 'bug'));
    }
  }

  onEnemyCleared() {
    if (this.cleared || this.enemies.countActive() > 0) return;
    this.cleared = true;
    this.ui.showHint('길이 트였다. 오른쪽 끝 건물로 들어가자', 3200);
  }

  onUpdate() {
    const onExit = this.onExitTile();

    if (onExit && !this.wasOnExit) {
      // 왼쪽 끝은 방금 나온 사무실로 되돌아가는 문이다.
      if (this.player.tileX <= 1) this.goTo('OfficeScene');
      else if (this.cleared) this.goTo('LobbyScene');
      else this.ui.showHint('추종자들이 길을 막고 있다', 2200);
    }
    this.wasOnExit = onExit;
  }
}
