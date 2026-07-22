import Phaser from 'phaser';
import {TILE, DEPTH} from '../config.js';
import {COLLEAGUES} from '../art/palette.js';
import {faceIdle} from '../art/hero.js';
import {vanish, appear} from '../effects.js';

// 컷신 대본. 한 줄이 한 컷이다.
//
//   panel    화면을 채우는 배경 그림
//   portrait 얼굴 클로즈업
//   camera   {x, y, zoom, duration} — 아래 맵을 이 타일 좌표로 비춘다
//   who/text 대사. text가 있으면 키를 누를 때까지 기다린다
//   hold     대사가 없는 컷이 머무는 시간(ms)
//   do       그 순간 세상에 벌어지는 일. 건너뛸 때도 이것만은 실행된다
//
// do는 반드시 '몇 번을 실행해도 같은 결과'여야 한다. 건너뛰기가
// 남은 컷의 do를 몰아서 돌리기 때문이다.

// 책상은 세 줄(2·3행, 6·7행, 10·11행)이고 앉는 자리는 그 바로 아래 칸이다.
// 자리는 스물넷인데 넷만 찼다 — 야근하는 사무실은 원래 그렇게 듬성듬성하다.
// 한 줄로 세우면 회의하는 것처럼 보여서 줄과 칸을 모두 어긋나게 흩어 놓았다.
//
// 김개발도 그중 하나다. 이 장면은 '평범한 야근'이어야 하니까.
const KIM_SEAT = {x: 9, y: 8};
const MATE_SEATS = [
  {x: 13, y: 8}, // 김개발 건너편 책상
  {x: 4, y: 12}, // 아래쪽 왼편
  {x: 18, y: 4}, // 위쪽 오른편, 창가
];

export function openingOffice() {
  // 컷 사이에 넘겨야 하는 것들은 대본 안에 가둬 둔다.
  const mates = [];

  // 책상을 향해 앉힌다. 뒤통수가 보여야 일하는 중으로 읽힌다.
  const seatEveryone = (stage) => {
    stage.player.body.reset(KIM_SEAT.x * TILE + TILE / 2, KIM_SEAT.y * TILE + TILE);
    stage.player.facing = 'up';
    stage.player.anims.play('player-idle-up', true);
    stage.sortDepth(stage.player);

    if (mates.length) return;
    MATE_SEATS.forEach((seat, i) => {
      const sprite = stage.add
        .image(seat.x * TILE + TILE / 2, seat.y * TILE + TILE, `mate${i}-up-0`)
        .setOrigin(0.5, 1)
        .setDepth(seat.y * TILE + TILE);
      mates.push(sprite);
    });
  };

  // 눈앞에서 지워진다. vanish가 연출을 끝낸 뒤 스스로 없앤다.
  // 건너뛰는 중이라면 연출은 건너뛰고 결과만 남긴다 — 안 그러면
  // 게임이 시작된 뒤에 동료들이 뒤늦게 사라진다.
  const vanishMates = (stage, director) => {
    mates.forEach((m) => (director.skipping ? m.destroy() : vanish(stage, m)));
    mates.length = 0;
  };

  // 혼자 남은 걸 알아채고 좌우를 둘러본다.
  const lookAround = (stage, director) => {
    [
      ['left', 0],
      ['right', 600],
      ['left', 1200],
      ['down', 1800],
    ].forEach(([facing, at]) =>
      // 컷신 씬의 시계에 걸어야 건너뛰었을 때 같이 사라진다.
      director.time.delayedCall(at, () => {
        if (stage.player.active) faceIdle(stage.player, 'player', facing);
      })
    );
  };

  return [
    // 사무실 전경. 얼굴을 들이대지 않고 자막으로만 분위기를 깐다.
    {
      do: (stage) => seatEveryone(stage),
      camera: {x: 11, y: 8, zoom: 1.6},
      hold: 1800,
    },
    {text: '타닥타닥, 타닥타닥...', hold: 2000},
    {who: '김개발', text: '하... 이놈의 일은 언제 끝나는거야...', hold: 2800},

    // 수상한 건물에 어두운 구름이 모여들고, 그 위로 번개가 친다
    {storm: true, hold: 4400},

    // 다시 사무실. 창밖으로 번개가 친다. 여기서도 얼굴은 잡지 않는다.
    {camera: {x: 11, y: 6, zoom: 1.8}, hold: 1000},
    {
      do: (stage, director) => director.lightning(2),
      camera: {x: 11, y: 2, zoom: 1.8, duration: 700},
      hold: 1400,
    },
    // 정전
    {
      do: (stage, director) => director.blackout(true),
      hold: 2300,
    },
    // 불이 들어온다. 아직 동료들은 자리에 있다.
    // 빈 책상이 같이 보여야 '사라졌다'가 읽히므로 너무 붙지 않는다.
    {
      do: (stage, director) => director.blackout(false, 700),
      camera: {x: 11, y: 8, zoom: 1.8},
      hold: 1000,
    },
    // 그리고 눈앞에서 지워진다
    {do: (stage, director) => vanishMates(stage, director), hold: 1600},
    // 혼자 남은 걸 알아채고 두리번거린다
    {do: (stage, director) => lookAround(stage, director), hold: 2400},

    {
      portrait: 'face-kim-shock',
      who: '김개발',
      text: '젠장, 클라이언트들을 위해 개발중이었는데...!',
    },
    {
      portrait: 'face-kim',
      who: '김개발',
      text: '나 혼자 개발할 수는 없어... 모두를 되찾아야해...!',
    },
    {
      portrait: 'face-kim',
      who: '김개발',
      text: '일단 거리로 나가보자.',
    },
  ];
}

