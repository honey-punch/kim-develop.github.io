import {bake} from './pixel.js';

// HTML의 신. 48x100 눈금에 그려 2배로 구우면 96x200이 된다.
// 사람(16x32 → 32x64)과 같은 2배 배율이라 도트 굵기가 같고, 크기만 신답게 크다.
//
// 몸이 곧 HTML이다. 머리가 H, 몸통이 T, 골반이 M, 두 다리가 L 두 개.
// 팔은 어깨에서 바깥으로 부풀었다가 손끝에서 모이고( ) 모양), 발은 바깥으로
// 내려가며 벌어진다. 손끝은 다리 위쪽 1/4 언저리에 닿는다.
//
// 그리는 방식이 두 가지 문제를 푼다.
//   1. 몸과 글자를 각각 모아 뒀다가 마지막에 한꺼번에 칠한다. 획마다 테두리를
//      두르면 나중 획의 테두리가 앞 획의 속을 잘라 T·M·L의 밝은 속이 끊긴다.
//   2. 명암을 이웃한 칸으로 계산한다. 사각형마다 손으로 칠하면 휜 팔이나
//      비스듬한 발에는 입힐 수가 없다.
//
// 글자 옆의 강철은 따뜻한 색(1)으로 물들였다. 이게 있어야 주황색이
// '칠해진 무늬'가 아니라 몸에 '박혀 있는 조명'으로 보인다.
// prettier-ignore
const GOD = [
  '............oHHHHHHHHHHHHHHHHHHHHHHo............',
  '............oGGGGGGGGGGGGGGGGGGGGGko............',
  '............oGgg11111gggggg11111ggko............',
  '............oGgg1nnn1gggggg1nnn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nnn11111111nnn1ggko............',
  '............oGgg11111nnnnnn11111ggko............',
  '............oGgggggg1nNNNNn1ggggggko............',
  '............oGgg11111nnnnnn11111ggko............',
  '............oGgg1nnn11111111nnn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nNn1gggggg1nNn1ggko............',
  '............oGgg1nnn1gggggg1nnn1ggko............',
  '............oGgg11111gggggg11111ggko............',
  '............oGdddddddggggggdddddddko............',
  '............ommmmmmmmggggggmmmmmmmmo............',
  '.............ooooooooGggggkoooooooo.............',
  '....................oGggggko....................',
  '....................oGggggko....................',
  '......oooooooooooooooGggggkooooooooooooooo......',
  '.....oHHHHHHHHHHHHHHHggggggHHHHHHHHHHHHHHHo.....',
  '.....oGGGGGGGGGGGGGGGggggggGGGGGGGGGGGGGGko.....',
  '.....oGg11111111111111111111111111111111gko.....',
  '....ooGg1nnnnnnnnnnnnnnnnnnnnnnnnnnnnnn1gkoo....',
  '...oHHgg1nNNNNNNNNNNNNNNNNNNNNNNNNNNNNn1ggHHo...',
  '...oGGgg1nNNNNNNNNNNNNNNNNNNNNNNNNNNNNn1ggGko...',
  '...oGggg1nnnnnnnnnnnnNNNNNNnnnnnnnnnnnn1gggko...',
  '..oHgggg1111111111111nNNNNn1111111111111ggggHo..',
  '...oGggggggggggggggg1nNNNNn1gggggggggggggggko...',
  '...oGggddddddddddddd1nNNNNn1dddddddddddddggko...',
  '...oGggmmmmmmmmmmmmm1nNNNNn1mmmmmmmmmmmmmggko...',
  '..oHggkooooooooooooo1nNNNNn1oooooooooooooGggHo..',
  '..oGggko...........o1nNNNNn1o...........oGggko..',
  '..oGggko...........o1nNNNNn1o...........oGggko..',
  '..oGggko...........o1nNNNNn1o...........oGggko..',
  '..oGggmo...........o1nNNNNn1o...........omggko..',
  '.oHggko............o1nNNNNn1o............oGggHo.',
  '.oGggko............o1nNNNNn1o............oGggko.',
  '.oGggko............o1nNNNNn1o............oGggko.',
  '.oGggko............o1nNNNNn1o............oGggko.',
  '.oGggko............o1nNNNNn1o............oGggko.',
  '.oGggko............o1nNNNNn1o............oGggko.',
  '.oGggko............o1nNNNNn1o............oGggko.',
  'oHggggHo...........o1nnnnnn1o...........oHggggHo',
  'oGggggko...ooooooooo11111111ooooooooo...oGggggko',
  'oGggggko..oHHHHHHHHHggggggggHHHHHHHHHo..oGggggko',
  'oGggggko..oGG11111111gggggg11111111Gko..oGggggko',
  'oGggggko..oGg1nnnnnn11gggg11nnnnnn1gko..oGggggko',
  'omggggmo..oGg1nNNnNNn1gggg1nNNnNNn1gko..omggggmo',
  '.oGggko...oGg1nNn1nNn11gg11nNn1nNn1gko...oGggko.',
  '.oGggko...oGg1nNn1nNNn11g1nNNn1nNn1gko...oGggko.',
  '.oGggko...oGg1nNn11nNNn111nNn11nNn1gko...oGggko.',
  '.oGggko...oGg1nNn111nNn11nNNn11nNn1gko...oGggko.',
  '.oGggko...oGg1nNn1g1nNNnnNNn111nNn1gko...oGggko.',
  '.oGggko...oGg1nNn1g11nNNNNn11g1nNn1gko...oGggko.',
  '.omggko...oGg1nNn1gg1nNNNNn1gg1nNn1gko...oGggmo.',
  '..oGggHo..oGg1nNn1gg11nnnn11gg1nNn1gko..oHggko..',
  '..oGggko..oGg1nNn1ggg111111ggg1nNn1gko..oGggko..',
  '..oGggko..oGg1nNn1gggggggggggg1nNn1gko..oGggko..',
  '..oGggko..oGg1nNn1gggggggggggg1nNn1gko..oGggko..',
  '..omggko..oGg1nnn1gggggggggggg1nnn1gko..oGggmo..',
  '...oGggHo.oGd11111ggggddddgggg11111dko.oHggko...',
  '...oGggko.ommmmgggggggmmmmgggggggmmmmo.oGggko...',
  '...oGggko..ooooGgggggkooooGgggggkoooo..oGggko...',
  '...omggko.....oG11111ko..oG11111ko.....oGggmo...',
  '....oGggHo....oG1nnn1ko..oG1nnn1ko....oHggko....',
  '...ooGggkoo...oG1nNn1ko..oG1nNn1ko...ooGggkoo...',
  '..oHHddddHHo..oG1nNn1ko..oG1nNn1ko..oHHddddHHo..',
  '..oGGmmmmGko..oG1nNn1ko..oG1nNn1ko..oGGmmmmGko..',
  '..oGkooooGko..oG1nNn1ko..oG1nNn1ko..oGkooooGko..',
  '..oGko..oGko..oG1nNn1ko..oG1nNn1ko..oGko..oGko..',
  '..oGko..oGko..oG1nNn1ko..oG1nNn1ko..oGko..oGko..',
  '..oGko..oGko..oG1nNn1ko..oG1nNn1ko..oGko..oGko..',
  '..oGko..oGko..oG1nNn1ko..oG1nNn1ko..oGko..oGko..',
  '..ommo..ommo..oG1nNn1ko..oG1nNn1ko..ommo..ommo..',
  '...oo....oo...oG1nNn1ko..oG1nNn1ko...oo....oo...',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '..............oG1nNn1ko..oG1nNn1ko..............',
  '............oo111nNn1ko..oG1nNn111oo............',
  '...........oH11nnNNn1mo..om1nNNnn11Ho...........',
  '..........o111nNNnn1oo....oo1nnNNn111o..........',
  '........oo11nnNNn1oo........oo1nNNnn11oo........',
  '.......o11nnNNnn1o............o1nnNNnn11o.......',
  '......oH1nNNnn11o..............o11nnNNn1Ho......',
  '......om1nnn11oo................oo11nnn1mo......',
  '.......ooooooo....................ooooooo.......',
  '................................................',
];

const PALETTE = {
  o: 0x0e1712, // 외곽선. 검정이 아니라 몸 색을 어둡게 누른 것
  H: 0x62a87c, // 빛을 정면으로 받는 면
  G: 0x4d8a62, // 밝은 면
  g: 0x2f5c40, // 강철 기본
  d: 0x20402c, // 그늘
  k: 0x172e1f, // 깊은 그늘
  m: 0x101f16, // 가장 어두운 바닥면
  1: 0x6d7a45, // 조명 바로 옆. 초록에 노란기가 돈다
  n: 0xff8a1c, // 조명 가장자리
  N: 0xffe0b0, // 조명 속. 여기가 광원이다
};

export function bakeGod(scene) {
  bake(scene, 'god', GOD, PALETTE);
}
