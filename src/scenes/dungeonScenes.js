import {LOBBY, FLOOR2, CHAIRMAN} from '../maps/dungeon.js';
import {createFloorScene} from './FloorScene.js';

export const LobbyScene = createFloorScene({
  key: 'LobbyScene',
  name: '수수께끼의 건물 1층 로비', // ★ 맵이름
  layout: LOBBY,
  next: 'Floor2Scene',
  back: 'StreetScene', // 아래쪽 계단으로 되돌아간다
  clearedText: '로비를 뚫었다. 위층으로 올라가자',
  intro: [
    {at: 600, text: '수수께끼의 건물 1층 로비다', hold: 2600},
    {at: 3400, text: '"저 불경한 녀석을 죽여라!!"', hold: 2600},
  ],
});

export const Floor2Scene = createFloorScene({
  key: 'Floor2Scene',
  name: '2층 사무실', // ★ 맵이름
  layout: FLOOR2,
  next: 'ChairmanScene',
  back: 'LobbyScene',
  clearedText: '2층을 정리했다. 회장실로 올라가자',
  intro: [{at: 600, text: '2층 사무실. 쓸만한 키보드가 있을지도 모른다', hold: 3400}],
});

export const ChairmanScene = createFloorScene({
  key: 'ChairmanScene',
  name: '3층 회장실', // ★ 맵이름
  layout: CHAIRMAN,
  next: 'SecretScene',
  back: 'Floor2Scene',
  clearedText: '회장실을 장악했다. 회장님의 키보드를 챙기자',
  blockedText: '추종자들을 두고 차원문에 들어갈 수는 없다',
  // 전멸시켜도 전설의 키보드를 들지 않으면 차원문이 열리지 않는다.
  requiresItem: 'chairman-legend',
  missingItemText: '회장님의 키보드를 두고 갈 수는 없다',
  intro: [{at: 600, text: '3층 회장실. 추종자들이 몰려 있다', hold: 3400}],
});