export const COLLEAGUE_KEYS = COLLEAGUES.map((_, i) => `mate${i}`);

// 2) 거리. 회사에서 나와 수수께끼의 건물을 마주하는 장면.
// 건물을 등지고 선 뒤통수 컷은 맵으로는 못 만든다(거리가 가로로 길어 옆모습만 나온다).
// 그래서 폭풍 배경 위에 김개발의 뒷모습을 세워 만든다.
// 건물(화면 가운데)을 가리지 않게 왼쪽에 세우고, 역광이라 어둡게 눌러 둔다.
//
// 다리(텍스처 아래 12px)는 아예 잘라내고 그만큼 내려서 상반신만 남긴다.
// 대사창이 가려 주겠거니 하고 두면 대사 없는 컷에서 다리가 그대로 드러난다.
// y는 잘린 밑단이 놓이는 자리 — 레터박스 바로 위다.
const KIM_BACK = {
  key: 'player-up-0',
  x: 310,
  y: 640,
  scale: 8,
  tint: 0x7a8296,
  cropBottom: 12,
};

export function openingStreet() {
  return [
    // 어두운 구름이 낀 건물을 바라보는 김개발의 뒤통수
    {storm: true, figures: [KIM_BACK], hold: 3200},
    {keep: true, who: '김개발', text: '저기에 가면 모든 비밀을 알 수 있을까?'},

    // 건물에서 엄청 큰 목소리가 들린다
    {
      keep: true,
      do: (stage, director) => director.strike(862),
      who: '???',
      text: '나는 HTML로 프로그래밍한다!!!',
    },

    // 당황한 김개발
    {portrait: 'face-kim-shock', who: '김개발', text: '...???? HTML은 프로그래밍 언어가 아니야!!!'},
    {portrait: 'face-kim', who: '김개발', text: '앗? 내가 무의식적으로 무슨말을...?'},

    // 앞을 가로막는 추종자들. 맵에 이미 서 있는 둘을 카메라로 잡는다.
    //
    // 원래는 여기서 한 컷 쉬고 다시 카메라를 밀며 한 컷 더 쉬어 2.8초가 비었다.
    // 대사도 그림 변화도 없는 시간이라 멈춘 것처럼 보였다. 한 컷으로 합치고
    // 카메라도 곧장 잡아서 얼굴 컷에서 대사까지 1초 안에 이어지게 했다.
    {
      do: (stage) => faceIdle(stage.player, 'player', 'right'),
      camera: {x: 6, y: 6, zoom: 2},
      hold: 700,
    },
    {who: '추종자들', text: '저 녀석 명찰을 봐. 개발자야!!'},
    {who: '추종자들', text: '나는 편하게 개발하고 싶어. HTML로 프로그래밍을 할거라구...!!!!'},
  ];
}

