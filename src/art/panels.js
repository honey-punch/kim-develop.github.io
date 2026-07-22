// 컷신의 넓은 배경 그림.
//
// 얼굴은 아스키 아트로 그리지만 배경은 그럴 수 없다. 화면을 채우려면
// 가로 640칸짜리 문자열을 손으로 써야 하기 때문이다. 그래서 배경만은
// 도형으로 그린다. 대신 좌표를 정수로만 찍고 2배로 확대해서,
// 도트 굵기는 게임의 타일과 똑같이 맞춘다.
//
// 하늘·건물·구름·번개를 한 장에 굽지 않고 따로 굽는다.
// 구름이 모여들고 번개가 치려면 각각 따로 움직여야 하기 때문이다.

const SKY_W = 640;
const SKY_H = 360;
export const PANEL_SCALE = 2;

// 건물이 서 있는 자리. 구름과 번개를 이 위로 모으려고 밖에서도 쓴다.
export const BUILDING = {x: 236, w: 168, top: 74};

function drawSky(g) {
  // 하늘. 위로 갈수록 어둡게 띠를 쌓는다.
  const bands = [0x11131f, 0x171a28, 0x1d2131, 0x24283a, 0x2b3043];
  bands.forEach((color, i) => {
    g.fillStyle(color);
    g.fillRect(0, i * 44, SKY_W, 44);
  });

  const {x: bx, w: bw} = BUILDING;

  // 건물 실루엣. 하늘보다 확실히 검어야 하늘을 등지고 선 것으로 보인다.
  g.fillStyle(0x05060a);
  g.fillRect(bx, 96, bw, SKY_H - 96);
  g.fillRect(bx + 52, BUILDING.top, 64, 24); // 옥상 구조물
  g.fillStyle(0x0b0d14);
  g.fillRect(bx + 4, 100, bw - 8, SKY_H - 100);

  // 창문. 대부분 꺼져 있고 몇 개만 붉게 살아 있다.
  const lit = new Set(['1,2', '3,0', '4,3', '6,1', '7,4', '9,2']);
  for (let row = 0; row < 12; row++) {
    for (let col = 0; col < 5; col++) {
      g.fillStyle(lit.has(`${row},${col}`) ? 0x8f3242 : 0x14161f);
      g.fillRect(bx + 20 + col * 28, 116 + row * 20, 16, 12);
    }
  }

  g.fillStyle(0x0a0b11);
  g.fillRect(0, 332, SKY_W, SKY_H - 332);
}

// 구름 한 덩어리. 네모를 겹쳐 쌓아 뭉게뭉게하게 만든다.
function drawCloud(g, w, h, color) {
  const r = (x, y, rw, rh) => g.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
  g.fillStyle(color);
  r(0, h * 0.4, w, h * 0.45);
  r(w * 0.12, h * 0.18, w * 0.4, h * 0.6);
  r(w * 0.48, h * 0.06, w * 0.34, h * 0.72);
  r(w * 0.04, h * 0.52, w * 0.92, h * 0.36);
  r(w * 0.68, h * 0.3, w * 0.26, h * 0.5);
}

const CLOUDS = [
  {key: 'panel-cloud-0', w: 200, h: 64, color: 0x0d0f18},
  {key: 'panel-cloud-1', w: 260, h: 76, color: 0x0a0c14},
  {key: 'panel-cloud-2', w: 180, h: 56, color: 0x121522},
];

// 지그재그로 내려오는 번개.
function drawBolt(g) {
  g.fillStyle(0xf2f6ff);
  [
    [26, 0, 10, 26],
    [18, 26, 10, 22],
    [24, 46, 12, 8],
    [14, 54, 10, 26],
    [20, 78, 10, 22],
    [12, 98, 10, 30],
  ].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
}

function bakeOne(scene, key, w, h, draw) {
  const g = scene.make.graphics({x: 0, y: 0, add: false});
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export function bakePanels(scene) {
  bakeOne(scene, 'panel-sky', SKY_W, SKY_H, drawSky);
  bakeOne(scene, 'panel-bolt', 48, 128, drawBolt);
  CLOUDS.forEach(({key, w, h, color}) => bakeOne(scene, key, w, h, (g) => drawCloud(g, w, h, color)));
}

export const CLOUD_KEYS = CLOUDS.map((c) => c.key);
