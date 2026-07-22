import {
  OFFICE_MAP,
  OFFICE_SPAWN,
  OFFICE_SPAWN_FROM,
  OFFICE_ITEMS,
  OFFICE_PROPS,
} from '../maps/office.js';
import { GameState } from '../state.js';
import { openingOffice, endingOffice } from '../cutscene/scripts.js';
import MapScene from './MapScene.js';

export default class OfficeScene extends MapScene {
  constructor() {
    super('OfficeScene');
  }

  // ★ 맵이름
  get mapName() {
    return '김개발의 사무실';
  }

  create() {
    this.buildMap(OFFICE_MAP, OFFICE_SPAWN, OFFICE_SPAWN_FROM);
    this.spawnProps(OFFICE_PROPS);
    this.spawnItems(OFFICE_ITEMS);

    // 김흑막을 쓰러뜨리고 돌아왔다면 오프닝이 아니라 엔딩이다.
    if (GameState.ending && !GameState.hasWatched('ending-office')) {
      GameState.markWatched('ending-office');
      this.playCutscene(endingOffice());
      return;
    }

    // 오프닝은 게임을 처음 켰을 때 한 번만. 거리에서 되돌아와도 다시 틀지 않는다.
    if (GameState.hasWatched('opening-office')) {
      this.playIntro();
      return;
    }
    GameState.markWatched('opening-office');
    this.playCutscene(openingOffice(), () => this.playIntro());
  }

  // HP가 1로 시작하는 게 버그가 아니라 설정이라는 걸 김개발의 독백으로 먼저 알린다.
  // 사무실을 뒤질 이유도 여기서 만들어 준다.
  playIntro() {
    if (this.sweptOffice()) return; // 다 털고 돌아온 사무실이면 튜토리얼을 다시 틀지 않는다

    const lines = [
      {
        at: 600,
        hold: 4400,
        text: '요 며칠간 야근으로 인해 체력이 너무 떨어졌어. 사무실에 뭔가 없을까?',
      },
      { at: 5500, hold: 3000, text: '방향키로 이동한다' },
      {
        at: 9000,
        hold: 3000,
        text: '책상 위의 키보드부터 챙기자',
        when: () => !GameState.weapon,
      },
    ];

    lines.forEach(({ at, hold, text, when }) => {
      this.time.delayedCall(at, () => {
        if (when && !when()) return;
        this.ui.showHint(text, hold);
      });
    });
  }

  // 튜토리얼을 건너뛰지 않도록 사무실의 세 아이템을 모두 주워야 내보낸다.
  sweptOffice() {
    return OFFICE_ITEMS.every((def) => GameState.hasPicked(def.id));
  }

  onUpdate() {
    const onExit = this.onExitTile();

    // 출구 타일에 새로 올라선 순간에만 반응한다. 매 프레임 힌트가 갱신되면 안 된다.
    if (onExit && !this.wasOnExit) {
      if (this.sweptOffice()) this.goTo('StreetScene');
      else if (!GameState.weapon) this.ui.showHint('맨손으로 나갈 수는 없다. 키보드부터 챙기자', 2400);
      else this.ui.showHint('사무실에 더 쓸만한게 없는지 살펴보자', 2400);
    }
    this.wasOnExit = onExit;
  }
}