// 엔딩 1) 비밀공간. 쓰러진 흑막을 추종자들이 둘러싸고, HTML의 신이 강림한다.
//
// 엔딩은 장소가 둘(비밀공간 → 사무실)이라 컷신도 둘로 나눈다.
// 여기서 화면을 하얗게 덮은 채 사무실로 넘기고, 사무실 쪽이 그 흰 화면을 이어받는다.
export function endingSecret() {
  const mob = [];

  // 쓰러진 흑막을 둘러싸는 추종자들. 전투용 적이 아니라 그림이다.
  const gather = (stage) => {
    if (mob.length) return;
    const boss = stage.boss;
    [-72, -40, 40, 72].forEach((dx, i) => {
      const sprite = stage.add
        .image(boss.x + dx, boss.y + (i % 2 ? 22 : 44), 'follower-up-0')
        .setOrigin(0.5, 1)
        .setDepth(boss.y + (i % 2 ? 22 : 44));
      mob.push(sprite);
    });
  };

  // 얻어맞는 흑막. 추종자들이 달려들며 흔들린다.
  const beatUp = (stage, director) => {
    mob.forEach((m, i) => {
      director.time.delayedCall(i * 120, () => {
        if (!m.active) return;
        stage.tweens.add({targets: m, x: m.x + (m.x < stage.boss.x ? 14 : -14), duration: 140, yoyo: true, repeat: 3});
      });
    });
    stage.cameras.main.shake(900, 0.004);
  };

  // 하늘에서 빛과 함께 내려온다.
  // 무리 위에 떠 있어야 '내려다보는' 그림이 된다. 바닥에 세우면
  // 흑막·추종자와 뒤엉켜 그냥 덩치 큰 등장인물이 하나 더 늘어난 것처럼 보인다.
  const descend = (stage, director) => {
    if (stage.god) return;
    const restY = stage.boss.y - 96;

    const god = stage.add
      .image(stage.boss.x, restY - 220, 'god')
      .setOrigin(0.5, 1)
      .setScale(2)
      .setDepth(restY) // 다른 것들처럼 y를 깊이로 쓴다 — 무리보다 뒤에 선다
      .setAlpha(0);
    stage.god = god;

    // 천장에서 내려꽂히는 빛기둥. 그 안에서 모습이 드러난다.
    const beam = stage.add
      .rectangle(god.x, restY, 130, restY, 0xffd8a8, 0)
      .setOrigin(0.5, 1)
      .setDepth(restY - 1)
      .setBlendMode(Phaser.BlendModes.ADD);

    stage.tweens.add({targets: beam, alpha: 0.45, duration: 700, yoyo: true, repeat: -1});
    stage.tweens.add({targets: god, alpha: 1, y: restY, duration: 1600, ease: 'Cubic.easeOut'});
    director.time.delayedCall(400, () => stage.cameras.main.shake(600, 0.003));
  };

  return [
    // 힘에 부쳐 보이는 흑막과 추종자들
    {
      do: (stage) => gather(stage),
      camera: {x: 12, y: 9, zoom: 2.2},
      hold: 2000,
    },
    {who: '추종자들', text: '저희에게도 HTML로 프로그래밍할수있는 능력을 주십시오...!'},
    {who: '추종자들', text: '힘을 보태겠습니다...!'},

    // 당황한 김흑막
    {portrait: 'face-boss', who: '김흑막', text: '사..사실 나도 HTML로 프로그래밍하는법은 몰라...'},
    {portrait: 'face-boss', who: '김흑막', text: '다른언어로 프로그래밍하는 개발자를 없앨 수 만 있을뿐...'},

    // 놀라고 광분한 추종자들
    {portrait: 'face-follower', who: '추종자들', text: '우릴 속였어!!!!!'},
    {portrait: 'face-follower', who: '추종자들', text: '코노야로!!!!!!'},

    // 둘러싸고 두들긴다
    {
      do: (stage, director) => beatUp(stage, director),
      camera: {x: 12, y: 9, zoom: 2.6},
      hold: 2200,
    },

    // 하늘에서 빛이 내려오며 HTML의 신이 강림한다.
    // 신이 사람 두 배 크기라 줌을 빼야 발끝부터 머리까지 한 화면에 들어온다.
    {
      do: (stage, director) => descend(stage, director),
      camera: {x: 12, y: 6, zoom: 1.5},
      hold: 2600,
    },
    {
      who: 'HTML의 신',
      text: '사실은 너희처럼 개발을 쉽게하려는 녀석들에게 교훈을 주고 개발자들의 소중함을 알려주고 싶었다.',
    },
    {who: 'HTML의 신', text: 'HTML로는 프로그래밍을 못한다.'},

    // 몸에서 나온 빛이 화면을 하얗게 덮는다
    {
      do: (stage, director) => director.whiteout(1600),
      hold: 1900,
    },
  ];
}

// 엔딩 2) 사무실. 흰 화면에서 시작해 사라졌던 사람들이 돌아온다.
export function endingOffice() {
  const mates = [];

  const restore = (stage) => {
    if (mates.length) return;
    MATE_SEATS.forEach((seat, i) => {
      const sprite = stage.add
        .image(seat.x * TILE + TILE / 2, seat.y * TILE + TILE, `mate${i}-up-0`)
        .setOrigin(0.5, 1)
        .setDepth(seat.y * TILE + TILE);
      mates.push(sprite);
      appear(stage, sprite);
    });
  };

  return [
    // 빛이 걷히면 사무실이다. 씬이 새로 뜨면서 이미 검은 화면에서 밝아지므로
    // 여기서 막을 또 씌우면 하얘졌다 검어졌다 두 번 깜빡인다.
    {
      do: (stage) => {
        stage.player.body.reset(KIM_SEAT.x * TILE + TILE / 2, KIM_SEAT.y * TILE + TILE);
        faceIdle(stage.player, 'player', 'up');
      },
      camera: {x: 11, y: 8, zoom: 1.6},
      hold: 2000,
    },

    // 없어진 사람들이 뿅 하고 다시 나타난다
    {do: (stage) => restore(stage), hold: 1600},
    {who: '개발자들', text: '어라? 내가 뭐하고 있었더라?'},
    {who: '개발자들', text: '이거 누가 짠 코드야???? 아.. 나구나??'},

    // 화면이 까맣게
    {
      do: (stage, director) => director.blackout(true, 1200),
      hold: 1500,
    },
    {who: '사람들', text: '휴~ 개발자들이 있어서 안심이야~'},
    {who: '사람들', text: '이제 새로운 소프트웨어로 더 편리한 생활을 할 수 있겠어'},

    {title: 'theEnd();', hold: 3000},
    {title: '개발자가 없어진 세상에서\n개발자로 살아남기', hold: 6000},
  ];
}
