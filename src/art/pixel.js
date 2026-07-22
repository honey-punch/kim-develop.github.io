// 도트는 맵과 같은 방식으로 그린다. 글자 하나가 도트 하나고,
// 그 글자가 무슨 색인지는 팔레트가 정한다. '.'과 ' '는 투명이다.
//
// 그림은 16 눈금 위에서 그리고 텍스처를 구울 때 ART_SCALE배로 확대한다.
// 타일이 화면에서는 32px이지만 도트는 16 눈금으로 성글게 찍히므로
// 캐릭터와 배경이 같은 굵기의 픽셀을 갖는다. 스타듀밸리의 그 덩어리진 질감이
// 여기서 나온다. 32 눈금에 그대로 그리면 도트가 잘아져서 느낌이 죽는다.
export const ART_SCALE = 2;

// 팔레트 값은 색 하나(0xrrggbb)이거나 [색, 투명도] 쌍이다.
function resolve(value) {
  return Array.isArray(value) ? value : [value, 1];
}

function isBlank(ch) {
  return ch === '.' || ch === ' ';
}

// 글자표에 없는 글자가 섞이면 조용히 투명해져서 찾기 어렵다. 맵과 같은 이유로 즉시 알린다.
export function assertArt(art, palette, name) {
  const width = art[0]?.length ?? 0;

  art.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`${name} 도트 ${y}번째 줄 길이가 ${row.length}, 나머지는 ${width}`);
    }
    [...row].forEach((ch, x) => {
      if (!isBlank(ch) && palette[ch] === undefined) {
        throw new Error(`${name} 도트 (${x}, ${y})에 팔레트에 없는 글자 '${ch}'`);
      }
    });
  });
}

export function artSize(art) {
  return {width: art[0]?.length ?? 0, height: art.length};
}

// 같은 색이 가로로 이어지면 한 번에 칠한다. fillRect 호출 수가 도트 수만큼 늘지 않게.
export function drawArt(g, art, palette, ox = 0, oy = 0, scale = ART_SCALE) {
  art.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (isBlank(ch)) {
        x += 1;
        continue;
      }

      let run = 1;
      while (row[x + run] === ch) run += 1;

      const [color, alpha] = resolve(palette[ch]);
      g.fillStyle(color, alpha);
      g.fillRect(ox + x * scale, oy + y * scale, run * scale, scale);

      x += run;
    }
  });
}

// 아스키 아트 한 장을 텍스처로 굽는다.
export function bake(scene, key, art, palette, scale = ART_SCALE) {
  assertArt(art, palette, key);
  const {width, height} = artSize(art);

  const g = scene.make.graphics({x: 0, y: 0, add: false});
  drawArt(g, art, palette, 0, 0, scale);
  g.generateTexture(key, width * scale, height * scale);
  g.destroy();
}

// 여러 장을 가로로 이어 붙여 한 텍스처에 담는다. 타일셋이 이 방식으로 만들어진다.
export function bakeStrip(scene, key, arts, palette, scale = ART_SCALE) {
  const {width, height} = artSize(arts[0]);

  const g = scene.make.graphics({x: 0, y: 0, add: false});
  arts.forEach((art, i) => {
    assertArt(art, palette, `${key}#${i}`);
    drawArt(g, art, palette, i * width * scale, 0, scale);
  });
  g.generateTexture(key, width * arts.length * scale, height * scale);
  g.destroy();
}

// 몸통은 그대로 두고 다리만 갈아끼운다. 걷기 프레임을 통째로 다시 쓰지 않기 위한 것.
export function replaceRows(art, rows, at) {
  const next = [...art];
  rows.forEach((row, i) => {
    next[at + i] = row;
  });
  return next;
}

// 걸을 때 몸이 한 도트 내려앉는 반동. 다리만 바꾸는 것보다 이쪽이 훨씬 크게 먹힌다.
export function shiftDown(art, rows = 1) {
  const blank = ' '.repeat(art[0].length);
  return [...Array(rows).fill(blank), ...art.slice(0, art.length - rows)];
}
